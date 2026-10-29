const { create } = require('../../support');
const messages = require('../../../entities/support');
const { uploadFile } = require("../../../../utils/commonUploadFile");

jest.mock('../../../../utils/s3'); // Mock the S3 upload module
jest.mock('../../../entities/support'); // Mock the messages entity

jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));
jest.mock('../../../../utils/commonUploadFile', () => ({
  uploadFile: jest.fn(),
}));

describe('create', () => {
  beforeEach(() => {
    // Reset mocks to avoid interference between tests
    jest.clearAllMocks();
  });

  it('should create a message with a screenshot URL if screenshot is provided', async () => {
    const dummyUrl = 'https://dummyurl.com/screenshot.png';
    uploadFile.mockResolvedValue(dummyUrl);

    messages.create.mockResolvedValue({ /* mock the returned message object */ });

    const params = {
      screenshot: 'screenshot-data',
      screenshotImageFormat: 'png',
      otherField: 'some value',
    };

    const user = {
      role: 'Admin',
      username: 'testuser',
    };

     await create(params, user);

    expect(uploadFile).toHaveBeenCalledWith(
      params.screenshot,
      expect.stringContaining('admin/testuser/screenshot'),
      params.screenshotImageFormat
    );
    expect(params.screenshotImage).toBe(dummyUrl);
    expect(messages.create).toHaveBeenCalledWith(params);
  });

  it('should create a message without a screenshot URL if no screenshot is provided', async () => {
    messages.create.mockResolvedValue({ /* mock the returned message object */ });

    const params = {
      otherField: 'some value',
    };

    const user = {
      role: 'Admin',
      username: 'testuser',
    };

     await create(params, user);

    // Ensure screenshot-related fields are not present
    expect(params).not.toHaveProperty('screenshot');
    expect(params).not.toHaveProperty('screenshotImageFormat');

    // Expect that uploadFile is not called when there's no screenshot
    expect(uploadFile).not.toHaveBeenCalled();
    expect(messages.create).toHaveBeenCalledWith(params);
  });

  it('should handle errors from uploadFile', async () => {
    const errorMessage = 'S3 upload failed';
    uploadFile.mockRejectedValue(new Error(errorMessage));

    const params = {
      screenshot: 'screenshot-data',
      screenshotImageFormat: 'png',
      otherField: 'some value',
    };

    const user = {
      role: 'Admin',
      username: 'testuser',
    };

    await expect(create(params, user)).rejects.toThrow(errorMessage);

    expect(uploadFile).toHaveBeenCalled();
    expect(messages.create).not.toHaveBeenCalled();
  });

  it('should handle missing user object gracefully', async () => {
    const params = {
      screenshot: 'screenshot-data',
      screenshotImageFormat: 'png',
      otherField: 'some value',
    };

    // Mocking uploadFile to simulate a successful call
    uploadFile.mockResolvedValue('https://dummyurl.com/screenshot.png');

    // Assuming the create function handles null user gracefully
    messages.create.mockResolvedValue({ /* mock the returned message object */ });

     await create(params, null);

    expect(uploadFile).toHaveBeenCalled();
    expect(params.screenshotImage).toBeDefined();
    expect(messages.create).toHaveBeenCalledWith(params);
  });

  it('should handle missing role in user object', async () => {
    const dummyUrl = 'https://dummyurl.com/screenshot.png';
    uploadFile.mockResolvedValue(dummyUrl);

    messages.create.mockResolvedValue({ /* mock the returned message object */ });

    const params = {
      screenshot: 'screenshot-data',
      screenshotImageFormat: 'png',
      otherField: 'some value',
    };

    const user = {
      username: 'testuser',
    };

     await create(params, user);

    expect(uploadFile).toHaveBeenCalledWith(
      params.screenshot,
      expect.stringContaining('unknown-role/testuser/screenshot'),
      params.screenshotImageFormat
    );
    expect(params.screenshotImage).toBe(dummyUrl);
    expect(messages.create).toHaveBeenCalledWith(params);
  });

  it('should handle missing username in user object', async () => {
    const dummyUrl = 'https://dummyurl.com/screenshot.png';
    uploadFile.mockResolvedValue(dummyUrl);

    messages.create.mockResolvedValue({ /* mock the returned message object */ });

    const params = {
      screenshot: 'screenshot-data',
      screenshotImageFormat: 'png',
      otherField: 'some value',
    };

    const user = {
      role: 'Admin',
    };

     await create(params, user);

    expect(uploadFile).toHaveBeenCalledWith(
      params.screenshot,
      expect.stringContaining('admin/unknown-user/screenshot'),
      params.screenshotImageFormat
    );
    expect(params.screenshotImage).toBe(dummyUrl);
    expect(messages.create).toHaveBeenCalledWith(params);
  });
  
  it('should handle invalid screenshot format', async () => {
    const params = {
      screenshot: 'screenshot-data',
      screenshotImageFormat: 'invalid-format',
      otherField: 'some value',
    };

    const user = {
      role: 'Admin',
      username: 'testuser',
    };

    // Mocking uploadFile to simulate handling invalid formats
    uploadFile.mockImplementation(() => {
      throw new Error('Invalid screenshot format');
    });

    await expect(create(params, user)).rejects.toThrow('Invalid screenshot format');

    expect(uploadFile).toHaveBeenCalled();
    expect(messages.create).not.toHaveBeenCalled();
  });
});
