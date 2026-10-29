const { findSubscriptionById } = require('../../subscription');
const subscription = require('../../../entities/subscription');

jest.mock('../../../entities/subscription', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../../../entities/package', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
}));

describe('subscription - findSubscriptionById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return subscription when found by id', async () => {
    const mockResult = { id: 1, status: 'ACTIVE' };
    subscription.findOne.mockResolvedValue(mockResult);

    const result = await findSubscriptionById(1);

    expect(subscription.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
      })
    );
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    subscription.findOne.mockResolvedValue(null);

    const result = await findSubscriptionById(999);

    expect(result).toBeNull();
  });

  it('should throw error on DB failure', async () => {
    subscription.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findSubscriptionById(1)).rejects.toThrow('DB Error');
  });
});
