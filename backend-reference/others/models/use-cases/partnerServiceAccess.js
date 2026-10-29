const { Op } = require('sequelize');
const asyncHandler = require('../../middlewares/async');
const partnerServiceAccess = require('../entities/partnerServiceAccess');
const systemUser = require('../entities/systemUser');
const roleAndPermissions = require('../entities/roleAndPermissions');
const credential = require('../entities/credential');

exports.findPartnerServiceAccess = asyncHandler(async (partnerId, attributes = undefined) =>
    partnerServiceAccess.findOne({
        where: {
            partnerId,
            status: true,
        },
        attributes,
        raw: true,
        nest: true,
    })
);

exports.fetchAllPartnerServiceAccess = asyncHandler(async (params, attributes = undefined) => {
    const { partnerId, searchText, status, limit, offset } = params;
    const whereClause = {};

    if (partnerId) {
        whereClause.partnerId = partnerId;
    }

    if (status !== undefined) {
        whereClause.status = status;
    }

    if (searchText) {
        whereClause[Op.or] = [
            { partnerId: { [Op.like]: `%${searchText}%` } },
            { '$credential.name$': { [Op.like]: `%${searchText}%` } },
        ];
    }

    return partnerServiceAccess.findAndCountAll({
        where: whereClause,
        attributes,
        include: [
            {
                model: credential,
                attributes: ['name'],
                required: false,
            },
        ],
        order: [['updatedAt', 'DESC']],
        limit,
        offset,
        raw: true,
        nest: true,
    });
});

exports.replacePartnerServiceAccess = asyncHandler(async (partnerId, permissions) => {
    await partnerServiceAccess.upsert({ partnerId, permissions, status: true });
    return partnerServiceAccess.findOne({
        where: { partnerId },
        raw: true,
        nest: true,
    });
});

exports.updatePartnerServiceAccessById = asyncHandler(async (id, updatedData) => {
    const [affectedCount] = await partnerServiceAccess.update(updatedData, {
        where: { id },
    });
    return affectedCount;
});

exports.deletePartnerServiceAccessById = asyncHandler(async (id) =>
    partnerServiceAccess.destroy({
        where: { id },
    })
);

exports.isPartnerCredential = asyncHandler(async (credentialId) => {
    const partner = await systemUser.findOne({
        where: { credentialId },
        attributes: ['id'],
        include: [
            {
                model: roleAndPermissions,
                attributes: [],
                where: { roleName: 'partner' },
                required: true,
            },
        ],
        raw: true,
    });
    return !!partner;
});
