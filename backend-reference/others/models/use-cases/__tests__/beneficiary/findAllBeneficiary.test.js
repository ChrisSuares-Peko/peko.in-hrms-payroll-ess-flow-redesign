const { findAllBeneficiary } = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');
const disableServices = require('../../../entities/disabledService');
const { Op } = require('sequelize'); // Sequelize operator

jest.mock('../../../entities/beneficiary', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/disabledService', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
    findAll: jest.fn(),
}));

describe('findAllBeneficiary', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Reset mocks after each test
    });

    it('should return beneficiaries matching the search text and excluding disabled services', async () => {
        const mockParams = {
            start: 0,
            length: 10,
            searchText: 'John',
            order: 'ASC',
            status: '1', // This should result in isActive being true
            column: 0,   // This maps to 'createdAt', so we should expect that in the order
            credentialId: 1,
        };
    
        const mockDisableServices = [
            {
                serviceOperator: {
                    accessKey: 'service1',
                },
            },
        ];
    
        const mockBeneficiaries = {
            count: 1,
            rows: [
                {
                    id: 1,
                    name: 'John Doe',
                    accountNo: '123456789',
                    accessKey: 'service2',
                    credentialId: mockParams.credentialId,
                },
            ],
        };
    
        // Mocking the responses
        disableServices.findAll.mockResolvedValue(mockDisableServices);
        beneficiary.findAndCountAll.mockResolvedValue(mockBeneficiaries);
    
        const result = await findAllBeneficiary(mockParams);
    
        // Ensure the expected query was called
        expect(beneficiary.findAndCountAll).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                isActive: mockParams.status === '1' ? '1' : undefined, // Boolean check for isActive
                [Op.and]: [
                    {
                        [Op.or]: [
                            { id: { [Op.like]: `%${mockParams.searchText}%` } },
                            { name: { [Op.like]: `%${mockParams.searchText}%` } },
                            { accountNo: { [Op.like]: `%${mockParams.searchText}%` } },
                            { accessKey: { [Op.like]: `%${mockParams.searchText}%` } },
                        ],
                    },
                    {
                        accessKey: { [Op.notIn]: ['service1'] }, // Exclude disabled service
                    },
                ],
            },
            order: [['name', mockParams.order]], // Now expecting createdAt
            limit: mockParams.length,
            offset: mockParams.start,
        });
    
        expect(result).toEqual(mockBeneficiaries);
    });
    

    it('should return empty array if no beneficiaries are found', async () => {
        const mockParams = {
            start: 0,
            length: 10,
            searchText: 'NonExistentUser',
            order: 'ASC',
            status: '0',
            column: 1,
            credentialId: 1,
        };

        const mockDisableServices = [
            {
                serviceOperator: {
                    accessKey: 'service1',
                },
            },
        ];

        // Mocking that no beneficiaries were found
        disableServices.findAll.mockResolvedValue(mockDisableServices);
        beneficiary.findAndCountAll.mockResolvedValue({
            count: 0,
            rows: [],
        });

        const result = await findAllBeneficiary(mockParams);

        expect(result).toEqual({
            count: 0,
            rows: [],
        });
    });

   
});
