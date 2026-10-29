const { updateStatusByServiceOperatorId } = require('../../../use-cases/giftCards');
const giftCards = require('../../../entities/giftCards');

jest.mock('../../../entities/giftCards', () => ({
    update: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
describe('updateStatusByServiceOperatorId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update gift card status by serviceOperatorId', async () => {
        const mockServiceOperatorId = 10;
        const mockParams = { status: 'inactive' };
        const mockUpdateResponse = [1];

        giftCards.update.mockResolvedValue(mockUpdateResponse);

        const result = await updateStatusByServiceOperatorId(mockServiceOperatorId, mockParams);

        expect(giftCards.update).toHaveBeenCalledWith(mockParams, {
            where: { serviceOperatorId: mockServiceOperatorId },
        });
        expect(result).toEqual(mockUpdateResponse);
    });

    it('should return false if no records are updated', async () => {
        const mockServiceOperatorId = 10;
        const mockParams = { status: 'inactive' };
        const mockUpdateResponse = [0];

        giftCards.update.mockResolvedValue(mockUpdateResponse);

        const result = await updateStatusByServiceOperatorId(mockServiceOperatorId, mockParams);

        expect(result).toEqual(mockUpdateResponse);
    });

    it('should handle errors if update operation fails', async () => {
        const mockServiceOperatorId = 10;
        const mockParams = { status: 'inactive' };
        const mockError = new Error('Database error');

        giftCards.update.mockRejectedValue(mockError);

        await expect(updateStatusByServiceOperatorId(mockServiceOperatorId, mockParams)).rejects.toThrow('Database error');
    });
});
