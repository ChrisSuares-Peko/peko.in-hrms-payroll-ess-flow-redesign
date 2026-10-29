jest.mock("../../entities/setting", () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
}));
jest.mock("../../../services/GSTandTAXcalculation", () => ({
    calculateAmountWithTax: jest.fn(async amount => Number((Number(amount) * 1.18).toFixed(2))),
}));
jest.mock("../configAuditLog", () => ({ saveAuditEntries: jest.fn() }));

const sequelizeConfig = require("../../../configs/database/index");
const setting = require("../../entities/setting");
const { saveAuditEntries } = require("../configAuditLog");
const { bindRequestContext } = require("../../../utils/requestContext");
const { findAddOnsForService, updateAddOn, setAddOnCommissionConfigured, loadAddOnCounts } = require("../accountingAddOns");

const WHATSAPP = "whatsApp_for_busines";

const BOT_BUILDER_ROW = {
    id: 7,
    name: "flowBuilder",
    details: { amount: 120, commission: 0, commissionType: "PERCENTAGE", isCommissionInclGST: true, fixedCommissionPerTransaction: 0 },
};
const SHOPIFY_ROW = {
    id: 27,
    name: "shopifyIntegration",
    details: {
        amount: 120,
        commissionMode: "PRINCIPAL_MARKUP",
        commissionType: "PERCENTAGE",
        commission: 10,
        fixedCommissionPerTransaction: 0,
        isCommissionInclGST: false,
        isCommissionConfigured: true,
    },
};

const VALUES = {
    price: 150,
    commissionMode: "AGENT_MARKUP",
    commissionType: "FLAT",
    commission: 5,
    fixedCommissionPerTransaction: 2,
    isCommissionInclGST: true,
};

const inRequest = callback =>
    bindRequestContext(
        { headers: { "x-app-source": "accounting-portal", "x-client-ip": "203.0.113.7" }, user: { id: 9 } },
        {},
        callback
    );

beforeEach(() => {
    jest.clearAllMocks();
    saveAuditEntries.mockResolvedValue();
    sequelizeConfig.query.mockResolvedValue([{ serviceProvider: "WhatsApp for Business" }]);
});

describe("findAddOnsForService", () => {
    it("lists Bot Builder then Shopify Integration, shaped like plan rows", async () => {
        setting.findAll.mockResolvedValue([SHOPIFY_ROW, BOT_BUILDER_ROW]);

        const addOns = await findAddOnsForService(WHATSAPP);

        expect(setting.findAll).toHaveBeenCalledWith({ where: { name: ["flowBuilder", "shopifyIntegration"] }, raw: true });
        expect(addOns.map(addOn => [addOn.addOnType, addOn.planName, addOn.id])).toEqual([
            ["BOT_BUILDER", "Bot Builder", 7],
            ["SHOPIFY_INTEGRATION", "Shopify Integration", 27],
        ]);
    });

    it("shows an add-on with no commission mode yet as not configured, with no markup", async () => {
        setting.findAll.mockResolvedValue([BOT_BUILDER_ROW, SHOPIFY_ROW]);

        const [botBuilder] = await findAddOnsForService(WHATSAPP);

        expect(botBuilder).toMatchObject({
            monthlyPrice: 120,
            annualPrice: 1440,
            commissionMode: null,
            commissionType: "PERCENTAGE",
            isCommissionInclGST: true,
            commissionConfigured: false,
            splitCommission: null,
            priceMarkup: { monthlyPrice: 0, annualPrice: 0 },
        });
    });

    it("keeps the stored amount raw and returns what a markup commission adds on top of it", async () => {
        setting.findAll.mockResolvedValue([BOT_BUILDER_ROW, SHOPIFY_ROW]);

        const [, shopify] = await findAddOnsForService(WHATSAPP);

        // 10% of 120 = 12, plus 18% GST = 14.16 a month; the annual price is twelve months of it.
        expect(shopify).toMatchObject({
            monthlyPrice: 120,
            annualPrice: 1440,
            commissionMode: "PRINCIPAL_MARKUP",
            commissionConfigured: true,
            priceMarkup: { monthlyPrice: 14.16, annualPrice: 169.92 },
        });
    });

    it("reads details that come back as JSON text", async () => {
        setting.findAll.mockResolvedValue([{ ...BOT_BUILDER_ROW, details: JSON.stringify(BOT_BUILDER_ROW.details) }]);

        const [botBuilder] = await findAddOnsForService(WHATSAPP);

        expect(botBuilder.monthlyPrice).toBe(120);
    });

    it("still lists an add-on whose setting row does not exist, with no price", async () => {
        setting.findAll.mockResolvedValue([]);

        const addOns = await findAddOnsForService(WHATSAPP);

        expect(addOns).toHaveLength(2);
        expect(addOns[0]).toMatchObject({ id: 0, monthlyPrice: null, annualPrice: null, commissionMode: null });
    });

    it("returns null for a service with no add-ons", async () => {
        expect(await findAddOnsForService("flight")).toBeNull();
        expect(setting.findAll).not.toHaveBeenCalled();
    });
});

describe("updateAddOn", () => {
    it("saves the amount and commission fields and keeps the other keys of the setting", async () => {
        setting.findOne.mockResolvedValue({ id: 27, details: { ...SHOPIFY_ROW.details, note: "kept" } });

        const saved = await updateAddOn(WHATSAPP, "SHOPIFY_INTEGRATION", VALUES);

        expect(saved).toBe(true);
        expect(setting.findOne).toHaveBeenCalledWith({ where: { name: "shopifyIntegration" } });
        expect(setting.update).toHaveBeenCalledWith(
            {
                details: {
                    amount: 150,
                    commissionMode: "AGENT_MARKUP",
                    commissionType: "FLAT",
                    commission: 5,
                    fixedCommissionPerTransaction: 2,
                    isCommissionInclGST: true,
                    isCommissionConfigured: false,
                    note: "kept",
                },
            },
            { where: { id: 27 } }
        );
        expect(setting.create).not.toHaveBeenCalled();
    });

    it("creates the setting when the add-on has none yet", async () => {
        setting.findOne.mockResolvedValue(null);
        setting.create.mockResolvedValue({ id: 99 });

        expect(await updateAddOn(WHATSAPP, "BOT_BUILDER", VALUES)).toBe(true);

        expect(setting.create).toHaveBeenCalledWith({
            name: "flowBuilder",
            details: {
                amount: 150,
                commissionMode: "AGENT_MARKUP",
                commissionType: "FLAT",
                commission: 5,
                fixedCommissionPerTransaction: 2,
                isCommissionInclGST: true,
                isCommissionConfigured: false,
            },
        });
        expect(setting.update).not.toHaveBeenCalled();
    });

    it("keeps the commission confirmed when only the price changes", async () => {
        setting.findOne.mockResolvedValue({ id: 27, details: SHOPIFY_ROW.details });

        await updateAddOn(WHATSAPP, "SHOPIFY_INTEGRATION", {
            price: 150,
            commissionMode: "PRINCIPAL_MARKUP",
            commissionType: "PERCENTAGE",
            commission: 10,
            fixedCommissionPerTransaction: 0,
            isCommissionInclGST: false,
        });

        expect(setting.update.mock.calls[0][0].details).toMatchObject({ amount: 150, isCommissionConfigured: true });
    });

    it("saves nothing for an add-on the service does not have", async () => {
        expect(await updateAddOn(WHATSAPP, "UNKNOWN", VALUES)).toBe(false);
        expect(await updateAddOn("flight", "BOT_BUILDER", VALUES)).toBe(false);

        expect(setting.findOne).not.toHaveBeenCalled();
        expect(setting.update).not.toHaveBeenCalled();
        expect(setting.create).not.toHaveBeenCalled();
    });
});

describe("the audit trail of an add-on saved from the Accounting Portal", () => {
    it("records who changed which add-on, from what to what, with the price as its own entry", async () => {
        setting.findOne.mockResolvedValue({ id: 7, details: BOT_BUILDER_ROW.details });

        await inRequest(() => updateAddOn(WHATSAPP, "BOT_BUILDER", VALUES));

        const common = {
            actorId: 9,
            source: "ACCOUNTING_PORTAL",
            action: "UPDATE",
            targetTable: "settings",
            targetId: 7,
            targetLabel: "WhatsApp for Business › Bot Builder",
            partnerName: null,
            ipAddress: "203.0.113.7",
        };
        expect(saveAuditEntries).toHaveBeenCalledTimes(1);
        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            {
                ...common,
                configType: "PLAN_COMMISSION",
                changes: [
                    { field: "commissionMode", from: null, to: "AGENT_MARKUP" },
                    { field: "commissionType", from: "PERCENTAGE", to: "FLAT" },
                    { field: "commission", from: 0, to: 5 },
                    { field: "fixedCommissionPerTransaction", from: 0, to: 2 },
                ],
            },
            { ...common, configType: "PLAN_PRICE", changes: [{ field: "amount", from: 120, to: 150 }] },
        ]);
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ accessKey: WHATSAPP });
    });

    it("records only what changed", async () => {
        setting.findOne.mockResolvedValue({ id: 27, details: SHOPIFY_ROW.details });

        await inRequest(() => updateAddOn(WHATSAPP, "SHOPIFY_INTEGRATION", { ...VALUES, price: 120, commissionMode: "PRINCIPAL_MARKUP", commissionType: "PERCENTAGE", commission: 10, fixedCommissionPerTransaction: 0, isCommissionInclGST: true }));

        const entries = saveAuditEntries.mock.calls[0][0];
        expect(entries.map(entry => entry.configType)).toEqual(["PLAN_COMMISSION"]);
        expect(entries[0].changes).toEqual([
            { field: "isCommissionInclGST", from: false, to: true },
            { field: "isCommissionConfigured", from: true, to: false },
        ]);
    });

    it("records nothing when the add-on is saved as it was", async () => {
        setting.findOne.mockResolvedValue({ id: 27, details: SHOPIFY_ROW.details });

        await inRequest(() => updateAddOn(WHATSAPP, "SHOPIFY_INTEGRATION", { price: 120, commissionMode: "PRINCIPAL_MARKUP", commissionType: "PERCENTAGE", commission: 10, fixedCommissionPerTransaction: 0, isCommissionInclGST: false }));

        expect(saveAuditEntries).not.toHaveBeenCalled();
    });

    it("records a new setting under the new row's id, from nothing", async () => {
        setting.findOne.mockResolvedValue(null);
        setting.create.mockResolvedValue({ id: 99 });

        await inRequest(() => updateAddOn(WHATSAPP, "BOT_BUILDER", VALUES));

        const [commission, price] = saveAuditEntries.mock.calls[0][0];
        expect(commission).toMatchObject({ targetId: 99, targetLabel: "WhatsApp for Business › Bot Builder" });
        expect(price.changes).toEqual([{ field: "amount", from: null, to: 150 }]);
    });

    it("records nothing outside a request, and a failed audit save never fails the change", async () => {
        setting.findOne.mockResolvedValue({ id: 7, details: BOT_BUILDER_ROW.details });

        expect(await updateAddOn(WHATSAPP, "BOT_BUILDER", VALUES)).toBe(true);
        expect(saveAuditEntries).not.toHaveBeenCalled();

        saveAuditEntries.mockRejectedValue(new Error("audit down"));
        expect(await inRequest(() => updateAddOn(WHATSAPP, "BOT_BUILDER", VALUES))).toBe(true);
        expect(setting.update).toHaveBeenCalledTimes(2);
    });
});

describe("setAddOnCommissionConfigured", () => {
    const configuredFlagValue = () => setting.update.mock.calls[0][0].details.isCommissionConfigured;
    const unconfirmedShopify = () => {
        const details = { ...SHOPIFY_ROW.details };
        delete details.isCommissionConfigured;
        return details;
    };

    it("confirms an add-on whose commission is saved, and keeps the other keys", async () => {
        const unconfirmed = unconfirmedShopify();
        setting.findOne.mockResolvedValue({ id: 27, details: unconfirmed });

        expect(await setAddOnCommissionConfigured(WHATSAPP, "SHOPIFY_INTEGRATION", true)).toEqual({ ok: true });

        expect(setting.update).toHaveBeenCalledWith(
            { details: { ...unconfirmed, isCommissionConfigured: true } },
            { where: { id: 27 } }
        );
    });

    it("un-confirms an add-on", async () => {
        setting.findOne.mockResolvedValue({ id: 27, details: SHOPIFY_ROW.details });

        expect(await setAddOnCommissionConfigured(WHATSAPP, "SHOPIFY_INTEGRATION", false)).toEqual({ ok: true });

        expect(configuredFlagValue()).toBe(false);
    });

    it("will not confirm an add-on that has no commission yet", async () => {
        setting.findOne.mockResolvedValue({ id: 7, details: BOT_BUILDER_ROW.details });

        expect(await setAddOnCommissionConfigured(WHATSAPP, "BOT_BUILDER", true)).toEqual({ ok: false });

        expect(setting.update).not.toHaveBeenCalled();
    });

    it("will not confirm an add-on that has no setting yet, but can leave it unconfirmed", async () => {
        setting.findOne.mockResolvedValue(null);

        expect(await setAddOnCommissionConfigured(WHATSAPP, "BOT_BUILDER", true)).toEqual({ ok: false });
        expect(await setAddOnCommissionConfigured(WHATSAPP, "BOT_BUILDER", false)).toEqual({ ok: true });

        expect(setting.update).not.toHaveBeenCalled();
        expect(setting.create).not.toHaveBeenCalled();
    });

    it("returns null for an add-on the service does not have", async () => {
        expect(await setAddOnCommissionConfigured(WHATSAPP, "UNKNOWN", true)).toBeNull();
        expect(await setAddOnCommissionConfigured("flight", "BOT_BUILDER", true)).toBeNull();

        expect(setting.findOne).not.toHaveBeenCalled();
    });

    it("records the change in the audit trail as a plan commission entry", async () => {
        const unconfirmed = unconfirmedShopify();
        setting.findOne.mockResolvedValue({ id: 27, details: unconfirmed });

        await inRequest(() => setAddOnCommissionConfigured(WHATSAPP, "SHOPIFY_INTEGRATION", true));

        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            expect.objectContaining({
                configType: "PLAN_COMMISSION",
                targetId: 27,
                targetLabel: "WhatsApp for Business › Shopify Integration",
                changes: [{ field: "isCommissionConfigured", from: false, to: true }],
            }),
        ]);
    });
});

describe("loadAddOnCounts", () => {
    it("counts the add-ons whose commission is not confirmed, naming each", async () => {
        setting.findAll.mockResolvedValue([SHOPIFY_ROW, BOT_BUILDER_ROW]);

        const counts = await loadAddOnCounts([WHATSAPP, "flight", WHATSAPP]);

        expect([...counts.keys()]).toEqual([WHATSAPP]);
        expect(counts.get(WHATSAPP)).toEqual({ total: 2, notConfigured: [{ id: 7, name: "Bot Builder" }] });
        expect(setting.findAll).toHaveBeenCalledTimes(1);
    });

    it("counts an add-on with no setting row as not confirmed", async () => {
        setting.findAll.mockResolvedValue([SHOPIFY_ROW]);

        const { notConfigured } = (await loadAddOnCounts([WHATSAPP])).get(WHATSAPP);

        expect(notConfigured).toEqual([{ id: 0, name: "Bot Builder" }]);
    });

    it("reads nothing for services without add-ons", async () => {
        expect((await loadAddOnCounts(["flight"])).size).toBe(0);
        expect(setting.findAll).not.toHaveBeenCalled();
    });
});
