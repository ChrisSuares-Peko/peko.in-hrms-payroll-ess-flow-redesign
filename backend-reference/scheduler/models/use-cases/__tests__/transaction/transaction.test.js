const {
    transactionsExcelReport,
    transactionsExcelReportAdmin,
    transactionsExcelReportAdminNew,
    transactionsSubscriptionExcelReportAdminNew,
    corporateTransactionsExcelReport
} = require('../../transaction');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('transactionsExcelReport', () => {
    it('should format transaction data for CSV with correct fields', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                transactionDate: '2026-01-15T10:00:00Z',
                providerId: 'P1',
                corporateTxnId: 'TXN1',
                transactionCategory: 'PAYMENT',
                status: 'SUCCESS',
                serviceOperator: { serviceProvider: 'TestOp' },
                order: { paymentMode: 'WALLET', amountInINR: '100' }
            }]
        });

        const result = await transactionsExcelReport({
            credentialId: 1, from: '2026-01-01', to: '2026-12-31'
        });
        expect(result[0]['Transaction ID']).toBe('TXN1');
        expect(result[0]['Operator']).toBe('TestOp');
        expect(result[0]['Amount']).toBe('100.00 ₹');
        expect(result[0]['Status']).toBe('SUCCESS');
    });

    it('should handle missing values with Not Available', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                transactionDate: null,
                providerId: null,
                corporateTxnId: null,
                transactionCategory: null,
                status: null,
                serviceOperator: { serviceProvider: null },
                order: { paymentMode: null, amountInINR: null }
            }]
        });

        const result = await transactionsExcelReport({ from: '2026-01-01', to: '2026-12-31' });
        expect(result[0]['Date/Time']).toBe('Not Available');
        expect(result[0]['Order ID']).toBe('Not Available');
        expect(result[0]['Amount']).toBe('0.00 ₹');
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('Error'));

        const result = await transactionsExcelReport({ from: '2026-01-01', to: '2026-12-31' });
        expect(result).toEqual([]);
    });

    it('should include credentialId and partnerId filters when provided', async () => {
        transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await transactionsExcelReport({
            credentialId: 5, from: '2026-01-01', to: '2026-12-31', partnerId: 10
        });
        expect(transaction.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ credentialId: 5 })
            })
        );
    });
});

describe('transactionsExcelReportAdmin', () => {
    it('should format admin transaction data using raw SQL query', async () => {
        const mockData = [{
            transactionDate: '2026-01-15T10:00:00Z',
            providerId: 'P1',
            corporateTxnId: 'TXN1',
            transactionCategory: 'PAYMENT',
            serviceOperatorServiceProvider: 'TestOp',
            orderPaymentMode: 'WALLET',
            orderAmountInINR: '100',
            remarks: 'SUCCESS',
            credentialPartnerId: 10,
            credentialName: 'REDACTED',
            corporateUsersName: 'Corp1',
            contactPersonName: 'John'
        }];
        sequelizeConfig.query.mockResolvedValue(mockData);

        const result = await transactionsExcelReportAdmin({
            from: '2026-01-01', to: '2026-12-31', partnerId: 10
        });
        expect(result[0]['Transaction ID']).toBe('TXN1');
        expect(result[0]['Partner Name']).toBe('Partner1');
        expect(result[0]['Corporate Name']).toBe('Corp1');
        expect(result[0]['POC Name']).toBe('John');
    });

    it('should default partner name to Peko when partnerId does not match', async () => {
        const mockData = [{
            transactionDate: '2026-01-15T10:00:00Z',
            providerId: 'P1',
            corporateTxnId: 'TXN1',
            transactionCategory: 'PAYMENT',
            serviceOperatorServiceProvider: 'TestOp',
            orderPaymentMode: 'WALLET',
            orderAmountInINR: '100',
            remarks: 'SUCCESS',
            credentialPartnerId: 20,
            credentialName: 'REDACTED',
            corporateUsersName: 'Corp1',
            contactPersonName: null
        }];
        sequelizeConfig.query.mockResolvedValue(mockData);

        const result = await transactionsExcelReportAdmin({
            from: '2026-01-01', to: '2026-12-31', partnerId: 10
        });
        expect(result[0]['Partner Name']).toBe('Peko');
        expect(result[0]['POC Name']).toBe('Not Available');
    });

    it('should return empty array on error', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('Error'));

        const result = await transactionsExcelReportAdmin({ from: '2026-01-01', to: '2026-12-31' });
        expect(result).toEqual([]);
    });
});

describe('transactionsExcelReportAdminNew', () => {
    it('should format data similar to transactionsExcelReportAdmin', async () => {
        const mockData = [{
            transactionDate: '2026-01-15T10:00:00Z',
            providerId: 'P1',
            corporateTxnId: 'TXN1',
            transactionCategory: 'PAYMENT',
            serviceOperatorServiceProvider: 'TestOp',
            orderPaymentMode: 'GATEWAY',
            orderAmountInINR: '200',
            remarks: 'SUCCESS',
            credentialPartnerId: 10,
            credentialName: 'REDACTED',
            corporateUsersName: 'Corp1',
            contactPersonName: 'Jane'
        }];
        sequelizeConfig.query.mockResolvedValue(mockData);

        const result = await transactionsExcelReportAdminNew({
            from: '2026-01-01', to: '2026-12-31', partnerId: 10
        });
        expect(result[0]['Amount']).toBe('200.00 ₹');
        expect(result[0]['POC Name']).toBe('Jane');
    });

    it('should return empty array on error', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('Error'));

        const result = await transactionsExcelReportAdminNew({ from: '2026-01-01', to: '2026-12-31' });
        expect(result).toEqual([]);
    });
});

describe('transactionsSubscriptionExcelReportAdminNew', () => {
    it('should format subscription data from raw SQL', async () => {
        const mockData = [{
            corporateTxnId: 'TXN1',
            transactionDate: '2026-01-15T10:00:00Z',
            amountInINR: '500',
            orderResponse: JSON.stringify({ serviceName: 'WhatsApp', billingType: 'MONTHLY' }),
            paymentMode: 'WALLET',
            status: 'SUCCESS',
            partnerId: 10,
            name: 'Partner1',
            customerName: 'Corp1',
            contactPersonName: 'John'
        }];
        sequelizeConfig.query.mockResolvedValue(mockData);

        const result = await transactionsSubscriptionExcelReportAdminNew({
            from: '2026-01-01', to: '2026-12-31', partnerId: 10
        });
        expect(result[0]['Subscription']).toBe('WhatsApp');
        expect(result[0]['Billing Type']).toBe('MONTHLY');
        expect(result[0]['Amount']).toBe('500.00 AED');
    });

    it('should return empty array on error', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('Error'));

        const result = await transactionsSubscriptionExcelReportAdminNew({
            from: '2026-01-01', to: '2026-12-31'
        });
        expect(result).toEqual([]);
    });
});

describe('corporateTransactionsExcelReport', () => {
    it('should format corporate subscription transaction data', async () => {
        orders.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                corporateTxnId: 'TXN1',
                transactionDate: '2026-01-15T10:00:00Z',
                amountInINR: '300',
                orderResponse: JSON.stringify({ serviceName: 'Accounting', billingType: 'YEARLY' }),
                paymentMode: 'GATEWAY',
                status: 'SUCCESS'
            }]
        });

        const result = await corporateTransactionsExcelReport({
            credentialId: 1, from: '2026-01-01', to: '2026-12-31'
        });
        expect(result[0]['Subscription']).toBe('Accounting');
        expect(result[0]['Billing Type']).toBe('YEARLY');
        expect(result[0]['Amount']).toBe('300.00 AED');
    });

    it('should return empty array on error', async () => {
        orders.findAndCountAll.mockRejectedValue(new Error('Error'));

        const result = await corporateTransactionsExcelReport({
            from: '2026-01-01', to: '2026-12-31'
        });
        expect(result).toEqual([]);
    });
});
