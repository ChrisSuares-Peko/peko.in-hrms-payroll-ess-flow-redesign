const { fetchAllCancelledFlightBookings } = require("../../flight");
const flightBooking  = require("../../../entities/flight/flightBooking");
const { Op } = require("sequelize");


jest.mock("sequelize", () => {
    const actualSequelize = jest.requireActual("sequelize");
    return {
        ...actualSequelize,
        Op: actualSequelize.Op,
        where: jest.fn(),
        col: jest.fn(),
        literal: jest.fn(),
    };
});
jest.mock("../../../../configs/database/index", () => {
    const mockModel = () => {};
    
    mockModel.belongsTo = jest.fn();
    mockModel.hasMany = jest.fn();
    mockModel.prototype = {};

    return {
        define: jest.fn(() => mockModel),
        escape: jest.fn((val) => `'${val}'`)
    };
});




jest.mock("../../../entities/flight/flightBooking", () => ({
    findAndCountAll: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
}));


jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe("fetchAllCancelledFlightBookings Use-Case", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch cancelled flight bookings", async () => {
        const params = {
            limit: 10,
            page: 1,
            credentialId: "cred123",
            from: "2024-01-01",
            to: "2024-02-01",
            searchText: "TXN123"
        };

        const mockResult = {
            count: 1,
            rows: [
                {
                    id: "booking1",
                    bookingStatus: "CANCELLED_AND_REFUNDED",
                    credentialId: "cred123",
                    createdAt: "2024-01-15T10:00:00Z",
                    fare: 500,
                    bookingCurrentStatus: "CANCELLED_AND_REFUNDED",
                    refundedAmount: 400,
                    cancellationDate: "2024-01-16T12:00:00Z",
                }
            ]
        };

        flightBooking.findAndCountAll.mockResolvedValue(mockResult);

        const result = await fetchAllCancelledFlightBookings(params);

        expect(flightBooking.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    [Op.and]: expect.arrayContaining([
                        expect.objectContaining({
                            [Op.or]: expect.arrayContaining([
                                { bookingStatus: "CANCELLED_REQUEST_FOR_REFUND" },
                                { bookingStatus: "CANCELLED_AND_REFUNDED" },
                                { bookingCurrentStatus: "REQUESTED_FOR_CANCELLATION" },
                                { bookingCurrentStatus: "CANCELLED_AND_REFUNDED" },
                            ]),
                        }),
                    ]),
                }),
                include: expect.any(Array),
                order: [["createdAt", "DESC"]],
                limit: params.limit,
                offset: 0,
            })
        );

        expect(result).toEqual(mockResult);
    });

    it("should return empty result if no cancelled bookings exist", async () => {
        const params = {
            limit: 10,
            page: 1,
            credentialId: "cred123",
        };

        const mockResult = { count: 0, rows: [] };

        flightBooking.findAndCountAll.mockResolvedValue(mockResult);

        const result = await fetchAllCancelledFlightBookings(params);

        expect(result).toEqual(mockResult);
    });

    it("should throw error when query fails", async () => {
    flightBooking.findAndCountAll.mockRejectedValue(
        new Error("DB error")
    );

    await expect(
        fetchAllCancelledFlightBookings({
            limit: 10,
            page: 1,
            credentialId: "cred123",
        })
    ).rejects.toEqual({ message: "Something went wrong" });
});

});
