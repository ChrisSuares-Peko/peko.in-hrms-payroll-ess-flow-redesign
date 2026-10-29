const { findOneBooking } = require('../../flight');
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

describe('flight - findOneBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return order record when found', async () => {
    const mockResult = { id: 1, corporateTxnId: 'TXN123' };
    orders.findOne.mockResolvedValue(mockResult);

    const result = await findOneBooking(1);

    expect(orders.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    orders.findOne.mockResolvedValue(null);

    const result = await findOneBooking(999);

    expect(result).toBeNull();
  });

  it('should throw error on DB failure', async () => {
    orders.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOneBooking(1)).rejects.toThrow('DB Error');
  });
});
