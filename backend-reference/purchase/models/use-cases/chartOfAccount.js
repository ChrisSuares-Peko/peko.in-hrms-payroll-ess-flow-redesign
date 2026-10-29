const ChartOfAccount = require("../entities/chartOfAccount");

exports.create = async (params) => {
    return await ChartOfAccount.create(params);
};

exports.findByAccountName = async (accountName) => {
    return await ChartOfAccount.findOne({ where: { account_name: accountName } });
};

exports.updateAccount = async (id, data) => {
    const account = await ChartOfAccount.findByPk(id);
    if (!account) return null;
    await account.update(data);
    return account;
};

exports.findAllByVendorId = async (vendorId, attributes = undefined) => {
    if (!vendorId) return [];
    return await ChartOfAccount.findAll({
        where: { vendorId },
        attributes,
        raw: true,
        nest: true,
    });
};