const { findOneFlightBookingWithAllDetails } = require('../../../use-cases/flight');
const flightBooking = require('../../../entities/flight/flightBooking');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/flight/flightBooking', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/flight', () => ({
    hasMany: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findOneFlightBookingWithAllDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a flight booking with all details when a matching record is found', async () => {
        const mockWhereCondition = { id: 1 };
        const mockFlightBooking = {
            id: 1,
            transaction: {
                corporateTxnId: 'TXN123',
                transactionDate: '2024-02-15T12:00:00Z',
            },
            orders: {
                id: 99,
                amount: 5000,
                paymentMode: 'Credit Card',
            },
            credential: {
                id: 10,
                name: 'Corporate User',
            },
        };

        flightBooking.findOne.mockResolvedValue(mockFlightBooking);

        const result = await findOneFlightBookingWithAllDetails(mockWhereCondition);

        expect(flightBooking.findOne).toHaveBeenCalledWith({
            where: mockWhereCondition,
            include: expect.arrayContaining([
                expect.objectContaining({ model: transaction }),
                expect.objectContaining({ model: orders }),
                expect.objectContaining({ model: credential }),
            ]),
        });

        expect(result).toEqual(mockFlightBooking);
    });

    it('should return null when no flight booking is found', async () => {
        const mockWhereCondition = { id: 999 };

        flightBooking.findOne.mockResolvedValue(null);

        const result = await findOneFlightBookingWithAllDetails(mockWhereCondition);

        expect(flightBooking.findOne).toHaveBeenCalledWith({
            where: mockWhereCondition,
            include: expect.any(Array),
        });

        expect(result).toBeNull();
    });

    it('should throw an error when database operation fails', async () => {
        const mockWhereCondition = { id: 1 };
        const mockError = new Error('Database error');

        flightBooking.findOne.mockRejectedValue(mockError);

        await expect(findOneFlightBookingWithAllDetails(mockWhereCondition)).rejects.toThrow('Database error');

        expect(flightBooking.findOne).toHaveBeenCalledWith({
            where: mockWhereCondition,
            include: expect.any(Array),
        });
    });
});
