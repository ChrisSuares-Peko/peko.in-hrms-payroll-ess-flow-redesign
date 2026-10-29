const { Op } = require('sequelize');
const notification = require('../../../entities/notification');
const credentials = require('../../../entities/credential');
const { findAllNotificationCount } = require('../../notification');

jest.mock('../../../entities/notification', () => ({
  findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

const expectedTomorrow = (to) => {
  const tomorrow = new Date(to);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

const searchClause = (searchText) => [
  { id: { [Op.like]: `%${searchText}%` } },
  { notificationTitle: { [Op.like]: `%${searchText}%` } },
  { notificationBrief: { [Op.like]: `%${searchText}%` } },
  { notificationCategory: { [Op.like]: `%${searchText}%` } },
  { notificationTo: { [Op.like]: `%${searchText}%` } },
  { notificationBy: { [Op.like]: `%${searchText}%` } },
];

const audienceClause = (corporateId, userCreatedAt) => [
  {
    [Op.or]: [
      { notificationTo: corporateId },
      { notificationTo: 'ALL', createdAt: { [Op.gte]: userCreatedAt } },
    ],
  },
];

describe('findAllNotificationCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return notifications count and rows for valid parameters without corporateId', async () => {
    const from = new Date('2024-08-13T08:46:13.724Z');
    const to = new Date('2024-08-13T18:30:00.000Z');
    const searchText = 'Test';
    const sort = 'DESC';
    const sortField = 'createdAt';
    const page = 1;
    const pageSize = 10;

    notification.findAndCountAll.mockResolvedValue({
      count: 100,
      rows: [{ id: 1, notificationTitle: 'Test' }],
    });

    const result = await findAllNotificationCount(from, to, undefined, searchText, sort, sortField, page, pageSize);

    expect(result.count).toBe(100);
    expect(result.rows).toEqual([{ id: 1, notificationTitle: 'Test' }]);
    expect(credentials.findOne).not.toHaveBeenCalled();
    expect(notification.findAndCountAll).toHaveBeenCalledWith({
      where: {
        createdAt: { [Op.between]: [from, expectedTomorrow(to)] },
        [Op.or]: searchClause('test'),
      },
      order: [[sortField, sort]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  });

  it('should scope by corporateId using the provided userCreatedAt cutoff', async () => {
    const from = new Date('2024-08-13T08:46:13.724Z');
    const to = new Date('2024-08-13T18:30:00.000Z');
    const searchText = 'test';
    const sort = 'DESC';
    const sortField = 'createdAt';
    const page = 1;
    const pageSize = 10;
    const corporateId = 'corp1';
    const userCreatedAt = new Date('2024-05-01T00:00:00.000Z');

    notification.findAndCountAll.mockResolvedValue({
      count: 50,
      rows: [{ id: 1, notificationTitle: 'Corporate Test' }],
    });

    const result = await findAllNotificationCount(from, to, corporateId, searchText, sort, sortField, page, pageSize, userCreatedAt);

    expect(result.count).toBe(50);
    expect(result.rows).toEqual([{ id: 1, notificationTitle: 'Corporate Test' }]);
    expect(credentials.findOne).not.toHaveBeenCalled();
    expect(notification.findAndCountAll).toHaveBeenCalledWith({
      where: {
        createdAt: { [Op.between]: [from, expectedTomorrow(to)] },
        [Op.or]: searchClause('test'),
        [Op.and]: audienceClause(corporateId, userCreatedAt),
      },
      order: [[sortField, sort]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  });

  it("should resolve the cutoff from the user's own credential when userCreatedAt is not provided", async () => {
    const from = new Date('2024-08-13T08:46:13.724Z');
    const to = new Date('2024-08-13T18:30:00.000Z');
    const corporateId = 'subuser@mail.com';
    const credentialCreatedAt = new Date('2024-09-15T10:00:00.000Z');

    credentials.findOne.mockResolvedValue({ createdAt: credentialCreatedAt });
    notification.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 9 }] });

    await findAllNotificationCount(from, to, corporateId, '', 'DESC', 'createdAt', 1, 10);

    expect(credentials.findOne).toHaveBeenCalledWith({
      where: { username: corporateId },
      attributes: ['createdAt'],
    });
    expect(notification.findAndCountAll).toHaveBeenCalledWith({
      where: {
        createdAt: { [Op.between]: [from, expectedTomorrow(to)] },
        [Op.and]: audienceClause(corporateId, credentialCreatedAt),
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      offset: 0,
    });
  });

  it('should handle empty search text', async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 1);

    notification.findAndCountAll.mockResolvedValue({
      count: 200,
      rows: [{ id: 1, notificationTitle: 'Empty Search' }],
    });

    const result = await findAllNotificationCount(from, to, undefined, '', 'ASC', 'createdAt', 1, 10);

    expect(result.count).toBe(200);
    expect(result.rows).toEqual([{ id: 1, notificationTitle: 'Empty Search' }]);
  });
});
