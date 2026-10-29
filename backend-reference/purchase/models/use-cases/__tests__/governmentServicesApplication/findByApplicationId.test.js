const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { findByApplicationId } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findOne: jest.fn(),
}));

describe('governmentServicesApplication findByApplicationId use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find an application by vendor application id', async () => {
    const mockResult = { id: 1, applicationId: '9001' };
    governmentServicesApplication.findOne.mockResolvedValue(mockResult);

    const result = await findByApplicationId('9001');

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({ where: { applicationId: '9001' } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    governmentServicesApplication.findOne.mockResolvedValue(null);

    expect(await findByApplicationId('0000')).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findByApplicationId('9001')).rejects.toThrow('DB error');
  });
});
