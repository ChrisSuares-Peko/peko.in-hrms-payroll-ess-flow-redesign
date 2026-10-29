const { getInternalAccounts } = require("./setting");

const ACCOUNT_SCOPES = { all: "all", internal: "internal" };

const ACCOUNT_SCOPE_IDS = "accountScopeIds";

const accountScopeOf = value =>
    String(value || "").trim() === ACCOUNT_SCOPES.internal ? ACCOUNT_SCOPES.internal : ACCOUNT_SCOPES.all;

const loadInternalAccountIds = async () => {
    const ids = await getInternalAccounts();
    return [
        ...new Set(
            (Array.isArray(ids) ? ids : [])
                .map(Number)
                .filter(id => Number.isInteger(id) && id > 0)
        ),
    ];
};

const resolveAccountIds = async scope =>
    accountScopeOf(scope) === ACCOUNT_SCOPES.internal ? loadInternalAccountIds() : null;

const accountScopeClause = (column, accountIds) =>
    accountIds.length ? `${column} IN (:${ACCOUNT_SCOPE_IDS})` : "1 = 0";

const withAccountScope = (replacements, accountIds) =>
    accountIds && accountIds.length ? { ...replacements, [ACCOUNT_SCOPE_IDS]: accountIds } : replacements;

const ACCOUNT_SCOPE_LABELS = { [ACCOUNT_SCOPES.internal]: "Internal purchase accounts" };

const accountScopeLabel = accountIds =>
    accountIds ? `Accounts: ${ACCOUNT_SCOPE_LABELS[ACCOUNT_SCOPES.internal]}` : null;

module.exports = {
    ACCOUNT_SCOPES,
    ACCOUNT_SCOPE_IDS,
    ACCOUNT_SCOPE_LABELS,
    accountScopeOf,
    loadInternalAccountIds,
    resolveAccountIds,
    accountScopeClause,
    withAccountScope,
    accountScopeLabel,
};
