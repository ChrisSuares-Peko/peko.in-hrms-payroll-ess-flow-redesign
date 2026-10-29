const { create } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/giftCards', () => ({
  create: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
  uploadFile: jest.fn(),
}));

describe('create gift card use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload image and create gift card successfully', async () => {
    const mockParams = {
      name: 'Amazon Gift Card',
      brand_logo: {
        imageBase: 'base64string',
        imageFormat: 'png'
      }
    };

    uploadFile.mockResolvedValue('uploaded/path/logo.png');

    const mockGiftCard = { id: 1, name: mockParams.name, brand_logo: 'uploaded/path/logo.png' };
    giftCards.create.mockResolvedValue(mockGiftCard);

    const result = await create(mockParams);

    expect(uploadFile).toHaveBeenCalledWith(
      'base64string',
      'GiftCards/brand_logo',
      'png'
    );

    expect(giftCards.create).toHaveBeenCalledWith({
      name: 'Amazon Gift Card',
      brand_logo: 'uploaded/path/logo.png'
    });

    expect(result).toEqual(mockGiftCard);
  });

  it('should create a gift card without uploading if brand_logo is not an object', async () => {
    const mockParams = { name: 'Amazon', brand_logo: 'existing/path.png' };
    const mockGiftCard = { id: 1, ...mockParams };

    giftCards.create.mockResolvedValue(mockGiftCard);

    const result = await create(mockParams);

    expect(uploadFile).not.toHaveBeenCalled();
    expect(giftCards.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockGiftCard);
  });

  it('should return false if gift card creation returns null', async () => {
    const mockParams = { name: 'Amazon', brand_logo: 'existing/path.png' };

    giftCards.create.mockResolvedValue(null);

    const result = await create(mockParams);

    expect(result).toBe(false);
  });

  it('should return false if an error occurs', async () => {
    const mockParams = { name: 'Amazon', brand_logo: 'existing/path.png' };

    giftCards.create.mockRejectedValue(new Error('DB Error'));

    const result = await create(mockParams);

    expect(result).toBe(false);
  });
});
