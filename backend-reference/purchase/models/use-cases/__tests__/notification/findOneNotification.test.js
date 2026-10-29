const notification = require('../../../entities/notification');
const { findOneNotification } = require('../../notification');

jest.mock('../../../entities/notification', () => ({
    findOne: jest.fn(),
}));

describe('findOneNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    });

    it('should return the notification when found', async () => {
        const mockParams = { notificationId: '12345' };
        const mockNotification = { id: '12345', title: 'Test Notification' };
        notification.findOne.mockResolvedValue(mockNotification);

        const result = await findOneNotification(mockParams);

        expect(result).toEqual(mockNotification);
        expect(notification.findOne).toHaveBeenCalledWith({
            where: { notificationId: mockParams.notificationId }
        });
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION FIND ONE ROUTE CALLED");
    });

    it('should return undefined when no notification is found', async () => {
        const mockParams = { notificationId: '99999' };
        notification.findOne.mockResolvedValue(null);

        const result = await findOneNotification(mockParams);

        expect(result).toBeNull();
        expect(notification.findOne).toHaveBeenCalledWith({
            where: { notificationId: mockParams.notificationId }
        });
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION FIND ONE ROUTE CALLED");
    });

    it('should handle errors and return undefined', async () => {
        const mockParams = { notificationId: '12345' };
        const mockError = new Error('Database error');
        notification.findOne.mockRejectedValue(mockError);

        const result = await findOneNotification(mockParams);

        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION FIND ONE ROUTE CALLED");
    });
});
