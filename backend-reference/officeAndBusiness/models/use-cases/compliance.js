const compliance = require('../entities/compliance');
const corporateUser = require('../entities/corporateUser');
const credential = require('../entities/credential');
const { Op } = require('sequelize');
const asyncHandler = require('../../middlewares/async');

const ADMIN_TO_USER_STATUS = {
    approved:     'completed',
    rejected:     'pending',
    reopened:     'pending',
    under_review: 'processing',
};

// ─── Corporate use-cases ────────────────────────────────────────────────────

exports.findAllCompliance = asyncHandler(async (corporateId, { page, pageSize, searchText, from, to, status, category }) => {
    const limit = parseInt(pageSize, 10) || 10;
    const offset = ((parseInt(page, 10) || 1) - 1) * limit;

    const whereClause = { corporateId };

    if (status) {
        whereClause.status = status;
    }

    if (category) {
        whereClause.category = category;
    }

    if (searchText) {
        const normalizedSearch = searchText.replace(/\s+/g, '_');
        whereClause[Op.or] = [
            { complianceId: { [Op.like]: `%${searchText}%` } },
            { title: { [Op.like]: `%${searchText}%` } },
            { complianceType: { [Op.like]: `%${searchText}%` } },
            { description: { [Op.like]: `%${searchText}%` } },
            { category: { [Op.like]: `%${searchText}%` } },
            { section: { [Op.like]: `%${searchText}%` } },
            { status: { [Op.like]: `%${searchText}%` } },
            { adminStatus: { [Op.like]: `%${normalizedSearch}%` } },
            compliance.sequelize.literal(`JSON_SEARCH(LOWER(documents), 'one', :complianceSearch, NULL, '$[*].name') IS NOT NULL`),
        ];
    }

    if (from && to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        end.setHours(0, 0, 0, 0);
        whereClause.createdAt = { [Op.between]: [from, end] };
    }

    return await compliance.findAndCountAll({
        where: whereClause,
        ...(searchText ? { replacements: { complianceSearch: '%' + searchText.toLowerCase().replace(/%/g, '\\%').replace(/_/g, '\\_') + '%' } } : {}),
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });
});

exports.findComplianceById = asyncHandler(async (id, corporateId) => {
    return await compliance.findOne({ where: { id, corporateId } });
});

exports.findComplianceByComplianceId = asyncHandler(async (complianceId, corporateId) => {
    return await compliance.findOne({ where: { complianceId, corporateId } });
});

exports.createCompliance = asyncHandler(async (credentialId, corporateId, data) => {
    const complianceId = `COMP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    return await compliance.create({ complianceId, credentialId, corporateId, ...data });
});

exports.submitDocuments = async (id, corporateId, documents, notes, formData) => {
    return await compliance.sequelize.transaction(async (t) => {
        const record = await compliance.findOne({
            where: { id, corporateId },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });

        if (!record) return null;

        const existing = Array.isArray(record.submissionHistory) ? record.submissionHistory : [];
        const historyEntry = {
            status: 'pending',
            timestamp: new Date().toISOString(),
            remarks: null,
            fileName: documents.length ? documents[0].name : null,
        };

        const updatePayload = {
            documents,
            notes: notes || record.notes,
            status: 'pending',
            adminStatus: 'under_review',
            submissionHistory: [...existing, historyEntry],
            rejectedDocumentKeys: [],
            rejectedFormFields: [],
        };
        if (formData) updatePayload.formData = formData;

        return await record.update(updatePayload, { transaction: t });
    });
};

exports.getDashboardSummary = asyncHandler(async (corporateId) => {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [total, approved, pending, overdue, dueSoon, upcoming] = await Promise.all([
        compliance.count({ where: { corporateId } }),
        compliance.count({ where: { corporateId, adminStatus: 'approved' } }),
        compliance.count({ where: { corporateId, status: 'pending' } }),
        compliance.count({
            where: {
                corporateId,
                dueDate: { [Op.lt]: now },
                adminStatus: { [Op.notIn]: ['approved'] },
            },
        }),
        compliance.count({
            where: {
                corporateId,
                dueDate: { [Op.between]: [now, sevenDaysFromNow] },
                adminStatus: { [Op.notIn]: ['approved'] },
            },
        }),
        compliance.count({
            where: {
                corporateId,
                dueDate: { [Op.gt]: sevenDaysFromNow },
                adminStatus: { [Op.notIn]: ['approved'] },
            },
        }),
    ]);

    const healthScore = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, approved, pending, overdue, dueSoon, upcoming, healthScore };
});

// ─── Admin use-cases ─────────────────────────────────────────────────────────

exports.findAllComplianceAdmin = asyncHandler(async ({ page, itemsPerPage, searchText, from, to, status, sort, sortField }) => {
    const limit = parseInt(itemsPerPage, 10) || 20;
    const offset = ((parseInt(page, 10) || 1) - 1) * limit;

    const whereClause = {};

    if (status) {
        whereClause.adminStatus = status;
    }

    if (searchText) {
        whereClause[Op.or] = [
            { title: { [Op.like]: `%${searchText}%` } },
            { complianceType: { [Op.like]: `%${searchText}%` } },
            { complianceId: { [Op.like]: `%${searchText}%` } },
        ];
    }

    if (from && to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        end.setHours(0, 0, 0, 0);
        whereClause.createdAt = { [Op.between]: [from, end] };
    }

    return await compliance.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: corporateUser,
                attributes: ['id', 'name', 'email', 'mobileNo'],
                required: false,
            },
        ],
        order: [[sortField || 'id', sort === 'ASC' ? 'ASC' : 'DESC']],
        limit,
        offset,
        raw: true,
        nest: true,
    });
});

exports.findComplianceByIdAdmin = asyncHandler(async (id, complianceId) => {
    const where = id ? { id } : { complianceId };
    return await compliance.findOne({
        where,
        include: [
            {
                model: corporateUser,
                attributes: ['id', 'name', 'email', 'mobileNo'],
                required: false,
            },
            {
                model: credential,
                attributes: ['id', 'username', 'email'],
                required: false,
            },
        ],
        raw: true,
        nest: true,
    });
});

exports.updateComplianceStatus = async (id, adminStatus, adminRemarks, rejectedDocumentKeys, rejectedFormFields) => {
    return await compliance.sequelize.transaction(async (t) => {
        const record = await compliance.findOne({
            where: { id },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });

        if (!record) return null;

        const userStatus = ADMIN_TO_USER_STATUS[adminStatus] || record.status;
        const existing = Array.isArray(record.submissionHistory) ? record.submissionHistory : [];
        const historyEntry = {
            status: adminStatus,
            timestamp: new Date().toISOString(),
            remarks: adminRemarks || null,
            fileName: null,
        };

        record.set('adminStatus', adminStatus);
        record.set('adminRemarks', adminRemarks || record.adminRemarks);
        record.set('status', userStatus);
        record.set('submissionHistory', [...existing, historyEntry]);
        record.changed('submissionHistory', true);

        if (rejectedDocumentKeys !== undefined) {
            record.set('rejectedDocumentKeys', rejectedDocumentKeys);
            record.changed('rejectedDocumentKeys', true);
        }

        if (rejectedFormFields !== undefined) {
            record.set('rejectedFormFields', rejectedFormFields);
            record.changed('rejectedFormFields', true);
        }

        return await record.save({ transaction: t });
    });
};
