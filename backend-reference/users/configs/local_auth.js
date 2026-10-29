/**
 * Created by Bhatt Aasif
 **/
const { Op } = require("sequelize");
let serviceOperator = require("../models/entities/serviceOperator");
let cashback = require("../models/entities/cashback");
let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let credential = require("../models/entities/credential");
let wallet = require("../models/entities/wallet");
const { authVerification } = require("./../models/use-cases/signUp");
let { findOne: findOneCorporateUser } = require("../models/use-cases/corporateUser");
const emailer = require("./../utils/emailer");
const sms = require("./../utils/sms");
const { commonEmailOtpVerification } = require("./../utils/templatesForEmails"); //emailTemplateForMFA (Older name)
const { otpBlockHtml } = require("../utils/emailTemplate/signUp");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../utils/emailTemplate/sharedLayout");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS } = require("../utils/emailTemplateKeys");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { partnerLogos } = require("../utils/partnerLogos");
const disableServices = require("../models/entities/disabledService");
const { verifyOtp, createOtp } = require("../models/use-cases/otp");
const { CheckLockPeriod, passwordProtections } = require("../utils/passwordPolicy");
const { findOneByCredentialId } = require("../models/use-cases/user");

/**
 * Save the user in the session
 **/

module.exports.serializeUser = function () {
  "use strict";
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
};

/**
 * Get the user from MySQL DB
 **/

module.exports.deserializeUser = function () {
  "use strict";
  passport.deserializeUser(function (id, done) {
    credential
      .findByPk(id, {
        attributes: ["id", "username", "password", "name", "email", "role", "registeredBy"],
      })
      .then(async function (user) {
        let walletDetails = await wallet.findOne({
          where: {
            credentialId: user.id,
          },
          attributes: ["balance"],
        });
        user.balance = walletDetails ? walletDetails.balance : 0;
        if (user.role == "CORPORATE") {
          const details = await findOneCorporateUser(
            {
              id: user.id,
            },
            ["email", "city", "country"]
          );
          user.email = details ? details.email : "";
          user.city = details ? details.city : "";
          user.country = details ? details.country : "";
        }
        //user.reward = walletDetails?walletDetails.cashbackBalance:0
        done(null, user);
      })
      .catch(function (err) {
        done(err, false);
      });
  });
};

/**
 * Configure the strategy passport should use
 */
module.exports.configureStrategy = function () {
  "use strict";
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
      },
      async function (req, username, password, done) {
        let otp = req.body
          ? req.body.digit1 &&
            req.body.digit2 &&
            req.body.digit3 &&
            req.body.digit4 &&
            req.body.digit5 &&
            req.body.digit6
            ? req.body.digit1 +
              req.body.digit2 +
              req.body.digit3 +
              req.body.digit4 +
              req.body.digit5 +
              req.body.digit6
            : undefined
          : undefined;
        credential
          .findOne({
            where: {
              [Op.or]: {
                username: username,
                email: username,
              },
            },
            attributes: [
              "id",
              "username",
              "password",
              "name",
              "email",
              "role",
              "registeredBy",
            ],
          })
          .then(async function (user) {
            //console.log("local_auth - User", user)
            if (!user) {
              return done(null, false, {
                errMsg: "Sorry, Invalid username or password",
              });
            }

            if (!user.validatePassword(password)) {
              return done(null, false, {
                // errMsg: "Password does not match"
                errMsg: "Sorry, Invalid username or password",
              });
            }
            if (user.role == "CORPORATE") {
              const details = await findOneCorporateUser(
                {
                  id: user.id,
                },
                [
                  "isActive",
                  "isMFA",
                  "sendMfaCodeToEmail",
                  "sendMfaCodeToPhone",
                  "sendMfaCodeToAuthApp",
                  "mobileNo",
                  "email",
                ]
              );
              if (!details.isActive) {
                return done(null, false, {
                  errMsg: "Account Inactive",
                });
              }
              let mobileNo = details.mobileNo,
                sentToEmail = 0,
                sentToAuthApp = 0,
                sentToPhone = 0;
              if (otp == undefined) {
                if (details.isMFA) {
                  // here is create otp use case for creatig otp , it takes email/phone number as a args and do all the
                  // working related to creating / updating if already exisits and return the created otp
                  let newOtp = await createOtp({
                    contact: details.mobileNo,
                  });

                  if (newOtp) {
                    let otpMessage = "";
                    if (details.isMFA) {
                      if (details.sendMfaCodeToEmail) {
                        //send code to email
                        const partnerData = user.registeredBy
                          ? await fetchPartnerDetails(user.registeredBy)
                          : await partnerLogos();
                        const { subject: mfaSubject, html: emailBody, sender: mfaSender } = await resolveEmailTemplate({
                          key: EMAIL_TEMPLATE_KEYS.OTP_VERIFICATION,
                          partnerId: user.registeredBy || null,
                          variables: {
                            name: user.name,
                            branding: partnerData?.branding || 'Peko',
                            otpHtml: otpBlockHtml(newOtp),
                            ...v2LayoutVariables({
                              website: partnerData?.baseUrl || 'https://in.peko.one',
                              logo: partnerData?.logo,
                              branding: partnerData?.branding || 'Peko',
                              socials: PEKO_SOCIAL_LINKS,
                            }),
                          },
                          fallbackSubject: "Multi-Factor Authentication Code for Login",
                          fallback: () => commonEmailOtpVerification({ otp: newOtp, name: user.name, partnerDetails: partnerData }),
                        });
                        emailer.email(
                          details.email,
                          mfaSubject,
                          emailBody,
                          undefined,
                          mfaSender
                        );
                        otpMessage =
                          "Auth Code has been sent to your email successfully.";
                        sentToEmail = 1;

                      }
                      if (details.sendMfaCodeToPhone) {
                        sms.sendSMS(
                          details.mobileNo,
                          "Your Multi Factor Authentication Code is:  " + newOtp
                        );
                        otpMessage =
                          "Auth Code has been sent to your registered Mobile No successfully.";
                        sentToPhone = 1;

                      }
                      if (details.sendMfaCodeToAuthApp) {
                        otpMessage =
                          "Auth code has been sent to your device successfully.";
                        sentToAuthApp = 1;
                      }
                    }

                    return done(null, false, {
                      errMsg: otpMessage,
                      sentToEmail,
                      sentToPhone,
                      sentToAuthApp,
                    });
                  }
                }
              } else if (otp != undefined) {
                if (
                  details.sendMfaCodeToPhone == 1 ||
                  details.sendMfaCodeToEmail == 1
                ) {
                  //verify otp

                  // this verifyOtp fun return an obj with isVerified and a message if it fails
                  let response = await verifyOtp({
                    contact: mobileNo,
                    otp: otp,
                  });

                  if (response.isVerified === false) {
                    return done(null, false, {
                      errMsg: response.message,
                    });
                  }
                } else {
                  const isValid = await authVerification(user.id, otp);
                  if (!isValid) {
                    return done(null, false, {
                      errMsg: "Auth Code Invalid",
                    });
                  }
                }
              }
            }
            return done(null, user);
          });
      }
    )
  );
  passport.use(
    "API_CORPORATE",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: 'username', passwordField: 'password' },
      async function (req, username, password, done) {
        const partnerId = req.body.partnerId || null;
      username = username.toLowerCase();
      try {
        const user = await credential.findOne({
          where: {
            role: {
              [Op.or]: ["CORPORATE", "SYSTEM_USER", "CORPORATE_SUB_USER", "USER"]
            },
            [Op.or]: [
              { username: username },
              { email: username },
            ],
            registeredBy: partnerId
          }
        });
        if (!user) {
          return done(null, false,{
            errMsg: "Account not found",
          });
        }

        if (!(user.username === username || user.email === username)) {
          return done(null, false, {
            errMsg: "Invalid Username",
          });
        }
        if (user.role === "USER" && !user.password && !(user.passwordHistory && user.passwordHistory.currentPassword)) {
          return done(null, false, {
            errMsg: "No password has been set for this account yet. Please use the set-password link sent to your email.",
          });
        }
        if (!user.validatePassword(password)) {
          try {
            await passwordProtections(user);
          } catch (err) {
            console.error("Password protection error:", err);
            return done(null, false, {
              errMsg: err.message,
            });
          }
        }
        if (user.lockPeriod) {
          try{
           await CheckLockPeriod(user)
          }catch(err){
             return done(null, false, {
            errMsg: err.message,
          });
          }
         
        }
        // if (user.role==='CORPORATE'&&await checkDate(user.passwordDate)) {
        //   return done(null, false, {
        //     errMsg:"password expired",
        //     maxPassWordAge: true,
        //   });
        // }
        if (user.role === "USER") {
          const essProfile = await findOneByCredentialId(user.id, ["isActive"]);
          if (essProfile && essProfile.isActive === false) {
            return done(null, false, {
              errMsg: "Your account access has been revoked. Please contact your company administrator for further assistance.",
            });
          }
        }
        // Reset loginAttempts on successful login
        await user.update({
          loginAttempts: 0,
          lockPeriod: null,
          firstLoginAttempt: null,
        });

        return done(null, user);
      } catch (e) {
        console.log(e);
        return done(null, false, {
          errMsg: "Something went wrong, please try again later",
        });
      }
    })
  );
};

module.exports.ensureAdminAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "ADMIN") {
    return next();
  }
  res.redirect("/system/login");
};

module.exports.ensurePartnerAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "PARTNER") {
    return next();
  }
  res.redirect("/system/login");
};

module.exports.ensureInvestorAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "INVESTOR") {
    return next();
  }
  res.redirect("/system/login");
};

module.exports.ensureVendorAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "VENDOR") {
    return next();
  }
  res.redirect("/system/login");
};

module.exports.ensurePartnerAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "PARTNER") {
    return next();
  }
  res.redirect("/system/login");
};

module.exports.ensureSupportAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "SUPPORT") {
    return next();
  }
  res.redirect("/system/login");
};

module.exports.ensureEcomManagerAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "ECOM_MANAGER") {
    return next();
  }
  res.redirect("/system/login");
};

module.exports.ensureCorporateAuthenticated = async (req, res, next) => {
  "use strict";
  if (req.isAuthenticated() && req.user.role === "CORPORATE") {
    const details = await findOneCorporateUser(
      {
        id: req.user.id,
      },
      ["packageId", "logo", "kycStatus", "isActive", "registeredBy", "id", "tradeLicenseExpiry"]
    );
    req.user["packageId"] = details ? details["packageId"] : 1;
    req.user["corporateId"] = details ? details["id"] : 1;
    req.user["registeredBy"] = details ? details["registeredBy"] : 1;
    req.user["tradeLicenseExpiry"] = details && details["tradeLicenseExpiry"] != null ? details["tradeLicenseExpiry"] : "Not Available";
    req.user["balance"] = parseFloat(req.user["balance"]).toFixed(2);
    req.user["kycStatus"] = details && details["kycStatus"] ? details["kycStatus"] : "Pending";
    req.user["logo"] = details && details["logo"] ? details["logo"].toString() : "";
    // if (req.user['kycStatus'] != 'approved' && req.originalUrl.indexOf('/system/corporate/profile') != 0) {
    //     res.render('corporate/profile', {
    //         user: req.user,
    //         partials: {
    //             navbar: './partials/corporate_navbar'
    //         },
    //         _csrfToken: req.csrfToken()
    //     })
    // } else {
    let result = await cashback.findAll({
      include: [
        {
          model: serviceOperator,
          attributes: ["accessKey", "serviceCategory"],
        },
      ],
      where: {
        packageId: req.user["packageId"],
        serviceStatus: true,
      },
      order: [["createdAt", "DESC"]],
      attributes: ["packageId"],
      raw: true,
      nest: true,
    });

    let disable = await disableServices.findAll({
      include: [
        {
          model: serviceOperator,
          attributes: ["accessKey"],
        },
      ],
      where: {
        serviceStatus: false,
      },
      order: [["createdAt", "DESC"]],
      attributes: ["serviceOperatorId"],
      raw: true,
      nest: true,
    });

    const disableService = disable.map((dt) => dt.serviceOperator.accessKey);

    console.log("disableServices in the auth------", disableService);

    if (result) {
      // const accessKeys = result.map((dt) => dt.serviceOperator.accessKey);
      let serviceCategories = [];
      const accessKeys = result
        .filter((dt) => !disableService.includes(dt.serviceOperator.accessKey))
        .map((dt) => {
          serviceCategories.push(dt.serviceOperator.serviceCategory);
          return dt.serviceOperator.accessKey;
        });

      /*if (!serviceCategories.includes(dt.serviceOperator.serviceCategory)) serviceCategories.push(dt.serviceOperator.serviceCategory);
                    return dt.serviceOperator.accessKey
                });
               // console.log(obj)
                // const accessKeys = result
                //     .filter((dt) => !disableService.includes(dt.serviceOperator.accessKey))
                //     .map((dt) => dt.serviceOperator.accessKey);
                //req.user['services'] = obj*/
      req.user["servicesCategories"] = serviceCategories;
      req.user["services"] = accessKeys;
      console.log("accessKeys in the auth------", accessKeys);
      next();
    }
    // }
  } else {
    res.redirect("/system/login");
  }
};
