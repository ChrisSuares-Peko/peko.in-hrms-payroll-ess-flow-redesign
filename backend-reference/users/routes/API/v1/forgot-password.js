"use strict";
const express = require("express");
const router = express.Router();
const async = require("async");
const User = require("../../../models/entities/credential");
const systemUser = require("../../../models/entities/systemUser");
const corporateUser = require("../../../models/entities/corporateUser");
const subCorporateUser = require("../../../models/entities/subCorporateUsers");
const essUser = require("../../../models/entities/user");
const emailer = require("../../../utils/emailer");
const { customLog } = require("../../../utils/loggerHelper");
const {
  validatePassword,
  validatePasswordPolicy,
  countCharacterDifferences,
  validateBannedPasswordForNewUser,
  passwordProtections,
  CheckLockPeriod,
} = require("../../../utils/passwordPolicy");
const {

  validateForgotPasswordPost,
  validateForgotPassword,
  validatePasswordExpiryReset

} = require("../../../utils/apiValidation");
const ErrorResponse = require("../../../utils/error-response");


const { resetPasswordUrlTemplate,resetPasswordSuccessTemplate } = require("../../../utils/emailTemplate/password");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../../../utils/emailTemplate/sharedLayout");
const { resolveEmailTemplate } = require("../../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS } = require("../../../utils/emailTemplateKeys");

const crypto = require("crypto");
const { Op } = require("sequelize");
const { fetchPartnerDetails } = require("../../../models/use-cases/systemUser");
const { generalDailyRateLimiter, RateLimiter } = require("../../../middlewares/ratelimit");
const { resolveFrontendBaseUrl } = require("../../../utils/trustedFrontendUrl");






router.post("/forgotPassword", generalDailyRateLimiter("body_username"), validateForgotPassword, async (req, res) => {
  try {
    const USERNAME = req.body.username;
    const registeredBy = req.body.partnerId || null;

    if (!USERNAME) {
      return res.status(400).json({
        status: false,
        message: "Request parameters are invalid",
        data: {},
        responseCode: "001",
      });
    }

    const userData = await User.findOne({
      where: {
        [Op.or]: [{ username: USERNAME }, { email: USERNAME }],
        registeredBy: registeredBy,
      },
      attributes: ["id", "name", "role", "username", "registeredBy"],
    });
    if (!userData || userData.length < 1) {
      return res.status(404).json({
        status: false,
        message: "We couldn't find an account associated with that email address.",
        data: {},
        responseCode: "001",
      });
    }
    
    let emailId, userDetails;
    if (userData.role === "SYSTEM_USER" || userData.role === "PARTNER") {
      userDetails = await systemUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["email"],
      });
    } else if (userData.role === "CORPORATE_SUB_USER") {
      userDetails = await subCorporateUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["email", "isDeleted", "status"],
      });

      if (userDetails.isDeleted || userDetails.status === "INACTIVE") {
        return res.status(401).json({
          status: false,
          message: "Account Not Found - Contact administrator for assistance.",
          data: {},
          responseCode: "001",
        });
      }
    } else if (userData.role === "USER") {
      userDetails = await essUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["email", "isActive"],
      });
    } else {
      userDetails = await corporateUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["email", "isActive"],
      });
    }

    if (!userDetails || userDetails.length < 1) {
      return res.status(404).json({
        status: false,
        message: "Sorry, user doesn't exist",
        data: {},
        responseCode: "001",
      });
    }

    if (userData.role !== "CORPORATE_SUB_USER" && !userDetails.isActive) {
      return res.status(401).json({
        status: false,
        message: "Account Inactive - Contact administrator for assistance.",
        data: {},
        responseCode: "001",
      });
    }

    emailId = userDetails.email;
    const baseUrl = await resolveFrontendBaseUrl(req.body.baseUrl, userData.registeredBy);

    async.waterfall(
      [
        function (done) {
          crypto.randomBytes(16, (err, buf) => {
            if (err) {
              console.error("Error generating token:", err);
              return done(err);
            }
            done(null, buf.toString("hex"));
          });
        },
        async function (token) {
          const agentUpdate = {
            passwordResetToken: token,
            passwordResetExpires: Date.now() + 3600000, // 1 hour expiration
          };

          let data;
          data = await fetchPartnerDetails(userData.registeredBy)
          const resetUrl = `${baseUrl}/reset-password?token=${token}&username=${userData.username}&isForgot=true`;

          const { subject: resetSubject, html: resetHtml, sender: resetSender } = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.RESET_PASSWORD,
            partnerId: userData?.registeredBy || null,
            variables: {
              name: userData?.name,
              resetUrl,
              branding: data?.branding || 'Peko',
              ...v2LayoutVariables({
                website: data?.baseUrl || 'https://in.peko.one',
                logo: data?.logo,
                branding: data?.branding || 'Peko',
                socials: PEKO_SOCIAL_LINKS,
              }),
            },
            fallbackSubject: "Reset your password",
            fallback: () => resetPasswordUrlTemplate(userData, resetUrl, data),
            logTraceId: req?.LogTraceId,
          });

          await User.update(agentUpdate, { where: { username: userData.username } });

          // Sending email and SMS in parallel
          async.parallel(
            [
              function (callback) {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + emailId })
                // console.log("Sending Email...",emailId);
                emailer.email(emailId, resetSubject, resetHtml, callback, resetSender);
              },
              function (callback) {
                customLog(req?.LogTraceId, "info", { message: "SMS sent!!!!" })
                // Add SMS sending logic if needed
                callback(null, "SMS sent"); // Example callback
              },
            ],
            function (err) {
              if (err) {
                customLog(req?.LogTraceId, "error", { err })
                // console.error("Error in email/SMS sending:", err);
              }
            }
          );

          return res.status(200).json({
            status: true,
            message: "Email Sent! Password Reset Link has been sent to your email.",
            data: {},
            responseCode: "000",
          });
        },
      ],
      function (err) {
        if (err) {
          customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
         
          return res.status(500).json({
            status: false,
            message: "Internal server error during forgot password process.",
            data: {},
            responseCode: "001",
          });
        }
      }
    );
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
      data: {},
      responseCode: "001",
    });
  }
});
// router.post("/resetPassword",validateForgotPasswordPost, async (req, res, next) => {
//   let USERNAME = req.body.username;
//   let isForgot = req.body.isForgot == "true" ? true : false;
//   let subject = isForgot ? "Password reset successfully!" : "Password created successfully!";
//   let message = isForgot
//     ? "Password Reset Successful!"
//     : "Password Set Successfully!";
//   let passwordSetOrChanged = isForgot
//     ? "Password reset successfully!"
//     : "Password created successfully!";
//   let isChangedOrSet = isForgot ? "reset" : "created";
//   try {
//     const userData = await User.findOne({
//       where: {
//         passwordResetToken: req.body.token,
//         passwordResetExpires: {
//           [Op.gt]: Date.now(),
//         },
//       },
//       attributes: [
//         "id",
//         "username",
//         "name",
//         "role",
//         "email",
//         "passwordHistory",
//         "password",
//         "passwordProtection",
//         "registeredBy"
//       ],
//     });

//     if (!userData || userData.length < 1) {
//       return res.status(400).send({
//         status: false,
//         data: {},
//         responseCode: "001",
//         message:
//           "Your password reset request has expired. Go back to Forgot Password toagain.",
//       });
//     } else {
//       try {
//         const corporateData = await corporateUser.findOne({
//           where: {
//             credentialId: userData.id,
//           },
//           attributes: ["email", "mobileNo", "firstName", "lastName", "name"],
//         });
//         if (userData.passwordProtection) {
//           await validatePasswordPolicy(req.body.password);
//           if (isForgot) {
//             await validatePassword(req.body.password, userData,isForgot);
//           }else{
//             await validateBannedPasswordForNewUser(req.body.password, userData,isForgot);
//           }
//         }
//       } catch (error) {
//         console.log("🚀 ~ error:", error);
//         return next(new ErrorResponse(error.message, 400));
//       }
//       const newPassword = User.hashPassword(req.body.password);
//       var agentUpdate = {
//         password: newPassword,
//         passwordHistory: {
//           currentPassword: newPassword,
//           previousPasswords: [
//             ...userData.passwordHistory.previousPasswords,
//             userData.password,
//           ],
//         },
//         passwordResetToken: null,
//         passwordResetExpires: null,
//         passwordDate: Date.now(),
//       };
//       // let filePath, webUrl
//       // let environment = process.env.NODE_ENV
//       // if (environment === 'production') {
//       //   filePath = process.env.PRODUCTION_URL + '/assets/images/logo/peko.png'
//       //   webUrl = process.env.PRODUCTION_URL
//       // } else {
//       //   filePath = process.env.STAGING_URL + '/assets/images/logo/logo.png'
//       //   webUrl = process.env.STAGING_URL
//       // }
//       const logo = await partnerLogos(userData?.registeredBy);
//       let emailBody = await resetPasswordSuccessTemplate(
//         userData,
//         passwordSetOrChanged,
//         isChangedOrSet,
//         logo
//       );
//       // Updating Email after Successfully Sent
//       var functionToCall = function () {
//         User.update(agentUpdate, {
//           where: {
//             username: USERNAME,
//           },
//         }).then(function (user) {
//           let response = {
//             status: true,
//             responseCode: "000",
//             message: message,
//             data: {},
//           };
//           return res.status(200).json(response);
//         });
//       };
//       let userDetails;
//       if (userData["role"] == "SYSTEM_USER") {
//         userDetails = await systemUser.findOne({
//           where: {
//             credentialId: userData["id"],
//           },
//           attributes: ["email"],
//         });
//       } else if (userData["role"] == "CORPORATE") {
//         userDetails = await corporateUser.findOne({
//           where: {
//             credentialId: userData["id"],
//           },
//           attributes: ["email","isPendingBotSignup","id"],
//         });

//         // for whatsapp bot registration
//         if (userDetails) {
//           userDetails.isPendingBotSignup = false; 
//           await userDetails.save();
//         }
//       } else if (userData["role"] == "CORPORATE_SUB_USER") {
//         userDetails = await subCorporateUser.findOne({
//           where: {
//             credentialId: userData["id"],
//           },
//           attributes: ["id", "email"],
//         });
//         if (userDetails) {
//           userDetails.status = 'ACTIVE';
//           await userDetails.save();
//         }
//       } else {
//         userDetails = await systemUser.findOne({
//           where: {
//             credentialId: userData["id"],
//           },
//           attributes: ["email"],
//         });
//       }
//       async.parallel(
//         [
//           function () {
//             // Sending Email
//             emailer.email(
//               userDetails.email,
//               subject,
//               emailBody,
//               functionToCall
//             );
//           },
//           function () {
//             console.log("SMS Sent!!!!!!");
//             // sms.sendSMS(user.phoneNo, "Dear " + user.firstName + ". Your new password is " + newPassword);
//           },
//         ],
//         function (error) {
//           console.log(error);
//         }
//       );
//     }
//   } catch (err) {
//     console.log(err);
//     let response = {
//       status: false,
//       responseCode: "001",
//       message: err,
//       data: {},
//     };
//     return res.status(400).json(response);
//   }
// }
// );


router.post("/resetPassword", validateForgotPasswordPost, async (req, res, next) => {
  let isForgot = req.body.isForgot === "true";
  let subject = isForgot ? "Password reset successfully!" : "Password created successfully!";
  let message = isForgot ? "Password Reset Successful!" : "Password Set Successfully!";
  let passwordSetOrChanged = isForgot ? "Password reset successfully!" : "Password created successfully!";
  let isChangedOrSet = isForgot ? "reset" : "created";

  try {
    const userData = await User.findOne({
      where: {
        passwordResetToken: req.body.token,
        passwordResetExpires: {
          [Op.gt]: Date.now(),
        },
      },
      attributes: [
        "id",
        "username",
        "name",
        "role",
        "email",
        "passwordHistory",
        "password",
        "passwordProtection",
        "registeredBy",
      ],
    });

    if (!userData) {
      return res.status(400).json({
        status: false,
        data: {},
        responseCode: "001",
        message: "Your password reset request has expired. Go back to Forgot Password to reset again.",
      });
    }

    try {
      // const corporateData = await corporateUser.findOne({
      //   where: { credentialId: userData.id },
      //   attributes: ["email", "mobileNo", "firstName", "lastName", "name"],
      // });

      if (userData.passwordProtection) {
        await validatePasswordPolicy(req.body.password);
        if (isForgot) {
          await validatePassword(req.body.password, userData, isForgot);
        } else {
          await validateBannedPasswordForNewUser(req.body.password, userData, isForgot);
        }
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return next(new ErrorResponse(error.message, 400));
    }

    // Prepare new password history
    const newPassword = User.hashPassword(req.body.password);
    const previousPasswords = userData.passwordHistory?.previousPasswords || [];

    const agentUpdate = {
      password: newPassword,
      passwordHistory: {
        currentPassword: newPassword,
        previousPasswords: [...previousPasswords, userData.password],
      },
      passwordResetToken: null,
      passwordResetExpires: null,
      passwordDate: Date.now(),
    };
    let data;
    data = await fetchPartnerDetails(userData.registeredBy)

    const { subject: resolvedSubject, html: emailBody, sender: resolvedSender } = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.RESET_PASSWORD_SUCCESS,
      partnerId: userData?.registeredBy || null,
      variables: {
        name: userData?.name,
        email: userData?.email,
        username: userData?.username,
        passwordHeading: passwordSetOrChanged,
        changedOrSet: isChangedOrSet,
        branding: data?.branding || 'Peko',
        ...v2LayoutVariables({
          website: data?.baseUrl || 'https://in.peko.one',
          logo: data?.logo,
          branding: data?.branding || 'Peko',
          socials: PEKO_SOCIAL_LINKS,
        }),
      },
      fallbackSubject: subject,
      fallback: () => resetPasswordSuccessTemplate(userData, passwordSetOrChanged, isChangedOrSet, data),
      logTraceId: req?.LogTraceId,
    });

    // Update user after sending email
    const functionToCall = function () {
      User.update(agentUpdate, {
        where: { id: userData.id },
      }).then(() =>
        res.status(200).json({
          status: true,
          responseCode: "000",
          message: message,
          data: {},
        })
      );
    };

    let userDetails;
    if (userData.role === "SYSTEM_USER") {
      userDetails = await systemUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["email"],
      });
    } else if (userData.role === "CORPORATE") {
      userDetails = await corporateUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["email",  "id"],
      });

      if (userDetails) {
        
        await userDetails.save();
      }
    } else if (userData.role === "CORPORATE_SUB_USER") {
      userDetails = await subCorporateUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["id", "email"],
      });
      if (userDetails) {
        userDetails.status = "ACTIVE";
        await userDetails.save();
      }
    } else if (userData.role === "USER") {
      userDetails = await essUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["id", "email"],
      });
    } else {
      userDetails = await systemUser.findOne({
        where: { credentialId: userData.id },
        attributes: ["email"],
      });
    }

    async.parallel(
      [
        function () {
          emailer.email(userDetails.email, resolvedSubject, emailBody, functionToCall, resolvedSender);
        },
        function () {
          customLog(req?.LogTraceId, "info", { message: "send" })
        },
      ],
      (error) => {
        if (error) customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      }
    );
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
    return res.status(400).json({
      status: false,
      responseCode: "001",
      message: err.message || "Internal server error",
      data: {},
    });
  }
});

router.post("/checkTokenValidity", async (req, res) => {
  try {
    const userData = await User.findOne({
      where: {
        username: req.body.username,
        passwordResetToken: req.body.token,
        passwordResetExpires: {
          [Op.gt]: Date.now(),
        },
      },
      attributes: [
        "id",
        "username",
        "name",
        "role",
        "email",
        "passwordHistory",
        "password",
        "passwordProtection",
      ],
    });

    if (!userData || userData.length < 1) {
      return res.status(200).send({
        status: false,
        data: {
          validToken: false,
        },
        responseCode: "000",
        message:
          "The token you provided is invalid,Go back to Forgot Password to try again.",
      });
    } else {
      res.status(200).send({
        status: false,
        data: {
          validToken: true,
        },
        responseCode: "000",
        message:
          "he token you provided is valid.",
      });
    }
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
    let response = {
      status: false,
      responseCode: "001",
      message: err,
      data: {},
    };
    return res.status(400).json(response);
  }
});


// Public route that checks the current password, so it gets the same lockout as /login plus its own
// per-account throttle — otherwise it is an unthrottled password-guessing oracle.
const passwordExpiryResetLimiter = RateLimiter({
  keyBy: "body_username",
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many attempts. Please try again later.",
});
const INVALID_CREDENTIALS_MESSAGE = "Invalid username or password";

router.post("/passwordExpiryReset", passwordExpiryResetLimiter, validatePasswordExpiryReset, async (req, res, next) => {
  let USERNAME = req.body.username;
  let subject = "Password reset successfully";
  let message = "Password reset successfully!";
  let passwordSetOrChanged = "REDACTED";
  let isChangedOrSet = "reset";
  try {
    const userData = await User.findOne({
      where: {
        [Op.or]: [
          { username: USERNAME, role: "CORPORATE" },
          { email: USERNAME, role: "CORPORATE" },
          { username: USERNAME, role: "SYSTEM_USER" },
          { email: USERNAME, role: "SYSTEM_USER" },
          { username: USERNAME, role: "USER" },
          { email: USERNAME, role: "USER" },
        ],
      },
      attributes: [
        "id",
        "username",
        "name",
        "role",
        "passwordHistory",
        "password",
        "passwordProtection",
        "registeredBy",
        "loginAttempts",
        "lockPeriod",
        "firstLoginAttempt",
      ],
    });

    if (!userData || userData.length < 1) {
      return res.status(400).send({
        status: false,
        data: {},
        responseCode: "001",
        message: INVALID_CREDENTIALS_MESSAGE,
      });
    }
    if (!userData.validatePassword(req.body.password)) {
      // Counts the failure and locks the account exactly as a failed /login does.
      let message = INVALID_CREDENTIALS_MESSAGE;
      try {
        await passwordProtections(userData);
      } catch (error) {
        if (error?.message && error.message !== "Incorrect Password") message = error.message;
      }
      return res.status(400).send({
        status: false,
        data: {},
        responseCode: "001",
        message,
      });
    }
    if (userData.lockPeriod) {
      try {
        await CheckLockPeriod(userData);
      } catch (error) {
        return res.status(400).send({
          status: false,
          data: {},
          responseCode: "001",
          message: "Account Locked: Exceeded login attempts.Please try again after some time.",
        });
      }
    }
    try {
      if (userData.passwordProtection) {
        await validatePasswordPolicy(req.body.newPassword);
        await validatePassword(req.body.newPassword, userData);
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return next(new ErrorResponse(error.message, 400));
    }
    if (
      !(await countCharacterDifferences(
        req.body.password,
        req.body.newPassword
      ))
    ) {
      return res.status(400).send({
        status: false,
        data: {},
        responseCode: "001",
        message: "Your current and previous passwords seem similar.",
      });
    }
    const newPassword = User.hashPassword(req.body.newPassword);
    var agentUpdate = {
      password: newPassword,
      passwordHistory: {
        currentPassword: newPassword,
        previousPasswords: [
          ...(userData.passwordHistory?.previousPasswords || []),
          userData.password,
        ],
      },
      passwordDate: new Date(Date.now()),
      loginAttempts: 0,
      lockPeriod: null,
      firstLoginAttempt: null,
    };
    let data = await fetchPartnerDetails(userData.registeredBy)
    let emailBody = await resetPasswordSuccessTemplate(
      userData,
      passwordSetOrChanged,
      isChangedOrSet,
      data
    );
    await userData.update(agentUpdate);
    // Updating Email after Successfully Sent
    var func = function () {
      let response = {
        status: true,
        responseCode: "000",
        message: message,
        data: {},
      };
      customLog(req?.LogTraceId, "info", { message: "send" })
      return res.send(response);
    };
    let userDetails;
    if (userData["role"] == "SYSTEM_USER") {
      userDetails = await systemUser.findOne({
        where: {
          credentialId: userData["id"],
        },
        attributes: ["email"],
      });
    } else if (userData["role"] == "CORPORATE") {
      customLog(req?.LogTraceId, "info", { message: "corporate" })
      userDetails = await corporateUser.findOne({
        where: {
          credentialId: userData["id"],
        },
        attributes: ["email"],
      });
    } else if (userData["role"] == "USER") {
      customLog(req?.LogTraceId, "info", { message: "user" })
      userDetails = await essUser.findOne({
        where: {
          credentialId: userData["id"],
        },
        attributes: ["email"],
      });
    } else {
      customLog(req?.LogTraceId, "info", { message: "system user" })
      userDetails = await systemUser.findOne({
        where: {
          credentialId: userData["id"],
        },
        attributes: ["email"],
      });
    }
    async.parallel(
      [
        function () {
          customLog(req?.LogTraceId, "info", { message: "Email Sent!!!!!" })
          // Sending Email
          emailer.email(userDetails.email, subject, emailBody, func);
        },
        function () {
          customLog(req?.LogTraceId, "info", { message: "SMS Sent!!!!!" })
        },
      ],
      function (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      }
    );
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
    let response = {
      status: false,
      responseCode: "001",
      message: err,
      data: {},
    };
    return res.status(400).send(response);
  }
});

module.exports = router;
