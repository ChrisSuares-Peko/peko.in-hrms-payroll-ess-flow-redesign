const { findAllRequests } = require('../../../use-cases/connectionRequest');
const sequelize = require('../../../../configs/database/index');

jest.mock('../../../../configs/database/index', () => ({
    query: jest.fn(),
    QueryTypes: {
        SELECT: 'SELECT',
    },
    define:jest.fn(),
}));

describe('findAllRequests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all pending connection requests for a corporate user', async () => {
        const mockCorporateId = 123;
        const mockRequests = [
            {
                id: 1,
                senderId: 123,
                senderName: 'Corporate User A',
                senderAcsUserId: 'ACS123',
                senderLogo: 'logoA.png',
                receiverId: 456,
                receiverName: 'Corporate User B',
                receiverAcsUserId: 'ACS456',
                receiverLogo: 'logoB.png',
                senderUsername: 'userA',
                receiverUsername: 'userB',
                status: 'PENDING',
            },
        ];

        sequelize.query.mockResolvedValue(mockRequests);

        const result = await findAllRequests(mockCorporateId);

        expect(sequelize.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            expect.objectContaining({
                replacements: { corporateId: mockCorporateId },
                type: sequelize.QueryTypes.SELECT,
            })
        );

        expect(result).toEqual(mockRequests);
    });

    it('should return an empty array when no pending requests are found', async () => {
        const mockCorporateId = 999;

        sequelize.query.mockResolvedValue([]);

        const result = await findAllRequests(mockCorporateId);

        expect(sequelize.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            expect.objectContaining({
                replacements: { corporateId: mockCorporateId },
                type: sequelize.QueryTypes.SELECT,
            })
        );

        expect(result).toEqual([]);
    });

    it('should log an error and return false when database operation fails', async () => {
        const mockCorporateId = 123;
        const mockError = new Error('Database error');

        sequelize.query.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findAllRequests(mockCorporateId);

        expect(console.error).toHaveBeenCalledWith("Error fetching all connection requests:", mockError);
        expect(result).toBe(false);
    });
});
