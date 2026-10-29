const { updateSubscription } = require('../../subscription');
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

describe('subscription - updateSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update subscription and return result', async () => {
    subscription.update.mockResolvedValue([1]);

    const result = await updateSubscription({ status: 'INACTIVE' }, 1);

    expect(subscription.update).toHaveBeenCalledWith(
      { status: 'INACTIVE' },
      expect.objectContaining({
        where: { id: 1 },
      })
    );
    expect(result).toEqual([1]);
  });

  it('should return [0] when nothing updated', async () => {
    subscription.update.mockResolvedValue([0]);

    const result = await updateSubscription({ status: 'INACTIVE' }, 999);

    expect(result).toEqual([0]);
  });

  it('should return false on DB failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    subscription.update.mockRejectedValue(new Error('DB Error'));

    const result = await updateSubscription({ status: 'INACTIVE' }, 1);

    expect(result).toBe(false);
  });
});
