const notification = require('../../../entities/notification');
const { deleteNotification } = require('../../notification');

jest.mock('../../../entities/notification', () => ({
    destroy: jest.fn(),
}));

describe('deleteNotification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    });

    it('should delete notification successfully', async () => {
        const mockParams = { id: 1 };
        notification.destroy.mockResolvedValue(1); // Simulating successful deletion
        
        const result = await deleteNotification(mockParams);
        
        expect(result).toEqual(1);
        expect(notification.destroy).toHaveBeenCalledWith({ where: { id: mockParams.id } });
    });
    it('should return 0 if no notification was deleted', async () => {
        const mockParams = { id: 3 };
        notification.destroy.mockResolvedValue(0); // Simulating no record found
        
        const result = await deleteNotification(mockParams);
        
        expect(result).toEqual(0);
        expect(notification.destroy).toHaveBeenCalledWith({ where: { id: mockParams.id } });
    });
    
});
