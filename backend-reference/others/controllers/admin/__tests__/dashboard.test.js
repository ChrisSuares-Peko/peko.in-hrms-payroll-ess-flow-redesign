const sequelizeConfig = require("../../../configs/database/index");
const credentials = require("../../../models/entities/credential");
const vendors = require("../../../models/entities/vendor");
const signupRequests = require("../../../models/entities/signUp");
const corporateUser = require("../../../models/entities/corporateUser");
const { getCommissionTotal, getCommissionByDay } = require("../../../models/use-cases/dashboardCommission");
const { findAllDetails } = require("../dashboard");

jest.mock("../../../models/use-cases/dashboardCommission", () => {
    const actual = jest.requireActual("../../../models/use-cases/dashboardCommission");
    return { ...actual, getCommissionTotal: jest.fn(), getCommissionByDay: jest.fn() };
});

const istDay = (daysAgo = 0) => {
    const shifted = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - daysAgo * 24 * 60 * 60 * 1000);
    return shifted.toISOString().slice(0, 10);
};

const run = query =>
    new Promise(resolve => {
        const res = {};
        res.status = jest.fn(() => res);
        res.json = jest.fn(body => resolve({ res, body }));
        findAllDetails({ query }, res, jest.fn());
    });

const queriesWith = text => sequelizeConfig.query.mock.calls.filter(([sql]) => sql.includes(text));

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.query.mockImplementation(sql => {
        if (sql.includes("GROUP BY Date(transactionDate)") && sql.includes("FROM reportAll")) {
            return Promise.resolve([{ Date: istDay(1), count: 3, revenue: "900.00" }]);
        }
        if (sql.includes("GROUP BY Date(")) return Promise.resolve([]);
        return Promise.resolve([{ totalRevenue: "0", totalTransactions: 0, count: 0 }]);
    });
    [credentials, vendors, signupRequests, corporateUser].forEach(model => model.count.mockResolvedValue(0));
    getCommissionTotal.mockImplementation(async ({ range } = {}) => (range ? 25.5 : 1234.5));
    getCommissionByDay.mockResolvedValue({ [istDay(1)]: 40.25 });
});

describe("the admin dashboard's commission figures", () => {
    it("reads the all-time and today's commission from the plan-aware total", async () => {
        const { body } = await run({});

        expect(body.data.totalCashback).toBe(1234.5);
        expect(body.data.todaysCashback).toBe(25.5);
        expect(getCommissionTotal).toHaveBeenCalledWith();
        expect(getCommissionTotal).toHaveBeenCalledWith({
            range: { from: `${istDay(0)} 00:00:00`, to: `${istDay(0)} 23:59:59` },
        });
    });

    it("uses the date window asked for on today's figure", async () => {
        await run({ fromDate: "2026-10-01 00:00:00", toDate: "2026-10-02 23:59:59" });

        expect(getCommissionTotal).toHaveBeenCalledWith({
            range: { from: "2026-10-01 00:00:00", to: "2026-10-02 23:59:59" },
        });
    });

    it("fills the chart's commission per day and leaves days without orders at zero", async () => {
        const { body } = await run({});

        const day = new Date(`${istDay(1)} 00:00:00`).toDateString().slice(0, 10);
        expect(body.data.monthlyStatistics.find(item => item.name === day).cashback).toBe(40.25);
        expect(body.data.monthlyStatistics.filter(item => item.cashback === 0)).toHaveLength(
            body.data.monthlyStatistics.length - 1
        );
        expect(getCommissionByDay).toHaveBeenCalledWith({
            range: { from: `${istDay(30)} 23:59:59`, to: `${istDay(0)} 23:59:59` },
        });
    });

    it("no longer adds up the stored per-transaction amount anywhere", async () => {
        await run({});

        expect(queriesWith("totalCashback")).toHaveLength(0);
    });

    it("answers with an error instead of hanging when the commission cannot be read", async () => {
        getCommissionTotal.mockRejectedValue(new Error("db down"));

        const { res, body } = await run({});

        expect(res.status).toHaveBeenCalledWith(500);
        expect(body.status).toBe(false);
    });
});
