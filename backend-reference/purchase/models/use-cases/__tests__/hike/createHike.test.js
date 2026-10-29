const { createHike } = require('../../hike');
const hike = require('../../../entities/hike');

jest.mock('../../../entities/hike');

jest.mock("../../../entities/subCorporateUsers", () => ({
  hasOne: jest.fn(), // Mock `hasOne` method
  belongsTo: jest.fn(),
}));
describe('createHike', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const validHikeData = {
    name: 'Test Hike',
    salaryAmount: 5000,
    salaryValidation: 'LESS_THAN',
    features: 'Feature 1, Feature 2',
    planType: 'MONTHLY',
    partners: 'Partner 1, Partner 2',
    logo: 'logo.png',
    amount: 100,
  };

  it('should create a hike successfully', async () => {
    hike.create.mockResolvedValue({ id: 1, ...validHikeData });

    const result = await createHike(validHikeData);

    expect(result).toEqual({
      success: true,
      message: 'Hike created successfully',
      data: expect.objectContaining(validHikeData),
    });
    expect(hike.create).toHaveBeenCalledWith(validHikeData);
  });

  it('should return error when required fields are missing', async () => {
    const invalidData = { ...validHikeData, name: undefined };

    const result = await createHike(invalidData);

    expect(result).toEqual({
      success: false,
      message: 'Missing required fields',
    });
    expect(hike.create).not.toHaveBeenCalled();
  });

  it('should return error when hike creation fails', async () => {
    hike.create.mockResolvedValue(null);

    const result = await createHike(validHikeData);

    expect(result).toEqual({
      success: false,
      message: 'Failed to create hike',
    });
    expect(hike.create).toHaveBeenCalledWith(validHikeData);
  });

  it('should handle unexpected errors', async () => {
    hike.create.mockRejectedValue(new Error('Database error'));

    const result = await createHike(validHikeData);

    expect(result).toEqual({
      success: false,
      message: 'An error occurred while creating the hike',
    });
    expect(hike.create).toHaveBeenCalledWith(validHikeData);
  });

  it('should log missing fields when required fields are missing', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    const invalidData = { ...validHikeData, name: undefined, amount: undefined };

    await createHike(invalidData);

    expect(consoleLogSpy).toHaveBeenCalledWith({
      success: false,
      message: 'Missing required fields',
      missingFields: ['name', 'amount'],
    });
  });

  it('should log error when hike creation fails', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    hike.create.mockResolvedValue(null);

    await createHike(validHikeData);

    expect(consoleLogSpy).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to create hike',
    });
  });

  it('should log error when an unexpected error occurs', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const error = new Error('Unexpected error');
    hike.create.mockRejectedValue(error);

    await createHike(validHikeData);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating hike:', error);
  });
});
