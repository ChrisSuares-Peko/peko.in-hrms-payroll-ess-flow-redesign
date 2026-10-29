const { update } = require('../../../use-cases/softwares'); // Adjust path
const softwares = require('../../../entities/softwares'); // Adjust path
const { uploadFile } = require('../../../../utils/commonUploadFile'); 

jest.mock('../../../entities/softwares', () => ({
    update: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update software with image upload', async () => {
        const mockParams = { id: 1 };
        const mockData = { image: 'base64data', imageFormat: 'png' };
        const mockUser = { role: 'ADMIN', username: 'testuser' };
        const mockPublicUrl = 'http://s3.amazonaws.com/bucket/path/image.png';

        uploadFile.mockResolvedValue(mockPublicUrl);
        softwares.update.mockResolvedValue([1]); // One row updated

        const result = await update(mockParams, mockData, mockUser);

       expect(uploadFile).toHaveBeenCalledWith(
  "base64data",
  `admin/testuser/softwares/image`,
  mockData.imageFormat
);

        expect(softwares.update).toHaveBeenCalledWith(
            { ...mockData, image: mockPublicUrl }, // Image URL added to data
            { where: { id: mockParams.id } }
        );
        expect(result).toEqual([1]);
    });

    it('should update software without image upload', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Software' };
        const mockUser = { role: 'ADMIN', username: 'testuser' };

        softwares.update.mockResolvedValue([1]);

        const result = await update(mockParams, mockData, mockUser);

        expect(uploadFile).not.toHaveBeenCalled();
        expect(softwares.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(result).toEqual([1]);
    });

    it('should update sold_quantity correctly', async () => {
        const mockParams = { id: 1 };
        const mockData = { sold_quantity: 5 };
        const mockUser = { role: 'ADMIN', username: 'testuser' };
        const mockSoftware = { sold_quantity: 10 }; // Initial quantity

        softwares.findOne.mockResolvedValue(mockSoftware);
        softwares.update.mockResolvedValue([1]);

        const result = await update(mockParams, mockData, mockUser);

        expect(softwares.findOne).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(softwares.update).toHaveBeenCalledWith(
            { sold_quantity: 15 }, // Incremented quantity
            { where: { id: mockParams.id } }
        );
        expect(result).toEqual([1]);
    });

    it('should handle errors during database operations (update)', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Software' };
        const mockUser = { role: 'ADMIN', username: 'testuser' };
        const mockError = new Error('Database error');

        softwares.update.mockRejectedValue(mockError);

        const result = await update(mockParams, mockData, mockUser);

        expect(softwares.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(result).toBe(false);
    });

        it('should handle errors during database operations (findOne)', async () => {
        const mockParams = { id: 1 };
        const mockData = { sold_quantity: 5 };
        const mockUser = { role: 'ADMIN', username: 'testuser' };
        const mockError = new Error('Database error');

        softwares.findOne.mockRejectedValue(mockError);

        const result = await update(mockParams, mockData, mockUser);

        expect(softwares.findOne).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(result).toBe(false);
    });

   

    it('should handle undefined user role', async () => {
      const mockParams = { id: 1 };
      const mockData = { image: 'base64data', imageFormat: 'png' };
      const mockUser = { username: 'testuser' }; // No role
      const mockPublicUrl = 'http://s3.amazonaws.com/bucket/path/image.png';

      uploadFile.mockResolvedValue(mockPublicUrl);
      softwares.update.mockResolvedValue([1]); // One row updated

      const result = await update(mockParams, mockData, mockUser);

    expect(uploadFile).toHaveBeenCalledWith(
  "base64data",
  `unknown-role/testuser/softwares/image`,
  mockData.imageFormat
);

      expect(softwares.update).toHaveBeenCalledWith(
          { ...mockData, image: mockPublicUrl }, // Image URL added to data
          { where: { id: mockParams.id } }
      );
      expect(result).toEqual([1]);
  });

  it('should handle undefined user name', async () => {
    const mockParams = { id: 1 };
    const mockData = { image: 'base64data', imageFormat: 'png' };
    const mockUser = { role: 'ADMIN' }; // No name
    const mockPublicUrl = 'http://s3.amazonaws.com/bucket/path/image.png';

    uploadFile.mockResolvedValue(mockPublicUrl);
    softwares.update.mockResolvedValue([1]); // One row updated

    const result = await update(mockParams, mockData, mockUser);

   expect(uploadFile).toHaveBeenCalledWith(
  "base64data",
  `admin/unknown-user/softwares/image`,
  mockData.imageFormat
);

    expect(softwares.update).toHaveBeenCalledWith(
        { ...mockData, image: mockPublicUrl }, // Image URL added to data
        { where: { id: mockParams.id } }
    );
    expect(result).toEqual([1]);
});
});