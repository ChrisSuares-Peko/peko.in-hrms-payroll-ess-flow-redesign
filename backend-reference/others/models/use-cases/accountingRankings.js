"use strict";

const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("../entities/credential");
const { flooredAfter } = require("./accountingPeriod");
const { isVendorService } = require("./classifiedServices");
const { gmvOfOrder } = require("./journalPosting");

const RANKING_LIMIT = 6;

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

const SUCCESSFUL_IN_WINDOW =
    "orders.status = 'SUCCESS' " +
    `AND ${flooredAfter("DATE(orders.transactionDate)")} ` +
    "AND orders.transactionDate BETWEEN :from AND :to";

const PARTNER_OF_CUSTOMER =
    "CASE WHEN customer.registeredBy REGEXP '^[0-9]+$' " +
    "THEN CAST(customer.registeredBy AS UNSIGNED) ELSE 0 END";

const SERVICES_SQL =
    "SELECT serviceOperators.id AS serviceId, " +
    "CONVERT(serviceOperators.serviceProvider USING utf8mb4) AS name, " +
    `COALESCE(SUM(${gmvOfOrder("orders")}), 0) AS amount, COUNT(*) AS orderCount ` +
    "FROM orders " +
    "INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
    `WHERE ${SUCCESSFUL_IN_WINDOW} ` +
    "GROUP BY serviceOperators.id, serviceOperators.serviceProvider " +
    `ORDER BY amount DESC, serviceOperators.serviceProvider ASC LIMIT ${RANKING_LIMIT}`;

const VENDORS_SQL =
    "SELECT vendors.id AS vendorId, CONVERT(vendors.vendorName USING utf8mb4) AS name, " +
    `COALESCE(SUM(${jsonAmount("commissionExcludingGST")}), 0) AS amount, COUNT(*) AS orderCount ` +
    "FROM orders " +
    "INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
    "INNER JOIN vendors ON vendors.id = serviceOperators.vendorId " +
    `WHERE ${SUCCESSFUL_IN_WINDOW} AND ${isVendorService()} ` +
    "GROUP BY vendors.id, vendors.vendorName " +
    `ORDER BY amount DESC, vendors.vendorName ASC LIMIT ${RANKING_LIMIT}`;

const PARTNERS_SQL =
    "SELECT partnerId, COALESCE(SUM(orderAmount), 0) AS amount, COUNT(*) AS orderCount " +
    `FROM (SELECT ${PARTNER_OF_CUSTOMER} AS partnerId, ${gmvOfOrder("orders")} AS orderAmount ` +
    "FROM orders " +
    "INNER JOIN credentials customer ON customer.id = orders.credentialId " +
    `WHERE ${SUCCESSFUL_IN_WINDOW}) AS partnerOrders ` +
    `GROUP BY partnerId ORDER BY amount DESC, partnerId ASC LIMIT ${RANKING_LIMIT}`;

const select = (sql, replacements) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round(toNumber(value) * 100) / 100;

const rankingRow = (row, idField) => ({
    id: toNumber(row[idField]) || null,
    name: row.name ? String(row.name) : null,
    amount: round2(row.amount),
    orders: toNumber(row.orderCount),
});

const withPartnerNames = async rows => {
    const ids = rows.map(row => row.id).filter(id => id);
    if (!ids.length) return rows;

    const found = await credential.findAll({
        where: { id: { [Op.in]: ids } },
        attributes: ["id", "name"],
        raw: true,
    });
    const names = new Map((found || []).map(item => [Number(item.id), item.name]));

    return rows.map(row =>
        row.id ? { ...row, name: names.get(row.id) || String(row.id) } : row
    );
};

const getAccountingRankings = async ({ range, accountingFloor }) => {
    const replacements = { accountingFloor, from: range.from, to: range.to };
    const [services, vendors, partners] = await Promise.all([
        select(SERVICES_SQL, replacements),
        select(VENDORS_SQL, replacements),
        select(PARTNERS_SQL, replacements),
    ]);

    return {
        services: (services || []).map(row => rankingRow(row, "serviceId")),
        vendors: (vendors || []).map(row => rankingRow(row, "vendorId")),
        partners: await withPartnerNames((partners || []).map(row => rankingRow(row, "partnerId"))),
    };
};

module.exports = {
    RANKING_LIMIT,
    SERVICES_SQL,
    VENDORS_SQL,
    PARTNERS_SQL,
    withPartnerNames,
    getAccountingRankings,
};
