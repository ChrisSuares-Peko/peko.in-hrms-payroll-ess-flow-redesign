const disableService = require('../../../entities/disabledService');
const {findOne} = require('../../disableService'); 

jest.mock('../../../entities/disabledService', () => ({
  findOne: jest.fn(),
}));

describe('findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock history before each test
  });

  it('should call disableService.findOne with the correct parameters', async () => {
    const params = { credentialId: '12345', serviceOperatorId: '67890' };
    const expectedResponse = { credentialId: '12345', serviceOperatorId: '67890' };

    disableService.findOne.mockResolvedValue(expectedResponse);

    const result = await findOne(params);

    expect(disableService.findOne).toHaveBeenCalledWith({
      where: {
       
        serviceOperatorId: params.serviceOperatorId,
      },
    });
    expect(result).toEqual(expectedResponse);
  });
  it('should handle errors', async () => {
    const params = { credentialId: '12345', serviceOperatorId: '67890' };
    const mockError = new Error('Database error');

    disableService.findOne.mockRejectedValue(mockError);

    await expect(findOne(params)).rejects.toThrow('Database error');
  });
});
