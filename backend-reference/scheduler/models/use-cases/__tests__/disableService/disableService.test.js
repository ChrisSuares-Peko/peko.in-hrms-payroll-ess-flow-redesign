const { findOne } = require('../../disableService');
const disableService = require('../../../entities/disabledService');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findOne', () => {
    it('should find a disabled service by credentialId and serviceOperatorId', async () => {
        const mockResult = { id: 1, credentialId: 1, serviceOperatorId: 5, serviceStatus: true };
        disableService.findOne.mockResolvedValue(mockResult);

        const result = await findOne({ credentialId: 1, serviceOperatorId: 5 });
        expect(result).toEqual(mockResult);
        expect(disableService.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: 1,
                serviceOperatorId: 5,
                serviceStatus: true
            }
        });
    });

    it('should return null when no disabled service found', async () => {
        disableService.findOne.mockResolvedValue(null);

        const result = await findOne({ credentialId: 999, serviceOperatorId: 999 });
        expect(result).toBeNull();
    });
});
