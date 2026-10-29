const notification = require('../../../entities/notification');
const { getExcel } = require('../../notification');
const { Op } = require('sequelize');

jest.mock('../../../entities/notification', () => ({
    findAndCountAll: jest.fn(),
}));

describe('getExcel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted data when notifications are found', async () => {
        const mockParams = { from: '2024-01-01', to: '2024-01-31' };
        const mockData = {
            rows: [
                {
                    id: 1,
                    notificationTitle: 'Test Title',
                    notificationBrief: 'Test Brief',
                    notificationCategory: 'Test Category',
                    notificationTo: 'User',
                    notificationBy: 'Admin',
                    createdAt: '2024-01-15',
                },
                {
                    id: 2,
                    notificationTitle: null,
                    notificationBrief: null,
                    notificationCategory: null,
                    notificationTo: null,
                    notificationBy: null,
                    createdAt: null,
                }
            ],
            count: 2
        };

        notification.findAndCountAll.mockResolvedValue(mockData);

        const result = await getExcel(mockParams);

        expect(notification.findAndCountAll).toHaveBeenCalledWith({
            where: {
                createdAt: {
                    [Op.between]: [mockParams.from, mockParams.to],
                },
            },
            raw: true,
        });

        expect(result).toEqual([
            {
                'ID': 1,
                'Title': 'Test Title',
                'Breif': 'Test Brief',
                'Category': 'Test Category',
                'To': 'User',
                'By': 'Admin',
                'Created At': '2024-01-15',
            },
            {
                'ID': 2,
                'Title': 'Not Available',
                'Breif': 'Not Available',
                'Category': 'Not Available',
                'To': 'Not Available',
                'By': 'Not Available',
                'Created At': 'Not Available',
            }
        ]);
    });

    it('should return an empty array when no notifications are found', async () => {
        const mockParams = { from: '2024-02-01', to: '2024-02-28' };
        notification.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        const result = await getExcel(mockParams);

        expect(notification.findAndCountAll).toHaveBeenCalledWith({
            where: {
                createdAt: {
                    [Op.between]: [mockParams.from, mockParams.to],
                },
            },
            raw: true,
        });

        expect(result).toEqual([]);
    });

    
});
