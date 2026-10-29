'use strict';

const {
    CTRLPAY_TRANSACTION_KIND,
    CTRLPAY_TRANSACTION_STATUS,
} = require('../../constants/ctrlPay');

const IST_TIMESTAMP = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/;

const paiseToRupees = (paise) => {
    if (paise === null || paise === undefined || paise === '') return null;
    const value = Number(paise);
    return Number.isFinite(value) ? Math.round(value) / 100 : null;
};

const istToIso = (timestamp) => {
    const match = IST_TIMESTAMP.exec(String(timestamp ?? '').trim());
    if (!match) return null;
    const millis = (match[3] ?? '0').padEnd(3, '0').slice(0, 3);
    return new Date(`${match[1]}T${match[2]}.${millis}+05:30`).toISOString();
};

const text = (value) => (typeof value === 'string' ? value : null);

const toApplication = (payload) => ({
    status: text(payload?.status),
    customerName: text(payload?.customer_name),
    constitutionCode: text(payload?.constitution_code),
    constitutionDescription: text(payload?.constitution_description),
});

const DOCUMENT_STATUSES = ['NOT_UPLOADED', 'UPLOADED', 'VERIFIED', 'REJECTED'];

const toDocument = (fileName, entry, { required = true } = {}) => ({
    fileName,
    name: text(entry?.name) ?? fileName,
    status: DOCUMENT_STATUSES.includes(entry?.status) ? entry.status : 'NOT_UPLOADED',
    remarks: text(entry?.remarks),
    required: entry && typeof entry.required === 'boolean' ? entry.required : required,
});

const toChecklist = (payload) => {
    const entityDocuments = (Array.isArray(payload?.document_type) ? payload.document_type : [])
        .flatMap((item) => Object.entries(item && typeof item === 'object' ? item : {}))
        .map(([fileName, entry]) => toDocument(fileName, entry));
    return {
        constitutionCode: text(payload?.constitution_code),
        constitutionDescription: text(payload?.constitution_description),
        requirement: payload?.doc_requirement === 'any' ? 'any' : 'all',
        panCard: toDocument('pan_card', payload?.pan_card),
        entityDocuments,
        ovd: { ...toDocument('ovd_of_ubo', payload?.ovd, { required: false }), ovdType: text(payload?.ovd?.type) },
        ovdBack: toDocument('ovd_of_ubo_back', payload?.ovd_back, { required: false }),
    };
};

const isProvided = (document) => document.status === 'UPLOADED' || document.status === 'VERIFIED';

const isChecklistComplete = (checklist) => {
    if (!isProvided(checklist.panCard)) return false;
    const entityProvided =
        checklist.requirement === 'any'
            ? checklist.entityDocuments.length === 0 || checklist.entityDocuments.some(isProvided)
            : checklist.entityDocuments.every(isProvided);
    if (!entityProvided) return false;
    if (checklist.ovd.required && !isProvided(checklist.ovd)) return false;
    if (checklist.ovdBack.required && !isProvided(checklist.ovdBack)) return false;
    return true;
};

const toWalletTransaction = (row) => {
    const kind = CTRLPAY_TRANSACTION_KIND[row?.transaction_type] ?? 'Spend';
    const isLoad = kind === 'Load';
    return {
        id: String(row?.name ?? ''),
        reference: String(row?.transaction_id ?? row?.name ?? ''),
        status: CTRLPAY_TRANSACTION_STATUS[row?.transaction_status] ?? 'Pending',
        kind,
        methodLabel: text(row?.transaction_method) ?? '',
        createdAt: istToIso(row?.creation),
        amount: paiseToRupees(row?.amount_in_paise) ?? 0,
        balanceAfter: paiseToRupees(row?.balance_after_transaction_in_paise),
        counterpartyName: (isLoad ? text(row?.display_payer_name) ?? text(row?.payer_name) : text(row?.payee_name)) ?? '',
        counterpartyVpa: (isLoad ? text(row?.payer_vpa) : text(row?.payee_vpa)) ?? '',
        upiRrn: text(row?.upi_rrn) ?? '',
        note: text(row?.note) ?? '',
    };
};

const toBalance = (payload) => ({
    balance: paiseToRupees(payload?.balance_in_paise) ?? 0,
    dailyLimits: {
        newPayees: {
            amountLeft: paiseToRupees(payload?.non_registered_beneficiary_daily_amount_limit) ?? 0,
            countLeft: Number(payload?.non_registered_beneficiary_daily_count_limit) || 0,
        },
        savedPayees: {
            amountLeft: paiseToRupees(payload?.registered_beneficiary_daily_amount_limit) ?? 0,
            countLeft: Number(payload?.registered_beneficiary_daily_count_limit) || 0,
        },
    },
});

const toSenderAccount = (account) => ({
    accountName: text(account?.account_name) ?? '',
    accountNumber: text(account?.account_no) ?? '',
    ifsc: text(account?.ifsc) ?? '',
});

const toVirtualAccount = (payload) => ({
    accountName: text(payload?.account_name) ?? '',
    accountNumber: text(payload?.virtual_account_number) ?? '',
    ifsc: text(payload?.ifsc) ?? '',
});

module.exports = {
    paiseToRupees,
    istToIso,
    toApplication,
    toChecklist,
    isChecklistComplete,
    toWalletTransaction,
    toBalance,
    toSenderAccount,
    toVirtualAccount,
};
