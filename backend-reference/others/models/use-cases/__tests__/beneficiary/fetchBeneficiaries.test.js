const { fetchBeneficiaries } = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');
const serviceOperators = require('../../../entities/serviceOperator');

jest.mock('../../../entities/beneficiary', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
    findAll: jest.fn(),
}));

describe('fetchBeneficiaries', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Reset mock data after each test
    });

    it('should fetch beneficiaries for the given accessKey and credentialId', async () => {
        const mockDetails = {
            accessKey: 'REDACTED',
        };
        const mockCredentialId = 1;

        const mockBeneficiaries = [
            {
                id: 1,
                name: 'John Doe',
                accessKey: mockDetails.accessKey,
                credentialId: mockCredentialId,
                serviceOperatorId: 1,
            },
        ];

        const mockServiceOperator = {
            id: 1,
            name: 'Operator One',
        };

        // Mock the beneficiary.findAll and serviceOperators.findAll to return mock data
        beneficiary.findAll.mockResolvedValue(mockBeneficiaries);
        serviceOperators.findAll.mockResolvedValue([mockServiceOperator]);

        const result = await fetchBeneficiaries(mockDetails, mockCredentialId);

        expect(beneficiary.findAll).toHaveBeenCalledWith({
            where: {
                accessKey: mockDetails.accessKey,
                credentialId: mockCredentialId,
            },
            include: [
                {
                    model: serviceOperators,
                },
            ],
        });
        expect(result).toEqual(mockBeneficiaries);
    });

    it('should handle errors gracefully', async () => {
        const mockDetails = {
            accessKey: 'REDACTED',
        };
        const mockCredentialId = 1;

        const mockError = new Error('Database error');
        beneficiary.findAll.mockRejectedValue(mockError); // Simulate an error

        console.log = jest.fn(); // Mock console.log for error logging

        await fetchBeneficiaries(mockDetails, mockCredentialId);

        expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should log a message after fetching', async () => {
        const mockDetails = {
            accessKey: 'REDACTED',
        };
        const mockCredentialId = 1;

        const mockBeneficiaries = [
            {
                id: 1,
                name: 'John Doe',
                accessKey: mockDetails.accessKey,
                credentialId: mockCredentialId,
                serviceOperatorId: 1,
            },
        ];

        // Mock the beneficiary.findAll to return mock data
        beneficiary.findAll.mockResolvedValue(mockBeneficiaries);

        const spy = jest.spyOn(console, 'log'); // Spy on console.log

        await fetchBeneficiaries(mockDetails, mockCredentialId);

        expect(spy).toHaveBeenCalledWith('FETCH BENEFICIARY  ROUTE CALLED');
    });
});
