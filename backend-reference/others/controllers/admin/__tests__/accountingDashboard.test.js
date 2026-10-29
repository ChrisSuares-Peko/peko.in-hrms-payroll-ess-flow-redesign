const useCase = require("../../../models/use-cases/accountingDashboard");
const { getAccountingDashboard } = require("../accountingDashboard");

jest.mock("../../../models/use-cases/accountingDashboard", () => ({
    getAccountingDashboard: jest.fn(),
}));

const run = async query => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await getAccountingDashboard({ query }, res, next);
    return { res, next };
};

const PAYLOAD = {
    generatedAt: "2026-09-16T08:00:00.000Z",
    cached: true,
    sections: { today: {}, monthly: {} },
    alerts: [],
};

describe("accounting dashboard controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCase.getAccountingDashboard.mockResolvedValue(PAYLOAD);
    });

    it("returns the dashboard payload in the standard envelope", async () => {
        const { res } = await run({ refresh: false });

        expect(useCase.getAccountingDashboard).toHaveBeenCalledWith({ refresh: false });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: true,
            data: PAYLOAD,
            message: "Accounting dashboard fetched successfully",
            responseCode: "000",
        });
    });

    it("passes the refresh flag through", async () => {
        await run({ refresh: true });

        expect(useCase.getAccountingDashboard).toHaveBeenCalledWith({ refresh: true });
    });

    it("forwards failures to the error handler", async () => {
        const error = new Error("connection lost");
        useCase.getAccountingDashboard.mockRejectedValue(error);

        const { res, next } = await run({ refresh: false });

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
