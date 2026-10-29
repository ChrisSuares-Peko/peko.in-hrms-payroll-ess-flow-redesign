const { subscriptionTransactionsExcelCSV } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');
jest.mock('../../../../utils/sortHandle', () => ({ handleSortFields: jest.fn(() => [['createdAt', 'DESC']]) }));

describe('subscriptionTransactionsExcelCSV', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return formatted subscription transaction CSV data', async () => {
        const mockData = {
            rows: [{
                corporateTxnId: 'TXN001', transactionDate: '2023-10-01',
                amountInINR: 100, status: 'SUCCESS', paymentMode: 'UPI',
                credential: { name: 'Corp A', username: 'corp_a' },
                serviceOperator: { serviceProvider: 'Sub Provider' }
            }]
        };
        orders.findAndCountAll.mockResolvedValue(mockData);

        const params = {
            from: '2023-10-01', to: '2023-10-31', corporateId: 1,
            searchText: '', sort: 'DESC', sortField: 'createdAt', registeredBy: null
        };

        const result = await subscriptionTransactionsExcelCSV(params);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
    });

    describe('Payment Mode', () => {
        const params = {
            from: '2023-10-01', to: '2023-10-31', corporateId: 1,
            searchText: '', sort: 'DESC', sortField: 'createdAt', registeredBy: null
        };

        const paymentModeFor = async (row) => {
            orders.findAndCountAll.mockResolvedValue({
                rows: [{ corporateTxnId: 'TXN002', transactionDate: '2023-10-02', amountInINR: 999, status: 'SUCCESS', ...row }],
            });
            const [exported] = await subscriptionTransactionsExcelCSV(params);
            return exported['Payment Mode'];
        };

        it('shows the instrument the mandate was authorised with', async () => {
            await expect(paymentModeFor({
                paymentMode: 'PAYMENT GATEWAY',
                paymentModeResponse: JSON.stringify([
                    { type: 'SUBSCRIPTION_AUTH_STATUS', data: { authorization_details: { payment_method: 'upi' } } },
                ]),
            })).resolves.toBe('UPI');
        });

        it('falls back to the stored payment mode when the payload names no instrument', async () => {
            await expect(paymentModeFor({
                paymentMode: 'PAYMENT GATEWAY',
                paymentModeResponse: JSON.stringify([{ pgAmount: 999 }]),
            })).resolves.toBe('PAYMENT GATEWAY');
        });
    });
});
