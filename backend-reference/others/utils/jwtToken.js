/* eslint-disable no-undef */
const jwt = require('jsonwebtoken')
const {
    jwtSecret
} = require('../configs/keys.json')
const { getValue } = require('./cacheDataMethods')
const {
    findOne: findOneCorporateUser
} = require('./../models/use-cases/corporateUser')
const {
    findOneCredential
} = require('./../models/use-cases/credential')
const wallet = require('../models/entities/wallet')
let serviceOperator = require('../models/entities/serviceOperator')
const disableServices = require('../models/entities/disabledService');
let cashback = require('../models/entities/cashback')
const systemUserEntity = require('../models/entities/systemUser')
const roleAndPermissionsEntity = require('../models/entities/roleAndPermissions')

exports.signToken = async (user) => {
    
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY

    return jwt.sign({
        username: user.username, // username of credential table
        role: user.role, // role of credential table
        userId: user.id, // id of merchant table
        type: 'token'
    }, jwtSecret, {
        "issuer": "peko",
        "subject": "info@peko.work",
        "audience": "https://peko.work",
        "expiresIn": expiresIn,
        "algorithm": "HS256"
    })
}

exports.resolveSessionUser = async (req) => {
    const sessionKey = req.headers['x-user-key']
    if (!sessionKey) return null
    const cached = await getValue(`userData_${sessionKey}`)
    if (!cached) return null
    return typeof cached === 'string' ? JSON.parse(cached) : cached
}

exports.verifyToken = async (req, res, next) => {
    try {
        req.user = await exports.resolveSessionUser(req)
        if(req.user && Object.keys(req.user).length > 0){
            next()
        }else{
            return res.status(500).json({
                status: false,
                message: 'Something went wrong',
                data: {},
                responseCode: '002'
            })
        }

    } catch (err) {
        return res.status( 401).json({
            status: false,
            message: err.message,
            data: {},
            responseCode: err.message == "jwt expired"? '002':'001'
         });
    }
}

/**
 * system_user routes only. Requires verifyToken to have run first and set req.user
 * from the gateway-issued x-user-key Redis session.
 * Path :userId must match the session user id.
 */
exports.requireSystemUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access.",
                data: {},
                responseCode: "001",
            });
        }
        if (req.user?.role !== "SYSTEM_USER") {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access.",
                data: {},
                responseCode: "001",
            });
        }
        if (req.params.userId != null && String(req.params.userId) !== String(req.user.id)) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access.",
                data: {},
                responseCode: "001",
            });
        }
        return next();
    } catch (err) {
        return res.status(401).json({
            status: false,
            message: err.message || "Unauthorized access.",
            data: {},
            responseCode: "001",
        });
    }
};

/**
 * system_user routes only. Must run after requireSystemUser. Looks up the caller's
 * admin status fresh from the DB on every request — never trusts a cached/session
 * isAdmin flag — so role mutations (role edit, is-admin toggle, roleAndPermissionId
 * reassignment) can't be self-granted by a non-admin system user.
 */
exports.requireAdminSystemUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access.",
                data: {},
                responseCode: "001",
            });
        }
        const caller = await systemUserEntity.findOne({
            where: { credentialId: req.user.id },
            raw: true,
        });
        const callerRole = caller
            ? await roleAndPermissionsEntity.findOne({
                  where: { id: caller.roleAndPermissionId },
                  raw: true,
              })
            : null;
        if (!callerRole || !callerRole.isAdmin) {
            return res.status(403).json({
                status: false,
                message: "Admin privileges required.",
                data: {},
                responseCode: "001",
            });
        }
        return next();
    } catch (err) {
        return res.status(403).json({
            status: false,
            message: "Admin privileges required.",
            data: {},
            responseCode: "001",
        });
    }
};

/**
 * corporate routes only. Must run after verifyToken. The corporate router is mounted
 * as /corporate/:corporateId/others, and every resource under it (profile, beneficiary,
 * support, notification, transactions, ...) is looked up by this credentialId — so a
 * missing check here lets any corporate session read or mutate any other corporate's
 * data just by changing the URL. For a sub-corporate login, req.user.id is already the
 * parent corporate's credential (set at login), so this check is correct unchanged for
 * sub-users too — see users/utils/actingCredential.js for why that field is shaped this way.
 */
exports.requireOwnCorporate = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: false,
            message: "Unauthorized access.",
            data: {},
            responseCode: "001",
        });
    }
    if (req.params.corporateId != null && String(req.params.corporateId) !== String(req.user.id)) {
        return res.status(403).json({
            status: false,
            message: "Unauthorized access.",
            data: {},
            responseCode: "001",
        });
    }
    return next();
};

// adding req.user for webhooks
module.exports.findUserDetails = async function (userId) {
    let userDetails = await findOneCredential(
        {
            id: userId,
        },
        ["username", "name"]
    );
    let userData = {}
    userData["id"] = userId
    userData["username"] = userDetails && userDetails["username"] ? userDetails["username"] : "";
    userData["name"] = userDetails && userDetails["name"] ? userDetails["name"] : "";
    const walletDetails = await wallet.findOne({
        where: {
            credentialId: userId
        },
        attributes: ['balance']
    })
    const details = await findOneCorporateUser({
        id: userId
    }, ['packageId', 'logo', 'kycStatus', 'isActive', 'registeredBy', 'id', "email", 'tradeLicenseExpiry'])
    userData['packageId'] = details ? details['packageId'] : 1
    userData['corporateId'] = details ? details['id'] : 1
    userData['registeredBy'] = details ? details['registeredBy'] : 1
    userData['tradeLicenseExpiry'] = details && (details['tradeLicenseExpiry'] != null) ? details['tradeLicenseExpiry'] : 'Not Available'
    userData['balance'] = walletDetails && walletDetails['balance'] ? (parseFloat(walletDetails['balance']).toFixed(2)) : 0.00
    userData['kycStatus'] = details && details['kycStatus'] ? details['kycStatus'] : 'Pending'
    userData['logo'] = details && details['logo'] ? details['logo'].toString() : ''
    userData["email"] = details && details["email"] ? details["email"] : "";

    let result = await cashback.findAll({
        include: [{
            model: serviceOperator,
            attributes: ['accessKey', 'serviceCategory']
        }],
        where: {
            packageId: userData['packageId'],
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
        let serviceCategories = []
        const accessKeys = result
            .filter((dt) => !disableService.includes(dt.serviceOperator.accessKey))
            .map((dt) => {
                serviceCategories.push(dt.serviceOperator.serviceCategory)
                return dt.serviceOperator.accessKey
            });
        userData['servicesCategories'] = serviceCategories
        userData['services'] = accessKeys
    }
    return userData
}

exports.verifySystemUserToken = async (req, res, next) => {
    try {
        //let token = req.headers.authorization
        if (!req.headers.authorization) {
            return res.status(200).json({
                status: false,
                message: 'token not provided',
                data:{},
                responseCode:'001'
            })
        }
        let token = req.headers.authorization.split(' ')[1]

        const expiresIn = process.env.ACCESS_TOKEN_EXPIRY

        const verify = jwt.verify(token, jwtSecret, {
            "issuer": "peko",
            "subject": "info@peko.work",
            "audience": "https://peko.work",
            "expiresIn": expiresIn,
            "algorithm": "HS256"
        })

        const systemUserId = req.params.userId
           if(systemUserId != verify.userId){
            return res.status(401).json({
                status: false,
                message: 'Unauthorized access.',
                data: {},
                responseCode: '001'
             });
           }
      
        let userDetails = await findOneCredential({
            id: verify.userId
        }, ['username', 'name'])
        let user = {
            id: verify.userId
        }
        req.user = user

        const walletDetails = await wallet.findOne({
            where: {
                credentialId: req.user.id
            },
            attributes: ['balance']

        })
        req.user['balance'] = walletDetails && walletDetails['balance'] ? parseFloat(walletDetails['balance']).toFixed(2) : 0.00
        req.user['username'] = userDetails && userDetails['username'] ? userDetails['username'] : ''
        req.user['companyName'] = userDetails && userDetails['name'] ? userDetails['name'] : ''
        // eslint-disable-next-line no-constant-condition
        if (false && req.user['kycStatus'] != 'approved') {
            return res.status(200).json({
                success: false,
                error: `Your Kyc Status is ${req.user['kycStatus']}`
            })
        } else {
            return next();
        }

    } catch (err) {
        return res.status( 401).json({
            status: false,
            message: err.message,
            data: {},
            responseCode: err.message == "jwt expired"? '002':'001'
         });
    }
}