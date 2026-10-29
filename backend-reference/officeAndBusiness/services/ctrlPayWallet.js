'use strict';

const {
    CTRLPAY_LIMITS,
    CTRLPAY_MESSAGES,
    CTRLPAY_METHOD,
    CTRLPAY_SUCCESS,
    CTRLPAY_TRANSACTION_KIND,
    CTRLPAY_TRANSACTION_STATUS,
} = require('../constants/ctrlPay');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');
const { createCtrlPaySession, payloadStatus } = require('../utils/ctrlPay/client');
const {
    toBalance,
    toSenderAccount,
    toVirtualAccount,
    toWalletTransaction,
} = require('../utils/ctrlPay/mappers');
const { openToken } = require('../utils/ctrlPay/tokenCipher');
const { readApplication } = require('./ctrlPayApplication');

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_STATEMENT_DAYS = 366;

const reject = (messageKey, statusCode) => {
    throw new ErrorResponse(CTRLPAY_MESSAGES[messageKey], statusCode);
};

const sessionFor = (user, logTraceId) => createCtrlPaySession({ corporateId: user.corporateId, logTraceId });

const invert = (map) => Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key]));
const STATUS_CODE = invert(CTRLPAY_TRANSACTION_STATUS);
const KIND_CODE = invert(CTRLPAY_TRANSACTION_KIND);

const istDate = (iso) => new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const sumRupees = (amounts) => Math.round(amounts.reduce((total, amount) => total + Math.round(amount * 100), 0)) / 100;

const movesBalance = ({ kind, status }) =>
    kind === 'Spend' ? status === 'Completed' || status === 'Pending' : status === 'Completed';

const isSuccess = ({ httpStatus, payload }) => httpStatus === 200 && payloadStatus(payload) === CTRLPAY_SUCCESS;

const failWalletCall = ({ httpStatus }) => {
    if (httpStatus === 404) reject('walletNotReady', 409);
    return reject('generic', 502);
};

const apiFilters = ({ kind, status, method, from, to }) => ({
    ...(kind ? { transaction_type: KIND_CODE[kind] } : {}),
    ...(status ? { transaction_status: STATUS_CODE[status] } : {}),
    ...(method ? { transaction_method: method } : {}),
    ...(from ? { start_date: from } : {}),
    ...(to ? { end_date: to } : {}),
});

const listPage = async (session, params) => {
    const result = await session.call(CTRLPAY_METHOD.listTransactions, params, { idempotent: true });
    if (!isSuccess(result) || !Array.isArray(result.payload.data)) failWalletCall(result);
    const rows = result.payload.data.map(toWalletTransaction);
    return { rows, total: Number(result.payload.total_count) >= 0 ? Number(result.payload.total_count) : rows.length };
};

const matchesFilters = (row, { kind, status, from, to }) => {
    const day = row.createdAt ? istDate(row.createdAt) : null;
    if (kind && row.kind !== kind) return false;
    if (status && row.status !== status) return false;
    if (from && (!day || day < from)) return false;
    if (to && (!day || day > to)) return false;
    return true;
};

const searchRows = async (session, filters) => {
    const result = await session.call(
        CTRLPAY_METHOD.searchTransactions,
        { search_text: filters.search, limit_start: 0, limit_page_length: CTRLPAY_LIMITS.maxSearchRows },
        { idempotent: true }
    );
    if (result.httpStatus !== 200 || !Array.isArray(result.payload)) failWalletCall(result);
    return result.payload.map(toWalletTransaction).filter((row) => matchesFilters(row, filters));
};

const readSenderAccounts = async (session) => {
    const result = await session.call(CTRLPAY_METHOD.listSenderAccounts, {}, { idempotent: true });
    if (isSuccess(result)) {
        return (Array.isArray(result.payload.accounts) ? result.payload.accounts : []).map(toSenderAccount);
    }
    if (result.httpStatus === 200 && payloadStatus(result.payload) === 'ERROR') return [];
    return failWalletCall(result);
};

exports.getOverview = async ({ user, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const [balanceResult, vpaResult, senderAccounts, loads] = await Promise.all([
        session.call(CTRLPAY_METHOD.getAccountBalance, {}, { idempotent: true }),
        session.call(CTRLPAY_METHOD.getVpa, {}, { idempotent: true }),
        readSenderAccounts(session),
        listPage(session, {
            limit_start: 0,
            limit_page_length: -1,
            transaction_type: KIND_CODE.Load,
            transaction_status: STATUS_CODE.Completed,
        }),
    ]);
    if (!isSuccess(balanceResult)) failWalletCall(balanceResult);

    const thisMonth = istDate(new Date().toISOString()).slice(0, 7);
    const loadRows = loads.rows.filter((row) => row.createdAt);
    const [lastLoad] = loadRows;
    return {
        ...toBalance(balanceResult.payload),
        vpa: vpaResult.httpStatus === 200 && typeof vpaResult.payload === 'string' ? vpaResult.payload : null,
        liveSince: session.connection.walletLiveAt ?? null,
        loadedThisMonth: sumRupees(
            loadRows.filter((row) => istDate(row.createdAt).slice(0, 7) === thisMonth).map((row) => row.amount)
        ),
        loadedTotal: sumRupees(loadRows.map((row) => row.amount)),
        loadCount: loadRows.length,
        lastLoad: lastLoad
            ? { amount: lastLoad.amount, methodLabel: lastLoad.methodLabel, createdAt: lastLoad.createdAt }
            : null,
        whitelistedAccountCount: senderAccounts.length,
    };
};

exports.getVirtualAccount = async ({ user, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.getVirtualAccount, {}, { idempotent: true });
    if (isSuccess(result)) return toVirtualAccount(result.payload);
    if (result.httpStatus === 404) return null;
    return reject('generic', 502);
};

exports.listSenderAccounts = async ({ user, logTraceId }) => readSenderAccounts(await sessionFor(user, logTraceId));

exports.addSenderAccount = async ({ user, accountName, accountNumber, ifsc, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const existing = await readSenderAccounts(session);
    if (existing.some((account) => account.accountNumber === accountNumber)) reject('senderDuplicate', 409);
    if (existing.length >= CTRLPAY_LIMITS.maxSenderAccounts) reject('senderLimit', 409);

    const result = await session.call(CTRLPAY_METHOD.addSenderAccounts, {
        accounts: [{ account_name: accountName, account_no: accountNumber, ifsc }],
    });
    if (!isSuccess(result)) {
        if (result.httpStatus === 200 || result.httpStatus === 400) reject('senderRejected', 400);
        failWalletCall(result);
    }
    customLog(logTraceId, 'info', { action: 'ctrlpay:senderAccountAdded', corporateId: user.corporateId }, 'VENDOR');
    return readSenderAccounts(session);
};

exports.removeSenderAccount = async ({ user, accountNumber, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.removeSenderAccount, { account_no: accountNumber });
    if (!isSuccess(result)) {
        if (result.httpStatus === 200 || result.httpStatus === 404) reject('senderNotFound', 404);
        failWalletCall(result);
    }
    customLog(logTraceId, 'info', { action: 'ctrlpay:senderAccountRemoved', corporateId: user.corporateId }, 'VENDOR');
    return { removed: true };
};

exports.listTransactions = async ({ user, filters, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const { page, pageSize } = filters;
    if (filters.search) {
        const rows = await searchRows(session, filters);
        return { total: rows.length, rows: rows.slice((page - 1) * pageSize, page * pageSize) };
    }
    return listPage(session, {
        limit_start: (page - 1) * pageSize,
        limit_page_length: pageSize,
        ...apiFilters(filters),
    });
};

exports.exportTransactions = async ({ user, filters, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    if (filters.search) return searchRows(session, filters);
    const { rows, total } = await listPage(session, {
        limit_start: 0,
        limit_page_length: CTRLPAY_LIMITS.maxExportRows,
        ...apiFilters(filters),
    });
    if (total > CTRLPAY_LIMITS.maxExportRows) reject('exportTooLarge', 422);
    return rows;
};

const dayBefore = (date) => new Date(new Date(`${date}T00:00:00Z`).getTime() - DAY_MS).toISOString().slice(0, 10);

exports.getStatement = async ({ user, from, to, logTraceId }) => {
    const spanDays = (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / DAY_MS;
    if (!(spanDays >= 0 && spanDays <= MAX_STATEMENT_DAYS)) reject('statementRange', 400);

    const session = await sessionFor(user, logTraceId);
    const [inRange, before] = await Promise.all([
        listPage(session, {
            limit_start: 0,
            limit_page_length: CTRLPAY_LIMITS.maxExportRows,
            start_date: from,
            end_date: to,
        }),
        listPage(session, { limit_start: 0, limit_page_length: 50, end_date: dayBefore(from) }),
    ]);
    if (inRange.total > CTRLPAY_LIMITS.maxExportRows) reject('exportTooLarge', 422);

    const opening = before.rows.find((row) => movesBalance(row) && row.balanceAfter !== null);
    const openingBalance = opening ? opening.balanceAfter : 0;
    const moving = inRange.rows.filter(movesBalance);
    const moneyIn = sumRupees(moving.filter((row) => row.kind === 'Load').map((row) => row.amount));
    const debits = moving.filter((row) => row.kind === 'Spend');
    const moneyOut = sumRupees(debits.map((row) => row.amount));

    return {
        from,
        to,
        openingBalance,
        moneyIn,
        moneyOut,
        closingBalance: sumRupees([openingBalance, moneyIn, -moneyOut]),
        debitCount: debits.length,
        rows: moving,
    };
};

const openStored = (sealed, key) => {
    try {
        return openToken(sealed, key) ?? '';
    } catch {
        return '';
    }
};

exports.getProfile = async ({ user, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const [application, nameResult] = await Promise.all([
        readApplication(session),
        session.call(CTRLPAY_METHOD.getCustomerName, {}, { idempotent: true }),
    ]);
    const { connection, config } = session;
    return {
        businessName:
            (isSuccess(nameResult) && typeof nameResult.payload.customer_name === 'string'
                ? nameResult.payload.customer_name
                : application.customerName) ?? '',
        entityType: application.constitutionDescription ?? '',
        adminName: typeof user.name === 'string' ? user.name : '',
        adminRole: 'Admin',
        email: connection.email ?? '',
        pan: openStored(connection.pan, config.tokenKey),
        mobile: openStored(connection.mobile, config.tokenKey),
    };
};
