const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { markApplicationPaid } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findOne: jest.fn(),
}));

describe('governmentServicesApplication markApplicationPaid use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the application found by vendor application id', async () => {
    const instance = { update: jest.fn().mockResolvedValue({ id: 1, paymentStatus: 'SUCCESS' }) };
    governmentServicesApplication.findOne.mockResolvedValue(instance);
    const data = { paymentStatus: 'SUCCESS', amount: 4999 };

    const result = await markApplicationPaid('9001', data);

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({ where: { applicationId: '9001' } });
    expect(instance.update).toHaveBeenCalledWith(data);
    expect(result).toEqual({ id: 1, paymentStatus: 'SUCCESS' });
  });

  it('should throw when the application is not found', async () => {
    governmentServicesApplication.findOne.mockResolvedValue(null);

    await expect(markApplicationPaid('0000', {})).rejects.toThrow('Application not found');
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findOne.mockRejectedValue(new Error('DB error'));

    await expect(markApplicationPaid('9001', {})).rejects.toThrow('DB error');
  });
});
