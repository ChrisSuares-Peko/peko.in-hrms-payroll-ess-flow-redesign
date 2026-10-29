const esim = require("../../entities/esim");
const hike = require("../../entities/hike");
const softwares_subscriptions_plans = require("../../entities/softwares_subscriptions_plans");
const giftCards = require("../../entities/giftCards");
const { customLog } = require("../../../utils/loggerHelper");
const { updateEsimByPlanId } = require("../esim");
const { updateHike } = require("../hike");
const { update: updateSoftwarePlan } = require("../softwares_subscriptions_plans");
const { update: updateGiftCard } = require("../giftCards");

jest.mock("../../entities/esim", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../entities/hike", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../entities/softwares_subscriptions_plans", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../entities/giftCards", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../entities/subCorporateUsers", () => ({ hasOne: jest.fn(), belongsTo: jest.fn() }));
jest.mock("../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({ log: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() })),
}));

const COMMISSION_FIELDS = ["commissionMode", "commissionType", "commission", "fixedCommissionPerTransaction", "isCommissionInclGST"];

const STORED = {
    commissionMode: "MARGIN",
    commissionType: "PERCENTAGE",
    commission: "5.0000",
    fixedCommissionPerTransaction: "0.0000",
    isCommissionInclGST: 1,
};

const SAME = { commissionMode: "MARGIN", commissionType: "PERCENTAGE", commission: 5, fixedCommissionPerTransaction: 0, isCommissionInclGST: true };

const writers = [
    {
        name: "eSIM plans",
        model: esim,
        run: data => updateEsimByPlanId("plan_1", data),
        where: { planId: "plan_1" },
        table: "esimPlans",
        id: "plan_1",
        updateResult: [1, [{ planId: "plan_1" }]],
    },
    { name: "hikes", model: hike, run: data => updateHike(3, data), where: { id: 3 }, table: "hikes", id: 3, updateResult: [1] },
    {
        name: "software subscription plans",
        model: softwares_subscriptions_plans,
        run: data => updateSoftwarePlan({ id: 3 }, data),
        where: { id: 3 },
        table: "softwares_subscriptions_plans",
        id: 3,
        updateResult: [1],
    },
    { name: "gift cards", model: giftCards, run: data => updateGiftCard(3, data), where: { id: 3 }, table: "giftCards", id: 3, updateResult: [1] },
];

beforeEach(() => {
    jest.clearAllMocks();
    writers.forEach(({ model, updateResult }) => {
        model.findOne.mockResolvedValue(STORED);
        model.update.mockResolvedValue(updateResult);
    });
});

describe.each(writers)("$name admin edits", ({ model, run, where, table, id }) => {
    it("saves a status or vendor-field change without reading or touching the commission mark", async () => {
        await run({ status: false, name: "Starter" });

        expect(model.findOne).not.toHaveBeenCalledWith(expect.objectContaining({ attributes: COMMISSION_FIELDS }));
        expect(model.update.mock.calls[0][0]).toEqual({ status: false, name: "Starter" });
        expect(model.update.mock.calls[0][1]).toMatchObject({ where });
    });

    it("keeps the commission confirmed when the form re-sends the same values", async () => {
        await run({ ...SAME });

        expect(model.findOne).toHaveBeenCalledWith({ where, attributes: COMMISSION_FIELDS, raw: true });
        expect(model.update.mock.calls[0][0]).toEqual({ ...SAME });
        expect(customLog).not.toHaveBeenCalled();
    });

    it("puts the plan back under review when a commission value changed", async () => {
        await run({ ...SAME, commission: 7.5, isCommissionConfigured: true });

        expect(model.update.mock.calls[0][0]).toEqual({ ...SAME, commission: 7.5, isCommissionConfigured: false });
        expect(customLog).toHaveBeenCalledWith(null, "info", {
            message: "Commission re-entered review",
            table,
            id,
            fields: ["commission"],
        });
    });
});

describe("the gift card vendor sync", () => {
    it("refreshes vendor fields without disturbing the commission mark", async () => {
        const card = {
            serviceOperatorId: 9,
            product_id: "XO-1",
            product_name: "Amazon Pay",
            brand_name: "Amazon",
            priceType: "RANGE",
            min_price: 100,
            max_price: 10000,
            denominations: null,
            expiry: "365 days",
            isAccessible: true,
        };

        await updateGiftCard(3, card);

        expect(giftCards.findOne).not.toHaveBeenCalled();
        expect(giftCards.update.mock.calls[0][0]).toEqual(card);
    });
});
