const DomainHostingPlans = require("../../entities/domainHostingPlans");
const businessRegistrationCatalog = require("../../entities/businessRegistrationCatalog");
const work_plans = require("../../entities/works_plan");
const plans = require("../../entities/plans");
const { customLog } = require("../../../utils/loggerHelper");
const { update: updateDomainHostingPlan } = require("../domainHostingPlans");
const { update: updateCatalogItem } = require("../businessRegistrationCatalog");
const { update: updateWorkPlan } = require("../works_plan");
const { updatePlan } = require("../plans");

jest.mock("../../entities/domainHostingPlans", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../entities/businessRegistrationCatalog", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../entities/works_plan", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../entities/plans", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));

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
        name: "domain and hosting plans",
        model: DomainHostingPlans,
        run: data => updateDomainHostingPlan(3, data),
        where: { id: 3 },
        table: "domainHostingPlans",
    },
    {
        name: "business registration catalogue",
        model: businessRegistrationCatalog,
        run: data => updateCatalogItem(3, data),
        where: { id: 3 },
        table: "businessRegistrationCatalogs",
    },
    { name: "work plans", model: work_plans, run: data => updateWorkPlan(data, { id: 3 }), where: { id: 3 }, table: "work_plans" },
    { name: "workspace plans", model: plans, run: data => updatePlan({ id: 3 }, data), where: { id: 3 }, table: "plans" },
];

beforeEach(() => {
    jest.clearAllMocks();
    writers.forEach(({ model }) => {
        model.findOne.mockResolvedValue(STORED);
        model.update.mockResolvedValue([1]);
    });
});

describe.each(writers)("$name admin edits", ({ model, run, where, table }) => {
    it("saves a status or vendor-field change without reading or touching the commission mark", async () => {
        await run({ status: false, planName: "Starter" });

        expect(model.findOne).not.toHaveBeenCalled();
        expect(model.update).toHaveBeenCalledWith({ status: false, planName: "Starter" }, { where });
    });

    it("keeps the commission confirmed when the form re-sends the same values", async () => {
        await run({ ...SAME, status: true });

        expect(model.findOne).toHaveBeenCalledWith({ where, attributes: COMMISSION_FIELDS, raw: true });
        expect(model.update).toHaveBeenCalledWith({ ...SAME, status: true }, { where });
        expect(customLog).not.toHaveBeenCalled();
    });

    it("puts the plan back under review when a commission value changed", async () => {
        await run({ ...SAME, commission: 7.5, isCommissionConfigured: true });

        expect(model.update).toHaveBeenCalledWith({ ...SAME, commission: 7.5, isCommissionConfigured: false }, { where });
        expect(customLog).toHaveBeenCalledWith(null, "info", {
            message: "Commission re-entered review",
            table,
            id: 3,
            fields: ["commission"],
        });
    });
});

describe("the IndiaFilings catalogue sync", () => {
    it("refreshes vendor fields without disturbing the commission mark", async () => {
        const vendorFields = {
            vendorCatalogId: "77",
            serviceId: 4,
            serviceName: "Private Limited Company",
            variantName: "Standard",
            description: "x",
            marketPrice: 9999,
            vendorPrice: 8999,
            governmentFeeAmount: 1000,
            unit: "per company",
            currency: "INR",
            about: null,
            vendorData: { id: 77 },
            status: true,
        };

        await updateCatalogItem(3, vendorFields);

        expect(businessRegistrationCatalog.findOne).not.toHaveBeenCalled();
        expect(businessRegistrationCatalog.update).toHaveBeenCalledWith(vendorFields, { where: { id: 3 } });
    });
});
