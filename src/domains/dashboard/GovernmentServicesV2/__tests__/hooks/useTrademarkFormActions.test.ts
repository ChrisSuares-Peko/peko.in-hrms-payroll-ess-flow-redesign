import { act, renderHook } from '@testing-library/react';
import { RcFile } from 'antd/es/upload';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import {
    VendorBusiness,
    getTrademarkClassApi,
    locationLookupApi,
    searchSimilarTrademarksApi,
    submitGovernmentServiceApplicationApi,
    submitTrademarkFilingApi,
    uploadTrademarkLogoApi,
} from '../../apis';
import useTrademarkFormActions from '../../hooks/useTrademarkFormActions';
import { ApplicantDetailsValues, Service } from '../../types';
import { EMPTY_VALUES } from '../../utils/trademarkForm';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getTrademarkClassApi: vi.fn(),
    locationLookupApi: vi.fn(),
    searchSimilarTrademarksApi: vi.fn(),
    submitGovernmentServiceApplicationApi: vi.fn(),
    submitTrademarkFilingApi: vi.fn(),
    uploadTrademarkLogoApi: vi.fn(),
}));

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const setFieldValue = vi.fn();
const validateForm = vi.fn();
const setTouched = vi.fn();
const setErrors = vi.fn();
const setCurrentStep = vi.fn();
const setLogoFileName = vi.fn();

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

const businesses = [
    {
        application_id: 555,
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
    },
] as unknown as VendorBusiness[];

const filledValues: ApplicantDetailsValues = {
    ...EMPTY_VALUES,
    trademarkOwner: '555',
    brand: 'Peko',
    logo: 'base64-logo',
    logoFormat: 'png',
    usedSinceDisplay: '01-01-2024',
    usedSince: '2024-01-01',
};

const renderActions = (overrides: Partial<Parameters<typeof useTrademarkFormActions>[0]> = {}) => {
    const lastLookedUpPincode = { current: '' };
    const hook = renderHook(() =>
        useTrademarkFormActions({
            values: filledValues,
            setFieldValue,
            validateForm,
            setTouched,
            setErrors,
            userId: 1,
            role: 'corporate',
            selectedService: mockService,
            applicationRowId: 7,
            applicationNumber: 'APP-555',
            engagementId: 'ENG-1',
            businesses,
            currentStep: 0,
            setCurrentStep,
            logoFileName: 'logo.png',
            setLogoFileName,
            lastLookedUpPincode,
            navigate: mockNavigate,
            ...overrides,
        })
    );
    return { ...hook, lastLookedUpPincode: overrides.lastLookedUpPincode ?? lastLookedUpPincode };
};

// FileReader stub that resolves synchronously-ish with a fixed data URL.
class MockFileReader {
    result: string | null = null;

    onload: (() => void) | null = null;

    readAsDataURL() {
        this.result = 'data:image/png;base64,QUJD';
        this.onload?.();
    }
}

// Image stub that reports a configurable decoded resolution — defaults to the required 450×450.
// A plain object (not a class) so this file still only declares the one MockFileReader class.
const createMockImage = (naturalWidth: number, naturalHeight: number) => {
    const img = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        naturalWidth,
        naturalHeight,
    };
    Object.defineProperty(img, 'src', {
        set: () => img.onload?.(),
    });
    return img;
};

const stubImageDimensions = (width = 450, height = 450) => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });
    // A plain `function` (not an arrow/vi.fn wrapper) — it needs to work as a constructor when
    // the real code does `new Image()`, which only plain functions/classes support.
    // eslint-disable-next-line prefer-arrow-callback
    vi.stubGlobal('Image', function MockImageConstructor() {
        return createMockImage(width, height);
    });
};

describe('useTrademarkFormActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe('applyBusinessToValues', () => {
        it('fills address fields and uses the contact name for non-individual entities', () => {
            const { result, lastLookedUpPincode } = renderActions();

            act(() => result.current.applyBusinessToValues(businesses[0]));

            expect(setFieldValue).toHaveBeenCalledWith('entityType', 'Private Limited');
            expect(setFieldValue).toHaveBeenCalledWith('address', '12 MG Road, Indiranagar');
            expect(setFieldValue).toHaveBeenCalledWith('pincode', '560001');
            expect(setFieldValue).toHaveBeenCalledWith('state', 'Karnataka');
            expect(setFieldValue).toHaveBeenCalledWith('district', 'Bengaluru Urban');
            expect(setFieldValue).toHaveBeenCalledWith('country', 'India');
            expect(setFieldValue).toHaveBeenCalledWith('city', 'Bengaluru');
            expect(setFieldValue).toHaveBeenCalledWith('authorizedPerson', 'Jane Contact');
            expect(lastLookedUpPincode.current).toBe('560001');
        });

        it('uses the business name as authorized person for individual entities', () => {
            const { result } = renderActions();

            act(() =>
                result.current.applyBusinessToValues({ ...businesses[0], constitution: 'Individual' } as VendorBusiness)
            );

            expect(setFieldValue).toHaveBeenCalledWith('authorizedPerson', 'Peko Pvt Ltd');
        });

        it('does nothing when no business is given', () => {
            const { result } = renderActions();

            act(() => result.current.applyBusinessToValues(undefined));

            expect(setFieldValue).not.toHaveBeenCalled();
        });
    });

    describe('handlePincodeChange', () => {
        it('skips lookup for an invalid pincode and resets the last looked-up value', async () => {
            const lastLookedUpPincode = { current: '560001' };
            const { result } = renderActions({ lastLookedUpPincode });

            await act(() => result.current.handlePincodeChange('12345'));

            expect(locationLookupApi).not.toHaveBeenCalled();
            expect(lastLookedUpPincode.current).toBe('');
        });

        it('skips lookup when the pincode matches the last looked-up value', async () => {
            const lastLookedUpPincode = { current: '560001' };
            const { result } = renderActions({ lastLookedUpPincode });

            await act(() => result.current.handlePincodeChange('560001'));

            expect(locationLookupApi).not.toHaveBeenCalled();
        });

        it('fills state/district/country/city from a successful lookup', async () => {
            (locationLookupApi as Mock).mockResolvedValue({
                state: 'Kerala',
                district: 'Ernakulam',
                country: 'India',
                city: 'Kochi',
                pincode: '682001',
            });
            const { result, lastLookedUpPincode } = renderActions();

            await act(() => result.current.handlePincodeChange('682001'));

            expect(locationLookupApi).toHaveBeenCalledWith(1, 'corporate', '682001');
            expect(setFieldValue).toHaveBeenCalledWith('state', 'Kerala');
            expect(setFieldValue).toHaveBeenCalledWith('district', 'Ernakulam');
            expect(setFieldValue).toHaveBeenCalledWith('country', 'India');
            expect(setFieldValue).toHaveBeenCalledWith('city', 'Kochi');
            expect(lastLookedUpPincode.current).toBe('682001');
            expect(result.current.isLookingUpPincode).toBe(false);
        });

        it('resets the last looked-up value when the lookup fails', async () => {
            (locationLookupApi as Mock).mockResolvedValue(null);
            const { result, lastLookedUpPincode } = renderActions();

            await act(() => result.current.handlePincodeChange('682001'));

            expect(setFieldValue).not.toHaveBeenCalled();
            expect(lastLookedUpPincode.current).toBe('');
        });
    });

    describe('handleGoodsOrServiceChange', () => {
        it('clears class and description when the query is emptied', () => {
            const { result } = renderActions();

            act(() => result.current.handleGoodsOrServiceChange('   '));

            expect(getTrademarkClassApi).not.toHaveBeenCalled();
            expect(setFieldValue).toHaveBeenCalledWith('trademarkClass', '');
            expect(setFieldValue).toHaveBeenCalledWith('description', []);
            expect(result.current.classDescriptions).toEqual([]);
        });

        it('debounces the class search and auto-fills the first identified class', async () => {
            vi.useFakeTimers();
            const descriptions = [{ class: 9, description: 'Computer software' }];
            (getTrademarkClassApi as Mock).mockResolvedValue({ classesIdentified: ['9', '42'], descriptions, classResult: null });
            const { result } = renderActions();

            act(() => {
                result.current.handleGoodsOrServiceChange('soft');
                result.current.handleGoodsOrServiceChange('software');
            });
            expect(getTrademarkClassApi).not.toHaveBeenCalled();

            await act(async () => {
                await vi.advanceTimersByTimeAsync(500);
            });

            expect(getTrademarkClassApi).toHaveBeenCalledTimes(1);
            expect(getTrademarkClassApi).toHaveBeenCalledWith(1, 'corporate', 'software');
            expect(setFieldValue).toHaveBeenCalledWith('trademarkClass', '9');
            expect(setFieldValue).toHaveBeenCalledWith('description', []);
            expect(result.current.classDescriptions).toEqual(descriptions);
            expect(result.current.isSearchingGoodsOrService).toBe(false);
        });

        it('clears the class when the search returns nothing', async () => {
            vi.useFakeTimers();
            (getTrademarkClassApi as Mock).mockResolvedValue(null);
            const { result } = renderActions();

            act(() => result.current.handleGoodsOrServiceChange('xyz'));
            await act(async () => {
                await vi.advanceTimersByTimeAsync(500);
            });

            expect(setFieldValue).toHaveBeenCalledWith('trademarkClass', '');
            expect(result.current.classDescriptions).toEqual([]);
        });
    });

    describe('handleBrandSearch', () => {
        it('does not search for a blank brand', async () => {
            const { result } = renderActions({ values: { ...filledValues, brand: '  ' } });

            await act(() => result.current.handleBrandSearch());

            expect(searchSimilarTrademarksApi).not.toHaveBeenCalled();
            expect(result.current.isSimilarModalOpen).toBe(false);
        });

        it('searches similar marks, resets the class filter and opens the modal', async () => {
            const similar = [{ tm_applied_for: 'PEKO', class: '9', application_no: '1' }];
            (searchSimilarTrademarksApi as Mock).mockResolvedValue(similar);
            const { result } = renderActions();

            act(() => result.current.setSimilarClassFilter('9'));
            await act(() => result.current.handleBrandSearch());

            expect(searchSimilarTrademarksApi).toHaveBeenCalledWith(1, 'corporate', 'Peko');
            expect(result.current.similarTrademarks).toEqual(similar);
            expect(result.current.similarClassFilter).toBe('all');
            expect(result.current.isSimilarModalOpen).toBe(true);
            expect(result.current.isSearchingSimilar).toBe(false);
        });
    });

    describe('handleLogoFile', () => {
        it('rejects unsupported file types without reading them', () => {
            vi.stubGlobal('FileReader', MockFileReader);
            const readSpy = vi.spyOn(MockFileReader.prototype, 'readAsDataURL');
            const { result } = renderActions();

            const returned = result.current.handleLogoFile({ type: 'application/pdf', name: 'doc.pdf' } as RcFile);

            expect(returned).toBe(false);
            expect(readSpy).not.toHaveBeenCalled();
            expect(uploadTrademarkLogoApi).not.toHaveBeenCalled();
        });

        it('uploads the logo and stores it in the form on success', async () => {
            vi.stubGlobal('FileReader', MockFileReader);
            stubImageDimensions(450, 450);
            (uploadTrademarkLogoApi as Mock).mockResolvedValue({ logoUrl: 'https://cdn/logo.png' });
            const { result } = renderActions();

            await act(async () => {
                result.current.handleLogoFile({ type: 'image/png', name: 'brand.png' } as RcFile);
            });

            expect(uploadTrademarkLogoApi).toHaveBeenCalledWith(
                1,
                'corporate',
                'govt_trademark_registration',
                'QUJD',
                'brand.png',
                7
            );
            expect(setFieldValue).toHaveBeenCalledWith('logo', 'QUJD');
            expect(setFieldValue).toHaveBeenCalledWith('logoFormat', 'png');
            expect(setLogoFileName).toHaveBeenCalledWith('brand.png');
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ variant: 'success' }) })
            );
        });

        it('clears the logo and shows an error toast when the upload fails', async () => {
            vi.stubGlobal('FileReader', MockFileReader);
            stubImageDimensions(450, 450);
            (uploadTrademarkLogoApi as Mock).mockResolvedValue(null);
            const { result } = renderActions();

            await act(async () => {
                result.current.handleLogoFile({ type: 'image/jpeg', name: 'brand.jpg' } as RcFile);
            });

            expect(setFieldValue).toHaveBeenCalledWith('logo', null);
            expect(setFieldValue).toHaveBeenCalledWith('logoFormat', undefined);
            expect(setLogoFileName).toHaveBeenCalledWith('');
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ variant: 'error' }) })
            );
        });

        it('rejects an image that is not exactly 450×450 without uploading it', async () => {
            vi.stubGlobal('FileReader', MockFileReader);
            stubImageDimensions(600, 450);
            const { result } = renderActions();

            await act(async () => {
                result.current.handleLogoFile({ type: 'image/png', name: 'brand.png' } as RcFile);
            });

            expect(uploadTrademarkLogoApi).not.toHaveBeenCalled();
            expect(setFieldValue).not.toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ variant: 'error' }) })
            );
        });
    });

    it('removeLogoFile clears the logo fields', () => {
        const { result } = renderActions();

        act(() => result.current.removeLogoFile());

        expect(setFieldValue).toHaveBeenCalledWith('logo', null);
        expect(setFieldValue).toHaveBeenCalledWith('logoFormat', undefined);
        expect(setLogoFileName).toHaveBeenCalledWith('');
    });

    describe('handleNext', () => {
        it('marks fields touched and stays on the step when validation fails', async () => {
            const errors = { brand: 'Please enter the brand name' };
            validateForm.mockResolvedValue(errors);
            const { result } = renderActions();

            await act(() => result.current.handleNext());

            expect(setTouched).toHaveBeenCalledWith(expect.objectContaining({ brand: true, trademarkOwner: true }), false);
            expect(setErrors).toHaveBeenCalledWith(errors);
            expect(submitGovernmentServiceApplicationApi).not.toHaveBeenCalled();
            expect(setCurrentStep).not.toHaveBeenCalled();
        });

        it('saves the draft without logo/UI-only fields and advances the step', async () => {
            validateForm.mockResolvedValue({});
            const { result } = renderActions({ currentStep: 1 });

            await act(() => result.current.handleNext());

            expect(submitGovernmentServiceApplicationApi).toHaveBeenCalledTimes(1);
            const payload = (submitGovernmentServiceApplicationApi as Mock).mock.calls[0][0];
            expect(payload).toMatchObject({
                userId: 1,
                userType: 'corporate',
                accessKey: 'govt_trademark_registration',
                applicationId: 7,
                formData: { currentStep: 2 },
            });
            expect(payload.formData.trademarkForm).toMatchObject({ brand: 'Peko', logoFileName: 'logo.png', usedSince: '2024-01-01' });
            expect(payload.formData.trademarkForm).not.toHaveProperty('logo');
            expect(payload.formData.trademarkForm).not.toHaveProperty('logoFormat');
            expect(payload.formData.trademarkForm).not.toHaveProperty('usedSinceDisplay');
            expect(setCurrentStep).toHaveBeenCalledWith(2);
        });

        it('advances without saving when there is no application row yet', async () => {
            validateForm.mockResolvedValue({});
            const { result } = renderActions({ applicationRowId: null });

            await act(() => result.current.handleNext());

            expect(submitGovernmentServiceApplicationApi).not.toHaveBeenCalled();
            expect(setCurrentStep).toHaveBeenCalledWith(1);
        });
    });

    describe('ownerName', () => {
        it('resolves the business name from the selected owner application id', () => {
            const { result } = renderActions();
            expect(result.current.ownerName).toBe('Peko Pvt Ltd');
        });

        it('falls back to the raw owner value when no business matches', () => {
            const { result } = renderActions({ values: { ...filledValues, trademarkOwner: '999' } });
            expect(result.current.ownerName).toBe('999');
        });
    });

    describe('handleSubmitFiling', () => {
        it('submits the filing and navigates to tracking on success', async () => {
            (submitTrademarkFilingApi as Mock).mockResolvedValue({ applicationId: 42 });
            const { result } = renderActions();

            await act(() => result.current.handleSubmitFiling());

            expect(submitTrademarkFilingApi).toHaveBeenCalledWith(
                1,
                'corporate',
                'govt_trademark_registration',
                { ...filledValues, businessName: 'Peko Pvt Ltd' },
                7
            );
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ variant: 'success' }) })
            );
            expect(mockNavigate).toHaveBeenCalledWith('/more-services/government-services/tracking', {
                state: {
                    application: expect.objectContaining({
                        id: 42,
                        applicationId: 'APP-555',
                        engagementId: 'ENG-1',
                        status: 'COMPLETED',
                        paymentStatus: 'COMPLETED',
                        serviceName: 'Trademark Registration',
                        legalBusinessName: 'Peko Pvt Ltd',
                    }),
                },
            });
            expect(result.current.isSubmittingFiling).toBe(false);
        });

        it('shows an error toast and stays on the page when submission fails', async () => {
            (submitTrademarkFilingApi as Mock).mockResolvedValue(null);
            const { result } = renderActions();

            await act(() => result.current.handleSubmitFiling());

            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ variant: 'error' }) })
            );
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
