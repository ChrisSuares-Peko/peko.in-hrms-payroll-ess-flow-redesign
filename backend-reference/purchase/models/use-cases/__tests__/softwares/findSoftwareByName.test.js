const { findSoftwareByName } = require('../../softwares');
const softwares = require('../../../entities/softwares');

jest.mock('../../../entities/softwares');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findSoftwareByName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return software with specified name', async () => {
    const softwareName = 'Test Software';

    const mockResult = {
      productId: '7656',
      id: '123',
      name: 'Test Software',
      description: 'This is a test software.',
      image: 'test_image.png',
      pekoEmail: ['sachin12@yopmail.com'],
      sendMail: false,
      sendVendorMail: false,
      typeOfOrder: 'Subscription',
      features: 'Feature 1, Feature 2',
      discount: '10%',
      vendorId: 4964,
      categoryId: 53,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    softwares.findOne.mockResolvedValue(mockResult);

    const result = await findSoftwareByName(softwareName);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: softwareName },
      raw: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should return null when no record is found', async () => {
    const softwareName = 'Nonexistent Software';

    softwares.findOne.mockResolvedValue(null);

    const result = await findSoftwareByName(softwareName);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: softwareName },
      raw: true,
    });

    expect(result).toBeNull();
  });

  it('should handle errors and return false', async () => {
    const softwareName = 'Test Software';
    const expectedError = new Error('Database error');

    softwares.findOne.mockRejectedValue(expectedError);

    const result = await findSoftwareByName(softwareName);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: softwareName },
      raw: true,
    });

    expect(result).toBe(false);
  });

  it('should handle empty software name', async () => {
    const softwareName = '';

    // Mocking an empty software name to test if the function can handle it
    softwares.findOne.mockResolvedValue(null);

    const result = await findSoftwareByName(softwareName);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: softwareName },
      raw: true,
    });

    expect(result).toBeNull();
  });

  it('should handle undefined software name', async () => {
    const softwareName = undefined;

    // Mocking an undefined software name to test if the function can handle it
    softwares.findOne.mockResolvedValue(null);

    const result = await findSoftwareByName(softwareName);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { name: softwareName },
      raw: true,
    });

    expect(result).toBeNull();
  });
});
