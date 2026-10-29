const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const ChartOfAccount = require("../entities/chartOfAccount");
const { Op } = require("sequelize");

exports.create = asyncHandler(async (params) => {
    const responseData = await ChartOfAccount.create(params);
    if (!responseData) {
        return false;
    }
    return responseData;
});

exports.updateAccount = asyncHandler(async (id, data) => {
    const account = await ChartOfAccount.findByPk(id);
    if (!account) return null;

    await account.update(data);
    return account;
});

exports.findById = async (id) => {
    return await ChartOfAccount.findByPk(id);
};

exports.listAccounts = asyncHandler(async (params, attributes = undefined) => {
    const { limit, offset, searchText, sort, sortField } = params;
    let order = handleSortFields(sortField, sort);

    const where = {};
    if (searchText) {
        where[Op.or] = [
            { account_name: { [Op.like]: `%${searchText}%` } },
            { provider_account_id: { [Op.like]: `%${searchText}%` } },
            { account_type: { [Op.like]: `%${searchText}%` } },
            { account_code: { [Op.like]: `%${searchText}%` } },
            { description: { [Op.like]: `%${searchText}%` } },
        ];
    }

    return await ChartOfAccount.findAndCountAll({
        where,
        limit,
        offset,
        order,
        attributes,
        raw: true,
    });
});

exports.findByAccountName = async (accountName) => {
    return await ChartOfAccount.findOne({ where: { account_name: accountName } });
};

// Every provider account id filed under one name. The journal resolves its income
// accounts by name alone (findAllByAccountNames), so anything reading the journal back
// has to look them up the same way or it can miss the row the lines actually point at.
exports.findAccountIdsByName = async (accountName) => {
    const rows = await ChartOfAccount.findAll({
        where: { account_name: accountName },
        attributes: ["provider_account_id"],
        raw: true,
    });
    return rows.map((row) => row.provider_account_id).filter(Boolean);
};

// Vendor deposit accounts from before the switch to common COAs: one row per vendor,
// named "Deposit - {vendorName}" and tagged with its vendorId. Orders journaled then
// still point at them, so the vendor ledger counts them alongside the shared account.
exports.findLegacyVendorDepositAccounts = async () => {
    return ChartOfAccount.findAll({
        where: {
            vendorId: { [Op.ne]: null },
            account_name: { [Op.like]: "Deposit - %" },
        },
        attributes: ["vendorId", "provider_account_id"],
        raw: true,
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

exports.findAllByProviderAccountIds = async (
    providerAccountIds,
    attributes = undefined
) => {
    if (!Array.isArray(providerAccountIds) || !providerAccountIds.length)
        return [];
    return await ChartOfAccount.findAll({
        where: {
            provider_account_id: {
                [Op.in]: providerAccountIds,
            },
        },
        attributes,
        raw: true,
        nest: true,
    });
};

exports.findAllByPartnerId = async (partnerId, attributes = undefined) => {
    if (!partnerId) return [];
    return await ChartOfAccount.findAll({
        where: { partnerId },
        attributes,
        raw: true,
        nest: true,
    });
};