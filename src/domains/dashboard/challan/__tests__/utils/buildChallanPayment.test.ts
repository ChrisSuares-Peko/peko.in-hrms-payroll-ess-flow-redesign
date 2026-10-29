import { describe, it, expect, vi } from 'vitest';

import { accessKeys } from '@utils/accessKeys';

import { Challan } from '../../types/index';
import { buildChallanPayment } from '../../utils/buildChallanPayment';

// Keep the money formatter deterministic so assertions aren't tied to locale output.
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: (n: number) => String(n),
}));

const makeChallan = (over: Partial<Challan> = {}): Challan => ({
    challan_number: 'CH1',
    registration_number: 'KA01AB1234',
    offense_details: 'Over speeding',
    challan_place: 'MG Road',
    state: 'KA',
    amount: 500,
    challan_date: '2026-01-01 10:00:00',
    challan_status: 'Pending',
    ...over,
});

describe('buildChallanPayment', () => {
    it('sums challan_price and adds the convenience fee for totalAmount', () => {
        const challans = [
            makeChallan({ challan_price: 500 }),
            makeChallan({ challan_number: 'CH2', challan_price: 300 }),
        ];
        const { totalAmount } = buildChallanPayment(challans, 50);
        expect(totalAmount).toBe(850); // 500 + 300 + 50
    });

    it('falls back to amount when challan_price is missing', () => {
        const challans = [makeChallan({ challan_price: undefined, amount: 700 })];
        const { totalAmount, payload } = buildChallanPayment(challans);
        expect(totalAmount).toBe(700);
        expect(payload.challans[0].challan_price).toBe(700);
    });

    it('builds bill-summary rows using the offence with the challan number as subtext', () => {
        const { billSummary } = buildChallanPayment([makeChallan({ challan_price: 500 })]);
        expect(billSummary[0]).toEqual({ key: 'Over speeding', subText: 'CH1', value: '₹ 500' });
    });

    it('falls back to the challan number as the row key when the offence is empty', () => {
        const { billSummary } = buildChallanPayment([
            makeChallan({ offense_details: '', challan_price: 500 }),
        ]);
        expect(billSummary[0].key).toBe('CH1');
        expect(billSummary[0].subText).toBeUndefined();
    });

    it('includes the challan accessKey and reg_num in the payload', () => {
        const { payload } = buildChallanPayment([makeChallan({ challan_price: 500 })]);
        expect(payload.accessKey).toBe(accessKeys.challan);
        expect(payload.reg_num).toBe('KA01AB1234');
        expect(payload.challans).toHaveLength(1);
    });

    it('produces a payment summary with the challan total and convenience fee', () => {
        const { paymentSummary } = buildChallanPayment([makeChallan({ challan_price: 500 })], 50);
        expect(paymentSummary).toEqual([
            { key: 'Challan Total', value: '₹ 500' },
            { key: 'Convenience Fee', value: '50' },
        ]);
    });
});
