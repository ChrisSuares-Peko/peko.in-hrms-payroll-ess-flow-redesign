const { garage_fleet: GarageFleet } = require("../../../../entities/garage");
const { getFleetVerificationStatusCount } = require("../../garage_fleet");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { findOne: jest.fn(), create: jest.fn(), count: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() },
    garage_assignment: { findOne: jest.fn() },
    garage_driver: {},
    garage_document: { associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../entities/garage/garage_operations_log", () => ({ create: jest.fn() }));
jest.mock("../../../../../configs/database/index", () => ({ transaction: jest.fn() }));
jest.mock("../../garage_logs", () => ({ createLog: jest.fn() }));
jest.mock("../../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn((sf, s) => [[sf || 'createdAt', s || 'DESC']]) }));
jest.mock("moment", () => {
    const m = jest.fn(() => ({ isValid: () => true, diff: () => 2 }));
    m.fn = {};
    m.version = '2.30.1';
    return m;
});

describe("getFleetVerificationStatusCount", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return verification counts and age distribution", async () => {
        GarageFleet.count.mockResolvedValue(5);
        GarageFleet.findAll.mockResolvedValue([]);

        const result = await getFleetVerificationStatusCount({ credentialId: 100 });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty("verified", 5);
        expect(result.data).toHaveProperty("unverified", 0);
        expect(result.data).toHaveProperty("ageDistributionData");
    });

    it("should return error on exception", async () => {
        GarageFleet.count.mockRejectedValue(new Error("DB error"));

        const result = await getFleetVerificationStatusCount({ credentialId: 100 });

        expect(result.success).toBe(false);
    });
});
