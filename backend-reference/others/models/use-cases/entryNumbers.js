const { QueryTypes } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
require("../entities/accountingSequence");

const ENTRY_NUMBER_PREFIXES = {
    vendorDeposit: "DEP",
    vendorCreditNote: "VCN",
    vendorCommission: "COM",
    vendorCostOfSales: "COS",
    vendorDebitNote: "VDN",
    partnerPayout: "PAY",
    partnerDebitNote: "PDN",
    gatewayReceipt: "RCT",
    gatewayBill: "BIL",
    openingBalance: "OPB",
};

const ENTRY_NUMBER_WIDTH = 6;

const formatEntryNumber = (prefix, value) =>
    `${prefix}-${String(value).padStart(ENTRY_NUMBER_WIDTH, "0")}`;

const CLAIM_SQL =
    "INSERT INTO accountingSequences (name, lastValue, createdAt, updatedAt) " +
    "VALUES (:name, LAST_INSERT_ID(1), NOW(), NOW()) " +
    "ON DUPLICATE KEY UPDATE lastValue = LAST_INSERT_ID(lastValue + 1), updatedAt = NOW()";

const CLAIMED_SQL = "SELECT LAST_INSERT_ID() AS value";

const nextEntryNumber = async (prefix, transaction) => {
    await sequelizeConfig.query(CLAIM_SQL, { replacements: { name: prefix }, transaction });
    const [row] = await sequelizeConfig.query(CLAIMED_SQL, {
        transaction,
        type: QueryTypes.SELECT,
    });
    return formatEntryNumber(prefix, row.value);
};

const withEntryNumber = (prefix, write) =>
    sequelizeConfig.transaction(async transaction =>
        write(await nextEntryNumber(prefix, transaction), transaction)
    );

module.exports = {
    ENTRY_NUMBER_PREFIXES,
    ENTRY_NUMBER_WIDTH,
    CLAIM_SQL,
    CLAIMED_SQL,
    formatEntryNumber,
    nextEntryNumber,
    withEntryNumber,
};
