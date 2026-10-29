const { update } = require('../../giftCards');
const giftCards = require('../../../../models/entities/giftCards');

jest.mock('../../../../models/entities/giftCards', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/vendor', () => ({
  findOne: jest.fn(),
}));

describe('giftCards - update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update gift card and return result', async () => {
    giftCards.update.mockResolvedValue([1]);

    const result = await update(1, { amount: 200 });

    expect(giftCards.update).toHaveBeenCalledWith(
      { amount: 200 },
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(result).toEqual([1]);
  });

  it('should return [0] when nothing updated', async () => {
    giftCards.update.mockResolvedValue([0]);

    const result = await update(999, { amount: 200 });

    expect(result).toEqual([0]);
  });
});
