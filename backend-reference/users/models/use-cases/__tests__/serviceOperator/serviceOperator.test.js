const { findOne } = require('../../serviceOperator');
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/vendor', () => ({}));

describe('serviceOperator use-cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findOne', () => {
        it('should find a service operator by accessKey', async () => {
            const mockResult = {
                id: 1,
                accessKey: 'tbo_airline',
                vendor: { apiUrl: 'https://api.example.com' },
            };
            serviceOperator.findOne.mockResolvedValue(mockResult);

            const result = await findOne({ accessKey: 'tbo_airline' });

            expect(serviceOperator.findOne).toHaveBeenCalledWith({
                include: [{
                    model: vendors,
                    attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
                }],
                where: { accessKey: 'tbo_airline' },
                raw: true,
                nest: true,
            });
            expect(result).toEqual(mockResult);
        });

        it('should include serviceType filter when provided', async () => {
            serviceOperator.findOne.mockResolvedValue(null);

            await findOne({ accessKey: 'tbo_airline', serviceType: 'flight' });

            expect(serviceOperator.findOne).toHaveBeenCalledWith({
                include: [{
                    model: vendors,
                    attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
                }],
                where: { accessKey: 'tbo_airline', serviceType: 'flight' },
                raw: true,
                nest: true,
            });
        });

        it('should return null when no service operator found', async () => {
            serviceOperator.findOne.mockResolvedValue(null);

            const result = await findOne({ accessKey: 'nonexistent' });

            expect(result).toBeNull();
        });

        it('should handle errors', async () => {
            serviceOperator.findOne.mockRejectedValue(new Error('DB error'));

            await expect(findOne({ accessKey: 'key' })).rejects.toThrow('DB error');
        });
    });
});
