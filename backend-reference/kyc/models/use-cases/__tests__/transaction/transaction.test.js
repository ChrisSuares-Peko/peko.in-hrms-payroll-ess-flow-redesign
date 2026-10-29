const transactionUseCase = require('../../transaction');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
    // Ensure query and QueryTypes are available on sequelizeConfig
    if (!sequelizeConfig.query || !sequelizeConfig.query.mockResolvedValue) {
        sequelizeConfig.query = jest.fn();
    }
    if (!sequelizeConfig.QueryTypes) {
        sequelizeConfig.QueryTypes = { SELECT: 'SELECT' };
    }
});

describe('createTransaction', () => {
    it('should create a transaction', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN1' };
        transaction.create.mockResolvedValue(mockResult);

        const result = await transactionUseCase.createTransaction({ corporateTxnId: 'TXN1' });
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        transaction.create.mockRejectedValue(new Error('DB Error'));

        const result = await transactionUseCase.createTransaction({});
        expect(result).toBeUndefined();
    });
});

describe('findOneTransaction', () => {
    it('should find one transaction by corporateTxnId', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN1' };
        transaction.findOne.mockResolvedValue(mockResult);

        const result = await transactionUseCase.findOneTransaction({ corporateTxnId: 'TXN1' });
        expect(result).toEqual(mockResult);
    });
});

describe('getOneTransaction', () => {
    it('should get one transaction with includes', async () => {
        const mockResult = { id: 1, order: {}, serviceOperator: {} };
        transaction.findOne.mockResolvedValue(mockResult);

        const result = await transactionUseCase.getOneTransaction({ transactionId: 'TXN1' });
        expect(result).toEqual(mockResult);
    });
});

describe('findAllTransaction', () => {
    it('should find all transactions by corporateId', async () => {
        const mockResult = [{ id: 1 }];
        transaction.findAll.mockResolvedValue(mockResult);

        const result = await transactionUseCase.findAllTransaction({ corporateId: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('updateTransaction', () => {
    it('should update a transaction', async () => {
        transaction.update.mockResolvedValue([1]);

        const result = await transactionUseCase.updateTransaction({ tranId: 1 });
        expect(result).toEqual([1]);
    });
});

describe('deleteTransaction', () => {
    it('should delete a transaction', async () => {
        transaction.destroy.mockResolvedValue(1);

        const result = await transactionUseCase.deleteTransaction({ tranId: 1 });
        expect(result).toBe(1);
    });
});

describe('findAllTransactions', () => {
    it('should find all transactions with pagination, search, and includes', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.findAllTransactions({
            corporateId: 1, from: '2026-01-01', to: '2026-12-31',
            start: 0, length: 10, searchText: '', order: 'DESC',
            column: 0, details: false, categoryName: 'Payment'
        });
        expect(result).toEqual(mockData);
    });

    it('should handle undefined categoryName', async () => {
        const mockData = { count: 0, rows: [] };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        await transactionUseCase.findAllTransactions({
            from: '2026-01-01', to: '2026-12-31',
            start: 0, length: 10, searchText: '', order: 'DESC',
            column: 99, details: false, categoryName: undefined
        });
        expect(transaction.findAndCountAll).toHaveBeenCalled();
    });
});

describe('transactionDetails', () => {
    it('should find order details with service operator', async () => {
        const mockResult = { id: 1, serviceOperator: { serviceProvider: 'TestOp' } };
        orders.findOne.mockResolvedValue(mockResult);

        const result = await transactionUseCase.transactionDetails({ transactionId: 'TXN1' });
        expect(result).toEqual(mockResult);
    });
});

describe('transactionReports', () => {
    it('should execute raw SQL query for reports', async () => {
        const mockResults = [{ id: 1 }];
        sequelizeConfig.query.mockResolvedValue(mockResults);

        const result = await transactionUseCase.transactionReports({
            credentialId: 1, from: '2026-01-01', to: '2026-12-31'
        });
        expect(result).toEqual(mockResults);
    });

    it('should propagate query error (no await before return in source)', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('Query failed'));

        await expect(transactionUseCase.transactionReports({
            credentialId: 1, from: '2026-01-01', to: '2026-12-31'
        })).rejects.toThrow('Query failed');
    });
});

describe('transactionExcelCSV', () => {
    it('should format transaction data for CSV', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                corporateTxnId: 'TXN1',
                credential: { name: 'Corp1' },
                transactionDate: '2026-01-15T10:00:00Z',
                transactionType: 'DEBIT',
                transactionCategory: 'PAYMENT',
                debitAmount: '100',
                creditAmount: null,
                corporateCashback: '5',
                balance: '400',
                remarks: 'Test'
            }]
        });

        const result = await transactionUseCase.transactionExcelCSV({
            from: '2026-01-01', to: '2026-12-31', order: 'DESC', column: 'createdAt'
        });
        expect(result[0]['Transaction Id']).toBe('TXN1');
        expect(result[0]['Debit Amount']).toBe('100INR');
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('Error'));

        const result = await transactionUseCase.transactionExcelCSV({
            from: '2026-01-01', to: '2026-12-31', order: 'DESC', column: 'createdAt'
        });
        expect(result).toEqual([]);
    });
});

describe('walletExcelCSV', () => {
    it('should format wallet transaction data for CSV', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1,
                corporateTxnId: 'TXN1',
                transactionDate: '2026-01-15T10:00:00Z',
                transactionType: 'CREDIT',
                debitAmount: null,
                creditAmount: '500',
                balance: '1500',
                remarks: 'Fund Transfer'
            }]
        });

        const result = await transactionUseCase.walletExcelCSV({
            from: '2026-01-01', to: '2026-12-31'
        });
        expect(result[0]['Credit Amount']).toBe('500INR');
    });
});

describe('getExcelCSVData', () => {
    it('should handle walletReports format', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, corporateTxnId: 'TXN1',
                transactionDate: '2026-01-15T10:00:00Z',
                transactionType: 'CREDIT', transactionCategory: 'FUND TRANSFER',
                debitAmount: null, creditAmount: '100',
                corporateCashback: null, balance: '500', remarks: 'Test',
                serviceOperator: { serviceProvider: null },
                credential: { name: null }, order: {}
            }]
        });

        const result = await transactionUseCase.getExcelCSVData({
            from: '2026-01-01', to: '2026-12-31', searchText: '',
            order: 'DESC', column: 'createdAt', reportFor: 'walletReports'
        });
        expect(result[0]['Transaction Type']).toBe('CREDIT');
    });

    it('should handle default report format', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, providerId: 'P1', corporateTxnId: 'TXN1',
                transactionDate: '2026-01-15T10:00:00Z',
                transactionCategory: 'PAYMENT', status: 'SUCCESS',
                serviceOperator: { serviceProvider: 'TestOp' },
                credential: { name: 'Corp1' },
                order: { amountInINR: '200', paymentMode: 'WALLET' }
            }]
        });

        const result = await transactionUseCase.getExcelCSVData({
            from: '2026-01-01', to: '2026-12-31', searchText: '',
            order: 'DESC', column: 'createdAt'
        });
        expect(result[0]['Operator']).toBe('TestOp');
        expect(result[0]['Amount']).toBe('200.00 INR');
    });
});

describe('getDataExcelCSV', () => {
    it('should format data for CSV with category filter', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, providerId: 'P1', corporateTxnId: 'TXN1',
                transactionDate: '2026-01-15T10:00:00Z',
                transactionCategory: 'PAYMENT', status: 'SUCCESS',
                serviceOperator: { serviceProvider: 'TestOp' },
                credential: {}, order: { amountInINR: '100', paymentMode: 'WALLET' }
            }]
        });

        const result = await transactionUseCase.getDataExcelCSV({
            corporateId: 1, from: '2026-01-01', to: '2026-12-31',
            categoryName: 'PAYMENT', details: false
        });
        expect(result[0]['Category']).toBe('PAYMENT');
    });
});

describe('vendorReportExcelCSV', () => {
    it('should filter by vendorId when provided', async () => {
        transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await transactionUseCase.vendorReportExcelCSV({
            vendorId: 1, from: '2026-01-01', to: '2026-12-31'
        });
        expect(transaction.findAndCountAll).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('Error'));

        const result = await transactionUseCase.vendorReportExcelCSV({
            from: '2026-01-01', to: '2026-12-31'
        });
        expect(result).toEqual([]);
    });
});

describe('transactionExcelCSVOnFinance', () => {
    it('should format finance report data', async () => {
        transaction.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                corporateTxnId: 'TXN1',
                credential: { name: 'Corp1', registeredBy: 5 },
                transactionDate: '2026-01-15T10:00:00Z',
                transactionType: 'DEBIT', transactionCategory: 'PAYMENT',
                debitAmount: '100', creditAmount: null,
                corporateCashback: '5', balance: '400', remarks: 'Test',
                serviceOperator: {}, order: {}
            }]
        });

        const result = await transactionUseCase.transactionExcelCSVOnFinance({
            from: '2026-01-01', to: '2026-12-31', order: 'DESC',
            column: 'createdAt', partnerId: 5
        });
        expect(result[0]['Transaction Id']).toBe('TXN1');
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('Error'));

        const result = await transactionUseCase.transactionExcelCSVOnFinance({
            from: '2026-01-01', to: '2026-12-31', order: 'DESC', column: 'createdAt'
        });
        expect(result).toEqual([]);
    });
});

describe('updateTransactionById', () => {
    it('should update a transaction by id', async () => {
        transaction.update.mockResolvedValue([1]);

        const result = await transactionUseCase.updateTransactionById(1, { status: 'SUCCESS' });
        expect(result).toEqual([1]);
        expect(transaction.update).toHaveBeenCalledWith(
            { status: 'SUCCESS' },
            { where: { id: 1 } }
        );
    });
});

describe('corporateAllTransactions', () => {
    it('should find all transactions for a corporate with date range', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.corporateAllTransactions({
            corporateId: 1, from: '2026-01-01', to: '2026-12-31'
        });
        expect(result).toEqual(mockData);
    });
});

describe('findAllWalletTransactions', () => {
    it('should find wallet transactions with fund transfer filter', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.findAllWalletTransactions({
            start: 0, from: '2026-01-01', to: '2026-12-31',
            length: 10, searchText: '', order: 'DESC', column: 0, userId: 1
        });
        expect(result).toEqual(mockData);
    });
});

describe('findAllVendorTransactions', () => {
    it('should find vendor transactions with vendorId filter', async () => {
        const mockData = { count: 1, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.findAllVendorTransactions({
            vendorId: 1, from: '2026-01-01', to: '2026-12-31',
            start: 0, length: 10, searchText: '', order: 'DESC', column: 'createdAt', details: true
        });
        expect(result).toEqual(mockData);
    });
});

describe('findAllPartnerTransactions', () => {
    it('should find partner transactions', async () => {
        const mockData = { count: 0, rows: [] };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.findAllPartnerTransactions({
            corporateId: 1, partnerId: 5, from: '2026-01-01', to: '2026-12-31',
            start: 0, length: 10, searchText: '', order: 'DESC',
            column: 0, details: false, categoryName: undefined
        });
        expect(result).toEqual(mockData);
    });
});

describe('findAllWorkspaceOrders', () => {
    it('should find workspace orders', async () => {
        const mockData = { count: 0, rows: [] };
        orders.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.findAllWorkspaceOrders({
            start: 0, from: '2026-01-01', to: '2026-12-31',
            length: 10, searchText: '', order: 'DESC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});

describe('findAllOrdersCount', () => {
    it('should find office supplies orders', async () => {
        const mockData = { count: 0, rows: [] };
        orders.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.findAllOrdersCount({
            start: 0, from: '2026-01-01', to: '2026-12-31',
            length: 10, searchText: '', order: 'DESC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});

describe('findAllSubscriptionOrders', () => {
    it('should find subscription orders', async () => {
        const mockData = { count: 0, rows: [] };
        orders.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionUseCase.findAllSubscriptionOrders({
            start: 0, from: '2026-01-01', to: '2026-12-31',
            length: 10, searchText: '', order: 'DESC', column: 0
        });
        expect(result).toEqual(mockData);
    });
});
