const { fetchAllBanners } = require('../../../use-cases/banners');
const banner = require('../../../entities/banners');
const { Op } = require('sequelize');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/banners', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('fetchAllBanners', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch banners with correct where clause and sort', async () => {
        const mockParams = {
            from: '2023-01-01',
            to: '2023-01-31',
            searchText: 'test',
            sort: 'ASC',
            limit: 10,
            offset: 0,
            deviceType: 'mobile',
            sortField: 'createdAt',
        };
    
        const mockResult = {
            rows: [
                { id: 1, bannerLink: 'test link', deviceType: 'mobile' },
                { id: 2, bannerLink: 'another test link', deviceType: 'mobile' },
            ],
            count: 2,
        };
    
        // Adjust the 'to' date to match the logic in fetchAllBanners
        const adjustedToDate = new Date('2023-01-31');
        adjustedToDate.setDate(adjustedToDate.getDate() + 1);
        adjustedToDate.setHours(0, 0, 0, 0);
    
       const expectedWhereClause = {
    [Op.or]: [
        { bannerLink: { [Op.like]: '%test%' } },
        { deviceType: { [Op.like]: '%test%' } },
        { partnerId: { [Op.like]: '%test%' } }, // Add this
    ],
    createdAt: {
        [Op.between]: ['2023-01-01', adjustedToDate],
    },
    deviceType: 'mobile',
};

    
        const expectedSort = [['createdAt', 'ASC']];
        handleSortFields.mockReturnValue(expectedSort);
        banner.findAndCountAll.mockResolvedValue(mockResult);
    
        const result = await fetchAllBanners(mockParams);
    
        expect(handleSortFields).toHaveBeenCalledWith('createdAt', 'ASC');
        expect(banner.findAndCountAll).toHaveBeenCalledWith({
            where: expectedWhereClause,
            order: [expectedSort],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });
    

    it('should fetch banners without date range or deviceType', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'DESC',
            limit: 5,
            offset: 0,
            sortField: 'createdAt',
        };

        const mockResult = {
            rows: [{ id: 1, bannerLink: 'test link', deviceType: 'desktop' }],
            count: 1,
        };

       const expectedWhereClause = {
    [Op.or]: [
        { bannerLink: { [Op.like]: '%test%' } },
        { deviceType: { [Op.like]: '%test%' } },
        { partnerId: { [Op.like]: '%test%' } }, // Add this
    ],
};


        const expectedSort = [['createdAt', 'DESC']];
        handleSortFields.mockReturnValue(expectedSort);
        banner.findAndCountAll.mockResolvedValue(mockResult);

        const result = await fetchAllBanners(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith('createdAt', 'DESC');
        expect(banner.findAndCountAll).toHaveBeenCalledWith({
            where: expectedWhereClause,
            order: [expectedSort],
            limit: 5,
            offset: 0,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should handle no results found', async () => {
        const mockParams = {
            searchText: 'non-existent',
            sort: 'ASC',
            limit: 10,
            offset: 0,
            sortField: 'createdAt',
        };

        const mockResult = {
            rows: [],
            count: 0,
        };

      const expectedWhereClause = {
    [Op.or]: [
        { bannerLink: { [Op.like]: '%non-existent%' } },
        { deviceType: { [Op.like]: '%non-existent%' } },
        { partnerId: { [Op.like]: '%non-existent%' } }, // Add this
    ],
};


        const expectedSort = [['createdAt', 'ASC']];
        handleSortFields.mockReturnValue(expectedSort);
        banner.findAndCountAll.mockResolvedValue(mockResult);

        const result = await fetchAllBanners(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith('createdAt', 'ASC');
        expect(banner.findAndCountAll).toHaveBeenCalledWith({
            where: expectedWhereClause,
            order: [expectedSort],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should handle errors during fetch', async () => {
        const mockParams = {
            searchText: 'error',
            sort: 'ASC',
            limit: 10,
            offset: 0,
            sortField: 'createdAt',
        };

        const mockError = new Error('Database error');
        banner.findAndCountAll.mockRejectedValue(mockError);

        await expect(fetchAllBanners(mockParams)).rejects.toThrow('Database error');
        expect(banner.findAndCountAll).toHaveBeenCalled();
    });
});
