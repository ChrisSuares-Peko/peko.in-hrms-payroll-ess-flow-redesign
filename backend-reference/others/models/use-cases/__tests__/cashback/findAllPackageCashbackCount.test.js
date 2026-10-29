const { findAllPackageCashbackCount } = require('../../../use-cases/cashback');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn().mockImplementation((modelName, attributes) => ({
        modelName,
        attributes,
        sync: jest.fn(),
    })),
    query: jest.fn(),
}));
jest.mock('../../../entities/cashback', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({
    prototype: {
        getResetPasswordToken: jest.fn(),
    },
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

describe('findAllPackageCashbackCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should return results when valid parameters are provided', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'cashbacks.cashback',
        };

        // Mock the result data
        const mockData = [
            {
                cashback: '10%',
                serviceProvider: 'Provider A',
                packageName: 'Package A',
                vendorName: 'Vendor A',
                partnerName: 'Partner A',
                partnerId: null,
            },
            {
                cashback: '15%',
                serviceProvider: 'Provider B',
                packageName: 'Package B',
                vendorName: 'Vendor B',
                partnerName: 'Partner B',
                partnerId: 1,
            },
        ];

        const mockCount = [{ totalCount: 2 }];

        // Mock `query` to resolve with mock data and count result
        sequelizeConfig.query
            .mockResolvedValueOnce(mockData) // For data query
            .mockResolvedValueOnce(mockCount); // For count query

        // Call the function
        const result = await findAllPackageCashbackCount(mockParams);

        // Verify the result
        expect(result).toEqual({
            rows: mockData.map((item) => ({
                ...item,
                serviceOperator: {
                    serviceProvider: item.serviceProvider,
                },
                package: {
                    packageName: item.packageName,
                },
                vendor: {
                    vendorName: item.vendorName,
                },
            })),
            count: 2,
        });

        // Ensure the `query` method was called twice (once for data and once for count)
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'cashbacks.cashback',
        };

        const mockError = new Error('Database error');

        // Mock the `query` method to reject with an error
        sequelizeConfig.query.mockRejectedValue(mockError);

        // Call the function and expect it to throw an error
        await expect(findAllPackageCashbackCount(mockParams)).rejects.toEqual({
            message: 'Something went wrong',
        });

        // Verify the `query` method was called
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(1);
    });
});
