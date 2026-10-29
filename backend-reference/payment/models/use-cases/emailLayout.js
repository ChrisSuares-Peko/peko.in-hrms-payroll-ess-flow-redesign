'use strict';
const emailLayout = require('../entities/emailLayout');

// Read-only mirror of officeAndBusiness/models/use-cases/emailLayout.js — only
// the send-path lookup is needed here; admin CRUD lives in officeAndBusiness.

// Mirrors emailTemplate.js's LOOKUP_TIMEOUT_MS — never wait on the layout store.
const LOOKUP_TIMEOUT_MS = parseInt(process.env.EMAIL_LAYOUT_LOOKUP_TIMEOUT_MS, 10) || 2000;

const withTimeout = (promise, ms) => {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Email layout lookup timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
