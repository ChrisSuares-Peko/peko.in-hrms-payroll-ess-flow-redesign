const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("../entities/serviceOperator");
const credential = require("../entities/credential");
const { getPlanEntityConfig } = require("./accountingPlans");

const COMMISSION_GAP = "commissionNotConfiguredFor";
const SURCHARGE_GAP = "surchargeNotConfiguredFor";
const SURCHARGE_GAP_PACKAGE = "surchargeNotConfiguredPackageId";

const SURCHARGE_BY_PACKAGE_SQL =
    "SELECT isSurchargeConfigured AS configured FROM cashbacks " +
    "WHERE serviceOperatorId = :serviceOperatorId AND packageId = :packageId";

const SURCHARGE_BY_SUBSCRIPTION_SQL =
    "SELECT cashbacks.isSurchargeConfigured AS configured FROM cashbacks " +
    "INNER JOIN subscriptions ON subscriptions.packageId = cashbacks.packageId AND subscriptions.status = 'ACTIVE' " +
    "INNER JOIN corporateUsers ON corporateUsers.id = subscriptions.corporateUserId " +
    "WHERE cashbacks.serviceOperatorId = :serviceOperatorId AND cashbacks.serviceStatus = 1 " +
    "AND corporateUsers.credentialId = :credentialId";

const isOn = value => value === true || value === 1 || value === "1" || value === "true";

const textOf = value => (typeof value === "string" && value.trim() ? value.trim() : null);

const nameCandidates = name => {
    const full = textOf(name);
    if (!full) return [];
    const separator = full.indexOf(" : ");
    const bare = separator > -1 ? textOf(full.slice(separator + 3)) : null;
    return [...new Set([full, bare].filter(Boolean))];
};

const partnerOf = registeredBy => {
    const value = String(registeredBy ?? "").trim();
    return /^\d+$/.test(value) ? value : null;
};

const selectRows = async (sql, replacements) =>
    (await sequelizeConfig.query(sql, { type: sequelizeConfig.QueryTypes.SELECT, replacements })) || [];

const planRowsSql = (config, scope) =>
    [
        `SELECT ${config.table}.isCommissionConfigured AS configured FROM ${config.table}`,
        config.joins ? config.joins.replace(/\s+/g, " ").trim() : null,
        "WHERE",
        [config.where, `${config.table}.${config.nameColumn} IN (:names)`, scope].filter(Boolean).join(" AND "),
    ]
        .filter(Boolean)
        .join(" ");

const findPlanRows = async (config, names, partner) => {
    if (config.partnerFilterColumn) {
        const scope = partner ? `${config.partnerFilterColumn} = :partner` : `${config.partnerFilterColumn} IS NULL`;
        const scoped = await selectRows(planRowsSql(config, scope), { names, partner });
        if (scoped.length) return scoped;
    }
    return selectRows(planRowsSql(config, null), { names });
};

const commissionSource = async (gapName, operator, partner) => {
    const config =
        operator && gapName !== operator.serviceProvider ? getPlanEntityConfig(operator.accessKey) : null;
    const names = config ? nameCandidates(gapName) : [];
    if (names.length) {
        const rows = await findPlanRows(config, names, partner);
        if (rows.length) return { level: "plan", configured: rows.every(row => isOn(row.configured)) };
    }
    return { level: "service", configured: Boolean(operator) && isOn(operator.isCommissionConfigured) };
};

const surchargeConfigured = async (order, packageId) => {
    if (!order.serviceOperatorId) return false;
    const rows = packageId
        ? await selectRows(SURCHARGE_BY_PACKAGE_SQL, { serviceOperatorId: order.serviceOperatorId, packageId })
        : await selectRows(SURCHARGE_BY_SUBSCRIPTION_SQL, {
              serviceOperatorId: order.serviceOperatorId,
              credentialId: order.credentialId,
          });
    return rows.length > 0 && rows.every(row => isOn(row.configured));
};

const commissionRefusal = (name, level) =>
    level === "plan"
        ? `Commission for the plan "${name}" is still not marked as configured. Mark it as configured on the service's Plans tab, then retry.`
        : `Commission for "${name}" is still not marked as configured. Mark the service's commission as configured, then retry.`;

const surchargeRefusal = name =>
    `Platform fee for "${name}" is still not marked as configured for this customer's package. Mark it as configured on the service's Platform Fee tab, then retry.`;

const withoutGaps = (journalData, keys) => {
    const next = { ...journalData };
    keys.forEach(key => delete next[key]);
    return next;
};

const loadOperator = serviceOperatorId =>
    serviceOperatorId
        ? serviceOperator.findOne({
              where: { id: serviceOperatorId },
              attributes: ["id", "serviceProvider", "accessKey", "isCommissionConfigured"],
              raw: true,
          })
        : null;

const loadPartner = async credentialId => {
    if (!credentialId) return null;
    const row = await credential.findOne({ where: { id: credentialId }, attributes: ["registeredBy"], raw: true });
    return partnerOf(row && row.registeredBy);
};

const GAP_KEYS = [COMMISSION_GAP, SURCHARGE_GAP, SURCHARGE_GAP_PACKAGE];

const withStoredGaps = (journalData, stored) => {
    const next = { ...(journalData || {}) };
    GAP_KEYS.forEach(key => {
        if (stored && stored[key] !== undefined) next[key] = stored[key];
        else delete next[key];
    });
    return next;
};

const refreshConfigurationGaps = async (order, journalData) => {
    const data = withStoredGaps(journalData, order.journalData);
    const commissionGap = textOf(data[COMMISSION_GAP]);
    const surchargeGap = textOf(data[SURCHARGE_GAP]);
    if (!commissionGap && !surchargeGap) return { journalData: data, refusal: null };

    if (data.netSubscriptionIncome != null) {
        return { journalData: withoutGaps(data, GAP_KEYS), refusal: null };
    }

    const cleared = [];
    const refusals = [];

    if (commissionGap) {
        const [operator, partner] = await Promise.all([
            loadOperator(order.serviceOperatorId),
            loadPartner(order.credentialId),
        ]);
        const source = await commissionSource(commissionGap, operator, partner);
        if (source.configured) cleared.push(COMMISSION_GAP);
        else refusals.push(commissionRefusal(commissionGap, source.level));
    }

    if (surchargeGap) {
        const packageId = Number(data[SURCHARGE_GAP_PACKAGE]) || null;
        if (await surchargeConfigured(order, packageId)) cleared.push(SURCHARGE_GAP, SURCHARGE_GAP_PACKAGE);
        else refusals.push(surchargeRefusal(surchargeGap));
    }

    if (refusals.length) return { journalData: data, refusal: refusals[0] };
    return { journalData: withoutGaps(data, cleared), refusal: null };
};

module.exports = {
    COMMISSION_GAP,
    SURCHARGE_GAP,
    SURCHARGE_GAP_PACKAGE,
    GAP_KEYS,
    SURCHARGE_BY_PACKAGE_SQL,
    SURCHARGE_BY_SUBSCRIPTION_SQL,
    nameCandidates,
    refreshConfigurationGaps,
};
