const PLAN_ENTITY_CONFIG = require("../../utils/planEntityConfig");

const PLAN_CATALOGUES = [
    {
        table: "packages",
        name: "packageName",
        extraWhere: "type = '2'",
    },
    { table: "plans", name: "name" },
    { table: "work_plans", name: "name" },
    { table: "businessRegistrationCatalogs", name: "CONCAT_WS(' - ', serviceName, variantName)" },
    { table: "esimPlans", name: "name" },
    { table: "giftCards", name: "product_name" },
    { table: "hikes", name: "name" },
    { table: "softwares_subscriptions_plans", name: "name" },
    { table: "domainHostingPlans", name: "planName" },
    { table: "mobileRechargeProviders", name: "providerName" },
    { table: "govtServicesCatalogs", name: "CONCAT_WS(' - ', serviceName, variantName)" },
];

const accessKeyExpressionOf = table => {
    const owners = Object.entries(PLAN_ENTITY_CONFIG).filter(([, config]) => config.table === table);
    if (!owners.length) return "NULL";
    const shared = owners.filter(([, config]) => config.accessCode);
    if (!shared.length) return `'${owners[0][0]}'`;
    const branches = shared.map(([accessKey, config]) => `WHEN '${config.accessCode}' THEN '${accessKey}'`);
    return `CASE accessCode ${branches.join(" ")} ELSE accessCode END`;
};

module.exports = { PLAN_CATALOGUES, accessKeyExpressionOf };
