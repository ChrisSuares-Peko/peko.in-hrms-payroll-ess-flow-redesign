const notification = require('../../../entities/notification');
const { deleteNotification } = require('../../notification')

jest.mock('../../../entities/notification', () => ({
  destroy: jest.fn(),
}))
describe('deleteNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete a notification for a given id', async () => {
    const mockResult = 1; // Mocking result of delete (1 row affected)
    const params = { id: 1 };
    
    notification.destroy.mockResolvedValue(mockResult);

    const result = await deleteNotification(params);

    expect(notification.destroy).toHaveBeenCalledWith({
      where: { id: params.id }
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle no notifications found for deletion', async () => {
    const mockResult = 0; // No rows affected
    const params = { id: 1 };
    
    notification.destroy.mockResolvedValue(mockResult);

    const result = await deleteNotification(params);

    expect(notification.destroy).toHaveBeenCalledWith({
      where: { id: params.id }
    });
    expect(result).toEqual(mockResult);
  });

 

  it('should handle invalid id input gracefully', async () => {
    const mockResult = 1; 
    const params = { id: '' }; 
    
    notification.destroy.mockResolvedValue(mockResult);

    const result = await deleteNotification(params);

    expect(notification.destroy).toHaveBeenCalledWith({
      where: { id: params.id }
    });
    expect(result).toEqual(mockResult);
  });
});
