const { findAllEsimRecordsCount } = require('../../../use-cases/eSIM');
const eSIM = require('../../../entities/eSIM');
const credential = require('../../../entities/credential');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');
const SubCorporateUser = require('../../../entities/subCorporateUsers');

jest.mock('../../../entities/eSIM', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllEsimRecordsCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return records count with filtering and sorting', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'test',
            sort: 'ASC',
            column: 'createdAt',
            corporateId: 123,
            subCorporateUserId: 456
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: 1,
                    credentialId: 123,
                    packageDetails: 'Test Package',
                    simDetails: 'SIM12345',
                    remarks: 'Active',
                    quantity: 1,
                    amount: 100,
                    createdAt: '2024-01-15T12:00:00Z',
                    transaction: {
                        corporateTxnId: 'TXN789',
                        status: 'Completed',
                        orders: {
                            paymentMode: 'Credit Card',
                            amountInINR: 2000
                        }
                    },
                    SubCorporateUser: {
                        id: 456,
                        name: 'SubCorpUser1'
                    }
                }
            ]
        };

        eSIM.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllEsimRecordsCount(mockParams);

        expect(eSIM.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.any(Object),
                include: expect.arrayContaining([
                    expect.objectContaining({ model: credential }),
                    expect.objectContaining({
                        model: transaction,
                        include: expect.arrayContaining([
                            expect.objectContaining({ model: orders })
                        ])
                    }),
                    expect.objectContaining({ model: SubCorporateUser })
                ]),
                order: [['createdAt', 'ASC']],
                limit: 10,
                offset: 0
            })
        );

        expect(result).toEqual(mockResponse);
    });

    it('should return empty records when no matching data is found', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'notfound',
            sort: 'DESC',
            column: 'createdAt'
        };

        const mockResponse = { count: 0, rows: [] };

        eSIM.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllEsimRecordsCount(mockParams);

        expect(eSIM.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should throw an error when database operation fails', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            limit: 10,
            offset: 0,
            searchText: 'errorcase'
        };

        const mockError = new Error('Database error');

        eSIM.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAllEsimRecordsCount(mockParams)).rejects.toThrow('Database error');
    });
});
