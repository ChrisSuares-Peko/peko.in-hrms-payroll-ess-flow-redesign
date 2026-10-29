const { findProduct } = require('../../softwares'); 
const Softwares = require('../../../entities/softwares');

jest.mock('../../../entities/softwares');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findProduct Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return a product by productId', async () => {
    const params = { productId: '7656' };
  
    const expectedResult = {
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
  
    Softwares.findOne.mockResolvedValue(expectedResult);
  
    const result = await findProduct(params);
  
    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: params
    });
    expect(result).toEqual(expectedResult);
  });
  it('should find and return a product by a unique field', async () => {
    const params = { name: 'Example Software' };

    const expectedResult = {
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

    Softwares.findOne.mockResolvedValue(expectedResult);

    const result = await findProduct(params);

    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: params
    });
    expect(result).toEqual(expectedResult);
  });

  it('should return null if no software is found', async () => {
    const params = { name: 'Example Software' };

    Softwares.findOne.mockResolvedValue(null);

    const result = await findProduct(params);

    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: params
    });
    expect(result).toBeNull();
  });

  it('should handle errors and throw a custom error message', async () => {
    const params = { productId: 'EX123' };

    const error = new Error('Something went wrong');
    Softwares.findOne.mockRejectedValue(error);

    await expect(findProduct(params)).rejects.toEqual(error);

    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: params
    });
  });
  
  

  it('should find and return a product by multiple fields', async () => {
    const params = { name: 'Sachin', categoryId: 53 };
  
    const expectedResult = {
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
  
    Softwares.findOne.mockResolvedValue(expectedResult);
  
    const result = await findProduct(params);
  
    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: params
    });
    expect(result).toEqual(expectedResult);
  });
  
  it('should return null if a parameter field is null', async () => {
    const params = { name: null };
  
    const expectedResult = null;
  
    Softwares.findOne.mockResolvedValue(expectedResult);
  
    const result = await findProduct(params);
  
    expect(Softwares.findOne).toHaveBeenCalledWith({
      where: { name: null }
    });
    expect(result).toBeNull();
  });
  
});
