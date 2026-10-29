const notification = require('../../../entities/notification');
const { findAllNotification } = require('../../notification');
const { Op } = require('sequelize');

jest.mock('../../../entities/notification', () => ({
    count: jest.fn(),
    findAll: jest.fn(),
}));

describe('findAllNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    });

    it('should return count and data when notifications are found', async () => {
        const mockParams = { notificationTo: 'user1' };
        const mockCount = 5;
        const mockData = [
            { id: 1, title: 'Notification 1' },
            { id: 2, title: 'Notification 2' }
        ];

        notification.count.mockResolvedValue(mockCount);
        notification.findAll.mockResolvedValue(mockData);

        const result = await findAllNotification(mockParams);

        expect(result).toEqual({ count: mockCount, data: mockData });
        expect(notification.count).toHaveBeenCalledWith({
            where: {
                notificationTo: {
                    [Op.or]: [mockParams.notificationTo, 'ALL'], // ✅ Use Op.or instead of "$or"
                },
                flag: 0,
            },
        });
        
        expect(notification.findAll).toHaveBeenCalledWith({
            where: {
                notificationTo: {
                   [Op.or]: [mockParams.notificationTo, 'ALL']
                },
                flag: {
                    [Op.eq]: 0
                },
            },
            order: [['createdAt', 'DESC']]
        });
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION FIND ALL ROUTE CALLED");
    });

    it('should return count as 0 and empty data when no notifications are found', async () => {
        const mockParams = { notificationTo: 'user2' };
        notification.count.mockResolvedValue(0);
        notification.findAll.mockResolvedValue([]);

        const result = await findAllNotification(mockParams);

        expect(result).toEqual({ count: 0, data: [] });
        expect(notification.count).toHaveBeenCalled();
        expect(notification.findAll).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION FIND ALL ROUTE CALLED");
    });

    it('should handle errors and return undefined', async () => {
        const mockParams = { notificationTo: 'user3' };
        const mockError = new Error('Database error');
        notification.count.mockRejectedValue(mockError);

        const result = await findAllNotification(mockParams);

        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION FIND ALL ROUTE CALLED");
    });
});
