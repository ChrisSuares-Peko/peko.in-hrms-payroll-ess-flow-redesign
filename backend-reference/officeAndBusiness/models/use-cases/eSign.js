const asyncHandler = require('../../middlewares/async');
const { formattedDateTime, startOfDay, endOfDay } = require('../../utils/formatter');
const { handleSortFields } = require('../../utils/sortHandle');
const credential = require('../entities/credential');
const eSign = require('../entities/eSign');
const { Op } = require("sequelize");
const SubCorporateUser = require('../entities/subCorporateUsers');
const { customLog } = require('../../utils/loggerHelper');
const { uploadFile } = require('../../utils/commonUploadFile');
const moment = require('moment');

exports.findESignDocById = asyncHandler(async (id, attributes = undefined, credentialId = undefined) => {
    try {
        // Owner scope (F-OAB-06): when a credentialId is supplied (user-facing calls) the doc must
        // belong to the caller; server-side callers (webhook) pass none and look up by id only.
        const where = { id };
        if (credentialId) where.credentialId = credentialId;
        const eSignDoc = await eSign.findOne({
            where,
            attributes,
            raw: true,
            nest: true
        });

        if (eSignDoc) {
            return { status: true, data: eSignDoc };
        } else {
            return { status: false, message: 'eSign document not found' };
        }
    } catch (error) {
        console.log({ error });
        return { status: false, message: 'Something went wrong while fetching the document' };
    }
});

exports.findESignDoc = asyncHandler(async () => {
    try {
        const currentDate = new Date();

        const eSignDoc = await eSign.findAll({
            attributes: [
                'docket_title',
                'expiry_date',
                'reminder_interval',
                'reminder',
                'status',
                'createdAt',
                'signers_info',
                'doc_expiry_date',
                'audit_trail_url'

            ],
            where: {
                status: 'PENDING',
                expiry_date: {
                    [Op.gt]: currentDate // Filter  with non-expired dates at the database level
                },
                reminder: true // Filter  where reminder is true
            },
            include: [{
                model: credential,
                attributes: ['registeredBy'] 
            }],
            raw: true // ensures the result is a plain JavaScript object
        });

        return { status: true, data: eSignDoc };

    } catch (error) {
        console.error("Error fetching eSign documents:", error);
        return { status: false, message: 'Something went wrong while fetching the document' };
    }
});

exports.findDocToUpdate = asyncHandler(async ({ document_id, docket_id }) => {
    await customLog(null, "info", {
        message: "findDocToUpdate called",
        document_id,
        docket_id
    }, "VENDOR");

    try {
        const eSignDoc = await eSign.findOne({
            where: { document_id, docket_id },
            nest: true
        });

        if (eSignDoc) {
            await customLog(null, "info", {
                message: "eSign document found",
                document_id,
                docket_id,
                eSignDocId: eSignDoc.id
            }, "VENDOR");

            return { status: true, data: eSignDoc };
        } else {
            await customLog(null, "info", {
                message: "eSign document not found",
                document_id,
                docket_id
            }, "VENDOR");

            return { status: false, message: 'eSign document not found' };
        }
    } catch (error) {
        await customLog(null, "error", {
            message: "Error while fetching eSign document",
            error: error.message,
            document_id,
            docket_id
        }, "VENDOR");

        return { status: false, message: 'Something went wrong while fetching the document' };
    }
});

exports.createESignDoc = asyncHandler(async (apiRes, req) => {
    try {
        const credentialId = req.user.id
        const body = req.body
        const user = req.user
        const { signers_info: body_signers_info, docket_title,docket_description, expiry_date,
            sequentialSignature, documentBase64, reminder, reminder_interval,initiator_name,initiator_email, termsofUse,eSignType, sourceType, sourceId } = body
        const api_signers_info = apiRes.signer_info
        let signers_info = body_signers_info.map((element, i) => {
            let apiResSigner = api_signers_info[i] || {}
            return { ...element, ...apiResSigner, status: "unsigned" }
        })
        let document_id = signers_info[0]?.document_id || apiRes.document_id
        const base64String = documentBase64.replace(/^data:application\/pdf;base64,/, '');
        const filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/eSignDocs`
        let uploadedUrl = await uploadFile(base64String, filePath, 'pdf');
        const newESign = await eSign.create({
            docket_id: apiRes.docket_id,
            document_id,
            docket_title,
            docket_description,
            document_url: uploadedUrl,
            expiry_date,
            sequentialSignature,
            signers_info,
            initiator_name,
            initiator_email,
            reminder,
            termsofUse,
            reminder_interval: parseInt(reminder_interval) || 0,
            status: 'PENDING',
            credentialId: credentialId,
            subCorporateUserId: apiRes.subCorporateUserId,
            eSignType,
            consentAgreed: termsofUse ? true : false,
            consentAt: termsofUse ? new Date() : null,
            sourceType: sourceType || null,
            sourceId: sourceId || null
        });
        if (newESign) {
            return { status: true, data: newESign }
        } else {
            return { status: false, message: 'Something went wrong while creating document' }
        }
        // return true;
    } catch (error) {
        console.log({ error })
        return { status: false, message: 'Something went wrong while creating document' }
    }
})


exports.findAllESignDocs = async (params, userId = false, attributes = undefined) => {
    try {
        let { page, pageSize, searchText, order, column, subCorporateUserId, from, to } = params
        let columnNames = [
            "createdAt"
        ];
        // Convert column index to column name
        if (column >= 0 && column < columnNames.length) {
            column = columnNames[column];
        } else {
            column = 'createdAt'; // Default column name if invalid index is provided
        }
        const searchPattern = `%${searchText}%`;
        // Prepare the where clause
        // Only lists e-signs with no sourceType — agreement/legal-document/offer-letter
        // e-signs have their own dedicated views and are excluded from this generic listing.
        let whereClause = {
            sourceType: null,
            [Op.or]: [{
                docket_title: {
                    [Op.like]: searchPattern
                }
            }, {
                status: {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.name$': {
                    [Op.like]: searchPattern
                }
            }]
        };

        // If userId is available, add it to the where clause
        if (userId) {
            whereClause.credentialId = userId;
        }

        if (subCorporateUserId) {
            whereClause.subCorporateUserId = subCorporateUserId;
        }

        if (from || to) {
            whereClause.createdAt = {
                ...(from && { [Op.gte]: startOfDay(from) }),
                ...(to && { [Op.lte]: endOfDay(to) }),
            };
        }

        return await eSign.findAndCountAll({
            attributes,
            include: [{
                model: credential,
                attributes: ['id', 'name']
            },
            {
                model: SubCorporateUser,
                attributes: ['id', 'name'],
                required: false
            }],
            where: whereClause,
            order: [
                [column, order]
            ],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            raw: true,
            nest: true,
        })
    } catch (error) {
        console.log({ error })
        return false
    }

}


exports.findAlleSignsCount = asyncHandler(async ({ page, itemsPerPage, searchText, sort, sortField, corporateId }, attributes = undefined) => {
    try {
        let order = handleSortFields(sortField, sort)
        const searchPattern = `%${searchText}%`;
        let whereClause = {
            [Op.or]: [{
                docket_title: {
                    [Op.like]: searchPattern
                }
            }, {
                status: {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.name$': {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.username$': {
                    [Op.like]: searchPattern
                }
            }
            ]
        };
        if (corporateId) {
            whereClause.credentialId = corporateId;
        }


        const data = await eSign.findAndCountAll({
            include: [{
                model: credential,
                attributes: ['name', 'username']
            }],
            attributes,
            where: whereClause,
            order: order,
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            raw: true,
            nest: true,
        });

        return data;
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
});

exports.countESignDocs = async (userId, subCorporateUserId) => {
    try {
        const baseWhere = {
            credentialId: userId,
            sourceType: null,
            ...(subCorporateUserId && { subCorporateUserId })
        };

        const [count, pendingCount, completedCount, lastESign] = await Promise.all([
            eSign.count({ where: baseWhere }),
            eSign.count({ where: { ...baseWhere, status: 'PENDING' } }),
            eSign.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
            eSign.findOne({
                where: baseWhere,
                order: [['createdAt', 'DESC']],
                attributes: ['createdAt']
            })
        ]);
        const lastESignAddedDate = lastESign ? lastESign.createdAt : null;

        return { count, pendingCount, completedCount, lastESignAddedDate };
    } catch (error) {
        customLog(null, 'error', { step: 'countESignDocs', error: error.message, stack: error.stack });
        return false;
    }
};

// Counts eSign usage within the current billing cycle, for enforcing the plan's eSign quota.
// Kept separate from countESignDocs (dashboard totals) because the quota applies corporate-wide
// (not per sub-user) and resets each billing cycle, unlike the dashboard's all-time totals.
exports.countESignDocsInBillingCycle = async (userId, currentSubscription) => {
    try {
        let startDate = moment().startOf('month');
        let endDate = moment().endOf('month');
        const today = moment();

        if (currentSubscription && currentSubscription.billingType === 'MONTHLY') {
            const subStart = moment(currentSubscription.subscriptionStartDate);
            const subEnd = currentSubscription.subscriptionEndDate
                ? moment(currentSubscription.subscriptionEndDate)
                : moment().endOf('month');
            startDate = subStart.isValid() ? subStart : moment().startOf('month');
            endDate = subEnd.isValid() ? subEnd : moment().endOf('month');
        } else if (currentSubscription && currentSubscription.billingType === 'ANNUALLY') {
            const subStart = moment(currentSubscription.subscriptionStartDate);
            const subEnd = currentSubscription.subscriptionEndDate
                ? moment(currentSubscription.subscriptionEndDate)
                : moment().endOf('year');

            if (today.isSame(subStart, 'month') && today.isSame(subStart, 'year')) {
                startDate = subStart.isValid() ? subStart : moment().startOf('month');
                endDate = moment(startDate).endOf('month');
            } else {
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
            }

            if (subEnd.isValid() && endDate.isAfter(subEnd)) {
                endDate = subEnd;
            }
        }

        const count = await eSign.count({
            where: {
                credentialId: userId,
                createdAt: {
                    [Op.between]: [startDate.toDate(), endDate.toDate()]
                }
            }
        });

        return { count };
    } catch (error) {
        customLog(null, 'error', { step: 'countESignDocsInBillingCycle', error: error.message, stack: error.stack });
        return false;
    }
};

exports.documentsAndCountExport = asyncHandler(async ({ searchText, sort, sortField, corporateId }) => {
    try {
        let order = handleSortFields(sortField, sort)

        const searchPattern = `%${searchText}%`;

        let whereClause = {
            [Op.or]: [{
                docket_title: {
                    [Op.like]: searchPattern
                }
            }, {
                status: {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.name$': {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.username$': {
                    [Op.like]: searchPattern
                }
            }
            ]
        };
        if (corporateId) {
            whereClause.credentialId = corporateId;
        }

        const data = await eSign.findAndCountAll({
            include: [{
                model: credential,
                attributes: ['name', 'username']
            }],
            where: whereClause,
            order: order,
            raw: true,
            nest: true,
        });

        let finalData = []
        data.rows.forEach(function (limitData) {
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Corporate Name": limitData?.credential?.name || 'Not Available',
                "Corporate ID": limitData?.credential?.username || 'Not Available',
                "Document Name": limitData.docket_title ? limitData.docket_title : "Not Available",
                Status: limitData.status || "Not Available",
            })
        })
        return finalData
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
});