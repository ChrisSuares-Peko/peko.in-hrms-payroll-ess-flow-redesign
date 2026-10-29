import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useReportPayment from '../../hooks/useReportPayment';
import { ValuationFormValues } from '../../types/index';

const dispatch = vi.fn();
const navigate = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: (selector: any) =>
        selector({ reducer: { auth: { id: 147, role: 'corporate' } } }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn().mockResolvedValue({ surcharge: '11.80', ccf1Amount: '0' }),
}));

const formValues: ValuationFormValues = {
    purpose: 'sell',
    counterparty: '',
    vehicleCategory: 'car',
    make: 'Kia',
    model: 'Seltos',
    manufacturingYear: '2021',
    variant: 'HTX',
    kilometresDriven: '48000',
    city: 'Srinagar',
};

const args = {
    reportType: 'valuation' as const,
    vehicle: { vehicleNumber: 'JK01AV0507', manufacturer: 'Kia', model: 'Seltos' },
    reportPrice: 199,
    formValues,
};

const paymentDataFrom = () => {
    const call = dispatch.mock.calls.find(
        ([action]) => action?.type === 'payment/setPaymentData'
    );
    return call?.[0]?.payload;
};

describe('useReportPayment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // The one string that, if wrong, silently routes every purchase to the generic
    // /payments/payment-success page instead of the Car Reports success screen.
    it('routes the purchase to the Car Reports success page', async () => {
        const { result } = renderHook(() => useReportPayment());

        await act(async () => {
            await result.current.pay(args);
        });

        expect(paymentDataFrom()).toEqual(
            expect.objectContaining({
                url: 'officeAndBusiness/garage/car-report/payment',
                successPath: '/turbo/vehicle-reports/success',
            })
        );
    });

    // Everything Droom's PaaS report needs (spec, city, category) rides in flat on the
    // payload — the backend orders the PDF from these after taking payment.
    it('sends the flattened valuation form with the purchase', async () => {
        const { result } = renderHook(() => useReportPayment());

        await act(async () => {
            await result.current.pay(args);
        });

        expect(paymentDataFrom().payload.city).toBe('Srinagar');
        expect(paymentDataFrom().payload.vehicleCategory).toBe('car');
    });

    // Display only — the backend recomputes it — but it must still reach the bill.
    it('adds the looked-up surcharge to the amount payable', async () => {
        const { result } = renderHook(() => useReportPayment());

        await act(async () => {
            await result.current.pay(args);
        });

        expect(paymentDataFrom().totalAmount).toBe(210.8);
    });

    it('refuses to continue without a vehicle', async () => {
        const { result } = renderHook(() => useReportPayment());

        await act(async () => {
            await result.current.pay({ ...args, vehicle: undefined as any });
        });

        expect(paymentDataFrom()).toBeUndefined();
        expect(navigate).not.toHaveBeenCalled();
    });
});
