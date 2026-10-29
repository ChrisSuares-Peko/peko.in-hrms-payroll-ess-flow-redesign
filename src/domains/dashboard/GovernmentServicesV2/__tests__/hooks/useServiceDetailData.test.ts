import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getStates } from '@domains/dashboard/profile/api/general';
import useBasicInfoApi from '@domains/dashboard/profile/hooks/useBasicInfoApi';
import { useCompanyNameFallback } from '@domains/dashboard/profile/hooks/useCompanyNameFallback';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    VendorBusiness,
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getVendorBusinessesApi,
    getVendorServiceDocumentsApi,
} from '../../apis';
import useServiceDetailData from '../../hooks/useServiceDetailData';
import { Service } from '../../types';
import { EMPTY_PROFILE_VALUES } from '../../utils/serviceDetailForm';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();
let mockLocationState: unknown = null;

vi.mock('react-router-dom', () => ({
    useParams: () => ({ serviceId: '10' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@domains/dashboard/profile/api/general', () => ({
    getStates: vi.fn(),
}));

vi.mock('@domains/dashboard/profile/hooks/useBasicInfoApi', () => ({
    default: vi.fn(),
}));

vi.mock('@domains/dashboard/profile/hooks/useCompanyNameFallback', () => ({
    useCompanyNameFallback: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getGovernmentServiceApplicationApi: vi.fn(),
    getGovtServicesListApi: vi.fn(),
    getVendorBusinessesApi: vi.fn(),
    getVendorServiceDocumentsApi: vi.fn(),
}));

vi.mock('../../hooks/useGovtServicesListApi', () => ({
    mapApiItem: (item: Service) => item,
}));

const mockService: Service = {
    id: 10,
    serviceId: 100,
    name: 'Trademark Registration',
    slug: 'trademark-registration',
    accessKey: 'govt_trademark_registration',
    description: 'Register your trademark',
    category: 'Registration',
    tab: 'Mandatory',
    duration: '7 days',
    price: 5000,
    govtFee: 4500,
};

// Catalog-sourced Trademark service — its accessKey is the vendor catalog row id, not a govt_* key.
const catalogService: Service = { ...mockService, accessKey: '812' };

const basicInfo = {
    state: 'Karnataka',
    contactPersonName: 'Profile Contact',
    email: 'profile@peko.one',
    mobileNo: '9876543210',
};

const draftProfile = {
    legalBusinessName: 'Draft Brand Pvt Ltd',
    stateOfRegistration: 'Kerala',
    name: 'Draft Contact',
    email: 'draft@peko.one',
    phoneNumber: '9123456789',
    pan: 'ABCCE1234F',
    entityType: 'Private Limited Company',
};

const vendorBusinesses = [
    { application_id: 555, business_name: 'Peko Pvt Ltd', pan: 'PEKCE1111A', constitution: 'Private Limited Company' },
    { application_id: 777, business_name: 'Peko Trust', pan: 'PEKTE2222B', constitution: 'Trust' },
] as unknown as VendorBusiness[];

interface StoreState {
    selectedService: Service | null;
    servicesList: Service[];
}

const mockStore = ({ selectedService, servicesList }: StoreState) => {
    (useAppSelector as Mock).mockImplementation((selector) =>
        selector({
            reducer: {
                auth: { role: 'corporate', id: 1 },
                governmentServices: { selectedService, servicesList },
            },
        })
    );
};

const mockBasicInfo = (data: unknown, isLoading = false) => {
    (useBasicInfoApi as Mock).mockReturnValue({ data, isLoading });
};

describe('useServiceDetailData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocationState = null;
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (getStates as Mock).mockResolvedValue({ states: [{ label: 'Karnataka', value: 'Karnataka' }] });
        (useCompanyNameFallback as Mock).mockReturnValue({ name: 'Peko Company' });
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue(null);
        (getGovtServicesListApi as Mock).mockResolvedValue([]);
        (getVendorBusinessesApi as Mock).mockResolvedValue([]);
        (getVendorServiceDocumentsApi as Mock).mockResolvedValue([]);
        mockBasicInfo(basicInfo);
        mockStore({ selectedService: mockService, servicesList: [] });
    });

    describe('states list', () => {
        it('loads the states list on mount', async () => {
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.statesList).toEqual([{ label: 'Karnataka', value: 'Karnataka' }]));
        });

        it('keeps the states list empty when the API returns nothing', async () => {
            (getStates as Mock).mockResolvedValue(null);
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(getStates).toHaveBeenCalled());
            expect(result.current.statesList).toEqual([]);
        });
    });

    describe('fresh "Apply Now" visit (govt_trademark_registration)', () => {
        it('skips the draft lookup and prefills from the company name and basic info', async () => {
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(getGovernmentServiceApplicationApi).not.toHaveBeenCalled();
            expect(result.current.hasCheckedDraft).toBe(true);
            expect(result.current.resumeExisting).toBe(false);
            expect(result.current.profileValues).toEqual({
                ...EMPTY_PROFILE_VALUES,
                legalBusinessName: 'Peko Company',
                stateOfRegistration: 'Karnataka',
                name: 'Profile Contact',
                email: 'profile@peko.one',
                phoneNumber: '9876543210',
            });
        });

        it('never prefills the PAN from the profile', async () => {
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues.pan).toBe('');
            expect(result.current.isPanPrefilled).toBe(false);
        });

        it('treats the govt_ trademark service as non-vendor and uses local documents', async () => {
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.isVendorCatalogService).toBe(false);
            expect(result.current.documents).toEqual(['Example doc 1', 'Example doc 2', 'Example doc 3']);
            expect(getVendorBusinessesApi).not.toHaveBeenCalled();
            expect(getVendorServiceDocumentsApi).not.toHaveBeenCalled();
        });

        it('returns no documents for an unknown govt_ access key', async () => {
            mockStore({ selectedService: { ...mockService, accessKey: 'govt_unknown_service' }, servicesList: [] });
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.documents).toEqual([]);
        });

        it('keeps previous values for basic info fields that are missing', async () => {
            (useCompanyNameFallback as Mock).mockReturnValue({ name: undefined });
            mockBasicInfo({ state: 'Goa' });
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues).toEqual({ ...EMPTY_PROFILE_VALUES, stateOfRegistration: 'Goa' });
        });

        it('stays loading until basic info finishes loading, then hydrates', async () => {
            mockBasicInfo(null, true);
            const { result, rerender } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.hasCheckedDraft).toBe(true));
            expect(result.current.isProfileLoading).toBe(true);

            mockBasicInfo(basicInfo, false);
            rerender();

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues.name).toBe('Profile Contact');
        });

        it('unblocks the form even when basic info is empty', async () => {
            (useCompanyNameFallback as Mock).mockReturnValue({ name: undefined });
            mockBasicInfo(null, false);
            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues).toEqual(EMPTY_PROFILE_VALUES);
        });
    });

    describe('resuming an existing application', () => {
        it('passes the application row id to the draft lookup', async () => {
            mockLocationState = { resumeExisting: true, applicationRowId: 7 };

            renderHook(() => useServiceDetailData());

            await waitFor(() =>
                expect(getGovernmentServiceApplicationApi).toHaveBeenCalledWith(1, 'corporate', 'govt_trademark_registration', 7)
            );
        });

        it('passes null as the row id when navigation state has none', async () => {
            mockLocationState = { resumeExisting: true };

            renderHook(() => useServiceDetailData());

            await waitFor(() =>
                expect(getGovernmentServiceApplicationApi).toHaveBeenCalledWith(
                    1,
                    'corporate',
                    'govt_trademark_registration',
                    null
                )
            );
        });

        it('redirects a paid trademark registration straight into the register form', async () => {
            mockLocationState = { resumeExisting: true, applicationRowId: 7 };
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({ id: 42, paymentStatus: 'COMPLETED' });

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() =>
                expect(mockNavigate).toHaveBeenCalledWith('/more-services/government-services/service/10/register', {
                    state: { applicationRowId: 42 },
                })
            );
            expect(result.current.hasCheckedDraft).toBe(false);
            expect(result.current.isProfileLoading).toBe(true);
        });

        it('redirects a paid trademark objection into the objection form', async () => {
            mockLocationState = { resumeExisting: true };
            mockStore({ selectedService: { ...mockService, name: 'Trademark Objection' }, servicesList: [] });
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({ id: 43, paymentStatus: 'COMPLETED' });

            renderHook(() => useServiceDetailData());

            await waitFor(() =>
                expect(mockNavigate).toHaveBeenCalledWith('/more-services/government-services/service/10/objection', {
                    state: { applicationRowId: 43 },
                })
            );
        });

        it('prefills from the unpaid draft, overriding company name and basic info', async () => {
            mockLocationState = { resumeExisting: true };
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({
                id: 42,
                paymentStatus: 'PENDING',
                formData: { profile: draftProfile },
            });

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(mockNavigate).not.toHaveBeenCalled();
            expect(result.current.profileValues).toEqual(draftProfile);
            expect(result.current.isPanPrefilled).toBe(true);
        });

        it('ignores basic info entirely when a partial draft profile exists', async () => {
            mockLocationState = { resumeExisting: true };
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({
                id: 42,
                formData: { profile: { legalBusinessName: 'Draft Brand', email: 'draft@peko.one' } },
            });

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            // Draft present, so basic info is ignored entirely — blank draft fields stay blank.
            expect(result.current.profileValues).toEqual({
                ...EMPTY_PROFILE_VALUES,
                legalBusinessName: 'Draft Brand',
                email: 'draft@peko.one',
            });
            expect(result.current.isPanPrefilled).toBe(false);
        });

        it('falls back to company name and basic info when no draft exists', async () => {
            mockLocationState = { resumeExisting: true };
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue(null);

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.hasCheckedDraft).toBe(true);
            expect(result.current.profileValues.legalBusinessName).toBe('Peko Company');
            expect(result.current.profileValues.name).toBe('Profile Contact');
        });
    });

    describe('selected service rehydration', () => {
        it('dispatches the cached service when none is selected', () => {
            mockStore({ selectedService: null, servicesList: [mockService] });

            const { result } = renderHook(() => useServiceDetailData());

            expect(mockDispatch).toHaveBeenCalledWith({ type: 'governmentServices/setSelectedService', payload: mockService });
            expect(getGovtServicesListApi).not.toHaveBeenCalled();
            expect(result.current.selectedService).toBeNull();
        });

        it('ignores a selected service whose id does not match the route', async () => {
            mockStore({ selectedService: { ...mockService, id: 99 }, servicesList: [] });
            (getGovtServicesListApi as Mock).mockResolvedValue([mockService]);

            const { result } = renderHook(() => useServiceDetailData());

            expect(result.current.selectedService).toBeNull();
            await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: mockService })));
        });

        it('fetches the services list when the service is not cached', async () => {
            mockStore({ selectedService: null, servicesList: [] });
            (getGovtServicesListApi as Mock).mockResolvedValue([{ ...mockService, id: 3 }, mockService]);

            const { result } = renderHook(() => useServiceDetailData());

            expect(result.current.isFetching).toBe(true);
            await waitFor(() => expect(result.current.isFetching).toBe(false));
            expect(getGovtServicesListApi).toHaveBeenCalledWith(1, 'corporate');
            expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: mockService }));
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('falls back to the navigation-state service when the list has no match', async () => {
            const fallbackService = { ...mockService, name: 'Fallback Trademark' };
            mockLocationState = { fallbackService };
            mockStore({ selectedService: null, servicesList: [] });

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isFetching).toBe(false));
            expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: fallbackService }));
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('navigates to explore when the service cannot be found', async () => {
            mockStore({ selectedService: null, servicesList: [] });

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/more-services/government-services/explore'));
            expect(result.current.isFetching).toBe(false);
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('does not prefill or look up drafts until a service is selected', async () => {
            mockLocationState = { resumeExisting: true };
            mockStore({ selectedService: null, servicesList: [] });

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isFetching).toBe(false));
            expect(getGovernmentServiceApplicationApi).not.toHaveBeenCalled();
            expect(result.current.hasCheckedDraft).toBe(false);
            expect(result.current.isProfileLoading).toBe(true);
            expect(result.current.documents).toEqual([]);
        });
    });

    describe('vendor catalog trademark service', () => {
        beforeEach(() => {
            mockStore({ selectedService: catalogService, servicesList: [] });
        });

        it('fetches vendor documents by the service id', async () => {
            (getVendorServiceDocumentsApi as Mock).mockResolvedValue([
                { id: 1, doc_name: 'Brand Logo' },
                { id: 2, doc_name: 'Identity Proof' },
            ]);

            const { result } = renderHook(() => useServiceDetailData());

            expect(result.current.isVendorCatalogService).toBe(true);
            await waitFor(() => expect(result.current.documents).toEqual(['Brand Logo', 'Identity Proof']));
            expect(getVendorServiceDocumentsApi).toHaveBeenCalledWith(1, 'corporate', 100);
        });

        it('skips the vendor documents call when the service has no serviceId', async () => {
            mockStore({ selectedService: { ...catalogService, serviceId: null } as unknown as Service, servicesList: [] });

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(getVendorServiceDocumentsApi).not.toHaveBeenCalled();
            expect(result.current.documents).toEqual([]);
        });

        it('prefills name, PAN and entity type from a single vendor business', async () => {
            (getVendorBusinessesApi as Mock).mockResolvedValue([vendorBusinesses[0]]);

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(getVendorBusinessesApi).toHaveBeenCalledWith(1, 'corporate');
            expect(result.current.profileValues).toEqual(
                expect.objectContaining({
                    legalBusinessName: 'Peko Pvt Ltd',
                    pan: 'PEKCE1111A',
                    entityType: 'Private Limited Company',
                    name: 'Profile Contact',
                })
            );
            expect(result.current.isPanPrefilled).toBe(true);
        });

        it('keeps prior values when the single business has blank fields', async () => {
            (getVendorBusinessesApi as Mock).mockResolvedValue([
                { application_id: 555, business_name: '', pan: '', constitution: '' },
            ]);

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues.legalBusinessName).toBe('Peko Company');
            expect(result.current.profileValues.pan).toBe('');
            expect(result.current.isPanPrefilled).toBe(false);
        });

        it('overrides a resumed draft profile with the single vendor business', async () => {
            mockLocationState = { resumeExisting: true };
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({ id: 42, formData: { profile: draftProfile } });
            (getVendorBusinessesApi as Mock).mockResolvedValue([vendorBusinesses[0]]);

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues).toEqual({
                ...draftProfile,
                legalBusinessName: 'Peko Pvt Ltd',
                pan: 'PEKCE1111A',
                entityType: 'Private Limited Company',
            });
        });

        it('prefills from the business with the lowest application_id when several exist', async () => {
            (getVendorBusinessesApi as Mock).mockResolvedValue(vendorBusinesses);

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues).toEqual(
                expect.objectContaining({
                    legalBusinessName: 'Peko Pvt Ltd',
                    pan: 'PEKCE1111A',
                    entityType: 'Private Limited Company',
                })
            );
            expect(result.current.isPanPrefilled).toBe(true);
        });

        it('prefills from the lowest application_id regardless of array order', async () => {
            (getVendorBusinessesApi as Mock).mockResolvedValue([...vendorBusinesses].reverse());

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(result.current.isProfileLoading).toBe(false));
            expect(result.current.profileValues).toEqual(
                expect.objectContaining({
                    legalBusinessName: 'Peko Pvt Ltd',
                    pan: 'PEKCE1111A',
                    entityType: 'Private Limited Company',
                })
            );
        });

        it('stays loading until the vendor businesses have been fetched', async () => {
            let resolveBusinesses: (value: VendorBusiness[]) => void = () => {};
            (getVendorBusinessesApi as Mock).mockReturnValue(
                new Promise((resolve) => {
                    resolveBusinesses = resolve;
                })
            );

            const { result } = renderHook(() => useServiceDetailData());

            await waitFor(() => expect(getVendorBusinessesApi).toHaveBeenCalled());
            expect(result.current.isProfileLoading).toBe(true);

            await act(async () => {
                resolveBusinesses([]);
            });
            expect(result.current.isProfileLoading).toBe(false);
        });
    });

    it('exposes the auth context and setters', () => {
        const { result } = renderHook(() => useServiceDetailData());

        expect(result.current.userId).toBe(1);
        expect(result.current.role).toBe('corporate');
        expect(result.current.dispatch).toBe(mockDispatch);
        expect(result.current.navigate).toBe(mockNavigate);
        expect(result.current.selectedService).toEqual(mockService);
        expect(result.current.fieldErrors).toEqual({});
        expect(result.current.verifiedPan).toBe('');
    });
});
