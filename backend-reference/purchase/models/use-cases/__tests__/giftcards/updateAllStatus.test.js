const { updateAllStatus } = require('../../../use-cases/giftCards');
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
describe('updateAllStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update all gift card statuses successfully', async () => {
        const mockParams = { status: 'inactive' };
        const mockUpdateResponse = [1];

        giftCards.update.mockResolvedValue(mockUpdateResponse);

        const result = await updateAllStatus(mockParams);

        expect(giftCards.update).toHaveBeenCalledWith(mockParams, {
            where: {},
        });
        expect(result).toEqual(mockUpdateResponse);
    });

    it('should return false if no records are updated', async () => {
        const mockParams = { status: 'inactive' };
        const mockUpdateResponse = [0];

        giftCards.update.mockResolvedValue(mockUpdateResponse);

        const result = await updateAllStatus(mockParams);

        expect(result).toEqual(mockUpdateResponse);
    });

    it('should handle errors if update operation fails', async () => {
        const mockParams = { status: 'inactive' };
        const mockError = new Error('Database error');

        giftCards.update.mockRejectedValue(mockError);

        await expect(updateAllStatus(mockParams)).rejects.toThrow('Database error');
    });
});
