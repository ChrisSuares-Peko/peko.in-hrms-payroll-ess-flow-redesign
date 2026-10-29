const Setting = require("../../../entities/setting");
const { createSetting, updateSettingById } = require("../../setting");
const { PROTECTED_SETTING_NAMES } = require("../../../../utils/protectedSettings");

jest.mock("../../../entities/setting", () => ({ findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

describe("the generic settings manager and the accounting settings", () => {
    it("protects the two settings the gate depends on", () => {
        expect(PROTECTED_SETTING_NAMES).toEqual(["servicesTypeConfig", "serviceApprovalGate"]);
    });

    it("refuses to create a protected setting", async () => {
        expect(await createSetting({ name: "servicesTypeConfig", details: {} })).toEqual({ protected: true });
        expect(Setting.findOne).not.toHaveBeenCalled();
        expect(Setting.create).not.toHaveBeenCalled();
    });

    it("still creates any other setting", async () => {
        Setting.findOne.mockResolvedValue(null);
        Setting.create.mockResolvedValue({ id: 5, name: "theme", details: "dark" });

        expect(await createSetting({ name: "theme", details: "dark" })).toEqual({
            row: { id: 5, name: "theme", details: "dark" },
        });
    });

    it("refuses to overwrite a protected row, even under a new name", async () => {
        const row = { id: 3, name: "serviceApprovalGate", details: { enabled: true }, save: jest.fn() };
        Setting.findByPk.mockResolvedValue(row);

        expect(await updateSettingById(3, { name: "gateCopy", details: { enabled: false } })).toEqual({ protected: true });
        expect(row.save).not.toHaveBeenCalled();
    });

    it("refuses to rename another row onto a protected name", async () => {
        const row = { id: 4, name: "theme", details: "x", save: jest.fn() };
        Setting.findByPk.mockResolvedValue(row);

        expect(await updateSettingById(4, { name: "servicesTypeConfig", details: {} })).toEqual({ protected: true });
        expect(row.save).not.toHaveBeenCalled();
    });

    it("reports a missing row before anything else", async () => {
        Setting.findByPk.mockResolvedValue(null);

        expect(await updateSettingById(9, { name: "servicesTypeConfig", details: {} })).toEqual({ notFound: true });
    });
});
