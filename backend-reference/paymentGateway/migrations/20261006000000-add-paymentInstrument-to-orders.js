'use strict';

const TABLE = 'orders';
const COLUMN = 'paymentInstrument';
const CHUNK = 2000;

const hasColumn = (description, column) =>
    Object.keys(description).some((name) => name.toLowerCase() === column.toLowerCase());

// Inlined copy of utils/paymentInstrument.js — a migration must keep deriving what it
// derived on the day it ran, independent of later changes to that helper.
const INSTRUMENT_LABELS = {
    upi: 'UPI',
    upi_credit_card: 'UPI',
    upi_debit_card: 'UPI',
    upi_ppi: 'UPI',
    credit_card: 'Credit Card',
    credit_card_emi: 'Credit Card',
    emi_credit_card: 'Credit Card',
    card_emi: 'Credit Card',
    debit_card: 'Debit Card',
    debit_card_emi: 'Debit Card',
    emi_debit_card: 'Debit Card',
    card: 'Card',
    net_banking: 'Internet Banking',
    netbanking: 'Internet Banking',
    wallet: 'Digital Wallet',
    app: 'Digital Wallet',
    cardless_emi: 'Cardless EMI',
    paylater: 'Pay Later',
    banktransfer: 'Bank Transfer',
    enach: 'Net Banking / NACH',
    emandate: 'Net Banking / NACH',
    nach: 'Net Banking / NACH',
};

const MAX_LENGTH = 64;

const toLabel = (code) => {
    if (!code) return null;
    const key = String(code).trim().toLowerCase();
    if (!key) return null;
    if (INSTRUMENT_LABELS[key]) return INSTRUMENT_LABELS[key];
    return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const codeFromMethod = (method) => {
    if (!method) return null;
    if (typeof method === 'string') return method;
    if (typeof method === 'object') return Object.keys(method)[0] || null;
    return null;
};

const resolveCode = (parsed) => {
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.data && typeof parsed.data === 'object') {
        const nested =
            codeFromMethod(parsed.data.authorization_details && parsed.data.authorization_details.payment_method) ||
            codeFromMethod(parsed.data.payment_method) ||
            parsed.data.payment_group;
        if (nested) return nested;
    }
    return parsed.payment_group || codeFromMethod(parsed.payment_method) || null;
};

const derivePaymentInstrument = (paymentModeResponse, paymentMode) => {
    if (!paymentModeResponse) return null;
    let parsed = paymentModeResponse;
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed);
        } catch (_) {
            return null;
        }
    }
    while (Array.isArray(parsed)) {
        parsed = parsed.find((entry) => entry && entry.payment_status === 'SUCCESS') || parsed[0];
    }
    const label = toLabel(resolveCode(parsed));
    if (!label) return null;
    const full = /\+\s*WALLET/i.test(String(paymentMode || '')) ? `${label} + Wallet` : label;
    return full.slice(0, MAX_LENGTH);
};

// Historical rows already carry the gateway payload in paymentModeResponse. Walk them by
// id so a re-run only picks up what is still NULL, and never fail the migration over it —
// the column landing matters, the backfill is catch-up.
const backfill = async (queryInterface) => {
    let cursor = 0;
    for (;;) {
        const rows = await queryInterface.sequelize.query(
            `SELECT id, paymentMode, paymentModeResponse
               FROM ${TABLE}
              WHERE id > :cursor
                AND ${COLUMN} IS NULL
                AND paymentModeResponse IS NOT NULL
                AND (paymentMode IS NULL OR UPPER(paymentMode) <> 'WALLET')
              ORDER BY id
              LIMIT ${CHUNK}`,
            { replacements: { cursor }, type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        if (!rows.length) return;
        cursor = rows[rows.length - 1].id;

        const byLabel = new Map();
        for (const row of rows) {
            const label = derivePaymentInstrument(row.paymentModeResponse, row.paymentMode);
            if (!label) continue;
            if (!byLabel.has(label)) byLabel.set(label, []);
            byLabel.get(label).push(row.id);
        }
        for (const [label, ids] of byLabel) {
            await queryInterface.sequelize.query(
                `UPDATE ${TABLE} SET ${COLUMN} = :label WHERE id IN (:ids) AND ${COLUMN} IS NULL`,
                { replacements: { label, ids } }
            );
        }
        if (rows.length < CHUNK) return;
    }
};

module.exports = {
    async up(queryInterface, Sequelize) {
        let description = null;
        try {
            description = await queryInterface.describeTable(TABLE);
        } catch (err) {
            return;
        }

        if (!hasColumn(description, COLUMN)) {
            await queryInterface.addColumn(TABLE, COLUMN, {
                type: Sequelize.STRING(64),
                allowNull: true,
            });
        }

        try {
            await backfill(queryInterface);
        } catch (err) {
            console.error(`${COLUMN} backfill skipped:`, err && err.message);
        }
    },

    async down(queryInterface) {
        let description = null;
        try {
            description = await queryInterface.describeTable(TABLE);
        } catch (err) {
            return;
        }
        if (hasColumn(description, COLUMN)) {
            await queryInterface.removeColumn(TABLE, COLUMN);
        }
    },
};
