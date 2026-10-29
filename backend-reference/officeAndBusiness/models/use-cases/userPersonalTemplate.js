'use strict';

const asyncHandler = require('../../middlewares/async');
const userPersonalTemplate = require('../entities/userPersonalTemplate');
const { customLog } = require('../../utils/loggerHelper');
const { Op } = require('sequelize')

exports.create = asyncHandler(async (params) => {
    return await userPersonalTemplate.create(params);
});

exports.findAll = asyncHandler(async ({ corporateUserId, subCorporateUserId, limit, offset, searchText, logTraceId }) => {
    try {
        const where = { corporateUserId };
        if (subCorporateUserId) where.subCorporateUserId = subCorporateUserId;
        if (searchText) where.title = { [Op.like]: `%${searchText}%` };

        const query = {
            where,
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true,
        };
        if (limit) query.limit = limit;
        if (offset !== undefined) query.offset = offset;

        return await userPersonalTemplate.findAndCountAll(query);
    } catch (error) {
        customLog(logTraceId, 'error', { error: error.message });
        throw { message: 'Something went wrong' };
    }
});

exports.findById = asyncHandler(async (id, corporateUserId = undefined) => {
    const where = { id };
    if (corporateUserId) where.corporateUserId = corporateUserId;
    return await userPersonalTemplate.findOne({
        where,
        raw: true,
        nest: true,
    });
});
