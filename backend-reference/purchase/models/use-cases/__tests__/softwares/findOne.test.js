const { findOne } = require('../../softwares');
const softwares = require('../../../entities/softwares');

jest.mock('../../../entities/softwares');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('find by id with specific attributes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return software with specified attributes', async () => {
    const productCode = 'ABC123';
    const attributes = [
      'id',
      'name',
      'description',
      'image',
      'typeOfOrder',
      'features',
      'discount',
    ];

    const mockResult = {
      id: 'ABC123',
      name: 'Test Software',
      description: 'This is a test software.',
      image: 'test_image.png',
      typeOfOrder: 'Subscription',
      features: 'Feature 1, Feature 2',
      discount: '10%',
    };

    softwares.findOne.mockResolvedValue(mockResult);

    const result = await findOne({ productCode }, attributes);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { id: productCode },
      attributes,
    });

    expect(result).toEqual(mockResult);
  });

  it('should return software with default attributes if none are specified', async () => {
    const productCode = 'ABC123';

    const mockResult = {
      id: 'ABC123',
      name: 'Test Software',
      description: 'This is a test software.',
      image: 'test_image.png',
      typeOfOrder: 'Subscription',
      features: 'Feature 1, Feature 2',
      discount: '10%',
    };

    softwares.findOne.mockResolvedValue(mockResult);

    const result = await findOne({ productCode });

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { id: productCode },
    });

    expect(result).toEqual(mockResult);
  });

  it('should handle cases where no record is found', async () => {
    const productCode = 'ABC123';

    softwares.findOne.mockResolvedValue(null);

    const result = await findOne({ productCode });

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { id: productCode },
    });

    expect(result).toBeNull();
  });

  it('should handle errors during query', async () => {
    const productCode = 'ABC123';
    const expectedError = new Error('Database error');

    softwares.findOne.mockRejectedValue(expectedError);

    let caughtError;
    try {
      await findOne({ productCode });
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toEqual(expectedError);

    expect(softwares.findOne).toHaveBeenCalledWith({
      where: { id: productCode },
    });
  });
  
  
});
