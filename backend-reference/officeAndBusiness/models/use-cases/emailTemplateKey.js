'use strict';
const { Op } = require('sequelize');
const emailTemplateKey = require('../entities/emailTemplateKey');
const emailTemplateService = require('../entities/emailTemplateService');
const { customLog } = require('../../utils/loggerHelper');

// `raw: true` + nested include flattens to `service.key` — pull it up to a plain
// `service` string on the API shape, and normalise isActive to a real boolean.
const toApiShape = (row) => {
    if (!row) return row;
    const { 'service.key': serviceKey, ...rest } = row;
    const shaped = { ...rest };
    if (serviceKey !== undefined) shaped.service = serviceKey;
    if (Object.prototype.hasOwnProperty.call(shaped, 'isActive')) {
        shaped.isActive = !!shaped.isActive;
    }
    return shaped;
};

const serviceJoin = {
    model: emailTemplateService,
    as: 'service',
    attributes: ['key'],
};

exports.findKeys = async ({ search = '', service, isActive } = {}) => {
    try {
        const where = {};
        if (isActive !== undefined && isActive !== null && isActive !== '') {
            where.isActive = isActive === true || isActive === 'true';
        }
        if (search) {
            where.key = { [Op.like]: `%${search}%` };
        }

        const include = { ...serviceJoin };
        if (service) include.where = { key: service };

        const rows = await emailTemplateKey.findAll({
            where,
            include: [include],
            order: [['key', 'ASC']],
            raw: true,
            nest: true,
        });
        return rows.map((row) => toApiShape({ ...row, 'service.key': row.service?.key }));
    } catch (error) {
        customLog(null, 'error', { message: 'findKeys failed', error: error.message });
        return [];
    }
};

exports.findKeyById = async (id) => {
    const row = await emailTemplateKey.findOne({
        where: { id },
        include: [serviceJoin],
        raw: true,
        nest: true,
    });
    return row ? toApiShape({ ...row, 'service.key': row.service?.key }) : null;
};

exports.findKeyByServiceIdAndKey = async (serviceId, key, excludeId = null) => {
    const where = { serviceId, key };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await emailTemplateKey.findOne({ where, raw: true });
};

exports.createKey = async (data) => {
    const created = await emailTemplateKey.create(data);
    return created ? exports.findKeyById(created.id) : null;
};

exports.setKeyActiveStatus = async (id, isActive, updatedBy) => {
    await emailTemplateKey.update({ isActive, updatedBy: updatedBy || null }, { where: { id } });
    return exports.findKeyById(id);
};

// Full replace, not merge — a variable name omitted from `variables` is removed
// from the row, matching the AE reference implementation's PUT semantics.
exports.setKeyVariables = async (id, variables, updatedBy) => {
    await emailTemplateKey.update({ variables, updatedBy: updatedBy || null }, { where: { id } });
    return exports.findKeyById(id);
};
