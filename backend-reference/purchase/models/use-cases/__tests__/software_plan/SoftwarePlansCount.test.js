const { SoftwarePlansCount } = require('../../software_plan'); 
const software_plans = require('../../../entities/software_plans'); 

jest.mock('../../../entities/software_plans', () => ({
  count: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

describe('SoftwarePlansCount Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the count of software plans for the given productCode', async () => {
    const productCode = 'ACR';
    const expectedCount = 5;

    software_plans.count.mockResolvedValue(expectedCount);

    const result = await SoftwarePlansCount({ productCode });

    expect(software_plans.count).toHaveBeenCalledWith({
      where: {
        softwareId: productCode
      }
    });
    expect(result).toEqual(expectedCount);
  });

  it('should handle errors and throw an appropriate error message', async () => {
    const productCode = 'ACR';
    const expectedError = new Error('Error occurred while counting software plans');

    software_plans.count.mockRejectedValue(expectedError);

    await expect(SoftwarePlansCount({ productCode })).rejects.toEqual(expectedError);
    
    expect(software_plans.count).toHaveBeenCalledWith({
      where: {
        softwareId: productCode
      }
    });
  });
  it('should handle an empty productCode parameter', async () => {
    const productCode = '';
    const expectedCount = 0; 
  
    software_plans.count.mockResolvedValue(expectedCount);
  
    const result = await SoftwarePlansCount({ productCode });
  
    expect(software_plans.count).toHaveBeenCalledWith({
      where: {
        softwareId: productCode
      }
    });
    expect(result).toEqual(expectedCount);
  });
  
  it('should handle an undefined productCode parameter', async () => {
    const productCode = undefined;
    const expectedCount = 0; 
  
    software_plans.count.mockResolvedValue(expectedCount);
  
    const result = await SoftwarePlansCount({ productCode });
  
    expect(software_plans.count).toHaveBeenCalledWith({
      where: {
        softwareId: productCode
      }
    });
    expect(result).toEqual(expectedCount);
  });

  it('should handle a large number of records', async () => {
    const productCode = 'LARGE_NUMBER';
    const expectedCount = 1000000; 
  
    software_plans.count.mockResolvedValue(expectedCount);
  
    const result = await SoftwarePlansCount({ productCode });
  
    expect(software_plans.count).toHaveBeenCalledWith({
      where: {
        softwareId: productCode
      }
    });
    expect(result).toEqual(expectedCount);
  });
  
});
