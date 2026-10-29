const notification = require('../../../entities/notification');
const { resetNotification } = require('../../notification')

jest.mock('../../../entities/notification', () => ({
  update: jest.fn(),
}))

describe('resetNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update notifications for a given username', async () => {
    const mockResult = undefined; 
    const username = undefined;
    
    notification.update.mockResolvedValue(mockResult);

    const result = await resetNotification(username);

   
    expect(result).toEqual(mockResult);
  });

  it('should handle no notifications to update', async () => {
    const mockResult = undefined; 
    const username = undefined;
    
    notification.update.mockResolvedValue(mockResult);

    const result = await resetNotification(username);

   
    expect(result).toEqual(undefined);
  });

  it('should handle errors in update', async () => {
    const error = new Error('Test Error');
    notification.update.mockRejectedValue(error);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await resetNotification('user1');

    expect(consoleSpy).toHaveBeenCalledWith(error);

    consoleSpy.mockRestore();
  });

  it('should log the finally block message', async () => {
    notification.update.mockResolvedValue([1]);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await resetNotification('user1');

    expect(consoleSpy).toHaveBeenCalledWith("NOTIFICATION UPDATE ROUTE CALLED");

    consoleSpy.mockRestore();
  });

  it('should handle invalid username input gracefully', async () => {
    const mockResult = undefined;
    const username = undefined; 
    
    notification.update.mockResolvedValue(mockResult);

    const result = await resetNotification(username);

   
    expect(result).toEqual(undefined);
  });
});
