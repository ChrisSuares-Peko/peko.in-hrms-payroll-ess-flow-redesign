const { findOne, findDisableService } = require('../../disableService');
const disableService = require('../../../entities/disabledService');
const serviceOperators = require('../../../entities/serviceOperator');

jest.mock('../../../entities/disabledService', () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({}));

describe('disableService use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findOne', () => {
        it('should find a disabled service by credentialId and serviceOperatorId', async () => {
            const mockResult = { id: 1, credentialId: 10, serviceOperatorId: 20, serviceStatus: true };
            disableService.findOne.mockResolvedValue(mockResult);

            const result = await findOne({ credentialId: 10, serviceOperatorId: 20 });

            expect(disableService.findOne).toHaveBeenCalledWith({
                where: {
                    credentialId: 10,
                    serviceOperatorId: 20,
                    serviceStatus: true,
                },
            });
            expect(result).toEqual(mockResult);
        });

        it('should return null when no disabled service found', async () => {
            disableService.findOne.mockResolvedValue(null);

            const result = await findOne({ credentialId: 10, serviceOperatorId: 20 });

            expect(result).toBeNull();
        });

        it('should handle errors', async () => {
            disableService.findOne.mockRejectedValue(new Error('DB error'));

            await expect(findOne({ credentialId: 10, serviceOperatorId: 20 })).rejects.toThrow('DB error');
        });
    });

    describe('findDisableService', () => {
        it('should find all disabled services for a credential', async () => {
            const mockResult = [
                { credentialId: 10, serviceStatus: true, serviceOperator: { serviceProvider: 'Provider1', accessKey: 'key1' } },
            ];
            disableService.findAll.mockResolvedValue(mockResult);

            const result = await findDisableService({ credentialId: 10 });

            expect(disableService.findAll).toHaveBeenCalledWith({
                include: [{
                    model: serviceOperators,
                    attributes: ['serviceProvider', 'accessKey'],
                }],
                where: {
                    credentialId: 10,
                    serviceStatus: true,
                },
                raw: true,
                nest: true,
            });
            expect(result).toEqual(mockResult);
        });

        it('should return empty array when no disabled services found', async () => {
            disableService.findAll.mockResolvedValue([]);

            const result = await findDisableService({ credentialId: 10 });

            expect(result).toEqual([]);
        });

        it('should handle errors', async () => {
            disableService.findAll.mockRejectedValue(new Error('DB error'));

            await expect(findDisableService({ credentialId: 10 })).rejects.toThrow('DB error');
        });
    });
});
