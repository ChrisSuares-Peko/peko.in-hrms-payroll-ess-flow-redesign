import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getTrademarkLanguagesApi,
    getVendorBusinessDetailApi,
    getVendorBusinessesApi,
} from '../../apis';
import useTrademarkApplicationData from '../../hooks/useTrademarkApplicationData';
import { Service } from '../../types';
import { EMPTY_VALUES } from '../../utils/trademarkForm';

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

vi.mock('../../apis', () => ({
    getGovernmentServiceApplicationApi: vi.fn(),
    getGovtServicesListApi: vi.fn(),
    getTrademarkLanguagesApi: vi.fn(),
    getVendorBusinessDetailApi: vi.fn(),
    getVendorBusinessesApi: vi.fn(),
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

const listBusiness = {
    application_id: 'APP-555',
    business_name: 'Peko Pvt Ltd',
    name: 'Jane Contact',
    constitution: 'Private Limited',
    address_line1: '12 MG Road',
    address_line2: 'Indiranagar',
    pincode: 560001,
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    country: 'India',
    city: 'Bengaluru',
};

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

describe('useTrademarkApplicationData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocationState = null;
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (getTrademarkLanguagesApi as Mock).mockResolvedValue(['English', 'Hindi']);
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue(null);
        (getVendorBusinessesApi as Mock).mockResolvedValue([]);
        (getVendorBusinessDetailApi as Mock).mockResolvedValue(null);
        mockStore({ selectedService: mockService, servicesList: [] });
    });

    it('loads language options on mount', async () => {
        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() =>
            expect(result.current.languageOptions).toEqual([
                { label: 'English', value: 'English' },
                { label: 'Hindi', value: 'Hindi' },
            ])
        );
        expect(getTrademarkLanguagesApi).toHaveBeenCalledWith(1, 'corporate');
    });

    it('dispatches the cached service when none is selected', async () => {
        mockStore({ selectedService: null, servicesList: [mockService] });

        renderHook(() => useTrademarkApplicationData());

        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: mockService }));
        expect(getGovtServicesListApi).not.toHaveBeenCalled();
    });

    it('fetches the services list when the service is not cached', async () => {
        mockStore({ selectedService: null, servicesList: [] });
        (getGovtServicesListApi as Mock).mockResolvedValue([mockService]);

        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isFetchingService).toBe(false));
        expect(getGovtServicesListApi).toHaveBeenCalledWith(1, 'corporate');
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: mockService }));
    });

    it('falls back to the navigation-state service when the list has no match', async () => {
        const fallbackService = { ...mockService, name: 'Fallback' };
        mockLocationState = { fallbackService };
        mockStore({ selectedService: null, servicesList: [] });
        (getGovtServicesListApi as Mock).mockResolvedValue([]);

        renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: fallbackService })));
    });

    it('passes the application row id from navigation state to the draft lookup', async () => {
        mockLocationState = { applicationRowId: 7 };

        renderHook(() => useTrademarkApplicationData());

        await waitFor(() =>
            expect(getGovernmentServiceApplicationApi).toHaveBeenCalledWith(1, 'corporate', 'govt_trademark_registration', 7)
        );
    });

    it('stays on the first step with empty values when there is no draft', async () => {
        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isLoadingBusinesses).toBe(false));
        expect(result.current.currentStep).toBe(0);
        expect(result.current.initialValues).toEqual(EMPTY_VALUES);
        expect(getVendorBusinessesApi).not.toHaveBeenCalled();
    });

    it('resumes a draft without gid at the saved step and re-derives usedSinceDisplay', async () => {
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({
            id: 7,
            engagementId: 'ENG-1',
            formData: {
                currentStep: 2,
                trademarkForm: { brand: 'Peko', usedSince: '2024-03-15', pincode: '560001', logoFileName: 'logo.png' },
            },
        });

        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isLoadingBusinesses).toBe(false));
        expect(result.current.currentStep).toBe(2);
        expect(result.current.applicationRowId).toBe(7);
        expect(result.current.engagementId).toBe('ENG-1');
        expect(result.current.initialValues).toMatchObject({ brand: 'Peko', usedSinceDisplay: '15-03-2024' });
        expect(result.current.logoFileName).toBe('logo.png');
        expect(result.current.lastLookedUpPincode.current).toBe('560001');
    });

    it('clamps an out-of-range saved step to the last step', async () => {
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({ id: 7, formData: { currentStep: 99 } });

        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isLoadingBusinesses).toBe(false));
        expect(result.current.currentStep).toBe(3);
    });

    it('lands on Preview for older drafts saved without a step', async () => {
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({ id: 7, formData: { trademarkForm: { brand: 'Peko' } } });

        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isLoadingBusinesses).toBe(false));
        expect(result.current.currentStep).toBe(3);
    });

    it('prefills applicant details from the vendor business when a gid exists', async () => {
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({
            id: 7,
            gid: 'GID-1',
            applicationNumber: 'APP-555',
            formData: {},
        });
        (getVendorBusinessesApi as Mock).mockResolvedValue([listBusiness]);
        (getVendorBusinessDetailApi as Mock).mockResolvedValue({ business: { state: 'Kerala' } });

        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isLoadingBusinesses).toBe(false));
        expect(getVendorBusinessesApi).toHaveBeenCalledWith(1, 'corporate', 'GID-1');
        expect(getVendorBusinessDetailApi).toHaveBeenCalledWith(1, 'corporate', 'APP-555');
        expect(result.current.businesses).toEqual([listBusiness]);
        expect(result.current.initialValues).toMatchObject({
            trademarkOwner: 'APP-555',
            entityType: 'Private Limited',
            authorizedPerson: 'Jane Contact',
            address: '12 MG Road, Indiranagar',
            pincode: '560001',
            // View Business wins over Business List on overlapping fields.
            state: 'Kerala',
            district: 'Bengaluru Urban',
            country: 'India',
            city: 'Bengaluru',
        });
        expect(result.current.lastLookedUpPincode.current).toBe('560001');
    });

    it('uses the business name as authorized person for individual entities', async () => {
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({ id: 7, gid: 'GID-1', applicationNumber: 'APP-555' });
        (getVendorBusinessesApi as Mock).mockResolvedValue([{ ...listBusiness, constitution: 'Individual' }]);

        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isLoadingBusinesses).toBe(false));
        expect(result.current.initialValues.authorizedPerson).toBe('Peko Pvt Ltd');
    });

    it('lets saved draft values override the vendor prefill', async () => {
        (getGovernmentServiceApplicationApi as Mock).mockResolvedValue({
            id: 7,
            gid: 'GID-1',
            applicationNumber: 'APP-555',
            formData: { currentStep: 1, trademarkForm: { address: 'Edited address', pincode: '682001', logoFileName: 'a.png' } },
        });
        (getVendorBusinessesApi as Mock).mockResolvedValue([listBusiness]);

        const { result } = renderHook(() => useTrademarkApplicationData());

        await waitFor(() => expect(result.current.isLoadingBusinesses).toBe(false));
        expect(result.current.initialValues.address).toBe('Edited address');
        expect(result.current.initialValues.pincode).toBe('682001');
        expect(result.current.logoFileName).toBe('a.png');
        expect(result.current.lastLookedUpPincode.current).toBe('682001');
    });

    it('goBack navigates to the service detail page', () => {
        const { result } = renderHook(() => useTrademarkApplicationData());

        act(() => result.current.goBack());

        expect(mockNavigate).toHaveBeenCalledWith('/more-services/government-services/service/10');
    });
});
