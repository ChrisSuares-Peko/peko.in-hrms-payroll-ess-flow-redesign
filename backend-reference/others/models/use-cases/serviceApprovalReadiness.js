const crypto = require("crypto");
const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("../entities/serviceOperator");
const systemUser = require("../entities/systemUser");
const credential = require("../entities/credential");
const { getASetting } = require("./setting");
const {
    SERVICE_ATTRIBUTES,
    VENDOR_INCLUDE,
    getServicesTypeConfig,
    findPlanTypeForAccessKey,
    isCommissionConfigured,
} = require("./accountingServices");
const { getPlanEntityConfig } = require("./accountingPlans");
const { loadAddOnCounts } = require("./accountingAddOns");
const { loadAccountingFloor, flooredAfter } = require("./accountingPeriod");
const {
    PLAN_CATALOGUES,
    COMMISSION_NOT_CONFIGURED,
    recorded,
    failed,
    skipped,
    notRecorded,
    findChartOfAccountIssues,
} = require("./accountingDashboard");
const { partnerIdOf, unitKey } = require("./serviceApprovalTree");

const FINGERPRINT_FIELDS = [
    "planType",
    "operatorId",
    "vendorId",
    "vendorState",
    "commissionMode",
    "commissionType",
    "providerCommission",
    "fixedCommissionPerTransaction",
    "isCommissionInclGST",
    "recordJournalEntry",
    "plansMissingCommission",
    "partnerSharePercentage",
];

const FINGERPRINT_LABELS = {
    planType: "Service type",
    operatorId: "Service operator",
    vendorId: "Vendor",
    vendorState: "Vendor state",
    commissionMode: "Commission mode",
    commissionType: "Commission type",
    providerCommission: "Commission rate",
    fixedCommissionPerTransaction: "Fixed commission per transaction",
    isCommissionInclGST: "Commission includes GST",
    recordJournalEntry: "Journal recording for the service",
    plansMissingCommission: "Plans without commission",
    partnerSharePercentage: "Partner share",
};

const JOURNAL_RECORDING_SETTING = "journalRecording";

const CASHBACK_LINKS_SQL =
    "SELECT COALESCE(NULLIF(NULLIF(CAST(p.partnerId AS CHAR), ''), 'null'), 'default') AS partnerKey, " +
    "c.serviceOperatorId, COUNT(*) AS total, SUM(COALESCE(c.isSurchargeConfigured, 0) = 0) AS unconfigured " +
    "FROM cashbacks c INNER JOIN packages p ON p.id = c.packageId " +
    "WHERE c.serviceStatus = 1 AND p.status = 1 AND c.serviceOperatorId IN (:operatorIds) " +
    "GROUP BY partnerKey, c.serviceOperatorId";

const toNumber = value => Number(value) || 0;

const numberOrNull = value =>
    value === null || value === undefined || value === "" || Number.isNaN(Number(value))
        ? null
        : Number(value);

const boolOrNull = value => (value === null || value === undefined ? null : Boolean(Number(value)));

const partnerKeyOf = registeredBy => (registeredBy ? String(registeredBy) : "default");

const plural = (count, singular, pluralForm) => (count === 1 ? singular : pluralForm);

const buildPlansMissingQuery = accessKeys => {
    const selects = [];
    const replacements = {};
    accessKeys.forEach((accessKey, index) => {
        const config = getPlanEntityConfig(accessKey);
        if (!config) return;
        const catalogue = PLAN_CATALOGUES.find(item => item.table === config.table);
        const where = [
            `${config.table}.status = 1`,
            config.where,
            COMMISSION_NOT_CONFIGURED,
            catalogue && catalogue.extraWhere,
        ]
            .filter(Boolean)
            .join(" AND ");
        replacements[`key${index}`] = accessKey;
        selects.push(
            `SELECT :key${index} AS accessKey, COUNT(*) AS total FROM ${config.table} WHERE ${where}`
        );
    });
    return { sql: selects.join(" UNION ALL "), replacements };
};

const buildOrdersQuery = () =>
    "SELECT serviceOperatorId, COUNT(*) AS total, SUM(status = 'SUCCESS') AS success, " +
    `SUM(${recorded("transaction")}) AS recorded, ` +
    `SUM(${failed("transaction")}) AS failed, ` +
    `SUM(COALESCE(${skipped("transaction")}, 0)) AS skipped, ` +
    `SUM(status = 'SUCCESS' AND ${notRecorded("transaction")}) AS notRecorded, ` +
    "SUM(COALESCE(JSON_EXTRACT(journalData, '$.journalAccountIds.isInternalAccount') = true, 0)) AS internal, " +
    "MAX(transactionDate) AS lastOrderAt, " +
    `MAX(CASE WHEN ${recorded("transaction")} THEN transactionDate END) AS lastRecordedAt ` +
    `FROM orders WHERE serviceOperatorId IN (:operatorIds) AND ${flooredAfter("DATE(transactionDate)")} ` +
    "GROUP BY serviceOperatorId";

const loadOperators = async accessKeys => {
    if (!accessKeys.length) return { byKey: new Map(), counts: new Map() };
    const rows =
        (await serviceOperator.findAll({
            where: { accessKey: { [Op.in]: accessKeys } },
            attributes: [...SERVICE_ATTRIBUTES, "vendorId"],
            include: VENDOR_INCLUDE,
            order: [
                ["serviceStatus", "DESC"],
                ["id", "ASC"],
            ],
            raw: true,
            nest: true,
        })) || [];

    const byKey = new Map();
    const counts = new Map();
    rows.forEach(row => {
        counts.set(row.accessKey, (counts.get(row.accessKey) || 0) + 1);
        if (!byKey.has(row.accessKey)) byKey.set(row.accessKey, row);
    });
    return { byKey, counts };
};

const loadPartners = async registeredBys => {
    const ids = [...new Set(registeredBys.map(partnerIdOf).filter(Boolean))];
    if (!ids.length) return new Map();
    const rows =
        (await systemUser.findAll({
            where: { credentialId: { [Op.in]: ids } },
            attributes: ["credentialId", "sharePercentage", "brandingStatus"],
            include: [{ model: credential, attributes: ["name"] }],
            raw: true,
            nest: true,
        })) || [];
    return new Map(rows.map(row => [String(row.credentialId), row]));
};

const loadPlansMissing = async accessKeys => {
    const { sql, replacements } = buildPlansMissingQuery(accessKeys);
    if (!sql) return new Map();
    const rows = await sequelizeConfig.query(sql, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements,
    });
    return new Map((rows || []).map(row => [row.accessKey, toNumber(row.total)]));
};

const loadAddOnsMissing = async accessKeys => {
    const counts = await loadAddOnCounts(accessKeys);
    return new Map([...counts].map(([accessKey, count]) => [accessKey, count.notConfigured.length]));
};

const loadCashbackLinks = async operatorIds => {
    if (!operatorIds.length) return new Map();
    const rows = await sequelizeConfig.query(CASHBACK_LINKS_SQL, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: { operatorIds },
    });
    return new Map(
        (rows || []).map(row => [
            `${row.partnerKey}:${row.serviceOperatorId}`,
            { total: toNumber(row.total), unconfigured: toNumber(row.unconfigured) },
        ])
    );
};

const loadOrders = async (operatorIds, accountingFloor) => {
    if (!operatorIds.length) return new Map();
    const rows = await sequelizeConfig.query(buildOrdersQuery(), {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: { operatorIds, accountingFloor },
    });
    return new Map((rows || []).map(row => [Number(row.serviceOperatorId), row]));
};

const loadReadinessContext = async units => {
    const accessKeys = [...new Set(units.map(unit => unit.accessKey).filter(Boolean))];
    const registeredBys = [...new Set(units.map(unit => unit.registeredBy).filter(Boolean))];

    const [config, operators, partners, coa, journalRecording, accountingFloor] = await Promise.all([
        getServicesTypeConfig(),
        loadOperators(accessKeys),
        loadPartners(registeredBys),
        findChartOfAccountIssues().catch(() => null),
        getASetting(JOURNAL_RECORDING_SETTING),
        loadAccountingFloor(),
    ]);

    const withPlansKeys = accessKeys.filter(
        key => findPlanTypeForAccessKey(config, key) === "with_plans" && getPlanEntityConfig(key)
    );
    const operatorIds = [...new Set([...operators.byKey.values()].map(row => Number(row.id)))];

    const [plansMissing, addOnsMissing, cashbackLinks, orders] = await Promise.all([
        loadPlansMissing(withPlansKeys),
        loadAddOnsMissing(withPlansKeys),
        loadCashbackLinks(operatorIds),
        loadOrders(operatorIds, accountingFloor),
    ]);

    return {
        config,
        operators,
        partners,
        coa,
        journalRecordingEnabled: !(journalRecording && journalRecording.enabled === false),
        plansMissing,
        addOnsMissing,
        cashbackLinks,
        orders,
    };
};

const item = (key, label, required, status, detail, fix = null) => ({
    key,
    label,
    required,
    status,
    detail,
    fix,
});

const check = (key, label, required, ok, okDetail, failDetail, fix = null) =>
    item(key, label, required, ok ? "pass" : required ? "fail" : "warn", ok ? okDetail : failDetail, fix);

const describeCommission = operator => {
    const parts = [];
    const rate = toNumber(operator.providerCommission);
    const fixed = toNumber(operator.fixedCommissionPerTransaction);
    if (rate > 0 || fixed <= 0) {
        parts.push(operator.commissionType === "FLAT" ? `${rate} flat` : `${rate}%`);
    }
    if (fixed > 0) parts.push(`${fixed} fixed per transaction`);
    return `Commission ${parts.join(" + ")}`;
};

const emptySnapshot = () =>
    Object.fromEntries(FINGERPRINT_FIELDS.map(field => [field, null]));

const fingerprintOf = snapshot =>
    crypto
        .createHash("sha256")
        .update(
            JSON.stringify(
                FINGERPRINT_FIELDS.map(field => [
                    field,
                    snapshot[field] === undefined ? null : snapshot[field],
                ])
            )
        )
        .digest("hex");

const evidenceOf = aggregate => ({
    successOrders: toNumber(aggregate && aggregate.success),
    recorded: toNumber(aggregate && aggregate.recorded),
    failed: toNumber(aggregate && aggregate.failed),
    skipped: toNumber(aggregate && aggregate.skipped),
    notRecorded: toNumber(aggregate && aggregate.notRecorded),
    internal: toNumber(aggregate && aggregate.internal),
    lastOrderAt: (aggregate && aggregate.lastOrderAt) || null,
    lastRecordedAt: (aggregate && aggregate.lastRecordedAt) || null,
});

const evidenceItem = evidence => {
    if (evidence.successOrders === 0) {
        return item("evidence", "Journal evidence", false, "info", "No orders yet");
    }
    if (evidence.recorded === 0) {
        return item(
            "evidence",
            "Journal evidence",
            false,
            "warn",
            `${evidence.successOrders} successful ${plural(evidence.successOrders, "order", "orders")}, none with a journal recorded`
        );
    }
    return item(
        "evidence",
        "Journal evidence",
        false,
        "pass",
        `${evidence.recorded} of ${evidence.successOrders} successful ${plural(evidence.successOrders, "order has", "orders have")} the journal recorded`
    );
};

const computeUnit = (unit, context) => {
    const items = [];
    const snapshot = emptySnapshot();
    const partnerTree = Boolean(unit.registeredBy);
    const operator = unit.accessKey ? context.operators.byKey.get(unit.accessKey) || null : null;
    const planType = unit.accessKey ? findPlanTypeForAccessKey(context.config, unit.accessKey) : null;
    const detailFix = (tab, partnerId = null) =>
        planType
            ? {
                  screen: planType === "with_plans" ? "service_with_plans" : "service_without_plans",
                  accessKey: unit.accessKey,
                  tab,
                  ...(partnerId ? { partnerId } : {}),
              }
            : null;

    if (!operator) {
        items.push(
            item(
                "operator",
                "Service operator",
                true,
                "fail",
                `No service operator carries the key ${unit.accessKey}. Add one in Settings › Service Operators.`
            )
        );
    } else {
        const shared = context.operators.counts.get(unit.accessKey) || 1;
        const vendorName = operator.vendor && operator.vendor.vendorName;
        const vendorState = (operator.vendor && operator.vendor.state) || null;
        const journalOn = Boolean(Number(operator.recordJournalEntry));

        items.push(
            check(
                "classification",
                "Service type",
                true,
                planType !== null,
                planType === "with_plans"
                    ? "Listed under Service with plans"
                    : "Listed under Service without plans",
                "Not classified as Service with plans or Service without plans. Set the type in Settings › Service Classification."
            )
        );
        items.push(
            item(
                "operator",
                "Service operator",
                true,
                "pass",
                shared > 1
                    ? `Checked ${operator.serviceProvider} (${shared} operators share this key)`
                    : `Checked ${operator.serviceProvider}`
            )
        );
        items.push(
            check(
                "vendor",
                "Vendor",
                true,
                Boolean(operator.vendorId && vendorName),
                vendorState
                    ? `Vendor ${vendorName}`
                    : `Vendor ${vendorName} — state not set, so GST cannot be split`,
                "No vendor linked to this service. Link one in Settings › Service Operators."
            )
        );

        const planConfig = planType === "with_plans" ? getPlanEntityConfig(unit.accessKey) : null;
        if (planConfig) {
            const missing = context.plansMissing.has(unit.accessKey)
                ? context.plansMissing.get(unit.accessKey)
                : null;
            const addOnsMissing = context.addOnsMissing.get(unit.accessKey) || 0;
            const serviceItems = planConfig.serviceCommissionItems || null;
            const serviceItemsOk = !serviceItems || isCommissionConfigured(operator);
            const plansDetail =
                missing === null
                    ? "Plan commissions could not be checked"
                    : missing > 0
                    ? `${missing} ${plural(missing, "plan", "plans")} without commission`
                    : null;
            const addOnsDetail =
                addOnsMissing > 0
                    ? `${addOnsMissing} ${plural(addOnsMissing, "add-on", "add-ons")} without commission`
                    : null;
            const serviceItemsDetail = serviceItemsOk
                ? null
                : `Commission for ${serviceItems} is not marked as configured`;
            items.push(
                check(
                    "commission",
                    "Commission",
                    true,
                    missing === 0 && addOnsMissing === 0 && serviceItemsOk,
                    serviceItems ? `Every plan and ${serviceItems} carry a commission` : "Every plan carries a commission",
                    [plansDetail, addOnsDetail, serviceItemsDetail].filter(Boolean).join("; "),
                    detailFix("plans")
                )
            );
            snapshot.plansMissingCommission = missing === null ? null : missing + addOnsMissing;
        } else {
            items.push(
                check(
                    "commission",
                    "Commission",
                    true,
                    isCommissionConfigured(operator),
                    describeCommission(operator),
                    "No commission configured for this service",
                    detailFix(planType === "with_plans" ? "plans" : "commission")
                )
            );
        }

        items.push(
            check(
                "journalFlag",
                "Journal recording for the service",
                true,
                journalOn,
                "Journals are recorded for this service",
                "Journal recording is switched off for this service. Switch it on in Settings › Service Operators."
            )
        );

        Object.assign(snapshot, {
            planType,
            operatorId: Number(operator.id),
            vendorId: numberOrNull(operator.vendorId),
            vendorState,
            commissionMode: operator.commissionMode || null,
            commissionType: operator.commissionType || null,
            providerCommission: numberOrNull(operator.providerCommission),
            fixedCommissionPerTransaction: numberOrNull(operator.fixedCommissionPerTransaction),
            isCommissionInclGST: boolOrNull(operator.isCommissionInclGST),
            recordJournalEntry: journalOn,
        });
    }

    if (partnerTree) {
        const partner = context.partners.get(String(unit.registeredBy));
        const share = partner ? numberOrNull(partner.sharePercentage) : null;
        items.push(
            check(
                "partnerShare",
                "Partner share",
                true,
                share !== null,
                `Partner share ${share}%`,
                "No partner share % set for this partner",
                { screen: "whitelabel_partners" }
            )
        );
        snapshot.partnerSharePercentage = share;
    }

    if (operator) {
        const partnerKey = partnerKeyOf(unit.registeredBy);
        const links = context.cashbackLinks.get(`${partnerKey}:${operator.id}`) || null;
        const packagesFix = detailFix("cashbacks", partnerKey);
        const platformFeeFix = detailFix("platform-fee", partnerKey);
        if (links) {
            items.push(
                item(
                    "cashbackLink",
                    "Packages",
                    false,
                    "pass",
                    `${links.total} ${plural(links.total, "package", "packages")} of this partner include the service`,
                    packagesFix
                )
            );
            items.push(
                check(
                    "platformFee",
                    "Platform fee",
                    true,
                    links.unconfigured === 0,
                    `Platform fee marked as configured on ${links.total} linked ${plural(links.total, "package", "packages")}`,
                    `Platform fee not marked as configured on ${links.unconfigured} of ${links.total} linked ${plural(links.total, "package", "packages")}`,
                    platformFeeFix
                )
            );
        } else {
            items.push(
                item(
                    "cashbackLink",
                    "Packages",
                    false,
                    "warn",
                    "No package of this partner includes this service yet, so its corporates cannot buy it",
                    packagesFix
                )
            );
            items.push(
                item(
                    "platformFee",
                    "Platform fee",
                    false,
                    "info",
                    "No linked packages to carry a platform fee",
                    platformFeeFix
                )
            );
        }
    }

    if (context.coa) {
        const issues =
            context.coa.missing.length + context.coa.unsynced.count + context.coa.misclassified.length;
        items.push(
            check(
                "chartOfAccounts",
                "Chart of accounts",
                false,
                issues === 0,
                "Every required account is present and synced",
                `${issues} chart of accounts ${plural(issues, "issue needs", "issues need")} attention`,
                { screen: "chart_of_accounts" }
            )
        );
    } else {
        items.push(
            item("chartOfAccounts", "Chart of accounts", false, "info", "The chart of accounts could not be checked", {
                screen: "chart_of_accounts",
            })
        );
    }
    items.push(
        check(
            "journalRecording",
            "Journal recording across the platform",
            false,
            context.journalRecordingEnabled,
            "Journal recording is on across the platform",
            "Journal recording is paused across the platform"
        )
    );

    let evidence = null;
    if (operator) {
        evidence = evidenceOf(context.orders.get(Number(operator.id)));
        items.push(evidenceItem(evidence));
    }

    const required = items.filter(entry => entry.required);
    return {
        items,
        summary: {
            passed: required.filter(entry => entry.status === "pass").length,
            total: required.length,
            blocking: required.filter(entry => entry.status === "fail").map(entry => entry.key),
            warnings: items.filter(entry => !entry.required && entry.status === "warn").map(entry => entry.key),
        },
        snapshot,
        hash: fingerprintOf(snapshot),
        evidence,
    };
};

const computeReadiness = (units, context) =>
    new Map(units.map(unit => [unitKey(unit.partnerPermissionId, unit.nodeKey), computeUnit(unit, context)]));

const parseJson = value => {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const sameValue = (a, b) =>
    JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);

const driftOf = (approval, readiness) => {
    if (!approval || approval.status !== "APPROVED" || !approval.configHash || !readiness) return null;
    if (approval.configHash === readiness.hash) return null;

    const stored = parseJson(approval.configSnapshot) || {};
    const fields = FINGERPRINT_FIELDS.filter(field => !sameValue(stored[field], readiness.snapshot[field])).map(
        field => ({
            field,
            label: FINGERPRINT_LABELS[field],
            before: stored[field] === undefined ? null : stored[field],
            after: readiness.snapshot[field],
        })
    );
    return { changed: true, fields };
};

module.exports = {
    FINGERPRINT_FIELDS,
    FINGERPRINT_LABELS,
    CASHBACK_LINKS_SQL,
    buildPlansMissingQuery,
    buildOrdersQuery,
    loadReadinessContext,
    computeReadiness,
    fingerprintOf,
    driftOf,
};
