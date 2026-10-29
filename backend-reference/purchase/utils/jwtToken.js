/* eslint-disable no-undef */
/* eslint-disable no-constant-condition */
const jwt = require('jsonwebtoken')
const {
    jwtSecret
} = require('../configs/keys.json')
const {
    findOne: findOneCorporateUser
} = require('./../models/use-cases/corporateUser')
const {
    findOneCredential
} = require('./../models/use-cases/credential')
const { getValue } = require('./cacheDataMethods')
const wallet = require('../models/entities/wallet')
let serviceOperator = require('../models/entities/serviceOperator')
const disableServices = require('../models/entities/disabledService');
let cashback = require('../models/entities/cashback')

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
    if (sessionKey) {
        const cached = await getValue(`userData_${sessionKey}`)
        if (!cached) return null
        return typeof cached === 'string' ? JSON.parse(cached) : cached
    }
    const { userdata } = req.headers
    if (!userdata) return null
    return JSON.parse(decodeURI(userdata))
}

exports.verifyToken = async (req, res, next) => {
    try {
        req.user = await exports.resolveSessionUser(req)
        if (!req.user) {
            return res.status(401).json({
                status: false,
                message: 'Session expired or invalid',
                data: {},
                responseCode: '002'
            })
        }
        next()

    } catch (err) {
        return res.status(401).json({
            status: false,
            message: err.message,
            data: {},
            responseCode: err.message == "jwt expired"? '002':'001'
         });
    }
}

/**
 * system_user routes only. Role comes from gateway Redis session (userdata header).
 * Path :userId must match the session user id.
 */
exports.requireSystemUser = async (req, res, next) => {
    try {
        if (!req.user) {
            req.user = await exports.resolveSessionUser(req);
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
        req.user['name'] = userDetails && userDetails['name'] ? userDetails['name'] : ''
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

module.exports.generateJwtTokenPaytm = async function (clientId, clientSecret, jwtSigningKey) {
    try {
        const claims = {
            client_id: clientId,
            client_secret: clientSecret,
          };
          const now = Math.floor(Date.now() / 1000);
      const expiryDateUTC = now + 7 * 24 * 60 * 60; // 7 days
    
      return jwt.sign(claims, jwtSigningKey, {
        algorithm: 'HS256',
        expiresIn: expiryDateUTC,
      });
    
    } catch (error) {
        console.log(error);
        return false;
    }
    
}