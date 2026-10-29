"use strict";

const FLAG_COLUMNS = [
    { table: "serviceOperators", column: "isCommissionConfigured" },
    { table: "cashbacks", column: "isSurchargeConfigured" },
    { table: "packages", column: "isCommissionConfigured" },
    { table: "mobileRechargeProviders", column: "isCommissionConfigured" },
    { table: "plans", column: "isCommissionConfigured" },
    { table: "work_plans", column: "isCommissionConfigured" },
    { table: "hikes", column: "isCommissionConfigured" },
    { table: "domainHostingPlans", column: "isCommissionConfigured" },
    { table: "businessRegistrationCatalogs", column: "isCommissionConfigured" },
    { table: "softwares_subscriptions_plans", column: "isCommissionConfigured" },
    { table: "esimPlans", column: "isCommissionConfigured" },
    { table: "giftCards", column: "isCommissionConfigured" },
    { table: "carReportPlans", column: "isCommissionConfigured" },
    { table: "govtServicesCatalogs", column: "isCommissionConfigured" },
];

const describe = async (queryInterface, table) => {
    try {
        return await queryInterface.describeTable(table);
    } catch (error) {
        return null;
    }
};

module.exports = {
    FLAG_COLUMNS,

    async up(queryInterface) {
        for (const { table, column } of FLAG_COLUMNS) {
            const columns = await describe(queryInterface, table);
            if (!columns || !columns[column]) continue;
            await queryInterface.sequelize.query(`UPDATE \`${table}\` SET \`${column}\` = 1 WHERE \`${column}\` = 0`);
        }
    },

    async down() {},
};
