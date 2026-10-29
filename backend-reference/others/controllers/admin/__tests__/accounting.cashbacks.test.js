const cashbacks = require("../../../models/use-cases/cashback");
const { createAccountingCashback, updateAccountingCashback } = require("../accounting");

jest.mock("../../../models/use-cases/accountingServices", () => ({
    getServicesTypeConfig: jest.fn(),
    findPlanTypeForAccessKey: jest.fn(),
    serializeService: jest.fn(),
    listServicesByPlanType: jest.fn(),
    findServiceByAccessKey: jest.fn(),
    updateServiceCommission: jest.fn(),
    updateVendorRecord: jest.fn(),
    setServiceCommissionConfigured: jest.fn(),
}));
jest.mock("../../../models/use-cases/serviceClassification", () => ({ applyServicesTypeConfig: jest.fn() }));
jest.mock("../../../models/use-cases/serviceConfiguration", () => ({ withConfiguration: jest.fn() }));
jest.mock("../../../models/use-cases/accountingPlans", () => ({
    getPlanEntityConfig: jest.fn(),
    findPlansForService: jest.fn(),
    countPlansForService: jest.fn(),
    updatePlanCommission: jest.fn(),
    updatePlanCommissionBulk: jest.fn(),
    setPlanCommissionConfigured: jest.fn(),
}));
jest.mock("../../../models/use-cases/cashback", () => ({
    bulkUpdate: jest.fn(),
    setSurchargeConfigured: jest.fn(),
    createConfigured: jest.fn(),
    updateConfigured: jest.fn(),
    findByPackageAndOperator: jest.fn(),
}));

const FEE = { packageId: "4", serviceOperatorId: "9", cashbackType: "FLAT", cashback: 0, surchargeType: "FLAT", surcharge: 12 };

const run = async (handler, req) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    cashbacks.findByPackageAndOperator.mockResolvedValue(null);
    cashbacks.createConfigured.mockResolvedValue({ id: 31, ...FEE, isSurchargeConfigured: true });
    cashbacks.updateConfigured.mockResolvedValue([1]);
});

describe("the portal's platform fee writes", () => {
    it("creates the fee as confirmed", async () => {
        const { res } = await run(createAccountingCashback, { body: FEE });

        expect(cashbacks.findByPackageAndOperator).toHaveBeenCalledWith(FEE);
        expect(cashbacks.createConfigured).toHaveBeenCalledWith(FEE);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toEqual({
            status: true,
            data: { id: 31, ...FEE, isSurchargeConfigured: true },
            message: "Cashback added successfully",
            responseCode: "000",
        });
    });

    it("refuses a second fee for the same package and service", async () => {
        cashbacks.findByPackageAndOperator.mockResolvedValue({ id: 30 });

        const { next } = await run(createAccountingCashback, { body: FEE });

        expect(next.mock.calls[0][0].status_code).toBe(403);
        expect(cashbacks.createConfigured).not.toHaveBeenCalled();
    });

    it("saves an edit as confirmed", async () => {
        cashbacks.findByPackageAndOperator.mockResolvedValue({ id: 31 });

        const { res } = await run(updateAccountingCashback, { params: { id: "31" }, body: FEE });

        expect(cashbacks.updateConfigured).toHaveBeenCalledWith({ id: "31" }, FEE);
        expect(res.json.mock.calls[0][0]).toEqual({
            status: true,
            data: {},
            message: "Cashback updated successfully",
            responseCode: "000",
        });
    });

    it("refuses an edit that would collide with another row", async () => {
        cashbacks.findByPackageAndOperator.mockResolvedValue({ id: 30 });

        const { next } = await run(updateAccountingCashback, { params: { id: "31" }, body: FEE });

        expect(next.mock.calls[0][0].status_code).toBe(403);
        expect(cashbacks.updateConfigured).not.toHaveBeenCalled();
    });

    it("reports a write that did nothing", async () => {
        cashbacks.updateConfigured.mockResolvedValue(null);

        const { next } = await run(updateAccountingCashback, { params: { id: "31" }, body: FEE });

        expect(next.mock.calls[0][0].status_code).toBe(500);
    });
});
