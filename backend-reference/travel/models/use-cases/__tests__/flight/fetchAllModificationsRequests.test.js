const { fetchAllModificationsRequests } = require('../../../use-cases/flight'); // Adjust path if needed
const { flightModifiedBookings } = require("../../../entities/flight");


jest.mock('../../../entities/flight', () => ({
    flightModifiedBookings: { findAndCountAll: jest.fn() },
    credential: jest.fn(),
    transaction: jest.fn(),
    orders: jest.fn(),
    flightBooking: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('fetchAllModificationsRequests Use-Case', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch modification requests successfully', async () => {
        const mockData = {
            count: 1,
            rows: [
                {
                    id: 'mod123',
                    modificationStatus: 'MODIFICATION_REQUESTED',
                    createdAt: new Date(),
                    flightBooking: { bookingReferenceId: 'ABC123' },
                },
            ],
        };

        flightModifiedBookings.findAndCountAll.mockResolvedValue(mockData);

        const params = { limit: 10, page: 1, searchText: 'ABC' };
        const result = await fetchAllModificationsRequests(params);

        expect(flightModifiedBookings.findAndCountAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockData);
    });

    it('should return an empty result if no modification requests exist', async () => {
        flightModifiedBookings.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const params = { limit: 10, page: 1, searchText: 'XYZ' };
        const result = await fetchAllModificationsRequests(params);

        expect(flightModifiedBookings.findAndCountAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should handle errors gracefully', async () => {
        const errorMessage = 'Database error';
        flightModifiedBookings.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        const params = { limit: 10, page: 1, searchText: 'ABC' };
        const result = await fetchAllModificationsRequests(params);

        expect(flightModifiedBookings.findAndCountAll).toHaveBeenCalledTimes(1);
        expect(result).toBe(false);
    });
});
