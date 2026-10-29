/* eslint-disable no-undef */
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
const wallet = require('../models/entities/wallet')
let serviceOperator = require('../models/entities/serviceOperator')
const disableServices = require('../models/entities/disabledService');
let cashback = require('../models/entities/cashback')
const { getValue } = require('./cacheDataMethods')

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