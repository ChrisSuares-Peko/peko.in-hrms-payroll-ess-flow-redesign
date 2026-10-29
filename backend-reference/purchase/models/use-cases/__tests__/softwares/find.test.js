const { find } = require('../../softwares'); 
const softwares = require('../../../entities/softwares');

jest.mock('../../../entities/softwares');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('find', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return software with specified name', async () => {
    const name = 'Test Software';

    const mockResult = {
      id: '123',
      name: 'Test Software',
      description: 'This is a test software.',
      image: 'test_image.png',
      features: 'Feature 1, Feature 2',
      pekoEmail: ['sachin12@yopmail.com'],
      sendMail: false,
      sendVendorMail: false,
      typeOfOrder: 'MANUAL',
      vendorId: 4964,
      categoryId: 53,
      discount: '10%',
      productId: '7656',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    softwares.findOne.mockResolvedValue(mockResult);

    const result = await find(name);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: name },
    });

    expect(result).toEqual(mockResult);
  });

  it('should return null when no record is found', async () => {
    const name = 'Nonexistent Software';

    softwares.findOne.mockResolvedValue(null);

    const result = await find(name);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: name },
    });

    expect(result).toBeNull();
  });

  it('should handle errors during the query and return false', async () => {
    const name = 'Test Software';
    const expectedError = new Error('Database query error');
    
    
    softwares.findOne.mockRejectedValue(expectedError);
    
    await expect(find(name)).rejects.toEqual(expectedError);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: name },
    });
  });

  it('should handle empty name', async () => {
    const name = '';

    softwares.findOne.mockResolvedValue(null);

    const result = await find(name);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: name },
    });

    expect(result).toBeNull();
  });

  it('should handle undefined name', async () => {
    const name = undefined;

    // Mocking an undefined name to test if the function can handle it
    softwares.findOne.mockResolvedValue(null);

    const result = await find(name);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: name },
    });

    expect(result).toBeNull();
  });
});
