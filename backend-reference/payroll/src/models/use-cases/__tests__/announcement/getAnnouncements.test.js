const { getAnnouncements } = require('../../announcement');
const Announcement = require('../../../entities/announcement');

jest.mock('../../../entities/announcement');

describe('getAnnouncements Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated announcements with search and date filters', async () => {
    const params = {
      userId: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: '',
      year: 2024,
      month: 7,
      order: 'DESC',
    };
    const expectedAnnouncements = [{ _id: 'announcementId', subject: 'Meeting' }];
    const expectedTotalCount = 1;

    Announcement.find.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(expectedAnnouncements),
    }));
    Announcement.countDocuments.mockResolvedValue(expectedTotalCount);

    const result = await getAnnouncements(params);

    expect(Announcement.find).toHaveBeenCalledWith(expect.any(Object));
    expect(Announcement.countDocuments).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual({
      totalAnnouncementsCount: expectedTotalCount,
      announcements: expectedAnnouncements,
    });
  });

  it('should return announcements filtered by year only (no month)', async () => {
    const params = {
      userId: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: '',
      year: 2024,
      month: null,
      order: 'ASC',
    };
    const expectedAnnouncements = [{ _id: 'announcementId2', subject: 'Annual Review' }];

    Announcement.find.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(expectedAnnouncements),
    }));
    Announcement.countDocuments.mockResolvedValue(1);

    const result = await getAnnouncements(params);

    expect(Announcement.find).toHaveBeenCalledWith(
      expect.objectContaining({
        corporateUser: params.userId,
        createdAt: {
          $gte: new Date(2024, 0, 1),
          $lt: new Date(2024, 12, 1),
        },
      })
    );
    expect(result).toEqual({ totalAnnouncementsCount: 1, announcements: expectedAnnouncements });
  });

  it('should return announcements without any date filter when year and month are not provided', async () => {
    const params = {
      userId: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: 'policy',
      year: null,
      month: null,
      order: 'DESC',
    };
    const expectedAnnouncements = [{ _id: 'announcementId3', subject: 'HR Policy' }];

    Announcement.find.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(expectedAnnouncements),
    }));
    Announcement.countDocuments.mockResolvedValue(1);

    const result = await getAnnouncements(params);

    expect(Announcement.find).toHaveBeenCalledWith(
      expect.not.objectContaining({ createdAt: expect.anything() })
    );
    expect(result).toEqual({ totalAnnouncementsCount: 1, announcements: expectedAnnouncements });
  });

  it('should return an error if find or countDocuments method throws an error', async () => {
    const params = {
      userId: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: '',
      year: 2024,
      month: 7,
      order: 'DESC',
    };
    const expectedError = new Error('Database error');

    Announcement.find.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValue(expectedError),
    }));
    Announcement.countDocuments.mockRejectedValue(expectedError);

    const result = await getAnnouncements(params);

    expect(result).toBe(expectedError);
  });
});
