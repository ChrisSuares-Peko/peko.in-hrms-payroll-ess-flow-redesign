const { findAllSubscriptionCodes } = require('../../subscriptionVoucher');
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../../configs/database/index', () => ({
    query: jest.fn(),
    define: jest.fn(),
    QueryTypes: {
        SELECT: 'SELECT'
    }
}));

jest.mock('../../../entities/subscriptionVoucher', () => ({
    belongsTo: jest.fn()
}));

describe('find All Subscription Codes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return rows and total count with default parameters', async () => {
        const mockParams = { limit: 10, offset: 0, sort: 'ASC', sortField: 'activationCode' };
        const mockResult = [
            {
                id: 10,
                activationCode: "AVJH6RH7GQAD8R82",
                billingType: "MONTHLY",
                isUsed: 0,
                status: 1,
                packageName: "Standard",
                partnerName: null,
                createdAt: "2024-08-12T07:05:49.000Z"
            }
        ];
        const mockTotalCount = [{ totalCount: 1 }];

        sequelizeConfig.query
            .mockResolvedValueOnce(mockResult)
            .mockResolvedValueOnce(mockTotalCount);

        const result = await findAllSubscriptionCodes(mockParams);

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            rows: mockResult,
            count: mockTotalCount[0].totalCount
        });
    });

    it('should handle search text parameter correctly', async () => {
        const mockParams = { limit: 10, offset: 0, searchText: 'ABC', sort: 'ASC', sortField: 'activationCode' };
        const mockResult = [
            {
                id: 10,
                activationCode: "AVJH6RH7GQAD8R82",
                billingType: "MONTHLY",
                isUsed: 0,
                status: 1,
                packageName: "Standard",
                partnerName: null,
                createdAt: "2024-08-12T07:05:49.000Z"
            }
        ];
        const mockTotalCount = [{ totalCount: 1 }];

        sequelizeConfig.query
            .mockResolvedValueOnce(mockResult)
            .mockResolvedValueOnce(mockTotalCount);

        const result = await findAllSubscriptionCodes(mockParams);

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.any(String), {
            replacements: {
                limit: 10,
                offset: 0,
                searchText: '%ABC%'
            },
            type: sequelizeConfig.QueryTypes.SELECT,
            nest: true,
            raw: true
        });
        expect(result).toEqual({
            rows: mockResult,
            count: mockTotalCount[0].totalCount
        });
    });

    it('should handle sorting correctly', async () => {
        const mockParams = { limit: 10, offset: 0, sort: 'DESC', sortField: 'billingType' };
        const mockResult = [
            {
                id: 10,
                activationCode: "AVJH6RH7GQAD8R82",
                billingType: "MONTHLY",
                isUsed: 0,
                status: 1,
                packageName: "Standard",
                partnerName: null,
                createdAt: "2024-08-12T07:05:49.000Z"
            }
        ]; const mockTotalCount = [{ totalCount: 1 }];

        sequelizeConfig.query
            .mockResolvedValueOnce(mockResult)
            .mockResolvedValueOnce(mockTotalCount);

        const result = await findAllSubscriptionCodes(mockParams);

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            rows: mockResult,
            count: mockTotalCount[0].totalCount
        });
    });

    it('should return an empty result set when no data is found', async () => {
        const mockParams = { limit: 10, offset: 0, sort: 'ASC', sortField: 'activationCode' };
        const mockResult = [];
        const mockTotalCount = [{ totalCount: 0 }];

        sequelizeConfig.query
            .mockResolvedValueOnce(mockResult)
            .mockResolvedValueOnce(mockTotalCount);

        const result = await findAllSubscriptionCodes(mockParams);

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            rows: [],
            count: 0
        });
    });

    it('should handle errors', async () => {
        const mockParams = { limit: 10, offset: 0, sort: 'ASC', sortField: 'activationCode' };
        const expectedError = new Error('Database error');

        sequelizeConfig.query.mockRejectedValue(expectedError);

        await expect(findAllSubscriptionCodes(mockParams)).rejects.toEqual({ error: expectedError });
        expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
    });
});
