const { findOneFlightBooking } = require('../../flight');
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

describe('flight - findOneFlightBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return flight booking with includes when found', async () => {
    const mockResult = { id: 1, BookingId: 'BK123', transaction: {}, order: {} };
    flightBooking.findOne.mockResolvedValue(mockResult);

    const result = await findOneFlightBooking({ id: 1 });

    expect(flightBooking.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
      })
    );
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    flightBooking.findOne.mockResolvedValue(null);

    const result = await findOneFlightBooking({ id: 999 });

    expect(result).toBeNull();
  });
});
