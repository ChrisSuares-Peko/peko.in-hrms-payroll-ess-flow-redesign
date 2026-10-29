'use strict';
const { Op } = require('sequelize');
const sequelize = require('../../configs/database/index');
const emailTemplate = require('../entities/emailTemplate');
const { customLog } = require('../../utils/loggerHelper');

// Send path must never wait on the template store; no retries, availability wins.
const LOOKUP_TIMEOUT_MS = parseInt(process.env.EMAIL_TEMPLATE_LOOKUP_TIMEOUT_MS, 10) || 2000;

const withTimeout = (promise, ms) => {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Email template lookup timed out after ${ms}ms`)), ms);
    });
    // clearTimeout in both outcomes — a dangling timer would keep the process awake.
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Metadata only — the list view never ships the HTML bodies.
const LIST_ATTRIBUTES = [
    'id',
    'key',
    'name',
    'service',
    'partnerId',
    'layout',
    'status',
    'isActive',
    'version',
    'updatedBy',
    'updatedAt',
    'publishedAt',
    'publishedBy',
];

const SORTABLE_FIELDS = [
    'id',
    'key',
    'name',
    'service',
    'status',
    'isActive',
    'version',
    'createdAt',
    'updatedAt',
    'publishedAt',
];

// Columns an admin may edit on the draft. `key` is the stable programmatic
// identifier and is intentionally absent; publish-only columns are never here.
const DRAFT_EDITABLE_FIELDS = ['name', 'service', 'partnerId', 'sender', 'subject', 'draftHtmlBody', 'layout'];

exports.LIST_ATTRIBUTES = LIST_ATTRIBUTES;
exports.SORTABLE_FIELDS = SORTABLE_FIELDS;
exports.DRAFT_EDITABLE_FIELDS = DRAFT_EDITABLE_FIELDS;

// `raw: true` skips Sequelize's type parsing, so a TINYINT(1) reaches the API as
// 0/1. Normalise it so the response contract is a real boolean everywhere.
const toApiShape = (row) => {
    if (!row) return row;
    if (Object.prototype.hasOwnProperty.call(row, 'isActive')) {
        return { ...row, isActive: !!row.isActive };
    }
    return { ...row };
};

exports.findTemplates = async ({
    page = 1,
    itemsPerPage = 10,
    search = '',
    service,
    partnerId,
    status,
    isActive,
    sortField = 'updatedAt',
    sort = 'DESC',
} = {}) => {
    try {
        const where = {};
        if (service) where.service = service;
        if (partnerId) where.partnerId = partnerId;
        if (status) where.status = status;
        if (isActive !== undefined && isActive !== null && isActive !== '') {
            where.isActive = isActive === true || isActive === 'true';
        }
        if (search) {
            const pattern = `%${search}%`;
            where[Op.or] = [
                { key: { [Op.like]: pattern } },
                { name: { [Op.like]: pattern } },
                { service: { [Op.like]: pattern } },
            ];
        }

        const limit = parseInt(itemsPerPage, 10) || 10;
        const offset = ((parseInt(page, 10) || 1) - 1) * limit;
        const orderField = SORTABLE_FIELDS.includes(sortField) ? sortField : 'updatedAt';
        const orderDirection = String(sort).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const result = await emailTemplate.findAndCountAll({
            where,
            attributes: LIST_ATTRIBUTES,
            order: [[orderField, orderDirection]],
            limit,
            offset,
            raw: true,
        });
        return { count: result.count, rows: result.rows.map(toApiShape) };
    } catch (error) {
        customLog(null, 'error', { message: 'findTemplates failed', error: error.message });
        return { rows: [], count: 0 };
    }
};

exports.findTemplateById = async (id) => {
    return toApiShape(await emailTemplate.findOne({ where: { id }, raw: true }));
};

// Template identity is service + key + partnerId. partnerId is matched NULL-safely
// since two rows may share service + key as long as at most one has partnerId = NULL.
exports.findTemplateByServiceAndKey = async (service, key, partnerId = null, excludeId = null) => {
    const where = { service, key, partnerId: partnerId || null };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await emailTemplate.findOne({ where, raw: true });
};

exports.createTemplate = async (data) => {
    const created = await emailTemplate.create(data);
    return created ? toApiShape(created.get({ plain: true })) : null;
};

/**
 * Draft-only update. The caller is responsible for restricting `data` to
 * DRAFT_EDITABLE_FIELDS (+ updatedBy); publish columns are never written here.
 */
exports.updateTemplate = async (id, data) => {
    await emailTemplate.update(data, { where: { id } });
    return exports.findTemplateById(id);
};

/**
 * Promote the draft to published in a single atomic UPDATE:
 * subject -> publishedSubject, draftHtmlBody -> publishedHtmlBody,
 * status = PUBLISHED, version + 1, publishedBy/publishedAt stamped.
 */
exports.publishTemplate = async (row, publishedBy) => {
    await emailTemplate.update({
        publishedSubject: row.subject,
        publishedHtmlBody: row.draftHtmlBody,
        status: 'PUBLISHED',
        version: sequelize.literal('`version` + 1'),
        publishedBy: publishedBy || null,
        updatedBy: publishedBy || row.updatedBy || null,
        publishedAt: new Date(),
    }, { where: { id: row.id } });
    return exports.findTemplateById(row.id);
};

exports.setTemplateActiveStatus = async (id, isActive, updatedBy) => {
    await emailTemplate.update({ isActive, updatedBy: updatedBy || null }, { where: { id } });
    return exports.findTemplateById(id);
};

/**
 * Read one template by service+key for the send path. Not filtered on
 * status/isActive so the resolver can report why it fell back. partnerId, when
 * given, prefers that partner's own row over the shared default.
 */
exports.findPublishedTemplate = async ({ service, key, partnerId = null }) => {
    const where = { service, key };
    where.partnerId = partnerId ? { [Op.or]: [partnerId, null] } : null;

    const row = await withTimeout(
        emailTemplate.findOne({
            where,
            attributes: [
                'key',
                'service',
                'publishedSubject',
                'publishedHtmlBody',
                'status',
                'isActive',
                'sender',
                'layout',
            ],
            // partnerId IS NULL -> 0 for the partner-specific row, 1 for the default
            // one, so ASC puts the partner-specific match first when both exist.
            order: partnerId ? [[sequelize.literal('`partnerId` IS NULL'), 'ASC']] : undefined,
            raw: true,
        }),
        LOOKUP_TIMEOUT_MS
    );

    if (!row) return null;
    // `raw: true` skips Sequelize's type parsing, so TINYINT(1) arrives as 0/1.
    return { ...row, isActive: !!row.isActive };
};

exports.LOOKUP_TIMEOUT_MS = LOOKUP_TIMEOUT_MS;
