const notification = require('../../../entities/notification');
const { findAllNotificationCount } = require('../../notification');
const { Op } = require('sequelize');

jest.mock('../../../entities/notification', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllNotificationCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    });

    it('should return count and data when notifications are found', async () => {
        const mockParams = {
            start: 0,
            from: '2024-01-01',
            to: '2024-12-31',
            length: 10,
            draw: 1,
            corporateId: 'corp1',
            searchText: 'Notification',
            order: 'DESC',
            column: 1,
        };
        
        const mockResult = { count: 5, rows: [
            { id: 1, notificationTitle: 'Notification 1' },
            { id: 2, notificationTitle: 'Notification 2' }
        ]};
        
        notification.findAndCountAll.mockResolvedValue(mockResult);
        
        const result = await findAllNotificationCount(...Object.values(mockParams));
        
        expect(result).toEqual(mockResult);
        expect(notification.findAndCountAll).toHaveBeenCalledWith({
            where: expect.objectContaining({
                createdAt: { [Op.between]: [mockParams.from, mockParams.to] },
                notificationTo: { [Op.or]: [mockParams.corporateId, 'ALL'] },
                [Op.or]: expect.arrayContaining([
                    expect.objectContaining({ id: expect.objectContaining({ [Op.like]: `%${mockParams.searchText}%` }) }),
                    expect.objectContaining({ notificationTitle: expect.objectContaining({ [Op.like]: `%${mockParams.searchText}%` }) }),
                    expect.objectContaining({ notificationBrief: expect.objectContaining({ [Op.like]: `%${mockParams.searchText}%` }) }),
                    expect.objectContaining({ notificationCategory: expect.objectContaining({ [Op.like]: `%${mockParams.searchText}%` }) }),
                    expect.objectContaining({ notificationTo: expect.objectContaining({ [Op.like]: `%${mockParams.searchText}%` }) }),
                    expect.objectContaining({ notificationBy: expect.objectContaining({ [Op.like]: `%${mockParams.searchText}%` }) }),
                ]),
            }),
            order: [['notificationTitle', mockParams.order]],
            limit: mockParams.length,
            offset: mockParams.start,
        });
        
    });

    it('should return count as 0 and empty data when no notifications are found', async () => {
        notification.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        
        const result = await findAllNotificationCount(0, '2024-01-01', '2024-12-31', 10, 1, 'corp1', 'test', 'ASC', 2);
        
        expect(result).toEqual({ count: 0, rows: [] });
        expect(notification.findAndCountAll).toHaveBeenCalled();
    });

    it('should handle errors and return undefined', async () => {
        const mockError = new Error('Database error');
        notification.findAndCountAll.mockRejectedValue(mockError);
        
        const result = await findAllNotificationCount(0, '2024-01-01', '2024-12-31', 10, 1, 'corp1', 'test', 'ASC', 2);
        
        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(mockError);
    });
});
