'use strict';
const { Op } = require('sequelize');
const sequelize = require('../../configs/database/index');
const emailLayout = require('../entities/emailLayout');
const { customLog } = require('../../utils/loggerHelper');

// Mirrors emailTemplate.js's LOOKUP_TIMEOUT_MS — never wait on the layout store.
const LOOKUP_TIMEOUT_MS = parseInt(process.env.EMAIL_LAYOUT_LOOKUP_TIMEOUT_MS, 10) || 2000;

const withTimeout = (promise, ms) => {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Email layout lookup timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Metadata only — the list view never ships the HTML bodies.
const LIST_ATTRIBUTES = [
    'id',
    'name',
    'type',
    'partnerId',
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
    'name',
    'type',
    'status',
    'isActive',
    'version',
    'createdAt',
    'updatedAt',
    'publishedAt',
];

// Columns an admin may edit on the draft. Publish-only columns are never here.
const DRAFT_EDITABLE_FIELDS = ['name', 'type', 'partnerId', 'draftHtml'];

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

exports.findLayouts = async ({
    page = 1,
    itemsPerPage = 10,
    search = '',
    type,
    partnerId,
    status,
    isActive,
    sortField = 'updatedAt',
    sort = 'DESC',
} = {}) => {
    try {
        const where = {};
        if (type) where.type = type;
        if (partnerId) where.partnerId = partnerId;
        if (status) where.status = status;
        if (isActive !== undefined && isActive !== null && isActive !== '') {
            where.isActive = isActive === true || isActive === 'true';
        }
        if (search) {
            const pattern = `%${search}%`;
            where[Op.or] = [
                { name: { [Op.like]: pattern } },
                { type: { [Op.like]: pattern } },
            ];
        }

        const limit = parseInt(itemsPerPage, 10) || 10;
        const offset = ((parseInt(page, 10) || 1) - 1) * limit;
        const orderField = SORTABLE_FIELDS.includes(sortField) ? sortField : 'updatedAt';
        const orderDirection = String(sort).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const result = await emailLayout.findAndCountAll({
            where,
            attributes: LIST_ATTRIBUTES,
            order: [[orderField, orderDirection]],
            limit,
            offset,
            raw: true,
        });
        return { count: result.count, rows: result.rows.map(toApiShape) };
    } catch (error) {
        customLog(null, 'error', { message: 'findLayouts failed', error: error.message });
        return { rows: [], count: 0 };
    }
};

exports.findLayoutById = async (id) => {
    return toApiShape(await emailLayout.findOne({ where: { id }, raw: true }));
};

exports.createLayout = async (data) => {
    const created = await emailLayout.create(data);
    return created ? toApiShape(created.get({ plain: true })) : null;
};

/**
 * Draft-only update. The caller is responsible for restricting `data` to
 * DRAFT_EDITABLE_FIELDS (+ updatedBy); publish columns are never written here.
 */
exports.updateLayout = async (id, data) => {
    await emailLayout.update(data, { where: { id } });
    return exports.findLayoutById(id);
};

/**
 * Promote the draft to published in a single atomic UPDATE:
 * draftHtml -> publishedHtml, status = PUBLISHED, version + 1,
 * publishedBy/publishedAt stamped.
 */
exports.publishLayout = async (row, publishedBy) => {
    await emailLayout.update({
        publishedHtml: row.draftHtml,
        status: 'PUBLISHED',
        version: sequelize.literal('`version` + 1'),
        publishedBy: publishedBy || null,
        updatedBy: publishedBy || row.updatedBy || null,
        publishedAt: new Date(),
    }, { where: { id: row.id } });
    return exports.findLayoutById(row.id);
};

exports.setLayoutActiveStatus = async (id, isActive, updatedBy) => {
    await emailLayout.update({ isActive, updatedBy: updatedBy || null }, { where: { id } });
    return exports.findLayoutById(id);
};

/**
 * Read one layout by `id` for the send path. Not filtered on status/isActive —
 * same as findPublishedTemplate — so the caller can report why it fell back.
 */
exports.findPublishedLayoutById = async (id) => {
    const row = await withTimeout(
        emailLayout.findOne({
            where: { id },
            attributes: ['id', 'type', 'publishedHtml', 'status', 'isActive'],
            raw: true,
        }),
        LOOKUP_TIMEOUT_MS
    );

    if (!row) return null;
    // `raw: true` skips Sequelize's type parsing, so TINYINT(1) arrives as 0/1.
    return { ...row, isActive: !!row.isActive };
};

exports.LOOKUP_TIMEOUT_MS = LOOKUP_TIMEOUT_MS;
