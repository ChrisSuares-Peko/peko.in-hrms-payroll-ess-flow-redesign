const notification = require('../../../entities/notification')
// const credentials = require('../../../entities/credential')
const { createNotification } = require('../../notification')

jest.mock('../../../entities/notification', () => ({
    bulkCreate: jest.fn(),
    create: jest.fn()
}));
jest.mock('../../../entities/credential', () => ({
    findAll: jest.fn()
}));
jest.mock('pusher', () => {
    const trigger = jest.fn();
    const PusherMock = jest.fn().mockImplementation(() => ({ trigger }));
    PusherMock.__trigger = trigger;
    return PusherMock;
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

    describe('ALL recipient scoping', () => {
        const credentials = require('../../../entities/credential');

        const broadcast = {
            notificationCategory: 'CORPORATE',
            notificationTo: 'ALL',
            notificationTitle: 'Title',
            notificationBrief: 'Brief',
            notificationBy: 'ADMIN'
        };

        const whereUsedForLookup = () => credentials.findAll.mock.calls[0][0].where;

        beforeEach(() => {
            credentials.findAll.mockResolvedValue([]);
            notification.bulkCreate.mockResolvedValue([]);
        });

        it("scopes to a partner's corporates when a partnerId is given", async () => {
            await createNotification(broadcast, null, 42);

            expect(whereUsedForLookup()).toEqual({ role: 'CORPORATE', registeredBy: 42 });
        });

        it('scopes to corporates with no partner when partnerId is null', async () => {
            await createNotification(broadcast, null, null);

            expect(whereUsedForLookup()).toEqual({ role: 'CORPORATE', registeredBy: null });
        });

        it('reaches every corporate when no partnerId argument is passed', async () => {
            await createNotification(broadcast);

            expect(whereUsedForLookup()).toEqual({ role: 'CORPORATE' });
        });

        it('still stores the notification when the realtime push throws', async () => {
            const mockTrigger = require('pusher').__trigger;
            credentials.findAll.mockResolvedValue([{ username: 'acme', registeredBy: 42 }]);
            mockTrigger.mockImplementation(() => {
                throw new Error('pusher down');
            });

            await createNotification(broadcast, null, 42);

            expect(notification.bulkCreate).toHaveBeenCalledWith([
                expect.objectContaining({ notificationTo: 'acme' }),
            ]);
            mockTrigger.mockReset();
        });
    });
});
