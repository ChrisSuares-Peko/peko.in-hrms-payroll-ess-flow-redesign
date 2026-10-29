'use strict';
const { Op } = require('sequelize');
const emailTemplateService = require('../entities/emailTemplateService');
const { customLog } = require('../../utils/loggerHelper');

// `raw: true` skips Sequelize's type parsing, so a TINYINT(1) reaches the API as
// 0/1. Normalise it so the response contract is a real boolean everywhere.
const toApiShape = (row) => {
    if (!row) return row;
    if (Object.prototype.hasOwnProperty.call(row, 'isActive')) {
        return { ...row, isActive: !!row.isActive };
    }
    return { ...row };
};

// Small, admin-curated registry (expected to hold tens of rows, not thousands) —
// a plain filtered list, no pagination, matching the AE reference implementation.
exports.findServices = async ({ search = '', isActive } = {}) => {
    try {
        const where = {};
        if (isActive !== undefined && isActive !== null && isActive !== '') {
            where.isActive = isActive === true || isActive === 'true';
        }
        if (search) {
            where.key = { [Op.like]: `%${search}%` };
        }

        const rows = await emailTemplateService.findAll({
            where,
            order: [['key', 'ASC']],
            raw: true,
        });
        return rows.map(toApiShape);
    } catch (error) {
        customLog(null, 'error', { message: 'findServices failed', error: error.message });
        return [];
    }
};

exports.findServiceById = async (id) => {
    return toApiShape(await emailTemplateService.findOne({ where: { id }, raw: true }));
};

exports.findServiceByKey = async (key) => {
    return toApiShape(await emailTemplateService.findOne({ where: { key }, raw: true }));
};

exports.createService = async (data) => {
    const created = await emailTemplateService.create(data);
    return created ? toApiShape(created.get({ plain: true })) : null;
};

exports.setServiceActiveStatus = async (id, isActive, updatedBy) => {
    await emailTemplateService.update({ isActive, updatedBy: updatedBy || null }, { where: { id } });
    return exports.findServiceById(id);
};
