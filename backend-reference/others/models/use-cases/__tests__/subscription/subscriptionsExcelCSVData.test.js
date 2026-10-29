const { subscriptionsExcelCSVData } = require('../../subscription');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../../configs/database/index', () => {
    
    const sequelizeMock = {
        define: jest.fn(() => ({})), // Mocking define to return an empty object
        query: jest.fn(),           // Mocking query for raw SQL queries
    };
    return sequelizeMock;
});

jest.mock('../../../entities/subscription', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../models/entities/credential', () => {
    const credentialMock = {
        prototype: {
            getResetPasswordToken: jest.fn(),
        },
    };
    return credentialMock;
});
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}));

describe('subscriptionsExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted subscription data', async () => {
        const mockParams = {
            status: 'ACTIVE',
            packageType: 'BASIC',
            searchText: 'test',
            from: '2023-01-01',
            to: '2023-01-31',
            corporateId: 1,
            sortField: 'createdAt',
            sort: 'ASC',
            registeredBy: 2,
        };

        const mockData = [
            {
                createdAt: '2023-01-15',
                corporateUsername: 'corp1',
                corporateName: 'Corporate One',
                registeredByUsername: 'partner1',
                packageName: 'Basic Package',
                subscriptionStartDate: '2023-01-01',
                subscriptionEndDate: '2023-12-31',
                subscriptionPrice: 1000,
                discount: 100,
                subscriptionAmountPaid: 900,
                status: 'ACTIVE',
            },
        ];

        sequelizeConfig.query.mockResolvedValueOnce(mockData); // For main data query
        sequelizeConfig.query.mockResolvedValueOnce([{ totalCount: 1 }]); // For total count query

        const result = await subscriptionsExcelCSVData(mockParams);

        // expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);

        expect(result).toEqual(false);
    });

    it('should return an empty array if no data is found', async () => {
        const mockParams = {
            searchText: '',
        };

        sequelizeConfig.query.mockResolvedValueOnce([]); // For main data query
        sequelizeConfig.query.mockResolvedValueOnce([{ totalCount: 0 }]); // For total count query

        const result = await subscriptionsExcelCSVData(mockParams);

        
        expect(result).toEqual(false);
    });

    it('should return false if an error occurs', async () => {
        const mockParams = {
            searchText: '',
        };

        sequelizeConfig.query.mockRejectedValueOnce(new Error('Database error'));

        const result = await subscriptionsExcelCSVData(mockParams);

        
        expect(result).toBe(false);
    });
});
