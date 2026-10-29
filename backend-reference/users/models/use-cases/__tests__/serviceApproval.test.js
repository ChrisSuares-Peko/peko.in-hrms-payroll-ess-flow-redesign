const sequelizeConfig = require("../../../configs/database/index");
const setting = require("../../entities/setting");
const { customLog } = require("../../../utils/loggerHelper");
const {
    GATE_SETTING,
    CONFIG_SETTING,
    APPROVALS_SQL,
    isApprovalGateEnabled,
    loadListedAccessKeys,
    loadApprovedAccessKeys,
    loadApprovalGate,
} = require("../serviceApproval");

const APPROVALS = [
    { accessKey: "esim_tunz", status: "APPROVED", decidedByName: "system" },
    { accessKey: "visa", status: "REJECTED", decidedByName: "Ibrahim" },
    { accessKey: "corporate_card", status: "APPROVED", decidedByName: "Ibrahim" },
    { status: "APPROVED" },
    null,
];

const CONFIG = { service_with_plans: ["esim_tunz", " visa "], service_without_plans: ["visa", "corporate_card", "forex_desk", ""] };

const settings = ({ gate = { enabled: true }, config = CONFIG } = {}) =>
    setting.findOne.mockImplementation(({ where }) => {
        if (where.name === GATE_SETTING) return Promise.resolve(gate === null ? null : { details: gate });
        if (where.name === CONFIG_SETTING) return Promise.resolve(config === null ? null : { details: config });
        return Promise.resolve(null);
    });

beforeEach(() => {
    jest.clearAllMocks();
    settings();
    sequelizeConfig.query.mockResolvedValue([{ approvals: APPROVALS }]);
});

describe("isApprovalGateEnabled", () => {
    it("reads the gate as on when the row is missing or silent, and off only for an explicit false", async () => {
        settings({ gate: null });
        expect(await isApprovalGateEnabled()).toBe(true);

        settings({ gate: { reason: "x" } });
        expect(await isApprovalGateEnabled()).toBe(true);

        settings({ gate: { enabled: false } });
        expect(await isApprovalGateEnabled()).toBe(false);

        settings({ gate: JSON.stringify({ enabled: false }) });
        expect(await isApprovalGateEnabled()).toBe(false);

        expect(setting.findOne.mock.calls[0][0]).toEqual({ where: { name: GATE_SETTING }, attributes: ["details"], raw: true });
    });
});

describe("loadListedAccessKeys", () => {
    it("unions both arrays of the classification setting, trimmed and without blanks", async () => {
        expect(await loadListedAccessKeys()).toEqual(new Set(["esim_tunz", "visa", "corporate_card", "forex_desk"]));
        expect(setting.findOne).toHaveBeenCalledWith({ where: { name: CONFIG_SETTING }, attributes: ["details"], raw: true });
    });

    it("parses a stored JSON string and answers an empty set for a missing or malformed setting", async () => {
        settings({ config: JSON.stringify({ service_with_plans: ["esim_tunz"] }) });
        expect(await loadListedAccessKeys()).toEqual(new Set(["esim_tunz"]));

        settings({ config: null });
        expect(await loadListedAccessKeys()).toEqual(new Set());

        settings({ config: { service_with_plans: "esim_tunz" } });
        expect(await loadListedAccessKeys()).toEqual(new Set());
    });
});

describe("loadApprovedAccessKeys", () => {
    it("reads the tree's approvals JSON with a plain query, never a model, and keeps the approved keys only", async () => {
        const keys = await loadApprovedAccessKeys(12);

        expect(keys).toEqual(new Set(["esim_tunz", "corporate_card"]));
        expect(APPROVALS_SQL).toBe("SELECT approvals FROM serviceApprovals WHERE partnerPermissionId = :partnerPermissionId LIMIT 1");
        expect(sequelizeConfig.query).toHaveBeenCalledWith(APPROVALS_SQL, {
            type: "SELECT",
            replacements: { partnerPermissionId: 12 },
        });
    });

    it("parses a stored JSON string and answers an empty set for a missing or unreadable row", async () => {
        sequelizeConfig.query.mockResolvedValue([{ approvals: JSON.stringify(APPROVALS) }]);
        expect(await loadApprovedAccessKeys(12)).toEqual(new Set(["esim_tunz", "corporate_card"]));

        sequelizeConfig.query.mockResolvedValue([]);
        expect(await loadApprovedAccessKeys(12)).toEqual(new Set());

        sequelizeConfig.query.mockResolvedValue([{ approvals: "garbage" }]);
        expect(await loadApprovedAccessKeys(12)).toEqual(new Set());
    });
});

describe("loadApprovalGate", () => {
    it("hands back the listed keys that are not approved for the tree while the gate is on", async () => {
        expect(await loadApprovalGate(12)).toEqual(new Set(["visa", "forex_desk"]));
    });

    it("blocks nothing when the classification setting lists nothing, even with no approvals", async () => {
        settings({ config: null });
        sequelizeConfig.query.mockResolvedValue([]);

        expect(await loadApprovalGate(12)).toEqual(new Set());
    });

    it("blocks every listed key for a tree without approvals", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        expect(await loadApprovalGate(12)).toEqual(new Set(["esim_tunz", "visa", "corporate_card", "forex_desk"]));
    });

    it("answers null without reading approvals while the gate is off, or when there is no tree id", async () => {
        settings({ gate: { enabled: false } });
        expect(await loadApprovalGate(12)).toBeNull();
        expect(sequelizeConfig.query).not.toHaveBeenCalled();

        expect(await loadApprovalGate(undefined)).toBeNull();
    });

    it("fails open and logs when the approvals cannot be read", async () => {
        sequelizeConfig.query.mockRejectedValue(new Error("Table 'serviceApprovals' doesn't exist"));

        expect(await loadApprovalGate(12)).toBeNull();
        expect(customLog).toHaveBeenCalledWith(
            null,
            "error",
            expect.objectContaining({
                message: "Service approval gate unavailable, serving ungated services",
                partnerPermissionId: 12,
                error: "Table 'serviceApprovals' doesn't exist",
            })
        );
    });

    it("fails open when even the setting cannot be read", async () => {
        setting.findOne.mockRejectedValue(new Error("db down"));

        expect(await loadApprovalGate(12)).toBeNull();
        expect(customLog).toHaveBeenCalledTimes(1);
    });
});
