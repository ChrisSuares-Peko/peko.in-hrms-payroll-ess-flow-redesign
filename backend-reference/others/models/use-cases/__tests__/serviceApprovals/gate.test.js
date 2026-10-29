const { getASetting, upsertSetting } = require("../../setting");
const { dropDashboardCache } = require("../../accountingPeriod");
const {
    GATE_SETTING,
    getApprovalGateSettings,
    isApprovalGateEnabled,
    saveApprovalGate,
} = require("../../serviceApprovalGate");

jest.mock("../../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../accountingPeriod", () => ({ dropDashboardCache: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

describe("reading the approval gate", () => {
    it("reads the gate as on when the row is missing", async () => {
        getASetting.mockResolvedValue(false);

        expect(await getApprovalGateSettings()).toEqual({
            enabled: true,
            reason: null,
            setById: null,
            setByName: null,
            setAt: null,
        });
        expect(await isApprovalGateEnabled()).toBe(true);
        expect(getASetting).toHaveBeenCalledWith(GATE_SETTING);
    });

    it("reads the gate as off only for an explicit false, keeping who switched it", async () => {
        getASetting.mockResolvedValue({
            enabled: false,
            setById: 42,
            setByName: "Ibrahim",
            setAt: "2026-09-26T05:00:00.000Z",
            reason: "UAT testing",
        });

        expect(await getApprovalGateSettings()).toMatchObject({
            enabled: false,
            setByName: "Ibrahim",
            reason: "UAT testing",
        });
        expect(await isApprovalGateEnabled()).toBe(false);
    });

    it("treats a row without the flag as on", async () => {
        getASetting.mockResolvedValue({ reason: "x" });

        expect(await isApprovalGateEnabled()).toBe(true);
    });
});

describe("saving the approval gate", () => {
    it("writes the flag with the acting user and drops the dashboard cache", async () => {
        upsertSetting.mockImplementation((name, details) => Promise.resolve(details));

        const saved = await saveApprovalGate({ enabled: false, reason: "dev mode", actor: { id: 42, name: "Ibrahim" } });

        expect(upsertSetting).toHaveBeenCalledWith(
            GATE_SETTING,
            expect.objectContaining({ enabled: false, reason: "dev mode", setById: 42, setByName: "Ibrahim" })
        );
        expect(upsertSetting.mock.calls[0][1].setAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(saved).toMatchObject({ enabled: false, setByName: "Ibrahim" });
        expect(dropDashboardCache).toHaveBeenCalledTimes(1);
    });

    it("stores anything that is not exactly true as off", async () => {
        upsertSetting.mockImplementation((name, details) => Promise.resolve(details));

        await saveApprovalGate({ enabled: "yes", reason: null, actor: { id: 1, name: "A" } });

        expect(upsertSetting.mock.calls[0][1].enabled).toBe(false);
    });

    it("answers null and leaves the cache alone when the setting could not be written", async () => {
        upsertSetting.mockResolvedValue(false);

        expect(await saveApprovalGate({ enabled: true, reason: null, actor: { id: 1, name: "A" } })).toBeNull();
        expect(dropDashboardCache).not.toHaveBeenCalled();
    });
});
