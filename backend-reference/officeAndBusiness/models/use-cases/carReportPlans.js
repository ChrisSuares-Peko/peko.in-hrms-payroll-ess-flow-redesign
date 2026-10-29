'use strict';
const { Op } = require('sequelize');
const CarReportPlan = require('../entities/carReportPlan');
const { handleSortFields } = require('../../utils/sortHandle');
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup');

exports.create = async (params) => {
    return await CarReportPlan.create(params);
};

exports.findById = async (id) => {
    return await CarReportPlan.findOne({ where: { id }, raw: true });
};

// One plan per (reportType, packageId) — packageId is null for the flat products.
exports.findDuplicate = async ({ reportType, packageId }, excludeId) => {
    const where = { reportType, packageId: packageId || null };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await CarReportPlan.findOne({ where, raw: true });
};

exports.findAllAndCount = async (params) => {
    const { limit, offset, searchText, sort, sortField, reportType, isAdmin = false } = params;
    const order = handleSortFields(sortField, sort);

    // Legacy challan_* fee rows stay in the table but are no longer admin-managed —
    // the challan fee now lives in the serviceOperator surcharge.
    const where = { reportType: { [Op.notLike]: 'challan_%' } };
    if (reportType) where.reportType[Op.eq] = reportType;
    if (searchText) {
        where[Op.or] = [
            { displayName: { [Op.like]: '%' + searchText + '%' } },
            { packageId: { [Op.like]: '%' + searchText + '%' } },
            { vendorProductCode: { [Op.like]: '%' + searchText + '%' } },
        ];
    }

    const result = await CarReportPlan.findAndCountAll({ where, order, limit, offset, raw: true });
    await applyCommissionMarkup(result.rows, 'price', null, isAdmin);
    return result;
};

exports.update = async (id, data) => {
    return await CarReportPlan.update(data, { where: { id } });
};

exports.getActivePlans = async () => {
    try {
        return await CarReportPlan.findAll({
            where: { status: true },
            order: [['sortOrder', 'ASC']],
            raw: true,
        });
    } catch {
        return null;
    }
};
