const cashback = require('../../../entities/cashback');
const { findOne } = require('../../cashback'); 
const { Op } = require('sequelize');

jest.mock('../../../entities/cashback', () => ({
  findOne: jest.fn(),
}));

describe('findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call cashback.findOne with correct parameters and return result', async () => {
    const params = {
      serviceOperatorId: 1,
      packageIds: [1, 2, 3]
    };
    const mockResult = { id: 1, packageId: 1, serviceOperatorId: 1, serviceStatus: true };

    cashback.findOne.mockResolvedValue(mockResult);

    const result = await findOne(params);

    expect(cashback.findOne).toHaveBeenCalledWith({
      where: {
        packageId: {
          [Op.in]: params.packageIds
        },
        serviceOperatorId: params.serviceOperatorId,
        serviceStatus: true,
      },
      raw: true
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle errors gracefully', async () => {
    const params = {
      serviceOperatorId: 1,
      packageIds: [1, 2, 3]
    };
    const errorMessage = 'Error retrieving cashback';

    cashback.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(findOne(params)).resolves.toBeUndefined(); 
  });
  
  it('should log messages correctly', async () => {
    const params = {
      serviceOperatorId: 1,
      packageIds: [1, 2, 3]
    };

    console.log = jest.fn();
    cashback.findOne.mockResolvedValue({});

    await findOne(params);

    expect(console.log).toHaveBeenCalledWith('CASHBACK FIND ONE ROUTE CALLED');
    expect(console.log).not.toHaveBeenCalledWith(expect.any(Error)); // Ensure no error is logged
  });
});
