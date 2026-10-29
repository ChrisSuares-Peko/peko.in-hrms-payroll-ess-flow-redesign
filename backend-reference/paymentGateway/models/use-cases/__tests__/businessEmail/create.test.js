const { create } = require('../../businessEmail');
const businessEmailSubscriptions = require('../../../entities/businessEmail');

jest.mock('../../../entities/businessEmail', () => ({
  create: jest.fn(),
}));

describe('businessEmail - create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a business email subscription', async () => {
    const mockData = { email: 'test@corp.com', credentialId: 'C1' };
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
    const mockResult = { id: 1, ...mockData };

    businessEmailSubscriptions.create.mockResolvedValue(mockResult);

    const result = await create(mockData, mockTransaction);

    expect(businessEmailSubscriptions.create).toHaveBeenCalledWith(mockData, { transaction: mockTransaction });
    expect(result).toEqual(mockResult);
  });

  it('should throw error when creation fails', async () => {
    businessEmailSubscriptions.create.mockRejectedValue(new Error('DB Error'));

    await expect(create({ email: 'test@corp.com' }, {})).rejects.toThrow('DB Error');
  });
});
