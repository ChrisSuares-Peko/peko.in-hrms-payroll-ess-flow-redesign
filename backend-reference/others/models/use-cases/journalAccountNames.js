const orders = require("../entities/order");
const { findAllByProviderAccountIds } = require("./chartOfAccount");
const { findOneCredential } = require("./credential");
const { findServiceOperatorById } = require("./serviceOperator");

// Shared (generic) COA accounts, the order entity whose name individualizes them on
// display, and the historical per-entity label to show instead of the shared account's
// own stored name (e.g. every vendor's deposit account used to be its own row literally
// named "Deposit - {vendorName}" — the ledger now uses one shared "Vendor Deposits" row,
// but the admin journal viewer still shows "Deposit - {vendorName}" for readability).
const GENERIC_COA_ACCOUNTS = {
    "Vendor Deposits": { entityKey: "vendor", displayPrefix: "Deposit" },
    "Subscribers Wallet": { entityKey: "corporate", displayPrefix: "Subscribers Wallet" },
    "Partnership Fee Payable": { entityKey: "partner", displayPrefix: "Partnership Fees Payable" },
};

const isGeneric = account =>
    GENERIC_COA_ACCOUNTS[account.account_name] &&
    account.vendorId == null &&
    account.partnerId == null &&
    account.corporateUserId == null;

const entityNamesFor = async corporateTxnId => {
    const names = { vendor: null, corporate: null, partner: null };
    const order = await orders.findOne({
        where: { corporateTxnId },
        attributes: ["credentialId", "serviceOperatorId"],
        raw: true,
    });
    if (!order) return names;

    const cred = order.credentialId
        ? await findOneCredential({ id: order.credentialId }, ["id", "name", "username", "registeredBy"])
        : null;
    names.corporate = cred?.username || null;
    if (order.serviceOperatorId) {
        const serviceOp = await findServiceOperatorById(order.serviceOperatorId);
        names.vendor = serviceOp?.vendor?.vendorName || null;
    }
    if (cred?.registeredBy) {
        const partnerCred = await findOneCredential({ id: cred.registeredBy }, ["id", "name"]);
        names.partner = partnerCred?.name || null;
    }
    return names;
};

const journalAccountNames = async (accountIds, corporateTxnId = null) => {
    const uniqueIds = [...new Set((accountIds || []).filter(id => id !== null && id !== undefined).map(String))];
    if (!uniqueIds.length) return {};

    const accounts = await findAllByProviderAccountIds(uniqueIds);
    const entityNames =
        corporateTxnId && accounts.some(isGeneric) ? await entityNamesFor(corporateTxnId) : null;

    const map = {};
    accounts.forEach(account => {
        let displayName = account.account_name;
        if (isGeneric(account) && entityNames) {
            const { entityKey, displayPrefix } = GENERIC_COA_ACCOUNTS[account.account_name];
            const entityName = entityNames[entityKey];
            if (entityName) displayName = `${displayPrefix} - ${entityName}`;
        }
        map[account.provider_account_id] = displayName;
    });
    return map;
};

const withAccountNames = async (lineItems, corporateTxnId) => {
    const names = await journalAccountNames((lineItems || []).map(item => item.accountId), corporateTxnId);
    return (lineItems || []).map(item => ({
        ...item,
        accountName: names[String(item.accountId)] || null,
    }));
};

module.exports = { GENERIC_COA_ACCOUNTS, journalAccountNames, withAccountNames };
