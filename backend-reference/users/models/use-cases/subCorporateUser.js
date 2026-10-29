const asyncHandler = require("../../middlewares/async");
const SubCorporateUsers = require("../entities/subCorporateUsers");
// const corporateUser = require("../entities/corporateUser");
const credential = require("../entities/credential");
const sequelize = require('../../configs/database/index');
const emailTemplates = require('../../utils/emailTemplate/userManagement');
const emailer = require('../../utils/emailer');
const { Op } = require("sequelize");
const { literal } = require("sequelize");
const { ROLE_NAMES } = require("../../utils/subCorporateRoleNames");

// The corporate OWNER's own cardholder row, identified STRUCTURALLY rather than by a stored flag.
//
// A member's row is written against their own credential — a brand-new one at invite (see createSubCorporate
// below), or an existing ESS employee's (see linkMemberIdentity), which resolveInviteTarget refuses to resolve
// to the inviter's own. Either way their `credentialId` can never equal the parent's `corporateCredentialID`.
// The owner's profile is created against their EXISTING credential, so for that one row the two are the same.
// Nothing has to be kept in sync, and no column had to be added to a shared table.
//
// `<=>` is the null-safe equality operator: a legacy row with a NULL corporateCredentialID must compare
// false, not NULL, or plain `NOT (a = b)` would silently drop it from every listing.
// The qualifier depends on the STATEMENT, so one literal cannot serve both. A SELECT is emitted with the
// table aliased AS the define() name (`subCorporateUser`); an UPDATE is emitted against the raw table with no
// alias at all (`subCorporateUsers`). Getting it wrong does not degrade gracefully — MySQL rejects the whole
// statement with "Unknown column", the use-case's catch turns that into `false`, and the caller reports a bare
// "not found". That is exactly how the owner guards broke every delete and status change.
const ownerRowSql = (qualifier) =>
    `\`${qualifier}\`.\`credentialId\` <=> \`${qualifier}\`.\`corporateCredentialID\``;

const MODEL_ALIAS = 'subCorporateUser';
const TABLE_NAME = 'subCorporateUsers';

const IS_OWNER_ROW = literal(ownerRowSql(MODEL_ALIAS));
const IS_NOT_OWNER_ROW = literal(`NOT (${ownerRowSql(MODEL_ALIAS)})`);
/** The same predicate for an UPDATE's where-clause, where there is no alias to qualify with. */
const IS_NOT_OWNER_ROW_ON_TABLE = literal(`NOT (${ownerRowSql(TABLE_NAME)})`);

/**
 * True when `id` is the acting corporate's OWN cardholder row.
 *
 * The member endpoints reach that row by construction: its corporateCredentialID IS the acting corporate's
 * credential id, which is exactly what the tenant scope matches. So a scope check alone never excludes it,
 * and the "you cannot change your own role" guard misses it too — a CORPORATE session carries no
 * subCorporateId to compare against. Every member WRITE has to ask this question explicitly.
 *
 * Deliberately unwrapped and never swallowing: a failed lookup throws, the caller's catch answers 500, and
 * the write does not happen. Returning false on error would fail OPEN on the one row that must not be lost.
 */
exports.isOwnerRow = async ({ id, corporateCredentialID }) => {
    const row = await SubCorporateUsers.findOne({
        where: {
            id,
            corporateCredentialID: String(corporateCredentialID),
            [Op.and]: [IS_OWNER_ROW]
        },
        attributes: ['id'],
        raw: true
    });
    return !!row;
};
const Pusher = require('pusher');
const { fetchPartnerDetails } = require("./systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { PUSHER_SUBCORP_CONFIG } = require("../../utils/pusherConfig");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../../utils/emailTemplate/sharedLayout");

const pusher = new Pusher({
    ...PUSHER_SUBCORP_CONFIG,
    useTLS: true
})

// The account-disabled email, from the admin-managed template when one is published and
// from emailTemplates.disableAccess otherwise. Two callers reach this — a status change
// to INACTIVE and a delete — each with their own subject; a published template carries
// its own subject and so speaks for both.
const sendDisableAccessEmail = async ({ to, name, partnerDetails, partnerId = null, fallbackSubject }) => {
    const { subject, html, sender } = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.SUBCORPORATE_ACCESS_DISABLED,
        partnerId,
        variables: {
            name,
            branding: partnerDetails?.branding || 'Peko',
            ...v2LayoutVariables({
                website: partnerDetails?.baseUrl || 'https://in.peko.one',
                logo: partnerDetails?.logo,
                branding: partnerDetails?.branding || 'Peko',
                socials: PEKO_SOCIAL_LINKS,
            }),
        },
        fallbackSubject,
        fallback: () => emailTemplates.disableAccess(name, to, partnerDetails),
    });

    emailer.email(to, subject, html, function () {
        console.log("Email sent to " + to);
    }, sender);
};

exports.findAndCountAllSubCorporateUsers = asyncHandler(async (params) => {
    const {
        limit,
        offset,
        corporateId,
        status,
        searchText
    } = params

    try {
        let whereConditions = {
            corporateUserId: corporateId,
            isDeleted: false,
            // The owner's own cardholder row is an identity, not a member — it must never appear in the
            // members list or be counted toward seats.
            [Op.and]: [IS_NOT_OWNER_ROW]
        };

        if (status) {
            whereConditions.status = status;
        }

        const likeSearch = `%${searchText}%`;

        if (searchText?.trim()) {
            whereConditions[Op.or] = [
                { name: { [Op.like]: likeSearch } },
                { email: { [Op.like]: likeSearch } },
                { mobileNo: { [Op.like]: likeSearch } },
                { role: { [Op.like]: likeSearch } },
            ];
        }

        return await SubCorporateUsers.findAndCountAll({
            include: [
                {
                    model: credential,
                    attributes: ['username']
                },
            ],
            where: whereConditions,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        })

    } catch (error) {
        return false
    }
})

exports.findUserExist = asyncHandler(async (params) => {
    // Helper function to check existence
    const checkExistence = async (model, whereCondition, message) => {
        const result = await model.findOne({ where: whereCondition });
        if (result) {
            return { exist: true, message, subCorporateId:result?.id, email: result?.email };
        }
        return null;
    };

    // Check for corporate user email existence
    let existenceCheck = await checkExistence(
         credential,
        {
            email: params.email,
        },
        'The email address is already associated with another account.'
    );

    if (existenceCheck) return existenceCheck;

    // Check for corporate user mobil existence
    // existenceCheck = await checkExistence(
    //     corporateUser,
    //     {
    //         mobileNo: params.mobileNo,
    //     },
    //     'The mobile number is already associated with another account.'
    // );

    if (existenceCheck) return existenceCheck;

    // Check for sub corporate user email existence
    existenceCheck = await checkExistence(
        SubCorporateUsers,
        { 
            email: params.email 
        },
        'The email address is already associated with another account.'
    );

    if (existenceCheck) return existenceCheck;

    // Check for sub corporate user mobile number existence
    // existenceCheck = await checkExistence(
    //     SubCorporateUsers,
    //     {
    //       mobileNo: params.mobileNo
    //     },
    //     'The mobile number is already associated with another account.'
    // );
    // if (existenceCheck) return existenceCheck;

    // If none exist, return false
    return { exist: false, message: '' };
})

exports.checkDeletedUserExits = asyncHandler(async (params)=>{
    const user = await SubCorporateUsers.findOne({
        where: {
            [Op.and]: [
                {email:params.email},
                {corporateCredentialID:params.corporateCredentialID},
                {isDeleted:true}
            ]
        }
    })
    
    return user
})

exports.restoreSubCorporate = asyncHandler(async (params) => {
    try {
        // Find the user with the given email, mobile, and isDeleted=true
        const user = await SubCorporateUsers.findOne({
            where: {
                [Op.and]: [
                    { email: params.email },
                    {corporateCredentialID:params.corporateCredentialID},
                    { isDeleted: true }
                ]
            }
        });

        if (user) {
            // Update isDeleted to false using the found user's id
            const [affectedRows] = await SubCorporateUsers.update({
                isDeleted: false,
                services:params.services
            }, {
                where: {
                    id: user.id
                }
            });

            return affectedRows > 0
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
});


exports.createSubCorporate = asyncHandler(async (params, userData) => {
    let transaction = await sequelize.transaction();
    params.role = "CORPORATE_SUB_USER"

    try {
        const details = await credential.create(params, {
            transaction: transaction
        })

        userData = {
            ...userData,
            credentialId: details.id
        };
        const subCorporateUser = await SubCorporateUsers.create(userData,
            {
                transaction: transaction
            }
        )

        //Get reset token
        const resetToken = details.getResetPasswordToken(4320);
        await credential.update({
            passwordResetToken: resetToken.resetPasswordToken,
            passwordResetExpires: resetToken.resetPasswordExpire,
            passwordHistory: { "currentPassword": "", "previousPasswords": [] }
        }, {
            where: { id: details.id },
            transaction: transaction
        })

        await transaction.commit();

        try {
            const baseUrl = params?.baseUrl
            const resetUrl = baseUrl + "/reset-password?token=" + resetToken.resetPasswordToken + "&username=" + details.dataValues.username + "&isForgot=false"

        const to = params.email;

        const emailDatas = {
            ...subCorporateUser.dataValues,
            username: details.username,
            corporateEmail: userData.corporateEmail
        }
        let partnerData;
        details?.registeredBy ?
             partnerData = await fetchPartnerDetails(details?.registeredBy)
             :
             partnerData = await partnerLogos()
        const fallbackSubject = `Welcome to ${partnerData?.branding || 'Peko'}!`;

        // The account-created-with-password email, from the admin-managed template when
        // one is published and from emailTemplates.createPassword otherwise.
        const { subject, html: body, sender } = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.SUBCORPORATE_WELCOME,
            partnerId: details?.registeredBy || null,
            variables: {
                name: emailDatas?.name,
                email: emailDatas?.email,
                username: emailDatas?.username,
                corporateEmail: emailDatas?.corporateEmail,
                resetUrl,
                servicesHtml: emailTemplates.buildWelcomeServicesHtml(emailDatas?.services),
                branding: partnerData?.branding || 'Peko',
                ...v2LayoutVariables({
                    website: partnerData?.baseUrl,
                    logo: partnerData?.logo,
                    branding: partnerData?.branding,
                    socials: PEKO_SOCIAL_LINKS,
                }),
            },
            fallbackSubject,
            fallback: () => emailTemplates.createPassword(emailDatas, resetUrl, partnerData),
        });
            emailer.email(to, subject, body, function () {
                console.log("Email sent to " + to);
            }, sender);
        } catch (emailError) {
            console.log(emailError, "sub corporate invite email failed")
        }

        return subCorporateUser
    } catch (error) {
        console.log(error,"errorrr")
        if (!transaction.finished) {
            await transaction.rollback();
        }
        return false
    }
})

exports.updateSubCorporate = asyncHandler(async (data, params) => {
    try {
        const UPDATABLE = ['name', 'email', 'mobileNo', 'services', 'role'];
        const safeData = {};
        UPDATABLE.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(data, key)) safeData[key] = data[key];
        });

        const [affectedRows] = await SubCorporateUsers.update(safeData, {
            where: {
                // Tenant scope: only the acting corporate's own, non-deleted sub-users.
                id: params.id,
                corporateCredentialID: String(params.corporateCredentialID),
                isDeleted: false,
                // The account owner is always an Admin. The controller refuses this first; the predicate is
                // here too so a role write can never land on that row even if a caller slips past it.
                ...(Object.prototype.hasOwnProperty.call(safeData, 'role') ? { [Op.and]: [IS_NOT_OWNER_ROW_ON_TABLE] } : {})
            }
        })

        if (affectedRows > 0) {
            const updatedRecord = await SubCorporateUsers.findOne({
                where: {
                    id: params.id
                }
            });
            const partnerDetails = params?.partnerId
                ? await fetchPartnerDetails(params.partnerId)
                : await partnerLogos();

            const { subject, html, sender } = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.SUBCORPORATE_ACCESS_UPDATED,
                partnerId: params?.partnerId || null,
                variables: {
                    name: updatedRecord?.name,
                    email: params?.email,
                    branding: partnerDetails?.branding || 'Peko',
                    servicesHtml: emailTemplates.buildAccessUpdateServicesHtml(updatedRecord?.services),
                    ...v2LayoutVariables({
                        website: partnerDetails?.baseUrl || 'https://in.peko.one',
                        logo: partnerDetails?.logo,
                        branding: partnerDetails?.branding || 'Peko',
                        socials: PEKO_SOCIAL_LINKS,
                    }),
                },
                fallbackSubject: "Access Updated",
                fallback: () => emailTemplates.UpdateAccess(updatedRecord, params?.email, partnerDetails),
            });
            // Call email function to send email with payment details in the body
            emailer.email(updatedRecord?.email, subject, html, function () {
                console.log("Email sent to " + updatedRecord?.email);
            }, sender);
            return affectedRows > 0;
        }else{
            return false
        }
    } catch (error) {
        // console.error('Error finding cashback row:', error);
        return false
    }
})

exports.updateSubCorporateServices = async (id) => {
    try {
        const credentialId = Number(id)
        pusher.trigger('sub-user-logout', 'logged out', {
            credentialId,
        });
    } catch (error) {
        // console.log("ERROR BLOCK - ", error);
    } finally {
        // console.log("updateSubCorporate")
    }
}

exports.updateStatus = asyncHandler(async (params) => {
    const { status, id, corporateCredentialID } = params
    try {
        const [affectedRows] = await SubCorporateUsers.update({
            status: status
        }, {
            where: {
                id: id,
                // Tenant scope. Without it this matched on id alone, so any corporate admin could disable
                // any sub-user on the platform.
                corporateCredentialID: String(corporateCredentialID),
                isDeleted: false,
                // Disabling the account holder's own cardholder row would strand them out of their cards.
                [Op.and]: [IS_NOT_OWNER_ROW_ON_TABLE]
            }
        })
        if (affectedRows > 0) {
            if (status === 'INACTIVE') {
                const updatedRecord = await SubCorporateUsers.findOne({
                    where: {
                        id: params.id
                    }
                });

                const partnerDetails = params?.partnerId
                    ? await fetchPartnerDetails(params.partnerId)
                    : await partnerLogos();

                await exports.updateSubCorporateServices(params.id)

                await sendDisableAccessEmail({
                    to: updatedRecord?.email,
                    name: updatedRecord?.name,
                    partnerDetails,
                    partnerId: params?.partnerId || null,
                    fallbackSubject: "Account disabled",
                });

            }
            return affectedRows > 0;
        }
    } catch (error) {
        return false
    }
})

/**
 * Soft-delete one member.
 *
 * Takes a single object: `asyncHandler` here is the Express form and forwards only three arguments, so a
 * fourth positional parameter would be silently dropped.
 */
exports.deleteSubCorporate = asyncHandler(async ({ subCorporateId, partnerDetails = undefined, corporateCredentialID }, partnerId = null) => {
    try {
        const [affectedRows] = await SubCorporateUsers.update({
            isDeleted: true
        }, {
            where: {
                id: subCorporateId,
                // Tenant scope. Without it this matched on id alone — any corporate admin could soft-delete
                // any sub-user on the platform.
                corporateCredentialID: String(corporateCredentialID),
                isDeleted: false,
                // Deleting the account holder's own cardholder row is unrecoverable: findOwnerProfile filters
                // on isDeleted, and the mobile unique index does NOT exclude deleted rows, so it could never
                // be recreated. It would orphan any card they hold.
                [Op.and]: [IS_NOT_OWNER_ROW_ON_TABLE]
            }
        });
        if (affectedRows > 0) {
            const updatedRecord = await SubCorporateUsers.findOne({
                where: {
                    id: subCorporateId
                }
            });

            if(updatedRecord.status !== 'INACTIVE'){

                await sendDisableAccessEmail({
                    to: updatedRecord?.email,
                    name: updatedRecord?.name,
                    partnerDetails,
                    partnerId,
                    fallbackSubject: `Your ${partnerDetails?.branding || ''} account access has been disabled`,
                });

            }

            return affectedRows > 0;
        }else{
            return false
        }
    } catch (error) {
        // console.log(error);
        return false;
    }
});

//fetching subcorporate user
exports.findOneSubCorporateByCredentialId = asyncHandler(async (params, attributes = undefined) => {
    return await SubCorporateUsers.findOne({
        include: [{
            model: credential,
            attributes: ['role']
        }],
        where: {
            credentialId: params.id,
        },
        attributes,
        nest: true,
        raw: true
    })
})

//fetching subcorporate user
exports.findOneSubCorporate = asyncHandler(async (params, attributes = undefined) => {
    return await SubCorporateUsers.findOne({
        include: [{
            model: credential,
            attributes: ['role', 'username']
        }],
        where: {
            id: params.id,
        },
        attributes,
        nest: true,
        raw: true
    })
})

exports.signUpCountOfSubCorporate = asyncHandler(async () => {
    try {
        const count = await SubCorporateUsers.count({});
        return count;
    } catch (err) {
        // console.error(err);
        throw new Error('Failed to get sign-up count');
    }
})

exports.findUserExistForSubCorporate = asyncHandler(async (params) => {
    // Helper function to check existence
    const checkExistence = async (model, whereCondition, message) => {
        const result = await model.findOne({ where: whereCondition });
        if (result) {
            return { exist: true, message, subCorporateId:result?.id, email:result?.email, credentialId:result?.credentialId };
        }
        return null;
    };

    // Check for sub corporate user mobile number existence 
    let existenceCheck = await checkExistence(
        SubCorporateUsers,
        {
          mobileNo: params.mobileNo 
        },
        'The mobile number is already associated with another account.'
    );
    if (existenceCheck) return existenceCheck;

    // If none exist, return false
    return { exist: false, message: '' };
})
/**
 * The corporate OWNER's own cardholder profile, created on demand.
 *
 * The owner has no `subCorporateUsers` row — they are the account holder, not a member — but acting as an
 * Employee needs a cardholder identity, because `subCorporateId` is what the KYC and card tables key off.
 * This returns that row, creating it the first time it is asked for.
 *
 * Differs from a real member in three ways, all deliberate:
 *   - `credentialId` is the owner's EXISTING credential. No second login is created and no invite email is
 *     sent; they already have an account and are not being invited to anything.
 *   - Because `credentialId` and `corporateCredentialID` are therefore EQUAL on this row and never on a
 *     member's, that pairing is what identifies it — see OWNER_ROW_SQL. It keeps the row out of every member
 *     listing and count, and stops a sub-corporate Admin acting on it.
 *   - `status` is ACTIVE immediately — there is no invite to accept.
 *
 * `role` is stored as Admin: the owner IS the account admin, and it is what the registration form shows them.
 * It is inert for authority — an owner session never reads it, because cardHelpers#assignedRoleName
 * short-circuits on `credentials.role === 'CORPORATE'` — and the row is excluded from every member listing.
 *
 * name and mobileNo are the owner's PERSONAL details. Callers default them from the corporate record's
 * `contactPersonName` ("Full Name" on the registration form, a separate field from the company name) and
 * `mobileNo` (the handset they OTP-verified at sign-up and log in with). Both are already personal and
 * already verified, which is what lets this row be provisioned without asking them for anything — and it
 * matters, because the row feeds Pine Labs KYC, which verifies an individual and OTPs a personal handset.
 *
 * Returns `{ ok: false, message }` on a refusal so the caller can surface it, rather than throwing.
 */
exports.findOrCreateOwnerProfile = asyncHandler(async ({ credentialId, corporateUserId, name, email, mobileNo, serviceLabel }) => {
    if (!credentialId || !corporateUserId) return { ok: false, message: 'Session context is missing.' }

    const existing = await SubCorporateUsers.findOne({
        where: { corporateUserId, isDeleted: false, [Op.and]: [IS_OWNER_ROW] },
    })
    if (existing) return { ok: true, profile: existing, created: false }

    const personalName = typeof name === 'string' ? name.trim() : ''
    const personalMobile = typeof mobileNo === 'string' ? mobileNo.trim() : String(mobileNo ?? '').trim()
    // No fallback. A blank name used to become 'Account owner', which passes every length check downstream and
    // then fails Pine Labs video KYC — a failure that surfaces far from its cause.
    if (!personalName) return { ok: false, message: 'Please enter your name as it appears on your ID.' }
    if (!/^[6-9]\d{9}$/.test(personalMobile)) {
        return { ok: false, message: 'Please enter a valid 10-digit mobile number.' }
    }

    // No mobile-uniqueness check. Duplicates are allowed by design: one person may hold more than one
    // cardholder row — most obviously the account owner, who is commonly also a member. The consequence is
    // deliberate: corporateCard's cardholderKyc is unique on mobileNumber and looked up by mobile alone, so
    // two rows sharing a number resolve to whichever KYC record was completed first.
    try {
        const profile = await SubCorporateUsers.create({
            name: personalName,
            email,
            mobileNo: personalMobile,
            role: ROLE_NAMES.ADMIN,
            // Mirrors the { label, hasAccess } shape the shared-data queries match with JSON_CONTAINS, so the
            // owner's own card resolves through the same scoped lookup every member's does.
            services: serviceLabel ? [{ label: serviceLabel, hasAccess: true }] : [],
            credentialId,
            corporateCredentialID: String(credentialId),
            corporateUserId,
            status: 'ACTIVE',
        })
        return { ok: true, profile, created: true }
    } catch (error) {
        // Two concurrent first-switches can race between the find and the create. Re-read rather than
        // surfacing the error, so the caller still gets the one row that won.
        const raced = await SubCorporateUsers.findOne({
            where: { corporateUserId, isDeleted: false, [Op.and]: [IS_OWNER_ROW] },
        })
        if (raced) return { ok: true, profile: raced, created: false }
        return { ok: false, message: 'Could not create your cardholder profile. Please try again.' }
    }
})

/**
 * The corporate owner's cardholder row, or null. Read-only counterpart to findOrCreateOwnerProfile, so the
 * switch-role GET can tell the UI whether the first switch still needs to collect personal details — without
 * creating anything as a side effect of merely asking.
 */
exports.findOwnerProfile = asyncHandler(async (corporateUserId) => {
    if (!corporateUserId) return null
    return SubCorporateUsers.findOne({
        where: { corporateUserId, isDeleted: false, [Op.and]: [IS_OWNER_ROW] },
    })
})

/**
 * Grants corporate-cards membership on an EXISTING credential — an ESS employee who is now being invited as a
 * card member. Creates only the subCorporateUsers row: no credential is created, no reset token is issued and
 * no set-password mail is sent, because the person already has a login.
 *
 * The owner rule (credentialId <=> corporateCredentialID) is preserved: the row is written against the
 * employee's own credential while corporateCredentialID stays the inviter's, so the two can never match.
 * resolveInviteTarget refuses the case where they would.
 */
exports.linkMemberIdentity = asyncHandler(async ({
    credentialId,
    corporateUserId,
    corporateCredentialID,
    name,
    email,
    mobileNo,
    role,
    services,
}) => {
    if (!credentialId || !corporateUserId || !corporateCredentialID) {
        return { ok: false, message: 'Session context is missing.' }
    }

    const existing = await SubCorporateUsers.findOne({ where: { credentialId, isDeleted: false } })
    if (existing) return { ok: true, profile: existing, created: false }

    const details = await credential.findOne({ where: { id: credentialId }, attributes: ['id', 'password'] })
    if (!details) return { ok: false, message: 'Session context is missing.' }

    try {
        const profile = await SubCorporateUsers.create({
            name,
            email,
            mobileNo,
            role,
            services,
            credentialId,
            corporateCredentialID: String(corporateCredentialID),
            corporateUserId,
            status: details.password ? 'ACTIVE' : 'PENDING',
        })
        return { ok: true, profile, created: true }
    } catch (error) {
        const raced = await SubCorporateUsers.findOne({ where: { credentialId, isDeleted: false } })
        if (raced) return { ok: true, profile: raced, created: false }
        return { ok: false, message: 'Could not grant access. Please try again.' }
    }
})
