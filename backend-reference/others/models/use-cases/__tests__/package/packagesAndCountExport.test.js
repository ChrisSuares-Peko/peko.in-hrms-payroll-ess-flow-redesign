const { packagesAndCountExport } = require('../../package');
const sequelizeConfig = require('../../../../configs/database/index');
const Sequelize = require('sequelize');

jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn().mockImplementation((modelName, attributes) => ({
        modelName,
        attributes,
        sync: jest.fn(),
    })),
    query: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/cashback', () => ({
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
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn((date) => date.toISOString()),
    formatNumberWithLocalString: jest.fn((num) => num.toString()),
}));

describe('packagesAndCountExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted package data with valid parameters', async () => {
        const params = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'packageName',
            partnerId: 'default',
        };

        const mockData = [
            {
                id: 1,
                createdAt: new Date(),
                packageName: 'Test Package',
                partnerName: 'Test Partner',
                packagePrices: { monthly: 100, annually: 1000 },
                priorityLevel: 1,
                status: 1,
            },
        ];

        sequelizeConfig.query.mockResolvedValue(mockData);

        const result = await packagesAndCountExport(params);

        expect(sequelizeConfig.query).toHaveBeenCalledWith(
            expect.stringMatching(/SELECT\s+packages\.\*,\s+credentials\.name\s+AS\s+partnerName/i),
            {
                replacements: {
                    searchText: '%test%',
                    partnerId: null,
                },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        expect(result).toEqual([
            {
                Date: mockData[0].createdAt.toISOString(),
                "Package Name": 'Test Package',
                "Partner Name": 'Test Partner',
                "Monthly Price": '₹ 100',
                "Annual Price": '₹ 1000',
                "Priority Level": 1,
                Status: 'Active',
            },
        ]);
    });

    it('should handle empty results', async () => {
        const params = {
            searchText: 'nonexistent',
            sort: 'ASC',
            sortField: 'packageName',
            partnerId: 'default',
        };

        sequelizeConfig.query.mockResolvedValue([]);

        const result = await packagesAndCountExport(params);

        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const params = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'packageName',
            partnerId: 'default',
        };

        const mockError = new Error('Database error');
        sequelizeConfig.query.mockRejectedValue(mockError);

        await expect(packagesAndCountExport(params)).rejects.toEqual({
            message: 'Something went wrong',
        });
    });
});
