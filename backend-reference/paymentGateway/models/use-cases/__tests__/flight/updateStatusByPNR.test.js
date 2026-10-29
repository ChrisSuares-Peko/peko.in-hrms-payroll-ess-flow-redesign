const { updateStatusByPNR } = require('../../flight');
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

describe('flight - updateStatusByPNR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update flight booking status by PNR', async () => {
    flightBooking.update.mockResolvedValue([1]);

    const result = await updateStatusByPNR({ pnr: 'PNR123', status: 'CANCELLED' });

    expect(flightBooking.update).toHaveBeenCalledWith(
      { bookingStatus: 'CANCELLED' },
      { where: { PNR: 'PNR123' } }
    );
    expect(result).toEqual([1]);
  });

  it('should return [0] when PNR not found', async () => {
    flightBooking.update.mockResolvedValue([0]);

    const result = await updateStatusByPNR({ pnr: 'NONEXISTENT', status: 'CANCELLED' });

    expect(result).toEqual([0]);
  });
});
