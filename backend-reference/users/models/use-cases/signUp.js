/* eslint-disable no-unused-vars */
const Package = require("./../entities/package");
const sequelize = require("../../configs/database/index");
const { Op } = require("sequelize");
const corporateUser = require("./../entities/corporateUser");
const credential = require("./../entities/credential");
const moment = require('moment');
const Subscription = require('./../entities/subscription')

const asyncHandler = require("./../../middlewares/async");
const wallet = require("../entities/wallet");

const {
  accountCreatedSuccessTemplate,
} = require("../../utils/emailTemplate/signUp");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../../utils/emailTemplate/sharedLayout");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS } = require("../../utils/emailTemplateKeys");
const emailer = require("../../utils/emailer");
const { authenticator } = require("otplib");
const ErrorResponse = require("../../utils/error-response");
const { fetchPartnerDetails } = require("./systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");

// The account-created email, from the admin-managed template when one is published
// and from utils/emailTemplate/signUp.js otherwise.
const sendAccountCreatedEmail = async ({ email, name, userName, partnerData, partnerId = null, logTraceId = null }) => {
  // No partner-specific baseUrl -> use this environment's own frontend, not a
  // hardcoded production URL (a staging send must not link to production).
  const envBaseUrl = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;

  const { subject, html, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.CORPORATE_ACCOUNT_CREATED,
    partnerId,
    variables: {
      name,
      userName,
      email,
      branding: partnerData?.branding || 'Peko',
      // "Login Now" target; IN has no per-partner login portal today, so this is
      // always the bare domain root — the fallback appends /auth/login itself.
      portalUrl: (partnerData?.baseUrl || envBaseUrl).replace(/\/$/, ''),
      ...v2LayoutVariables({
        website: partnerData?.baseUrl || envBaseUrl,
        logo: partnerData?.logo,
        branding: partnerData?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject: 'Congrats! Account created successfully!',
    fallback: () => accountCreatedSuccessTemplate(name, userName, email, partnerData),
    logTraceId,
  });

  emailer.email(email, subject, html, undefined, sender);
};

exports.findByAnyField = asyncHandler(async (query) => {
  return await corporateUser.findOne({
    where: query,
  });
});

exports.findUsername = asyncHandler(async (params) => {
  const results = await credential.findOne({
    where: {
      username: params,
    },
  });
  return results;
});

exports.findCorporateByAnyField = asyncHandler(async (query) => {
  return await corporateUser.findOne({
    where: query
  })
})

/**
 * Corporate lookup for social-login account linking: finds the account a matching email already
 * belongs to, so an SSO sign-in adopts it instead of creating a second record for the same person.
 *
 * Ordered oldest-first and deliberately so: email is not unique on this table, and any duplicates
 * already created by the un-linked flow must resolve to the ORIGINAL account rather than to
 * whichever row the database happens to return.
 */
exports.findCorporateForAccountLink = asyncHandler(async (query) => {
  return await corporateUser.findOne({
    where: query,
    order: [["id", "ASC"]]
  })
})

exports.findOneCredential = async ({ attributes }) => {
  return await credential.findOne({
    where: {
      role: 'CORPORATE',
      username: { [Op.regexp]: '^[0-9]+$' }
    },
    order: [['createdAt', 'DESC']],
    attributes
  });
};




// Verify TOTP token
exports.authVerification = asyncHandler(async (userId, token) => {
  const user = await corporateUser.findOne({
    where: {
      credentialId: userId,
    },
  });
  const totpSecret = user.totpSecret;
  if (!user) {
    return false;
  } else if (!totpSecret) {
    return false;
  } else {
    const valid = authenticator.check(token, totpSecret);
    if (valid) {
      return {
        valid: true,
      };
    } else {
      return false;
    }
  }
});

// eslint-disable-next-line no-unused-vars
exports.Update = asyncHandler(async (params, requestData, req = undefined) => {
  try {

    const transaction = await sequelize.transaction();

    try {
      const newPassword = await credential.hashPassword(requestData.password);
      requestData.password = newPassword
      if (!requestData.passwordHistory) {
        requestData.passwordHistory = {};
      }
      requestData.passwordHistory.currentPassword = newPassword;
      requestData.passwordDate = Date.now();
      requestData.lastLogin = Date.now();
      const details = await credential.create(
        {
          ...requestData,
          role: "CORPORATE",
        },
        {
          transaction: transaction,
        }
      );
      await wallet.create(
        {
          credentialId: details.id,
        },
        {
          transaction: transaction,
        }
      );
      let partnerId = requestData?.registeredBy ? requestData.registeredBy : null
      const packageBasic = await Package.findOne({
        where: {  packageType: 'GROUP', partnerId: partnerId , status:true },
        order: [['priorityLevel', 'ASC']], // Order by priorityLevel in asending order.
        attributes: ['id'], // Select only the 'id' attribute
        transaction,
        raw: true
       });
       const user = await corporateUser.create(
         {
           ...requestData,
           mobileNo: requestData.mobileNo,
           email: requestData.email,
           credentialId: details.id,
           packageId: packageBasic ? packageBasic.id : null,
           website: requestData.website,
           contactPersonEmail: requestData.contactPersonEmail,
           contactPersonPhone: requestData.contactPersonNumber
         },
         {
           transaction: transaction,
         }
       );
       // Create subscription
      const subscriptionStartDate = moment().startOf('day').toDate();
      const subscriptionEndDate = moment(subscriptionStartDate).add(100, 'years').endOf('day').toDate();

      await Subscription.create({
        subscriptionStartDate,
        subscriptionEndDate,
        subscriptionPrice: 0,
        subscriptionAmountPaid: 0,
        discount: 0,
        corporateUserId: user.id,
        packageId: packageBasic.id
      }, { transaction });
      await transaction.commit();

      let data;
      partnerId ?
        data = await fetchPartnerDetails(partnerId)
        :
        data = await partnerLogos()
      await sendAccountCreatedEmail({
        email: requestData.email,
        name: requestData.name,
        userName: requestData.username,
        partnerData: data,
        partnerId,
        logTraceId: req?.LogTraceId,
      });
      console.log(user, "User created and email sent.");

      // let partnerName;
      // if(!partnerId){
      //   partnerName = 'Peko UAE'
      // }else{
      //   const partnerData = await partnerDetails(partnerId);
      //   partnerName = partnerData?.name;
      // }

      // const templateParams = [requestData?.name, requestData?.contactPersonName, requestData?.email, requestData?.mobileNo, partnerName ]
      // const mobileNumbers = await getActiveWhatsAppNumbers()
      // sendWhatsAppMessagesToMultipleNumbers(mobileNumbers, templateParams)
  
      return { user, details };
    } catch (error) {
      console.error("Transaction failed and rolled back: ", error);
      await transaction.rollback();
      return new ErrorResponse("Something went wrong, please try again later.", 500);
    }


  } catch (err) {
    console.error("Error in update: ", err);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.signUpCount = asyncHandler(async (params) => {
  try {
    const count = await corporateUser.count({});
    console.log("-----------------Count---------------", count);
    return count;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to get sign-up count");
  }
});

exports.find = asyncHandler(async (params) => {
  return await corporateUser.findOne({
    where: {
      email: params.email,
      registeredBy: params.registeredBy || null,
    },
  });
});



exports.findCorporateUserByEmail = async (email) => {
  try {
      const user = await corporateUser.findOne({
          where: { email }
      });

      if (!user) {
          throw new Error("Corporate user not found");
      }

      return user;
  } catch (error) {
      console.error("Error finding corporate user by email:", error.message);
      throw new Error("Error fetching corporate user");
  }
};