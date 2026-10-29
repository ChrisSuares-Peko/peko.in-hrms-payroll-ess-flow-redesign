const axios = require("axios");
const { customLog } = require("../../loggerHelper");
const { getZohoAccessToken, DOMAIN, REQUEST_TIMEOUT_MS } = require("./auth");
const { callWithZohoTransientRetry } = require("./rateLimitRetry");

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_COA_ORGANIZATION_ID;

exports.fetchAll = async () => {
    try {
        let accessToken = await getZohoAccessToken();
        if (!accessToken) throw new Error("Missing Zoho access token");

        const response = await callWithZohoTransientRetry(
            () => axios.get(
                `https://www.zohoapis${DOMAIN}/books/v3/chartofaccounts?organization_id=${ZOHO_ORGANIZATION_ID}`,
                { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }, timeout: REQUEST_TIMEOUT_MS }
            ),
            { operation: "fetchAll" },
            (freshToken) => { accessToken = freshToken; }
        );
        return response.data.chartofaccounts || [];
    } catch (error) {
        customLog(null, "error", {
            message: "Error fetching Zoho chart of accounts",
            error: error?.response?.data || error.message,
        });
        return [];
    }
};

exports.getById = async (accountId) => {
    let accessToken = await getZohoAccessToken();
    try {
        const response = await callWithZohoTransientRetry(
            () => axios.get(
                `https://www.zohoapis${DOMAIN}/books/v3/chartofaccounts/${accountId}?organization_id=${ZOHO_ORGANIZATION_ID}`,
                { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }, timeout: REQUEST_TIMEOUT_MS }
            ),
            { operation: "getById", accountId },
            (freshToken) => { accessToken = freshToken; }
        );
        return response.data;
    } catch (error) {
        if (error?.response?.status === 404) {
            customLog(null, "info", {
                message: "[zoho/chartOfAccount] getById — account not found",
                accountId,
            });
            return null;
        }
        customLog(null, "error", {
            message: "Error fetching Zoho Chart of Account by ID",
            error: error?.response?.data || error.message,
        });
        throw error;
    }
};

exports.create = async (payload) => {
    let accessToken = await getZohoAccessToken();
    if (!accessToken) throw new Error("Unable to fetch access token");

    try {
        const response = await callWithZohoTransientRetry(
            () => axios.post(
                `https://www.zohoapis${DOMAIN}/books/v3/chartofaccounts?organization_id=${ZOHO_ORGANIZATION_ID}`,
                payload,
                {
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    timeout: REQUEST_TIMEOUT_MS,
                }
            ),
            { operation: "create" },
            (freshToken) => { accessToken = freshToken; }
        );
        const {
            account_id,
            account_name,
            account_type,
            description,
            account_code,
            parent_account_id,
        } = response.data.chart_of_account;
        return {
            account_id,
            account_name,
            account_type,
            description,
            account_code,
            parent_account_id,
        };
    } catch (error) {
        if (error?.response?.data?.code === 11002) {
            const allAccounts = await exports.fetchAll();
            const match = allAccounts.find(
                (acc) =>
                    acc.account_name?.toLowerCase() ===
                    payload.account_name?.toLowerCase()
            );
            if (match) {
                customLog(null, "info", {
                    message:
                        "[zoho/chartOfAccount] create — name already exists, linked to existing account instead",
                    accountName: payload.account_name,
                    accountId: match.account_id,
                });
                return {
                    account_id: match.account_id,
                    account_name: match.account_name,
                    account_type: match.account_type,
                    description: match.description,
                    account_code: match.account_code,
                    parent_account_id: match.parent_account_id,
                };
            }
        }

        const message = error?.response?.data?.message || error.message;
        customLog(null, "error", { message: "Error creating Zoho Chart of Account", error: error?.response?.data || error.message });
        throw new Error(message);
    }
};

exports.update = async (accountId, payload) => {
    let accessToken = await getZohoAccessToken();
    if (!accessToken) throw new Error("Failed to get Zoho access token");

    try {
        const response = await callWithZohoTransientRetry(
            () => axios.put(
                `https://www.zohoapis${DOMAIN}/books/v3/chartofaccounts/${accountId}?organization_id=${ZOHO_ORGANIZATION_ID}`,
                payload,
                {
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    timeout: REQUEST_TIMEOUT_MS,
                }
            ),
            { operation: "update", accountId },
            (freshToken) => { accessToken = freshToken; }
        );
        return response.data.chart_of_account;
    } catch (error) {
        const message = error?.response?.data?.message || error.message;
        customLog(null, "error", { message: "Zoho Chart of Account update failed", error: error?.response?.data || error.message });
        throw new Error(message);
    }
};

exports.getAccountTypes = async () => {
    let accessToken = await getZohoAccessToken();
    if (!accessToken) return null;

    try {
        const response = await callWithZohoTransientRetry(
            () => axios.get(
                `https://www.zohoapis${DOMAIN}/books/v3/autocomplete/coatypes?organization_id=${ZOHO_ORGANIZATION_ID}`,
                { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }, timeout: REQUEST_TIMEOUT_MS }
            ),
            { operation: "getAccountTypes" },
            (freshToken) => { accessToken = freshToken; }
        );
        return response.data?.results || [];
    } catch (error) {
        customLog(null, "error", {
            message: "Zoho get account types failed",
            error: error?.response?.data || error.message,
        });
        return null;
    }
};

exports.getParentAccounts = async () => {
    let accessToken = await getZohoAccessToken();
    if (!accessToken) return null;

    try {
        const typeResponse = await callWithZohoTransientRetry(
            () => axios.get(
                `https://www.zohoapis${DOMAIN}/books/v3/autocomplete/coatypes?organization_id=${ZOHO_ORGANIZATION_ID}`,
                { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }, timeout: REQUEST_TIMEOUT_MS }
            ),
            { operation: "getParentAccounts:coatypes" },
            (freshToken) => { accessToken = freshToken; }
        );
        const accountTypes = typeResponse.data.results || [];

        const chartResponse = await callWithZohoTransientRetry(
            () => axios.get(
                `https://www.zohoapis${DOMAIN}/books/v3/chartofaccounts/editpage?organization_id=${ZOHO_ORGANIZATION_ID}`,
                { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }, timeout: REQUEST_TIMEOUT_MS }
            ),
            { operation: "getParentAccounts:editpage" },
            (freshToken) => { accessToken = freshToken; }
        );
        const allAccounts = chartResponse.data.accountslist || [];

        const allowedParents = allAccounts.filter((acc) => {
            const typeInfo = accountTypes.find(
                (t) => t.account_type === acc.account_type
            );
            return typeInfo?.is_sub_account_allowed === true;
        });

        return allowedParents.map((acc) => ({
            value: acc.account_id,
            label: acc.account_name,
            account_code: acc.account_code || null,
            account_type: acc.account_type,
            account_group: acc.account_group,
            is_standalone_account: acc.is_standalone_account,
            depth: acc.depth,
        }));
    } catch (error) {
        customLog(null, "error", {
            message: "Error fetching parent accounts",
            error: error?.response?.data || error.message,
        });
        return null;
    }
};
