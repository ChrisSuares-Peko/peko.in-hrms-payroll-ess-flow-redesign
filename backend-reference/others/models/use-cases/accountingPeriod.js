const { getASetting, upsertSetting } = require("./setting");
const { istDay } = require("../../utils/istRange");
const { deleteKey } = require("../../utils/cacheDataMethods");
const { customLog } = require("../../utils/loggerHelper");

const GO_LIVE_SETTING = "accountingGoLiveDate";

// Every floored query compares strictly after a date, which is the convention the opening
// balances already use: the figure contains its own day. The go-live date is the first day
// the portal counts, so the floor is the day before it and the two never overlap.
const FAR_FUTURE = "9999-12-31";

// The five snapshots the accounting screens read from. Moving the go-live date restates all
// of them, so they are dropped rather than left to expire.
const DASHBOARD_CACHE_KEY = "accounting:dashboard:v8";

const ACCOUNTING_CACHE_KEYS = [
    DASHBOARD_CACHE_KEY,
    "accounting:vendor-balances:v5",
    "accounting:subscriber-balances:v2",
    "accounting:partner-balances:v3",
    "accounting:payment-gateway-balances:v1",
];

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value).slice(0, 10);

const previousDay = date => {
    const day = new Date(`${dayOf(date)}T00:00:00.000Z`);
    day.setUTCDate(day.getUTCDate() - 1);
    return day.toISOString().slice(0, 10);
};

const readGoLiveSetting = async () => {
    const details = await getASetting(GO_LIVE_SETTING);
    return details && details.date ? details : null;
};

const loadGoLiveDate = async () => {
    const details = await readGoLiveSetting();
    return details ? dayOf(details.date) : null;
};

// The date every floored query compares strictly after. With no go-live date set this is the
// end of time, so nothing counts anywhere — deliberately, because a portal showing years of
// history it was never meant to account for is worse than one that is visibly unconfigured.
const accountingFloorOf = goLiveDate => (goLiveDate ? previousDay(goLiveDate) : FAR_FUTURE);

const loadAccountingFloor = async () => accountingFloorOf(await loadGoLiveDate());

// Where an entity carries its own opening the later of the two governs, so a gateway
// reconciled after go-live floors at its own date rather than the portal's.
const flooredAfter = (dateExpression, openingExpression) =>
    openingExpression
        ? `${dateExpression} > GREATEST(COALESCE(${openingExpression}, :accountingFloor), :accountingFloor)`
        : `${dateExpression} > :accountingFloor`;

// The first instant the portal accounts for, for the reads that hold a Date rather than SQL.
const goLiveWindowStart = accountingFloor => {
    const start = new Date(`${accountingFloor}T00:00:00.000Z`);
    start.setUTCDate(start.getUTCDate() + 1);
    return start;
};

const isBeforeGoLive = (date, accountingFloor) => dayOf(date) <= accountingFloor;

// An opening carried in from before go-live would sit below the floor and never be counted,
// so it is refused rather than silently ignored.
const openingBeforeGoLive = async asOfDate => {
    const goLiveDate = await loadGoLiveDate();
    if (!goLiveDate) return "Set the accounting go live date before recording an opening balance";
    const floor = previousDay(goLiveDate);
    if (dayOf(asOfDate) < floor) {
        return `An opening balance must be dated ${floor} or later, the day the accounting go live date of ${goLiveDate} starts from`;
    }
    return null;
};

const getGoLiveSettings = async () => {
    const details = await readGoLiveSetting();
    if (!details) return { date: null, configured: false };

    return {
        date: dayOf(details.date),
        configured: true,
        setByName: details.setByName || null,
        setAt: details.setAt || null,
        reason: details.reason || null,
    };
};

const dropCache = async key => {
    try {
        await deleteKey(key);
    } catch (error) {
        customLog(null, "error", {
            message: "Accounting cache drop failed",
            key,
            error: error && error.message,
        });
    }
};

const dropAccountingCaches = async () => {
    for (const key of ACCOUNTING_CACHE_KEYS) {
        await dropCache(key);
    }
};

const dropDashboardCache = () => dropCache(DASHBOARD_CACHE_KEY);

const saveGoLiveDate = async ({ date, reason, actor }) => {
    const details = {
        date: dayOf(date),
        reason: reason || null,
        setById: actor && actor.id,
        setByName: actor && actor.name,
        setAt: new Date().toISOString(),
    };

    const saved = await upsertSetting(GO_LIVE_SETTING, details);
    if (saved === false) return null;

    // Every snapshot rests on this date, so none of them may outlive a change to it.
    await dropAccountingCaches();
    return details;
};

module.exports = {
    GO_LIVE_SETTING,
    FAR_FUTURE,
    DASHBOARD_CACHE_KEY,
    ACCOUNTING_CACHE_KEYS,
    dayOf,
    previousDay,
    accountingFloorOf,
    loadGoLiveDate,
    loadAccountingFloor,
    flooredAfter,
    goLiveWindowStart,
    isBeforeGoLive,
    openingBeforeGoLive,
    getGoLiveSettings,
    dropAccountingCaches,
    dropDashboardCache,
    saveGoLiveDate,
};
