const axios = require("axios");
const { customLog } = require("../../loggerHelper");
const { getZohoAccessToken, DOMAIN } = require("./auth");
const { callWithZohoRateLimitRetry } = require("./rateLimitRetry");

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_COA_ORGANIZATION_ID;

const JOURNALS_URL = `https://www.zohoapis${DOMAIN}/books/v3/journals`;

const withOrganization = (path = "", query = {}) => {
    const params = new URLSearchParams({ organization_id: ZOHO_ORGANIZATION_ID, ...query });
    return `${JOURNALS_URL}${path}?${params.toString()}`;
};

// Provider-agnostic payload → Zoho journal shape.
// payload: { journalDate, referenceNumber, notes, lineItems: [{ accountId, direction, amount, description }] }
const toZohoPayload = (payload) => ({
    journal_date: payload.journalDate,
    reference_number: payload.referenceNumber,
    notes: payload.notes,
    line_items: (payload.lineItems || []).map((r) => ({
        account_id: r.accountId,
        debit_or_credit: r.direction,
        amount: Number(r.amount),
        description: r.description,
    })),
});

const NO_TOKEN = "Unable to fetch Zoho access token";

// Every journal call shares the same contract: never throw, hand back Zoho's own message as
// `error` so it can be stored on the order and shown to the admin.
const zohoJournalRequest = async ({ operation, request, context = {}, onSuccess, fallbackError }) => {
    let accessToken = await getZohoAccessToken();
    if (!accessToken) {
        customLog(null, "info", { message: `[zoho/journal] no access token`, operation, ...context });
        return { success: false, raw: null, error: NO_TOKEN };
    }

    try {
        const response = await callWithZohoRateLimitRetry(
            () =>
                request({
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 20000,
                }),
            { operation, ...context },
            (freshToken) => {
                accessToken = freshToken;
            }
        );
        const data = response.data || {};
        const result = data.code === 0 ? onSuccess(data) : null;
        if (result) {
            return { success: true, raw: data, ...result };
        }
        customLog(null, "info", {
            message: `[zoho/journal] Zoho rejected the ${operation} call`,
            operation,
            ...context,
            zohoResponse: data,
        });
        return { success: false, raw: data, error: data.message || fallbackError };
    } catch (error) {
        customLog(null, "error", {
            message: `[zoho/journal] error during ${operation}`,
            operation,
            ...context,
            httpStatus: error?.response?.status,
            zohoError: error?.response?.data,
            errorMessage: error?.message,
        });
        return {
            success: false,
            raw: error?.response?.data || null,
            httpStatus: error?.response?.status || null,
            error: error?.response?.data?.message || error?.message || fallbackError,
        };
    }
};

const journalResult = (data) =>
    data.journal?.journal_id ? { providerJournalId: data.journal.journal_id, journal: data.journal } : null;

// Returns { success, providerJournalId, raw, error }. Never throws — the common layer
// records success/failure onto the order either way. `error` is a human-readable reason
// persisted onto journalData[key].reason so the admin UI can show why a journal failed.
exports.recordJournal = async (payload) => {
    const referenceNumber = payload?.referenceNumber;
    const data = toZohoPayload(payload);
    const result = await zohoJournalRequest({
        operation: "recordJournal",
        context: { referenceNumber },
        request: (config) => axios.post(withOrganization(), data, config),
        onSuccess: journalResult,
        fallbackError: "Zoho rejected the journal entry",
    });
    if (result.success) {
        customLog(null, "info", {
            message: "[zoho/journal] recorded",
            referenceNumber,
            journalId: result.providerJournalId,
        });
    }
    return { providerJournalId: null, ...result };
};

exports.getJournal = async (journalId) => {
    const result = await zohoJournalRequest({
        operation: "getJournal",
        context: { journalId },
        request: (config) => axios.get(withOrganization(`/${journalId}`), config),
        onSuccess: journalResult,
        fallbackError: "Zoho did not return the journal",
    });
    if (!result.success && result.httpStatus === 404) {
        return { success: true, found: false, journal: null, raw: result.raw };
    }
    return result.success ? { ...result, found: true } : result;
};
