'use strict';
const { getAllPaymentMethods } = require('../../paymentMethods');
const sequelize = require('../../../../configs/database/index');

jest.mock('../../../entities/paymentMethods', () => ({}));
jest.mock('../../../entities/paymentMethodServices', () => ({}));
jest.mock('../../../entities/serviceOperator', () => ({}));

describe('getAllPaymentMethods', () => {
    it('names the gateway of each payment gateway row', async () => {
        sequelize.query = jest
            .fn()
            .mockResolvedValueOnce([
                { id: 1, paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'ccavenue_pg', serviceList: '10,20' },
                { id: 2, paymentMethod: 'PAYMENT_GATEWAY', pgProvider: 'cashfree_pg', serviceList: '10' },
                { id: 3, paymentMethod: 'PAYMENT_GATEWAY', pgProvider: null, serviceList: null },
                { id: 4, paymentMethod: 'WALLET', pgProvider: null, serviceList: '10' },
            ])
            .mockResolvedValueOnce([{ count: 4 }]);

        const result = await getAllPaymentMethods({});

        expect(result.data.map(({ id, pgProvider, pgProviderName }) => ({ id, pgProvider, pgProviderName }))).toEqual([
            { id: 1, pgProvider: 'ccavenue_pg', pgProviderName: 'CC Avenue' },
            { id: 2, pgProvider: 'cashfree_pg', pgProviderName: 'Cashfree' },
            { id: 3, pgProvider: null, pgProviderName: null },
            { id: 4, pgProvider: null, pgProviderName: null },
        ]);
    });

    it('returns each row status and whether the partner has another active gateway', async () => {
        sequelize.query = jest
            .fn()
            .mockResolvedValueOnce([
                { id: 1, paymentMethod: 'PAYMENT_GATEWAY', isActive: 1, hasOtherActiveGateway: 0 },
                { id: 2, paymentMethod: 'PAYMENT_GATEWAY', isActive: 0, hasOtherActiveGateway: 1 },
            ])
            .mockResolvedValueOnce([{ count: 2 }]);

        const result = await getAllPaymentMethods({});

        expect(result.data.map(({ id, isActive, hasOtherActiveGateway }) => ({ id, isActive, hasOtherActiveGateway }))).toEqual([
            { id: 1, isActive: true, hasOtherActiveGateway: false },
            { id: 2, isActive: false, hasOtherActiveGateway: true },
        ]);
    });

    it("counts only the same partner's other active gateways as alternatives", async () => {
        sequelize.query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0 }]);

        await getAllPaymentMethods({});

        const [[rowsSql, rowsOptions]] = sequelize.query.mock.calls;
        expect(rowsSql).toContain('other.id <> pm.id');
        expect(rowsSql).toContain('other.isActive = TRUE');
        expect(rowsSql).toContain('other.partnerId <=> pm.partnerId');
        expect(rowsSql).toContain('other.paymentMethod = :paymentGatewayMethod');
        expect(rowsOptions.replacements.paymentGatewayMethod).toBe('PAYMENT_GATEWAY');
    });

    describe('payment gateway filter', () => {
        beforeEach(() => {
            sequelize.query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0 }]);
        });

        it('lists only the selected gateway rows', async () => {
            await getAllPaymentMethods({ pgProvider: 'ccavenue_pg' });

            const [[rowsSql, rowsOptions], [countSql, countOptions]] = sequelize.query.mock.calls;
            expect(rowsSql).toContain('AND pm.pgProvider = :pgProvider');
            expect(countSql).toContain('AND pm.pgProvider = :pgProvider');
            expect(rowsOptions.replacements.pgProvider).toBe('ccavenue_pg');
            expect(countOptions.replacements.pgProvider).toBe('ccavenue_pg');
        });

        it('lists every gateway when none is selected', async () => {
            await getAllPaymentMethods({});

            for (const [sql] of sequelize.query.mock.calls) {
                expect(sql).not.toContain('AND pm.pgProvider = :pgProvider');
            }
        });
    });

    describe('payment method filter', () => {
        beforeEach(() => {
            sequelize.query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0 }]);
        });

        it('lists only wallet rows', async () => {
            await getAllPaymentMethods({ paymentMethod: 'WALLET' });

            const [[rowsSql, rowsOptions], [countSql, countOptions]] = sequelize.query.mock.calls;
            expect(rowsSql).toContain('AND pm.paymentMethod = :paymentMethod');
            expect(countSql).toContain('AND pm.paymentMethod = :paymentMethod');
            expect(rowsOptions.replacements.paymentMethod).toBe('WALLET');
            expect(countOptions.replacements.paymentMethod).toBe('WALLET');
        });

        it('lists every payment method when none is selected', async () => {
            await getAllPaymentMethods({});

            for (const [sql] of sequelize.query.mock.calls) {
                expect(sql).not.toContain('AND pm.paymentMethod = :paymentMethod');
            }
        });
    });

    describe('status filter', () => {
        beforeEach(() => {
            sequelize.query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0 }]);
        });

        it.each([true, false])('lists only rows whose status is %s', async (isActive) => {
            await getAllPaymentMethods({ isActive });

            const [[rowsSql, rowsOptions], [countSql, countOptions]] = sequelize.query.mock.calls;
            expect(rowsSql).toContain('AND pm.isActive = :isActive');
            expect(countSql).toContain('AND pm.isActive = :isActive');
            expect(rowsOptions.replacements.isActive).toBe(isActive);
            expect(countOptions.replacements.isActive).toBe(isActive);
        });

        it('lists every status when the status is not a validated boolean', async () => {
            await getAllPaymentMethods({ isActive: 'true' });

            for (const [sql] of sequelize.query.mock.calls) {
                expect(sql).not.toContain('AND pm.isActive = :isActive');
            }
        });
    });

    describe('partner filter', () => {
        beforeEach(() => {
            sequelize.query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: 0 }]);
        });

        it('lists only default-partner rows for the default filter', async () => {
            await getAllPaymentMethods({ partnerId: 'default' });

            const [[rowsSql], [countSql]] = sequelize.query.mock.calls;
            expect(rowsSql).toContain('AND pm.partnerId IS NULL');
            expect(countSql).toContain('AND pm.partnerId IS NULL');
        });

        it('lists only the selected partner rows', async () => {
            await getAllPaymentMethods({ partnerId: 739 });

            const [[rowsSql, rowsOptions], [countSql, countOptions]] = sequelize.query.mock.calls;
            expect(rowsSql).toContain('AND pm.partnerId = :partnerId');
            expect(countSql).toContain('AND pm.partnerId = :partnerId');
            expect(rowsOptions.replacements.partnerId).toBe(739);
            expect(countOptions.replacements.partnerId).toBe(739);
        });

        it('lists every partner when no partner is selected', async () => {
            await getAllPaymentMethods({});

            for (const [sql] of sequelize.query.mock.calls) {
                expect(sql).not.toContain('AND pm.partnerId IS NULL');
                expect(sql).not.toContain('AND pm.partnerId = :partnerId');
            }
        });
    });
});
