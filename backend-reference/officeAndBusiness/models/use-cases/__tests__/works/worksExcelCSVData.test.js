const { worksExcelCSVData } = require('../../../use-cases/works');
const transaction = require('../../../entities/transaction');

const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(date => date.toISOString()),
    formatNumberWithLocalString: jest.fn(num => `INR ${num}`),
}));

describe('worksExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted CSV data for transactions', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'test-key',
            searchText: 'test',
            sort: 'ASC',
            corporateId: 1,
            sortField: 'transactionDate',
            transactionAttribute: ['id', 'amount'],
            orderAttribute: ['workspaceOrderStatus'],
            credentialAttribute: ['name', 'username'],
            serviceAttribute: ['id', 'serviceName'],
        };
        const mockData = {
            count: 1,
            rows: [
                {
                    order: {
                        transactionDate: new Date('2024-01-01T12:00:00Z'),
                        corporateTxnId: 'TXN123',
                        amountInINR: 1000,
                        workspaceOrderStatus: 'Completed',
                        orderResponse: JSON.stringify({ planDetails: { name: 'Basic Plan', work: { name: 'Development' } } })
                    },
                    credential: {
                        username: 'corp_user',
                        name: 'Corporate Name',
                        registeredByCredential: { name: 'Partner Name' }
                    }
                }
            ]
        };

        handleSortFields.mockReturnValue([['transactionDate', 'ASC']]);
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await worksExcelCSVData(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: [['transactionDate', 'ASC']],
            attributes: mockParams.transactionAttribute,
            raw: true,
            nest: true,
        }));
        expect(result).toEqual([
            {
                "Transaction Date": '2024-01-01T12:00:00.000Z',
                "Transaction ID": 'TXN123',
                "Corporate ID": 'corp_user',
                "Corporate Name": 'Corporate Name',
                "Partner Name": 'Partner Name',
                "Work Name": 'Development',
                "Plan Name": 'Basic Plan',
                "Price": '₹ INR 1000',
                "Status": 'Completed'
            }
        ]);
    });

    it('should return an empty array when no transactions exist', async () => {
        const mockParams = { searchText: 'none', sort: 'ASC', sortField: 'transactionDate' };
        transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await worksExcelCSVData(mockParams);

        expect(result).toEqual([]);
    });
});
