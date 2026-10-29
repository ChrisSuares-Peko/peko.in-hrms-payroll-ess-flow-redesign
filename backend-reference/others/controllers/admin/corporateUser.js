/* eslint-disable no-prototype-builtins */
const { fetchAll, findAll, update, findOne, deleteAccount, corporateUserExports, findOneWithCredentialId, fetchCorporateList, getCorporateFullDetails } = require("../../models/use-cases/corporateUser");

// Fields the generic profile/MFA update endpoints must never accept from the request
// body — they're identity, tenant-isolation, or verification-status columns that must
// only ever be set by their own dedicated flow (OTP verification, deleteAccount,
// TOTP setup, admin tenant assignment), never by a plain profile PATCH.
const CORPORATE_PROTECTED_FIELDS = [
  "id", "credentialId", "registeredBy", "subPartnerId",
  "isActive", "panVerified", "gstVerified", "cinVerified",
  "kycStatus", "totpSecret", "emailVerified", "mobileVerified",
];
const omitFields = (obj = {}, keys) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};
const { findAllWallets, findOneWallets } = require("../../models/use-cases/wallets");
const { flatten } = require("../../utils/flatten");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const credential = require("../../models/entities/credential");
const corporateUser = require("../../models/entities/corporateUser");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");
const puppeteer = require('puppeteer');
const fs = require("fs");
const bankDetails = require("../../models/entities/bankDetails");
const { createOtp, verifyOtp } = require("../../models/use-cases/otp");
const { resolvePartnerScope } = require("../../utils/partnerScope");
const emailer = require("../../utils/emailer");
const sms = require("../../utils/sms");
const addressDetails = require("../../models/entities/addressDetails");
const { findByAnyField } = require("../../models/use-cases/credential");
const { Op } = require("sequelize");
const { createAddress, findOneAddress, updateAddress, deleteAddress } = require("../../models/use-cases/addressDetails");
const {
  findDefaultBankAccount,
  createAccount,
  findBankAccountByAccountNumber,
  updateBank,
  findAllBankAccount,
} = require("../../models/use-cases/bankDetails");
const { findAllActivePackage } = require("../../models/use-cases/package");
const { getActiveGroupSubscriptionDetails } = require("../../models/use-cases/subscription");
const { referralThrougnEmailTemplate } = require("../../utils/emailTemplate/referral");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { bankAccountAddedSuccessTemplate, bankAccountUpdateSuccessTemplate, bankAccountDeletedSuccessTemplate, updateProfileSuccessful, updateProfileDetailsOTP, addressDeletedSuccessTemplate, addressAddedSuccessTemplate, updateBankDetailsOTP, addressOTP, addressUpdateSuccessTemplate } = require("../../utils/emailTemplate/profile");
const { findRole } = require("../../models/use-cases/roleAndPermissions");
const { findOneSubCorporate } = require("../../models/use-cases/subCorporateUsers");
const { findAllUserCoupons, assignMissingCoupons, updateExpiredCoupons } = require("../../models/use-cases/userCoupons");
const { findCouponCodesByPartnerId } = require("../../models/use-cases/pekoCredits");
const { isWalletPaymentAvailableForPartner } = require("../../models/use-cases/paymentMethods");
const { customLog } = require("../../utils/loggerHelper");
const { startOfDay, endOfDay, formattedDateTime } = require("../../utils/formatter");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables, buildOtpBoxesHtml, PEKO_SOCIAL_LINKS } = require("../../utils/emailTemplate/sharedLayout");

// The ESS_WELCOME-style admin-managed email, from the admin-managed template when
// published and from updateProfileDetailsOTP otherwise. Three callers reach this in
// this file - getEmailPhoneOTP (2FA enable) and getOtpNew's email/sms-fallback
// branches (profile-update verification) - each with its own subject.
const sendProfileUpdateOtpEmail = async ({ to, name, otp, templateDetails, fallbackSubject, partnerId }) => {
  const { subject, html, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.PROFILE_UPDATE_OTP,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: partnerId || null,
    variables: {
      username: name,
      otpBoxesHtml: buildOtpBoxesHtml(otp),
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject,
    fallback: () => updateProfileDetailsOTP(name, otp, templateDetails),
  });
  await emailer.email(to, subject, html, undefined, sender);
};

exports.updateCorporateUserAdmin = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;

  let result = await update(params, data);
  if (!result.result[0]) {
    return next(new ErrorResponse(`Something went wrong while updating corporate user`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Profile updated successfully",
      responseCode: "000",
    });
  }
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await update(params, data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating status`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "status updated successfully",
      data: "Updated successfully",
      responseCode: '000'
    });
  }
});

exports.fetchPackages = asyncHandler(async (req, res, next) => {
  let attributes = ["id", "packageName"];
  let result = await findAllActivePackage(attributes);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching packages`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "packages fetched successfully",
      data: { data: result },
      responseCode: "000",
    });
  }
});

// Generate TOTP secret and QR code image
exports.totpGenerate = async (req, res, next) => {
  // F-OTH-25: scope to the caller's own identity. The old `req.params.id` was never
  // populated by this route's real mount path, so this always fell into the "not found"
  // branch in production — this fixes both that bug and the cross-user exposure it masked.
  const user = await corporateUser.findOne({
    include: [
      {
        model: credential,
      },
    ],
    where: {
      credentialId: req.user.id,
    },
  });
  if (user && user.totpSecret) {
    // F-OTH-25: never re-return the raw secret once already enrolled.
    res.send({ configured: true });
  } else {
    // Generate new TOTP secret and save to database
    const secret = authenticator.generateSecret();
    if (user) {
      await user.update({ totpSecret: secret });
    } else {
      return next(new ErrorResponse(`Something went wrong while fetching specific system user`, 200));
    }
    // Generate OTP auth URL using new TOTP secret
    const otpauthURL = authenticator.keyuri(user.email, "auth.peko.one", secret);
    QRCode.toDataURL(otpauthURL, (err, data_url) => {
      res.send({ image: data_url, secret: secret });
    });
  }
};

// Verify TOTP token
exports.verifyTotp = async (req, res) => {
  const { token } = req.body;
  // F-OTH-25: scope to the caller's own identity — previously `userId` was taken from the
  // request body, letting any authenticated user check a code against another user's secret.
  const user = await corporateUser.findOne({
    where: { credentialId: req.user.id },
  });
  const totpSecret = user.totpSecret;

  if (!user) {
    res.status(404).send({ error: "User not found" });
  } else if (!totpSecret) {
    res.status(400).send({ error: "TOTP secret not found for user" });
  } else {
    const valid = authenticator.check(token, totpSecret);
    if (valid) {
      res.send({ valid: true });
    } else {
      res.status(401).send({ error: "Invalid TOTP code" });
    }
  }
};

exports.addBankDetails = asyncHandler(async (req, res, next) => {
  let data = req.body;
  data.city = req.user.city;
  data.bankAddress = data.bankAddress || data.bankBranch || '';
  let emailId = req.user.email
  let name = req.user.name
  const credentialId = parseInt(req.user.id);
  data.credentialId = credentialId
  let response;
  // F-OTH-25: OTP is now mandatory — previously any scope value other than "email" skipped
  // verification entirely and fell through to creating the account.
  response = await verifyOtp({ contact: req.user.email, otp: data.otp, context: "email" });
  if (response.isVerified === false) {
    return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "001" });
  }

  let existingAccount = await findBankAccountByAccountNumber(data.accountNumber, null, credentialId);
  if (existingAccount) {
    return res.status(400).json({ status: false, message: 'This account number is already added.', data: {}, responseCode: '001' });
  }

  //need to check this user have any other default bank else make this as default
  let isDefaultBank = await findDefaultBankAccount({ id: data.credentialId });
  if (!isDefaultBank) {
    data.default = true;
  }

  let result = await createAccount(data);
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const to = emailId; // Set recipient email address
  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.BANK_ACCOUNT_ADDED_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      username: name,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: 'Your bank account added successfully',
    fallback: () => bankAccountAddedSuccessTemplate(name, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  }, sender);
  if (result) {
    return res.status(200).json({
      status: true,
      data: result,
      message: "bank details added successfully",
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(`Something went wrong while adding bank detail`, 500));
  }
});

exports.updateBankDetails = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const bankId = req.body.id;
  const credentialId = parseInt(req.user.id);
  data.credentialId = credentialId
  let emailId = req.user.email;
  let name = req.user.name
  let response;
  // F-OTH-25: OTP is now mandatory — previously any scope value other than "email" skipped
  // verification entirely and fell through to updating the account.
  response = await verifyOtp({ contact: req.user.email, otp: data.otp, context: "email" });
  if (response.isVerified === false) {
    return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "001" });
  }

  let existingBank = await bankDetails.findOne({
    where: {
      id: bankId,
      credentialId: credentialId,
    },
  });
  if (existingBank && existingBank.default && !data.default) {
    //check weather he has any other default bank associated with this id
    return next(new ErrorResponse(`Please set another account as default before removing this account from being the default.  `, 403));
  }

  let updatedBank = await updateBank(data);
  if (!existingBank || !updatedBank) {
    return next(new ErrorResponse(`Something went wrong while updating bank detail`, 500));
  }
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const to = emailId; // Set recipient email address
  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.BANK_ACCOUNT_UPDATE_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      username: name,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: "Bank account details have been updated",
    fallback: () => bankAccountUpdateSuccessTemplate(name, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  }, sender);

  return res.status(200).json({
    status: true,
    data: { updatedBank },
    message: "Bank account details have been updated successfully",
    responseCode: "000",
  });
});

exports.deleteBank = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  let { otp } = req.query
  let name = req.user.name
  let emailId = req.user.email
  let response

  // F-OTH-25: OTP is now mandatory — previously any scope value other than "email" skipped
  // verification entirely and fell through to deleting the account.
  response = await verifyOtp({ contact: req.user.email, otp: otp, context: 'email' })
  if (response.isVerified === false) {
    return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: '001' });
  }
  // Check if the bank account is set as default
  const bankAccount = await bankDetails.findOne({
    where: {
      id: id,
      credentialId: req.user.id,
      default: true, // Check if it's set as default
    },
  });
  if (bankAccount) {
    return next(new ErrorResponse(`The bank account is set as default and cannot be deleted.`, 403));
  }
  // If not set as default, proceed with deletion
  const result = await bankDetails.destroy({
    where: {
      id: id,
      credentialId: req.user.id,
    },
  });
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const to = emailId; // Set recipient email address
  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.BANK_ACCOUNT_DELETED_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      username: name,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: 'Your bank account deleted',
    fallback: () => bankAccountDeletedSuccessTemplate(name, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  }, sender);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while deleting the Bank Account.`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Bank deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.findAllCorporateUsers = asyncHandler(async (req, res, next) => {
  let { searchText, page, itemsPerPage, from, to } = req.query;
  // const start = parseInt(req.query.start);
  // const length = parseInt(req.query.length);
  // const draw = parseInt(req.query.draw);
  // let searchText = req.query.search.value;
  // let order = req.query.orderCol,
  //   column = req.query.column;
  const { partnerId, subPartnerId } = resolvePartnerScope(req)
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'createdAt'
  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  const corporateUserData = await findAll({
    offset,
    limit,
    sort,
    sortField,
    searchText,
    partnerId,
    subPartnerId,
    from: startOfDay(from),
    to: endOfDay(to),
  });
  if (!corporateUserData) {
    return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: corporateUserData.count,
        recordsFiltered: corporateUserData.count,
        data: corporateUserData.rows,
      },
      message: 'Fetched all corporate users successfully',
      responseCode: '000'

    });
  }
});

exports.corporateUserExcelCSV = asyncHandler(async (req, res, next) => {
  let { searchText,from, to } = req.query
  const { type } = req.params
  const { partnerId, subPartnerId } = resolvePartnerScope(req)
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
  let sortField = req.query.sortField || 'createdAt'

  const data = await corporateUserExports({
    sort,
    sortField,
    searchText,
    partnerId,
    subPartnerId,
    from: startOfDay(from),
    to: endOfDay(to),
  })
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  } else {
    const { buffer, fileType } = await generateExcelBufferAndType(data, type)
    return res.status(200).json({
      status: true,
      data: { buffer, fileType },
      message: 'Fetched excel/csv datas successfully',
      responseCode: '000',
    })
  }
})

exports.corporateUserPDF = asyncHandler(async (req, res, next) => {
  let { searchText,from, to } = req.query;
  const { partnerId, subPartnerId } = resolvePartnerScope(req)
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
  let sortField = req.query.sortField || 'createdAt'

  const data = await corporateUserExports({
    sort,
    sortField,
    searchText,
    partnerId,
    subPartnerId,
    from: startOfDay(from),
    to: endOfDay(to),
  })
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  }

  const templateDetails = {
    title: 'Corporate Users Report',
  }
  const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails)
  let random = new Date().valueOf()

  // Create a browser instance with Puppeteer
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()

  // Set content to the page
  await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })

  // Generate PDF using Puppeteer
  const outputFile = `report-${random}.pdf`
  await page.pdf({
    path: outputFile,
    scale: 0.4,
    format: 'A4',
    preferCSSPageSize: true,
  })

  console.log('PDF generated successfully!')

  const buffer = fs.readFileSync(outputFile)

  browser.close()

  fs.unlinkSync(outputFile)

  return res.status(200).json({
    status: true,
    message: 'report generated successfully.',
    data: {
      buffer,
      fileType: 'application/pdf',
    },
    responseCode: '000',
  })
})

exports.updateCorporateUser = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = omitFields(req.body, CORPORATE_PROTECTED_FIELDS);
  let user = req.user;
  let response;
  // verifying otp
  if (data.scope === "email") {
    response = await verifyOtp({ contact: req.user.email, otp: data.otp, context: "email" });
    if (response.isVerified === false) {
      return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "001" });
    }
  }
  if (data.scope === "mobile") {
    response = await verifyOtp({ contact: `91${data.mobileNo}`, otp: data.otp, context: "mobile" });
    if (response.isVerified === false) {
      return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "001" });
    }
  }

  let result = await update(params, data, user);
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const to = user.email; // Set recipient email address
  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.PROFILE_UPDATE_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      username: user.name,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: `Your ${templateDetails?.branding || 'Peko'} profile updated successfully `,
    fallback: () => updateProfileSuccessful(user.name, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  }, sender);
  if (!result.result[0]) {
    return next(new ErrorResponse(`Something went wrong while updating corporate user`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Profile updated successfully",
      responseCode: "000",
    });
  }
});

const pickFields = (obj = {}, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

exports.updatePanAndGstVerification = asyncHandler(async (req, res, next) => {
  if (blockSubUser(req, res)) return;
  let params = req.params;
  // the only endpoint allowed to set these verification flags — everywhere else
  // they're blocked via CORPORATE_PROTECTED_FIELDS.
  let data = pickFields(req.body, ["panVerified", "gstVerified", "cinVerified"]);

  let result = await update(params, data);
  if (!result.result[0]) {
    return next(new ErrorResponse(`verification failed`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {},
      message: "verification completed successful",
      responseCode: "000",
    });
  }
});

// Deactivating, changing MFA settings, and KYC verification are owner-only — a sub-user
// logs in as the parent corporate's id for ordinary resource access, but should never be
// able to deactivate the company or change its security settings on the owner's behalf.
const blockSubUser = (req, res) => {
  if (req.user?.role === 'CORPORATE_SUB_USER') {
    res.status(403).json({
      status: false,
      message: "This action is restricted to the account owner.",
      data: {},
      responseCode: "001",
    });
    return true;
  }
  return false;
};

exports.deleteAccount = asyncHandler(async (req, res) => {
  if (blockSubUser(req, res)) return;
  await deleteAccount(req.user.id);
  return res.status(200).json({
    status: true,
    data: {},
    message: "Account deleted successfully",
    responseCode: "000",
  });
});

exports.updateMfaSetting = asyncHandler(async (req, res, next) => {
  if (blockSubUser(req, res)) return;
  let params = req.params;
  let updateObj = omitFields(req.body, CORPORATE_PROTECTED_FIELDS);

  let result = await update(params, updateObj);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating corporate user`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "mfa settings updated successfully",
      responseCode: "000",
    });
  }
});

exports.fetchAllCorporateUsers = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText || "";
  const scope = resolvePartnerScope(req)
  const selectedPartnerId = scope.locked ? undefined : req.query.partnerId
  const selectedSubPartnerId = scope.locked ? undefined : req.query.subPartnerId
  let role = "CORPORATE";
  let registeredBy = req.user.registeredBy
  let subPartnerId = req.user.subPartnerId
  let data = await fetchAll(searchText, role, registeredBy,subPartnerId, selectedPartnerId, selectedSubPartnerId);
  let wallets = await findAllWallets();
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while fetching all corporate user`, 500));
  } else {
    let result = data.map(function (t) {
      let wallet = wallets.find(function (wt) {
        return wt.credentialId == t.credentialId;
      });
      t.balance = wallet ? wallet["balance"] : 0;
      return flatten(t);
    });
    return res.status(200).json({
      status: true,
      data: { result },
      message: 'Fetched all corporate users successfully',
      responseCode: '000'
    });
  }
});

exports.findOneCorporateUser = asyncHandler(async (req, res, next) => {
  const params = req.params;
  let subCorporateId
  let attributes = {};
  if (params.type === "basic") {
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateId = req.user?.subCorporateId
    }
    attributes = {
      corporateAttr: [
        "name",
        "mobileNo",
        "city",
        "designation",
        "email",
        "country",
        "state",
        "companyName",
        "companySize",
        "landlineNo",
        "mobileVerified",
        "contactPersonName",
        "logo",
      ],
      packageAttr: ["packageName"],
      credentialsAttr: ["username"],
    };
  } else if (params.type === "company") {
    attributes = {
      corporateAttr: [
        "gstNumber",
        "panNumber",
        "cinNumber",
        "tanDoc",
        "panDoc",
        "gstDoc",
        "cinDoc",
        "tradeLicenseNo",
        "tradeLicenseDoc",
        "issuingAuthority",
        "activity",
        "panVerified",
        "gstVerified",
        "cinVerified",
      ],
      packageAttr: [],
      credentialsAttr: [],
    };
  } else if (params.type === "security") {
    attributes = {
      corporateAttr: ["sendMfaCodeToEmail", "sendMfaCodeToPhone", "sendMfaCodeToAuthApp"],
      packageAttr: [],
      credentialsAttr: [],
    };
  }
  let subCorporateDetails = undefined
  if(subCorporateId){
    subCorporateDetails = await findOneSubCorporate({ id: subCorporateId }, ['name', 'email', 'mobileNo', 'role']);
  }
  const result = await findOne(params, attributes);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while getting particular corporate user`, 404));
  } else {
    return res.status(200).json({
      status: true,
      data: { ...result, subCorporateDetails },
      message: "corporate user fetched successfully",
      responseCode: "00000",
    });
  }
});

exports.getEmailPhoneOTP = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const { scope, newMobileNo } = req.query;

  const user = await corporateUser.findOne({
    include: [{ model: credential }],
    where: { credentialId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Reject before the OTP is sent, so a doomed update doesn't cost the user an OTP round-trip.
  if (scope === "sms" && newMobileNo) {
    const existingUser = await corporateUser.findOne({
      where: { mobileNo: newMobileNo, credentialId: { [Op.ne]: credentialId } },
    });
    if (existingUser) {
      return next(new ErrorResponse("The mobile number is already associated with another account.", 403));
    }
  }

  let { mobileNo, email } = user;
  let otp;
  if (scope === "email") {
    otp = await createOtp({ contact: email });
    let templateDetails = await fetchPartnerDetails(req.user.registeredBy)

    await sendProfileUpdateOtpEmail({
      to: email,
      name: req.user.name,
      otp,
      templateDetails,
      fallbackSubject: "Enable 2FA email",
      partnerId: req.user.registeredBy,
    });
  }
  if (scope === "sms") {
    const targetMobile = newMobileNo || mobileNo;
    otp = await createOtp({ contact: targetMobile });
    sms.sendSMS(targetMobile, "Welcome to Peko. Your requested one time password is: " + otp);
  }

  console.log("-------------------------");
  console.log("-------------------------");
  console.log(`-OTP-${scope}:`, otp, "------");
  console.log("-------------------------");
  console.log("-------------------------");
  //ADD OTP RESPONSE
  return res.status(200).json({
    success: true,
    message: "OTP sent successfully via email.",
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
    responseCode: '000'
  });
});

exports.verifyEmailPhoneOTP = asyncHandler(async (req, res) => {
  let { otp, scope } = req.body;

  // F-OTH-25: scope the lookup to the caller's own identity — previously `userId` was
  // taken from the request body, letting any authenticated user target another user's OTP.
  const user = await corporateUser.findOne({
    include: [
      {
        model: credential,
      },
    ],
    where: {
      credentialId: req.user.id,
    },
  });
  let { mobileNo, email } = user;

  let response;
  if (scope === "email") {
    response = await verifyOtp({ contact: email, otp: otp });
  } else if (scope === "sms") {
    response = await verifyOtp({ contact: mobileNo, otp: otp });
  }

  if (response.isVerified === false) {
    return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "001" });
  } else if (response.isVerified === true) {
    return res.status(200).json({
      status: true,
      message: "User verified successfuly",
      data: response,
      responseCode: "000",
    });
  }
});

exports.addAddress = asyncHandler(async (req, res, next) => {
  let data = req.body;
  let name = req.user.name
  const platform = req.headers['platform']
  let response;
  let emailId = req.user.email
  // verifying otp
  if (data.scope === 'email' && platform !== 'mobile') {
    response = await verifyOtp({ contact: req.user.email, otp: data.otp, context: 'email' })
    if (response.isVerified === false) {
      return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: '001' });
    }
  }
  data.credentialId = req.user.id
  let result = await createAddress(data);
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const to = emailId; // Set recipient email address
  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ADDRESS_ADDED_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      username: name,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: 'Your address added successfully',
    fallback: () => addressAddedSuccessTemplate(name, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  }, sender);
  if (result) {
    return res.status(200).json({
      status: true,
      data: result,
      message: "address added successfully",
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(`Something went wrong while adding address`, 500));
  }
});

exports.deleteAddress = asyncHandler(async (req, res, next) => {
  let params = { ...req.params, credentialId: req.user.id };
  let name = req.user.name
  let { scope, otp } = req.query
  let emailId = req.user.email
  let response
  if (scope === 'email') {
    console.log(scope)
    response = await verifyOtp({ contact: req.user.email, otp: otp, context: 'email' })
    if (response.isVerified === false) {
      return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: '001' });
    }
  }
  const result = await deleteAddress(params);
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const to = emailId; // Set recipient email address
  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ADDRESS_DELETED_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      username: name,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: 'Your address deleted',
    fallback: () => addressDeletedSuccessTemplate(name, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  }, sender);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while deleting the Address`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Address deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.updateAddressDetails = asyncHandler(async (req, res, next) => {
  const updatedData = req.body;
  const addressId = req.body.id;
  const credentialId = parseInt(req.user.id);
  let emailId = req.user.email
  let name = req.user.name
  let response;
  // verifying otp
  if (updatedData.scope === 'email') {
    response = await verifyOtp({ contact: req.user.email, otp: updatedData.otp, context: 'email' })
    if (response.isVerified === false) {
      return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: '001' });
    }
  }

  let existingAddress = await findOneAddress({ addressId, credentialId });
  if (!existingAddress) {
    return next(new ErrorResponse(`Something went wrong while updating Address,${addressId}`, 404));
  }

  let updatedAddress = await updateAddress({ ...updatedData, credentialId })
  if (!updatedAddress) {
    return next(new ErrorResponse(`Something went wrong while updating Address`, 500));
  }
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  const to = emailId; // Set recipient email address
  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ADDRESS_UPDATE_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      username: name,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: 'Your address updated successfully',
    fallback: () => addressUpdateSuccessTemplate(name, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  }, sender);
  return res.status(200).json({
    status: true,
    data: { updatedAddress },
    message: "updated address successfully",
    responseCode: "000",
  });
});

// exports.findAllAddress = asyncHandler(async (req, res) => {
//   const credentialId = req.user.id;
//   const { q: searchText, isReceiver } = req.query;

//   const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
//   const safeSearch = escapeLike(searchText.toLowerCase());

//   let whereClause = {
//     credentialId,
//     isReceiver,
//   };

//   if (safeSearch) {
//     whereClause[Op.or] = [
//       {
//         nickname: {
//           [Op.like]: `%${safeSearch}%`,
//         },
//       },
//       {
//         name: {
//           [Op.like]: `%${safeSearch}%`,
//         },
//       },
//     ];
//   }

//   const result = await addressDetails.findAll({
//     where: whereClause,
//     raw: true,
//     nest: true,
//   });

//   if (!result || result.length === 0) {
//     return res.status(200).json({
//       status: true,
//       data: { addressDetails: [] },
//       message: "All addresses retrieved successfully.",
//       responseCode: "000",
//     });
//   }

//   return res.status(200).json({
//     status: true,
//     data: { addressDetails: result },
//     message: "All addresses retrieved successfully.",
//     responseCode: "000",
//   });
// });
exports.findAllAddress = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const searchText = req.query.q;
  const isReceiver = req.query.isReceiver === "true";
  const attributes = ['id','addressType','name','addressLine1','addressLine2','phoneNumber','default']
  let whereClause = {
    credentialId: credentialId,
    isReceiver: isReceiver,
    addressType: {
      [Op.notIn]: ['Logistics', 'Billing'],
    }
  };
  if (searchText) {
    whereClause[Op.or] = [
      {
        nickname: {
          [Op.like]: `%${searchText}%`,
        },
      },
      {
        name: {
          [Op.like]: `%${searchText}%`,
        },
      },
    ];
  }
  const result = await addressDetails.findAll({
    where: whereClause,
    attributes,
    nest: true,
    raw: true,
  });
  if (!result) {
    const addressDetails = {
      nickname: "Not available",
      addressLine1: "Not available",
      addressLine2: "Not available",
      phoneNumber: "Not available",
    };
    return res.status(200).json({
      statuss: true,
      data: addressDetails,
      message: 'Fetched all addresses successfully',
      responseCode: '000'
    });
  } else {
    return res.status(200).json({
      status: true,
      data: { addressDetails: result },
      message: 'Fetched all addresses successfully',
      responseCode: '000'
    });
  }
});

exports.getOtpNew = asyncHandler(async (req, res) => {
  const { scope, mobileNo } = req.query;
  let otp;
  let message = "OTP sent successfully via email.";
  if (scope == "sms") {
    message = "OTP sent successfully";
    otp = await createOtp({ contact: mobileNo });
    if (!otp) {
      return res.status(500).json({ status: false, message: "Failed to send OTP.", data: {}, responseCode: "001" });
    }
    //Sending sms with otp
    sms.sendSMS(mobileNo, "Update Mobile Requested from Peko. Your requested one time password is: " + otp);
    console.log("-------------------------");
    console.log("-------------------------");
    console.log("Mobile:", otp, "------");
    console.log("-------------------------");
    console.log("-------------------------");
  } else if (scope == "email") {
    //it will create a bycrypted otp in db and return the created otp to send via email
    otp = await createOtp({ contact: req.user.email });
    if (!otp) {
      return res.status(500).json({ status: false, message: "Something went wrong, please try again.", data: {}, responseCode: "001" });
    }
    //Sending Email with otp
    let templateDetails;
    req.user.registeredBy ?
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
      :
      templateDetails = await partnerLogos()
    await sendProfileUpdateOtpEmail({
      to: req.user.email,
      name: req.user.name,
      otp,
      templateDetails,
      fallbackSubject: "Account verification OTP for profile update",
      partnerId: req.user.registeredBy,
    });
    console.log("-------------------------");
    console.log("-------------------------");
    console.log("EMAIL:", otp, "------");
    console.log("-------------------------");
    console.log("-------------------------");
  } else {
    otp = await createOtp({ contact: mobileNo });
    if (!otp) {
      return res.status(500).json({ status: false, message: "Failed to send OTP.", data: {}, responseCode: "001" });
    }
    //Sending sms with otp
    sms.sendSMS(mobileNo, "Update Mobile Requested from Peko. Your requested one time password is: " + otp);
    console.log("-------------------------");
    console.log("-------------------------");
    console.log("Mobile:", otp, "------");
    console.log("-------------------------");
    console.log("-------------------------");
    otp = await createOtp({ contact: req.user.email });
    if (!otp) {
      return res.status(500).json({ status: false, message: "Something went wrong, please try again.", data: {}, responseCode: "001" });
    }
    //Sending Email with otp
    let templateDetails;
    req.user.registeredBy ?
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
      :
      templateDetails = await partnerLogos()
    await sendProfileUpdateOtpEmail({
      to: req.user.email,
      name: req.user.name,
      otp,
      templateDetails,
      fallbackSubject: "Profile Update Request",
      partnerId: req.user.registeredBy,
    });
    console.log("-------------------------");
    console.log("-------------------------");
    console.log("EMAIL:", otp, "------");
    console.log("-------------------------");
    console.log("-------------------------");
  }
  return res.status(200).json({
    status: true,
    message,
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
    responseCode: "000",
  });
});

exports.verifyEmailPhoneOTPNew = asyncHandler(async (req, res) => {
  let { otpEmail, otpMobile, newMobile } = req.body;
  // F-OTH-25: scope the lookup to the caller's own identity — previously `userId` was
  // taken from the request body, letting any authenticated user target another user's OTP.
  const user = await corporateUser.findOne({
    include: [
      {
        model: credential,
      },
    ],
    where: {
      credentialId: req.user.id,
    },
  });
  let { email } = user;

  let response, response2;
  response = await verifyOtp({ contact: email, otp: otpEmail });

  response2 = await verifyOtp({ contact: newMobile, otp: otpMobile });
  if (response.isVerified === false || response2.isVerified == false) {
    return res.status(401).json({ success: false, message: response.message });
  } else if (response.isVerified === true && response2.isVerified === true) {
    return res.status(200).json({
      status: true,
      message: "Verified successfuly",
      data: response,
      responseCode: "000",
    });
  } else {
    return res.status(401).json({ success: false, message: "Verification failed" });
  }
});

exports.getOtpBankAccount = asyncHandler(async (req, res, next) => {
  let { scope, accountNumber, selectedId, method } = req.query;
  const credentialId = parseInt(req.user.id);
  let bankAccount;
  if(selectedId)
    bankAccount = await bankDetails.findOne({
    where: {
      id: selectedId,
      default: true // Check if it's set as default
    }
  });
  if (bankAccount && method === "delete") {
    return next(new ErrorResponse(`The bank account is set as default and cannot be deleted.`, 500));
  }
  if (accountNumber) {
    // accountNumber is unique, better to find duplicates before sending OTP
    let existingAccount = await findBankAccountByAccountNumber(accountNumber, selectedId, credentialId);

    if (existingAccount) {
      let errorMessage = "Something went wrong.";
      if (existingAccount.accountNumber == accountNumber) {
        errorMessage = "This account number already exists.";
      }
      return next(new ErrorResponse(errorMessage, 403));
    }
  }
  let otp;
  if (scope === "email") {
    //it will create a bycrypted otp in db and return the created otp to send via email
    otp = await createOtp({ contact: req.user.email });
    if (!otp) {
      return res.status(500).json({ status: false, message: "Failed to create OTP.", data: {}, responseCode: "001" });
    }
    let subject
    let operation
    if (selectedId && method === 'delete') {
      subject = 'deleting'
      operation = 'delete'
    } else if (selectedId) {
      subject = 'updating'
      operation = 'update'
    } else {
      subject = 'adding'
      operation = 'add'
    }
    //Sending Email with otp
    let templateDetails;
    req.user.registeredBy ?
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
      :
      templateDetails = await partnerLogos()
      const { subject: emailSubject, html: emailBody, sender: emailSender } = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BANK_ACCOUNT_VERIFICATION_OTP,
        service: EMAIL_TEMPLATE_SERVICES.PROFILE,
        partnerId: req.user.registeredBy || null,
        variables: {
          username: req.user.name,
          operation,
          otpBoxesHtml: buildOtpBoxesHtml(otp),
          branding: templateDetails?.branding || 'Peko',
          ...v2LayoutVariables({
            website: templateDetails?.baseUrl || 'https://in.peko.one',
            logo: templateDetails?.logo,
            branding: templateDetails?.branding || 'Peko',
            socials: PEKO_SOCIAL_LINKS,
          }),
        },
        fallbackSubject: `Account verification OTP for ${subject} your bank account`,
        fallback: () => updateBankDetailsOTP(req.user.name, otp, operation, templateDetails),
      });
      await emailer.email(req.user.email, emailSubject, emailBody, undefined, emailSender);
  }

  console.log("-------------------------");
  console.log("-------------------------");
  console.log("EMAIL:", otp, "------");
  console.log("-------------------------");
  console.log("-------------------------");
  //ADD OTP RESPONSE
  return res.status(200).json({
    status: true,
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
    message: "OTP sent successfully via email.",
    responseCode: "000",
  });
});

exports.userDetails = asyncHandler(async (req, res, next) => {
  let id = req.user.id

  let walletAttribute = ['balance', 'credentialId']
  let credentialAttribute = ['name', 'role', 'username', 'registeredBy', 'accountType']

  let result = await findOneWallets(id, walletAttribute, credentialAttribute)
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching wallet`, 500))
  } else {
    if (result['credential.role'] === 'SYSTEM_USER') {
      const roleData = await findRole(id);
      const roleName = roleData?.roleAndPermission?.roleName;
      result['roleName'] = roleName;

      //probably now below info will not be there for system user
      result['logo'] = req.user.logo || ''
      result['contactPersonName'] = req.user?.contactPersonName || ''
      result['email'] = req.user?.email || ''
      result['mobileNo'] = req.user?.mobileNo || ''
      result['chatId'] = req.user?.chatId || ''

    } else if (result['credential.role'] === 'CORPORATE') {
      result['roleName'] = 'corporate'
      const corporateDetails = await findOneWithCredentialId(id)
      result['productTour'] = corporateDetails.productTour
      result['logo'] = corporateDetails.logo || ''
      result['contactPersonName'] = corporateDetails.contactPersonName || ''
      result['email'] = corporateDetails.email || ''
      result['mobileNo'] = corporateDetails.mobileNo || ''
      result['chatId'] = corporateDetails.chatId || ''
      result['companyName'] = corporateDetails.name || result['credential.name'];

    const partnerId = req.user.registeredBy
    const corporateId = req.user.corporateId;
    const referralCode = corporateDetails?.referralCode || null;
    await updateExpiredCoupons(corporateId);
    await assignMissingCoupons(corporateId, partnerId, referralCode);
    const userAllCoupons = await findAllUserCoupons(corporateId, partnerId)
    const userCouponsLength = userAllCoupons.length > 0;

    let pekoCredits = 0;
    userAllCoupons.map((coupon) => {
      const { discount, discountType, maximumDiscount } = coupon.couponData
      const discountValue = parseFloat(discount);
      if (coupon.status === 'UNCLAIMED' && discountType === 'FLAT') {
        pekoCredits += discountValue;
      }
      if (coupon.status === 'UNCLAIMED' && discountType === 'PERCENTAGE') {
        pekoCredits += parseFloat(maximumDiscount);
      }
    });
    // first check admin is added any coupon codes
    const coupons = await findCouponCodesByPartnerId(req.user.registeredBy || null)
    const isPekoCreditAvailable = coupons.length > 0 && pekoCredits > 0; 

    result['isPekoCreditAvailable'] = isPekoCreditAvailable;
    // result['isPekoCreditActive'] = isPekoCreditActive;
    result['isPekoCreditActive'] = userCouponsLength && ( pekoCredits !== 0 || userAllCoupons.length == coupons.length )
    
    pekoCredits = parseFloat(pekoCredits).toFixed(2);
    result['pekoCredits'] = pekoCredits;

    const { activeGroupPackageName, isTopPlan } = await getActiveGroupSubscriptionDetails(corporateId, partnerId)
    result['activeGroupPackageName'] = activeGroupPackageName
    result['isTopPlan'] = isTopPlan

    try {
      result['isWalletPaymentAvailable'] = await isWalletPaymentAvailableForPartner(partnerId)
    } catch (walletFlagError) {
      customLog(req?.LogTraceId, 'error', { action: 'profile:walletFlagFailed', partnerId, data: walletFlagError?.message })
      result['isWalletPaymentAvailable'] = false
    }
  }
    if (!result['companyName']) {
      result['companyName'] = result['credential.name'];
    }
    delete result['credential.name']

    result['partnerId'] = result['credential.registeredBy'];
    delete result['credential.registeredBy']

    result['role'] = result['credential.role'];
    delete result['credential.role'];

    result['username'] = result['credential.username'];
    delete result['credential.username']

    result['accountType'] = result['credential.accountType'] || 'corporate';
    delete result['credential.accountType']

    if (req.user.role === 'CORPORATE_SUB_USER') {
      result['roleName'] = 'corporate sub user'
      result['subCorporateEmail'] = req.user.subCorporateEmail
      result['subCorporateMobile'] = req.user.subCorporateMobile
      result['subCorporateCredential'] = req.user.subCorporateCredential
    }

    return res.status(200).json({
      'status': true,
      'data': result,
      'message': 'Data fetched successfully',
      'responseCode': '000'
    })
  }
})

//progress
exports.fetchProfileProgress = asyncHandler(async (req, res) => {
  let progressData = {};
  let progress = 0;
  let credentialId = req.user.id;
  let username = req.user.username;
  //check if the address is exist or not
  const isReceiver = req.query.isReceiver === "true";
  let whereClause = {
    credentialId: credentialId,
    isReceiver: isReceiver,
  };

  const result = await addressDetails.findAll({
    where: whereClause,
  });

  if (result.length > 0) {
    progressData.addressDetailsProgress = 15;
    progressData.progress = `${progress + 15}%`;
    progress += 15;
  } else {
    progressData.addressDetailsProgress = 0;
    progressData.progress = `${progress}%`;
  }

  const bankDetails = await findAllBankAccount({ corporateId: credentialId });

  if (bankDetails.length > 0) {
    progressData.bankDetailsProgress = 15;
    progressData.progress = `${progress + 15}%`;
    progress += 15;
  } else {
    progressData.bankDetailsProgress = 0;
    progressData.progress = `${progress}%`;
  }

  const userBasicInfo = await corporateUser.findOne({
    where: { credentialId: credentialId },
  });

  if (userBasicInfo) {
    const basicInfoFields = [
      "name",
      "mobileNo",
      "city",
      "designation",
      "email",
      "country",
      "contactPersonName",
      "companySize",
      "landlineNo",
      "logo",
    ];

    let basicInfoProgress = 0;
    basicInfoFields.forEach((field) => {
      if (userBasicInfo[field] !== null && userBasicInfo[field] !== "") {
        basicInfoProgress += 1;
      }
    });

    const totalBasicInfoFields = basicInfoFields.length;
    const basicInfoProgressPercentage = (basicInfoProgress / totalBasicInfoFields) * 25;

    progressData.basicInfoProgress = basicInfoProgressPercentage > 25 ? 25 : basicInfoProgressPercentage;
    progress += progressData.basicInfoProgress;
  } else {
    progressData.basicInfoProgress = 0; // Set progress to 0 if user basic info not found
  }

  const userCompanyInfo = await corporateUser.findOne({
    where: { credentialId: credentialId },
  });

  if (userCompanyInfo) {
    const companyInfoFields = ["gstNumber", "panNumber", "cinNumber", "activity"];

    let companyInfoProgress = 0;
    companyInfoFields.forEach((field) => {
      if (userCompanyInfo[field] !== null && userCompanyInfo[field] !== "") {
        companyInfoProgress += 1;
      }
    });

    const totalCompanyInfoFields = companyInfoFields.length;
    const companyInfoProgressPercentage = (companyInfoProgress / totalCompanyInfoFields) * 25;

    progressData.companyInfoProgress = companyInfoProgressPercentage > 25 ? 25 : companyInfoProgressPercentage;
    progress += progressData.companyInfoProgress;

    // Company Docs ( GST Certificate, PAN Card, CIN Certificate)
    const companyDocFields = ["panDoc", "gstDoc", "cinDoc"]
    let companyDocProgress = 0;

    companyDocFields.forEach((field) => {
      if (userCompanyInfo[field] !== null && userCompanyInfo[field] !== "") {
        companyDocProgress += 1;
      }
    });

    const totalCompanyDocFields = companyDocFields.length;
    const companyDocProgressPercentage = (companyDocProgress / totalCompanyDocFields) * 20
    
    progressData.companyDocProgress = companyDocProgressPercentage > 20 ? 20 : companyDocProgressPercentage;
    progress += progressData.companyDocProgress;

  } else {
    progressData.companyInfoProgress = 0; // Set progress to 0 if user company info not found
    progressData.companyDocProgress = 0 ;
  }

  // Set overall progress
  progressData.progress = `${progress}%`;

  //strength calculation
  if (progress === 100) {
    progressData.strength = "Complete";
  } else if (progress >= 50 && progressData?.progress <= 75) {
    progressData.strength = "Intermediate";
  } else {
    progressData.strength = "Basic";
  }

  progressData.tips = await generatePriorityTip(progressData);
  //for sending referral link
  const partnerDetails = await fetchPartnerDetails(req.user.registeredBy);
  const baseUrl = partnerDetails?.baseUrl;
  let url =
    baseUrl +
    "/auth/register?referralCode=" + username

  progressData.referralLink = url

  return res.status(201).json({
    status: true,
    data: progressData,
    message: "progress fetched successfully",
    responseCode: "000",
  });
});

// Function to generate tips based on priority
async function generatePriorityTip(progressData) {
  
  const { basicInfoProgress, companyInfoProgress, addressDetailsProgress, bankDetailsProgress, companyDocProgress } = progressData;
  if (basicInfoProgress < 25) {
    return ["Complete your basic information for better profile completion."];
  }

  if (companyInfoProgress + companyDocProgress < 45) {
    return ["Ensure your company information is complete."];
  }

  if (addressDetailsProgress < 15) {
    return ["Please complete your address details."];
  }

  if (bankDetailsProgress === 0) {
    return ["Please complete your bank account details."];
  }
  
  return ["All filled up! Your profile is looking great."];
}

exports.referThroughEmail = asyncHandler(async (req, res, next) => {

  let username = req.user.username;

  let { email } = req.body
  let isEmailAvailable = await findByAnyField({ email })
  if (isEmailAvailable) {
      return next(new ErrorResponse(`The email ID entered is already associated with an existing user.`, 400))
  }
  let templateDetails = await fetchPartnerDetails(req.user.registeredBy)
  //for sending referral link
  const baseUrl = templateDetails?.baseUrl;
  let url =
    baseUrl +
    "/auth/register?referralCode=" + username

  const { subject, html: body, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFERRAL_INVITE,
    service: EMAIL_TEMPLATE_SERVICES.PROFILE,
    partnerId: req.user.registeredBy || null,
    variables: {
      referralLink: url,
      branding: templateDetails?.branding || 'Peko',
      ...v2LayoutVariables({
        website: templateDetails?.baseUrl || 'https://in.peko.one',
        logo: templateDetails?.logo,
        branding: templateDetails?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: "You're Invited to Join Peko!",
    fallback: () => referralThrougnEmailTemplate(url, templateDetails),
  });
  // Call email function to send email with payment details in the body
  emailer.email(email, subject, body, function () {
    console.log("Email sent to " + email);
  }, sender);

  return res.status(201).json({
    status: true,
    data: {},
    message: 'Invitation has been sent successfully',
    responseCode: '000'
  })
})

//OTP for address
exports.addressOTP = asyncHandler(async (req, res, next) => {
  let { scope, method, id } = req.query
  if (method == 'delete') {
    const address = await addressDetails.findOne({
      where: {
        id: id,
        default: true // Check if it's set as default
      }
    });
    if (address) {
      return next(new ErrorResponse(`The address is set as default and cannot be deleted.`, 404));
    }
  }

  let otp
  if (scope === "email") {
    //it will create a bycrypted otp in db and return the created otp to send via email
    otp = await createOtp({ contact: req.user.email })
    if (!otp) {
      return res.status(500).json({ status: false, message: 'Failed to create OTP.', data: {}, responseCode: '001' });
    }
    let subject;
    let operation;
    switch (method) {
      case 'delete':
        subject = 'deleting';
        operation = 'delete';
        break;
      case 'update':
        subject = 'updating';
        operation = 'update';
        break;
      default:
        subject = 'adding';
        operation = 'add';
        break;
    }
    //Sending Email with otp
    let templateDetails;
  req.user.registeredBy ?
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
   :
   templateDetails = await partnerLogos()
    const { subject: emailSubject, html: emailBody, sender: emailSender } = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.ADDRESS_VERIFICATION_OTP,
      service: EMAIL_TEMPLATE_SERVICES.PROFILE,
      partnerId: req.user.registeredBy || null,
      variables: {
        username: req.user.name,
        operation,
        otpBoxesHtml: buildOtpBoxesHtml(otp),
        branding: templateDetails?.branding || 'Peko',
        ...v2LayoutVariables({
          website: templateDetails?.baseUrl || 'https://in.peko.one',
          logo: templateDetails?.logo,
          branding: templateDetails?.branding || 'Peko',
          socials: PEKO_SOCIAL_LINKS,
        }),
      },
      fallbackSubject: `Account verification OTP for ${subject} your address details`,
      fallback: () => addressOTP(req.user.name, otp, operation, templateDetails),
    });
    await emailer.email(req.user.email, emailSubject, emailBody, undefined, emailSender)
  }

  console.log("-------------------------")
  console.log("-------------------------")
  console.log("EMAIL:", otp, "------")
  console.log("-------------------------")
  console.log("-------------------------")
  //ADD OTP RESPONSE
  return res.status(200).json({
    status: true,
    message: "OTP sent successfully via email.",
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
    responseCode: '000'
  });

})

exports.getCorporateDetailsByEmailOrUsername = asyncHandler(async (req, res) => {
  try {
    const { searchText } = req.query;

    if (!searchText) {
      return res.status(400).json({ status: false, message: "Please provide searchText" });
    }

    const details = await getCorporateFullDetails({ searchText });

    if (!details || !details.corpUser) {
      return res.status(404).json({ status: false, message: "Corporate not found" });
    }

    const { cred, corpUser, activeSubscription, totalTransactions, totalSpent, firstTransactionDate, lastTransactionDate } = details;

    const scope = resolvePartnerScope(req);
    if (scope.locked && String(cred?.registeredBy ?? '') !== String(scope.partnerId)) {
      return res.status(404).json({ status: false, message: "Corporate not found" });
    }

    const responseData = {
      profile: {
        companyName: corpUser.name,
        accountId: cred.username,
        credentialId: cred.id,
        email: corpUser.email,
        phone: corpUser.mobileNo,
        joinedDate: cred.createdAt
      },
      subscription: {
        package: activeSubscription?.package?.packageName || corpUser?.package?.packageName || 'N/A',
        billing: activeSubscription?.billingType || 'N/A',
        status: activeSubscription?.status || 'N/A'
      },
      stats: {
        totalTransactions,
        totalAmountSpent: totalSpent,
        firstTransaction: firstTransactionDate ? formattedDateTime(firstTransactionDate) : 'N/A',
        lastTransaction: lastTransactionDate ? formattedDateTime(lastTransactionDate) : 'N/A'
      }
    };

    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: responseData,
      responseCode: "000"
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

exports.fetchCorporateListController = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText || "";
  const scope = resolvePartnerScope(req)
  const selectedPartnerId = scope.locked ? undefined : req.query.partnerId
  const selectedSubPartnerId = scope.locked ? undefined : req.query.subPartnerId;
  let role = "CORPORATE";
  let registeredBy = req.user.registeredBy;
  let subPartnerId = req.user.subPartnerId;

  let data = await fetchCorporateList(searchText, role, registeredBy, subPartnerId, selectedPartnerId, selectedSubPartnerId);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while fetching corporate user dropdown`, 500));
  }

  let result = data.map(item => ({
    name: item.name,
    username: item.credential?.username,
    email: item.email,
    partnerName: item.partnerName || null,
  }));

  return res.status(200).json({
    status: true,
    data: { result },
    message: 'Fetched corporate user dropdown successfully',
    responseCode: '000'
  });
});