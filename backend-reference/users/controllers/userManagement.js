const asyncHandler = require("../middlewares/async");
const { resolveFrontendBaseUrl } = require('../utils/trustedFrontendUrl');
const { findAndCountAllSubCorporateUsers, createSubCorporate, updateSubCorporate, updateStatus, deleteSubCorporate, findOneSubCorporate,updateSubCorporateServices, restoreSubCorporate, checkDeletedUserExits, isOwnerRow, linkMemberIdentity } = require("../models/use-cases/subCorporateUser");
const { resolveInviteTarget, WANTS, ACTION } = require("../models/use-cases/identityLink");
const ErrorResponse = require("../utils/error-response");
const emailTemplates = require('../utils/emailTemplates');
const emailer = require('../utils/emailer');
const { findOneCredential } = require("../models/use-cases/credential");
const credential = require("../models/entities/credential");
const {createNotification}=require('../models/use-cases/notification');
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { partnerLogos } = require("../utils/partnerLogos");
const { customLog } = require("../utils/loggerHelper");
const { INVITATION_TOKEN_EXPIRY_MINUTES } = require("../utils/constants");
const { resolveServicePermissionsForSession } = require("../models/use-cases/partnerPermission");
const { clampRequestedServices } = require("../utils/clampServiceAccess");
const { FORBIDDEN } = require("../utils/responseCodes");

const rejectOwnerRow = (res, message) => res.status(403).json({
    status: false,
    message,
    data: {},
    responseCode: FORBIDDEN
});
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../utils/emailTemplate/sharedLayout");

exports.listSubCorporates = asyncHandler(async (req, res) => {
    try {
        const corporateId = req.user.corporateId;
        let { status, page, itemsPerPage, searchText } = req.query;

        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
        let limit = itemsPerPage

        let offset;
        if (page && itemsPerPage) {
            offset = (page - 1) * itemsPerPage;
        }

        let params = {
            limit,
            offset,
            corporateId,
            status,
            searchText
        }

        const allSubCorporateUsers = await findAndCountAllSubCorporateUsers(params)
        if (!allSubCorporateUsers) {
            return res.status(500).json({
                status: false,
                message: 'Failed to fetch sub corporate users',
                data: {},
                responseCode: '001'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Sub corporate users fetched successfully',
            data: {
                ...allSubCorporateUsers,
            },
            responseCode: '000'
        });


    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001'
        });
    }
})

exports.validateSubCorporate = asyncHandler(async (req, res, next) => {
    try {
        let data = req.body

        const subCorporateUser = {
            ...data,
            corporateCredentialID: req.user.id,
            corporateUserId: req.user.corporateId,
            corporateEmail: req.user.email
        }

        const user = await checkDeletedUserExits(subCorporateUser);
        if (user) {
            return res.status(200).json({
                status: true,
                message: 'Validate successfully',
                data: {},
                responseCode: '000'
            });
        }

        const outcome = await resolveInviteTarget({
            email: data.email,
            mobileNo: data.mobileNo,
            inviterCorporateUserId: req.user.corporateId,
            inviterCredentialId: req.user.id,
            inviterRegisteredBy: req.user.registeredBy,
            wants: WANTS.MEMBER,
        })
        if (outcome.action === ACTION.REJECT) {
            return next(new ErrorResponse(outcome.message, 400))
        }
        return res.status(200).json({
            status: true,
            message: 'Validate successfully',
            data: { willLinkExistingLogin: outcome.action === ACTION.LINK },
            responseCode: '000'
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while creating sub user.',
            data: {},
            responseCode: '001'
        });
    }
})

exports.createSubCorporate = asyncHandler(async (req, res, next) => {
    try {
        // A job title, not an authorization input: corporate-cards roles are held on the employee row and
        // managed from the cards People screen, so this is free text again. Trimmed because the stored value
        // is compared exactly wherever it is read.
        const role = typeof req.body?.role === 'string' ? req.body.role.trim() : ''

        let data = {
            ...req.body,
            role,
            username:req.body.email,
            registeredBy: req.user.registeredBy
        }
          if (!Array.isArray(data.services) || data.services.length === 0) {
            return next(new ErrorResponse(`Select at least one service`, 400))
        }

        const partnerPermissionData = await resolveServicePermissionsForSession(req.user, ['permissions']);

        if (!partnerPermissionData
            || !Array.isArray(partnerPermissionData.permissions)
            || partnerPermissionData.permissions.length === 0) {
            customLog(req?.LogTraceId, "error", {
                message: 'Could not resolve service permissions for sub-user invite',
                registeredBy: req.user.registeredBy,
                corporateId: req.user.corporateId
            });
            return next(new ErrorResponse(`Unable to resolve service permissions for this account. Please contact support.`, 500))
        }

        const filteredPartnerPermissions = clampRequestedServices(data.services, partnerPermissionData.permissions);

        // Guard BEFORE restoreSubCorporate below — that writes `services` straight onto a
        // soft-deleted row, so an empty clamp would silently wipe a reactivated user's access.
        if (filteredPartnerPermissions.length === 0) {
            return next(new ErrorResponse(`None of the selected services are available on your account`, 400))
        }
        data.services = filteredPartnerPermissions;

        const subCorporateUser = {
            ...data,
            corporateCredentialID: req.user.id,
            corporateUserId: req.user.corporateId,
            corporateEmail: req.user.email
        }

        // restored the deleted subCorporate user
        const restoredUser = await restoreSubCorporate(subCorporateUser);
        if (restoredUser) {
            return res.status(200).json({
                status: true,
                message: 'User reactivated successfully',
                data: {},
                responseCode: '000'
            });
        }

        const outcome = await resolveInviteTarget({
            email: data.email,
            mobileNo: data.mobileNo,
            inviterCorporateUserId: req.user.corporateId,
            inviterCredentialId: req.user.id,
            inviterRegisteredBy: req.user.registeredBy,
            wants: WANTS.MEMBER,
        })
        if (outcome.action === ACTION.REJECT) {
            return next(new ErrorResponse(outcome.message, 400))
        }

        if (outcome.action === ACTION.LINK) {
            const linked = await linkMemberIdentity({
                credentialId: outcome.credentialId,
                corporateUserId: req.user.corporateId,
                corporateCredentialID: req.user.id,
                name: data.name,
                email: data.email,
                mobileNo: data.mobileNo,
                role,
                services: filteredPartnerPermissions,
            })
            if (!linked.ok) {
                return next(new ErrorResponse(linked.message, 400))
            }
            return res.status(200).json({
                status: true,
                message: 'Access added to this employee existing login',
                data: {},
                responseCode: '000'
            })
        }

        let result = await createSubCorporate(data, subCorporateUser)
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while creating sub user`, 500))
        } else {
            return res.status(200).json({
                status: true,
                message: 'User invited successfully',
                data: result,
                responseCode: '000'
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong while creating sub user.',
            data: {},
            responseCode: '001'
        });
    }
})


exports.resendInvitation = asyncHandler(async (req, res) => {
    try {
        const requestedBaseUrl = req.query.baseUrl ? Buffer.from(String(req.query.baseUrl), 'base64').toString('utf-8') : null;
        const baseUrl = await resolveFrontendBaseUrl(requestedBaseUrl, req.user?.registeredBy || null);

        const subCorporateId = req.params.subCorporateId
        const subCorporateData = await findOneSubCorporate({ id: subCorporateId }, ['credentialId', 'corporateCredentialID', 'isDeleted'])

        // Tenant scope: only the acting corporate's own, non-deleted sub-users.
        if (!subCorporateData || subCorporateData.isDeleted ||
            String(subCorporateData.corporateCredentialID) !== String(req.user.id)) {
            return res.status(404).json({
                status: false,
                message: 'User not found',
                data: {},
                responseCode: '001'
            });
        }

        const details = await findOneCredential({ id: subCorporateData.credentialId })

        if(!details){
            return res.status(404).json({
                status: false,
                message: 'User not found',
                data: {},
                responseCode: '001'
            });
        }

        if(details.password){
            return res.status(401).json({
                status: false,
                message: 'Unable to resend the invitation. The user has already created a new password.',
                data: {},
                responseCode: '001'
            });
        }
        //Get reset token
        const resetToken = details.getResetPasswordToken(INVITATION_TOKEN_EXPIRY_MINUTES);
        
        await credential.update({
            passwordResetToken: resetToken.resetPasswordToken,
            passwordResetExpires: resetToken.resetPasswordExpire,
            passwordHistory: { "currentPassword": "", "previousPasswords": [] }
        }, {
            where: { id: details.id }
        })

        let resetUrl = baseUrl + "/reset-password?token=" + resetToken.resetPasswordToken + "&username=" + details.dataValues.username + "&isForgot=false"

        const message = `Please create a new password for your Peko account before logging in.<br><br>
        If the button above is unresponsive, you may click on the link below.<br>
        <a href="${resetUrl}" style="color:#FF3A3A;text-decoration:underline;word-break:break-all;">${resetUrl}</a>`;
    const to = details.email;
    let partnerData;
    req.user.registeredBy ?
      partnerData = await fetchPartnerDetails(req.user.registeredBy)
      :
      partnerData = await partnerLogos()
    const { subject, html, sender } = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.SET_NEW_PASSWORD,
      partnerId: req.user.registeredBy || null,
      variables: {
        username: details?.username,
        resetUrl,
        message,
        branding: partnerData?.branding || 'Peko',
        ...v2LayoutVariables({
          website: partnerData?.baseUrl || 'https://in.peko.one',
          logo: partnerData?.logo,
          branding: partnerData?.branding || 'Peko',
          socials: PEKO_SOCIAL_LINKS,
        }),
      },
      fallbackSubject: "Set New Password",
      fallback: () => emailTemplates.setNewPasswordTemplate(details, resetUrl, message, partnerData),
      logTraceId: req?.LogTraceId,
    });
    // Call email function to send email with payment details in the body
    emailer.email(to, subject, html, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    }, sender);
    return res.status(200).json({
      status: true,
      message: "Invitation send successfully.",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateSubCorporate = asyncHandler(async (req, res, next) => {
    try {
        const subCorporateId = req.params.subCorporateId
        const data = req.body

        // The account holder's row is reachable by EVERY corporate admin: its corporateCredentialID is the
        // acting corporate's credential id, which is exactly what the tenant scope matches. So an invited
        // Admin could PUT { name, mobileNo } at it — renaming the account holder and moving the number the
        // issuer files their KYC under — because the only owner-row check lived inside the role branch below
        // and a body carrying no `role` skipped it entirely.
        //
        // Their own details stay theirs to edit, so this refuses the row only for someone who is not them.
        // `isOwnerRow` throws rather than returning false on a failed lookup, so a broken check answers 500
        // and the write does not happen.
        const targetsOwnerRow = await isOwnerRow({ id: subCorporateId, corporateCredentialID: req.user.id })
        const isOwnerSession = req.user?.role === 'CORPORATE'

        if (targetsOwnerRow && !isOwnerSession) {
            return rejectOwnerRow(res, 'Only the account owner can change their own details.');
        }

        if (Object.prototype.hasOwnProperty.call(data, 'role')) {
            const role = typeof data.role === 'string' ? data.role.trim() : ''
            // Nobody changes their own role — otherwise an Admin cannot be demoted safely and, worse, the
            // route becomes a self-promotion path the moment any caller slips past the guard.
            if (String(subCorporateId) === String(req.user?.subCorporateId)) {
                return res.status(403).json({
                    status: false,
                    message: 'You cannot change your own role.',
                    data: {},
                    responseCode: FORBIDDEN
                });
            }
            // The self-role guard above cannot catch the account owner: a CORPORATE session carries no
            // subCorporateId to compare against. Their authority comes from their credential, not this column.
            if (targetsOwnerRow) {
                return rejectOwnerRow(res, 'The account owner is always an Admin.');
            }
            data.role = role
        }

        if (!Array.isArray(data.services) || data.services.length === 0) {
            return next(new ErrorResponse(`Select at least one service`, 400))
        }

        const partnerPermissionData = await resolveServicePermissionsForSession(req.user, ['permissions']);

        if (!partnerPermissionData
            || !Array.isArray(partnerPermissionData.permissions)
            || partnerPermissionData.permissions.length === 0) {
            customLog(req?.LogTraceId, "error", {
                message: 'Could not resolve service permissions for sub-user access update',
                registeredBy: req.user.registeredBy,
                corporateId: req.user.corporateId
            });
            return next(new ErrorResponse(`Unable to resolve service permissions for this account. Please contact support.`, 500))
        }

        const filteredPartnerPermissions = clampRequestedServices(data.services, partnerPermissionData.permissions);

        if (filteredPartnerPermissions.length === 0) {
            return next(new ErrorResponse(`None of the selected services are available on your account`, 400))
        }
        data.services = filteredPartnerPermissions;

        const result = await updateSubCorporate(data, { id: subCorporateId, corporateCredentialID: req.user.id })
        if(result){
            await updateSubCorporateServices(subCorporateId)

            return res.status(201).json({
                status: true,
                message: 'User access updated successfully',
                data: {},
                responseCode: '000'
            });
        }else {
            return res.status(404).json({
                status: false,
                message: 'Failed to update user access',
                data: {},
                responseCode: '001'
            });
        }

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001'
        });
    }
})

exports.changeStatusSubCorporate = asyncHandler(async (req, res) => {
    try {
        const subCorporateId = req.params.subCorporateId
        const status = req.body.status

        if (await isOwnerRow({ id: subCorporateId, corporateCredentialID: req.user.id })) {
            return rejectOwnerRow(res, 'The account owner cannot be deactivated.');
        }

        const result = await updateStatus({ status, id: subCorporateId ,email:req.user.email, partnerId: req.user.registeredBy, corporateCredentialID: req.user.id })

        if (result) {
            return res.status(201).json({
                status: true,
                message: 'User status updated successfully',
                data: {},
                responseCode: '000'
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Failed to update user status',
                data: {},
                responseCode: '001'
            });
        }

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001'
        });
    }
})

exports.deleteSubCorporate = asyncHandler(async (req, res) => {
    try {
        const subCorporateId = req.params.subCorporateId

        if (await isOwnerRow({ id: subCorporateId, corporateCredentialID: req.user.id })) {
            return rejectOwnerRow(res, 'The account owner cannot be removed.');
        }

        let partnerDetails;
        if(req?.user?.registeredBy){
            partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
        } else {
            partnerDetails = await partnerLogos();
        }
        const result = await deleteSubCorporate({ subCorporateId, email: req.user.email, partnerDetails, corporateCredentialID: req.user.id }, req?.user?.registeredBy || null);

        if (result) {

            const subCorporateData = await findOneSubCorporate({ id: subCorporateId }, ['credentialId'])
            await updateSubCorporateServices(subCorporateData?.credentialId)

            return res.status(201).json({
                status: true,
                message: 'User deleted successfully',
                data: {},
                responseCode: '000'
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'User not found or already deleted',
                data: {},
                responseCode: '001'
            });
        }

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001'
        });
    }
})

exports.subCorporateProfile = asyncHandler(async (req, res) => {
    try {

        const subCorporateId = req.user.subCorporateId

        const result = await findOneSubCorporate({ id: subCorporateId }, ['name', 'email', 'mobileNo', 'role']);

        if (result) {
            return res.status(201).json({
                status: true,
                message: 'User profile successfully',
                data: { ...result },
                responseCode: '000'
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Something went wrong',
                data: {},
                responseCode: '001'
            });
        }

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001'
        });
    }
})
exports.sendNotification = asyncHandler(async (req, res) => {
    try {
        const subCorporateUser = req.user.subCorporateUsername;
      const notificationData = {
        notificationTitle: "Service Upgrade Request",
        notificationBrief: `User ${subCorporateUser} has requested access to additional services.`,
        notificationTo: [req.user.username], 
        notificationCategory: "CORPORATE",
        notificationBy: subCorporateUser, 
      };
      
        const result = await createNotification(notificationData)


        if (result) {
            return res.status(201).json({
                status: true,
                message: 'Notification sent successfully',
                data: { ...result },
                responseCode: '000'
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Something went wrong',
                data: {},
                responseCode: '001'
            });
        }

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001'
        });
    }
})

// exports.checkNotification = asyncHandler(async (req, res) => {
//     try {
//         const subCorporateUser = req.user.subCorporateUsername;
//         const notificationTitle ="Service Upgrade Request";
//         const notificationTo=req.user.username;
         
//         const existingNotification= await notifications.findOne({
//             where:{
//                 notificationTitle: notificationTitle,
//                 notificationBy: subCorporateUser,
//                 notificationTo: notificationTo
//             }
//         })
      
//         if (existingNotification) {
//             return res.status(201).json({
//                 status: true,
//                 message: 'Notification already exist',
//                 responseCode: '000'
//             });
//         } else {
//             return res.status(201).json({
//                 status: false,
//                 message: 'Notification does not exist',
//                 responseCode: '001'
//             });
//         }

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             status: false,
//             message: 'Something went wrong',
//             data: {},
//             responseCode: '001'
//         });
//     }
// })