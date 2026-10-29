const { create } = require('../../../use-cases/softwares_subscriptions');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/softwares_subscriptions'); // Mocking the entity
jest.mock('../../../../utils/commonUploadFile'); // Mocking S3 utility
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('create software subscription', () => {
  const mockParams = {
    name: 'Basic Plan',
    image: Buffer.from('test-image-data'), // Assuming image is a Buffer or File object
    imageFormat: 'png',
    monthlyPrice: 10,
    yearlyPrice: 100,
    descriptions: 'Basic subscription plan',
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks before each test
  });

  it('should upload the image and create a subscription', async () => {
    const mockImageUrl = 'https://example.com/image.png';
    uploadFile.mockResolvedValue(mockImageUrl); // Mock the S3 upload

    softwares_subscriptions.create.mockResolvedValue({ id: 1, ...mockParams, image: mockImageUrl });

    const result = await create(mockParams);

    // Check the call to uploadFile with correct arguments
    expect(uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer), // Expect a Buffer object as the first argument
      expect.stringContaining('softwares_subscriptions'), // Check if the path contains the expected string
      mockParams.imageFormat // This should be 'png'
    );

    expect(softwares_subscriptions.create).toHaveBeenCalledWith({ ...mockParams, image: mockImageUrl });
    expect(result).toEqual({ id: 1, ...mockParams, image: mockImageUrl }); // Expect the created subscription to be returned
  });


  it('should create a subscription without uploading an image', async () => {
    const paramsWithoutImage = { ...mockParams, image: undefined, imageFormat: undefined };

    softwares_subscriptions.create.mockResolvedValue({ id: 2, ...paramsWithoutImage });

    const result = await create(paramsWithoutImage);

    expect(uploadFile).not.toHaveBeenCalled(); // Ensure uploadFile is not called
    expect(softwares_subscriptions.create).toHaveBeenCalledWith(paramsWithoutImage); // Check create call
    expect(result).toEqual({ id: 2, ...paramsWithoutImage }); // Expect the created subscription to be returned
  });

  it('should handle errors during creation', async () => {
    const mockError = new Error('Database error');
    softwares_subscriptions.create.mockRejectedValue(mockError); // Mock rejection

    const result = await create(mockParams);

    expect(uploadFile).toHaveBeenCalled(); // Ensure upload is attempted
    expect(softwares_subscriptions.create).toHaveBeenCalled(); // Ensure create is attempted
    expect(result).toBe(false); // Expect the function to return false on error
  });
});
