const sequelizeConfig = require("../../../configs/database/index");
const setting = require("../../entities/setting");
const { GATE_SETTING, CONFIG_SETTING, gatePermissionDetails, gatedPartnerServices } = require("../serviceApproval");

const CONFIG = { service_with_plans: ["esim_tunz"], service_without_plans: ["bbps_utility_water"] };

const tree = () => [
    { label: "Dashboard", hasAccess: true, subServices: [] },
    {
        label: "Utility Payments",
        hasAccess: true,
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true },
            { label: "Water Bill", accessKey: "bbps_utility_water", hasAccess: true },
        ],
    },
    { label: "eSIM", accessKey: "esim_tunz", hasAccess: true, alias: "Travel SIM", enableMoreService: true },
];

const settings = ({ gate = { enabled: true }, config = CONFIG } = {}) =>
    setting.findOne.mockImplementation(({ where }) => {
        if (where.name === GATE_SETTING) return Promise.resolve({ details: gate });
        if (where.name === CONFIG_SETTING) return Promise.resolve({ details: config });
        return Promise.resolve(null);
    });

const leaf = (nodes, label) => {
    const found = [];
    const walk = list => (list || []).forEach(node => {
        if (node.label === label) found.push(node);
        walk(node.subServices);
    });
    walk(nodes);
    return found[0];
};

beforeEach(() => {
    jest.clearAllMocks();
    settings();
    sequelizeConfig.query.mockResolvedValue([{ approvals: [{ accessKey: "esim_tunz", status: "APPROVED" }] }]);
});

describe("gatePermissionDetails", () => {
    it("hands back a gated copy of the tree and leaves the stored row untouched", async () => {
        const details = { id: 12, permissions: tree() };

        const gated = await gatePermissionDetails(details);

        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ partnerPermissionId: 12 });
        expect(gated).not.toBe(details);
        expect(leaf(gated.permissions, "Water Bill").hasAccess).toBe(false);
        expect(leaf(gated.permissions, "Electricity Bill").hasAccess).toBe(true);
        expect(leaf(gated.permissions, "eSIM")).toMatchObject({ hasAccess: true, alias: "Travel SIM", enableMoreService: true });
        expect(leaf(details.permissions, "Water Bill").hasAccess).toBe(true);
    });

    it("returns the row itself while the gate is off", async () => {
        settings({ gate: { enabled: false } });
        const details = { id: 12, permissions: tree() };

        expect(await gatePermissionDetails(details)).toBe(details);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });

    it("returns the row itself when the approvals cannot be read", async () => {
        sequelizeConfig.query.mockRejectedValue(new Error("db down"));
        const details = { id: 12, permissions: tree() };

        expect(await gatePermissionDetails(details)).toBe(details);
    });

    it("passes through anything that is not a tree", async () => {
        expect(await gatePermissionDetails(null)).toBeNull();
        expect(await gatePermissionDetails({ id: 12, permissions: null })).toEqual({ id: 12, permissions: null });
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});

describe("gatedPartnerServices", () => {
    it("gives the session the gated tree, nothing for a partnerless login, and null for an empty row", async () => {
        const services = await gatedPartnerServices({ id: 12, permissions: tree() });

        expect(leaf(services, "Water Bill").hasAccess).toBe(false);
        expect(await gatedPartnerServices(undefined)).toBeUndefined();
        expect(await gatedPartnerServices({ id: 12, permissions: null })).toBeNull();
    });
});
