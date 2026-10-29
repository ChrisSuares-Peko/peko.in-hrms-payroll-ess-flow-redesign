const { findOne } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');

jest.mock('../../../entities/disabledService', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a record with the provided id', async () => {
        const mockParams = { id: 1, credentialId: 123, serviceOperatorId: 456 };

        const mockResult = {
            id: 1,
            name: 'Test Service',
        };

        disableService.findOne.mockResolvedValue(mockResult);

        const result = await findOne(mockParams);

        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {  credentialId: mockParams.credentialId, serviceOperatorId: mockParams.serviceOperatorId },
        });
        
        expect(result).toEqual(mockResult);
    });

    it('should return null if no record is found', async () => {
        const mockParams = { id: 999 };

        disableService.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {  credentialId: mockParams.credentialId, serviceOperatorId: mockParams.serviceOperatorId },
        });
        
        expect(result).toBeNull();
    });

    it('should throw an error if find operation fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        disableService.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');
        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {  credentialId: mockParams.credentialId, serviceOperatorId: mockParams.serviceOperatorId },
        });
        
    });
});
