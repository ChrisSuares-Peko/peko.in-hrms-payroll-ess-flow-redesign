const { findOne } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');

jest.mock('../../../entities/disabledService', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a disableService entry successfully', async () => {
        const mockParams = { serviceOperatorId: 1 };
        const mockService = { id: 1, serviceOperatorId: 1, status: 'disabled' };

        disableService.findOne.mockResolvedValue(mockService);

        const result = await findOne(mockParams);

        expect(disableService.findOne).toHaveBeenCalledWith({
            where: { serviceOperatorId: mockParams.serviceOperatorId },
        });
        expect(result).toEqual(mockService);
    });

    it('should return null if no disableService entry is found', async () => {
        const mockParams = { serviceOperatorId: 2 };
        disableService.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(result).toBeNull();
    });

    it('should throw an error if disableService lookup fails', async () => {
        const mockParams = { serviceOperatorId: 3 };
        const mockError = new Error('Database error');

        disableService.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');
    });
});
