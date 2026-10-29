const { updateBookingStatus } = require('../../flight');
const orders = require('../../../entities/order');

jest.mock('../../../entities/flight/flightBooking', () => ({
  findAndCountAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../entities/transaction', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

describe('flight - updateBookingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update booking status when order found', async () => {
    const mockOrder = {
      orderResponse: JSON.stringify({ data: [{ bookingStatus: 'BOOKED' }] }),
    };
    orders.findOne.mockResolvedValue(mockOrder);
    orders.update.mockResolvedValue([1]);

    await updateBookingStatus('TXN123', 'CANCELLED');

    expect(orders.findOne).toHaveBeenCalledWith({ where: { corporateTxnId: 'TXN123' } });
    expect(orders.update).toHaveBeenCalledWith(
      { orderResponse: expect.any(String) },
      { where: { corporateTxnId: 'TXN123' } }
    );
  });

  it('should not update when order not found', async () => {
    orders.findOne.mockResolvedValue(null);

    await updateBookingStatus('NONEXISTENT', 'CANCELLED');

    expect(orders.update).not.toHaveBeenCalled();
  });
});
