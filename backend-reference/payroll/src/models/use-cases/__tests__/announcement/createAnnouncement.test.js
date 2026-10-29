const { createAnnouncement } = require('../../announcement');
const Announcement = require('../../../entities/announcement');

jest.mock('../../../entities/announcement', () => ({
  create: jest.fn(),
}));

describe('createAnnouncement Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return a new announcement without excluded employees', async () => {
    const userId = 'corporateUserId';
    const subject = 'New Policy';
    const details = 'Details about the new policy';
    const excludedEmployees = [];
    const expectedAnnouncement = {
      _id: 'announcementId',
      corporateUser: userId,
      subject,
      details,
      status: 'MAILED',
      excludedEmployees,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    Announcement.create.mockResolvedValue(expectedAnnouncement);

    const result = await createAnnouncement(userId, subject, details, excludedEmployees);

    expect(Announcement.create).toHaveBeenCalledWith({
      corporateUser: userId,
      subject,
      details,
      status: 'MAILED',
      excludedEmployees,
    });
    expect(result).toEqual(expectedAnnouncement);
  });

  it('should create an announcement with excluded employees', async () => {
    const userId = 'corporateUserId';
    const subject = 'Team Update';
    const details = 'Update for selected employees';
    const excludedEmployees = ['emp1', 'emp2'];
    const expectedAnnouncement = {
      _id: 'announcementId2',
      corporateUser: userId,
      subject,
      details,
      status: 'MAILED',
      excludedEmployees,
    };

    Announcement.create.mockResolvedValue(expectedAnnouncement);

    const result = await createAnnouncement(userId, subject, details, excludedEmployees);

    expect(Announcement.create).toHaveBeenCalledWith({
      corporateUser: userId,
      subject,
      details,
      status: 'MAILED',
      excludedEmployees,
    });
    expect(result).toEqual(expectedAnnouncement);
  });

  it('should throw an error if the create method throws an error', async () => {
    const userId = 'corporateUserId';
    const subject = 'New Policy';
    const details = 'Details about the new policy';

    Announcement.create.mockRejectedValue(new Error('DB failure'));
    console.error = jest.fn();

    await expect(createAnnouncement(userId, subject, details, [])).rejects.toThrow(
      'Error occurred while adding the announcement. Please try again.'
    );

    expect(Announcement.create).toHaveBeenCalledWith({
      corporateUser: userId,
      subject,
      details,
      status: 'MAILED',
      excludedEmployees: [],
    });
  });
});
