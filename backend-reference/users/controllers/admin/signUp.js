const {
  Update,
  find,
  findUsername,
  findByAnyField,
  signUpCount,
  findCorporateUserByEmail,
  findCorporateByAnyField,
  findCorporateForAccountLink,
} = require("../../models/use-cases/signUp");
const {
  findAllPasswordPolicies,
} = require("../../models/use-cases/passwordPolicy");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { sendSMS } = require("../../utils/sms");
const { sendWhatsAppOtp } = require("../../utils/whatsApp");
const { CASHFREE_VERIFICATION_ACCESS_KEY } = require("../../utils/constants");
const async = require("async");
const corporateUser = require("../../models/entities/corporateUser");
const kybVerifications = require("../../models/entities/kybVerification");

const {
  verifyOtp,
  createOtp: createOtpV2,
} = require("../../models/use-cases/otp");
const { validateEmailTemplate } = require("../../utils/templatesForEmails");

const axios = require("axios");

const emailer = require("../../utils/emailer");
let uuid = "10000000";
const crypto = require("crypto");
const CryptoJS = require("crypto-js");

const { Op } = require("sequelize");
const { findOneReferalCode } = require("../../models/use-cases/referral_codes");
const wallet = require("../../models/entities/wallet");
const {
  updateSignUpActivity,
  createSignUpActivity,
} = require("../../models/use-cases/signUpActivityLog");
const signJwt = require("../../utils/jwtToken");
const { v4 } = require("uuid");
const {
  findPartnerPermissionsForSession,
} = require("../../models/use-cases/partnerPermission");
const { gatedPartnerServices } = require("../../models/use-cases/serviceApproval");
const { setValue } = require("../../utils/cacheDataMethods");
const { updateCredentials, findOneCredential } = require("../../models/use-cases/credential");
const Credential = require("../../models/entities/credential");

const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { findOne: findOneCorporate, updateCorporate } = require("../../models/use-cases/corporateUser");
const { findOneSubCorporateByCredentialId } = require("../../models/use-cases/subCorporateUser");
const { findOauthProviderDetails } = require("../../models/use-cases/oauth_providers");
const generateUniqueUsername = require("../../services/usernameGenerator");
const GenericResponse = require("../../utils/dynamicResponse");
const { splitPhoneNumber } = require("../../utils/commonHelpers");
const {
  signUpOTPRequestTemplate,
  otpBlockHtml,
} = require("../../utils/emailTemplate/signUp");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../../utils/emailTemplate/sharedLayout");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS } = require("../../utils/emailTemplateKeys");
const {
  setPasswordUrlTemplate,
} = require("../../utils/emailTemplate/password");
const {
  checkBannedPassword,
  validatePasswordPolicy,
} = require("../../utils/passwordPolicy");
const { customLog } = require("../../utils/loggerHelper");
const { findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const { createPrivacyPolicyAcceptance, checkAllPoliciesAccepted } = require("../../models/use-cases/privacyPolicy");
// const { findOneSubCorporateByCredentialId } = require("../../models/use-cases/subCorporateUser");
const { assignReferralCredits } = require("../../models/use-cases/userCoupons");

const NODE_ENV = process.env.NODE_ENV;
const PRODUCTION_URL = process.env.FRONTEND_PRODUCTION_URL;
const STAGING_URL = process.env.FRONTEND_STAGING_URL;
const FRONTEND_BASE_URL = NODE_ENV === "production" ? PRODUCTION_URL : STAGING_URL;

function getUuid(i) {
  return uuid.substring(0, uuid.length - (i.length - 1)) + i;
}

const SIGNUP_OTP_SUBJECT = "One-time password (OTP) for account verification";

// The sign-up OTP email, from the admin-managed template when one is published and
// from utils/emailTemplate/signUp.js otherwise. The digit boxes and the
// header/footer are rendered here because a stored template cannot build them:
// it carries ${otpHtml}, ${headerHtml} and ${footerHtml} slots instead.
const sendSignUpOtpEmail = async ({ email, name, otp, title, partnerData, partnerId = null, logTraceId = null }) => {
  const { subject, html, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.SIGNUP_OTP,
    partnerId,
    variables: {
      title,
      branding: partnerData?.branding || 'Peko',
      otpHtml: otpBlockHtml(otp),
      ...v2LayoutVariables({
        website: partnerData?.baseUrl || 'https://in.peko.one',
        logo: partnerData?.logo,
        branding: partnerData?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: SIGNUP_OTP_SUBJECT,
    fallback: () => signUpOTPRequestTemplate(name, otp, title, partnerData),
    logTraceId,
  });

  await emailer.email(email, subject, html, undefined, sender);
};

// The signup body is spread into credential.create / corporateUser.create, so any column named here would be
// self-assignable by a registrant. These are set only by verification, admin or login flows — never at signup.
const SIGNUP_PROTECTED_FIELDS = [
  "id", "uuid", "role", "credentialId", "packageId", "subPartnerId", "subRoles",
  "kycStatus", "kycRemarks", "isActive", "essAccess",
  "panNumber", "gstNumber", "cinNumber", "panVerified", "gstVerified", "cinVerified",
  "mobileVerified", "emailVerified",
  "isMFA", "sendMfaCodeToEmail", "sendMfaCodeToPhone", "sendMfaCodeToAuthApp", "totpSecret",
  "passwordProtection", "isAutoLogin", "enforcePrivacyPolicy",
  "passwordResetToken", "passwordResetExpires", "loginAttempts", "lockPeriod", "firstLoginAttempt",
  "passwordDate", "lastLogin", "botSignUp", "isPendingBotSignup", "signUpSource",
];

exports.register = asyncHandler(async (req, res, next) => {
  SIGNUP_PROTECTED_FIELDS.forEach((field) => delete req.body[field]);
  let data = req.body;
  if (data?.email) {
    data.email = data?.email?.toLowerCase();
  }

  // NEW_COMPANY / FREELANCER don't send a company name — fall back to contact person name.
  if (!data.name) {
    data.name = data.contactPersonName;
  }

  //user-agent
  const source = req.useragent;

  let count = await signUpCount();
  data.botSignUp = false; //set this flag on the basic of autoPasswordGeneration value e.g signup via whatsapp bot we are autogenrating password
  if (data.autoPasswordGeneration || data.autoPasswordGeneration == "true") {
    data.botSignUp = true;
    data.isPendingBotSignup = true;
    data.password = generateRandomString(32);
    delete data.autoPasswordGeneration;
  }

  count++;
  let username = getUuid(count.toString());
  //checks whether username is already taken or not
  let isUsernameAvailable = await findUsername(username);
  while (isUsernameAvailable && isUsernameAvailable.username === username) {
    // If the generated username is already taken, generate a new one
    count++;
    username = getUuid(count.toString());
    isUsernameAvailable = await findUsername(username);
  }
  data.username = username;
  // data.address = data.sector;

  let isEmailAvailable = await find(data);
  if (isEmailAvailable) {
    return next(
      new ErrorResponse(
        `The email or mobile number is already associated with another account.`,
        403
      )
    );
  }

  const {
    phoneOtp,
    emailOtp,
    mobileNo,
    email,
    scope,
    countryCode,
    referralCode,
  } = data;

  //validate referral code
   let userAvailable, isReferralCodeAvailable;
  if (referralCode) {

    userAvailable = await findUsername(referralCode);

    if (!userAvailable) {
      isReferralCodeAvailable = await findOneReferalCode(referralCode, data?.registeredBy, ['id'])
      if (!isReferralCodeAvailable) {
        return next(new ErrorResponse('The referral code you entered isn’t valid. Please check and try again.', 400));
      }
    }
  }

  if (scope == "both") {
    let emailOtpResponse = await verifyOtp({
      contact: email,
      otp: emailOtp,
      context: "email",
    });
    if (emailOtpResponse.isVerified === false) {
      return next(new ErrorResponse(emailOtpResponse.message, 401));
    }
    let mobileOtpResponse = await verifyOtp({
      contact: mobileNo,
      otp: phoneOtp,
      context: "mobile",
    });
    if (mobileOtpResponse.isVerified === false) {
      return next(new ErrorResponse(mobileOtpResponse.message, 401));
    }
  }

  if (scope == "email") {
    let emailOtpResponse = await verifyOtp({
      contact: email,
      otp: emailOtp,
      context: "email",
    });
    if (emailOtpResponse.isVerified === false) {
      return next(new ErrorResponse(emailOtpResponse.message, 401));
    }
  }

  if (scope == "mobile") {
    let mobileOtpResponse = await verifyOtp({
      contact: `${countryCode}${mobileNo}`,
      otp: phoneOtp,
      context: "mobile",
    });
    if (mobileOtpResponse.isVerified === false) {
      return next(new ErrorResponse(mobileOtpResponse.message, 401));
    }
  }

  let params = {};
  data.passwordHistory = {
    currentPassword: "",
    previousPasswords: [],
  };

  if (data.botSignUp) {
    source.isBot = true;
  }
  data.signUpSource = source;
  let { user, details } = await Update(params, data, req);
  if (!user) {
    return next(
      new ErrorResponse(`An error occurred while registering the user`, 500)
    );
  }

  // privacy policy acceptance flow

  if (!data.botSignUp && data.policyIds && typeof data.policyIds === 'object' && !Array.isArray(data.policyIds) && Object.keys(data.policyIds).length > 0) {
    await createPrivacyPolicyAcceptance({
      credentialId: details.id,
      policyIds: data.policyIds,
      ipAddress: req.ip,
      userAgent: source?.source || req.headers["user-agent"]
    });
  }

  if (data.botSignUp) {
    const USERID = details.username;
    const userData = details;
    let emailId = userData["email"];

    const token = await new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        resolve(buf.toString("hex"));
      });
    });

    const agentUpdate = {
      passwordResetToken: token,
      passwordResetExpires: Date.now() + 3600000, // 1 hour
    };

    const partnerDetails = await fetchPartnerDetails(data?.registeredBy);
    const baseUrl = partnerDetails?.baseUrl;

    const url = `${baseUrl}/set-password?token=${token}&username=${userData.username}&isForgot=false`;

    const partnerData = await fetchPartnerDetails(userData?.registeredBy)

    const { subject: setPasswordSubject, html: emailBody, sender: setPasswordSender } = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.SET_PASSWORD,
      partnerId: userData?.registeredBy || null,
      variables: {
        name: userData?.name,
        url,
        branding: partnerData?.branding || 'Peko',
        signupIntro: 'Thank you for signing up via WhatsApp. ',
        ...v2LayoutVariables({
          website: partnerData?.baseUrl || 'https://in.peko.one',
          logo: partnerData?.logo,
          branding: partnerData?.branding || 'Peko',
          socials: PEKO_SOCIAL_LINKS,
        }),
      },
      fallbackSubject: "Welcome to Peko! Complete your account registration.",
      fallback: () => setPasswordUrlTemplate(userData, url, partnerData, false),
      logTraceId: req?.LogTraceId,
    });

    await Credential.update(agentUpdate, {
      where: { username: USERID },
    });

    emailer.email(
      emailId,
      setPasswordSubject,
      emailBody,
      undefined,
      setPasswordSender
    );

    return res.status(200).json({
      status: true,
      message: "Registration Successful.",
      data: user,
      responseCode: "000",
    });
  }

  if (user?.referralCode && isReferralCodeAvailable) {
    const referralId = isReferralCodeAvailable?.id;

    //  Assign referral-based Peko credits
    await assignReferralCredits(user.id, referralId, user.registeredBy);
    // const { serviceRule, serviceOperatorIds } = isReferralCodeAvailable;

    // if (serviceRule === 'disable_service' && Array.isArray(serviceOperatorIds) && serviceOperatorIds.length > 0) {
    //   await bulkCreate({ serviceOperatorIds, userId: details?.id });
    // }

  }

  let corporateDetails = {
    username: details.username,
    role: details.role,
    id: details.id,
    acs_user_id: data.acs_user_id,
    corporateId: user.id,
  };

  const walletDetails = await wallet.findOne({
    where: {
      credentialId: details.id,
    },
    attributes: ["balance"],
  });

  customLog(req?.LogTraceId, "info", {
    message: "Updating signup activity status to COMPLETED in register endpoint",
    email,
    timestamp: new Date().toISOString()
  });

  await updateSignUpActivity(
    { email },
    {
      isMobileOTPValidated: true,
      status: "COMPLETED",
    }
  );

  customLog(req?.LogTraceId, "info", {
    message: "Successfully updated signup activity status to COMPLETED",
    email,
    timestamp: new Date().toISOString()
  });

  await loginUser(
    corporateDetails,
    details,
    user,
    walletDetails,
    req,
    res,
    next
  );
});

async function loginUser(
  corporateUserDetails,
  loginUserDetails,
  userProfileDetails,
  walletDetails,
  req,
  res,
  next
) {
  try {
    const userId = loginUserDetails.id;
    const token = await signJwt.signToken(corporateUserDetails);
    const refreshToken = await signJwt.signRefreshToken(corporateUserDetails);
    let sessionId = v4();

    //function for fetching the expiry time of redis tokens based on env ACCESS_TOKEN and REFRESH_TOKEN
    const expiryCalculationFn = (expiry) => {
      const match = expiry.match(/^(\d+)([smhd])$/); // Regex to extract value and unit
      if (!match) {
        throw new Error(`Invalid expiry format: ${expiry}`);
      }

      const value = parseInt(match[1], 10); // Numeric part
      const unit = match[2]; // Unit part (s, m, h, d)

      // Convert to seconds
      switch (unit) {
        case "s":
          return value; // seconds
        case "m":
          return value * 60; // minutes
        case "h":
          return value * 60 * 60; // hours
        case "d":
          return value * 60 * 60 * 24; // days
        default:
          throw new Error(`Unsupported time unit: ${unit}`);
      }
    };

    const permissionDetails = await findPartnerPermissionsForSession({
      registeredBy: loginUserDetails?.registeredBy,
      referralCode: userProfileDetails?.referralCode,
    });
   
     const policyAccepted = await checkAllPoliciesAccepted({
      credentialId: loginUserDetails.id,
    });

    let privacyPolicyAccepted = !!policyAccepted;

    let userSessionData = await fetchUserData(
      loginUserDetails,
      userProfileDetails,
      walletDetails,
      permissionDetails,
      privacyPolicyAccepted
    );

    let accessTokenExpiry, refreshTokenExpiry;
    accessTokenExpiry = corporateUserDetails?.autoLogin
      ? expiryCalculationFn(process.env.AUTO_LOGIN_ACCESS_TOKEN_EXPIRY)
      : expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY);

    // Determine refreshTokenExpiry
    refreshTokenExpiry = corporateUserDetails?.autoLogin
      ? expiryCalculationFn(process.env.AUTO_LOGIN_REFRESH_TOKEN_EXPIRY)
      : expiryCalculationFn(process.env.REFRESH_TOKEN_EXPIRY);

    await setValue(`token_${userId}_${sessionId}`, accessTokenExpiry, token);
    await setValue(
      `refreshToken_${userId}_${sessionId}`,
      refreshTokenExpiry,
      refreshToken
    );
    await setValue(
      `userData_${userId}_${sessionId}`,
      accessTokenExpiry,
      JSON.stringify(userSessionData)
    );

    let roleName;
    if (corporateUserDetails.role === "CORPORATE") {
      roleName = "corporate";
    } else if (
      corporateUserDetails.role === "SYSTEM_USER" &&
      corporateUserDetails.username === "pekopayments"
    ) {
      roleName = "admin";
    } else if (
      corporateUserDetails.role === "SYSTEM_USER" &&
      corporateUserDetails.username === "ecommanager"
    ) {
      roleName = "ecom_manager";
    }

    let { role, id, username, corporateId } = corporateUserDetails;
    await updateCredentials(id, { lastLogin: Date.now() });
    return res.status(200).json({
      status: true,
      message: "Login successful",
      data: {
        token,
        refreshToken,
        role: role.toLowerCase(),
        roleName,
        id,
        username,
        sessionId,
        corporateId,
      },
      responseCode: "000",
    });
  } catch (err) {
    return next(
      new ErrorResponse(`Something went wrong, Please try again later`, 500)
    );
  }
}

//@desc         Create and send OTP to user to verify Mobile Number
//@route        POST /system/registration/getOtp
//@access       Public
exports.getOtp = asyncHandler(async (req, res, next) => {
  let data = req.body;
  let {
    email,
    // mobileNo,
    // panNumber,
    // gstNumber,
    name,
    password,
    scope,
    partnerId,
    registeredBy,
  } = req.body;

  if (email) {
    email = email.toLowerCase();
  }

  if (password) {
    try {
      await checkBannedPassword(password);
      await validatePasswordPolicy(password);
    } catch (error) {
      return next(new ErrorResponse(error.message, 400));
    }
  }

  //step -1 check if mobile and email etc.. are already in db
  console.log("getOtp registeredBy:", registeredBy, "partnerId:", partnerId);
  const fieldsToCheck = [
    {
      fieldName: "email",
      value: email,
      errorMessage: "Email ID is already associated with another account",
    },
    // { fieldName: 'mobileNo', value: mobileNo, errorMessage: 'Mobile number is already associated with another account' },
    // { fieldName: 'panNumber', value: panNumber, errorMessage: 'Pan number is already associated with another account' },
    // { fieldName: 'gstNumber', value: gstNumber, errorMessage: 'GST number is already associated with another account' },
  ];
  const fieldExists = await Promise.all(
    fieldsToCheck.map((field) =>
      findByAnyField({ [field.fieldName]: field.value, registeredBy: registeredBy || partnerId || null })
    )
  );
  for (let i = 0; i < fieldsToCheck.length; i++) {
    if (fieldExists[i]) {
      return next(new ErrorResponse(fieldsToCheck[i].errorMessage, 403));
    }
  }
  //avoiding step 2 because if scope ==mobile and email- it is for resending otp

  // if (scope !== 'mobile' && scope !== 'email') {
  //     //step -2 validate the gst number and check the pan number user entered is same as per gst records
  //     let result = await getGstDetails(gstNumber)
  //     console.log({ result })
  //     if (!result.status) {
  //         return next(new ErrorResponse(result.message, 200))
  //     }
  //     const { gstDetails: { pan, principal_address } } = result;
  //     let { email: gstEmail, mobile: gstMobileNumber } = principal_address
  //     gstMobile = gstMobileNumber
  //     if (pan !== panNumber) {
  //         return next(new ErrorResponse('The PAN you entered does not match the PAN registered with GST. Please verify your PAN and try again.', 200))
  //     }
  // }

  //step -3 create otp and send
  let partnerData;
  partnerData = await fetchPartnerDetails(partnerId);
  if (scope === "both") {
    let phoneOtp = await createOtpV2({ contact: data.mobileNo });
    if (!phoneOtp) {
      return next(
        new ErrorResponse(`Something went wrong while creating the OTP`, 400)
      );
    }
    let emailOtp = await createOtpV2({ contact: data.email });
    if (!emailOtp) {
      return next(
        new ErrorResponse(`Something went wrong while creating the OTP`, 400)
      );
    }

    // Sending SMS
    await sendSMS(
      data.mobileNo,
      `Welcome to ${partnerData?.branding}. Your requested one-time password is: ${phoneOtp}`
    );
    const title = "Verify your account!";
    await sendSignUpOtpEmail({ email, name, otp: emailOtp, title, partnerData, partnerId, logTraceId: req?.LogTraceId });


    customLog(req?.LogTraceId, "info", {
      message: "Updating signup activity - isPasswordCreated",
      email,
      mobileNo: data?.mobileNo,
      timestamp: new Date().toISOString()
    });

    await updateSignUpActivity(
      { email, mobileNo: data?.mobileNo },
      {
        isPasswordCreated: true,
      }
    );

    customLog(req?.LogTraceId, "info", {
      message: "Updated signup activity - isPasswordCreated successfully",
      email,
      timestamp: new Date().toISOString()
    });

    if (process.env.NODE_ENV === "staging") {
      return res.status(200).json({
        status: true,
        message: "Email and mobile OTPs have been sent successfully.",
        data: process.env.NODE_ENV === "staging" ? { phoneOtp } : {},
        responseCode: "000",
      });
    }
    //ADD OTP RESPONSE
    return res.status(200).json({
      status: true,
      message: "Email and mobile OTPs have been sent successfully.",
      data: process.env.NODE_ENV !== "production" ? { emailOtp } : {},
      responseCode: "000",
    });
  } else if (scope === "email") {
    let emailOtp = await createOtpV2({ contact: data.email });
    if (!emailOtp) {
      return next(
        new ErrorResponse(`Something went wrong while creating the OTP`, 500)
      );
    }
    const title = "Verify your account!";
    //Sending Email with otp
    await sendSignUpOtpEmail({ email, name, otp: emailOtp, title, partnerData, partnerId, logTraceId: req?.LogTraceId });

    // Sending Email with OTP

    customLog(req?.LogTraceId, "info", {
      message: "Updating signup activity for email scope - isPasswordCreated",
      email,
      timestamp: new Date().toISOString()
    });

    await updateSignUpActivity(
      { email },
      {
        isPasswordCreated: true,
      }
    );

    customLog(req?.LogTraceId, "info", {
      message: "Updated signup activity for email scope - isPasswordCreated successfully",
      email,
      timestamp: new Date().toISOString()
    });
    //ADD OTP RESPONSE
    return res.status(200).json({
      status: true,
      message: "Email OTP has been sent successfully.",
      data: process.env.NODE_ENV !== "production" ? { emailOtp } : {},
      responseCode: "000",
    });
  } else if (scope === "mobile") {
    // Send OTP to mobile only
    let phoneOtp = await createOtpV2({ contact: data.mobileNo });
    if (!phoneOtp) {
      return next(
        new ErrorResponse(`Something went wrong while creating the OTP`, 500)
      );
    }
    if (data.channel === "whatsapp") {
      await sendWhatsAppOtp(data.mobileNo, phoneOtp, name);
    } else {
      await sendSMS(
        data.mobileNo,
        "Welcome to Peko. Your requested one-time password is: " + phoneOtp
      );
    }

    customLog(req?.LogTraceId, "info", {
      message: "Updating signup activity for mobile scope - isPasswordCreated",
      mobileNo: data?.mobileNo,
      timestamp: new Date().toISOString()
    });

    await updateSignUpActivity(
      { mobileNo: data?.mobileNo },
      {
        isPasswordCreated: true,
      }
    );

    customLog(req?.LogTraceId, "info", {
      message: "Updated signup activity for mobile scope - isPasswordCreated successfully",
      mobileNo: data?.mobileNo,
      timestamp: new Date().toISOString()
    });
    if (process.env.NODE_ENV === "staging") {
      return res.status(200).json({
        status: true,
        message: "Mobile OTP has been sent successfully.",
        data: process.env.NODE_ENV === "staging" ? { phoneOtp } : {},
        responseCode: "000",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Mobile OTP has been sent successfully.",
      data: {},
      responseCode: "000",
    });
  } else if (scope === "gst") {
    // let gstOtp = await createOtpV2({ contact: gstNumber })
    // if (!gstOtp) {
    //     return next(new ErrorResponse(`Something went wrong while creating the OTP`, 500));
    // }
    // sms.sendSMS(gstMobile, "Welcome to Peko. Your requested one-time password for GST number verification is: " + gstOtp);
    // console.table({ gstOtp })
    return res.status(200).json({
      status: true,
      message: "GST Mobile OTP has been sent successfully.",
      data: {},
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(`No email or mobile number provided`, 400));
  }
});

exports.verifyOtp = asyncHandler(async (req, res, next) => {
  const { phoneOtp, emailOtp, mobileNo, email, partnerId } = req.body;
  let partnerData;
  partnerData = await fetchPartnerDetails(partnerId);
  const scope = "email";
  if (scope == "both") {
    let emailOtpResponse = await verifyOtp({
      contact: email,
      otp: emailOtp,
      context: "email",
    });
    if (emailOtpResponse.isVerified === false) {
      return next(new ErrorResponse(emailOtpResponse.message, 401));
    }
    let mobileOtpResponse = await verifyOtp({
      contact: mobileNo,
      otp: phoneOtp,
      context: "mobile",
    });
    if (mobileOtpResponse.isVerified === false) {
      return next(new ErrorResponse(mobileOtpResponse.message, 401));
    }
  }

  if (scope == "email") {
    let emailOtpResponse = await verifyOtp({
      contact: email,
      otp: emailOtp,
      context: "email",
    });
    if (emailOtpResponse.isVerified === false) {
      return next(new ErrorResponse(emailOtpResponse.message, 401));
    }
  }

  if (scope == "mobile") {
    let mobileOtpResponse = await verifyOtp({
      contact: mobileNo,
      otp: phoneOtp,
      context: "mobile",
    });
    if (mobileOtpResponse.isVerified === false) {
      return next(new ErrorResponse(mobileOtpResponse.message, 401));
    }
  }

  customLog(req?.LogTraceId, "info", {
    message: "Updating signup activity - isEmailOTPValidated in verifyOtp endpoint",
    email,
    timestamp: new Date().toISOString()
  });

  await updateSignUpActivity(
    { email },
    {
      isEmailOTPValidated: true,
    }
  );

  customLog(req?.LogTraceId, "info", {
    message: "Successfully updated signup activity - isEmailOTPValidated",
    email,
    timestamp: new Date().toISOString()
  });

  const sendMobileEmail = await getOtpForMobile(mobileNo);

  return sendMobileEmail;

  async function getOtpForMobile(mobileNo) {
    // const fieldsToCheck = [
    //   { fieldName: "mobileNo", value: mobileNo, errorMessage: "Mobile number is already associated with another account" },
    // ];
    // const fieldExists = await Promise.all(fieldsToCheck.map((field) => findByAnyField({ [field.fieldName]: field.value })));
    // for (let i = 0; i < fieldsToCheck.length; i++) {
    //   if (fieldExists[i]) {
    //     return next(new ErrorResponse(fieldsToCheck[i].errorMessage, 403));
    //   }
    // }

    let phoneOtp = await createOtpV2({ contact: mobileNo });
    if (!phoneOtp) {
      return next(
        new ErrorResponse(`Something went wrong while creating the OTP`, 500)
      );
    }
    await sendSMS(
      mobileNo,
      `Welcome to ${partnerData?.branding}. Your requested one-time password is: ${phoneOtp}`
    );

    if (process.env.NODE_ENV === "staging") {
      return res.status(200).json({
        status: true,
        message: "Mobile OTP has been sent successfully.",
        data: process.env.NODE_ENV === "staging" ? { phoneOtp } : {},
        responseCode: "000",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Mobile OTP has been sent successfully.",
      data: {},
      responseCode: "000",
    });
  }
});

//@desc         RESEND THE EMAIL TO THE USER FOR CREATING NEW PASSWORD
//@route        PUT /system/admin/signUp/resendPasswordResetEmail/:id
//@access       Private

exports.validateEmailAndMobile = asyncHandler(async (req, res, next) => {
  let { email, referralCode, registeredBy } = req.body;

  //step -1 check if mobile and email etc.. are already in db
  const fieldsToCheck = [
    {
      fieldName: "email",
      value: email,
      errorMessage: "Email ID is already associated with another account",
    },
    // { fieldName: 'mobileNo', value: mobileNo, errorMessage: 'Mobile number is already associated with another account' },
    // { fieldName: 'panNumber', value: panNumber, errorMessage: 'Pan number is already associated with another account' },
    // { fieldName: 'gstNumber', value: gstNumber, errorMessage: 'GST number is already associated with another account' },
  ];
  const fieldExists = await Promise.all(
    fieldsToCheck.map((field) =>
      findByAnyField({ [field.fieldName]: field.value, registeredBy: registeredBy || null })
    )
  );
  for (let i = 0; i < fieldsToCheck.length; i++) {
    if (fieldExists[i]) {
      return next(new ErrorResponse(fieldsToCheck[i].errorMessage, 403));
    }
  }

  //validate referral code
   let userAvailable, isReferralCodeAvailable;
  if (referralCode) {

    userAvailable = await findUsername(referralCode);

    if (!userAvailable) {
      isReferralCodeAvailable = await findOneReferalCode(referralCode, req.body.registeredBy, ['id'])
      if (!isReferralCodeAvailable) {
        return next(new ErrorResponse('The referral code you entered isn’t valid. Please check and try again.', 400));
      }
    }
  }

  const passwordPolicy = await findAllPasswordPolicies();

  const defaultPasswordPolicy = {
    id: 0,
    level: 1,
    minLength: 8,
    minPasswordAge: 0,
    maxPasswordAge: 100000000,
    minChangeChars: 3,
    prohibitPasswordReuse: true,
    prohibitPasswordReuseTimes: 2,
    maxInvalidLoginAttempts: 3,
    lockEffectivePeriod: 2,
    lockoutTimespan: 4,
    enableBannedPasswords: true,
    customBannedPasswords: "REDACTED",
    preventPersonalDataInPassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  //signUp activity
  let updateData = {
    email,
    mobileNo: req.body.mobileNo,
    contactPersonName: req.body.contactPersonName,
    companyName: req.body.name,
    referralCode: req.body.referralCode,
  };

  if (req.body.registeredBy) {
    updateData.partnerId = req.body.registeredBy;
  }

  customLog(req?.LogTraceId, "info", {
    message: "Starting createSignUpActivity in validateEmailAndMobile",
    updateData: JSON.stringify(updateData),
    timestamp: new Date().toISOString()
  });

  const createdActivity = await createSignUpActivity(updateData);

  if (createdActivity) {
    customLog(req?.LogTraceId, "info", {
      message: "Successfully created signup activity in validateEmailAndMobile",
      activityId: createdActivity?.id,
      email: createdActivity?.email,
      timestamp: new Date().toISOString()
    });
  } else {
    customLog(req?.LogTraceId, "info", {
      message: "createSignUpActivity returned null - signup activity was not created",
      updateData: JSON.stringify(updateData),
      timestamp: new Date().toISOString()
    });
  }

  if (!passwordPolicy || passwordPolicy.length === 0) {
    return res.status(200).json({
      status: true,
      message: "Default password policy applied",
      data: [defaultPasswordPolicy],
      responseCode: "000",
    });
  }

  return res.status(200).json({
    status: true,
    message: "Validation successfull",
    data: passwordPolicy,
    responseCode: "000",
  });
});

exports.validateEmail = asyncHandler(async (req, res, next) => {
  const { email, corporateId } = req.body;
  let subject = "Email Validation";

  let userData = await corporateUser.findOne({
    where: {
      id: corporateId,
    },
    attributes: ["id", "name", "companyName", "credentialId", "email"],
  });

  if (!userData || userData.length < 1) {
    return res.status(404).json({
      status: false,
      message: "Sorry User doesn't exist",
      data: {},
      responseCode: "001",
    });
  }

  if (userData?.email !== email) {
    return next(
      new ErrorResponse(
        `The email id you are provided is not matching with the registered email.`,
        400
      )
    );
  }

  const userDataWithoutCircularRefs = {
    id: userData.id,
    name: userData.name,
    companyName: userData.companyName,
    credentialId: userData.credentialId,
    email: email,
  };

  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 24);

  const secretKey = "REDACTED";
  const userDetailsString = JSON.stringify(userDataWithoutCircularRefs);

  const tokenPayload = {
    userData: userDetailsString,
    expiresAt: expirationTime.getTime(),
  };

  const tokenPayloadString = JSON.stringify(tokenPayload);

  const encryptedToken = CryptoJS.AES.encrypt(
    tokenPayloadString,
    secretKey
  ).toString();
  const baseUrl = NODE_ENV === "staging" ? STAGING_URL : PRODUCTION_URL;

  const url = `${baseUrl}/verify-email?token=${encryptedToken}`;

  let emailBody = validateEmailTemplate({ url });

  async.parallel(
    [
      function () {
        customLog(req?.LogTraceId, "info", { message: "Email Sent!!!!!" });
        // Sending Email
        emailer.email(email, subject, emailBody);
      },
    ],
    function (error) {
      customLog(req?.LogTraceId, "error", {
        message: error?.message,
        data: error?.response?.data,
      });
    }
  );

  return res.status(200).json({
    status: true,
    data: encryptedToken,
    message: "Email sent successfully",
    responseCode: "000",
  });
});

exports.confirmValidation = asyncHandler(async (req, res, next) => {
  const secretKey = "REDACTED";

  function decryptToken(token) {
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(token, secretKey);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) {
        throw new Error("Decrypted data is empty");
      }
      const userDetails = JSON.parse(decryptedData);
      return userDetails;
    } catch (error) {
      throw new Error("Error decrypting token");
    }
  }

  const token = req.body.token;

  let userDetails = decryptToken(token);

  if (!userDetails) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  const expirationTime = userDetails.expiresAt;
  const currentTime = new Date().getTime();

  if (expirationTime < currentTime) {
    return res.status(200).json({
      status: true,
      data: { linkExpired: true },
      message: "Link expired",
      responseCode: "000",
    });
  }

  const corporateId = userDetails.userData
    ? JSON.parse(userDetails.userData).id
    : null;

  const corporateDetails = await corporateUser.findOne({
    where: { id: corporateId },
  });
  if (!corporateDetails) {
    return next(new ErrorResponse("something went wrong"));
  } else {
    if (corporateDetails.emailVerified) {
      return res.status(200).json({
        status: true,
        data: { isEmailAlreadyVerified: true },
        message: "email already verified",
        responseCode: "000",
      });
    }
  }

  const isEmailExist = await corporateUser.findOne({
    where: {
      email: JSON.parse(userDetails.userData).email,
      id: { [Op.not]: corporateId },
    },
  });

  if (isEmailExist) {
    return next(new ErrorResponse("email is already exist"));
  }

  const updateStatus = await corporateUser.update(
    { emailVerified: true },
    {
      where: {
        id: corporateId,
      },
    }
  );

  if (updateStatus && updateStatus.length > 0 && updateStatus[0] === 1)
    if (updateStatus) {
      return res.status(200).json({
        status: true,
        data: { emailVerified: true },
        message: "email verified successfully",
        responseCode: "000",
      });
    } else {
      return res.status(200).json({
        status: true,
        data: { emailVerified: false },
        message: "something went wrong while verifying",
        responseCode: "001",
      });
    }
});

async function fetchUserData(userDetails, details, walletDetails, permissionDetails,privacyPolicyAccepted) {
  let data = {};

  data["id"] = userDetails ? userDetails["id"] : "";
  data["packageId"] = details ? details["packageId"] : 1;
  data["registeredBy"] = details ? details["registeredBy"] : 1;
  data["tradeLicenseExpiry"] = details ? details["tradeLicenseExpiry"] : "";
  data["kycStatus"] =
    details && details["kycStatus"] ? details["kycStatus"] : "Pending";
  data["logo"] = details && details["logo"] ? details["logo"].toString() : "";
  data["email"] = details && details["email"] ? details["email"] : "";
  data["corporateId"] = details && details["id"] ? details["id"] : "";
  data["productTour"] =
    details && details["productTour"] ? details["productTour"] : "";
  data["username"] =
    userDetails && userDetails["username"] ? userDetails["username"] : "";
  data["name"] = userDetails && userDetails["name"] ? userDetails["name"] : "";
  data["city"] = details && details["city"] ? details["city"] : "";
  data["state"] = details && details["state"] ? details["state"] : "";
  data["website"] = details && details["website"] ? details["website"] : "";
  data["country"] = details && details["country"] ? details["country"] : "";
  data["companyName"] =
    details && details["companyName"] ? details["companyName"] : "";
     // Privacy policy
  data["hasAcceptedPrivacyPolicy"] = !!privacyPolicyAccepted;
  data["mobileNo"] = details && details["mobileNo"] ? details["mobileNo"] : "";
  data["role"] = userDetails && userDetails["role"] ? userDetails["role"] : "";
  data["balance"] =
    walletDetails && walletDetails["balance"] ? walletDetails["balance"] : "";

  if (permissionDetails) data["partnerServices"] = await gatedPartnerServices(permissionDetails);

  return data;
}

function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(crypto.randomInt(chars.length));
  }
  return result;
}

//@desc         GST AND PAN ID VERIFICATION ROUTE
//@route        POST /api/v1/user/verify-tax-id

exports.verifyTaxId = async (req, res, next) => {
  try {
    const accessKey = CASHFREE_VERIFICATION_ACCESS_KEY;

    const { type, value, name, email, signupType } = req.body; // Extract type (gst or pan)
    const isFreelancer = signupType === 'FREELANCER';

    if (!type || !value) {
      return next(
        new ErrorResponse(
          `Type and value are required`,
          400
        )
      );
    }

    // Reject malformed numbers before spending a paid vendor call on them.
    const TAX_ID_FORMATS = {
      pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
      gst: /^[0-9]{2}[A-Z0-9]{13}$/,
    };
    if (!TAX_ID_FORMATS[type]) {
      return next(new ErrorResponse("Invalid document type", 400));
    }
    if (!TAX_ID_FORMATS[type].test(String(value).trim().toUpperCase())) {
      return next(new ErrorResponse(`Please enter a valid ${type.toUpperCase()} number`, 400));
    }


    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

    if (!serviceDetails || !serviceDetails.vendor) {
      return next(
        new ErrorResponse(
          "Service operator details not found",
          400
        )
      );
    }

    let clientId = serviceDetails.vendor.optional1;
    let clientSecret = serviceDetails.vendor.optional2;
    let baseUrl = serviceDetails.vendor.apiUrl;
    let finalResponseData = {}; 

    const user = await findCorporateUserByEmail(email); // Find user by email
    if (!user) {
      return next(
        new ErrorResponse(
          "Corporate user not found",
          404
        )
      );
    }

    // Handle GSTIN verification
    if (type === "gst") {
      const fullUrl = `${baseUrl}/verification/gstin`;

      const config = {
        method: "post",

        url: fullUrl,

        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "Content-Type": "application/json",
        },
        data: {
          GSTIN: value,
          business_name: name
        },
      };

      try {
        const response = await axios(config);
        // const response = { data: mockGstResponse }

        // Check if the verification was successful
          if (response.status !== 200) {
            return next(
              new ErrorResponse("Something went wrong, please try after some time", 400)
            );
           }

        await kybVerifications.create({
          documentType: type,
          documentNumber: value,
          legalNameOfBusiness: response.data.legal_name_of_business || null,
          nameMatchingScore: response.data.name_match_score || null,
          verificationResponse: response.data,
          corporateUserId: user.id,
        });
        finalResponseData = {
          gstNumber: value,
          response: response.data,
          accessKey: "gstin_verify",
          serviceName: "GSTIN"
        };
      if (response.data.legal_name_of_business !== name) {
          return res.status(200).json({
              'status': true,
              'responseCode': '000',
              'message': 'Verify your GST details',
              'data': finalResponseData
          })
      }

        // if (mockGstResponse.legal_name_of_business !== name) {
        //   return res.status(400).json({ message: "Business name mismatch with GSTIN data" });
        // }

      } catch (error) {
        customLog(req?.LogTraceId, "error", {
          message: "Error verifying GSTIN",
          data: error?.response?.data || error?.response || error?.message,
          gstin: value
        });
        throw new Error(
          "Something went wrong, please try after some time"
        );
      }
    }

    // Handle PAN verification
    if (type === "pan") {
      const fullUrl = `${baseUrl}/verification/pan`;

      const config = {
        method: "post",
        url: fullUrl,

        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "Content-Type": "application/json",
        },
        data: {
          pan: value,
          name: name,
          verification_id: `verif_${Date.now()}_${CryptoJS.lib.WordArray.random(4).toString()}`.slice(0, 50)
        },
      };

      try {
        const response = await axios(config);

        customLog(req?.LogTraceId, "info", {
          message: "PAN verification API response cashfree",
          status: response.status,
          data: response.data,
          contactPersonName: name,
          pan: value,
          config,
          corporateUserId: user.id
        });

        // Check if the verification was successful
        if (response.status !== 200) {
          return next(
            new ErrorResponse("Something went wrong, please try after some time", 400)
          );
        }

        // Check if PAN verification failed
        if (response.data.valid === false || response.data.status === "INVALID") {
          // await kybVerifications.create({
          //   documentType: type,
          //   documentNumber: value,
          //   legalNameOfBusiness: response.data.registered_name || null,
          //   nameMatchingScore: response.data.name_match_score || null,
          //   verificationResponse: response.data,
          //   corporateUserId: user.id,
          // });
          finalResponseData = {
            panNumber: value,
            response: response.data,
            accessKey: "pan_verify",
            serviceName: "PAN"
          };
          return res.status(400).json({
            status: false,
            message: "Please provide a valid Corporate/Business PAN",
            data: finalResponseData,
            responseCode: "001",
          });
        }

        if (!isFreelancer && response.data.type && response.data.type.toLowerCase().includes("individual")) {
          return res.status(400).json({
            status: false,
            message: "Please provide a valid Corporate/Business PAN",
            data: {},
            responseCode: "001",
          });
        }
        
        if (response.data.valid === true || response.data.status === "VALID") {
          await kybVerifications.create({
            documentType: type,
            documentNumber: value,
            legalNameOfBusiness: response.data.registered_name || null,
            nameMatchingScore: response.data?.name_match_score || null,
            verificationResponse: response.data,
            corporateUserId: user.id,
          });
          finalResponseData = {
            panNumber: value,
            response: response.data,
            accessKey: "pan_verify",
            serviceName: "PAN"
          };      
          return res.status(200).json({
            status: true,
            message: "Verify your PAN details",
            data: finalResponseData,
            responseCode: "000",
          });
        }
        
      } catch (error) {
        customLog(req?.LogTraceId, "error", {
          message: "Error verifying PAN",
          data: error?.response?.data || error?.response || error?.message,
          pan: value
        });
        return next(
          new ErrorResponse(
            "Something went wrong, please try after some time",
            500
          )
        );
      }
    }

   
    const messageMap = {
      pan: "PAN verified successfully",
      gst: "GST verified successfully",
    };
  // Only what the caller submitted is echoed — never the PAN/GST already stored for that corporate.
  return res.status(200).json({
      status: true,
      message : messageMap[type] || "Verification successful",
      data: {
          ...finalResponseData,
      },
      responseCode: "000",
  });

  } catch (error) {
    console.error("Error in verifyTaxId:", error?.message);
    return next(new ErrorResponse(error?.message, 400));
  }
};

  exports.savePanGst = async (req, res, next) => {
    try {
    
        const { type,email } = req.body;
        const data = req.body;
        if (!type ) {
            return res.status(400).json({
                'status': false,
                'message': "Type and value are required",
                'data': {},
                'responseCode': '001'
            })
        }

        const user = await findCorporateUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                'status': false,
                'message': "Corporate user not found",
                'data': {},
                'responseCode': '001'
            })
        }
        if (type !== "gst" && type !== "pan") {
            return res.status(400).json({
                'status': false,
                'message': "Invalid document type",
                'data': {},
                'responseCode': '001'
            })
        }

        const documentNumber = String((type === "gst" ? data.gst : data.pan) || "").trim();
        if (!documentNumber) {
            return res.status(400).json({
                'status': false,
                'message': "Type and value are required",
                'data': {},
                'responseCode': '001'
            })
        }

        // This route is public (signup), so it may only record a number that verify-tax-id already verified
        // for this same corporate — and it never replaces a number that is already verified.
        const alreadyVerifiedNumber = type === "gst"
            ? (user.gstVerified && user.gstNumber)
            : (user.panVerified && user.panNumber);
        if (alreadyVerifiedNumber && String(alreadyVerifiedNumber).toUpperCase() !== documentNumber.toUpperCase()) {
            return res.status(400).json({
                'status': false,
                'message': `${type.toUpperCase()} is already verified for this account`,
                'data': {},
                'responseCode': '001'
            })
        }

        const verification = await kybVerifications.findOne({
            where: { corporateUserId: user.id, documentType: type, documentNumber },
            attributes: ['id'],
        });
        if (!verification) {
            return res.status(400).json({
                'status': false,
                'message': `Please verify your ${type.toUpperCase()} before saving it`,
                'data': {},
                'responseCode': '001'
            })
        }

        if (type === "gst") {
            user.gstNumber = documentNumber;
            user.gstVerified = true;
        } else {
            user.panNumber = documentNumber;
            user.panVerified = true;
        }
        await user.save();
        const messageMap = {
            pan: "PAN verified successfully",
            gst: "GST verified successfully",
          };
        return res.status(200).json({
            status: true,
            message : messageMap[type] || "Verification successful",
            data: {
                gstVerified: user.gstVerified, 
                gstNumber: user.gstNumber, 
                panNumber: user.panNumber,
                panVerified: user.panVerified,
            },
            responseCode: "000",
        });

    } catch (error) {
      console.error("Error in verifyTaxId:", error);
      return next(new ErrorResponse(error?.message, 400));
    }
  };

async function oauthLoginUser(
  corporateUserDetails,
  loginUserDetails,
  userProfileDetails,
  walletDetails,
  accessCodeData,
  req,
  res,
  next,
  isRedirection = false
) {
  let templateDetails = await fetchPartnerDetails(loginUserDetails?.registeredBy);

  try {
    const userId = loginUserDetails.id;
    const token = await signJwt.signToken(corporateUserDetails);
    const refreshToken = await signJwt.signRefreshToken(corporateUserDetails);
    let sessionId = v4();

    //function for fetching the expiry time of redis tokens based on env ACCESS_TOKEN and REFRESH_TOKEN
    const expiryCalculationFn = (expiry) => {
      const match = expiry.match(/^(\d+)([smhd])$/); // Regex to extract value and unit
      if (!match) {
        throw new Error(`Invalid expiry format: ${expiry}`);
      }

      const value = parseInt(match[1], 10); // Numeric part
      const unit = match[2]; // Unit part (s, m, h, d)

      // Convert to seconds
      switch (unit) {
        case "s":
          return value; // seconds
        case "m":
          return value * 60; // minutes
        case "h":
          return value * 60 * 60; // hours
        case "d":
          return value * 60 * 60 * 24; // days
        default:
          throw new Error(`Unsupported time unit: ${unit}`);
      }
    };

    const permissionDetails = await findPartnerPermissionsForSession({
      registeredBy: loginUserDetails?.registeredBy,
      referralCode: userProfileDetails?.referralCode,
    });

    let { role, id, username, corporateId } = corporateUserDetails;

    let subCorporateData, roleName;

    if (corporateUserDetails?.role === "CORPORATE_SUB_USER") {
      subCorporateData = await findOneSubCorporateByCredentialId({
        id: corporateUserDetails?.subCorporateId,
      });

      if (subCorporateData?.isDeleted) {
        return GenericResponse({
          res,
          type: isRedirection ? "redirect" : "json",
          statusCode: 401,
          status: false,
          message: "Account Not Found - Contact administrator for assistance.",
          data: {},
          responseCode: "001",
          redirectUrl: `${templateDetails?.baseUrl || FRONTEND_BASE_URL}/error`
        });
      }
      if (subCorporateData?.status === "INACTIVE") {
        return GenericResponse({
          res,
          type: isRedirection ? "redirect" : "json",
          statusCode: 401,
          status: false,
          message: "Account Inactive - Contact administrator for assistance.",
          data: {},
          responseCode: "001",
          redirectUrl: `${templateDetails?.baseUrl || FRONTEND_BASE_URL}/error`
        });
      }
      if (subCorporateData.services.length <= 0) {
        return GenericResponse({
          res,
          type: isRedirection ? "redirect" : "json",
          statusCode: 401,
          status: false,
          message: "No services are available for you - Contact administrator for assistance.",
          data: {},
          responseCode: "001",
          redirectUrl: `${templateDetails?.baseUrl || FRONTEND_BASE_URL}/error`
        });
      }

      userProfileDetails = await findOneCorporate({
        id: subCorporateData.corporateCredentialID,
      });

      loginUserDetails = await findOneCredential({ id: subCorporateData.corporateCredentialID });

      role = "CORPORATE";
      roleName = "corporate sub user";
      let subCorporateId = id;
      id = loginUserDetails.id;
      username = loginUserDetails.username;
      loginUserDetails.roleName = roleName;
      loginUserDetails.subCorporateId = subCorporateId;

      if (userProfileDetails.status === 0) {
        return GenericResponse({
          res,
          type: isRedirection ? "redirect" : "json",
          statusCode: 401,
          status: false,
          message: "Account is currently inactive",
          data: {},
          responseCode: "001",
          redirectUrl: `${templateDetails?.baseUrl || FRONTEND_BASE_URL}/error`
        });
      }
    }

    const userAgentHeader = req.useragent?.source || req.headers["user-agent"];
    const partnerCredentialId = loginUserDetails?.registeredBy || null;
    let shouldEnforcePrivacyPolicy = false;
    let credentialIdToCheck = subCorporateData?.credentialId || loginUserDetails.id;
    if (partnerCredentialId) {
      const partnerCredential = await findOneCredential(
        { id: partnerCredentialId },
        ["enforcePrivacyPolicy"]
      );
      shouldEnforcePrivacyPolicy = !!partnerCredential?.enforcePrivacyPolicy;
    }

    let policyAccepted = true;
    if (shouldEnforcePrivacyPolicy) {
      policyAccepted = await checkAllPoliciesAccepted({
        credentialId: credentialIdToCheck,
      });
      if (!policyAccepted) {
        const policyIds = corporateUserDetails.policyIds || [];
        policyAccepted = await createPrivacyPolicyAcceptance({
          credentialId: credentialIdToCheck,
          policyIds,
          ipAddress: req.ip,
          userAgent: userAgentHeader
        });
      }
    }

    let privacyPolicyAccepted = !!policyAccepted;

    if (corporateUserDetails.role === "CORPORATE") {
      roleName = "corporate";
    } else if (
      corporateUserDetails.role === "SYSTEM_USER" &&
      corporateUserDetails.username === "pekopayments"
    ) {
      roleName = "admin";
    } else if (
      corporateUserDetails.role === "SYSTEM_USER" &&
      corporateUserDetails.username === "ecommanager"
    ) {
      roleName = "ecom_manager";
    }

    let userSessionData = await fetchUserData(
      loginUserDetails,
      userProfileDetails,
      walletDetails,
      permissionDetails,
      privacyPolicyAccepted
    );

    userSessionData = {
      ...userSessionData,
      contactPersonName: userProfileDetails?.contactPersonName || null,
      roleName,
      corporateId,
      subCorporateId: subCorporateData?.id || null,
      partnerPortalUrl: templateDetails?.baseUrl || FRONTEND_BASE_URL,
      branding: templateDetails?.branding || "Peko",
      uuid: corporateUserDetails?.sessionUUID || null,
    };

    let accessTokenExpiry, refreshTokenExpiry;

    if (corporateUserDetails?.autoLogin) {
      accessTokenExpiry = expiryCalculationFn(process.env.AUTO_LOGIN_ACCESS_TOKEN_EXPIRY);
      refreshTokenExpiry = expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY);
    } else {
      accessTokenExpiry = expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY);
      refreshTokenExpiry = expiryCalculationFn(process.env.REFRESH_TOKEN_EXPIRY);
    }

    if (isRedirection) {
      let tokenExpiry = 30 * 60; // 30 minute for redirection (default)
      if (corporateUserDetails?.tokenExpiry) {
        const now = Math.floor(Date.now() / 1000);
        tokenExpiry = Number(corporateUserDetails?.tokenExpiry) - now;
      }
      customLog(req?.LogTraceId, 'info', { tokenExpiry, message: 'Token expiry for redirection' });
      accessTokenExpiry = tokenExpiry - (5 * 60); // 5 minute less
      refreshTokenExpiry = tokenExpiry;
    }

    let redisUniqueKey = `${userId}_${sessionId}`;
    if (corporateUserDetails?.sessionUUID) {
      redisUniqueKey = `${corporateUserDetails?.sessionUUID}`;
    }
    await setValue(`token_${redisUniqueKey}`, accessTokenExpiry, token);
    await setValue(
      `refreshToken_${redisUniqueKey}`,
      refreshTokenExpiry,
      refreshToken
    );
    if (corporateUserDetails?.refreshToken) {
      await setValue(
        `oauth_refreshToken_${redisUniqueKey}`,
        refreshTokenExpiry,
        corporateUserDetails?.refreshToken
      );
    }
    await setValue(
      `userData_${redisUniqueKey}`,
      accessTokenExpiry,
      JSON.stringify(userSessionData)
    );
    customLog(req?.LogTraceId, 'info', { redisUniqueKey, message: 'Redis keys set for user session' });

    await updateCredentials(id, { lastLogin: Date.now() });
    return GenericResponse({
      res,
      type: isRedirection ? "redirect" : "json",
      statusCode: 200,
      status: true,
      message: "Login successful",
      data: {
        token,
        refreshToken,
        role: role.toLowerCase(),
        roleName,
        id,
        username,
        sessionId,
        corporateId,
        midPending: accessCodeData ? false : true,
        subCorporateId: subCorporateData?.id || null,
        branding: templateDetails?.branding || "Peko",
        service: corporateUserDetails?.service || null,
        isRegistration: corporateUserDetails?.isRegistration || false,
        name: corporateUserDetails?.name || null,
        contactPersonName: corporateUserDetails?.contactPersonName || null,
        email: corporateUserDetails?.email || null,
        mobileNo: corporateUserDetails?.mobileNo || null,
        oauth_refreshToken: corporateUserDetails?.refreshToken || null,
        sessionUUID: corporateUserDetails?.sessionUUID || null,
      },
      responseCode: "000",
      redirectUrl: `${templateDetails?.baseUrl || FRONTEND_BASE_URL}/social`
    });
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { error: err });
    return GenericResponse({
      res,
      next,
      type: isRedirection ? "redirect" : "error",
      statusCode: 500,
      status: false,
      message: "Something went wrong, Please try again later",
      redirectUrl: `${templateDetails?.baseUrl || FRONTEND_BASE_URL}/error`
    });
  }
}

exports.OAuthLoginCallback = asyncHandler(async (req, res, next) => {
  customLog(req?.LogTraceId, "info", { log: "-------------OAuthLoginCallback-------------" });

  let { state, error } = req.query;
  customLog(req?.LogTraceId, "info", { sessionID: req?.sessionID || "N/A", error, log: "-------------oauth callback data-------------" });

  let decodedState = {};
  if (state) {
    try {
      // state is written as base64url in routes/API/v1/oauth.js - decode symmetrically,
      // otherwise a - or _ in a larger payload silently drops partnerId.
      decodedState = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch (err) {
      customLog(req?.LogTraceId, "error", { ...err, message: 'Failed to parse state:' });
    }
  }

  const { partnerId = null, service } = decodedState;

  let templateDetails = await fetchPartnerDetails(partnerId);
 
  const buildErrorRedirect = (message) =>
    `${templateDetails?.baseUrl || FRONTEND_BASE_URL}/error?status=false&message=${encodeURIComponent(message)}&data=${encodeURIComponent(JSON.stringify({}))}&responseCode=001`;

  const errorRedirectUrl = buildErrorRedirect('Unable to complete authorization. Please try again or contact support');
  const missingEmailRedirectUrl = buildErrorRedirect(
    'We could not sign you in because your identity provider did not share an email address. Please grant email access or use an account that has one.'
  );

  if (error) {
    customLog(req?.LogTraceId, "info", { error, log: "-------------OAuth Error-------------" });
    return res.redirect(errorRedirectUrl);
  }

  const encoded = req.headers.oauth;

  if (!encoded) {
    customLog(req?.LogTraceId, "error", { message: 'No OAuth data provided in headers' });
    return res.redirect(errorRedirectUrl);
  }

  let parsed;
  try {
    const decodedJson = Buffer.from(encoded, 'base64').toString('utf8');
    parsed = JSON.parse(decodedJson);
  } catch (err) {
    customLog(req?.LogTraceId, "error", { mesg: "Failed to decode or parse oauth header:", err });
    return res.redirect(errorRedirectUrl);
  }
  const { idToken, refreshToken, accessToken, decoded } = parsed;
  // Resolve the partner's provider, the same one callbackMiddleware exchanged the code against.
  const providerDetails = await findOauthProviderDetails(partnerId);
  if (!providerDetails) {
    customLog(req?.LogTraceId, "error", { message: 'OAuth provider not configured', partnerId });
    return res.redirect(errorRedirectUrl);
  }
  const { issuer } = providerDetails;
  const configUrl = `${issuer}/.well-known/openid-configuration`;
  let userInfoEndpoint = `${issuer}/userinfo`;
  try {
    const { data } = await axios.get(configUrl);
    userInfoEndpoint = data.userinfo_endpoint;
    customLog(req?.LogTraceId, "info", {
      idpCall: "discovery",
      message: "IdP discovery resolved userinfo endpoint",
      partnerId,
      issuer,
      configUrl,
      userInfoEndpoint,
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      idpCall: "discovery",
      message: "IdP discovery request failed",
      partnerId,
      issuer,
      configUrl,
      httpStatus: err?.response?.status,
      idpResponse: err?.response?.data,
      errorMsg: err?.message,
    });
    return res.redirect(errorRedirectUrl);
  }
  let userRes;
  try {
    customLog(req?.LogTraceId, "info", {
      idpCall: "userinfo",
      message: "IdP userinfo request",
      partnerId,
      userInfoEndpoint,
    });
    userRes = await axios.get(
      userInfoEndpoint,
      {
        headers: { "Authorization": `Bearer ${accessToken}` },
      }
    );
    customLog(req?.LogTraceId, "info", {
      idpCall: "userinfo",
      message: "IdP userinfo response",
      partnerId,
      userInfoEndpoint,
      httpStatus: userRes?.status,
      claimsReturned: Object.keys(userRes?.data || {}),
      response: userRes?.data,
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      idpCall: "userinfo",
      message: "IdP userinfo request failed",
      partnerId,
      userInfoEndpoint,
      httpStatus: err?.response?.status,
      idpResponse: err?.response?.data,
      errorMsg: err?.message,
    });
    return res.redirect(errorRedirectUrl);
  }

  let { exp: tokenExpiry } = decoded || {};
  let { name, sub: uuid, nickname, email: userEmail } = userRes?.data || {};
  const phone = pickPhoneClaim(userRes?.data);
  // eslint-disable-next-line no-control-regex
  const fullName = name ? name.replace(/[^\x00-\xFF]/g, '').trim() : null;

  customLog(req.LogTraceId, 'info', { idToken, partnerId, uuid }, "CONSOLE", ["idToken"]);

  if (userRes.data) {
    let query = { uuid };
    if (partnerId) {
      query.registeredBy = partnerId;
    }
    let userExist = await findCorporateByAnyField(query);

    // Account linking. Someone who registered manually has no `uuid`, so the lookup above misses
    // and we would create a SECOND credential + corporateUser for the same person. Fall back to
    // the email the IdP asserted, adopt that account, and stamp the IdP subject onto it so every
    // later sign-in matches on uuid directly and this branch is never needed again.
    //
    // NOTE: linking is intentionally not gated on the `email_verified` claim (product decision).
    // That means whoever controls the address at the IdP can reach the matching Peko account, so
    // the claim is recorded below to make the exposure auditable.
    if (!userExist && userEmail) {
      const linkQuery = { email: String(userEmail).trim() };
      if (partnerId) {
        linkQuery.registeredBy = partnerId;
      }
      const linkTarget = await findCorporateForAccountLink(linkQuery);

      if (linkTarget && linkTarget.uuid && linkTarget.uuid !== uuid) {
        // Already bound to a different IdP subject. Re-pointing it would silently move the
        // account from one identity to another, so leave it alone and let the normal flow run.
        customLog(req?.LogTraceId, "error", {
          message: "Email matches an account already linked to a different social identity",
          corporateId: linkTarget.id,
          partnerId,
        });
      } else if (linkTarget) {
        await updateCorporate(linkTarget.id, { uuid });
        linkTarget.uuid = uuid;
        userExist = linkTarget;
        customLog(req?.LogTraceId, "info", {
          message: "Linked existing account to social login by email",
          corporateId: linkTarget.id,
          partnerId,
          // Whether the IdP vouched for the address. Absent means it never said.
          emailVerifiedClaim: userRes?.data?.email_verified,
        });
      }
    }

    if (!userExist) {
      if (!userEmail) {
        customLog(req?.LogTraceId, "error", {
          message: "IdP returned no email claim - refusing to provision an account",
          partnerId,
          uuid,
          claimsReturned: Object.keys(userRes?.data || {}),
        });
        return res.redirect(missingEmailRedirectUrl);
      }
      let countryCode = '91'; // Default country code, can be changed based on requirements
      let mobileNo = phone || '';
      const phoneNumberDetails = splitPhoneNumber(phone);
      customLog(req?.LogTraceId, "info", { phoneNumberDetails, log: "-------------phoneNumberDetails-------------" });
      if (phoneNumberDetails) {
        countryCode = phoneNumberDetails?.countryCode || '91'; // Default to '91' if not provided
        mobileNo = phoneNumberDetails?.mobileNo || null; // Use the mobile number part
      }
      const data = {
        countryCode,
        name: null,
        contactPersonName: fullName || nickname || null,
        uuid: uuid,
        email: userEmail || null,
        mobileNo: mobileNo || null,
      };

      data.password = generateRandomString(32);

      const username = await generateUniqueUsername();
      data.username = username;

      let params = {};
      data.passwordHistory = {
        currentPassword: "",
        previousPasswords: [],
      };

      if (partnerId) {
        data.registeredBy = partnerId;
      }

      data.isAutoLogin = true;
      data.emailVerified = userRes?.data?.email_verified === true;
      let { user, details } = await Update(params, data);
      if (!user) {
        customLog(req?.LogTraceId, "error", { message: 'An error occurred while registering the user' });
        return res.redirect(errorRedirectUrl);
      }

      let corporateDetails = {
        username: details.username,
        role: details.role,
        id: details.id,
        corporateId: user.id,
        autoLogin: true,
        name: data.name,
        email: data.email,
        contactPersonName: data.contactPersonName,
        mobileNo: data.mobileNo,
        service,
        tokenExpiry,
        refreshToken,
        isRegistration: true,
        sessionUUID: uuid
      };

      const walletDetails = await wallet.findOne({
        where: {
          credentialId: details.id,
        },
        attributes: ["balance"],
      });
      await oauthLoginUser(corporateDetails, details, user, walletDetails, undefined, req, res, next, true);

    } else {
      userExist = await findOneCredential({ id: userExist?.credentialId });
      const walletDetails = await wallet.findOne({
        where: {
          credentialId: userExist.id,
        },
        attributes: ["balance"],
      });

      customLog(req?.LogTraceId, "info", { walletDetails, log: "-------------walletDetails-------------" });

      const corporateUser = await findOneCorporate({ id: userExist?.id });

      customLog(req?.LogTraceId, "info", { corporateUser, log: "-------------corporateUser-------------" });

      if (!corporateUser?.isActive) {
        customLog(req?.LogTraceId, "error", { message: 'Account Inactive - Contact administrator for assistance' });
        return res.redirect(errorRedirectUrl);
      }

      if (!corporateUser?.email) {
        customLog(req?.LogTraceId, "error", {
          message: "Existing account has no email - refusing to sign in",
          partnerId,
          corporateId: corporateUser?.id,
        });
        return res.redirect(missingEmailRedirectUrl);
      }

      let corporateDetails = {
        username: userExist.username,
        role: userExist.role,
        id: userExist.id,
        corporateId: corporateUser.id,
        autoLogin: true,
        name: corporateUser?.name,
        email: corporateUser?.email,
        contactPersonName: corporateUser?.contactPersonName,
        mobileNo: corporateUser?.mobileNo,
        service,
        tokenExpiry,
        refreshToken,
        isRegistration: !corporateUser?.emailVerified,
        sessionUUID: uuid
      };

      customLog(req?.LogTraceId, "info", { corporateDetails, log: "-------------corporateDetails-------------" });
      await oauthLoginUser(corporateDetails, userExist, corporateUser, walletDetails, undefined, req, res, next, true);
    }
  } else {
    customLog(req?.LogTraceId, "error", { message: 'Invalid token provided' });
    return res.redirect(errorRedirectUrl);
  }
});


function pickPhoneClaim(claims) {
  const { phone_number: phoneNumber, phone } = claims || {};
  return phoneNumber || phone || null;
}
