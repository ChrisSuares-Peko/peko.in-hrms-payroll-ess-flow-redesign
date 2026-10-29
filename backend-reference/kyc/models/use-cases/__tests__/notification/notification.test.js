jest.mock('pusher', () => {
    return jest.fn().mockImplementation(() => ({
        trigger: jest.fn()
    }));
});

const {
    createNotification,
    findOneNotification,
    findAllNotification,
    updateNotification,
    deleteNotification,
    resetNotification,
    getExcel
} = require('../../notification');
const notification = require('../../../entities/notification');

beforeEach(() => {
    jest.clearAllMocks();
    // Ensure bulkCreate is available as a mock
    if (!notification.bulkCreate || !notification.bulkCreate.mockResolvedValue) {
        notification.bulkCreate = jest.fn();
    }
});

describe('createNotification', () => {
    it('should create notification for single corporate user', async () => {
        const mockData = {
            notificationTitle: 'Test',
            notificationBrief: 'Test brief',
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
        expect(notification.bulkCreate).toHaveBeenCalled();
        expect(result).toHaveLength(2);
    });
});

describe('findOneNotification', () => {
    it('should find one notification by notificationId', async () => {
        const mockResult = { id: 1, notificationTitle: 'Test' };
        notification.findOne.mockResolvedValue(mockResult);

        const result = await findOneNotification({ notificationId: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('findAllNotification', () => {
    it('should find all notifications for a user', async () => {
        notification.count.mockResolvedValue(5);
        notification.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

        const result = await findAllNotification({ notificationTo: 'user1' });
        expect(result).toEqual({ count: 5, data: [{ id: 1 }, { id: 2 }] });
    });
});

describe('updateNotification', () => {
    it('should update a notification', async () => {
        notification.update.mockResolvedValue([1]);

        const result = await updateNotification({ id: 1 }, { flag: true });
        expect(result).toEqual([1]);
    });
});

describe('resetNotification', () => {
    it('should reset all notifications for a user', async () => {
        notification.update.mockResolvedValue([5]);

        const result = await resetNotification({ id: 'user1' });
        expect(result).toEqual([5]);
        expect(notification.update).toHaveBeenCalledWith(
            { flag: true },
            { where: { flag: 0, notificationTo: 'user1' } }
        );
    });
});

describe('deleteNotification', () => {
    it('should delete a notification', async () => {
        notification.destroy.mockResolvedValue(1);

        const result = await deleteNotification({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('getExcel', () => {
    it('should format notification data for Excel export', async () => {
        notification.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1,
                notificationTitle: 'Title',
                notificationBrief: 'Brief',
                notificationCategory: 'CORPORATE',
                notificationTo: 'user1',
                notificationBy: 'admin',
                createdAt: '2026-01-01'
            }]
        });

        const result = await getExcel({ from: '2026-01-01', to: '2026-12-31' });
        expect(result).toEqual([{
            'ID': 1,
            'Title': 'Title',
            'Breif': 'Brief',
            'Category': 'CORPORATE',
            'To': 'user1',
            'By': 'admin',
            'Created At': '2026-01-01'
        }]);
    });
});
