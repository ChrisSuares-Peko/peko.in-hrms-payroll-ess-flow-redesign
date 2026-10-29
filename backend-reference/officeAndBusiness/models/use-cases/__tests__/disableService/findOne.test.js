const { findOne } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');

jest.mock('../../../entities/disabledService', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a record when a matching entry is found', async () => {
        const mockParams = { credentialId: 123, serviceOperatorId: 456 };
        const mockRecord = { id: 1, credentialId: 123, serviceOperatorId: 456 };

        disableService.findOne.mockResolvedValue(mockRecord);

        const result = await findOne(mockParams);

        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                serviceOperatorId: mockParams.serviceOperatorId,
            },
        });
        expect(result).toEqual(mockRecord);
    });

    it('should return null when no matching record is found', async () => {
        const mockParams = { credentialId: 789, serviceOperatorId: 101 };
        
        disableService.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                serviceOperatorId: mockParams.serviceOperatorId,
            },
        });
        expect(result).toBeNull();
    });

    it('should throw an error if findOne fails', async () => {
        const mockParams = { credentialId: 111, serviceOperatorId: 222 };
        const mockError = new Error('Database error');

        disableService.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');
    });
});
