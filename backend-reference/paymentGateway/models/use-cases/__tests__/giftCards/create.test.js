const { create } = require('../../giftCards');
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

describe('giftCards - create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return a gift card', async () => {
    const mockParams = { name: 'Test Gift Card', amount: 100 };
    const mockResult = { id: 1, ...mockParams };

    giftCards.create.mockResolvedValue(mockResult);

    const result = await create(mockParams);

    expect(giftCards.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockResult);
  });

  it('should throw error when creation fails', async () => {
    giftCards.create.mockRejectedValue(new Error('DB Error'));

    await expect(create({ name: 'Test' })).rejects.toThrow('DB Error');
  });
});
