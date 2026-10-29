const { Op } = require('sequelize');
const companyIncorporation = require('./../entities/companyIncorporation');
const asyncHandler = require('../../middlewares/async');

exports.findActiveApplicationByCorporate = asyncHandler(async (corporateId) => {
    return await companyIncorporation.findOne({
        where: {
            corporateId,
            status: { [Op.in]: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
        },
    });
});

exports.createApplication = asyncHandler(async (credentialId, corporateId, applicationData) => {
    return await companyIncorporation.create({
        credentialId,
        corporateId,
        ...applicationData,
    });
});

exports.findApplicationById = asyncHandler(async (applicationId, credentialId, corporateId) => {
    return await companyIncorporation.findOne({
        where: { applicationId, credentialId, corporateId },
    });
});

exports.findApplicationsByCredential = asyncHandler(async (credentialId, corporateId, options = {}) => {
    const { offset = 0, limit = 10, status, orderBy = 'createdAt' } = options;
    const where = { credentialId, corporateId };
    if (status) where.status = status;

    return await companyIncorporation.findAndCountAll({
        where,
        offset,
        limit,
        order: [[orderBy, 'DESC']],
    });
});

exports.updateApplicationStatus = asyncHandler(async (applicationId, statusData) => {
    const application = await companyIncorporation.findOne({ where: { applicationId } });
    if (!application) throw new Error('Application not found');
    return await application.update(statusData);
});

// Update a PENDING application's form/pricing fields without touching applicationId,
// documents, or status. Uses a row-level lock so two concurrent submit calls from
// the same corporate cannot race-update each other.
exports.updatePendingApplication = async (applicationId, fields) => {
    return await companyIncorporation.sequelize.transaction(async (t) => {
        const application = await companyIncorporation.findOne({
            where: { applicationId },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });
        if (!application) throw new Error('Application not found');
        if (application.status !== 'PENDING') {
            throw new Error('Only PENDING applications can be updated via submit');
        }
        await application.update(fields, { transaction: t });
        return application;
    });
};

exports.appendDocumentToApplication = async (applicationId, credentialId, corporateId, docData) => {
    return await companyIncorporation.sequelize.transaction(async (t) => {
        const application = await companyIncorporation.findOne({
            where: { applicationId, credentialId, corporateId },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });
        if (!application) throw new Error('Application not found');

        const currentDocs = Array.isArray(application.documents) ? [...application.documents] : [];
        const existingIndex = currentDocs.findIndex(d => d.docType === docData.docType);
        if (existingIndex >= 0) {
            currentDocs[existingIndex] = docData;
        } else {
            currentDocs.push(docData);
        }
        await application.update({ documents: currentDocs }, { transaction: t });
        return docData;
    });
};

exports.updateVendorStages = asyncHandler(async (applicationId, stages) => {
    const application = await companyIncorporation.findOne({ where: { applicationId } });
    if (!application) throw new Error('Application not found');
    return await application.update({ vendorStages: stages });
});

exports.updateVendorDocuments = asyncHandler(async (applicationId, documents) => {
    const application = await companyIncorporation.findOne({ where: { applicationId } });
    if (!application) throw new Error('Application not found');
    return await application.update({ vendorDocuments: documents });
});

exports.findAllApplications = asyncHandler(async (options = {}) => {
    const {
        offset = 0,
        limit = 20,
        status,
        entityType,
        searchText,
        from,
        to,
        sort = 'DESC',
        sortField = 'createdAt',
        corporateId,
    } = options;

    const credential = require('../entities/credential');
    const corporateUser = require('../entities/corporateUser');

    const where = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (corporateId) where.corporateId = corporateId;
    if (from && to) where.createdAt = { [Op.between]: [new Date(from), new Date(`${to}T23:59:59`)] };

    const searchWhere = searchText
        ? {
              [Op.or]: [
                  { applicationId: { [Op.like]: `%${searchText}%` } },
                  { '$credential.username$': { [Op.like]: `%${searchText}%` } },
                  { '$corporateUser.name$': { [Op.like]: `%${searchText}%` } },
              ],
          }
        : {};

    const validSortFields = ['createdAt', 'updatedAt', 'status', 'entityType', 'totalAmount', 'applicationId'];
    const orderField = validSortFields.includes(sortField) ? sortField : 'createdAt';
    const orderDir = sort === 'ASC' ? 'ASC' : 'DESC';

    return await companyIncorporation.findAndCountAll({
        where: { ...where, ...searchWhere },
        offset,
        limit,
        order: [[orderField, orderDir]],
        include: [
            {
                model: credential,
                as: 'credential',
                attributes: ['id', 'username', 'name'],
                required: false,
            },
            {
                model: corporateUser,
                as: 'corporateUser',
                attributes: ['id', 'name'],
                required: false,
            },
        ],
        subQuery: false,
    });
});
