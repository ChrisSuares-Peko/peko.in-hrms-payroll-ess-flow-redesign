const { updateBookingStatus } = require('../../../use-cases/hotels');
const orders = require('../../../entities/order');


jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
    customLog: jest.fn(),
}));

describe('updateBookingStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

   it('should successfully update booking status', async () => {
    const mockBookingId = 'BOOK123';
    const mockBookingStatus = 'Confirmed';
    const mockChangeRequestId = 'REQ789';

    const mockOrderRecord = {
        providerId: mockBookingId,
        orderResponse: JSON.stringify({ bookingStatus: 'Pending' }),
    };

    orders.findOne.mockResolvedValue(mockOrderRecord);
    orders.update.mockResolvedValue([1]);

    await expect(updateBookingStatus({
        ConfirmationNo: mockBookingId,
        bookingStatus: mockBookingStatus,
        ChangeRequestId: mockChangeRequestId,
    })).resolves.not.toThrow();

    expect(orders.findOne).toHaveBeenCalledWith({
        where: { providerId: mockBookingId },
    });

    expect(orders.update).toHaveBeenCalledWith(
        expect.objectContaining({
            orderResponse: JSON.stringify({
                bookingStatus: mockBookingStatus,
                ChangeRequestId: mockChangeRequestId,
            }),
        }),
        { where: { providerId: mockBookingId } }
    );
});

it('should update booking status without ChangeRequestId when not provided', async () => {
    const mockBookingId = 'BOOK124';
    const mockBookingStatus = 'Cancelled';

    const mockOrderRecord = {
        providerId: mockBookingId,
        orderResponse: JSON.stringify({ bookingStatus: 'Pending' }),
    };

    orders.findOne.mockResolvedValue(mockOrderRecord);
    orders.update.mockResolvedValue([1]);

    await expect(updateBookingStatus({
        ConfirmationNo: mockBookingId,
        bookingStatus: mockBookingStatus
    })).resolves.not.toThrow();

    expect(orders.findOne).toHaveBeenCalledWith({
        where: { providerId: mockBookingId },
    });

    expect(orders.update).toHaveBeenCalledWith(
        expect.objectContaining({
            orderResponse: JSON.stringify({
                bookingStatus: mockBookingStatus,
            }),
        }),
        { where: { providerId: mockBookingId } }
    );
});

it('should throw an error if no order is found for the given providerId', async () => {
    const mockBookingId = 'BOOK_NOT_FOUND';
    orders.findOne.mockResolvedValue(null);

    await expect(updateBookingStatus({
        ConfirmationNo: mockBookingId,
        bookingStatus: 'Confirmed'
    })).rejects.toThrow(
        `No order found for providerId: ${mockBookingId}`
    );
});

it('should throw an error if no rows were updated', async () => {
    const mockBookingId = 'BOOK_UPDATE_FAIL';
    const mockBookingStatus = 'Confirmed';

    const mockOrderRecord = {
        providerId: mockBookingId,
        orderResponse: JSON.stringify({ bookingStatus: 'Pending' }),
    };

    orders.findOne.mockResolvedValue(mockOrderRecord);
    orders.update.mockResolvedValue([0]);

    await expect(updateBookingStatus({
        ConfirmationNo: mockBookingId,
        bookingStatus: mockBookingStatus
    })).rejects.toThrow(
        `No rows were updated for providerId: ${mockBookingId}`
    );
});


    it('should throw an error when database operation fails', async () => {
        const mockBookingId = 'BOOK_ERROR';
        const mockError = new Error('Database error');

        orders.findOne.mockRejectedValue(mockError);

        await expect(updateBookingStatus(mockBookingId, 'Confirmed')).rejects.toThrow('Database error');

        expect(orders.findOne).toHaveBeenCalled();
    });
});
