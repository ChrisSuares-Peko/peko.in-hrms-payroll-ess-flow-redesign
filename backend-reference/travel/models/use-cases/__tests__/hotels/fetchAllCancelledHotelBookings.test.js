const { fetchAllCancelledHotelBookings } = require("../../hotels");
const orders = require("../../../entities/order");
const credential = require("../../../entities/credential");
const { Op } = require("sequelize");

/**
 * Mocks
 */
jest.mock("../../../entities/order", () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({}));

jest.mock("sequelize", () => {
    const actual = jest.requireActual("sequelize");
    return {
        ...actual,
        Op: actual.Op,
        literal: jest.fn((val) => val),
    };
});

describe("fetchAllCancelledHotelBookings Use-Case", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch cancelled hotel bookings with pagination", async () => {
        const params = {
            limit: 10,
            page: 1,
            credentialId: "cred123",
            from: "2024-01-01",
            to: "2024-01-31",
            searchText: "TXN",
            partnerId: "partner123",
        };

        const mockResult = {
            count: 1,
            rows: [
                {
                    id: "order1",
                    corporateTxnId: "TXN123",
                    providerId: "HOTEL123",
                    createdAt: "2024-01-10T10:00:00Z",
                },
            ],
        };

        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await fetchAllCancelledHotelBookings(params);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    [Op.and]: expect.any(Array),
                    serviceOperatorId: "partner123",
                    createdAt: expect.any(Object),
                }),
                include: expect.arrayContaining([
                    expect.objectContaining({
                        model: credential,
                        where: { id: "cred123" },
                    }),
                ]),
                order: [["createdAt", "DESC"]],
                limit: 10,
                offset: 0,
            })
        );

        expect(result).toEqual(mockResult);
    });

    it("should return empty result when no records found", async () => {
        const params = {
            limit: 10,
            page: 1,
        };

        const mockResult = { count: 0, rows: [] };

        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await fetchAllCancelledHotelBookings(params);

        expect(result).toEqual(mockResult);
    });


    it("should return false when query throws error", async () => {
        orders.findAndCountAll.mockRejectedValue(new Error("DB failure"));

        const result = await fetchAllCancelledHotelBookings({
            limit: 10,
            page: 1,
        });

        expect(result).toBe(false);
    });
});
