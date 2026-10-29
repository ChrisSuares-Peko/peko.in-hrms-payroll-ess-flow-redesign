const { fetchLastBeneficiaries } = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');
const serviceOperators = require('../../../entities/serviceOperator');

// Mock the beneficiary and serviceOperators models
jest.mock('../../../entities/beneficiary', () => ({
    findAll: jest.fn(),
}));

describe('fetchLastBeneficiaries', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock data after each test
    });

    it('should fetch the last 5 beneficiaries based on credentialId', async () => {
        const mockId = 1;

        // Mock the result returned by findAll
        const mockBeneficiaries = [{
            id: 1,
            name: 'Beneficiary 1',
            serviceOperators: {
                serviceProvider: 'Provider 1',
                serviceImage: 'Image URL 1'
            }
        }];
        beneficiary.findAll.mockResolvedValue(mockBeneficiaries);

        const result = await fetchLastBeneficiaries(mockId);

        expect(result).toEqual(mockBeneficiaries);
        expect(beneficiary.findAll).toHaveBeenCalledWith({
            where: {
                credentialId: mockId
            },
            include: [{
                model: serviceOperators,
                attributes: ['serviceProvider', 'serviceImage']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });
    });

    it('should log an error and the error message if an exception occurs', async () => {
        const mockId = 1;
        const mockError = new Error('Database error');

        // Mock findAll to throw an error
        beneficiary.findAll.mockRejectedValue(mockError);

        // Mock console.log
        console.log = jest.fn();

        const result = await fetchLastBeneficiaries(mockId);

        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith(mockError.message.message);
        expect(console.log).toHaveBeenCalledWith("FETCH BENEFICIARY  ROUTE CALLED");
    });
});
