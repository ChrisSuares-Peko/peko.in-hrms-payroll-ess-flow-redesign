const { updateCancelledBookingStatus } = require('../../../use-cases/flight');
const orders = require('../../../entities/order');
const flightBooking = require('../../../entities/flight/flightBooking');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));
jest.mock('../../../entities/flight', () => ({
    hasMany: jest.fn(),
}));

jest.mock('../../../entities/flight/flightBooking', () => ({
    update: jest.fn(),
}));

describe('updateCancelledBookingStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update order and flight booking status', async () => {
  const mockCorporateTxnId = 'TXN123';
  const mockFlightBookingId = 1;

  orders.update.mockResolvedValue([1]);
  flightBooking.update.mockResolvedValue([1]);

  await expect(updateCancelledBookingStatus({
    corporateTxnId: mockCorporateTxnId,
    flightBookingId: mockFlightBookingId,
    ChangeRequestId: 10,
    ChangeRequestStatus: 0,
    refundedAmount: 200
  })).resolves.not.toThrow();

  expect(orders.update).toHaveBeenCalledWith(
    { ecomOrderStatus: 'CANCELLED' },
    { where: { corporateTxnId: mockCorporateTxnId } }
  );

  expect(flightBooking.update).toHaveBeenCalledWith(
    expect.objectContaining({
      bookingStatus: "CANCELLED_REQUEST_FOR_REFUND",
      refundedAmount: 200,
    }),
    { where: { id: mockFlightBookingId } }
  );
});

it('should update only flight booking and still update order since findOne is not used anymore', async () => {
    const mockCorporateTxnId = 'TXN_NOT_FOUND';
    const mockFlightBookingId = 1;

    orders.update.mockResolvedValue([1]);
    flightBooking.update.mockResolvedValue([1]);

    await expect(updateCancelledBookingStatus({
        corporateTxnId: mockCorporateTxnId,
        flightBookingId: mockFlightBookingId,
        ChangeRequestId: 10,
        ChangeRequestStatus: 0,
        refundedAmount: 200
    })).resolves.not.toThrow();

    // ✅ Remove orders.findOne expectation completely

    expect(orders.update).toHaveBeenCalledWith(
        { ecomOrderStatus: 'CANCELLED' },
        { where: { corporateTxnId: mockCorporateTxnId } }
    );

    expect(flightBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({
            bookingStatus: 'CANCELLED_REQUEST_FOR_REFUND',
            refundedAmount: 200,
        }),
        { where: { id: mockFlightBookingId } }
    );
});


    it('should throw an error when database operation fails for orders update', async () => {
        const mockCorporateTxnId = 'TXN_ERROR';
        const mockFlightBookingId = 1;
        const mockBookingStatus = 'CANCELLED';
        const mockError = new Error('Database error');

        const mockOrderRecord = {
            corporateTxnId: mockCorporateTxnId,
            orderResponse: JSON.stringify({ data: { bookingStatus: 'PENDING' } }),
        };

        orders.findOne.mockResolvedValue(mockOrderRecord);
        orders.update.mockRejectedValue(mockError);

        await expect(updateCancelledBookingStatus(mockCorporateTxnId, mockFlightBookingId, mockBookingStatus)).rejects.toThrow('Database error');

        expect(orders.update).toHaveBeenCalled();
        expect(flightBooking.update).not.toHaveBeenCalled();
    });

    it('should throw an error when database operation fails for flight booking update', async () => {
        const mockCorporateTxnId = 'TXN123';
        const mockFlightBookingId = 1;
        const mockBookingStatus = 'CANCELLED';
        const mockError = new Error('Database error');

        const mockOrderRecord = {
            corporateTxnId: mockCorporateTxnId,
            orderResponse: JSON.stringify({ data: { bookingStatus: 'PENDING' } }),
        };

        orders.findOne.mockResolvedValue(mockOrderRecord);
        orders.update.mockResolvedValue([1]); // 1 row affected
        flightBooking.update.mockRejectedValue(mockError);

        await expect(updateCancelledBookingStatus(mockCorporateTxnId, mockFlightBookingId, mockBookingStatus)).rejects.toThrow('Database error');

        expect(flightBooking.update).toHaveBeenCalled();
    });
});
