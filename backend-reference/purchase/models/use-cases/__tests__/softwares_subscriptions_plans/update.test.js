const { update } = require('../../../use-cases/softwares_subscriptions_plans');  
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans');  
const { uploadFile } = require('../../../../utils/commonUploadFile'); 

jest.mock('../../../entities/softwares_subscriptions_plans');  
jest.mock('../../../../utils/commonUploadFile');  
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('update function', () => {
  const mockParams = { id: 1 };
  
  const mockDataWithImage = {
    image: 'mock-image-data',
    imageFormat: 'png',
    someOtherField: 'new-value',
  };

  const mockDataWithoutImage = {
    someOtherField: 'new-value',
  };

  const mockS3Url = 'https://mock-s3-url.com/image.png';
  
  beforeEach(() => {
    jest.clearAllMocks();  
  });

  it('should upload image to S3 and update the record when image and format are provided', async () => {
    uploadFile.mockResolvedValue(mockS3Url);  
    softwares_subscriptions_plans.update.mockResolvedValue([1]);  

    const result = await update(mockParams, mockDataWithImage);

    expect(uploadFile).toHaveBeenCalledWith(
      mockDataWithImage.image,
      expect.stringContaining('softwares_subscriptions/plans'),
      mockDataWithImage.imageFormat
    );
    expect(softwares_subscriptions_plans.update).toHaveBeenCalledWith({
      ...mockDataWithImage,
      image_url: mockS3Url,  
    }, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual([1]);  
  });

  it('should update the record without uploading image when no image is provided', async () => {
    softwares_subscriptions_plans.update.mockResolvedValue([1]);  

    const result = await update(mockParams, mockDataWithoutImage);

    expect(uploadFile).not.toHaveBeenCalled();  
    expect(softwares_subscriptions_plans.update).toHaveBeenCalledWith(mockDataWithoutImage, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual([1]);  
  });

  it('should handle errors and return false', async () => {
    const mockError = new Error('Test error');
    softwares_subscriptions_plans.update.mockRejectedValue(mockError);  
    console.log = jest.fn();  

    const result = await update(mockParams, mockDataWithImage);

    expect(console.log).toHaveBeenCalledWith(mockError.message);  
    expect(result).toBe(false);  
  });

  it('should not call S3 upload if imageFormat is missing', async () => {
    const mockDataWithoutFormat = {
      image: 'mock-image-data',
      someOtherField: 'new-value',
    };

    softwares_subscriptions_plans.update.mockResolvedValue([1]);

    const result = await update(mockParams, mockDataWithoutFormat);

    expect(uploadFile).not.toHaveBeenCalled();  
    expect(softwares_subscriptions_plans.update).toHaveBeenCalledWith(mockDataWithoutFormat, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual([1]);
  });

 
});
