const { create } = require('../../../use-cases/softwares_subscriptions_plans'); 
const { uploadFile } = require('../../../../utils/commonUploadFile'); 
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans'); 

jest.mock('../../../../utils/commonUploadFile');  
jest.mock('../../../entities/softwares_subscriptions_plans'); 

jest.mock("@logtail/node", () => ({
  Logtail: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
  })),
}));
describe('create function', () => {
  const mockParamsWithImage = {
    image: 'mock-image-data',
    imageFormat: 'png',
    someOtherField: 'value',
  };

  const mockParamsWithoutImage = {
    someOtherField: 'value',
  };

  const mockS3Url = 'https://mock-s3-url.com/image.png';

  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  it('should upload image to S3 and create a new record when image and format are provided', async () => {
    uploadFile.mockResolvedValue(mockS3Url);  
    softwares_subscriptions_plans.create.mockResolvedValue(mockParamsWithImage); 

    const result = await create(mockParamsWithImage);

    expect(uploadFile).toHaveBeenCalledWith(
      mockParamsWithImage.image,
      expect.stringContaining('softwares_subscriptions/plans'),
      mockParamsWithImage.imageFormat
    );

  
    expect(softwares_subscriptions_plans.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockParamsWithImage,
        image_url: mockS3Url, 
      })
    );

    expect(result).toEqual(mockParamsWithImage);  
  });

  it('should create a new record without uploading image when no image is provided', async () => {
    softwares_subscriptions_plans.create.mockResolvedValue(mockParamsWithoutImage); 

    const result = await create(mockParamsWithoutImage);

    expect(uploadFile).not.toHaveBeenCalled(); 
    expect(softwares_subscriptions_plans.create).toHaveBeenCalledWith(mockParamsWithoutImage);
    expect(result).toEqual(mockParamsWithoutImage);  
  });

  it('should handle errors and return false', async () => {
    const mockError = new Error('Test error');
    softwares_subscriptions_plans.create.mockRejectedValue(mockError); 

    console.log = jest.fn();  

    const result = await create(mockParamsWithImage);

    expect(console.log).toHaveBeenCalledWith(mockError.message);  
    expect(result).toBe(false); 
  });
});
