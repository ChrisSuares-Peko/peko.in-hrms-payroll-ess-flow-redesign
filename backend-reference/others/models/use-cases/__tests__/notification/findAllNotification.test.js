const { Op } = require('sequelize');
const notification = require('../../../entities/notification');
const credentials = require('../../../entities/credential');
const { findAllNotification } = require('../../notification');

jest.mock('../../../entities/notification', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

const buildWhere = (username, userCreatedAt) => ({
  [Op.or]: [
    { notificationTo: username },
    { notificationTo: 'ALL', createdAt: { [Op.gte]: userCreatedAt } },
  ],
});

describe('findAllNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve notifications using the provided userCreatedAt cutoff', async () => {
    const userCreatedAt = new Date('2024-08-01T00:00:00.000Z');
    const mockCount = 10;
    const mockData = [{ id: 1, title: 'Test Notification' }];

    notification.count.mockResolvedValue(mockCount);
    notification.findAll.mockResolvedValue(mockData);

    const result = await findAllNotification('user1', userCreatedAt);

    expect(credentials.findOne).not.toHaveBeenCalled();
    expect(notification.count).toHaveBeenCalledWith({
      where: { ...buildWhere('user1', userCreatedAt), flag: 0 },
    });
    expect(notification.findAll).toHaveBeenCalledWith({
      where: buildWhere('user1', userCreatedAt),
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    expect(result).toEqual({
      count: mockCount,
      data: mockData,
    });
  });

  it("should resolve the cutoff from the user's own credential when userCreatedAt is not provided", async () => {
    const credentialCreatedAt = new Date('2024-09-15T10:00:00.000Z');
    credentials.findOne.mockResolvedValue({ createdAt: credentialCreatedAt });
    notification.count.mockResolvedValue(2);
    notification.findAll.mockResolvedValue([{ id: 3 }]);

    const result = await findAllNotification('subuser@mail.com');

    expect(credentials.findOne).toHaveBeenCalledWith({
      where: { username: 'subuser@mail.com' },
      attributes: ['createdAt'],
    });
    expect(notification.count).toHaveBeenCalledWith({
      where: { ...buildWhere('subuser@mail.com', credentialCreatedAt), flag: 0 },
    });
    expect(notification.findAll).toHaveBeenCalledWith({
      where: buildWhere('subuser@mail.com', credentialCreatedAt),
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    expect(result).toEqual({ count: 2, data: [{ id: 3 }] });
  });

  it('should fall back to the current date when the credential is not found', async () => {
    credentials.findOne.mockResolvedValue(null);
    notification.count.mockResolvedValue(0);
    notification.findAll.mockResolvedValue([]);

    const result = await findAllNotification('ghost-user');

    expect(notification.findAll).toHaveBeenCalledWith({
      where: buildWhere('ghost-user', expect.any(Date)),
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    expect(result).toEqual({ count: 0, data: [] });
  });

  it('should handle errors in count or findAll', async () => {
    const error = new Error('Test Error');
    notification.count.mockRejectedValue(error);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await findAllNotification('user1', new Date());

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('should log the finally block message', async () => {
    notification.count.mockResolvedValue(10);
    notification.findAll.mockResolvedValue([{ id: 1 }]);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await findAllNotification('user1', new Date());

    expect(consoleSpy).toHaveBeenCalledWith('NOTIFICATION FIND ALL ROUTE CALLED');

    consoleSpy.mockRestore();
  });
});
