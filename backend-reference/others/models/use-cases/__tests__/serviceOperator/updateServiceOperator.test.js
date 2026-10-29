const { updateServiceOperator } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

const STORED = {
  commissionMode: 'MARGIN',
  commissionType: 'PERCENTAGE',
  providerCommission: '2.0000',
  fixedCommissionPerTransaction: '0.0000',
  isCommissionInclGST: 1,
};

describe('updateServiceOperator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    serviceOperator.findOne.mockResolvedValue(STORED);
  });

  it('should update a service operator with the provided data', async () => {
    const mockParams = { id: 1 };
    const mockData = { name: 'Updated Service Operator', serviceStatus: false };
    const mockResult = [1]; // Sequelize update method returns an array with the number of affected rows

    serviceOperator.update.mockResolvedValue(mockResult);

    const result = await updateServiceOperator(mockParams, mockData);

    expect(serviceOperator.findOne).not.toHaveBeenCalled();
    expect(serviceOperator.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });

    expect(result).toEqual(mockResult);
  });

  it('should keep the commission confirmed when the form re-sends the same values', async () => {
    serviceOperator.update.mockResolvedValue([1]);
    const form = { serviceProvider: 'Visa', commissionMode: 'MARGIN', commissionType: 'PERCENTAGE', providerCommission: 2, fixedCommissionPerTransaction: 0, isCommissionInclGST: true };

    await updateServiceOperator({ id: 1 }, form);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      attributes: ['commissionMode', 'commissionType', 'providerCommission', 'fixedCommissionPerTransaction', 'isCommissionInclGST'],
      raw: true,
    });
    expect(serviceOperator.update).toHaveBeenCalledWith(form, { where: { id: 1 } });
  });

  it('should put the commission back under review when a value changed', async () => {
    serviceOperator.update.mockResolvedValue([1]);
    const form = { serviceProvider: 'Visa', commissionType: 'PERCENTAGE', providerCommission: 3, isCommissionConfigured: true };

    await updateServiceOperator({ id: 1 }, form);

    expect(serviceOperator.update).toHaveBeenCalledWith(
      { serviceProvider: 'Visa', commissionType: 'PERCENTAGE', providerCommission: 3, isCommissionConfigured: false },
      { where: { id: 1 } }
    );
  });

  it('should return 0 if no rows are updated', async () => {
    const mockParams = { id: 999 };
    const mockData = { name: 'Nonexistent Service Operator' };
    const mockResult = [0]; // No rows affected

    serviceOperator.update.mockResolvedValue(mockResult);

    const result = await updateServiceOperator(mockParams, mockData);

    expect(serviceOperator.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if the update fails', async () => {
    const mockParams = { id: 1 };
    const mockData = { name: 'Error Service Operator' };
    const mockError = new Error('Database error');

    serviceOperator.update.mockRejectedValue(mockError);

    await expect(updateServiceOperator(mockParams, mockData)).rejects.toThrow(
      'Database error'
    );

    expect(serviceOperator.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
  });
});
