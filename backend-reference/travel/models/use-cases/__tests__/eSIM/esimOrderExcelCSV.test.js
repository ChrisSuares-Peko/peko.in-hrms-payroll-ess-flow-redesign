const { esimOrderExcelCSV } = require('../../../use-cases/eSIM');
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

describe('esimOrderExcelCSV', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted CSV data successfully', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'admin-key',
            searchText: 'test',
            sort: 'ASC',
            corporateId: 123,
            serviceAttribute: ['id', 'name'],
            credentialAttribute: ['id', 'username'],
            transactionAttribute: ['id', 'transactionDate'],
            orderAttribute: ['corporateTxnId', 'paymentMode'],
            sortField: 'transactionDate',
        };

        const mockData = {
            count: 2,
            rows: [
                {
                    id: 1,
                    transactionDate: 'Not Available',
                    credential: {
                        id: 10,
                        username: 'Corp123',
                        name: 'Corporate A',
                        registeredByCredential: { name: 'Partner X' },
                    },
                    order: {
                        corporateTxnId: 'TXN789',
                        paymentMode: 'Credit Card',
                        amountInINR: 5000,
                        status: 'Completed',
                        orderResponse: JSON.stringify({ package: 'Premium Plan' }),
                    },
                },
            ],
        };

        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await esimOrderExcelCSV(mockParams);

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
                                attributes: ['name'],
                            }),
                        ]),
                    }),
                    expect.objectContaining({ model: orders, attributes: ['corporateTxnId', 'paymentMode'] }),
                ]),
                order: expect.any(Array),
                attributes: ['id', 'transactionDate'],
                raw: true,
                nest: true,
            })
        );

        expect(result).toEqual([
            {
                'Transaction Date': 'Not Available',
                'Transaction ID': 'TXN789',
                'Corporate ID': 'Corp123',
                'Corporate Name': 'Corporate A',
                'Partner Name': 'Partner X',
                'Plan': 'Premium Plan',
                'Payment Type': 'Credit Card',
                'Purchase Type': 'eSIM',
                'Amount Paid': '₹5,000.00',
                Status: 'Completed',
            },
        ]);
    });

    it('should return an empty array when no matching data is found', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'admin-key',
            searchText: 'notfound',
            sort: 'DESC',
            corporateId: 456,
        };

        const mockData = { count: 0, rows: [] };

        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await esimOrderExcelCSV(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual([]);
    });

    it('should throw an error when database operation fails', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'admin-key',
            searchText: 'errorcase',
        };

        const mockError = new Error('Database error');

        transaction.findAndCountAll.mockRejectedValue(mockError);

        await expect(esimOrderExcelCSV(mockParams)).rejects.toThrow('Something went wrong');
    });
});
