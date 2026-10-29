'use strict';

const { Op } = require('sequelize');

const govtServicesCatalog = require('../entities/govtServicesCatalog');
const { PLAN_COMMISSION, reviewedChange } = require('../../utils/configuredFlag');
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup');

exports.create = async params => {
    return await govtServicesCatalog.create(params);
};

exports.findByVendorKey = async vendorCatalogId => {
    return await govtServicesCatalog.findOne({ where: { vendorCatalogId } });
};

exports.findAll = async () => {
    return await govtServicesCatalog.findAll();
};

// Bulk-disable rows the vendor no longer returned in a sync — same
// "isAccessible: false" convention giftCards' autoUpdateGiftCard uses for
// cards missing from its vendor response, applied here to status instead.
exports.disableByIds = async ids => {
    if (!ids.length) return [0];
    return await govtServicesCatalog.update({ status: false }, { where: { id: ids } });
};

exports.findAllAndCount = async ({ limit, offset, searchText, sort = 'ASC', sortField = 'sortOrder', isAdmin = false }) => {
    const where = {};
    if (searchText) {
        where[Op.or] = [
            { serviceName: { [Op.like]: `%${searchText}%` } },
            { variantName: { [Op.like]: `%${searchText}%` } },
            { vendorCatalogId: { [Op.like]: `%${searchText}%` } },
        ];
    }

    const result = await govtServicesCatalog.findAndCountAll({ where, order: [[sortField, sort]], limit, offset, raw: true });
    await applyCommissionMarkup(result.rows, ['amount', 'price'], null, isAdmin);
    return result;
};

exports.update = async (id, data) => {
    const reviewed = await reviewedChange({
        load: () => govtServicesCatalog.findOne({ where: { id }, attributes: PLAN_COMMISSION.fields, raw: true }),
        incoming: data,
        group: PLAN_COMMISSION,
        table: 'govtServicesCatalogs',
        id,
    });
    return await govtServicesCatalog.update(reviewed, { where: { id } });
};

exports.updateStatus = async (id, status) => {
    return await govtServicesCatalog.update({ status }, { where: { id } });
};

// Customer-facing (if ever wired up): only active rows, ordered by sortOrder.
exports.getActiveCatalog = async ({ serviceId, credentialId } = {}) => {
    const where = { status: true };
    if (serviceId !== undefined && serviceId !== null && serviceId !== '') {
        where.serviceId = Number(serviceId);
    }
    const rows = await govtServicesCatalog.findAll({ where, order: [['sortOrder', 'ASC']], raw: true });
    await applyCommissionMarkup(rows, ['amount', 'price'], credentialId);
    return rows;
};
