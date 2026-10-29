const { createNotification } = require('../../../use-cases/notification');
const notification = require('../../../entities/notification');
const credentials = require('../../../entities/credential');

jest.mock('../../../entities/notification', () => ({
    bulkCreate: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
    findAll: jest.fn(),
}));


describe('createNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create multiple notifications when notificationTo is an array for CORPORATE category', async () => {
        const mockData = {
            notificationTitle: 'Test Title',
            notificationBrief: 'Test Brief',
            notificationCategory: 'CORPORATE',
            notificationBy: 'Admin',
            notificationTo: ['user1', 'user2'],
        };

        const mockCreatedData = [{ id: 1 }, { id: 2 }];

        notification.bulkCreate.mockResolvedValue(mockCreatedData);

        const result = await createNotification(mockData);

        expect(notification.bulkCreate).toHaveBeenCalledWith([
            {
                notificationTitle: 'Test Title',
                notificationBrief: 'Test Brief',
                notificationCategory: 'CORPORATE',
                notificationBy: 'Admin',
                notificationTo: 'user1',
            },
            {
                notificationTitle: 'Test Title',
                notificationBrief: 'Test Brief',
                notificationCategory: 'CORPORATE',
                notificationBy: 'Admin',
                notificationTo: 'user2',
            },
        ]);

        
        expect(result).toEqual(mockCreatedData);
    });

    it('should create a single notification when notificationTo is a string for CORPORATE category', async () => {
        const mockData = {
            notificationTitle: 'Test Title',
            notificationBrief: 'Test Brief',
            notificationCategory: 'CORPORATE',
            notificationBy: 'Admin',
            notificationTo: 'user1',
        };

        const mockCreatedData = { id: 1 };

        notification.create.mockResolvedValue(mockCreatedData);

        const result = await createNotification(mockData);

        expect(notification.create).toHaveBeenCalledWith(mockData);
      

        expect(result).toEqual(mockCreatedData);
    });

    it('should create multiple notifications when notificationTo is "ALL" and fetches users from credentials', async () => {
        const mockData = {
            notificationTitle: 'Test Title',
            notificationBrief: 'Test Brief',
            notificationCategory: 'CUSTOMER',
            notificationBy: 'Admin',
            notificationTo: 'ALL',
        };

        const mockUsers = [{ username: 'user1' }, { username: 'user2' }];
        credentials.findAll.mockResolvedValue(mockUsers);

        const mockCreatedData = [{ id: 1 }, { id: 2 }];
        notification.bulkCreate.mockResolvedValue(mockCreatedData);

        const result = await createNotification(mockData);

        expect(credentials.findAll).toHaveBeenCalledWith({
            where: { role: 'CUSTOMER' },
            attributes: ['username'],
        });

        expect(notification.bulkCreate).toHaveBeenCalledWith([
            {
                notificationTitle: 'Test Title',
                notificationBrief: 'Test Brief',
                notificationCategory: 'CUSTOMER',
                notificationBy: 'Admin',
                notificationTo: 'user1',
            },
            {
                notificationTitle: 'Test Title',
                notificationBrief: 'Test Brief',
                notificationCategory: 'CUSTOMER',
                notificationBy: 'Admin',
                notificationTo: 'user2',
            },
        ]);

        expect(result).toEqual(mockCreatedData);
    });

    it('should log an error when an exception occurs', async () => {
        const mockData = {
            notificationTitle: 'Test Title',
            notificationBrief: 'Test Brief',
            notificationCategory: 'CORPORATE',
            notificationBy: 'Admin',
            notificationTo: 'user1',
        };

        const mockError = new Error('Database error');

        notification.create.mockRejectedValue(mockError);

        console.log = jest.fn();

        await expect(createNotification(mockData)).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith('ERROR BLOCK - ', mockError);
    });

    it('should log "NOTIFICATION CREATE ROUTE CALLED" in the finally block', async () => {
        const mockData = {
            notificationTitle: 'Test Title',
            notificationBrief: 'Test Brief',
            notificationCategory: 'CORPORATE',
            notificationBy: 'Admin',
            notificationTo: 'user1',
        };

        notification.create.mockResolvedValue({ id: 1 });

        console.log = jest.fn();

        await createNotification(mockData);

        expect(console.log).toHaveBeenCalledWith('NOTIFICATION CREATE ROUTE CALLED');
    });
});
