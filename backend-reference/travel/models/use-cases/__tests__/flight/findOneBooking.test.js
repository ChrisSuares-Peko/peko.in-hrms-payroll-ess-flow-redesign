const { findOneBooking } = require('../../../use-cases/flight');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/flight', () => ({
    hasMany: jest.fn(),
}));

describe('findOneBooking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a booking when a matching record is found', async () => {
        const mockBookingId = 123;
        const mockOrderRecord = {
            id: 123,
            orderResponse: '{"status": "CONFIRMED"}',
        };

        orders.findOne.mockResolvedValue(mockOrderRecord);

        const result = await findOneBooking(mockBookingId);

        expect(orders.findOne).toHaveBeenCalledWith({
            where: { id: mockBookingId },
        });

        expect(result).toEqual(mockOrderRecord);
    });

    it('should return null when no booking is found', async () => {
        const mockBookingId = 999;

        orders.findOne.mockResolvedValue(null);

        const result = await findOneBooking(mockBookingId);

        expect(orders.findOne).toHaveBeenCalledWith({
            where: { id: mockBookingId },
        });

        expect(result).toBeNull();
    });

    it('should throw an error when database operation fails', async () => {
        const mockBookingId = 123;
        const mockError = new Error('Database error');

        orders.findOne.mockRejectedValue(mockError);

        await expect(findOneBooking(mockBookingId)).rejects.toThrow('Database error');

        expect(orders.findOne).toHaveBeenCalledWith({
            where: { id: mockBookingId },
        });
    });
});
