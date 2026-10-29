const TABLE = "mobileRechargeProviders";

const PROVIDERS = [
    { providerName: "AIRTEL", displayName: "Airtel" },
    { providerName: "BSNL", displayName: "BSNL" },
    { providerName: "JIO", displayName: "Jio" },
    { providerName: "VI", displayName: "Vi" },
];

module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const normalized = tables.map((t) =>
            (typeof t === "string" ? t : t.tableName).toLowerCase()
        );
        if (!normalized.includes(TABLE.toLowerCase())) return;

        const existing = await queryInterface.sequelize.query(
            `SELECT providerName FROM ${TABLE} WHERE providerName IN (:names)`,
            {
                replacements: { names: PROVIDERS.map((p) => p.providerName) },
                type: Sequelize.QueryTypes.SELECT,
            }
        );
        const existingNames = new Set(existing.map((row) => row.providerName));
        const toInsert = PROVIDERS.filter(
            (p) => !existingNames.has(p.providerName)
        );
        if (!toInsert.length) return;

        await queryInterface.bulkInsert(
            TABLE,
            toInsert.map((p) => ({
                providerName: p.providerName,
                displayName: p.displayName,
                status: true,
                commissionMode: "MARGIN",
                commission: 0.0,
                commissionType: "PERCENTAGE",
                fixedCommissionPerTransaction: 0.0,
                isCommissionInclGST: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }))
        );
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        const normalized = tables.map((t) =>
            (typeof t === "string" ? t : t.tableName).toLowerCase()
        );
        if (!normalized.includes(TABLE.toLowerCase())) return;

        await queryInterface.bulkDelete(TABLE, {
            providerName: PROVIDERS.map((p) => p.providerName),
        });
    },
};
