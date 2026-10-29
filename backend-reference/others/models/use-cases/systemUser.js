/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const systemUser = require('./../entities/systemUser')
const credential = require('./../entities/credential')
const wallet = require('./../entities/wallet')
const sequelize = require('../../configs/database/index')
const roleAndPermissions = require('../entities/roleAndPermissions');
const { gatewayChargeTermsOf } = require("../../utils/gatewayChargeTerms");
const { Op } = require("sequelize");
let sequelizeConfig = require('../../configs/database/index');
const emailer = require('../../utils/emailer');
const partnerLogos = require("../../public/partnerLogos")
const asyncHandler = require('./../../middlewares/async');
const { setNewPasswordTemplate } = require('../../utils/templatesForEmails');
const { handleSortFields } = require('../../utils/sortHandle');
const { formattedDateTime } = require('../../utils/formatter');
const partnerPermission = require('../entities/partnerPermission');
const ErrorResponse = require('../../utils/error-response');
const { uploadFile } = require('../../utils/commonUploadFile');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require('../../utils/emailTemplate/sharedLayout');
const { partnerLogos: getPartnerLogos } = require('../../utils/partnerLogos');
const { customLog } = require('../../utils/loggerHelper');

// The admin-managed "create/reset your password" email, from the published template
// when one exists and from setNewPasswordTemplate otherwise. Three callers reach
// this in this file - create, createResendMail, createPartner - all with the
// identical subject "Set New Password", so one shared key/subject is correct here
// (unlike PROFILE_UPDATE_OTP elsewhere, whose callers use different subjects).
const sendSetNewPasswordEmail = async ({ to, details, resetUrl, message, registeredBy }) => {
    const partnerDetails = registeredBy
        ? await exports.fetchPartnerDetails(registeredBy)
        : await getPartnerLogos();
    const { subject, html, sender } = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.SET_NEW_PASSWORD,
        service: EMAIL_TEMPLATE_SERVICES.SYSTEM_USER,
        partnerId: registeredBy || null,
        variables: {
            username: details?.dataValues?.username || details?.username,
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
        fallback: () => setNewPasswordTemplate(details, resetUrl, message, partnerDetails),
    });
    emailer.email(to, subject, html, () => {
        customLog(null, "info", { message: `Email sent successfully to ${to}` });
        console.log("Email sent to " + to);
    }, sender);
};

exports.create = asyncHandler(async (params, rolesDetails, req = undefined) => {
    params.role = "SYSTEM_USER";
    const { passwordProtection } = params;
    delete params.passwordProtection;

    let transaction = await sequelize.transaction();
    try {
        // Step 1: Create credential
        const details = await credential.create(params, { transaction });

        // Step 2: Create wallet
        await wallet.create({ credentialId: details.id }, { transaction });

        // Step 3: Create system user
        const user = await systemUser.create(
            { ...params, credentialId: details.id },
            { transaction }
        );

        // Step 4: Handle partner role-specific logic
        if (rolesDetails && rolesDetails.roleName === 'partner') {
            const registeredBy = details.id;
            await details.update({ registeredBy }, { transaction });
            await user.update({ registeredBy }, { transaction });
        }else if (rolesDetails && rolesDetails.roleName == 'sub-partner') {
            let { registeredBy } = params
            let subPartnerId = details.id;
            await details.update({
                registeredBy,
                subPartnerId
            }, { transaction })
            await user.update({
                registeredBy,
                subPartnerId
            }, { transaction })
        }

        // Step 5: Prepare reset token and commit transaction
        const resetToken = details.getResetPasswordToken();
        await credential.update(
            {
                passwordHistory: { currentPassword: "", previousPasswords: [] },
                passwordProtection,
                passwordResetToken: resetToken.resetPasswordToken,
                passwordResetExpires: resetToken.resetPasswordExpire,
            },
            { where: { id: details.id }, transaction }
        );

        // Commit transaction before sending email
        await transaction.commit();

        // Step 6: Send email (outside transaction scope)
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_PRODUCTION_URL
            : process.env.FRONTEND_STAGING_URL;
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken.resetPasswordToken}&username=${details.dataValues.username}&isForgot=false`;

        const message = `Please create a new password for your Peko account before logging in.\n\n
        \n If the button above is unresponsive, you may click on the link below.\n\n \n <br>
        ${resetUrl}`;
        await sendSetNewPasswordEmail({
            to: params.email,
            details,
            resetUrl,
            message,
            registeredBy: details.registeredBy || params.registeredBy,
        });

        return user;
    } catch (error) {
        // Rollback transaction on error
        if (transaction) {
            await transaction.rollback();
        }
        console.error("Transaction failed and rolled back: ", error);
        throw new ErrorResponse("Something went wrong, please try again later.", 500);
    }
});



exports.findOne = asyncHandler(async (params, attributes) => {
    return await systemUser.findOne({
        where: {
            credentialId: params.id
        },
        attributes,
        raw: true,
        nest: true
    })
})

exports.find = asyncHandler(async (params) => {
    return await systemUser.findOne({
        where: {
            email: params.email
        }
    })
})

exports.findByRole = asyncHandler(async (roleAndPermissionId) => {
    return await systemUser.findAll({
        where: {
            roleAndPermissionId: roleAndPermissionId
        }
    })
})

// The system-user edit endpoint must never mass-assign the request body into the
// credential row. credential is login-critical, so only these profile fields may be
// written to it — NEVER role/registeredBy/password (overwriting registeredBy once
// locked a super-admin out of login with "account not found").
const CREDENTIAL_UPDATE_FIELDS = ["name", "username", "email", "passwordProtection", "enforcePrivacyPolicy"];
// Fields that must never be written to the systemUser row from the request body
// (auth/ownership/identity columns).
const SYSTEM_USER_PROTECTED_FIELDS = ["id", "userId", "credentialId", "role", "registeredBy", "subPartnerId", "partnerId", "password"];

const pickFields = (obj = {}, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

const omitFields = (obj = {}, keys) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

exports.update = async (params, data) => {
    let transaction;
  
    try {
      transaction = await sequelize.transaction();
  
      // Target the edited user from the URL (:id = credentialId), NEVER the body.
      // The body's userId is the logged-in admin's own id, so trusting it made
      // every edit overwrite the current admin instead of the selected user.
      const credentialId = params.id;

      const existingUser = await systemUser.findOne({
        where: { credentialId },
        transaction,
      });

      if (!existingUser) {
        throw new Error("User not found");
      }

      // Whitelist columns per table; never mass-assign the raw request body.
      const credentialUpdate = pickFields(data, CREDENTIAL_UPDATE_FIELDS);
      const systemUserUpdate = omitFields(data, SYSTEM_USER_PROTECTED_FIELDS);

      await systemUser.update(systemUserUpdate, {
        where: { credentialId },
        transaction,
      });

      await credential.update(credentialUpdate, {
        where: { id: credentialId },
        transaction,
      });

      await transaction.commit();
      return true;
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Update failed:", error);
      throw error;
    }
  };
  


exports.deleteOne = asyncHandler(async (params) => {
    return await systemUser.destroy({
        where: {
            id: params.id
        }
    })

})

exports.updateSystemUserStatus = asyncHandler(async (params, data) => {
     return await systemUser.update(data, {
          where: {
               credentialId: params.id,
          },
     })
})

exports.findAllAndCount = asyncHandler(async (params) => {
    let { limit, offset, searchText, sort, sortField, userId, userType } = params;

    searchText = searchText || "";

    let order = handleSortFields(sortField, sort);

    const data = await systemUser.findAndCountAll({
        include: [
            {
                model: credential,
                where: {
                    id: { [Op.ne]: userId },
                },
                // [Op.or]: [{
                //     username: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // }]
                attributes: ['username', 'role', 'name','createdAt','passwordProtection', 'partnerId','enforcePrivacyPolicy']
            },
         {
            model: roleAndPermissions,
            attributes: ['roleName']
        }
    ],
        where: {
            [Op.or]: [
                { id: { [Op.like]: `%${searchText}%` } },
                { email: { [Op.like]: `%${searchText}%` } },
                { "$credential.username$": { [Op.like]: `%${searchText}%` } },
                { "$credential.name$": { [Op.like]: `%${searchText}%` } },
                { "$credential.role$": { [Op.like]: `%${searchText}%` } },
            ],
        },
        order,
        limit: limit || 10,
        offset: offset || 0,
        raw: true,
        nest: true
    })

    const credentialIds = data.rows.map(r => r.credentialId);

    if (!credentialIds.length) return data;

    const walletData = await wallet.findAll({
        where: { credentialId: { [Op.in]: credentialIds } },
        raw: true,
    });

    const walletObj = Object.fromEntries(
        walletData.map(w => [w.credentialId, w.balance])
    );

    data.rows.forEach(row => {
        row.balance = walletObj[row.credentialId] || 0;
    });

    return data;
});



exports.systemUserExports = asyncHandler(async (params) => {
    try {
        let { searchText, sort, sortField, userId, userType } = params;

        searchText = searchText || "";

        let order = handleSortFields(sortField, sort);

        let data = await systemUser.findAndCountAll({
            include: [
                {
                    model: credential,
                    where: {
                        id: { [Op.ne]: userId },
                    },
                    attributes: [
                        "username",
                        "role",
                        "name",
                        "createdAt",
                        "passwordProtection",
                        "partnerId",
                    ],
                },
                {
                    model: roleAndPermissions,
                    attributes: ["roleName"],
                },
            ],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: `%${searchText}%` } },
                    { email: { [Op.like]: `%${searchText}%` } },
                    { "$credential.username$": { [Op.like]: `%${searchText}%` } },
                    { "$credential.name$": { [Op.like]: `%${searchText}%` } },
                    { "$credential.role$": { [Op.like]: `%${searchText}%` } },
                ],
            },
            order,
            raw: true,
            nest: true,
        });

        if (!data.rows.length) return [];

        const credentialIds = data.rows.map(r => r.credentialId);

        const walletData = await wallet.findAll({
            where: { credentialId: { [Op.in]: credentialIds } },
            raw: true,
        });

        const walletObj = Object.fromEntries(
            walletData.map(w => [w.credentialId, w.balance])
        );

        data.rows.forEach(row => {
            row.balance = walletObj[row.credentialId] || 0;
        });

        return data.rows.map(limitData => ({
            Date: limitData.createdAt
                ? formattedDateTime(limitData.createdAt)
                : "Not Available",
            Username: limitData.credential?.username || "Not Available",
            Role: limitData.roleAndPermission?.roleName || "Not Available",
            "Mobile No": limitData.mobileNo || "Not Available",
            "Portal Url": limitData.portalUrl || "Not Available",
            "Email ID": limitData.email || "Not Available",
            Status: limitData.isActive > 0 ? "Active" : "In Active",
        }));
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
})

exports.createResendMail = asyncHandler(async (params) => {
    const details = await credential.findOne({
        where: { id: params.id },
    });

    if (!details) {
        throw { message: "Credential not found" };
    }

    const resetToken = details.getResetPasswordToken();

    const [updated] = await credential.update(
        {
            passwordResetToken: resetToken.resetPasswordToken,
            passwordResetExpires: resetToken.resetPasswordExpire,
        },
        {
            where: { id: details.id },
        }
    );

    if (!updated) {
        throw { message: "Failed to update reset token" };
    }

    const baseUrl =
        process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_PRODUCTION_URL
            : process.env.FRONTEND_STAGING_URL;

    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(
        resetToken.resetPasswordToken
    )}&username=${encodeURIComponent(details.username)}&isForgot=false`;

    const message = `Please create a new password for your Peko account before logging in.\n\n
  If the button above is unresponsive, you may click on the link below.\n\n<br>
  ${resetUrl}`;

    await sendSetNewPasswordEmail({
        to: details.email,
        details,
        resetUrl,
        message,
        registeredBy: details.registeredBy,
    });

    return true
});

exports.findAllByRoleName = asyncHandler(async (query, roleName) => {
    const users = await systemUser.findAll({
        attributes: [],
        where: {
            isActive: true
        },
        include: [{
            model: roleAndPermissions,
            attributes: [],
            where:{
                roleName
            }
        },{
            model: credential,
            attributes: ['id', 'name'],
            where:{
                [Op.or]: [
                    {
                        name: {
                            [Op.like]: '%' + query + '%'
                        }
                    }
                ]
            }
        }
    ]
    })
    const credentials = users.map(user => user.credential);
    return credentials

})

//function for fetching partner details and assets
exports.fetchPartnerDetails = asyncHandler(async (credentialId) => {
    let result = null;
    if (credentialId) {
        try {
            result = await systemUser.findOne({
                where: {
                    credentialId,
                    brandingStatus: true
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


exports.fetchAllBrandingDetails = asyncHandler(async (params) => {
    const { from, to, searchText, sort, limit, offset, sortField } = params;

    const order = handleSortFields(sortField, sort);

    let whereClause = {};

    if (searchText) {
        whereClause[Op.or] = [
            {
                registeredBy: {
                    [Op.like]: `%${searchText}%`,
                },
            },
            {
                "$credential.name$": {
                    [Op.like]: `%${searchText}%`,
                },
            },
        ];
    }

    if (from && to) {
        const adjustedTo = new Date(to);
        adjustedTo.setDate(adjustedTo.getDate() + 1);
        adjustedTo.setHours(0, 0, 0, 0);

        whereClause.createdAt = {
            [Op.between]: [new Date(from), adjustedTo],
        };
    }

    return await systemUser.findAndCountAll({
        where: whereClause,
        order,
        limit: limit || 10,
        offset: offset || 0,
        include: [
            {
                model: roleAndPermissions,
                attributes: [],
                where: { roleName: "partner" },
            },
            {
                model: credential,
                attributes: ["id", "name"],
            },
        ],
        raw: true,
        nest: true,
    });
});
  

exports.brandingExports = asyncHandler(async (params) => {
    try {
        const { from, to, searchText, sort, sortField } = params;

        const order = handleSortFields(sortField, sort);

        let whereClause = {};

        if (searchText) {
            whereClause[Op.or] = [
                {
                    registeredBy: {
                        [Op.like]: `%${searchText}%`,
                    },
                },
                {
                    "$credential.name$": {
                        [Op.like]: `%${searchText}%`,
                    },
                },
            ];
        }

        if (from && to) {
            const adjustedTo = new Date(to);
            adjustedTo.setDate(adjustedTo.getDate() + 1);
            adjustedTo.setHours(0, 0, 0, 0);

            whereClause.createdAt = {
                [Op.between]: [new Date(from), adjustedTo],
            };
        }

        const rows = await systemUser.findAll({
            where: whereClause,
            order,
            include: [
                {
                    model: roleAndPermissions,
                    attributes: [],
                    where: { roleName: "partner" },
                },
                {
                    model: credential,
                    attributes: ["id", "name"],
                },
            ],
            raw: true,
            nest: true,
        });

        return rows.map((row) => ({
            Date: row.createdAt
                ? formattedDateTime(row.createdAt)
                : "Not Available",

            "Partner Name":
                row?.credential?.name || "Not Available",

            "Partner ID":
                row?.registeredBy || "Not Available",

            "Share Percentage":
                row?.sharePercentage ?? "Not Available",

            "Gateway Charge %":
                gatewayChargeTermsOf(row?.gatewayCharge)?.percentage ?? "Not Available",

            "Gateway Charge Per Transaction":
                gatewayChargeTermsOf(row?.gatewayCharge)?.fixed ?? "Not Available",

            Status:
                row?.brandingStatus > 0 ? "Active" : "Inactive",
        }));
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
});
  
exports.updateStatusForBranding = asyncHandler(async (params) => {
    try{
        return await systemUser.update({brandingStatus:params.status}, {
            where: {
                id: params.id
            }
        })
    } catch (error) {
      console.log(error);
      throw  {message:'Something went wrong'};
    }
 
})
exports.updatePartnerShare = async (id, fields) => {
    const existing = await systemUser.findOne({ where: { id }, attributes: ['id'], raw: true });
    if (!existing) return null;
    await systemUser.update(fields, { where: { id } });
    return { id: existing.id, ...fields };
};

exports.updateBrandingData = asyncHandler(async (id,updatedData) => {
   const data= await systemUser.findOne({
        where: {
            id
        },
        attributes: ['assets', 'branding'],
        nest: true,
        raw: true
    })
    if (!data) {
        return new ErrorResponse("User not found.", 404);
    }
    updatedData.assets=data.assets||{}
    let transaction = await sequelize.transaction();
    try {
        if (Object.prototype.hasOwnProperty.call(updatedData, 'logo') && updatedData.logoFormat) {
            const publicUrl = await uploadFile(updatedData.logo, 'logo', updatedData.logoFormat);
            updatedData.assets.logo= publicUrl;
        }
        if (Object.prototype.hasOwnProperty.call(updatedData, 'signUpLogo') && updatedData.signUpLogoFormat) {
            const publicUrl = await uploadFile(updatedData.signUpLogo, 'signUpLogo', updatedData.signUpLogoFormat);
            updatedData.assets.signUpLogo = publicUrl;
        }
        updatedData.assets.baseUrl=updatedData?.baseUrl||'';
        updatedData.assets.clevertap_projectId = updatedData.cleverTapProjectId;
        updatedData.assets.clevertap_passCode = updatedData.cleverTapPasscode;
        let updatedBanner = await systemUser.update(updatedData, {
            where: {
                id
            },
            transaction
        })
        await transaction.commit();
        if (!updatedBanner) {
            transaction.rollback();
            return false;
        }
        return updatedBanner;
    }
    catch (error) {
        await transaction.rollback();
        console.error("Transaction failed and rolled back: ", error);
        return new ErrorResponse("Something went wrong, please try again later.", 500);
    }
 
})

exports.createPartner = asyncHandler(async (partnerDetails, req = undefined) => {
    let {
        params, userDetails,permissions,rolesDetails
    } =partnerDetails
    
    // Validate rolesDetails before proceeding
    if (!rolesDetails || !rolesDetails.id) {
        throw new Error("Role details not found. Cannot create partner without valid role.");
    }
    
    userDetails.role = "SYSTEM_USER"
    const {passwordProtection}=params
    delete userDetails.passwordProtection
   
    let transaction = await sequelize.transaction();
    try
    {
    const details = await credential.create(userDetails, {
        transaction: transaction
    })
    
    // Validate credential creation
    if (!details || !details.id) {
        throw new Error("Failed to create credential");
    }
    
    const partnerPermissionDetails = await partnerPermission.create({registeredBy:details.id,permissions:permissions,status:1}, {
        transaction: transaction
    })
    await wallet.create({
        credentialId: details.id
      }, {
        transaction: transaction
      })
    const user = await systemUser.create({
        ...userDetails,
        credentialId: details.id,
        roleAndPermissionId: rolesDetails.id
    }, {
        transaction: transaction
    })
    // for only partner we want to update the registeredBy field with this credential Id
    if(rolesDetails){
           if(rolesDetails.roleName == 'partner'){
            let registeredBy = details.id
            await details.update({
                registeredBy
            }, { transaction })
            await user.update({
                registeredBy
            }, { transaction })
           }else if(rolesDetails.roleName == 'sub-partner'){
            let {registeredBy} = params
            let subPartnerId = details.id;
            await details.update({
                registeredBy,
                subPartnerId
            }, { transaction })
            await user.update({
                registeredBy,
                subPartnerId
            }, { transaction })
           }
    }
    await transaction.commit();
    //Get reset token
    const resetToken = details.getResetPasswordToken();
    credential.update({
        passwordHistory:{
            currentPassword: "", previousPasswords: []
        },
        passwordProtection,
        passwordResetToken: resetToken.resetPasswordToken,
        passwordResetExpires: resetToken.resetPasswordExpire
    }, {
        where: {
            id: details.id
        }
    })

    let baseUrl 
    if(process.env.NODE_ENV == 'production'){
        baseUrl =  process.env.FRONTEND_PRODUCTION_URL
    }else{
        baseUrl = process.env.FRONTEND_STAGING_URL
    }
    let resetUrl = baseUrl + "/reset-password?token=" + resetToken.resetPasswordToken + "&username=" + details.dataValues.username + "&isForgot=false"

    const message = `Please create a new password for your Peko account before logging in.\n\n
    \n If the button above is unresponsive, you may click on the link below.\n\n \n <br>
    ${resetUrl}`
    await sendSetNewPasswordEmail({
        to: params.userDetails.email,
        details,
        resetUrl,
        message,
        registeredBy: details.registeredBy,
    });
    return user
}
catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
})

exports.updatePartner = async (partnerDetails, data) => {
    let transaction;
    let {
        params, userDetails,permissions
    } =partnerDetails
    try {
        // Start a transaction
        transaction = await sequelize.transaction();

        // Find the existing user to get the credentialId
        let existingUser = await systemUser.findOne({
            where: {
                credentialId: params.id
            },
            transaction // Pass the transaction
        });
        // Check if the user exists
        if (!existingUser || existingUser == null) {
            throw new Error("User not found");
        }
        if (!existingUser.credentialId || existingUser.credentialId == null) {
            throw new Error("Something went wrong.");
        }

        const credentialUpdate = pickFields(userDetails, CREDENTIAL_UPDATE_FIELDS);
        const systemUserUpdate = omitFields(userDetails, SYSTEM_USER_PROTECTED_FIELDS);

        await systemUser.update(systemUserUpdate, {
            where: {
                credentialId: params.id
            },
            transaction // Pass the transaction
        });
        await credential.update(credentialUpdate, {
            where: {
                id: params.id
            },
            transaction // Pass the transaction
        });
        await partnerPermission.update({ permissions: permissions }, {
            where: {
                registeredBy: params.id
            },
            transaction // Pass the transaction
        });

        // Commit the transaction
        await transaction.commit();
        return true;
    } catch (error) {
        console.log({ error })
        // If an error occurs, rollback the transaction
        if (transaction) {
            await transaction.rollback();
        }
        throw error; // Re-throw the error to be caught by the caller
    }
};

exports.findpartnerAndPermissionDetails = asyncHandler(async (params) => {
    try {
        const { id } = params;

        const data = await systemUser.findOne({
            include: [{
                model: credential,    
                where: {
                    id:  id
                },
                attributes: ['username', 'role', 'name','createdAt','passwordProtection', 'partnerId','enforcePrivacyPolicy']
            }],
            raw: true,
            nest: true,
        })

        if (!data) return null;

        const partnerPermissionDetails = await partnerPermission.findOne({
            where: { registeredBy: id },
            raw: true,
        });

        return {
            ...data,
            permissions: partnerPermissionDetails || null,
        };
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
})

exports.findClonePartnerFrom = asyncHandler(async () => {
    try{
        const query = `SELECT  
        credentials.id,
        credentials.name, 
        partnerPermissions.permissions FROM partnerPermissions
        inner join credentials on credentials.id = partnerPermissions.registeredBy;`
        const partners = await sequelizeConfig.query(query, {
            type: sequelizeConfig.QueryTypes.SELECT
        });
        return partners
    }catch(error){
        console.log(error)
    }    
})

exports.findClonePartnerTo = asyncHandler(async () => {
    const query = `SELECT 
     credentials.name,
     credentials.id
        FROM
            systemUsers
        INNER JOIN
            roleAndPermissions ON roleAndPermissions.id = systemUsers.roleAndPermissionId
        LEFT JOIN 
        credentials ON credentials.id = systemUsers.credentialId 
        LEFT JOIN 
        packages ON packages.partnerId = credentials.id   
        WHERE
            roleAndPermissions.roleName = 'partner' 
            AND packages.partnerId IS NULL`
    const users = await await sequelizeConfig.query(query, {
        type: sequelizeConfig.QueryTypes.SELECT
    });
    return users
})