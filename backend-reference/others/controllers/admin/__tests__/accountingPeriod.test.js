const useCase = require("../../../models/use-cases/accountingPeriod");
const { getAccountingGoLiveDate, updateAccountingGoLiveDate } = require("../accountingPeriod");

jest.mock("../../../models/use-cases/accountingPeriod", () => ({
    getGoLiveSettings: jest.fn(),
    saveGoLiveDate: jest.fn(),
    dayOf: jest.requireActual("../../../models/use-cases/accountingPeriod").dayOf,
}));

const run = async (handler, req) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const dataOf = res => res.json.mock.calls[0][0].data;

const USER = { id: 42, name: "Ibrahim" };

beforeEach(() => {
    jest.clearAllMocks();
});

describe("reading the go live date", () => {
    it("hands back the unconfigured state rather than an empty body", async () => {
        useCase.getGoLiveSettings.mockResolvedValue({ date: null, configured: false });

        const { res } = await run(getAccountingGoLiveDate, { query: {}, user: USER });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(dataOf(res)).toEqual({ date: null, configured: false });
    });
});

describe("setting the go live date", () => {
    it("saves it with the acting user and reads the stored row back", async () => {
        useCase.saveGoLiveDate.mockResolvedValue({ date: "2026-09-01" });
        useCase.getGoLiveSettings.mockResolvedValue({
            date: "2026-09-01",
            configured: true,
            setByName: "Ibrahim",
        });

        const { res } = await run(updateAccountingGoLiveDate, {
            body: { date: "2026-09-01", reason: "portal go live" },
            user: USER,
        });

        expect(useCase.saveGoLiveDate).toHaveBeenCalledWith({
            date: "2026-09-01",
            reason: "portal go live",
            actor: { id: 42, name: "Ibrahim" },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(dataOf(res).configured).toBe(true);
    });

    it("refuses a date in the future, which would floor the whole portal to nothing", async () => {
        const { next } = await run(updateAccountingGoLiveDate, {
            body: { date: "2099-01-01", reason: null },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(400);
        expect(useCase.saveGoLiveDate).not.toHaveBeenCalled();
    });

    it("answers 500 when the setting could not be written", async () => {
        useCase.saveGoLiveDate.mockResolvedValue(null);

        const { next } = await run(updateAccountingGoLiveDate, {
            body: { date: "2026-09-01", reason: null },
            user: USER,
        });

        expect(next.mock.calls[0][0].status_code).toBe(500);
    });
});
