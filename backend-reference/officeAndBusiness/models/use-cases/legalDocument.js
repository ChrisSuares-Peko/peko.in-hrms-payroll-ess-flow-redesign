'use strict';

const { Op } = require('sequelize');
const asyncHandler = require('../../middlewares/async');
const legalDocument = require('../entities/legalDocument');
const eSign = require('../entities/eSign');
const { customLog } = require('../../utils/loggerHelper');

exports.create = asyncHandler(async (params) => {
    return await legalDocument.create(params);
});

exports.updateById = asyncHandler(async (id, params, corporateUserId = undefined) => {
    const where = { id };
    if (corporateUserId) where.corporateUserId = corporateUserId;
    return await legalDocument.update(params, { where });
});

exports.findAll = asyncHandler(async ({ corporateUserId, subCorporateUserId, limit, searchText, status, logTraceId }) => {
    try {
        const where = { corporateUserId };
        if (subCorporateUserId) where.subCorporateUserId = subCorporateUserId;
        if (searchText) where.title = { [Op.like]: `%${searchText}%` };
        if (status) where.status = status;

        const query = {
            where,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true,
        };
        if (limit) query.limit = limit;

        return await legalDocument.findAndCountAll(query);
    } catch (error) {
        customLog(logTraceId, 'error', { error: error.message });
        throw { message: 'Something went wrong' };
    }
});

exports.findById = asyncHandler(async (id, corporateUserId = undefined) => {
    const where = { id };
    if (corporateUserId) where.corporateUserId = corporateUserId;
    return await legalDocument.findOne({
        where,
        include: [
            {
                model: eSign,
                as: 'eSign',
                attributes: ['id', 'status', 'signers_info', 'expiry_date'],
                required: false,
            },
        ],
        raw: true,
        nest: true,
    });
});
