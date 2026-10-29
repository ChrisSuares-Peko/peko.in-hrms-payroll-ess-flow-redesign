jest.mock('../../../models/use-cases/transaction', () => ({
    findAllTransactions: jest.fn(),
    findAllCustomerSubscriptionOrders: jest.fn(),
    transactionsExcelCSV: jest.fn(),
}));
jest.mock('../../../utils/puppeteerPool', () => ({ renderPdf: jest.fn() }));
jest.mock('../../../utils/pekoRecieptHelper', () => ({ generateInvoiceOrReceiptPdf: jest.fn() }));
jest.mock('../../../utils/generateExcelBufferAndType', () => ({
    generateExcelBufferAndType: jest.fn(async () => ({ buffer: 'buffer', fileType: 'xlsx' })),
}));
jest.mock('../../../utils/reportTemplate', () => ({ reportPdfTemplate: jest.fn() }));
jest.mock('../../../utils/generatePekoInvoiceId', () => ({ generatePekoReceiptId: jest.fn() }));

const {
    findAllTransactions,
    findAllCustomerSubscriptionOrders,
    transactionsExcelCSV,
} = require('../../../models/use-cases/transaction');
const {
    findAllTransactionsAndCount,
    findAllSubscriptionOrdersCount,
    corporateTransactionGenerateExcelCSV,
} = require('../transactionReport');

const upiPayment = JSON.stringify({ payment_status: 'SUCCESS', payment_group: 'upi' });

const call = async (handler, req) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await handler(req, res, next);
    return { body: res.json.mock.calls[0]?.[0], next };
};

const corporateRequest = (query = {}) => ({
    query: { from: '2026-09-05', to: '2026-10-05', page: '1', itemsPerPage: '10', ...query },
    user: { id: 42, role: 'CORPORATE', registeredBy: 1 },
    params: {},
});

describe('corporate Reports — payment mode', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('transactions table', () => {
        const tableResult = async () => {
            findAllTransactions.mockResolvedValue({
                count: 2,
                rows: [
                    { id: 1, order: { id: 11, paymentMode: 'PAYMENT GATEWAY', paymentModeResponse: upiPayment, pekoInvoiceDetails: null } },
                    { id: 2, order: { id: 12, paymentMode: 'WALLET', paymentModeResponse: null, pekoInvoiceDetails: null } },
                ],
            });
            const { body } = await call(findAllTransactionsAndCount, corporateRequest());
            return body.data.result;
        };

        it('returns the instrument the customer paid with', async () => {
            const [gatewayRow, walletRow] = await tableResult();

            expect(findAllTransactions.mock.calls[0][0].orderAttribute).toContain('paymentModeResponse');
            expect(gatewayRow.order.paymentInstrument).toBe('UPI');
            expect(walletRow.order.paymentInstrument).toBeNull();
        });

        it('keeps the raw gateway payload server-side', async () => {
            const rows = await tableResult();

            rows.forEach((row) => {
                expect(row.order).not.toHaveProperty('paymentModeResponse');
                expect(row.order).not.toHaveProperty('pekoInvoiceDetails');
            });
        });
    });

    describe('subscription transactions table', () => {
        it('adds the instrument to each subscription row', async () => {
            findAllCustomerSubscriptionOrders.mockResolvedValue({
                count: 1,
                rows: [{ id: 21, paymentMode: 'PAYMENT GATEWAY', paymentModeResponse: upiPayment, pekoInvoiceDetails: null }],
            });

            const { body } = await call(findAllSubscriptionOrdersCount, corporateRequest());

            expect(body.data.result[0].paymentInstrument).toBe('UPI');
        });
    });

    describe('transactions export', () => {
        it('asks for the gateway payload so the export can name the instrument', async () => {
            transactionsExcelCSV.mockResolvedValue([{ 'Payment Mode': 'UPI' }]);
            const req = { ...corporateRequest({ title: 'Transactions' }), params: { type: 'xlsx' } };

            await call(corporateTransactionGenerateExcelCSV, req);

            expect(transactionsExcelCSV.mock.calls[0][0].orderAttribute).toContain('paymentModeResponse');
        });
    });
});
