const { findAllTransactions } = require('../../transaction');
const transaction = require('../../../entities/transaction');

// Mocking the models
jest.mock('../../../entities/transaction',()=>({
    findAndCountAll:jest.fn()
}));
jest.mock('../../../entities/serviceOperator');
jest.mock('../../../entities/credential');
jest.mock('../../../entities/order');
jest.mock('../../../entities/subCorporateUsers');

describe('findAllTransactions', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    it('should return transactions with the correct parameters', async () => {
        // Mock data
        const mockParams = {
            from: '2023-01-01',
            to: '2023-01-31',
            categoryName: 'utilities',
            searchText: 'Test',
            sort: 'ASC',
            filter: 'completed',
            limit: 10,
            offset: 0,
            corporateId: 'corporateId123',
            serviceAttribute: ['name'],
            credentialAttribute: ['username'],
            transactionAttribute: ['id', 'debitAmount', 'creditAmount'],
            orderAttribute: ['status'],
            sortField: 'transactionDate',
            registeredBy: 'admin',
            subCorporateUserId: 'subUser123',
        };

        const mockResponse = {
            count: 1,
            rows: [
                { id: 'txn1', debitAmount: 100, creditAmount: 50, transactionCategory: 'utilities' }
            ]
        };

        transaction.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllTransactions(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith({
            include: expect.any(Array),
            where: expect.any(Object),
            order: expect.any(Array),
            limit: mockParams.limit,
            offset: mockParams.offset,
            attributes: mockParams.transactionAttribute,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResponse);
    });

    it('should handle errors and throw an appropriate message', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const mockParams = {
            from: '2023-01-01',
            to: '2023-01-31',
        };

        await expect(findAllTransactions(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
    });

    describe('partner scoping of the credential include', () => {
        const partnerParams = (overrides = {}) => ({
            sort: 'ASC',
            sortField: 'transactionDate',
            registeredBy: 1830,
            ...overrides,
        });

        const credentialWhere = () => {
            const { include } = transaction.findAndCountAll.mock.calls[0][0];
            return include.find(entry => entry.as === undefined && entry.where && 'registeredBy' in entry.where)?.where;
        };

        it('never passes an undefined subPartnerId, which Sequelize rejects outright', async () => {
            transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await findAllTransactions(partnerParams({ subPartnerId: undefined }));

            const where = credentialWhere();
            expect(where).toEqual({ registeredBy: 1830 });
            expect(Object.values(where)).not.toContain(undefined);
        });

        it('scopes to the sub-partner when the session has one', async () => {
            transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            await findAllTransactions(partnerParams({ subPartnerId: 77 }));

            expect(credentialWhere()).toEqual({ registeredBy: 1830, subPartnerId: 77 });
        });

        it('returns an empty page rather than failing when the partner has no transactions', async () => {
            transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

            const result = await findAllTransactions(partnerParams({ subPartnerId: undefined }));

            expect(result).toEqual({ count: 0, rows: [] });
        });
    });
});
