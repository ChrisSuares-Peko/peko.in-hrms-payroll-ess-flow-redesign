const notification = require('../../../entities/notification');
const { resetNotification } = require('../../notification');

jest.mock('../../../entities/notification', () => ({
    update: jest.fn(),
}));

describe('resetNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    });

    it('should update notification flag successfully', async () => {
        const mockParams = { id: 1 };
        notification.update.mockResolvedValue([1]); // Simulating successful update

        const result = await resetNotification(mockParams);

        expect(result).toEqual([1]);
        expect(notification.update).toHaveBeenCalledWith(
            { flag: true },
            { where: { flag: 0, notificationTo: mockParams.id } }
        );
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION UPDATE ROUTE CALLED");
    });

    it('should return undefined and log error on failure', async () => {
        const mockParams = { id: 2 };
        const mockError = new Error('Database error');
        notification.update.mockRejectedValue(mockError);

        const result = await resetNotification(mockParams);

        expect(result).toBeUndefined();
        expect(notification.update).toHaveBeenCalledWith(
            { flag: true },
            { where: { flag: 0, notificationTo: mockParams.id } }
        );
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION UPDATE ROUTE CALLED");
    });
});
