const { createBulkSoftwares } = require('../../../use-cases/softwares');
const softwares = require('../../../entities/softwares');


jest.mock('../../../entities/softwares', () => ({
  create: jest.fn()
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

describe('createBulkSoftwares', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a software and return the created product', async () => {
    const params = {
      TID: 0,
      productId: '223',
      name: 'Sachin123',
      description: 'Lots of things to say',
      discount: '12',
      features: 'Lots of features',
      pekoEmail: ['sachin123@yopmail.com'],
      sendMail: false,
      typeOfOrder: 'MANUAL',
      vendor: 'Subscriptions',
      category: 'Office Suite',
      status: true,
      errors: [],
      vendorId: 13,
      categoryId: 47
    };

    const mockResponse = {
      sold_quantity: 0,
      sendVendorMail: false,
      id: 143,
      productId: '223',
      name: 'Sachin123',
      description: 'Lots of things to say',
      discount: '12',
      features: 'Lots of features',
      pekoEmail: ['sachin123@yopmail.com'],
      sendMail: false,
      typeOfOrder: 'MANUAL',
      status: true,
      vendorId: 13,
      categoryId: 47,
      updatedAt: new Date(),
      createdAt: new Date()
    };

    softwares.create.mockResolvedValue(mockResponse);

    const result = await createBulkSoftwares(params);

    expect(softwares.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResponse);
  });

  it('should handle cases where the software creation fails and returns false', async () => {
    const params = {
      TID: 0,
      productId: '223',
      name: 'Sachin123',
      description: 'Lots of things to say',
      discount: '12',
      features: 'Lots of features',
      pekoEmail: ['sachin123@yopmail.com'],
      sendMail: false,
      typeOfOrder: 'MANUAL',
      vendor: 'Subscriptions',
      category: 'Office Suite',
      status: true,
      errors: [],
      vendorId: 13,
      categoryId: 47
    };

    softwares.create.mockResolvedValue(null); 

    const result = await createBulkSoftwares(params);

    expect(softwares.create).toHaveBeenCalledWith(params);
    expect(result).toBe(false);
  });

  it('should handle invalid parameters gracefully', async () => {
    const params = null

    const result = await createBulkSoftwares(params);

    expect(result).toBe(false);
  });

  it('should handle errors thrown during software creation', async () => {
    const params = {
        TID: 0,
        productId: '223',
        name: 'Sachin123',
        description: 'Lots of things to say',
        discount: '12',
        features: 'Lots of features',
        pekoEmail: ['sachin123@yopmail.com'],
        sendMail: false,
        typeOfOrder: 'MANUAL',
        vendor: 'Subscriptions',
        category: 'Office Suite',
        status: true,
        errors: [],
        vendorId: 13,
        categoryId: 47
    };

    const expectedError = new Error('Creation failed');
    
    // Mock the function to reject with an error
    softwares.create.mockRejectedValue(expectedError);

    // Test if the function rejects with the expected error
    await expect(createBulkSoftwares(params)).rejects.toEqual(expectedError);
});

});
