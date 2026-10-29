// Accounting-provider registry. Callers never import a provider folder directly —
// they ask here, and the provider name comes from env (ACCOUNTING_PROVIDER, default:
// zoho). To add a provider: create utils/providers/<name>/{journal,chartOfAccount}.js
// exporting the same generic method names as zoho's, then register it in PROVIDERS.
const zohoJournal = require("./zoho/journal");
const zohoChartOfAccount = require("./zoho/chartOfAccount");

const PROVIDERS = {
    zoho: {
        journal: {
            recordJournal: zohoJournal.recordJournal,
            getJournal: zohoJournal.getJournal,
        },
        chartOfAccounts: {
            getById: zohoChartOfAccount.getById,
            create: zohoChartOfAccount.create,
            update: zohoChartOfAccount.update,
            getAccountTypes: zohoChartOfAccount.getAccountTypes,
            getParentAccounts: zohoChartOfAccount.getParentAccounts,
        },
    },
};

const getAccountingProvider = () => {
    const name = (process.env.ACCOUNTING_PROVIDER || "zoho").toLowerCase();
    const provider = PROVIDERS[name];
    if (!provider) {
        throw new Error(
            `Unknown ACCOUNTING_PROVIDER "${name}". Registered: ${Object.keys(
                PROVIDERS
            ).join(", ")}`
        );
    }
    return { name, ...provider };
};

module.exports = { getAccountingProvider };
