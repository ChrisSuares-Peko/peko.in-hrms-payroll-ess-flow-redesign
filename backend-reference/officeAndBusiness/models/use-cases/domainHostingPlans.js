'use strict';
const { Op } = require('sequelize');
const DomainHostingPlans = require('../entities/domainHostingPlans');
const { handleSortFields } = require('../../utils/sortHandle');
const { PLAN_COMMISSION, reviewedChange } = require('../../utils/configuredFlag');

exports.create = async (params) => {
    return await DomainHostingPlans.create(params);
};

exports.findById = async (id) => {
    return await DomainHostingPlans.findOne({ where: { id }, raw: true });
};

exports.findByVendorKey = async ({ productId, planId, billingCycle }, excludeId) => {
    const where = { productId };
    if (planId !== undefined) where.planId = planId || null;
    if (billingCycle !== undefined) where.billingCycle = billingCycle || null;
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await DomainHostingPlans.findOne({ where, raw: true });
};

exports.findAllAndCount = async (params) => {
    const { limit, offset, searchText, sort, sortField, planType } = params;
    const order = handleSortFields(sortField, sort);

    const where = {};
    if (planType) where.planType = planType;
    if (searchText) {
        where[Op.or] = [
            { planName: { [Op.like]: '%' + searchText + '%' } },
            { productId: { [Op.like]: '%' + searchText + '%' } },
            { planId: { [Op.like]: '%' + searchText + '%' } },
            { description: { [Op.like]: '%' + searchText + '%' } }
        ];
    }

    return await DomainHostingPlans.findAndCountAll({ where, order, limit, offset, raw: true, nest: true });
};

exports.update = async (id, data) => {
    const reviewed = await reviewedChange({
        load: () => DomainHostingPlans.findOne({ where: { id }, attributes: PLAN_COMMISSION.fields, raw: true }),
        incoming: data,
        group: PLAN_COMMISSION,
        table: 'domainHostingPlans',
        id,
    });
    return await DomainHostingPlans.update(reviewed, { where: { id } });
};

exports.deletePlan = async (id) => {
    return await DomainHostingPlans.destroy({ where: { id } });
};

exports.getActivePlans = async (planType) => {
    try {
        const where = { status: true };
        if (planType) where.planType = planType;
        return await DomainHostingPlans.findAll({ where, raw: true });
    } catch {
        return null;
    }
};
