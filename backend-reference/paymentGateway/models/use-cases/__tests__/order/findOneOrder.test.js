const { findOneOrder } = require('../../../use-cases/order');
const order = require('../../../entities/order');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
}));

jest.mock("@logtail/node", () => ({
  Logtail: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('findOneOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the order with included credential when found', async () => {
    const mockParams = { corporateTxnId: '12345' };
    const mockOrder = {
      id: 1,
      corporateTxnId: '12345',
      credential: {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    order.findOne.mockResolvedValue(mockOrder);

    const result = await findOneOrder(mockParams);

    expect(order.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: mockParams.corporateTxnId },
      include: expect.arrayContaining([
        expect.objectContaining({
          model: credential,
          attributes: ["username", "name", "email"],
        })
      ]),
    });
    expect(result).toEqual(mockOrder);
  });

  it('should return null when order is not found', async () => {
    const mockParams = { corporateTxnId: '12345' };

    order.findOne.mockResolvedValue(null);

    const result = await findOneOrder(mockParams);

    expect(order.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: mockParams.corporateTxnId },
      include: expect.arrayContaining([
        expect.objectContaining({
          model: credential,
          attributes: ["username", "name", "email"],
        })
      ]),
    });
    expect(result).toBeNull();
  });

  it('should handle errors during database operations', async () => {
    const mockParams = { corporateTxnId: '12345' };
    const mockError = new Error('Database error');

    order.findOne.mockRejectedValue(mockError);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await findOneOrder(mockParams);

    expect(consoleSpy).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('should handle missing corporateTxnId parameter', async () => {
    const mockParams = {};

    await findOneOrder(mockParams);

    expect(order.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: undefined },
      include: expect.arrayContaining([
        expect.objectContaining({
          model: credential,
          attributes: ["username", "name", "email"],
        })
      ]),
    });
  });
});
