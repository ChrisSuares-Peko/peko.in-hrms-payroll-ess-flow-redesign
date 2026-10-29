import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { setPaymentData } from '@domains/dashboard/payments/slices/payment';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { store } from '@src/store/store';

import { VendorServiceDetail, getVendorServiceDetailsApi } from '../../apis';
import useGovtServicePayment from '../../hooks/useGovtServicePayment';
import useSurchargeApi from '../../hooks/useSurchargeApi';
import { Service } from '../../types';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();
const mockGetSurcharge = vi.fn();
let mockSurchargeLoading = false;

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/store/store', () => ({
    store: { getState: vi.fn() },
}));

vi.mock('../../apis', () => ({
    getVendorServiceDetailsApi: vi.fn(),
}));

vi.mock('../../hooks/useSurchargeApi', () => ({
    default: vi.fn(),
}));

const mockState = { reducer: { auth: { role: 'corporate', id: 1 } } };

const service: Service = {
    id: 10,
    serviceId: 100,
    name: 'Trademark Registration',
    slug: 'trademark-registration',
    accessKey: 'catalog-10',
    description: 'Register your trademark',
    category: 'Registration',
    tab: 'Mandatory',
    duration: '7 days',
    price: 5000,
    govtFee: 4500,
};

const variants = [
    {
        id: 11,
        service_name: 'Trademark Registration',
        variant_name: 'Standard',
        price: 1999,
        government_fee_amount: 4500,
    },
    {
        id: 12,
        service_name: 'Trademark Registration',
        variant_name: '',
        price: '2999',
        government_fee_amount: '9000',
    },
] as unknown as VendorServiceDetail[];

const GOV_BASE = '/more-services/government-services';

const setVendorGidInStore = (vendorGid: string | null) => {
    (store.getState as Mock).mockReturnValue({ reducer: { governmentServices: { vendorGid } } });
};

describe('useGovtServicePayment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSurchargeLoading = false;
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as Mock).mockImplementation(selector => selector(mockState));
        (useSurchargeApi as Mock).mockImplementation(() => ({
            getGovtServiceSurcharge: mockGetSurcharge,
            isLoading: mockSurchargeLoading,
        }));
        mockGetSurcharge.mockResolvedValue({ surcharge: 0, corporateCashback: 0 });
        setVendorGidInStore(null);
    });

    describe('variants loading', () => {
        it('fetches variants for the serviceId and selects the first one', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: service })
            );
            expect(result.current.isPricingLoading).toBe(true);

            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));
            expect(getVendorServiceDetailsApi).toHaveBeenCalledWith(1, 'corporate', 100);
            expect(result.current.variants).toEqual(variants);
            expect(result.current.selectedVariantId).toBe(11);
            expect(result.current.selectedVariant).toBe(variants[0]);
            expect(result.current.pekoFee).toBe(1999);
            expect(result.current.govFee).toBe(4500);
            expect(result.current.totalAmount).toBe(6499);
        });

        it('coerces numeric-string variant fields so totals add rather than concatenate', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: service })
            );
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));

            act(() => {
                result.current.setSelectedVariantId(12);
            });
            expect(result.current.selectedVariant).toBe(variants[1]);
            expect(result.current.pekoFee).toBe(2999);
            expect(result.current.govFee).toBe(9000);
            expect(result.current.totalAmount).toBe(11999);
        });

        it('falls back to cached catalog pricing when no variants come back', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue([]);

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: service })
            );
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));

            expect(result.current.selectedVariantId).toBeNull();
            expect(result.current.selectedVariant).toBeNull();
            expect(result.current.pekoFee).toBe(5000);
            expect(result.current.govFee).toBe(4500);
            expect(result.current.totalAmount).toBe(9500);
        });

        it('treats a Free cached govtFee as 0', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue([]);

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: { ...service, govtFee: 'Free' } })
            );
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));
            expect(result.current.govFee).toBe(0);
            expect(result.current.totalAmount).toBe(5000);
        });

        it('skips the fetch and stops loading when there is no serviceId', async () => {
            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: { ...service, serviceId: null } })
            );

            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));
            expect(getVendorServiceDetailsApi).not.toHaveBeenCalled();
            expect(result.current.variants).toEqual([]);
            expect(result.current.totalAmount).toBe(9500);
        });

        it('returns zero pricing when there is no selected service', async () => {
            const { result } = renderHook(() => useGovtServicePayment({ selectedService: null }));

            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));
            expect(getVendorServiceDetailsApi).not.toHaveBeenCalled();
            expect(result.current.govFee).toBe(0);
            expect(result.current.pekoFee).toBe(0);
            expect(result.current.totalAmount).toBe(0);
        });

        it('refetches only when serviceId changes', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);

            const { result, rerender } = renderHook(
                (props: { selectedService: Service | null }) => useGovtServicePayment(props),
                { initialProps: { selectedService: service } }
            );
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));

            rerender({ selectedService: { ...service, name: 'Renamed' } });
            expect(getVendorServiceDetailsApi).toHaveBeenCalledTimes(1);

            rerender({ selectedService: { ...service, serviceId: 200 } });
            await waitFor(() => expect(getVendorServiceDetailsApi).toHaveBeenCalledTimes(2));
            expect(getVendorServiceDetailsApi).toHaveBeenLastCalledWith(1, 'corporate', 200);
        });

        it('clears variants when serviceId becomes null', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);

            const { result, rerender } = renderHook(
                (props: { selectedService: Service | null }) => useGovtServicePayment(props),
                { initialProps: { selectedService: service as Service | null } }
            );
            await waitFor(() => expect(result.current.selectedVariantId).toBe(11));

            rerender({ selectedService: null });
            await waitFor(() => expect(result.current.variants).toEqual([]));
            expect(result.current.selectedVariantId).toBeNull();
        });
    });

    it('exposes the surcharge hook loading flag as isProceeding', async () => {
        mockSurchargeLoading = true;
        (getVendorServiceDetailsApi as Mock).mockResolvedValue([]);

        const { result } = renderHook(() => useGovtServicePayment({ selectedService: service }));
        await waitFor(() => expect(result.current.isPricingLoading).toBe(false));
        expect(result.current.isProceeding).toBe(true);
    });

    describe('proceedToPayment', () => {
        it('does nothing when there is no selected service', async () => {
            const { result } = renderHook(() => useGovtServicePayment({ selectedService: null }));
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));

            await act(async () => {
                await result.current.proceedToPayment();
            });
            expect(mockGetSurcharge).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('dispatches full payment data for the selected variant and navigates to payments', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);
            mockGetSurcharge.mockResolvedValue({ surcharge: 120, corporateCashback: 20 });
            setVendorGidInStore('G-1');

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: service })
            );
            await waitFor(() => expect(result.current.selectedVariantId).toBe(11));

            await act(async () => {
                await result.current.proceedToPayment();
            });

            expect(mockGetSurcharge).toHaveBeenCalledWith(6499);
            expect(mockDispatch).toHaveBeenCalledWith(
                setPaymentData({
                    title: 'Government Service Payment',
                    billSummary: [
                        { key: 'Service', value: 'Trademark Registration' },
                        { key: 'Plan', value: 'Standard' },
                    ],
                    paymentSummary: [
                        { key: 'Price', value: `₹ ${(1999).toLocaleString('en-IN')}` },
                        { key: 'Government Fee', value: `₹ ${(4500).toLocaleString('en-IN')}` },
                        { key: 'Platform fee (inclusive of GST)', value: '₹ 120' },
                    ],
                    totalAmount: 6599,
                    payload: {
                        serviceId: 100,
                        accessKey: 'gov_services',
                        vendorCatalogId: '11',
                        amount: 6499,
                        currentUrl: window.location.href,
                        gid: 'G-1',
                    },
                    url: 'purchase/govt-services/applications/payment',
                    earningCashbackAmount: 20,
                    successPath: `${GOV_BASE}/service/10/register`,
                    navigatePath: `${GOV_BASE}/service/10`,
                } as never)
            );
            expect(mockNavigate).toHaveBeenCalledWith('/payments');
        });

        it('routes successPath into the objection form for a Trademark Objection service', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);
            mockGetSurcharge.mockResolvedValue({ surcharge: 120, corporateCashback: 20 });
            setVendorGidInStore('G-1');

            const objectionService = { ...service, name: 'Trademark Objection' };
            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: objectionService })
            );
            await waitFor(() => expect(result.current.selectedVariantId).toBe(11));

            await act(async () => {
                await result.current.proceedToPayment();
            });

            expect(mockDispatch).toHaveBeenCalledWith(
                setPaymentData(
                    expect.objectContaining({
                        successPath: `${GOV_BASE}/service/10/objection`,
                    }) as never
                ) as never
            );
        });

        it('routes successPath into the gst-register form for a GST Registration service', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);
            mockGetSurcharge.mockResolvedValue({ surcharge: 120, corporateCashback: 20 });
            setVendorGidInStore('G-1');

            // GST_REGISTRATION_SERVICE_ID (utils/gstForm.ts) — distinct from the shared `service`
            // fixture's own serviceId, which belongs to Trademark Registration.
            const gstRegistrationService = { ...service, serviceId: 79 };
            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: gstRegistrationService })
            );
            await waitFor(() => expect(result.current.selectedVariantId).toBe(11));

            await act(async () => {
                await result.current.proceedToPayment();
            });

            // Previously fell through to the generic "register" (Trademark) segment — see
            // useGovtServicePayment.ts's formSegment comment.
            expect(mockDispatch).toHaveBeenCalledWith(
                setPaymentData(
                    expect.objectContaining({
                        successPath: '/government-services/service/10/gst-register',
                    }) as never
                ) as never
            );
        });

        it('omits Plan when the variant has no name and uses the switched variant id', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue(variants);

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: service })
            );
            await waitFor(() => expect(result.current.selectedVariantId).toBe(11));
            act(() => {
                result.current.setSelectedVariantId(12);
            });

            await act(async () => {
                await result.current.proceedToPayment();
            });

            const { payload } = mockDispatch.mock.calls[0][0];
            expect(payload.billSummary).toEqual([
                { key: 'Service', value: 'Trademark Registration' },
            ]);
            expect(payload.payload.vendorCatalogId).toBe('12');
            expect(payload.payload.amount).toBe(11999);
            expect(mockGetSurcharge).toHaveBeenCalledWith(11999);
        });

        it('falls back to service accessKey/name, omits gid, zero fee and zero surcharge rows', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue([]);

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: { ...service, govtFee: 'Free' } })
            );
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));

            await act(async () => {
                await result.current.proceedToPayment();
            });

            const { payload } = mockDispatch.mock.calls[0][0];
            expect(payload.billSummary).toEqual([
                { key: 'Service', value: 'Trademark Registration' },
            ]);
            expect(payload.paymentSummary).toEqual([
                { key: 'Price', value: `₹ ${(5000).toLocaleString('en-IN')}` },
            ]);
            expect(payload.totalAmount).toBe(5000);
            expect(payload.earningCashbackAmount).toBe(0);
            expect(payload.payload.vendorCatalogId).toBe('catalog-10');
            expect(payload.payload).not.toHaveProperty('gid');
            expect(mockNavigate).toHaveBeenCalledWith('/payments');
        });

        it('reads vendorGid from the store at call time, not from render', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue([]);
            setVendorGidInStore(null);

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: service })
            );
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));

            setVendorGidInStore('G-late');
            await act(async () => {
                await result.current.proceedToPayment();
            });

            expect(mockDispatch.mock.calls[0][0].payload.payload.gid).toBe('G-late');
        });

        it('does not dispatch or navigate when the surcharge lookup throws', async () => {
            (getVendorServiceDetailsApi as Mock).mockResolvedValue([]);
            mockGetSurcharge.mockRejectedValue(new Error('surcharge failed'));

            const { result } = renderHook(() =>
                useGovtServicePayment({ selectedService: service })
            );
            await waitFor(() => expect(result.current.isPricingLoading).toBe(false));

            await act(async () => {
                await expect(result.current.proceedToPayment()).rejects.toThrow('surcharge failed');
            });
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
