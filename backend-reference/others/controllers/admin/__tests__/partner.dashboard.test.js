const moment = require("moment");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../../../models/entities/credential");
const { findCorporateByPartner } = require("../../../models/use-cases/credential");
const { findOne: findPartnerShare } = require("../../../models/use-cases/systemUser");
const {
    PARTNER_CORPORATES,
    getCommissionTotal,
    getCommissionByDay,
} = require("../../../models/use-cases/dashboardCommission");
const { getDashboardDetails, getDashboardStatisticsData } = require("../partner");

jest.mock("../../../models/use-cases/credential", () => ({
    findCorporateByPartner: jest.fn(),
    fetchAllSubPartnerList: jest.fn(),
}));
jest.mock("../../../models/use-cases/package", () => ({}));
jest.mock("../../../models/use-cases/systemUser", () => ({
    findAllByRoleName: jest.fn(),
    findClonePartnerFrom: jest.fn(),
    findClonePartnerTo: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock("../../../models/use-cases/dashboardCommission", () => {
    const actual = jest.requireActual("../../../models/use-cases/dashboardCommission");
    return { ...actual, getCommissionTotal: jest.fn(), getCommissionByDay: jest.fn() };
});

const PARTNER = { id: 5, registeredBy: "77", subPartnerId: null };

const call = (handler, req) =>
    new Promise(resolve => {
        const res = { send: jest.fn(body => resolve(body)) };
        handler(req, res, jest.fn());
    });

const reportAllQueries = () => sequelizeConfig.query.mock.calls.filter(([sql]) => sql.includes("FROM reportAll"));

beforeEach(() => {
    jest.clearAllMocks();
    findCorporateByPartner.mockResolvedValue([{ id: 101 }, { id: 102 }]);
    findPartnerShare.mockResolvedValue({ sharePercentage: "20.0000" });
    credential.count.mockResolvedValue(0);
    sequelizeConfig.query.mockResolvedValue([
        { totalRevenue: "0", totalTransactions: 0, todaysRevenue: "0", todaysTransactions: 0 },
    ]);
    getCommissionTotal.mockImplementation(async ({ range } = {}) => (range ? 250 : 1000));
    getCommissionByDay.mockResolvedValue({});
});

describe("the partner dashboard cards", () => {
    it("reads Total Commission from the plan-aware total for the partner's corporates", async () => {
        const body = await call(getDashboardDetails, { user: PARTNER });

        expect(body.data.totalCashback).toBe(1000);
        expect(body.data.todaysCashback).toBe(250);
        expect(getCommissionTotal).toHaveBeenCalledWith({ scope: { credentialIds: [101, 102] } });
        expect(getCommissionTotal).toHaveBeenCalledWith(
            expect.objectContaining({
                range: { from: expect.any(String), to: expect.any(String) },
                scope: { credentialIds: [101, 102] },
            })
        );
    });

    it("works out System Share from that commission, today's included, which used to read as nothing", async () => {
        const body = await call(getDashboardDetails, { user: PARTNER });

        expect(body.data.totalNetworkShare).toBe(200);
        expect(body.data.todaysNetworkShare).toBe(50);
    });

    it("shows no System Share when the partner has no share set", async () => {
        findPartnerShare.mockResolvedValue({ sharePercentage: null });

        const body = await call(getDashboardDetails, { user: PARTNER });

        expect(body.data.totalNetworkShare).toBe(0);
        expect(body.data.todaysNetworkShare).toBe(0);
    });

    it("no longer adds up the stored per-transaction amount", async () => {
        await call(getDashboardDetails, { user: PARTNER });

        expect(reportAllQueries().filter(([sql]) => sql.includes("totalCashback"))).toHaveLength(0);
    });
});

describe("the partner dashboard charts", () => {
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    beforeEach(() => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("FROM reportAll") ? [{ Date: yesterday, count: 2, revenue: "500.00" }] : []
            )
        );
        getCommissionByDay.mockResolvedValue({ [yesterday]: 100 });
    });

    it("plots each day's commission and the partner's share of it", async () => {
        const body = await call(getDashboardStatisticsData, { user: PARTNER, query: { month: "10", year: "2026" } });

        const day = body.data.monthlyStatistics.find(
            item => item.name === new Date(`${yesterday} 00:00:00`).toDateString().slice(0, 10)
        );
        expect(day).toMatchObject({ cashback: 100, partnerShares: 20, transactions: 2, revenue: 500 });
        expect(getCommissionByDay).toHaveBeenCalledWith({
            range: { from: expect.any(String), to: expect.any(String) },
            scope: { partner: { registeredBy: "77", subPartnerId: null } },
        });
    });

    it("picks the partner's corporates without columns the view does not have", async () => {
        await call(getDashboardStatisticsData, { user: { ...PARTNER, subPartnerId: undefined }, query: { month: "10", year: "2026" } });

        const [[sql, options]] = reportAllQueries();
        expect(sql).toContain(PARTNER_CORPORATES);
        expect(sql).not.toContain("systemCashback");
        expect(sql).not.toContain("totalCashback");
        expect(options.replacements).toMatchObject({ registeredBy: "77", subPartnerId: null });
    });
});
