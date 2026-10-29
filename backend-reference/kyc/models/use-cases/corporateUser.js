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

exports.create = async (params) => {
    let transaction;
  
    try {
      transaction = await sequelize.transaction();
  
      const details = await credential.create(params, { transaction });
  
      await wallet.create(
        {
          credentialId: details.id,
        },
        { transaction }
      );
  
      const user = await corporateUser.create(
        {
          ...params,
          credentialId: details.id,
        },
        { transaction }
      );
  
      await transaction.commit();
      return user;
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error creating corporate user:", error);
      return false;
    }
  };
  

exports.update = asyncHandler(async (params, data) => {
    let docRes = {}
    if (data.hasOwnProperty('profileImageBase') && data.profileImageFormat) {
        const publicUrl = await uploadFile(data.profileImageBase, 'profile', data.profileImageFormat);
        data = {}
        data.logo = publicUrl;
        docRes.logo = publicUrl;
    }
    if (data.hasOwnProperty('tradeLicenseDoc') && data.trdLcnFormat) {
        const publicUrl = await uploadFile(data.tradeLicenseDoc, 'kyc', data.trdLcnFormat);
        //data = {}
        data.tradeLicenseDoc = publicUrl;
        data.kycStatus = 'underReview'
        docRes.tradeLicenseDoc = publicUrl;
    }
    if (data.hasOwnProperty('trnCertificate') && data.trnCertFormat) {
        const publicUrl = await uploadFile(data.trnCertificate, 'kyc', data.trnCertFormat);
        //data = {}
        data.trnCertificate = publicUrl;
        data.kycStatus = 'underReview'
        docRes.trnCertificate = publicUrl;
    }
    let result = await corporateUser.update(data, {
        where: {
            credentialId: params.id
        }
    })

    if (data.logo) {
        return {
            result: data.logo,
            docs: docRes
        }
    } else {
        return {
            result: result,
            docs: docRes
        }
    }
})
exports.deleteAccount = async (credentialId) => {
    try {
        return await corporateUser.update({
            isActive: false
        }, {
            where: {
                credentialId
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("DELETE ACCOUNT ROUTE CALLED")
    }
}
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

exports.findAll = asyncHandler(async (params) => {
    return await corporateUser.findAll({
        where: {
            id: params.id
        }
    })
})

exports.Delete = asyncHandler(async (params) => {
    return await corporateUser.destroy({
        where: {
            id: params.id
        }
    })
})
exports.updateStatus = asyncHandler(async (req, res, next) => {
    const params = req.params;
    const data = req.body;
    return await corporateUser.update(data, {
        where: {
            id: params.id
        }
    })
});

exports.findAll = asyncHandler(async (params) => {
    let {
        start,
        length,
        draw,
        searchText,
        order,
        column,
        partnerId
    } = params
    const sortableColumns = [
        'id',
        'name',
        'credential.username',
        'email',
        'mobileNo',
        'credentialId',
        'city',
        'balance',
        'isActive',
        'tradeLicenseDoc',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    console.log(partnerId)
    let whereClause = {
        role: 'CORPORATE'
    };
    if (partnerId) {
        whereClause.registeredBy = partnerId
    }
    let data = await corporateUser.findAndCountAll({
        include: [{
            model: credential,
            where: whereClause,
            attributes: ['username', 'role']
        }],
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                email: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                name: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                mobileNo: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                website: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                country: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                city: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                sector: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                poBox: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                countryCode: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                contactPersonName: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                contactPersonEmail: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                contactPersonPhone: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                '$credential.username$': {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        },
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true,
    })
    let credentialIds = [];
    for (let i = 0; i < data.rows.length; i++) {
        credentialIds.push(data.rows[i].credentialId)
    }
    let walletData = await wallets.findAll({
        where: {
            credentialId: {
                [Op.in]: credentialIds
            }
        },
        raw: true
    })
    let walletObj = {};
    for (let val of walletData) {
        walletObj[val.credentialId] = val.balance
    }
    for (let i = 0; i < data.rows.length; i++) {
        if (walletObj[data.rows[i].credentialId]) {
            data.rows[i].balance = walletObj[data.rows[i].credentialId]
        }
    }
    return data;
})

exports.fetchAll = asyncHandler(async (query, res) => {
    return await corporateUser.findAll({
        include: [{
            model: credential,
            where: {
                name: {
                    [Op.like]: '%' + query + '%'
                }
            }
        }],
        raw: true,
        nest: true,
    })
})

exports.fetchAllCorporates = asyncHandler(async (query, partnerId, res) => {

    return await corporateUser.findAll({
        include: [{
            model: credential,
            where: {
                registeredBy: partnerId,
                name: {
                    [Op.like]: '%' + query + '%'
                }
            }
        }],
        raw: true,
        nest: true,
    })
})

exports.Excel = asyncHandler(async (params) => {
    let {
        order,
        column
    } = params
    let data = await corporateUser.findAndCountAll({
        include: [{
            model: credential,
            where: {
                role: 'CORPORATE',
            },
            attributes: ['username', 'role']
        }],
        order: [
            [column, order]
        ],
        raw: true,
        nest: true
    })
    let credentialIds = [];
    for (let i = 0; i < data.rows.length; i++) {
        credentialIds.push(data.rows[i].credentialId)
    }
    let walletData = await wallets.findAll({
        where: {
            credentialId: {
                [Op.in]: credentialIds
            }
        },
        raw: true
    })
    let walletObj = {};
    for (let val of walletData) {
        walletObj[val.credentialId] = val.balance
    }
    for (let i = 0; i < data.rows.length; i++) {
        if (walletObj[data.rows[i].credentialId]) {
            data.rows[i].balance = walletObj[data.rows[i].credentialId]
        }
    }
    let finalData = []
    data.rows.forEach(function (limitData) {
        finalData.push({
            'CorporateId': limitData.id,
            'CorporateName': limitData.name ? limitData.name : 'Not Available',
            'Username': limitData.credential.username ? limitData.credential.username : 'Not Available',
            'Email': limitData.email ? limitData.email : 'Not Available',
            'Mobile No': limitData.mobileNo ? limitData.mobileNo : 'Not Available',
            'Website': limitData.website ? limitData.website : 'Not Available',
            'Country': limitData.country ? limitData.country : 'Not Available',
            'City': limitData.city ? limitData.city : 'Not Available',
            'Balance': limitData.balance ? limitData.balance + "INR" : '0.0000'
        })
    })
    return finalData
})