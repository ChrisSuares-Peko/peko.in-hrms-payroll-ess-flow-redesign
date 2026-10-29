const { Op } = require('sequelize');
const notification = require('../../../entities/notification');
const credentials = require('../../../entities/credential');
const { notificationAndCountExport } = require('../../notification');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { formattedDateTime } = require('../../../../utils/formatter');

jest.mock('../../../entities/notification', () => ({
  findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../../../utils/sortHandle');
jest.mock('../../../../utils/formatter');

describe('notification Count and Export Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return formatted notification data with correct parameters', async () => {
    const from = new Date('2024-08-01T00:00:00.000Z');
    const to = new Date('2024-08-02T00:00:00.000Z');
    const corporateId = 'corp1';
    const searchText = 'example';
    const sort = 'DESC';
    const sortField = 'notificationTitle';
    const credentialCreatedAt = new Date('2024-05-01T00:00:00.000Z');

    const order = [['notificationTitle', 'DESC']];
    const mockData = {
      count: 1,
      rows: [
        {
          id: 1,
          createdAt: new Date('2024-08-01T12:00:00.000Z'),
          notificationTitle: 'Example Notification',
          notificationBrief: 'Brief Description',
          notificationCategory: 'Category 1',
          notificationTo: '1',
          notificationBy: 'User 1',
        },
      ],
    };

    const formattedDate = '08/01/2024 12:00:00';
    handleSortFields.mockReturnValue(order);
    credentials.findOne.mockResolvedValue({ createdAt: credentialCreatedAt });
    notification.findAndCountAll.mockResolvedValue(mockData);
    formattedDateTime.mockReturnValue(formattedDate);

    const expectedTomorrow = new Date(to);
    expectedTomorrow.setDate(expectedTomorrow.getDate() + 1);
    expectedTomorrow.setHours(0, 0, 0, 0);

    const expectedWhereClause = {
      createdAt: {
        [Op.between]: [from, expectedTomorrow],
      },
      [Op.or]: [
        { id: { [Op.like]: `%${searchText}%` } },
        { notificationTitle: { [Op.like]: `%${searchText}%` } },
        { notificationBrief: { [Op.like]: `%${searchText}%` } },
        { notificationCategory: { [Op.like]: `%${searchText}%` } },
        { notificationTo: { [Op.like]: `%${searchText}%` } },
        { notificationBy: { [Op.like]: `%${searchText}%` } },
      ],
      [Op.and]: [
        {
          [Op.or]: [
            { notificationTo: corporateId },
            { notificationTo: 'ALL', createdAt: { [Op.gte]: credentialCreatedAt } },
          ],
        },
      ],
    };

    const expectedResult = [
      {
        'Notification Date': formattedDate,
        'Notification Title': 'Example Notification',
        'Notification Brief': 'Brief Description',
        'Notification Category': 'Category 1',
        'Notification To': '1',
      },
    ];

    const result = await notificationAndCountExport(from, to, corporateId, searchText, sort, sortField);

    expect(credentials.findOne).toHaveBeenCalledWith({
      where: { username: corporateId },
      attributes: ['createdAt'],
    });
    expect(notification.findAndCountAll).toHaveBeenCalledWith({
      where: expectedWhereClause,
      order: order,
    });

    expect(result).toEqual(expectedResult);
  });

  it('should not scope by audience when corporateId is undefined', async () => {
    const order = [['createdAt', 'DESC']];
    handleSortFields.mockReturnValue(order);
    notification.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await notificationAndCountExport(undefined, undefined, undefined, '', 'DESC', 'createdAt');

    expect(credentials.findOne).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should handle errors and throw a custom error message', async () => {
    const from = new Date('2024-08-01T00:00:00.000Z');
    const to = new Date('2024-08-02T00:00:00.000Z');
    const corporateId = 'corp1';
    const searchText = 'example';
    const sort = 'DESC';
    const sortField = 'notificationTitle';

    credentials.findOne.mockResolvedValue({ createdAt: new Date('2024-05-01T00:00:00.000Z') });
    const error = new Error('Database error');
    notification.findAndCountAll.mockRejectedValue(error);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(notificationAndCountExport(from, to, corporateId, searchText, sort, sortField)).rejects.toEqual({ message: 'Something went wrong' });
    consoleSpy.mockRestore();
  });
});
