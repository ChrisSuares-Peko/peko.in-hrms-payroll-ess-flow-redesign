const { Op, fn, col } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("../entities/serviceOperator");
const credential = require("../entities/credential");
const chartOfAccount = require("../entities/chartOfAccount");
const vendor = require("../entities/vendor");
const vendorDeposits = require("../entities/vendorDeposit");
const partnerPayouts = require("../entities/partnerPayout");
const paymentGatewaySettlements = require("../entities/paymentGatewaySettlement");
const { getASetting } = require("./setting");

const ALERT_ITEMS_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const FAR_FUTURE = "9999-12-31";
const JOURNAL_RECORDING_SETTING = "journalRecording";
const PENDING_SYNC_STATUSES = ["CREATE_PENDING", "UPDATE_PENDING"];
const PENDING_SYNC_HOURS = 24;
const OVERDUE_PAYOUT_DAYS = 30;

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { type: sequelizeConfig.QueryTypes.SELECT, replacements });

const toNumber = value => Number(value) || 0;
const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
const text = column => `CONVERT(${column} USING utf8mb4)`;
const cap = items => items.slice(0, ALERT_ITEMS_LIMIT);
const emptyGroup = () => ({ count: 0, items: [] });

const dayOf = value => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
};

const listOf = (config, field) => (config && Array.isArray(config[field]) ? config[field] : []);
const vendorKeysOf = config => [
    ...new Set([...listOf(config, "service_with_plans"), ...listOf(config, "service_without_plans")]),
];
const planTypeOf = (accessKey, config) => {
    if (listOf(config, "service_with_plans").includes(accessKey)) return "with_plans";
    if (listOf(config, "service_without_plans").includes(accessKey)) return "without_plans";
    return null;
};

const findJournalRecordingOff = async config => {
    const keys = vendorKeysOf(config);
    const [setting, services] = await Promise.all([
        getASetting(JOURNAL_RECORDING_SETTING),
        keys.length
            ? serviceOperator.findAll({
                  where: { serviceStatus: true, recordJournalEntry: false, accessKey: { [Op.in]: keys } },
                  attributes: ["id", "serviceProvider", "accessKey"],
                  order: [["serviceProvider", "ASC"]],
                  raw: true,
              })
            : [],
    ]);
    const paused = Boolean(setting && setting.enabled === false);
    const items = [];
    if (paused) {
        items.push({
            label: "Journal recording is paused for every service",
            kind: "global",
            setByName: (setting && setting.setByName) || null,
            setAt: (setting && setting.setAt) || null,
        });
    }
    (services || []).forEach(row =>
        items.push({
            label: row.serviceProvider,
            kind: "service",
            accessKey: row.accessKey,
            planType: planTypeOf(row.accessKey, config),
        })
    );
    return { count: items.length, items: cap(items), meta: { paused, services: (services || []).length } };
};

const findChartOfAccountsPending = async (now = new Date()) => {
    const before = new Date(now.getTime() - PENDING_SYNC_HOURS * 60 * 60 * 1000);
    const where = { syncStatus: { [Op.in]: PENDING_SYNC_STATUSES }, updatedAt: { [Op.lt]: before } };
    const [count, rows] = await Promise.all([
        chartOfAccount.count({ where }),
        chartOfAccount.findAll({
            where,
            attributes: ["id", "account_name", "syncStatus", "updatedAt"],
            order: [["updatedAt", "ASC"]],
            limit: ALERT_ITEMS_LIMIT,
            raw: true,
        }),
    ]);
    return {
        count: toNumber(count),
        items: (rows || []).map(row => ({
            label: row.account_name,
            accountName: row.account_name,
            syncStatus: row.syncStatus || null,
            since: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
        })),
    };
};

const findDriftedApprovals = async () => {
    const { listTrees, loadApprovals, unitKey } = require("./serviceApprovalTree");
    const { loadReadinessContext, computeReadiness, driftOf } = require("./serviceApprovalReadiness");
    const [trees, approvals] = await Promise.all([listTrees({ partnersOnly: true }), loadApprovals()]);
    const active = trees.filter(tree => tree.treeStatus);
    const units = active.flatMap(tree =>
        tree.nodes
            .filter(node => node.hasAccess)
            .map(node => ({
                partnerPermissionId: tree.id,
                registeredBy: tree.registeredBy,
                nodeKey: node.nodeKey,
                accessKey: node.accessKey,
            }))
    );
    if (!units.length) return emptyGroup();
    const readiness = computeReadiness(units, await loadReadinessContext(units));

    const items = [];
    active.forEach(tree => {
        tree.nodes
            .filter(node => node.hasAccess)
            .forEach(node => {
                const key = unitKey(tree.id, node.accessKey);
                const approval = approvals.get(key);
                if (!approval || approval.status !== "APPROVED") return;
                const drift = driftOf(approval, readiness.get(key));
                if (!drift || !drift.changed) return;
                items.push({
                    label: `${tree.partnerName || "Default"} · ${node.label}`,
                    partnerPermissionId: tree.id,
                    partnerName: tree.partnerName || null,
                    accessKey: node.accessKey,
                    serviceLabel: node.label,
                    changes: (drift.fields || []).map(field => field.label || field.field),
                });
            });
    });
    return { count: items.length, items: cap(items) };
};

const isBlank = value => value === null || value === undefined || String(value).trim() === "";

const findVendorsWithoutGstDetails = async config => {
    const keys = vendorKeysOf(config);
    if (!keys.length) return emptyGroup();
    const rows = await serviceOperator.findAll({
        where: { serviceStatus: true, accessKey: { [Op.in]: keys } },
        attributes: ["id", "serviceProvider", "accessKey"],
        include: [
            {
                model: vendor,
                attributes: ["id", "vendorName", "state", "gstNo"],
                required: true,
                where: { [Op.or]: [{ state: null }, { state: "" }, { gstNo: null }, { gstNo: "" }] },
            },
        ],
        order: [["serviceProvider", "ASC"]],
        raw: true,
        nest: true,
    });

    const byVendor = new Map();
    (rows || []).forEach(row => {
        if (!row.vendor || !row.vendor.id) return;
        const id = String(row.vendor.id);
        if (!byVendor.has(id)) {
            const missing = [];
            if (isBlank(row.vendor.state)) missing.push("state");
            if (isBlank(row.vendor.gstNo)) missing.push("GST number");
            byVendor.set(id, {
                label: row.vendor.vendorName || `Vendor ${id}`,
                vendorId: row.vendor.id,
                accessKey: row.accessKey,
                planType: planTypeOf(row.accessKey, config),
                services: [],
                missing,
            });
        }
        byVendor.get(id).services.push(row.serviceProvider);
    });
    const items = [...byVendor.values()];
    return { count: items.length, items: cap(items) };
};

const priceOf = key => `COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p.packagePrices, '$.${key}')), 'null'), '')`;
const NO_PRICE = `(p.packagePrices IS NULL OR (${priceOf("monthly")} = '' AND ${priceOf("annually")} = ''))`;
const PACKAGES_FROM = "FROM packages p LEFT JOIN credentials c ON c.id = p.partnerId";

const packageScopeOf = pekoKeys =>
    pekoKeys.length ? "(p.type = '1' OR (p.type = '2' AND p.accessCode IN (:pekoKeys)))" : "p.type = '1'";

const buildPackagesWithoutPricingQuery = (pekoKeys, { count = false } = {}) => {
    const where = `WHERE p.status = 1 AND ${packageScopeOf(pekoKeys)} AND ${NO_PRICE}`;
    if (count) return `SELECT COUNT(*) AS total ${PACKAGES_FROM} ${where}`;
    return (
        `SELECT p.id, ${text("p.packageName")} AS packageName, ${text("p.accessCode")} AS accessCode, p.type, ` +
        `p.partnerId, ${text("c.name")} AS partnerName ${PACKAGES_FROM} ${where} ` +
        `ORDER BY p.packageName, p.id LIMIT ${ALERT_ITEMS_LIMIT}`
    );
};

const findPekoPackagesWithoutPricing = async config => {
    const pekoKeys = listOf(config, "peko_service_subscriptions");
    const replacements = pekoKeys.length ? { pekoKeys } : {};
    const [countRows, rows] = await Promise.all([
        select(buildPackagesWithoutPricingQuery(pekoKeys, { count: true }), replacements),
        select(buildPackagesWithoutPricingQuery(pekoKeys), replacements),
    ]);
    const items = (rows || [])
        .filter(row => row && row.id)
        .map(row => ({
            label: row.packageName || `Package ${row.id}`,
            packageId: row.id,
            packageName: row.packageName || null,
            accessCode: row.accessCode || null,
            ownService: String(row.type) === "2",
            partnerId: row.partnerId ? String(row.partnerId) : null,
            partnerName: row.partnerName || null,
        }));
    return { count: toNumber(countRows && countRows[0] && countRows[0].total), items };
};

const namesById = async (model, ids, nameColumn) => {
    if (!ids.length) return new Map();
    const rows = await model.findAll({ where: { id: { [Op.in]: ids } }, attributes: ["id", nameColumn], raw: true });
    return new Map((rows || []).map(row => [String(row.id), row[nameColumn]]));
};

const findVendorBalanceIssues = async () => {
    const { getVendorLedgerSnapshot, getLowBalanceThreshold } = require("./vendorLedger");
    const [snapshot, threshold] = await Promise.all([getVendorLedgerSnapshot(), getLowBalanceThreshold()]);
    const balances = (snapshot && snapshot.balances) || {};
    const low = Object.entries(balances)
        .filter(([, position]) => toNumber(position && position.available) < threshold)
        .map(([id, position]) => ({ vendorId: Number(id), available: round2(position.available) }))
        .sort((a, b) => a.available - b.available);
    if (!low.length) return { count: 0, items: [], meta: { threshold, negative: 0 } };

    const names = await namesById(vendor, low.map(entry => entry.vendorId), "vendorName");
    const items = low.map(entry => ({
        label: names.get(String(entry.vendorId)) || `Vendor ${entry.vendorId}`,
        vendorId: entry.vendorId,
        available: entry.available,
        threshold,
        negative: entry.available < 0,
    }));
    return {
        count: items.length,
        items: cap(items),
        meta: { threshold, negative: items.filter(item => item.negative).length },
    };
};

const FIRST_ORDER_BY_PARTNER =
    "SELECT customer.registeredBy AS partnerId, MIN(orders.transactionDate) AS firstOrder " +
    "FROM orders INNER JOIN credentials customer ON customer.id = orders.credentialId " +
    "WHERE orders.status = 'SUCCESS' AND customer.registeredBy IN (:partnerIds) " +
    "AND DATE(orders.transactionDate) > :accountingFloor GROUP BY customer.registeredBy";

const findPartnersOverdue = async ({ now = new Date(), accountingFloor } = {}) => {
    const { getPartnerLedgerSnapshot } = require("./partnerLedger");
    const snapshot = await getPartnerLedgerSnapshot();
    const balances = (snapshot && snapshot.balances) || {};
    const owed = Object.entries(balances)
        .filter(([, position]) => toNumber(position && position.owed) > 0)
        .map(([id, position]) => ({ partnerId: String(id), owed: round2(position.owed) }));
    if (!owed.length) return emptyGroup();

    const partnerIds = owed.map(entry => entry.partnerId);
    const [payouts, firstOrders, names] = await Promise.all([
        partnerPayouts.findAll({
            attributes: ["partnerCredentialId", [fn("MAX", col("payoutDate")), "lastPayout"]],
            where: {
                partnerCredentialId: { [Op.in]: partnerIds },
                entryKind: "PAYOUT",
                entryType: "PAYOUT",
                status: "ACTIVE",
            },
            group: ["partnerCredentialId"],
            raw: true,
        }),
        select(FIRST_ORDER_BY_PARTNER, { partnerIds, accountingFloor: accountingFloor || FAR_FUTURE }),
        namesById(credential, partnerIds, "name"),
    ]);
    const lastPayoutOf = new Map((payouts || []).map(row => [String(row.partnerCredentialId), dayOf(row.lastPayout)]));
    const firstOrderOf = new Map((firstOrders || []).map(row => [String(row.partnerId), dayOf(row.firstOrder)]));
    const cutoff = dayOf(new Date(now.getTime() - OVERDUE_PAYOUT_DAYS * DAY_MS));

    const items = owed
        .map(entry => {
            const lastPayout = lastPayoutOf.get(entry.partnerId) || null;
            const since = lastPayout || firstOrderOf.get(entry.partnerId) || null;
            return {
                label: names.get(entry.partnerId) || `Partner ${entry.partnerId}`,
                partnerId: entry.partnerId,
                owed: entry.owed,
                lastPayout,
                since,
            };
        })
        .filter(item => item.since && item.since < cutoff)
        .sort((a, b) => b.owed - a.owed);
    return { count: items.length, items: cap(items), meta: { days: OVERDUE_PAYOUT_DAYS } };
};

const SHORTFALL_FROM =
    "FROM paymentGatewaySettlements r " +
    "LEFT JOIN paymentGatewaySettlements f ON f.settlementId = r.id AND f.entryKind = 'FEE' " +
    "AND f.entryType = 'ENTRY' AND f.status = 'ACTIVE' AND f.deletedAt IS NULL";
const SHORTFALL_WHERE =
    "WHERE r.entryKind = 'RECEIPT' AND r.entryType = 'ENTRY' AND r.status = 'ACTIVE' AND r.deletedAt IS NULL " +
    "AND r.expectedAmount IS NOT NULL AND r.expectedAmount > r.amount AND f.id IS NULL " +
    "AND NOT EXISTS (SELECT 1 FROM paymentGatewaySettlements x WHERE x.reversesId = r.id AND x.deletedAt IS NULL)";

const buildGatewayShortfallQuery = ({ count = false } = {}) =>
    count
        ? `SELECT COUNT(*) AS total, COALESCE(SUM(r.expectedAmount - r.amount), 0) AS shortfall ${SHORTFALL_FROM} ${SHORTFALL_WHERE}`
        : `SELECT r.id, ${text("r.gatewayAccountId")} AS gatewayAccountId, r.amount, r.expectedAmount, r.entryDate, ` +
          `${text("r.reference")} AS reference ${SHORTFALL_FROM} ${SHORTFALL_WHERE} ORDER BY r.entryDate DESC, r.id DESC LIMIT ${ALERT_ITEMS_LIMIT}`;

const gatewayNamesOf = async gatewayAccountIds => {
    if (!gatewayAccountIds.length) return new Map();
    const rows = await chartOfAccount.findAll({
        where: { provider_account_id: { [Op.in]: gatewayAccountIds } },
        attributes: ["provider_account_id", "account_name"],
        raw: true,
    });
    return new Map((rows || []).map(row => [String(row.provider_account_id), row.account_name]));
};

const findGatewayShortfalls = async () => {
    const [countRows, rows] = await Promise.all([
        select(buildGatewayShortfallQuery({ count: true })),
        select(buildGatewayShortfallQuery()),
    ]);
    const receipts = (rows || []).filter(row => row && row.id);
    const names = await gatewayNamesOf([...new Set(receipts.map(row => String(row.gatewayAccountId)))]);
    const items = receipts.map(row => {
        const gatewayName = names.get(String(row.gatewayAccountId)) || null;
        return {
            label: `${gatewayName || `Gateway ${row.gatewayAccountId}`} · ${dayOf(row.entryDate) || "undated"}`,
            settlementId: row.id,
            gatewayAccountId: String(row.gatewayAccountId),
            gatewayName,
            amount: round2(row.amount),
            expectedAmount: round2(row.expectedAmount),
            shortfall: round2(toNumber(row.expectedAmount) - toNumber(row.amount)),
            date: dayOf(row.entryDate),
            reference: row.reference || null,
        };
    });
    const totals = (countRows && countRows[0]) || {};
    return { count: toNumber(totals.total), items, meta: { shortfall: round2(totals.shortfall) } };
};

const VENDORS_BEFORE_GO_LIVE =
    `SELECT so.vendorId AS profileId, ${text("v.vendorName")} AS profileName, COUNT(*) AS orders ` +
    "FROM orders o INNER JOIN serviceOperators so ON so.id = o.serviceOperatorId " +
    "INNER JOIN vendors v ON v.id = so.vendorId " +
    "WHERE o.status = 'SUCCESS' AND DATE(o.transactionDate) <= :accountingFloor AND so.accessKey IN (:vendorKeys) " +
    "GROUP BY so.vendorId, v.vendorName";

const PARTNERS_BEFORE_GO_LIVE =
    `SELECT customer.registeredBy AS profileId, ${text("partnerCredential.name")} AS profileName, COUNT(*) AS orders ` +
    "FROM orders INNER JOIN credentials customer ON customer.id = orders.credentialId " +
    "INNER JOIN credentials partnerCredential ON partnerCredential.id = customer.registeredBy " +
    "INNER JOIN systemUsers ON systemUsers.credentialId = partnerCredential.id " +
    "INNER JOIN roleAndPermissions ON roleAndPermissions.id = systemUsers.roleAndPermissionId " +
    "AND roleAndPermissions.roleName = 'partner' " +
    "WHERE orders.status = 'SUCCESS' AND DATE(orders.transactionDate) <= :accountingFloor " +
    "GROUP BY customer.registeredBy, partnerCredential.name";

const gatewaysBeforeGoLiveQuery = () => {
    const { GATEWAY_OF_ORDER } = require("./paymentGatewayLedger");
    return (
        `SELECT ${text(GATEWAY_OF_ORDER)} AS profileId, COUNT(*) AS orders FROM orders ` +
        `WHERE orders.status = 'SUCCESS' AND DATE(orders.transactionDate) <= :accountingFloor AND ${GATEWAY_OF_ORDER} IS NOT NULL ` +
        `GROUP BY ${text(GATEWAY_OF_ORDER)}`
    );
};

const openingIdsOf = async (model, kindWhere, column) => {
    const rows = await model.findAll({ attributes: [column], where: { ...kindWhere, status: "ACTIVE" }, raw: true });
    return new Set((rows || []).map(row => String(row[column])));
};

const findOpeningBalancesMissing = async ({ accountingFloor, config } = {}) => {
    if (!accountingFloor || accountingFloor === FAR_FUTURE) return emptyGroup();
    const vendorKeys = vendorKeysOf(config);
    const [vendorsActive, partnersActive, gatewaysActive, vendorOpenings, partnerOpenings, gatewayOpenings] =
        await Promise.all([
            vendorKeys.length ? select(VENDORS_BEFORE_GO_LIVE, { accountingFloor, vendorKeys }) : [],
            select(PARTNERS_BEFORE_GO_LIVE, { accountingFloor }),
            select(gatewaysBeforeGoLiveQuery(), { accountingFloor }),
            openingIdsOf(vendorDeposits, { entryType: "OPENING" }, "vendorId"),
            openingIdsOf(partnerPayouts, { entryKind: "OPENING" }, "partnerCredentialId"),
            openingIdsOf(paymentGatewaySettlements, { entryKind: "OPENING" }, "gatewayAccountId"),
        ]);

    const missing = (rows, ledger, openings) =>
        (rows || [])
            .filter(row => row && row.profileId !== null && row.profileId !== undefined && !openings.has(String(row.profileId)))
            .map(row => ({
                label: row.profileName || `${ledger === "gateways" ? "Gateway" : ledger === "partners" ? "Partner" : "Vendor"} ${row.profileId}`,
                ledger,
                profileId: String(row.profileId),
                profileName: row.profileName || null,
                orders: toNumber(row.orders),
            }));

    const gateways = missing(gatewaysActive, "gateways", gatewayOpenings);
    const gatewayNames = await gatewayNamesOf(gateways.map(item => item.profileId));
    gateways.forEach(item => {
        const name = gatewayNames.get(item.profileId);
        if (name) {
            item.profileName = name;
            item.label = name;
        }
    });

    const items = [
        ...missing(vendorsActive, "vendors", vendorOpenings),
        ...missing(partnersActive, "partners", partnerOpenings),
        ...gateways,
    ];
    return {
        count: items.length,
        items: cap(items),
        meta: {
            vendors: items.filter(item => item.ledger === "vendors").length,
            partners: items.filter(item => item.ledger === "partners").length,
            gateways: gateways.length,
        },
    };
};

module.exports = {
    ALERT_ITEMS_LIMIT,
    PENDING_SYNC_STATUSES,
    PENDING_SYNC_HOURS,
    OVERDUE_PAYOUT_DAYS,
    FIRST_ORDER_BY_PARTNER,
    VENDORS_BEFORE_GO_LIVE,
    PARTNERS_BEFORE_GO_LIVE,
    gatewaysBeforeGoLiveQuery,
    buildPackagesWithoutPricingQuery,
    buildGatewayShortfallQuery,
    findJournalRecordingOff,
    findChartOfAccountsPending,
    findDriftedApprovals,
    findVendorsWithoutGstDetails,
    findPekoPackagesWithoutPricing,
    findVendorBalanceIssues,
    findPartnersOverdue,
    findGatewayShortfalls,
    findOpeningBalancesMissing,
};
