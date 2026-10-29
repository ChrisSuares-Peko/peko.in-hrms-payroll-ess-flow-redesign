const notification = require('../../../entities/notification');
const { updateNotification } = require('../../notification');

jest.mock('../../../entities/notification', () => ({
    update: jest.fn(),
}));

describe('updateNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    });

    it('should update notification successfully', async () => {
        const mockParams = { id: 1 };
        const mockData = { notificationTitle: 'Updated Title' };
        notification.update.mockResolvedValue([1]);
        
        const result = await updateNotification(mockParams, mockData);
        
        expect(result).toEqual([1]);
        expect(notification.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION UPDATE ROUTE CALLED");
    });

    it('should return undefined and log error on failure', async () => {
        const mockParams = { id: 2 };
        const mockData = { notificationTitle: 'Failed Update' };
        const mockError = new Error('Database error');
        notification.update.mockRejectedValue(mockError);
        
        const result = await updateNotification(mockParams, mockData);
        
        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("NOTIFICATION UPDATE ROUTE CALLED");
    });
});
