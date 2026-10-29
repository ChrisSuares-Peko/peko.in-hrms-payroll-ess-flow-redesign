const { getTransactionReportExcel } = require('../../transaction');
const sequelizeConfig = require('../../../../configs/database/index');

describe('getTransactionReportExcel', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return formatted transaction report for excel', async () => {
        const mockData = [{
            transactionDate: '2023-10-01', customerName: 'Corp A',
            service: 'Mobile', serviceCategory: 'Telecom', Amount: 100,
            totalAmount: 105, paymentMode: 'UPI',
            paymentGatewayCost: 2, amountReceivable: 98,
            vendorName: 'Vendor A', partner: 'Partner A',
        }];
        sequelizeConfig.query.mockResolvedValue(mockData);

        const params = {
            searchText: '', sort: 'DESC', sortField: 'createdAt',
            from: '2023-10-01', to: '2023-10-31', partnerId: null
        };

        const result = await getTransactionReportExcel(params);
        expect(result.length).toBe(1);
        expect(result[0].Customer).toBe('Corp A');
    });

    it('exports the derived instrument instead of the generic PAYMENT GATEWAY label', async () => {
        sequelizeConfig.query.mockResolvedValue([{
            transactionDate: '2026-10-13', customerName: 'Corp A',
            service: 'FASTag Recharge', serviceCategory: 'Utility Payments',
            Amount: 361.8, paymentMode: 'PAYMENT GATEWAY', paymentInstrument: null,
            orderPaymentMode: 'PAYMENT GATEWAY',
            orderPaymentModeResponse: JSON.stringify({ order_option_type: 'OPTCRDC' }),
        }]);

        const result = await getTransactionReportExcel({
            searchText: '', sort: 'DESC', sortField: 'createdAt', partnerId: null
        });

        expect(result[0]['Payment Mode']).toBe('Credit Card');
    });

    it('should throw error on failure', async () => {
        sequelizeConfig.query.mockRejectedValue(new Error('DB error'));

        const params = {
            searchText: '', sort: 'DESC', sortField: 'createdAt',
            from: '2023-10-01', to: '2023-10-31', partnerId: null
        };

        await expect(getTransactionReportExcel(params)).rejects.toMatchObject({
            name: 'Error',
            message: 'Something went wrong. If the issue persists, please contact support at reach@peko.one',
            status_code: 500,
        });
    });
});
