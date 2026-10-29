const { Op } = require('sequelize');

const businessRegistration = require('./../entities/businessRegistration');
const asyncHandler = require('../../middlewares/async');

exports.createApplication = asyncHandler(async (credentialId, corporateId, applicationData) => {
    return await businessRegistration.create({
        credentialId,
        corporateId,
        ...applicationData,
    });
});

exports.findApplicationById = asyncHandler(async (applicationId, credentialId, corporateId) => {
    return await businessRegistration.findOne({
        where: { applicationId, credentialId, corporateId },
    });
});

exports.findApplicationsByCredential = asyncHandler(async (credentialId, corporateId, options = {}) => {
    const { offset = 0, limit = 10, status, orderBy = 'createdAt' } = options;
    const where = { credentialId, corporateId };
    if (status) where.status = status;

    return await businessRegistration.findAndCountAll({
        // applicationData stays (draft resume needs it — filenames only, light);
        // the heavy JSON columns (documents holds base64) would blow MySQL's
        // sort buffer on ORDER BY, same as the admin list did.
        attributes: {
            exclude: ['documents', 'vendorPeople', 'vendorShareholdings', 'vendorStages', 'vendorError'],
        },
        where,
        offset,
        limit,
        order: [[orderBy, 'DESC']],
    });
});

// Latest vendor-synced person of a role (director/shareholder/nominee) — seeds
// the per-role kyc-status document checklist without creating anyone new.
exports.findVendorPersonByRole = asyncHandler(async role => {
    const rows = await businessRegistration.findAll({
        attributes: ['vendorPeople'],
        where: { vendorPeople: { [Op.ne]: null } },
        order: [['id', 'DESC']],
        limit: 25,
    });
    for (const row of rows) {
        const hit = (row.vendorPeople || []).find(v => v.role === role && v.peopleId);
        if (hit) return hit;
    }
    return null;
});

exports.updateApplicationStatus = asyncHandler(async (applicationId, statusData) => {
    const application = await businessRegistration.findOne({ where: { applicationId } });
    if (!application) throw new Error('Application not found');
    return await application.update(statusData);
});

// Admin listing across all corporates — mirrors companyIncorporation.findAllApplications.
exports.findAllApplications = asyncHandler(async (options = {}) => {
    const {
        offset = 0,
        limit = 20,
        status,
        entityType,
        paymentStatus,
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
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (corporateId) where.corporateId = corporateId;
    if (from && to) where.createdAt = { [Op.between]: [new Date(from), new Date(`${to}T23:59:59`)] };

    const searchWhere = searchText
        ? {
              [Op.or]: [
                  { applicationId: { [Op.like]: `%${searchText}%` } },
                  { businessName: { [Op.like]: `%${searchText}%` } },
                  { '$credential.username$': { [Op.like]: `%${searchText}%` } },
                  { '$corporateUser.name$': { [Op.like]: `%${searchText}%` } },
              ],
          }
        : {};

    const validSortFields = ['createdAt', 'updatedAt', 'status', 'entityType', 'totalAmount', 'applicationId'];
    const orderField = validSortFields.includes(sortField) ? sortField : 'createdAt';
    const orderDir = sort === 'ASC' ? 'ASC' : 'DESC';

    return await businessRegistration.findAndCountAll({
        // Summary columns only — the JSON columns (applicationData, documents
        // with base64 contents, vendor blobs) blow MySQL's sort buffer on
        // ORDER BY (ER_OUT_OF_SORTMEMORY). The detail endpoint returns them.
        attributes: [
            'id', 'applicationId', 'entityType', 'businessName', 'contactPerson',
            'contactEmail', 'contactMobile', 'incorporationFee', 'gstAmount',
            'totalAmount', 'status', 'paymentStatus', 'corporateTxnId', 'paidAt',
            'vendorStatus', 'vendorApplicationId', 'vendorEngagementId', 'srn',
            'submittedAt', 'createdAt', 'updatedAt', 'credentialId', 'corporateId',
        ],
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
