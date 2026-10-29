const { countESignDocs } = require('../../../use-cases/eSign');
const eSign = require('../../../entities/eSign');
const { customLog } = require('../../../../utils/loggerHelper');

jest.mock('../../../entities/eSign', () => ({
    count: jest.fn(),
    findOne: jest.fn(),
}));

describe('countESignDocs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return counts of all, pending, completed eSigns and last created date', async () => {
        const mockUserId = 123;
        const mockCount = 5;
        const mockPendingCount = 2;
        const mockCompletedCount = 3;
        const mockLastCreatedAt = new Date('2024-01-01T12:00:00Z');

        eSign.count.mockResolvedValueOnce(mockCount)
            .mockResolvedValueOnce(mockPendingCount)
            .mockResolvedValueOnce(mockCompletedCount);
        eSign.findOne.mockResolvedValue({ createdAt: mockLastCreatedAt });

        const result = await countESignDocs(mockUserId);

        expect(eSign.count).toHaveBeenCalledTimes(3);
        expect(eSign.count).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    credentialId: mockUserId,
                    sourceType: null,
                })
            })
        );

        expect(eSign.count).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    credentialId: mockUserId,
                    status: 'PENDING'
                })
            })
        );

        expect(eSign.count).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    credentialId: mockUserId,
                    status: 'COMPLETED'
                })
            })
        );
        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockUserId, sourceType: null },
            order: [['createdAt', 'DESC']],
            attributes: ['createdAt'],
        });
        expect(result).toEqual({
            count: mockCount,
            pendingCount: mockPendingCount,
            completedCount: mockCompletedCount,
            lastESignAddedDate: mockLastCreatedAt,
        });
    });

    it('should scope counts to the given sub-corporate user when provided', async () => {
        const mockUserId = 123;
        const mockSubCorporateUserId = 55;

        eSign.count.mockResolvedValue(0);
        eSign.findOne.mockResolvedValue(null);

        await countESignDocs(mockUserId, mockSubCorporateUserId);

        expect(eSign.count).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    credentialId: mockUserId,
                    subCorporateUserId: mockSubCorporateUserId,
                })
            })
        );
    });

    it('should return null for lastESignAddedDate when no eSign is found', async () => {
        const mockUserId = 456;
        eSign.count.mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0)
            .mockResolvedValueOnce(0);
        eSign.findOne.mockResolvedValue(null);

        const result = await countESignDocs(mockUserId);

        expect(result).toEqual({ count: 0, pendingCount: 0, completedCount: 0, lastESignAddedDate: null });
    });

    it('should return false when an error occurs', async () => {
        const mockUserId = 789;
        const mockError = new Error('Database error');

        eSign.count.mockRejectedValue(mockError);

        const result = await countESignDocs(mockUserId);

        expect(customLog).toHaveBeenCalledWith(
            null,
            'error',
            expect.objectContaining({
                step: 'countESignDocs',
                error: mockError.message,
                stack: mockError.stack,
            })
        );
        expect(result).toBe(false);
    });
});
