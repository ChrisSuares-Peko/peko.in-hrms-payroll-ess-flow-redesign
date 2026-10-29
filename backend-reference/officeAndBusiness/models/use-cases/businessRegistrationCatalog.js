'use strict';

const { Op } = require('sequelize');

const businessRegistrationCatalog = require('../entities/businessRegistrationCatalog');
const { handleSortFields } = require('../../utils/sortHandle');
const { PLAN_COMMISSION, reviewedChange } = require('../../utils/configuredFlag');
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup');

exports.create = async params => {
    return await businessRegistrationCatalog.create(params);
};

exports.findByVendorKey = async vendorCatalogId => {
    return await businessRegistrationCatalog.findOne({ where: { vendorCatalogId } });
};

// Natural identity of a catalog offering — used by sync so a changed vendor id
// updates the existing row instead of creating a duplicate.
exports.findByNameKey = async (serviceName, variantName) => {
    return await businessRegistrationCatalog.findOne({
        where: { serviceName: serviceName ?? null, variantName: variantName ?? null },
    });
};

exports.findAllRaw = async () => {
    return await businessRegistrationCatalog.findAll({ raw: true });
};

exports.destroyById = async id => {
    return await businessRegistrationCatalog.destroy({ where: { id } });
};

exports.findAllAndCount = async params => {
    const { limit, offset, searchText, sort = 'ASC', sortField = 'sortOrder', isAdmin = false } = params;
    const order = handleSortFields(sortField, sort);

    const where = {};
    if (searchText) {
        where[Op.or] = [
            { serviceName: { [Op.like]: `%${searchText}%` } },
            { variantName: { [Op.like]: `%${searchText}%` } },
            { vendorCatalogId: { [Op.like]: `%${searchText}%` } },
        ];
    }

    const result = await businessRegistrationCatalog.findAndCountAll({ where, order, limit, offset, raw: true, nest: true });
    await applyCommissionMarkup(result.rows, ['amount', 'vendorPrice'], null, isAdmin);
    return result;
};

exports.update = async (id, data) => {
    const reviewed = await reviewedChange({
        load: () =>
            businessRegistrationCatalog.findOne({ where: { id }, attributes: PLAN_COMMISSION.fields, raw: true }),
        incoming: data,
        group: PLAN_COMMISSION,
        table: 'businessRegistrationCatalogs',
        id,
    });
    return await businessRegistrationCatalog.update(reviewed, { where: { id } });
};

// Customer-facing: only active rows, ordered by sortOrder. Optionally one serviceId.
exports.getActiveCatalog = async ({ serviceId } = {}) => {
    const where = { status: true };
    if (serviceId !== undefined && serviceId !== null && serviceId !== '') {
        where.serviceId = Number(serviceId);
    }
    return await businessRegistrationCatalog.findAll({
        where,
        order: [['sortOrder', 'ASC']],
        raw: true,
    });
};

// Customer catalog list including inactive rows (status travels to the FE so a
// deactivated service hides its structure card).
exports.getCatalogRows = async () => {
    return await businessRegistrationCatalog.findAll({
        order: [['sortOrder', 'ASC']],
        raw: true,
    });
};
