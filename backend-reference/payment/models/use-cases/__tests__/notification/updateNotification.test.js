const { updateNotification } = require('../../notification'); // Update the path
const notification = require('../../../entities/notification'); // Update with the correct path

jest.mock('../../../entities/notification'); // Mock the notification model

describe('updateNotification function', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should successfully update a notification by ID', async () => {
    // Mock parameters and data
    const mockParams = { id: 1 };
    const mockData = { title: 'Updated Title', read: true };

    // Mock response from notification.update
    const mockResponse = [1]; // Sequelize returns an array where the first element is the number of affected rows
    notification.update.mockResolvedValue(mockResponse);

    // Call the function
    const result = await updateNotification(mockParams, mockData);

    // Assertions
    expect(notification.update).toHaveBeenCalledTimes(1);
    expect(notification.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should log an error if notification.update fails', async () => {
    // Mock parameters and data
    const mockParams = { id: 1 };
    const mockData = { title: 'Updated Title', read: true };

    // Mock error
    const mockError = new Error('Database error');
    notification.update.mockRejectedValue(mockError);

    // Mock console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Call the function
    await expect(updateNotification(mockParams, mockData)).resolves.toBeUndefined();

    // Assertions
    expect(notification.update).toHaveBeenCalledTimes(1);
    expect(notification.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);

    // Cleanup
    consoleLogSpy.mockRestore();
  });

  it('should log a message when the finally block is executed', async () => {
    // Mock parameters and data
    const mockParams = { id: 1 };
    const mockData = { title: 'Updated Title', read: true };

    // Mock response from notification.update
    notification.update.mockResolvedValue([1]);

    // Mock console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Call the function
    await updateNotification(mockParams, mockData);

    // Assertions
    expect(consoleLogSpy).toHaveBeenCalledWith('NOTIFICATION UPDATE ROUTE CALLED');

    // Cleanup
    consoleLogSpy.mockRestore();
  });

  it('should handle invalid input gracefully', async () => {
    // Mock invalid parameters and data
    const mockParams = null;
    const mockData = null;

    // Mock console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Call the function
    await expect(updateNotification(mockParams, mockData)).resolves.toBeUndefined();

    // Assertions
    expect(notification.update).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('NOTIFICATION UPDATE ROUTE CALLED');

    // Cleanup
    consoleLogSpy.mockRestore();
  });
});
