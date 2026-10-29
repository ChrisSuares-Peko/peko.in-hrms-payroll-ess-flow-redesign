const { getASetting, upsertSetting } = require("../setting");
const { deleteKey } = require("../../../utils/cacheDataMethods");
const {
    ACCOUNTING_CACHE_KEYS,
    DASHBOARD_CACHE_KEY,
    dropDashboardCache,
    FAR_FUTURE,
    previousDay,
    accountingFloorOf,
    loadGoLiveDate,
    loadAccountingFloor,
    flooredAfter,
    goLiveWindowStart,
    isBeforeGoLive,
    openingBeforeGoLive,
    getGoLiveSettings,
    saveGoLiveDate,
} = require("../accountingPeriod");

jest.mock("../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../../utils/cacheDataMethods", () => ({ deleteKey: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

beforeEach(() => {
    jest.clearAllMocks();
    deleteKey.mockResolvedValue(undefined);
});

describe("the floor the go live date makes", () => {
    it("sits on the day before it, so the go live day itself is the first one counted", () => {
        expect(previousDay("2026-10-01")).toBe("2026-09-30");
        expect(accountingFloorOf("2026-10-01")).toBe("2026-09-30");
    });

    it("crosses a month and a year boundary", () => {
        expect(previousDay("2026-01-01")).toBe("2025-12-31");
        expect(previousDay("2026-03-01")).toBe("2026-02-28");
    });

    it("is the end of time while no date is set, so nothing anywhere counts", async () => {
        getASetting.mockResolvedValue(false);

        expect(accountingFloorOf(null)).toBe(FAR_FUTURE);
        expect(await loadGoLiveDate()).toBeNull();
        expect(await loadAccountingFloor()).toBe(FAR_FUTURE);
    });

    it("reads the date off the setting row", async () => {
        getASetting.mockResolvedValue({ date: "2026-10-01", setByName: "Ibrahim" });

        expect(await loadGoLiveDate()).toBe("2026-10-01");
        expect(await loadAccountingFloor()).toBe("2026-09-30");
    });

    it("treats a setting row with no date as unconfigured", async () => {
        getASetting.mockResolvedValue({ date: null });

        expect(await loadAccountingFloor()).toBe(FAR_FUTURE);
    });
});

describe("the floor expression", () => {
    it("compares strictly after, the same convention the openings use", () => {
        expect(flooredAfter("DATE(orders.transactionDate)")).toBe(
            "DATE(orders.transactionDate) > :accountingFloor"
        );
    });

    it("lets an entity's own opening govern when it is the later of the two", () => {
        expect(flooredAfter("entryDate", "openingFloor.floorDate")).toBe(
            "entryDate > GREATEST(COALESCE(openingFloor.floorDate, :accountingFloor), :accountingFloor)"
        );
    });
});

describe("the window the Order Journals screen opens on", () => {
    it("starts on the go live day itself, not on the floor", () => {
        expect(goLiveWindowStart("2026-09-30").toISOString()).toBe("2026-10-01T00:00:00.000Z");
    });

    it("is unreachable while no date is set, so no journal can be listed or reposted", () => {
        expect(goLiveWindowStart(FAR_FUTURE).getTime()).toBeGreaterThan(Date.now());
    });

    it("refuses an order dated on or before the floor and admits the go live day", () => {
        expect(isBeforeGoLive("2026-09-29T10:00:00.000Z", "2026-09-30")).toBe(true);
        expect(isBeforeGoLive("2026-09-30T10:00:00.000Z", "2026-09-30")).toBe(true);
        expect(isBeforeGoLive("2026-10-01T00:00:00.000Z", "2026-09-30")).toBe(false);
    });
});

describe("what is read back", () => {
    it("says it is unconfigured rather than inventing a date", async () => {
        getASetting.mockResolvedValue(false);

        expect(await getGoLiveSettings()).toEqual({ date: null, configured: false });
    });

    it("carries who set it, when and why", async () => {
        getASetting.mockResolvedValue({
            date: "2026-10-01T00:00:00.000Z",
            setByName: "Ibrahim",
            setAt: "2026-09-23T06:00:00.000Z",
            reason: "portal go live",
        });

        expect(await getGoLiveSettings()).toEqual({
            date: "2026-10-01",
            configured: true,
            setByName: "Ibrahim",
            setAt: "2026-09-23T06:00:00.000Z",
            reason: "portal go live",
        });
    });
});

describe("saving it", () => {
    it("records the actor and drops every accounting snapshot", async () => {
        upsertSetting.mockResolvedValue({});

        const saved = await saveGoLiveDate({
            date: "2026-10-01",
            reason: "portal go live",
            actor: { id: 42, name: "Ibrahim" },
        });

        expect(upsertSetting).toHaveBeenCalledWith(
            "accountingGoLiveDate",
            expect.objectContaining({
                date: "2026-10-01",
                reason: "portal go live",
                setById: 42,
                setByName: "Ibrahim",
            })
        );
        expect(saved.setAt).toEqual(expect.any(String));
        expect(deleteKey.mock.calls.map(([key]) => key)).toEqual(ACCOUNTING_CACHE_KEYS);
    });

    it("leaves the caches alone when the setting could not be written", async () => {
        upsertSetting.mockResolvedValue(false);

        expect(await saveGoLiveDate({ date: "2026-10-01", actor: {} })).toBeNull();
        expect(deleteKey).not.toHaveBeenCalled();
    });

    it("drops the rest even when one cache refuses to go", async () => {
        upsertSetting.mockResolvedValue({});
        deleteKey.mockRejectedValueOnce(new Error("redis down"));

        await saveGoLiveDate({ date: "2026-10-01", actor: {} });

        expect(deleteKey).toHaveBeenCalledTimes(ACCOUNTING_CACHE_KEYS.length);
    });
});

describe("dropping only the dashboard snapshot", () => {
    it("deletes the dashboard key alone and swallows a cache failure", async () => {
        await dropDashboardCache();
        expect(deleteKey.mock.calls.map(([key]) => key)).toEqual([DASHBOARD_CACHE_KEY]);
        expect(ACCOUNTING_CACHE_KEYS).toContain(DASHBOARD_CACHE_KEY);

        deleteKey.mockRejectedValueOnce(new Error("redis down"));
        await expect(dropDashboardCache()).resolves.toBeUndefined();
    });
});

describe("an opening balance against the go live date", () => {
    it("is refused outright while no go live date is set", async () => {
        getASetting.mockResolvedValue(false);

        expect(await openingBeforeGoLive("2026-09-30")).toContain("go live date");
    });

    it("accepts one that sits exactly on the floor", async () => {
        getASetting.mockResolvedValue({ date: "2026-10-01" });

        expect(await openingBeforeGoLive("2026-09-30")).toBeNull();
    });

    it("accepts one dated later, because that entity's own floor is then stricter", async () => {
        getASetting.mockResolvedValue({ date: "2026-10-01" });

        expect(await openingBeforeGoLive("2026-10-15")).toBeNull();
    });

    it("refuses one dated below the floor, where it would never be counted", async () => {
        getASetting.mockResolvedValue({ date: "2026-10-01" });

        expect(await openingBeforeGoLive("2026-09-29")).toContain("2026-09-30");
    });
});
