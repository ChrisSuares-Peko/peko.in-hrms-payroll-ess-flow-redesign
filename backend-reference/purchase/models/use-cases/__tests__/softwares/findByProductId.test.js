const { findByProductId } = require('../../../use-cases/softwares');
const Softwares = require('../../../entities/softwares');

jest.mock('../../../entities/softwares');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findByProductId Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return software by productId', async () => {
    const productId = '7656';
    const expectedSoftware = {
      productId: '7656',
      name: 'Sachin',
      description: 'My description',
      features: 'Lots of features',
      image: 's3://test/softwares/Cloud.png',
      pekoEmail: ['sachin12@yopmail.com'],
      sendMail: false,
      sendVendorMail: false,
      typeOfOrder: 'MANUAL',
      vendorId: 4964,
      categoryId: 53,
      discount: '10%',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Softwares.findOne.mockResolvedValue(expectedSoftware);

    const result = await findByProductId(productId);

    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: { productId }
    });
    expect(result).toEqual(expectedSoftware);
  });

  it('should return null if no software is found', async () => {
    const productId = '9999';

    Softwares.findOne.mockResolvedValue(null);

    const result = await findByProductId(productId);

    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: { productId }
    });
    expect(result).toBeNull();
  });

  it('should handle errors by findOne', async () => {
    const productId = '7656';
    const expectedError = new Error('Error occurred while finding software.');

    // Mock the function to reject with an error
    Softwares.findOne.mockRejectedValue(expectedError);

    // Test if the function rejects with the expected error
    await expect(findByProductId(productId)).rejects.toEqual(expectedError);

    // Check if the findOne function was called with the correct parameters
    expect(Softwares.findOne).toHaveBeenCalledWith({
        where: { productId }
    });
});


  it('should handle large dataset gracefully', async () => {
    const productId = '7656';
  
    const largeDataset = Array(1000).fill({
      productId,
      name: 'Large Dataset Product',
      description: 'Description',
      features: 'Features',
      image: 's3://test/softwares/LargeDataset.png',
      pekoEmail: ['large@dataset.com'],
      sendMail: false,
      sendVendorMail: false,
      typeOfOrder: 'MANUAL',
      vendorId: 8888,
      categoryId: 99,
      discount: '50%',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  
    Softwares.findOne.mockResolvedValue(largeDataset[0]);
  
    const result = await findByProductId(productId);
  
    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: { productId }
    });
    expect(result).toEqual(largeDataset[0]);
  });

  it('should handle timeout scenarios gracefully', async () => {
    const productId = '7656';
  
    jest.useFakeTimers(); // Mock timers
    Softwares.findOne.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(null), 5000))); // Simulate long execution
  
    const resultPromise = findByProductId(productId);
  
    jest.runAllTimers(); // Fast-forward timers
    await expect(resultPromise).resolves.toBeNull();
  
    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: { productId }
    });
  });


  
});
