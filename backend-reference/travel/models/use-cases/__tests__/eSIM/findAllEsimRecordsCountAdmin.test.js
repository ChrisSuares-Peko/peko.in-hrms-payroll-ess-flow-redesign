const { findAllEsimRecordsCountAdmin } = require('../../../use-cases/eSIM');
const transaction = require('../../../entities/transaction');
const serviceOperators = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const orders = require('../../../entities/order');

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllEsimRecordsCountAdmin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return records count with filtering and sorting for admin', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'admin-key',
            searchText: 'test',
            sort: 'ASC',
            limit: 10,
            offset: 0,
            corporateId: 123,
            serviceAttribute: ['id', 'name'],
            credentialAttribute: ['id', 'username'],
            transactionAttribute: ['id', 'transactionDate'],
            orderAttribute: ['corporateTxnId', 'paymentMode'],
            sortField: 'transactionDate'
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: 1,
                    credentialId: 123,
                    transactionDate: '2024-01-15T12:00:00Z',
                    order: {
                        corporateTxnId: 'TXN789',
                        paymentMode: 'Credit Card'
                    },
                    credential: {
                        id: 10,
                        username: 'adminUser',
                        registeredByCredential: {
                            name: 'RegisteredUser'
                        }
                    }
                }
            ]
        };

        transaction.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllEsimRecordsCountAdmin(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.any(Object),
                include: expect.arrayContaining([
                    expect.objectContaining({ model: serviceOperators, attributes: ['id', 'name'] }),
                    expect.objectContaining({
                        model: credential,
                        attributes: ['id', 'username'],
                        include: expect.arrayContaining([
                            expect.objectContaining({
                                model: credential,
                                as: 'registeredByCredential',
                                attributes: ['name']
                            })
                        ])
                    }),
                    expect.objectContaining({ model: orders, attributes: ['corporateTxnId', 'paymentMode'] })
                ]),
                order: expect.any(Array),
                limit: 10,
                offset: 0,
                attributes: ['id', 'transactionDate'],
                replacements: { searchText: '%test%' },
                raw: true,
                nest: true
            })
        );

        expect(result).toEqual(mockResponse);
    });

    it('should return empty records when no matching data is found', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'admin-key',
            searchText: 'notfound',
            sort: 'DESC',
            limit: 10,
            offset: 0
        };

        const mockResponse = { count: 0, rows: [] };

        transaction.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllEsimRecordsCountAdmin(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should handle empty response correctly', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'admin-key',
            searchText: 'noRecords',
            limit: 10,
            offset: 0,
        };
    
        const mockResponse = { count: 0, rows: [] };
    
        transaction.findAndCountAll.mockResolvedValue(mockResponse);
    
        const result = await findAllEsimRecordsCountAdmin(mockParams);
    
        expect(result).toEqual(mockResponse);
        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
    });
    
});
