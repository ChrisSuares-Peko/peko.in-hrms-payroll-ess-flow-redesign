const { deleteSubscription } = require('../../subscription');
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

describe('subscription - deleteSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete subscription and return count', async () => {
    subscription.destroy.mockResolvedValue(1);

    const result = await deleteSubscription({ id: 1 });

    expect(subscription.destroy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
      })
    );
    expect(result).toBe(1);
  });

  it('should return 0 when nothing to delete', async () => {
    subscription.destroy.mockResolvedValue(0);

    const result = await deleteSubscription({ id: 999 });

    expect(result).toBe(0);
  });

  it('should return false on DB failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    subscription.destroy.mockRejectedValue(new Error('DB Error'));

    const result = await deleteSubscription({ id: 1 });

    expect(result).toBe(false);
  });
});
