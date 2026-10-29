const { find } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');

jest.mock('../../../entities/disabledService', () => ({
    findOne: jest.fn(),
}));

describe('find', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a record with the provided serviceOperatorId and credentialId', async () => {
        const mockParams = { serviceOperatorId: 1, credentialId: 101 };
        const mockResult = {
            id: 1,
            serviceOperatorId: 1,
            credentialId: 101,
            name: 'Test Service',
        };

        disableService.findOne.mockResolvedValue(mockResult);

        const result = await find(mockParams);

        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                serviceOperatorId: mockParams.serviceOperatorId,
            },
        });
        expect(result).toEqual(mockResult);
    });

    it('should return null if no record is found with the provided serviceOperatorId and credentialId', async () => {
        const mockParams = { serviceOperatorId: 2, credentialId: 999 };

        disableService.findOne.mockResolvedValue(null);

        const result = await find(mockParams);

        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                serviceOperatorId: mockParams.serviceOperatorId,
            },
        });
        expect(result).toBeNull();
    });

    it('should throw an error if find operation fails', async () => {
        const mockParams = { serviceOperatorId: 1, credentialId: 101 };
        const mockError = new Error('Database error');

        disableService.findOne.mockRejectedValue(mockError);

        await expect(find(mockParams)).rejects.toThrow('Database error');
        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                serviceOperatorId: mockParams.serviceOperatorId,
            },
        });
    });
});
