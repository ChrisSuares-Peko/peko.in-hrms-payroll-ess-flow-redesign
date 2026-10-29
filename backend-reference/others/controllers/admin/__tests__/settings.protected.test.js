const { customLog } = require("../../../utils/loggerHelper");
const { createSetting: createSettingRow, updateSettingById } = require("../../../models/use-cases/setting");
const { PROTECTED_SETTING_MESSAGE } = require("../../../utils/protectedSettings");
const { createSetting, updateSetting } = require("../settings");

jest.mock("../../../models/use-cases/setting", () => ({
    findAllSettings: jest.fn(),
    createSetting: jest.fn(),
    updateSettingById: jest.fn(),
}));

const run = async (handler, req) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await handler({ user: { id: 7 }, LogTraceId: "trace", ...req }, res, next);
    return { res, next };
};

beforeEach(() => jest.clearAllMocks());

describe("the Settings Manager and the accounting settings", () => {
    it("answers 403 when a protected setting would be created", async () => {
        createSettingRow.mockResolvedValue({ protected: true });

        const { next, res } = await run(createSetting, { body: { name: "servicesTypeConfig", details: {} } });

        expect(next.mock.calls[0][0].status_code).toBe(403);
        expect(next.mock.calls[0][0].message).toBe(PROTECTED_SETTING_MESSAGE);
        expect(res.json).not.toHaveBeenCalled();
        expect(customLog).toHaveBeenCalledWith("trace", "error", {
            message: "Protected setting write refused",
            name: "servicesTypeConfig",
            by: 7,
        });
    });

    it("answers 403 when a protected row would be changed", async () => {
        updateSettingById.mockResolvedValue({ protected: true });

        const { next } = await run(updateSetting, { params: { id: "3" }, body: { name: "gateCopy", details: { enabled: false } } });

        expect(updateSettingById).toHaveBeenCalledWith(3, { name: "gateCopy", details: { enabled: false } });
        expect(next.mock.calls[0][0].status_code).toBe(403);
        expect(next.mock.calls[0][0].message).toBe(PROTECTED_SETTING_MESSAGE);
    });

    it("still saves an ordinary setting", async () => {
        updateSettingById.mockResolvedValue({ row: { id: 4, name: "theme", details: { dark: true } }, previousName: "theme" });

        const { res } = await run(updateSetting, { params: { id: "4" }, body: { name: "theme", details: { dark: true } } });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0].data).toEqual({ id: 4, name: "theme", details: { dark: true } });
    });
});
