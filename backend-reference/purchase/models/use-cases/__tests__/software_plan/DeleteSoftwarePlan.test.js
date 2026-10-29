const { Delete } = require('../../software_plan');
const software_plan = require('../../../entities/software_plans');

jest.mock('../../../entities/software_plans', () => ({
  destroy: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

describe('Delete Software Plan Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the software and return the result', async () => {
    const params = { productCode: '1234' };

    software_plan.destroy.mockResolvedValue(1); 

    const result = await Delete(params);

    expect(software_plan.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
    expect(result).toBe(1); 
  });

  it('should handle errors and return false', async () => {
    const params = { productCode: '1234' };
    const error = new Error('Deletion failed');
  
    // Mock the destroy function to reject with the expected error
    software_plan.destroy.mockRejectedValue(error);
  
    // Test that the Delete function rejects with the expected error
    await expect(Delete(params)).rejects.toThrow(error);
  
    // Ensure the destroy method was called with the correct parameters
    expect(software_plan.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
  });
  

  it('should return 0 if no record is found to delete', async () => {
    const params = { productCode: '9999' };
  
    software_plan.destroy.mockResolvedValue(0); 
  
    const result = await Delete(params);
  
    expect(software_plan.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
    expect(result).toBe(0); 
  });

  it('should delete multiple records if applicable', async () => {
    const params = { productCode: '1234' };
  
    software_plan.destroy.mockResolvedValue(3); 
  
    const result = await Delete(params);
  
    expect(software_plan.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
    expect(result).toBe(3); 
  });
  
  it('should handle network or timeout issues', async () => {
    const params = { productCode: '1234' };
  
    const networkError = new Error('Network timeout');
    software_plan.destroy.mockRejectedValue(networkError);
  
    // Test that the Delete function rejects with the expected network error
    await expect(Delete(params)).rejects.toThrow(networkError);
  
    // Ensure the destroy method was called with the correct parameters
    expect(software_plan.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
  });
  
  
});
