const { bannersExports } = require('../../../use-cases/banners');
const banner = require('../../../entities/banners');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { formattedDateTime } = require('../../../../utils/formatter');

jest.mock('../../../entities/banners', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(),
}));

describe('bannersExports', () => {
    const mockParams = {
        from: '2023-09-01',
        to: '2023-09-10',
        searchText: 'test',
        sort: 'asc',
        deviceType: 'mobile',
        sortField: 'createdAt',
      };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted data when banners are fetched successfully', async () => {
        handleSortFields.mockReturnValue([['createdAt', 'asc']]);
        formattedDateTime.mockReturnValue('01-09-2023');
        banner.findAndCountAll.mockResolvedValue({
          rows: [
            {
              createdAt: '2023-09-01',
              bannerLink: 'http://example.com',
              deviceType: 'mobile',
              position: 'top',
              partnerId: 'partner1',
              bannerImage: 'image_url',
              status: 1,
            },
          ],
        });
    
        const result = await bannersExports(mockParams);
    
        expect(result).toEqual([
          {
            Date: '01-09-2023',
            'Banner Link': 'http://example.com',
            'Device Type': 'mobile',
            Position: 'top',
            'Partner Id': 'partner1',
            'Banner Image': 'image_url',
            Status: 'Active',
          },
        ]);
        expect(banner.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.any(Object),
            order: [['createdAt', 'asc']],
          })
        );
      });
    
      it('should return "Not Available" for missing fields in the data', async () => {
        formattedDateTime.mockReturnValue('Not Available');
        banner.findAndCountAll.mockResolvedValue({
          rows: [
            {
              createdAt: null,
              bannerLink: '',
              deviceType: '',
              position: '',
              partnerId: '',
              bannerImage: '',
              status: 0,
            },
          ],
        });
    
        const result = await bannersExports(mockParams);
    
        expect(result).toEqual([
          {
            Date: 'Not Available',
            'Banner Link': 'Not Available',
            'Device Type': 'Not Available',
            Position: 'Not Available',
            'Partner Id': 'Not Available',
            'Banner Image': 'Not Available',
            Status: 'In Active',
          },
        ]);
      });

    it('should handle errors and throw an appropriate message', async () => {
        const mockParams = { searchText: 'error' };
        const mockError = new Error('Database error');

        banner.findAndCountAll.mockRejectedValue(mockError);

        await expect(bannersExports(mockParams)).rejects.toEqual({
            message: 'Something went wrong',
        });
    });
});
