jest.mock('pusher', () => {
    return jest.fn().mockImplementation(() => ({
        trigger: jest.fn()
    }));
});

const { createNotification } = require('../../notification');
const notification = require('../../../entities/notification');
const credentials = require('../../../entities/credential');

beforeEach(() => {
    jest.clearAllMocks();
    if (!notification.bulkCreate || !notification.bulkCreate.mockResolvedValue) {
        notification.bulkCreate = jest.fn();
    }
});

describe('createNotification', () => {
    it('should create notification for a single corporate user', async () => {
        const mockData = {
            notificationTitle: 'Test',
            notificationBrief: 'Brief',
            notificationCategory: 'CORPORATE',
            notificationBy: 'admin',
            notificationTo: 'user1'
        };
        notification.create.mockResolvedValue({ id: 1, ...mockData });

        const result = await createNotification(mockData);
        expect(result).toBeDefined();
        expect(notification.create).toHaveBeenCalledWith(mockData);
    });

    it('should bulk create notifications for array of corporate users', async () => {
        const mockData = {
            notificationTitle: 'Test',
            notificationBrief: 'Brief',
            notificationCategory: 'CORPORATE',
            notificationBy: 'admin',
            notificationTo: ['user1', 'user2']
        };
        notification.bulkCreate.mockResolvedValue([{ id: 1 }, { id: 2 }]);

        const result = await createNotification(mockData);
        expect(result).toHaveLength(2);
        expect(notification.bulkCreate).toHaveBeenCalled();
    });

    it('should create notifications for ALL users in a non-CORPORATE category', async () => {
        const mockData = {
            notificationTitle: 'Test',
            notificationBrief: 'Brief',
            notificationCategory: 'PARTNER',
            notificationBy: 'admin',
            notificationTo: 'ALL'
        };
        credentials.findAll.mockResolvedValue([
            { username: 'partner1' },
            { username: 'partner2' }
        ]);
        notification.bulkCreate.mockResolvedValue([{ id: 1 }, { id: 2 }]);

        const result = await createNotification(mockData);
        expect(result).toHaveLength(2);
        expect(credentials.findAll).toHaveBeenCalledWith({
            where: { role: 'PARTNER' },
            attributes: ['username']
        });
    });

    it('should handle errors gracefully', async () => {
        notification.create.mockRejectedValue(new Error('DB Error'));

        const result = await createNotification({
            notificationTitle: 'Test',
            notificationBrief: 'Brief',
            notificationCategory: 'CORPORATE',
            notificationBy: 'admin',
            notificationTo: 'user1'
        });
        expect(result).toBeUndefined();
    });
});
