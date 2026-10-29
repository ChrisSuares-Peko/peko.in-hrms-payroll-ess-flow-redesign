const { Op } = require("sequelize");
const ChartOfAccount = require("../entities/chartOfAccount");

// Resolve a set of account names → their COA rows (with provider_account_id).
exports.findAllByAccountNames = async (
    accountNames,
    attributes = undefined
) => {
    if (!Array.isArray(accountNames) || !accountNames.length) return [];
    return ChartOfAccount.findAll({
        where: { account_name: { [Op.in]: accountNames } },
        attributes,
        raw: true,
        nest: true,
    });
};

// The one shared COA row for a generic account name (Subscribers Wallet / Vendor
// Deposits / Partnership Fee Payable) — not linked to any single vendor/partner/corporate.
exports.findGenericAccountByName = async (accountName, attributes = undefined) => {
    return ChartOfAccount.findOne({
        where: {
            account_name: accountName,
            vendorId: null,
            partnerId: null,
            corporateUserId: null,
        },
        attributes,
        raw: true,
        nest: true,
    });
};

exports.findAllByProviderAccountIds = async (providerAccountIds, attributes = undefined) => {
    if (!Array.isArray(providerAccountIds) || !providerAccountIds.length) return [];
    return ChartOfAccount.findAll({
        where: { provider_account_id: { [Op.in]: providerAccountIds } },
        attributes,
        raw: true,
        nest: true,
    });
};

exports.finalizeSyncStatus = async (id, action, result) => {
    if (!id) return;

    const account = await ChartOfAccount.findByPk(id);
    if (!account) return null;

    const ACTION = action.toUpperCase();

    if (result?.account_id) {
        await account.update({
            provider_account_id: result.account_id,
            account_name: result.account_name,
            account_type: result.account_type,
            description: result.description,
            account_code: result.account_code,
            parent_account_id: result.parent_account_id || null,
            syncStatus: `${ACTION}_SUCCESS`,
        });
    } else {
        await account.update({ syncStatus: `${ACTION}_FAILED` });
    }

    return account;
};
