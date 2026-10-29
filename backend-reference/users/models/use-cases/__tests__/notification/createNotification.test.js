const notification = require('../../../entities/notification')
const credentials = require('../../../entities/credential')
const { createNotification } = require('../../notification')

jest.mock('../../../entities/notification', () => ({
    bulkCreate: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../../entities/credential', () => ({
    findAll: jest.fn()
}));
jest.mock('pusher', () => {
    return jest.fn().mockImplementation(() => ({
        trigger: jest.fn()
    }));
});

describe('createNotification', () => {
     beforeEach(() => {
         jest.clearAllMocks();
         jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
     });

    it('should handle bulk creation for corporate notifications with array', async () => {
        const data = {
            notificationCategory: 'CORPORATE',
            notificationTo: ['user1', 'user2'],
            notificationTitle: 'Title',
            notificationBrief: 'Brief',
            notificationBy: 'Admin'
        };
        const createdData = [{ id: 1 }, { id: 2 }];
        notification.bulkCreate.mockResolvedValue(createdData);

        const result = await createNotification(data);

        expect(result).toEqual(createdData);
        expect(notification.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ notificationTo: 'user1' }),
            expect.objectContaining({ notificationTo: 'user2' })
        ]));
        // expect(pusher.trigger).toHaveBeenCalledTimes(2);
        // expect(pusher.trigger).toHaveBeenCalledWith('push-notification', 'real-time-notification', { body: 'user1' });
        // expect(pusher.trigger).toHaveBeenCalledWith('push-notification', 'real-time-notification', { body: 'user2' });
    });

    it('should handle single creation for corporate notification with string', async () => {
        const data = {
            notificationCategory: 'CORPORATE',
            notificationTo: 'user1',
            notificationTitle: 'Title',
            notificationBrief: 'Brief',
            notificationBy: 'Admin'
        };
        const createdData = { id: 1 };
        notification.create.mockResolvedValue(createdData);

        const result = await createNotification(data);

        expect(result).toEqual(createdData);
        expect(notification.create).toHaveBeenCalledWith(data);
        // expect(pusher.trigger).toHaveBeenCalledWith('push-notification', 'real-time-notification', { body: 'user1' });
    });

    it('should handle bulk creation for non-corporate notifications to all', async () => {
        const data = {
            notificationCategory: 'USER',
            notificationTo: 'ALL',
            notificationTitle: 'Title',
            notificationBrief: 'Brief',
            notificationBy: 'Admin'
        };
        const customerOutletNames = [{ username: 'user1' }, { username: 'user2' }];
        const createdData = [{ id: 1 }, { id: 2 }];
        credentials.findAll.mockResolvedValue(customerOutletNames);
        notification.bulkCreate.mockResolvedValue(createdData);

        const result = await createNotification(data);

        expect(result).toEqual(createdData);
        expect(credentials.findAll).toHaveBeenCalledWith({
            where: { role: 'USER' },
            attributes: ["username"]
        });
        expect(notification.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ notificationTo: 'user1' }),
            expect.objectContaining({ notificationTo: 'user2' })
        ]));
    });

    it('should handle invalid notification category', async () => {
        const data = {
            notificationCategory: 'INVALID',
            notificationTo: 'SOME_USER',
            notificationTitle: 'Title',
            notificationBrief: 'Brief',
            notificationBy: 'Admin'
        };

        const result = await createNotification(data);

        expect(result).toBeUndefined();
    });

    it('should handle errors in catch block', async () => {
        const data = {
            notificationCategory: 'CORPORATE',
            notificationTo: 'user1',
            notificationTitle: 'Title',
            notificationBrief: 'Brief',
            notificationBy: 'Admin'
        };
        const error = new Error('Some error');
        notification.create.mockRejectedValue(error);

        await createNotification(data);

        expect(console.log).toHaveBeenCalledWith("ERROR BLOCK - ", error);
    });

    it('should log function call', async () => {
        const data = {
            notificationCategory: 'CORPORATE',
            notificationTo: 'user1',
            notificationTitle: 'Title',
            notificationBrief: 'Brief',
            notificationBy: 'Admin'
        };

        await createNotification(data);

        expect(console.log).toHaveBeenCalledWith("NOTIFICATION CREATE ROUTE CALLED");
    });
});
