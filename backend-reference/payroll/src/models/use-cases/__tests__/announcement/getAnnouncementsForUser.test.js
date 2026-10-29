const { getAnnouncementsForUser } = require('../../announcement');
const Announcement = require('../../../entities/announcement');

jest.mock('../../../entities/announcement');

describe('getAnnouncementsForUser Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const makeChain = (resolvedAnnouncements) => ({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(resolvedAnnouncements),
    });

    it('should query MAILED announcements not excluding the employee, with default pagination', async () => {
        const params = { corporateUser: 'corporateUserID', employeeId: 'employeeID' };
        const expectedAnnouncements = [{ _id: 'a1', subject: 'Holiday Notice', details: 'Office closed', createdAt: new Date() }];
        const chain = makeChain(expectedAnnouncements);

        Announcement.find.mockReturnValue(chain);
        Announcement.countDocuments.mockResolvedValue(1);

        const result = await getAnnouncementsForUser(params);

        const expectedQuery = {
            corporateUser: 'corporateUserID',
            status: 'MAILED',
            excludedEmployees: { $ne: 'employeeID' },
        };
        expect(Announcement.find).toHaveBeenCalledWith(expectedQuery);
        expect(chain.select).toHaveBeenCalledWith('subject details createdAt');
        expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(chain.skip).toHaveBeenCalledWith(0);
        expect(chain.limit).toHaveBeenCalledWith(10);
        expect(Announcement.countDocuments).toHaveBeenCalledWith(expectedQuery);

        expect(result).toEqual({ announcements: expectedAnnouncements, total: 1 });
    });

    it('should apply skip/limit based on the given page and limit', async () => {
        const params = { corporateUser: 'corporateUserID', employeeId: 'employeeID', page: 3, limit: 5 };
        const chain = makeChain([]);

        Announcement.find.mockReturnValue(chain);
        Announcement.countDocuments.mockResolvedValue(0);

        await getAnnouncementsForUser(params);

        expect(chain.skip).toHaveBeenCalledWith(10); // (3 - 1) * 5
        expect(chain.limit).toHaveBeenCalledWith(5);
    });

    it('should apply both $gte and $lte createdAt filters when from and to are provided', async () => {
        const from = new Date('2026-01-01');
        const to = new Date('2026-01-31');
        const params = { corporateUser: 'corporateUserID', employeeId: 'employeeID', from, to };
        const chain = makeChain([]);

        Announcement.find.mockReturnValue(chain);
        Announcement.countDocuments.mockResolvedValue(0);

        await getAnnouncementsForUser(params);

        expect(Announcement.find).toHaveBeenCalledWith({
            corporateUser: 'corporateUserID',
            status: 'MAILED',
            excludedEmployees: { $ne: 'employeeID' },
            createdAt: { $gte: from, $lte: to },
        });
    });

    it('should apply only the $gte createdAt filter when only from is provided', async () => {
        const from = new Date('2026-01-01');
        const params = { corporateUser: 'corporateUserID', employeeId: 'employeeID', from };
        const chain = makeChain([]);

        Announcement.find.mockReturnValue(chain);
        Announcement.countDocuments.mockResolvedValue(0);

        await getAnnouncementsForUser(params);

        expect(Announcement.find).toHaveBeenCalledWith({
            corporateUser: 'corporateUserID',
            status: 'MAILED',
            excludedEmployees: { $ne: 'employeeID' },
            createdAt: { $gte: from },
        });
    });

    it('should apply only the $lte createdAt filter when only to is provided', async () => {
        const to = new Date('2026-01-31');
        const params = { corporateUser: 'corporateUserID', employeeId: 'employeeID', to };
        const chain = makeChain([]);

        Announcement.find.mockReturnValue(chain);
        Announcement.countDocuments.mockResolvedValue(0);

        await getAnnouncementsForUser(params);

        expect(Announcement.find).toHaveBeenCalledWith({
            corporateUser: 'corporateUserID',
            status: 'MAILED',
            excludedEmployees: { $ne: 'employeeID' },
            createdAt: { $lte: to },
        });
    });

    it('should propagate the error when the database query fails', async () => {
        const dbError = new Error('Database error');
        const chain = {
            select: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockRejectedValue(dbError),
        };

        Announcement.find.mockReturnValue(chain);
        Announcement.countDocuments.mockResolvedValue(0);

        await expect(
            getAnnouncementsForUser({ corporateUser: 'corporateUserID', employeeId: 'employeeID' })
        ).rejects.toThrow('Database error');
    });
});
