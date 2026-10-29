const { findAllServiceOperatorOnCategory } = require('../../../use-cases/serviceOperator');
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
    findAll: jest.fn(),
}));

describe('findAllServiceOperatorOnCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all service operators for a given category', async () => {
        const mockCategory = 'Telecom';
        const mockServiceOperators = [
            { id: 1, name: 'Operator A', serviceCategory: mockCategory },
            { id: 2, name: 'Operator B', serviceCategory: mockCategory },
        ];

        serviceOperator.findAll.mockResolvedValue(mockServiceOperators);

        const result = await findAllServiceOperatorOnCategory(mockCategory);

        expect(serviceOperator.findAll).toHaveBeenCalledWith({
            where: { serviceCategory: mockCategory },
        });
        expect(result).toEqual(mockServiceOperators);
    });

    it('should return an empty array if no service operators match the category', async () => {
        const mockCategory = 'InvalidCategory';
        serviceOperator.findAll.mockResolvedValue([]);

        const result = await findAllServiceOperatorOnCategory(mockCategory);

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockCategory = 'Telecom';
        const mockError = new Error('Database error');

        serviceOperator.findAll.mockRejectedValue(mockError);

        await expect(findAllServiceOperatorOnCategory(mockCategory)).rejects.toThrow('Database error');
    });
});
