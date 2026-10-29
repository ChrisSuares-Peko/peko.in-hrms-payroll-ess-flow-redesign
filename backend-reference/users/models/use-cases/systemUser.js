/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const systemUser = require('./../entities/systemUser')
const credential = require('./../entities/credential')
const wallet = require('./../entities/wallet')
const sequelize = require('../../configs/database/index')
const partnerLogos = require("../../public/partnerLogos")
//const sequelize = require('sequelize')
const {
    Op
} = require("sequelize");
const emailer = require('../../utils/emailer');
const emailTemplates = require('../../utils/emailTemplates');
const asyncHandler = require('./../../middlewares/async');
const roleAndPermissions = require('../entities/roleAndPermissions');
const ErrorResponse = require('../../utils/error-response');
const { partnerLogos: getPartnerLogos } = require('../../utils/partnerLogos');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require('../../utils/emailTemplate/sharedLayout');
exports.create = asyncHandler(async (params, req = undefined) => {
    let transaction = await sequelize.transaction();
    try {
        const details = await credential.create(params, {
            transaction: transaction
        })
        await wallet.create({
            credentialId: details.id
        }, {
            transaction: transaction
        })
        const user = await systemUser.create({
            ...params,
            credentialId: details.id
        }, {
            transaction: transaction
        })
        await transaction.commit();
        //Get reset token
        const resetToken = details.getResetPasswordToken();
        credential.update({
            passwordResetToken: resetToken.resetPasswordToken,
            passwordResetExpires: resetToken.resetPasswordExpire
        }, {
            where: {
                id: details.id
            }
        })

        //Create reset url
        const resetUrl = `${req.protocol}://${req.get('host')}/system/reset/${resetToken.resetPasswordToken}`
        const message = `Set a new password for your peko account before login.<br><br>
    If above button is not working, then click below link:<br>
    <a href="${resetUrl}" style="color:#FF3A3A;text-decoration:underline;word-break:break-all;">${resetUrl}</a>`;
        let filePath, webUrl
        let environment = process.env.NODE_ENV
        if (environment === 'production') {
            filePath = 'http://162.243.172.106:4444/assets/images/logo/logo.png'
            webUrl = 'http://uat.kash31.com'
        } else {
            filePath = 'http://162.243.172.106:4444/assets/images/logo/logo.png'
            webUrl = 'http://uat.kash31.com'
        }

        const to = params.email; // Set recipient email address

        const partnerDetails = details?.registeredBy
            ? await exports.fetchPartnerDetails(details.registeredBy)
            : await getPartnerLogos();

        const { subject, html, sender } = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.SET_NEW_PASSWORD,
            partnerId: details?.registeredBy || null,
            variables: {
                username: details?.username,
                resetUrl,
                message,
                branding: partnerDetails?.branding || 'Peko',
                ...v2LayoutVariables({
                    website: partnerDetails?.baseUrl || 'https://in.peko.one',
                    logo: partnerDetails?.logo,
                    branding: partnerDetails?.branding || 'Peko',
                    socials: PEKO_SOCIAL_LINKS,
                }),
            },
            fallbackSubject: "Set New Password",
            fallback: () => emailTemplates.setNewPasswordTemplate(details, resetUrl, message, partnerDetails),
        });
        // Call email function to send email with payment details in the body
        emailer.email(to, subject, html, function () {
            console.log("Email sent to " + to);
        }, sender);
        return user
    }
    catch (error) {
        await transaction.rollback();
        console.error("Transaction failed and rolled back: ", error);
        return new ErrorResponse("Something went wrong, please try again later.", 500);
    }
})

exports.findOne = asyncHandler(async (params) => {
    return await systemUser.findOne({
        where: {
            credentialId: params.id
        }
    })
})

exports.find = asyncHandler(async (params) => {
    return await systemUser.findOne({
        where: {
            email: params.email
        }
    })
})

exports.findAll = asyncHandler(async (params) => {
    return await systemUser.findAll({
        where: {
            id: params.id
        }
    })
})

exports.update = asyncHandler(async (params, data) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        await credential.update(data, {
            where: { id: params.id },
            transaction: transaction
        });

        await systemUser.update(data, {
            where: { credentialId: params.id },
            transaction: transaction
        });

        await transaction.commit();

        return true;
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        return false
    }
});


exports.deleteOne = asyncHandler(async (params) => {
    return await systemUser.destroy({
        where: {
            id: params.id
        }
    })

})
exports.updateStatus = asyncHandler(async (req, res, next) => {
    const params = req.params;
    const data = req.body;
    return await systemUser.update(data, {
        where: {
            id: params.id
        }
    })
});
/*exports.updateStatus = async (req, res, next) => {
    const params = req.params;
    const data = req.body;
  
    // Fetch the current system user record
    const systemUserRecord = await systemUser.findByPk(params.id);
  
    // Update the status based on its current value
    const newStatus = systemUserRecord.status === 0 ? 1 : 0;
    data.status = newStatus;
  
    // Update the system user record with the new status value
    await systemUser.update(data, {
      where: {
        id: params.id
      }
    });
  
    // Return the updated system user record
    const updatedSystemUserRecord = await systemUser.findByPk(params.id);
    return res.status(200).json(updatedSystemUserRecord);
  };
  */

exports.findAllAndCount = asyncHandler(async (params) => {
    let {
        start,
        length,
        draw,
        searchText,
        order,
        column,
        userId
    } = params
    const sortableColumns = [
        'id',
        'username',
        'name',
        'role',
        'email',
        'isActive',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }

    let data = await systemUser.findAndCountAll({
        include: [{
            model: credential,

            where: {
                id: {
                    [Op.ne]: userId
                },
                // [Op.or]: [{
                //     username: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // }]
            },
            attributes: ['username', 'role', 'name']
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
                '$credential.username$': {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                '$credential.name$': {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                '$credential.role$': {
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
        nest: true
    })
    let credentialIds = [];
    for (let i = 0; i < data.rows.length; i++) {
        credentialIds.push(data.rows[i].credentialId)
    }
    let walletData = await wallet.findAll({
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

exports.excelCsvData = asyncHandler(async (params) => {
    let {
        order,
        column,
        userId
    } = params

    let data = await systemUser.findAndCountAll({
        include: [{
            model: credential,
            where: {
                id: {
                    [Op.ne]: userId
                },
                // role: 'ADMIN',
            },
            attributes: ['username', 'role', 'name']
        }],
        order: [
            [column, order]
        ],
        attributes: ['id', 'isActive', 'email', 'credentialId'],
        raw: true,
        nest: true
    })
    let credentialIds = [];
    for (let i = 0; i < data.rows.length; i++) {
        credentialIds.push(data.rows[i].credentialId)
    }
    let walletData = await wallet.findAll({
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
            'Id': limitData.id,
            'username': limitData.credential.username ? limitData.credential.username : 'Not Available',
            'Name': limitData.credential.name ? limitData.credential.name : 'Not Available',
            'Email': limitData.email ? limitData.email : 'Not Available',
            'Status': limitData.isActive == 1 ? 'True' : 'false'
        })
    })
    return finalData
})

exports.findOneSystemUser = asyncHandler(async (params, attributes = undefined) => {
    return await systemUser.findOne({
        where: {
            credentialId: params.id,
        },
        attributes,
        nest: true,
        raw: true
    })
})

exports.findRole = asyncHandler(async (credentialId) => {
    return await systemUser.findOne({
        where: {
            credentialId
        },
        include: [{
            model: roleAndPermissions,
            attributes: ['roleName']
        }]
    })
})

//function for fetching partner details and assets
exports.fetchPartnerDetails = asyncHandler(async (credentialId) => {
    let result = null;
    if (credentialId) {
        try {
            result = await systemUser.findOne({
                where: {
                    credentialId
                },
                attributes: ['assets', 'branding'],
                nest: true,
                raw: true
            });
        } catch (error) {
            console.error("partner branding lookup failed, using defaults:", error);
        }
    }

    return {
        logo: result?.assets?.logo || partnerLogos[0]?.logo,
        baseUrl: result?.assets?.baseUrl || partnerLogos[0]?.baseUrl,
        branding: result?.branding || partnerLogos[0]?.branding,
        signUpImage: result?.assets?.signUpLogo || partnerLogos[0]?.signUpImage
    };
})

exports.fetchPartnerBaseUrl = asyncHandler(async (credentialId) => {
    const result = await systemUser.findOne({
        where: {
            credentialId,
            brandingStatus: true
        },
        attributes: ['assets'],
        nest: true,
        raw: true
    })

    return result?.assets?.baseUrl || null;
})

exports.findRole = asyncHandler(async (credentialId) => {
    return await systemUser.findOne({
        where: {
            credentialId
        },
        include: [{
            model: roleAndPermissions,
            attributes: ['roleName']
        }]
    })
})