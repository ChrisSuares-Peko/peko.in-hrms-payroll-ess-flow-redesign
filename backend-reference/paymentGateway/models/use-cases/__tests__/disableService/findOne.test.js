const { findOne } = require('../../disableService');
const disableService = require('../../../entities/disabledService');

jest.mock('../../../entities/disabledService', () => ({
  findOne: jest.fn(),
}));

describe('disableService - findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return disabled service when found', async () => {
    const mockResult = { id: 1, credentialId: 'C1', serviceOperatorId: 'SO1' };
    disableService.findOne.mockResolvedValue(mockResult);

    const result = await findOne({ credentialId: 'C1', serviceOperatorId: 'SO1' });

    expect(disableService.findOne).toHaveBeenCalledWith({
      where: { credentialId: 'C1', serviceOperatorId: 'SO1' },
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    disableService.findOne.mockResolvedValue(null);

    const result = await findOne({ credentialId: 'C1', serviceOperatorId: 'SO1' });

    expect(result).toBeNull();
  });

  it('should throw error when DB fails', async () => {
    disableService.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOne({ credentialId: 'C1', serviceOperatorId: 'SO1' })).rejects.toThrow('DB Error');
  });
});
