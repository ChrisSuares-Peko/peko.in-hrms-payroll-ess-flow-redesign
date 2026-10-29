'use strict';
const { Op } = require('sequelize');
const sequelize = require('../../configs/database/index');
const emailTemplate = require('../entities/emailTemplate');

// Read-only mirror of officeAndBusiness/models/use-cases/emailTemplate.js — only
// the send-path lookup is needed here; admin CRUD lives in officeAndBusiness.

// Send path must never wait on the template store; no retries, availability wins.
const LOOKUP_TIMEOUT_MS = parseInt(process.env.EMAIL_TEMPLATE_LOOKUP_TIMEOUT_MS, 10) || 2000;

const withTimeout = (promise, ms) => {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Email template lookup timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
            // partnerId IS NULL -> 0/1, so ASC puts the partner-specific match first.
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
