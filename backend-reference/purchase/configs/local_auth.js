/**
 * Created by Bhatt Aasif
 **/
const { Op } = require("sequelize")
let serviceOperator = require('../models/entities/serviceOperator')
let cashback = require('../models/entities/cashback')
let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let credential = require("../models/entities/credential");
let wallet = require("../models/entities/wallet");
let {
    findOne: findOneCorporateUser
} = require("../models/use-cases/corporateUser");
const disableServices = require('../models/entities/disabledService');

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
        credential.findByPk(id, {
                attributes: [
                    "id",
                    "username",
                    "password",
                    "name",
                    "email",
                    "role",
                    "registeredBy"
                ]
            }).then(async function (user) {
                let walletDetails = await wallet.findOne({
                    where: {
                        credentialId: user.id
                    },
                    attributes: ['balance']
                })
                user.balance = walletDetails ? walletDetails.balance : 0
                if (user.role == "CORPORATE") {
                    const details = await findOneCorporateUser({
                        id: user.id
                    }, ['email', 'city', 'country'])
                    user.email = details ? details.email : ''
                    user.city = details ? details.city : ''
                    user.country = details ? details.country : ''
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
    passport.use('API_CORPORATE', new LocalStrategy(
        async function (username, password, done) {
            try {
                credential.findOne({
                    where: {
                        [Op.or]: {
                            username: username,
                            email: username
                        },
                        role: 'CORPORATE'
                    }
                }).then(async function (user) {
                    if (!user) {
                        return done(null, false)
                    }
                    if (!(user.username === username || user.email === username)) {
                        return done(null, false, {
                            errMsg: 'Incorrect username'
                        })
                    }
                    if (!user.validatePassword(password)) {
                        return done(null, false, {
                            errMsg: 'Incorrect Password'
                        })
                    } else {
                        // user.plainPassword = password
                    }
                    return done(null, user)
                })
            } catch (e) {
               console.log(e)
            }
        }
    ))
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

        const details = await findOneCorporateUser({
            id: req.user.id
        }, ['packageId', 'logo', 'kycStatus', 'isActive', 'registeredBy', 'id', 'tradeLicenseExpiry'])
        req.user['packageId'] = details ? details['packageId'] : 1
        req.user['corporateId'] = details ? details['id'] : 1
        req.user['registeredBy'] = details ? details['registeredBy'] : 1
        req.user['tradeLicenseExpiry'] = details && (details['tradeLicenseExpiry'] != null) ? details['tradeLicenseExpiry'] : 'Not Available'
        req.user['balance'] = parseFloat(req.user['balance']).toFixed(2)
        req.user['kycStatus'] = details && details['kycStatus'] ? details['kycStatus'] : 'Pending'
        req.user['logo'] = details && details['logo'] ? details['logo'].toString() : ''
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
            include: [{
                model: serviceOperator,
                attributes: ['accessKey', 'serviceCategory']
            }],
            where: {
                packageId: req.user['packageId'],
                serviceStatus: true
            },
            order: [
                ['createdAt', 'DESC']
            ],
            attributes: ['packageId'],
            raw: true,
            nest: true
        })

        let disable = await disableServices.findAll({
            include: [{
                model: serviceOperator,
                attributes: ['accessKey']
            }],
            where: {
                serviceStatus: false
            },
            order: [
                ['createdAt', 'DESC']
            ],
            attributes: ['serviceOperatorId'],
            raw: true,
            nest: true
        })

        const disableService = disable.map((dt) => dt.serviceOperator.accessKey);


        if (result) {
            // const accessKeys = result.map((dt) => dt.serviceOperator.accessKey);
            let serviceCategories = []
            const accessKeys = result
                .filter((dt) => !disableService.includes(dt.serviceOperator.accessKey))
                .map((dt) => {
                    serviceCategories.push(dt.serviceOperator.serviceCategory)
                    return dt.serviceOperator.accessKey
                });

            /*if (!serviceCategories.includes(dt.serviceOperator.serviceCategory)) serviceCategories.push(dt.serviceOperator.serviceCategory);
                    return dt.serviceOperator.accessKey
                });
               // console.log(obj)
                // const accessKeys = result
                //     .filter((dt) => !disableService.includes(dt.serviceOperator.accessKey))
                //     .map((dt) => dt.serviceOperator.accessKey);
                //req.user['services'] = obj*/
            req.user['servicesCategories'] = serviceCategories
            req.user['services'] = accessKeys
            console.log("accessKeys in the auth------", accessKeys)
            next()
        }
        // }
    } else {
        res.redirect("/system/login");
    }
};