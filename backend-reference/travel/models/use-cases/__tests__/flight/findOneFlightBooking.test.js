const { findOneFlightBooking } = require('../../../use-cases/flight');
const flightBooking = require('../../../entities/flight/flightBooking');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/flight/flightBooking', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/flight', () => ({
    hasMany: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findOneFlightBooking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a flight booking when a matching record is found', async () => {
        const mockBookingId = 1;
        const mockFlightBooking = {
            id: mockBookingId,
            transaction: {
                corporateTxnId: 'TXN123',
            },
            orders: {
                id: 99,
                amount: 5000,
            },
        };

        flightBooking.findOne.mockResolvedValue(mockFlightBooking);

        const result = await findOneFlightBooking({ id: mockBookingId });

        expect(flightBooking.findOne).toHaveBeenCalledWith({
            where: { id: mockBookingId },
            include: expect.arrayContaining([
                expect.objectContaining({ model: transaction, attributes: ['corporateTxnId'] }),
                expect.objectContaining({ model: orders }),
            ]),
        });

        expect(result).toEqual(mockFlightBooking);
    });

    it('should return null when no flight booking is found', async () => {
        const mockBookingId = 999;

        flightBooking.findOne.mockResolvedValue(null);

        const result = await findOneFlightBooking({ id: mockBookingId });

        expect(flightBooking.findOne).toHaveBeenCalledWith({
            where: { id: mockBookingId },
            include: expect.any(Array),
        });

        expect(result).toBeNull();
    });

    it('should throw an error when database operation fails', async () => {
        const mockBookingId = 1;
        const mockError = new Error('Database error');

        flightBooking.findOne.mockRejectedValue(mockError);

        await expect(findOneFlightBooking({ id: mockBookingId })).rejects.toThrow('Database error');

        expect(flightBooking.findOne).toHaveBeenCalledWith({
            where: { id: mockBookingId },
            include: expect.any(Array),
        });
    });
});
