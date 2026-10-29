jest.mock("../configAuditLog", () => ({ saveAuditEntries: jest.fn() }));

const sequelizeConfig = require("../../../configs/database/index");
const { saveAuditEntries } = require("../configAuditLog");
const { bindRequestContext } = require("../../../utils/requestContext");
const { updatePlanCommission, updatePlanCommissionBulk, setPlanCommissionConfigured } = require("../accountingPlans");

const planRow = (id, overrides = {}) => ({
    id,
    commissionMode: "MARGIN",
    commissionType: "PERCENTAGE",
    commission: "1.0000",
    fixedCommissionPerTransaction: "0.0000",
    isCommissionInclGST: 1,
    isCommissionConfigured: 0,
    ...overrides,
});

const DATA = {
    commissionMode: "MARGIN",
    commissionType: "PERCENTAGE",
    commission: 2.5,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: true,
};

const inRequest = callback =>
    bindRequestContext(
        { headers: { "x-app-source": "accounting-portal", "x-client-ip": "203.0.113.7" }, user: { id: 9 } },
        {},
        callback
    );

const verbs = () => sequelizeConfig.query.mock.calls.map(([sql]) => sql.trim().split(" ")[0]);

// Answers each statement by its first word: the reads come back in the order given.
const answer = ({ reads = [], names = [] }) => {
    const queue = [...reads];
    sequelizeConfig.query.mockImplementation(async (sql, options) => {
        if (/^\s*UPDATE/i.test(sql)) return [0];
        if (options.replacements && options.replacements.accessKey !== undefined) return names;
        return queue.shift();
    });
};

beforeEach(() => {
    jest.clearAllMocks();
    saveAuditEntries.mockResolvedValue();
});

describe("a plan commission saved from the Accounting Portal", () => {
    it("records who changed which plan, from what to what", async () => {
        answer({
            reads: [[planRow(5)], [planRow(5, { commission: "2.5000", isCommissionConfigured: 1 })]],
            names: [{ id: 5, name: "Basic", parent: "eSIM Tunz" }],
        });

        await inRequest(() => updatePlanCommission("esim_tunz", 5, DATA));

        expect(verbs()).toEqual(["SELECT", "UPDATE", "SELECT", "SELECT"]);
        expect(saveAuditEntries).toHaveBeenCalledTimes(1);
        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            {
                actorId: 9,
                source: "ACCOUNTING_PORTAL",
                configType: "PLAN_COMMISSION",
                action: "UPDATE",
                targetTable: "esimPlans",
                targetId: 5,
                targetLabel: "eSIM Tunz › Basic",
                partnerName: null,
                ipAddress: "203.0.113.7",
                changes: [
                    { field: "commission", from: 1, to: 2.5 },
                    { field: "isCommissionConfigured", from: false, to: true },
                ],
            },
        ]);
    });

    it("records a plan price changed in the same save, as its own entry with the old and new amount", async () => {
        answer({
            reads: [
                [planRow(5, { price: "260.00" })],
                [planRow(5, { price: "300.00", commission: "2.5000", isCommissionConfigured: 1 })],
            ],
            names: [{ id: 5, name: "Roshan", parent: "Works", partner: "Peko (Default)" }],
        });

        await inRequest(() => updatePlanCommission("peko_works", 5, { ...DATA, price: 300 }));

        expect(verbs()).toEqual(["SELECT", "UPDATE", "SELECT", "SELECT"]);
        const entries = saveAuditEntries.mock.calls[0][0];
        expect(entries.map(entry => entry.configType)).toEqual(["PLAN_COMMISSION", "PLAN_PRICE"]);
        expect(entries[1]).toMatchObject({
            targetTable: "work_plans",
            targetLabel: "Works › Roshan",
            changes: [{ field: "price", from: 260, to: 300 }],
        });
    });

    it("records a WhatsApp package price change, with the old and new prices", async () => {
        const packageRow = (prices) => ({
            ...planRow(5),
            planCommissions: null,
            packagePrices: prices,
            discount: { monthly: 0, annually: 0 },
            status: 1,
        });
        answer({
            reads: [
                [packageRow({ monthly: 899, annually: 10788 })],
                [{ ...packageRow({ monthly: 999, annually: 10788 }), commission: "2.5000", isCommissionConfigured: 1 }],
            ],
            names: [{ id: 5, name: "WhatsApp Basic", parent: null, partner: "Cent Saarthi" }],
        });

        await inRequest(() =>
            updatePlanCommission("whatsApp_for_busines", 5, { ...DATA, price: 999, annualPrice: 10788, discount: 0, annualDiscount: 0 })
        );

        const entries = saveAuditEntries.mock.calls[0][0];
        expect(entries.map((entry) => entry.configType)).toEqual(["PLAN_COMMISSION", "SUBSCRIPTION_PRICING"]);
        expect(entries[1].changes).toEqual([
            { field: "packagePrices", from: { monthly: 899, annually: 10788 }, to: { monthly: 999, annually: 10788 } },
        ]);
    });

    it("records nothing for the price when it was saved unchanged", async () => {
        answer({
            reads: [
                [planRow(5, { price: "260.00" })],
                [planRow(5, { price: "260.00", commission: "2.5000", isCommissionConfigured: 1 })],
            ],
            names: [{ id: 5, name: "Roshan", parent: "Works" }],
        });

        await inRequest(() => updatePlanCommission("peko_works", 5, { ...DATA, price: 260 }));

        expect(saveAuditEntries.mock.calls[0][0].map(entry => entry.configType)).toEqual(["PLAN_COMMISSION"]);
    });

    it("records each plan of a bulk save that changed", async () => {
        answer({
            reads: [
                [planRow(1), planRow(2)],
                [planRow(1, { commission: "2.5000", isCommissionConfigured: 1 }), planRow(2, { commission: "2.5000", isCommissionConfigured: 1 })],
            ],
            names: [
                { id: 1, name: "Basic", parent: "Works" },
                { id: 2, name: "Plus", parent: "Works" },
            ],
        });

        await inRequest(() => updatePlanCommissionBulk("peko_works", [1, 2], DATA));

        const entries = saveAuditEntries.mock.calls[0][0];
        expect(entries.map(entry => entry.targetId)).toEqual([1, 2]);
        expect(entries.every(entry => entry.targetTable === "work_plans")).toBe(true);
    });

    it("records the configured tick being switched on and off", async () => {
        answer({
            reads: [[planRow(5)], [planRow(5, { isCommissionConfigured: 1 })]],
            names: [{ id: 5, name: "Basic", parent: null }],
        });
        sequelizeConfig.query.mockImplementationOnce(async () => [
            { commissionMode: "MARGIN", commissionType: "PERCENTAGE", commission: "1.0000", fixedCommissionPerTransaction: "0" },
        ]);

        await inRequest(() => setPlanCommissionConfigured("esim_tunz", 5, true));

        expect(saveAuditEntries.mock.calls[0][0][0].changes).toEqual([
            { field: "isCommissionConfigured", from: false, to: true },
        ]);
    });
});

describe("outside a request", () => {
    it("writes the plan exactly as before, with no extra read and no entry", async () => {
        sequelizeConfig.query.mockResolvedValue([0]);

        await updatePlanCommission("esim_tunz", 5, DATA);
        await updatePlanCommissionBulk("esim_tunz", [5, 6], DATA);

        expect(verbs()).toEqual(["UPDATE", "UPDATE"]);
        expect(saveAuditEntries).not.toHaveBeenCalled();
    });
});

describe("an unknown service", () => {
    it("is not written and not recorded", async () => {
        await expect(inRequest(() => updatePlanCommission("nope", 5, DATA))).resolves.toBeNull();

        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});
