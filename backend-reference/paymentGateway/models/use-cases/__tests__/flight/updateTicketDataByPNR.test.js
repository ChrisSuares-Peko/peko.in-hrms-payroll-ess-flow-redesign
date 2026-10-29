const { updateTicketDataByPNR } = require('../../flight');
const flightBooking = require('../../../entities/flight/flightBooking');

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

describe('flight - updateTicketDataByPNR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update flight ticket data by PNR', async () => {
    const updatedData = { bookingStatus: 'CONFIRMED', fare: { amount: 5000 } };
    flightBooking.update.mockResolvedValue([1]);

    const result = await updateTicketDataByPNR('PNR123', updatedData);

    expect(flightBooking.update).toHaveBeenCalledWith(updatedData, { where: { PNR: 'PNR123' } });
    expect(result).toEqual([1]);
  });

  it('should return [0] when PNR not found', async () => {
    flightBooking.update.mockResolvedValue([0]);

    const result = await updateTicketDataByPNR('NONEXISTENT', { bookingStatus: 'CANCELLED' });

    expect(result).toEqual([0]);
  });
});
