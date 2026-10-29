/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const corporateUser = require('./../entities/corporateUser');
const wallets = require('../entities/wallet')
const credential = require('./../entities/credential')
const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async')
const wallet = require("../entities/wallet");

const packAge = require("../entities/package");
const { uploadFile } = require('../../utils/commonUploadFile');

exports.update = asyncHandler(async (params, data) => {
    let docRes = {};
    if (Object.prototype.hasOwnProperty.call(data, "profileImageBase") && data.profileImageFormat) {
      const publicUrl = await uploadFile(data.profileImageBase, "profile", data.profileImageFormat);
      data.logo = publicUrl;
      docRes.logo = publicUrl;
    }
    if (Object.prototype.hasOwnProperty.call(data, "tradeLicenseDoc") && data.trdLcnFormat) {
      const publicUrl = await uploadFile(data.tradeLicenseDoc, "kyc", data.trdLcnFormat);
      data.tradeLicenseDoc = publicUrl;
      data.kycStatus = "underReview";
      docRes.tradeLicenseDoc = publicUrl;
    }
    if (Object.prototype.hasOwnProperty.call(data, "panDoc") && data.panFormat) {
      const publicUrl = await uploadFile(data.panDoc, "kyc", data.panFormat);
      data.panDoc = publicUrl;
      data.kycStatus = "underReview";
      docRes.panDoc = publicUrl;
    }
    if (Object.prototype.hasOwnProperty.call(data, "tanDoc") && data.tanFormat) {
      const publicUrl = await uploadFile(data.tanDoc, "kyc", data.tanFormat);
      data.tanDoc = publicUrl;
      data.kycStatus = "underReview";
      docRes.tanDoc = publicUrl;
    }  
    if (Object.prototype.hasOwnProperty.call(data, "gstDoc") && data.gstFormat) {
      const publicUrl = await uploadFile(data.gstDoc, "kyc", data.gstFormat);
      data.gstDoc = publicUrl;
      data.kycStatus = "underReview";
      docRes.gstDoc = publicUrl;
    }
    if (Object.prototype.hasOwnProperty.call(data, "cinDoc") && data.cinFormat) {
      const publicUrl = await uploadFile(data.cinDoc, "kyc", data.cinFormat);
      data.cinDoc = publicUrl;
      data.kycStatus = "underReview";
      docRes.cinDoc = publicUrl;
    }
  
    if (Object.prototype.hasOwnProperty.call(data, "trnCertificate") && data.trnCertFormat) {
      const publicUrl = await uploadFile(data.trnCertificate, "kyc", data.trnCertFormat);
      data.trnCertificate = publicUrl;
      data.kycStatus = "underReview";
      docRes.trnCertificate = publicUrl;
    }
  
    data.isMFA = data.sendMfaCodeToAuthApp || data.sendMfaCodeToEmail || data.sendMfaCodeToPhone;
  
    let result = await corporateUser.update(data, {
      where: {
        credentialId: params.corporateId,
      },
    });
  
    if (data.logo) {
      return {
        result: data.logo,
        docs: docRes,
      };
    } else {
      return {
        result: result,
        docs: docRes,
      };
    }
  });


exports.findOne = asyncHandler(async (params, attributes = undefined) => {
    return await corporateUser.findOne({
        include: [{
            model: packAge
        }],
        where: {
            credentialId: params.id,
        },
        attributes,
        nest: true,
        raw: true
    })
})

exports.findAll = asyncHandler(async (params) => {
    return await corporateUser.findAll({
        where: {
            id: params.id
        }
    })
})
exports.findOneWithCredentialId = asyncHandler(async (credentialId) => {
    return await corporateUser.findOne({
      include: [{ model: credential }],
      where: {
        credentialId: credentialId
      }
    })
  })

