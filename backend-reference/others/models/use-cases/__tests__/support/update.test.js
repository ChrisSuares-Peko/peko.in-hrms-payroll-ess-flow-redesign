const { update } = require('../../support'); 
const messages = require('../../../entities/support');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../../utils/commonUploadFile', () => ({
  uploadFile: jest.fn()
}));
jest.mock('../../../entities/support'); // Mock the messages entity
jest.mock('../../../entities/corporateUser',()=>({
    hasMany: jest.fn()
}));

describe('update', () => {
  beforeEach(() => {
    // Reset mocks to avoid interference between tests
    jest.clearAllMocks();
  });

  it('should update a message and upload a screenshot if screenshot is provided', async () => {
    const dummyUrl = 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/test%2Fadmin%2Ftestuser%2Fscreenshot%2Fd9fee839-54ad-4c9f-93a6-d9e3d2657f57.png?alt=media&token=d9fee839-54ad-4c9f-93a6-d9e3d2657f57';
    uploadFile.mockResolvedValue(dummyUrl);

    messages.update.mockResolvedValue([1]); // Mocking update to simulate a successful update

    const params = {
      id: 123,
    };

    const data = {
      screenshot: 'screenshot-data',
      screenshotImageFormat: 'png',
      otherField: 'some value',
    };

    const user = {
      role: 'Admin',
      username: 'testuser',
    };

     await update(params, data, user);

    expect(uploadFile).toHaveBeenCalledWith(
      data.screenshot,
      expect.stringContaining('admin/testuser/screenshot'),
      data.screenshotImageFormat
    );

    expect(data.screenshotImage).toBe(dummyUrl);

    expect(messages.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
  });

  it('should update a message without uploading a screenshot if no screenshot is provided', async () => {
    messages.update.mockResolvedValue([1]); // Mocking update to simulate a successful update

    const params = {
      id: 123,
    };

    const data = {
      otherField: 'some value',
    };

    const user = {
      role: 'Admin',
      username: 'testuser',
    };

     await update(params, data, user);

    expect(uploadFile).not.toHaveBeenCalled();
    expect(messages.update).toHaveBeenCalledWith(data, {
      where: {
        id: params.id,
      },
    });
  });
});
