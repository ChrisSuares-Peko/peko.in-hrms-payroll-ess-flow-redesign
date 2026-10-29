const { updateBookingStatus } = require('../../../use-cases/flight');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));
jest.mock('../../../entities/flight', () => ({
    hasMany: jest.fn(),
}));

describe('updateBookingStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update the booking status', async () => {
        const mockCorporateTxnId = 'TXN123';
        const mockBookingStatus = 'CONFIRMED';

        const mockOrderRecord = {
            corporateTxnId: mockCorporateTxnId,
            orderResponse: JSON.stringify({ data: [{ bookingStatus: 'PENDING' }] }),
        };

        orders.findOne.mockResolvedValue(mockOrderRecord);
        orders.update.mockResolvedValue([1]); // Mock update success (1 row affected)

        await expect(updateBookingStatus(mockCorporateTxnId, mockBookingStatus)).resolves.not.toThrow();

        expect(orders.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: mockCorporateTxnId },
        });

        expect(orders.update).toHaveBeenCalledWith(
            {
                orderResponse: JSON.stringify({ data: [{ bookingStatus: mockBookingStatus }] }),
            },
            {
                where: { corporateTxnId: mockCorporateTxnId },
            }
        );
    });

    it('should not update if no order is found for the given corporateTxnId', async () => {
        const mockCorporateTxnId = 'TXN_NOT_FOUND';
        const mockBookingStatus = 'CONFIRMED';

        orders.findOne.mockResolvedValue(null);

        await expect(updateBookingStatus(mockCorporateTxnId, mockBookingStatus)).resolves.not.toThrow();

        expect(orders.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: mockCorporateTxnId },
        });

        expect(orders.update).not.toHaveBeenCalled();
    });

    it('should throw an error when database operation fails', async () => {
        const mockCorporateTxnId = 'TXN_ERROR';
        const mockBookingStatus = 'CONFIRMED';
        const mockError = new Error('Database error');

        orders.findOne.mockRejectedValue(mockError);

        await expect(updateBookingStatus(mockCorporateTxnId, mockBookingStatus)).rejects.toThrow('Database error');

        expect(orders.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: mockCorporateTxnId },
        });

        expect(orders.update).not.toHaveBeenCalled();
    });
});
