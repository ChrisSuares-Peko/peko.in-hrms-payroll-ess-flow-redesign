const { getTransactionReport } = require('../../transaction');
const sequelizeConfig = require('../../../../configs/database/index');

describe('getTransactionReport', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return transaction report with count', async () => {
        const mockData = [{ id: 1, customerName: 'Corp A' }];
        const mockCount = [{ totalCount: 1 }];
        sequelizeConfig.query
            .mockResolvedValueOnce(mockData)
            .mockResolvedValueOnce(mockCount);

        const params = {
            limit: 10, offset: 0, searchText: '', sort: 'DESC',
            sortField: 'createdAt', from: '2023-10-01', to: '2023-10-31', partnerId: null
        };

        const result = await getTransactionReport(params);
        expect(result).toEqual({ rows: mockData, count: 1 });
    });

    it('derives the instrument for a CCAvenue bill the stored column could not resolve', async () => {
        sequelizeConfig.query
            .mockResolvedValueOnce([{
                id: 2,
                paymentMode: 'PAYMENT GATEWAY',
                paymentInstrument: null,
                orderPaymentMode: 'PAYMENT GATEWAY',
                orderPaymentModeResponse: JSON.stringify({
                    pgAmount: 361.8,
                    pgResponse: { order_option_type: 'OPTCRDC' },
                }),
            }])
            .mockResolvedValueOnce([{ totalCount: 1 }]);

        const result = await getTransactionReport({
            limit: 10, offset: 0, searchText: '', sort: 'DESC', sortField: 'createdAt', partnerId: null
        });

        expect(result.rows[0].paymentInstrument).toBe('Credit Card');
        // The raw gateway payload must not reach the client
        expect(result.rows[0]).not.toHaveProperty('orderPaymentModeResponse');
        expect(result.rows[0]).not.toHaveProperty('orderPaymentMode');
    });

    it('keeps the stored instrument and leaves paymentMode alone when nothing is derivable', async () => {
        sequelizeConfig.query
            .mockResolvedValueOnce([
                { id: 3, paymentMode: 'PAYMENT GATEWAY', paymentInstrument: 'UPI', orderPaymentModeResponse: null },
                { id: 4, paymentMode: 'WALLET', paymentInstrument: null, orderPaymentModeResponse: null },
            ])
            .mockResolvedValueOnce([{ totalCount: 2 }]);

        const result = await getTransactionReport({
            limit: 10, offset: 0, searchText: '', sort: 'DESC', sortField: 'createdAt', partnerId: null
        });

        expect(result.rows[0].paymentInstrument).toBe('UPI');
        expect(result.rows[1].paymentInstrument).toBeNull();
        expect(result.rows[1].paymentMode).toBe('WALLET');
    });

    it('should throw error on failure', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('DB error'));

        const params = {
            limit: 10, offset: 0, searchText: '', sort: 'DESC',
            sortField: 'createdAt', from: '2023-10-01', to: '2023-10-31', partnerId: null
        };

        await expect(getTransactionReport(params)).rejects.toMatchObject({
            name: 'Error',
            message: 'Something went wrong. If the issue persists, please contact support at reach@peko.one',
            status_code: 500,
        });
    });
});
