import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    getOrderStatus,
    getVisaCountries,
    getVisaDestinations,
    searchVisaOptions,
    stageVisaDocument,
} from '../../api/visa';
import {
    mapProductToVisaOption,
    useStageVisaDocuments,
    useTrackVisaApplication,
    useVisaCountries,
    useVisaDestinations,
    useVisaSearch,
} from '../../hooks/useVisaApi';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('@src/slices/apiSlice', () => ({
    default: (state = {}) => state,
    showToast: vi.fn(payload => ({ type: 'api/showToast', payload })),
}));

vi.mock('../../api/visa', () => ({
    getVisaDestinations: vi.fn(),
    getVisaCountries: vi.fn(),
    searchVisaOptions: vi.fn(),
    stageVisaDocument: vi.fn(),
    getOrderStatus: vi.fn(),
}));

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockProduct = {
    product_id: 101,
    visa_name: 'Dubai Tourist Visa 30 Days',
    visa_code: 'DXB-30',
    visa_type: 'evisa',
    visa_duration: '30D',
    visa_validity: '60D',
    entries_allowed: '1',
    notes: ['Passport must be valid for 6 months', 'No criminal record'],
    breakup: {
        total_value: 5000,
        total_tax_amount: 270,
        total_service_fee: 500,
        total_tax_service_fee: 770,
        discount_applied: 0,
        total_round_off: 0,
        markup_tax_applicable: 0,
        total_taxable_value: 5000,
        total_non_taxable_value: 0,
        total_fx_convenience_fee: 0,
        total_component_value: 4000,
        components: [],
        total_govt_fees: 3000,
    },
    age_cost_breakup: {
        adult: {
            'Embassy Fees': 3000,
            'Service Fee': 500,
            'Platform Fee': 200,
            'Total Tax': 270,
            Total: 5000,
        },
    },
    min_time_delta_travel_date: 3,
    base_currency: 'INR',
    embassy_tat: 5,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Visa Hooks', () => {
    let mockDispatch: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch = vi.fn();

        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    auth: { id: 1, role: 'user' },
                    visa: { searchResults: [], isLoading: false, orderNumber: 'ORD-TEST-001' },
                    user: { user: { email: 'test@peko.one', mobileNo: '9876543210' } },
                },
            })
        );
    });

    // ─── mapProductToVisaOption ────────────────────────────────────────────────

    describe('mapProductToVisaOption', () => {
        it('should map product_id to string id and numeric productId', () => {
            const option = mapProductToVisaOption(mockProduct as any);

            expect(option.id).toBe('101');
            expect(option.productId).toBe(101);
        });

        it('should parse duration in days correctly (30D → 30)', () => {
            const option = mapProductToVisaOption(mockProduct as any);

            expect(option.days).toBe(30);
        });

        it('should parse duration in months and convert to days (3M → 90)', () => {
            const option = mapProductToVisaOption({ ...mockProduct, visa_duration: '3M' } as any);

            expect(option.days).toBe(90);
        });

        it('should set Single Entry when entries_allowed is 1', () => {
            const option = mapProductToVisaOption(mockProduct as any);

            expect(option.entryType).toBe('Single Entry');
        });

        it('should set Multiple Entry when entries_allowed is greater than 1', () => {
            const option = mapProductToVisaOption({ ...mockProduct, entries_allowed: '2' } as any);

            expect(option.entryType).toBe('Multiple Entry');
        });

        it('should set Multiple Entry for non-numeric entries_allowed', () => {
            const option = mapProductToVisaOption({ ...mockProduct, entries_allowed: 'unlimited' } as any);

            expect(option.entryType).toBe('Multiple Entry');
        });

        it('should set Single Entry when entries_allowed is the descriptive string "Single"', () => {
            const option = mapProductToVisaOption({ ...mockProduct, entries_allowed: 'Single' } as any);

            expect(option.entryType).toBe('Single Entry');
        });

        it('should set Multiple Entry when entries_allowed is the descriptive string "Multiple"', () => {
            const option = mapProductToVisaOption({ ...mockProduct, entries_allowed: 'Multiple' } as any);

            expect(option.entryType).toBe('Multiple Entry');
        });

        it('should calculate totalPayNow as platformFee + gst + serviceFee', () => {
            const option = mapProductToVisaOption(mockProduct as any);

            expect(option.totalPayNow).toBe(200 + 270 + 500);
            expect(option.platformFee).toBe(200);
            expect(option.gst).toBe(270);
            expect(option.serviceFee).toBe(500);
            expect(option.embassyFee).toBe(3000);
        });

        it('should build processing time range from embassy_tat', () => {
            const option = mapProductToVisaOption(mockProduct as any);

            expect(option.processingTime).toBe('5–7 Business Days');
        });

        it('should fall back to 3–5 Business Days when embassy_tat is falsy', () => {
            const option = mapProductToVisaOption({ ...mockProduct, embassy_tat: 0 } as any);

            expect(option.processingTime).toBe('3–5 Business Days');
        });

        it('should join non-empty notes into visaInfo', () => {
            const option = mapProductToVisaOption(mockProduct as any);

            expect(option.visaInfo).toBe('Passport must be valid for 6 months. No criminal record');
        });

        it('should use fallback visaInfo when notes array is empty', () => {
            const option = mapProductToVisaOption({
                ...mockProduct,
                notes: [],
            } as any);

            expect(option.visaInfo).toBe('Valid for 30D from date of entry.');
        });

        it('should include 4 standard required documents', () => {
            const option = mapProductToVisaOption(mockProduct as any);

            expect(option.requiredDocuments).toHaveLength(4);
            expect(option.requiredDocuments[0]).toMatch(/passport/i);
        });
    });

    // ─── useVisaCountries ──────────────────────────────────────────────────────

    describe('useVisaCountries', () => {
        it('should call getVisaCountries with auth params on mount', async () => {
            (getVisaCountries as any).mockResolvedValue([]);

            renderHook(() => useVisaCountries());

            await act(async () => {});

            expect(getVisaCountries).toHaveBeenCalledWith({ userType: 'user', userId: 1 });
        });

        it('should set countries and derived countryOptions on success', async () => {
            const mockCountries = [
                { id: 103, name: 'India', code: 'IN' },
                { id: 233, name: 'UAE', code: 'AE' },
            ];
            (getVisaCountries as any).mockResolvedValue(mockCountries);

            const { result } = renderHook(() => useVisaCountries());

            await act(async () => {});

            expect(result.current.countries).toEqual(mockCountries);
            expect(result.current.countryOptions).toEqual([
                { label: 'India', value: 103 },
                { label: 'UAE', value: 233 },
            ]);
        });

        it('should start with isLoading true and set it false after fetch', async () => {
            (getVisaCountries as any).mockResolvedValue([]);

            const { result } = renderHook(() => useVisaCountries());

            expect(result.current.isLoading).toBe(true);

            await act(async () => {});

            expect(result.current.isLoading).toBe(false);
        });

        it('should not update countries when API returns false', async () => {
            (getVisaCountries as any).mockResolvedValue(false);

            const { result } = renderHook(() => useVisaCountries());

            await act(async () => {});

            expect(result.current.countries).toEqual([]);
            expect(result.current.countryOptions).toEqual([]);
        });
    });

    // ─── useVisaDestinations ──────────────────────────────────────────────────

    describe('useVisaDestinations', () => {
        it('should call getVisaDestinations with auth params on mount', async () => {
            (getVisaDestinations as any).mockResolvedValue([]);

            renderHook(() => useVisaDestinations());

            await act(async () => {});

            expect(getVisaDestinations).toHaveBeenCalledWith({ userType: 'user', userId: 1 });
        });

        it('should set destinations on success', async () => {
            const mockDestinations = [
                { destination: 'United Arab Emirates', country_id: 233, visa_types: ['evisa'], visa_categories: ['Tourist', 'Business'] },
                { destination: 'Singapore', country_id: 197, visa_types: ['evisa'], visa_categories: ['Tourist'] },
            ];
            (getVisaDestinations as any).mockResolvedValue(mockDestinations);

            const { result } = renderHook(() => useVisaDestinations());

            await act(async () => {});

            expect(result.current.destinations).toEqual(mockDestinations);
            expect(result.current.isLoading).toBe(false);
        });

        it('should leave destinations empty when API returns false', async () => {
            (getVisaDestinations as any).mockResolvedValue(false);

            const { result } = renderHook(() => useVisaDestinations());

            await act(async () => {});

            expect(result.current.destinations).toEqual([]);
        });
    });

    // ─── useVisaSearch ────────────────────────────────────────────────────────

    describe('useVisaSearch', () => {
        it('should call searchVisaOptions with correct params including auth', async () => {
            (searchVisaOptions as any).mockResolvedValue([]);

            renderHook(() =>
                useVisaSearch({ adult: 2, child: 1, infant: 0, destination: 233, travelDate: '2025-06-01' })
            );

            await act(async () => {});

            expect(searchVisaOptions).toHaveBeenCalledWith(
                expect.objectContaining({
                    userType: 'user',
                    userId: 1,
                    adult: 2,
                    child: 1,
                    infant: 0,
                    destination: 233,
                    travelDate: '2025-06-01',
                })
            );
        });

        it('should dispatch setVisaLoading(true) before and false after fetch', async () => {
            (searchVisaOptions as any).mockResolvedValue([]);

            renderHook(() => useVisaSearch({ adult: 1, destination: 233 }));

            await act(async () => {});

            const calls = mockDispatch.mock.calls.map(([arg]: any[]) => arg);
            const loadingCalls = calls.filter((a: any) => a?.type === 'visa/setVisaLoading');
            expect(loadingCalls[0]?.payload).toBe(true);
            expect(loadingCalls[loadingCalls.length - 1]?.payload).toBe(false);
        });

        it('should map API products to visaOptions and dispatch search results', async () => {
            (searchVisaOptions as any).mockResolvedValue([mockProduct]);

            const { result } = renderHook(() => useVisaSearch({ adult: 1, destination: 233 }));

            await act(async () => {});

            expect(result.current.visaOptions).toHaveLength(1);
            expect(result.current.visaOptions[0].id).toBe('101');
            expect(result.current.visaOptions[0].name).toBe('Dubai Tourist Visa 30 Days');
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'visa/setVisaSearchResults' })
            );
        });

        it('should not dispatch results or update options when API returns false', async () => {
            (searchVisaOptions as any).mockResolvedValue(false);

            const { result } = renderHook(() => useVisaSearch({ adult: 1, destination: 233 }));

            await act(async () => {});

            expect(result.current.visaOptions).toEqual([]);
            const resultDispatches = mockDispatch.mock.calls.map(([arg]: any[]) => arg?.type);
            expect(resultDispatches).not.toContain('visa/setVisaSearchResults');
        });

        it('should use default values for missing params', async () => {
            (searchVisaOptions as any).mockResolvedValue([]);

            renderHook(() => useVisaSearch({ destination: 233, adult: 1 }));

            await act(async () => {});

            expect(searchVisaOptions).toHaveBeenCalledWith(
                expect.objectContaining({
                    adult: 1,
                    child: 0,
                    infant: 0,
                    residency: 103,
                    nationality: 103,
                    travelDate: '',
                    category: 'Tourist',
                })
            );
        });
    });

    // ─── useStageVisaDocuments ─────────────────────────────────────────────────
    // Documents are now only uploaded to storage at this stage — no vendor
    // order/application is created here anymore (that happens at payment time).

    describe('useStageVisaDocuments', () => {
        const passportFront = new File(['front'], 'front.jpg', { type: 'image/jpeg' });
        const passportBack = new File(['back'], 'back.jpg', { type: 'image/jpeg' });
        const photograph = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

        it('should stage each provided document and return document_code/s3Key pairs', async () => {
            (stageVisaDocument as any).mockImplementation(({ document_code }: any) =>
                Promise.resolve({ status: true, data: { s3Key: `s3/${document_code}`, documentCode: document_code } })
            );

            const { result } = renderHook(() => useStageVisaDocuments());

            let response: any;
            await act(async () => {
                response = await result.current.stageDocuments({
                    PASSPORT_FRONT: passportFront,
                    PASSPORT_BACK: passportBack,
                    PHOTOGRAPH: photograph,
                });
            });

            expect(stageVisaDocument).toHaveBeenCalledTimes(3);
            expect(response).toEqual([
                { document_code: 'PASSPORT_FRONT', s3Key: 's3/PASSPORT_FRONT' },
                { document_code: 'PASSPORT_BACK', s3Key: 's3/PASSPORT_BACK' },
                { document_code: 'PHOTOGRAPH', s3Key: 's3/PHOTOGRAPH' },
            ]);
        });

        it('should call stageVisaDocument with auth params, file and document_code', async () => {
            (stageVisaDocument as any).mockResolvedValue({
                status: true,
                data: { s3Key: 's3/PASSPORT_FRONT', documentCode: 'PASSPORT_FRONT' },
            });

            const { result } = renderHook(() => useStageVisaDocuments());

            await act(async () => {
                await result.current.stageDocuments({ PASSPORT_FRONT: passportFront });
            });

            expect(stageVisaDocument).toHaveBeenCalledWith({
                userType: 'user',
                userId: 1,
                file: passportFront,
                document_code: 'PASSPORT_FRONT',
            });
        });

        it('should skip null documents and only stage provided ones', async () => {
            (stageVisaDocument as any).mockResolvedValue({
                status: true,
                data: { s3Key: 's3/PASSPORT_FRONT', documentCode: 'PASSPORT_FRONT' },
            });

            const { result } = renderHook(() => useStageVisaDocuments());

            await act(async () => {
                await result.current.stageDocuments({ PASSPORT_FRONT: passportFront, PASSPORT_BACK: null, PHOTOGRAPH: null });
            });

            expect(stageVisaDocument).toHaveBeenCalledTimes(1);
            expect(stageVisaDocument).toHaveBeenCalledWith(
                expect.objectContaining({ document_code: 'PASSPORT_FRONT' })
            );
        });

        it('should return an empty array and not call the API when no documents are provided', async () => {
            const { result } = renderHook(() => useStageVisaDocuments());

            let response: any;
            await act(async () => {
                response = await result.current.stageDocuments();
            });

            expect(response).toEqual([]);
            expect(stageVisaDocument).not.toHaveBeenCalled();
        });

        it('should return false and dispatch an error toast when a staging call fails', async () => {
            (stageVisaDocument as any)
                .mockResolvedValueOnce({ status: true, data: { s3Key: 's3/PASSPORT_FRONT', documentCode: 'PASSPORT_FRONT' } })
                .mockResolvedValueOnce({ status: false, data: {} });

            const { result } = renderHook(() => useStageVisaDocuments());

            let response: any;
            await act(async () => {
                response = await result.current.stageDocuments({ PASSPORT_FRONT: passportFront, PASSPORT_BACK: passportBack });
            });

            expect(response).toBe(false);
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'api/showToast' })
            );
        });

        it('should return false when the API call itself returns false', async () => {
            (stageVisaDocument as any).mockResolvedValue(false);

            const { result } = renderHook(() => useStageVisaDocuments());

            let response: any;
            await act(async () => {
                response = await result.current.stageDocuments({ PASSPORT_FRONT: passportFront });
            });

            expect(response).toBe(false);
        });

        it('should toggle isLoading while staging documents', async () => {
            let resolveUpload: (v: any) => void = () => {};
            (stageVisaDocument as any).mockImplementation(() => new Promise(resolve => { resolveUpload = resolve; }));

            const { result } = renderHook(() => useStageVisaDocuments());

            let stagePromise: Promise<any>;
            act(() => {
                stagePromise = result.current.stageDocuments({ PASSPORT_FRONT: passportFront });
            });

            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                resolveUpload({ status: true, data: { s3Key: 's3/PASSPORT_FRONT', documentCode: 'PASSPORT_FRONT' } });
                await stagePromise;
            });

            expect(result.current.isLoading).toBe(false);
        });
    });

    // ─── useTrackVisaApplication ──────────────────────────────────────────────

    describe('useTrackVisaApplication', () => {
        const mockOrderData = {
            order_number: 'VZA-2025-001',
            destination: 'United Arab Emirates',
            visa_name: '30 Day Tourist eVisa',
            visa_type: 'Tourist',
            visa_format: 'e-Visa',
            visa_duration: '30 Days',
            entries_allowed: 'Single Entry',
            travel_date: '2025-06-01',
            applicants_count: 1,
            frontend_status: 'Under Review',
            status_code: 'UNDER_REVIEW',
            documents: [],
        };

        it('should fetch order status on mount', async () => {
            (getOrderStatus as any).mockResolvedValue(mockOrderData);

            const { result } = renderHook(() => useTrackVisaApplication('VZA-2025-001'));

            await act(async () => {});

            expect(getOrderStatus).toHaveBeenCalledWith(
                expect.objectContaining({ userType: 'user', userId: 1, order_number: 'VZA-2025-001' })
            );
            expect(result.current.orderData).toEqual(mockOrderData);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should skip fetching when orderNumber is empty', async () => {
            const { result } = renderHook(() => useTrackVisaApplication(''));

            await act(async () => {});

            expect(getOrderStatus).not.toHaveBeenCalled();
            expect(result.current.orderData).toBeNull();
        });

        it('should set an error when the API returns no data', async () => {
            (getOrderStatus as any).mockResolvedValue(null);

            const { result } = renderHook(() => useTrackVisaApplication('VZA-2025-001'));

            await act(async () => {});

            expect(result.current.orderData).toBeNull();
            expect(result.current.error).toBe('ERROR');
        });

        it('should expose a refetch function that re-fetches order data', async () => {
            (getOrderStatus as any).mockResolvedValue(mockOrderData);

            const { result } = renderHook(() => useTrackVisaApplication('VZA-2025-001'));

            await act(async () => {});

            vi.clearAllMocks();

            const updatedOrderData = {
                ...mockOrderData,
                frontend_status: 'Visa Approved',
                status_code: 'APPROVED',
            };
            (getOrderStatus as any).mockResolvedValue(updatedOrderData);

            await act(async () => {
                await result.current.refetch();
            });

            expect(getOrderStatus).toHaveBeenCalledTimes(1);
            expect(result.current.orderData).toEqual(updatedOrderData);
        });
    });
});
