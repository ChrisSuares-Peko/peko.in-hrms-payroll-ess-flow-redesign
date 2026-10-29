const cashback = require('../../../entities/cashback');
const { create } = require('../../cashback'); 


jest.mock('../../../entities/cashback', () => ({
  create: jest.fn(),
  
}));
describe('create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call cashback.create with correct parameters and return result', async () => {
    const params = {
      amount: 100,
      userId: 'testUserId',
    };

    const mockResult = { id: 1, ...params };
    cashback.create.mockResolvedValue(mockResult);

    const result = await create(params);

    expect(cashback.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResult);
  });

  it('should handle errors gracefully', async () => {
    const params = {
      amount: 100,
      userId: 'testUserId',
    };

    const errorMessage = 'Error creating cashback';
    cashback.create.mockRejectedValue(new Error(errorMessage));

    await expect(create(params)).rejects.toThrow(errorMessage);
  });

  it('should handle null params gracefully', async () => {
    await expect(create(null)).rejects.toThrow(); 
  });
});
