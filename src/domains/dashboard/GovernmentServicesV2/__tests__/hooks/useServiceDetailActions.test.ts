import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import {
    createVendorBusinessApi,
    submitGovernmentServiceApplicationApi,
    verifyVendorPanApi,
} from '../../apis';
import useServiceDetailActions from '../../hooks/useServiceDetailActions';
import { Service } from '../../types';
import { ProfileValues } from '../../utils/serviceDetailForm';

vi.mock('../../apis', () => ({
    createVendorBusinessApi: vi.fn(),
    submitGovernmentServiceApplicationApi: vi.fn(),
    verifyVendorPanApi: vi.fn(),
}));

const mockDispatch = vi.fn();
const setProfileValues = vi.fn();
const setFieldErrors = vi.fn();
const setVerifiedPan = vi.fn();
const setIsPanPrefilled = vi.fn();
const proceedToPayment = vi.fn();

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

const validProfile: ProfileValues = {
    legalBusinessName: 'Peko Technologies Pvt Ltd',
    stateOfRegistration: 'Karnataka',
    name: 'Jane Doe',
    email: 'jane@peko.one',
    phoneNumber: '9876543210',
    pan: 'ABCCE1234F',
    entityType: 'Private Limited Company',
    proposedName: '',
    alternateName: '',
};

type Params = Parameters<typeof useServiceDetailActions>[0];

const renderActions = (overrides: Partial<Params> = {}) =>
    renderHook(() =>
        useServiceDetailActions({
            userId: 1,
            role: 'corporate',
            dispatch: mockDispatch,
            selectedService: mockService,
            isVendorCatalogService: false,
            profileValues: validProfile,
            setProfileValues,
            setFieldErrors,
            verifiedPan: '',
            setVerifiedPan,
            isPanPrefilled: false,
            setIsPanPrefilled,
            totalAmount: 5900,
            proceedToPayment,
            ...overrides,
        })
    );

// Applies every functional state update passed to a setter mock, in order, to `initial`.
const applyUpdates = <T>(setter: Mock, initial: T): T =>
    setter.mock.calls.reduce(
        (acc, [update]) => (typeof update === 'function' ? update(acc) : update),
        initial
    );

describe('useServiceDetailActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (submitGovernmentServiceApplicationApi as Mock).mockResolvedValue({ id: 1 });
        (createVendorBusinessApi as Mock).mockResolvedValue({
            applicationId: 555,
            gid: 'GID-1',
            alreadyExists: false,
        });
        (verifyVendorPanApi as Mock).mockResolvedValue({
            data: { full_name: 'PEKO TECHNOLOGIES PRIVATE LIMITED' },
        });
        proceedToPayment.mockResolvedValue(undefined);
    });

    describe('PAN verification state', () => {
        it('is verified only while the entered PAN matches the last verified PAN', () => {
            expect(renderActions({ verifiedPan: 'ABCCE1234F' }).result.current.isPanVerified).toBe(
                true
            );
            expect(renderActions({ verifiedPan: 'ZZZZZ9999Z' }).result.current.isPanVerified).toBe(
                false
            );
        });

        it('is not verified when the PAN is empty, even if verifiedPan is empty too', () => {
            const { result } = renderActions({
                profileValues: { ...validProfile, pan: '' },
                verifiedPan: '',
            });

            expect(result.current.isPanVerified).toBe(false);
        });

        it('shows the Verify button only for vendor catalog services without a prefilled PAN', () => {
            expect(
                renderActions({ isVendorCatalogService: true, isPanPrefilled: false }).result
                    .current.showPanVerify
            ).toBe(true);
            expect(
                renderActions({ isVendorCatalogService: true, isPanPrefilled: true }).result.current
                    .showPanVerify
            ).toBe(false);
            expect(
                renderActions({ isVendorCatalogService: false, isPanPrefilled: false }).result
                    .current.showPanVerify
            ).toBe(false);
        });
    });

    describe('onPanChange', () => {
        it('updates the PAN and clears the prefilled flag', () => {
            const { result } = renderActions({ isPanPrefilled: true });

            act(() => result.current.onPanChange('XYZPE9876K'));

            expect(applyUpdates(setProfileValues, validProfile)).toEqual({
                ...validProfile,
                pan: 'XYZPE9876K',
            });
            expect(setIsPanPrefilled).toHaveBeenCalledWith(false);
        });
    });

    describe('handleVerifyPan', () => {
        it('rejects a malformed PAN without calling the API', async () => {
            const { result } = renderActions({ profileValues: { ...validProfile, pan: 'abc123' } });

            await act(async () => {
                await result.current.handleVerifyPan();
            });

            expect(verifyVendorPanApi).not.toHaveBeenCalled();
            expect(applyUpdates(setFieldErrors, {})).toEqual({
                pan: 'Enter a valid 10-character PAN',
            });
            expect(result.current.isVerifyingPan).toBe(false);
        });

        it('flags the PAN when the API returns null', async () => {
            (verifyVendorPanApi as Mock).mockResolvedValue(null);
            const { result } = renderActions();

            await act(async () => {
                await result.current.handleVerifyPan();
            });

            expect(verifyVendorPanApi).toHaveBeenCalledWith(1, 'corporate', 'ABCCE1234F');
            expect(applyUpdates(setFieldErrors, { email: 'x' })).toEqual({
                email: 'x',
                pan: 'Could not verify this PAN',
            });
            expect(setVerifiedPan).not.toHaveBeenCalled();
            expect(result.current.isVerifyingPan).toBe(false);
        });

        it('flags the PAN when the response has no holder name', async () => {
            (verifyVendorPanApi as Mock).mockResolvedValue({ data: { status: 'VALID' } });
            const { result } = renderActions();

            await act(async () => {
                await result.current.handleVerifyPan();
            });

            expect(applyUpdates(setFieldErrors, {})).toEqual({ pan: 'Could not verify this PAN' });
            expect(setVerifiedPan).not.toHaveBeenCalled();
        });

        it('marks the PAN verified, clears its error and derives the entity type', async () => {
            const { result } = renderActions({
                profileValues: { ...validProfile, entityType: '' },
            });

            await act(async () => {
                await result.current.handleVerifyPan();
            });

            expect(setVerifiedPan).toHaveBeenCalledWith('ABCCE1234F');
            expect(applyUpdates(setFieldErrors, { pan: 'old error' })).toEqual({ pan: '' });
            expect(applyUpdates(setProfileValues, { ...validProfile, entityType: '' })).toEqual({
                ...validProfile,
                entityType: 'Private Limited Company',
            });
        });

        it('does not overwrite the legal business name with the PAN holder name', async () => {
            const { result } = renderActions({
                profileValues: { ...validProfile, legalBusinessName: 'My Brand Co' },
            });

            await act(async () => {
                await result.current.handleVerifyPan();
            });

            const next = applyUpdates(setProfileValues, {
                ...validProfile,
                legalBusinessName: 'My Brand Co',
            });
            expect(next.legalBusinessName).toBe('My Brand Co');
        });

        it('leaves the entity type untouched when none can be derived', async () => {
            (verifyVendorPanApi as Mock).mockResolvedValue({ data: { full_name: 'JANE DOE' } });
            const { result } = renderActions({
                profileValues: { ...validProfile, pan: 'ABCXE1234F' },
            });

            await act(async () => {
                await result.current.handleVerifyPan();
            });

            expect(setVerifiedPan).toHaveBeenCalledWith('ABCXE1234F');
            expect(setProfileValues).not.toHaveBeenCalled();
        });

        it('toggles isVerifyingPan while the request is in flight', async () => {
            let resolveVerify: (value: unknown) => void = () => {};
            (verifyVendorPanApi as Mock).mockReturnValue(
                new Promise(resolve => {
                    resolveVerify = resolve;
                })
            );
            const { result } = renderActions();

            let pending: Promise<void> = Promise.resolve();
            act(() => {
                pending = result.current.handleVerifyPan();
            });
            expect(result.current.isVerifyingPan).toBe(true);

            await act(async () => {
                resolveVerify({ data: { full_name: 'PEKO PVT LTD' } });
                await pending;
            });
            expect(result.current.isVerifyingPan).toBe(false);
        });
    });

    describe('handleContinue', () => {
        it('sets the first error per field and stops when validation fails', async () => {
            const { result } = renderActions({
                profileValues: { ...validProfile, legalBusinessName: '', email: 'bad', pan: '' },
            });

            await act(async () => {
                await result.current.handleContinue();
            });

            expect(setFieldErrors).toHaveBeenCalledWith({
                legalBusinessName: 'Legal Business Name must be at least 3 characters',
                email: 'Please enter a valid email address',
                pan: 'Please enter a valid PAN (e.g., ABCDE1234F)',
            });
            expect(createVendorBusinessApi).not.toHaveBeenCalled();
            expect(submitGovernmentServiceApplicationApi).not.toHaveBeenCalled();
            expect(proceedToPayment).not.toHaveBeenCalled();
            expect(result.current.isApplying).toBe(false);
        });

        it('submits a govt_ trademark application without creating a vendor business', async () => {
            const { result } = renderActions();

            await act(async () => {
                await result.current.handleContinue();
            });

            expect(setFieldErrors).toHaveBeenCalledWith({});
            expect(createVendorBusinessApi).not.toHaveBeenCalled();
            expect(submitGovernmentServiceApplicationApi).toHaveBeenCalledWith({
                userId: 1,
                userType: 'corporate',
                accessKey: 'govt_trademark_registration',
                formData: {
                    profile: { ...validProfile, proposedName: undefined, alternateName: undefined },
                    amount: 5900,
                },
            });
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(proceedToPayment).toHaveBeenCalledTimes(1);
            expect(result.current.isApplying).toBe(false);
        });

        it('does not proceed to payment when the submission fails', async () => {
            (submitGovernmentServiceApplicationApi as Mock).mockResolvedValue(null);
            const { result } = renderActions();

            await act(async () => {
                await result.current.handleContinue();
            });

            expect(submitGovernmentServiceApplicationApi).toHaveBeenCalled();
            expect(proceedToPayment).not.toHaveBeenCalled();
            expect(result.current.isApplying).toBe(false);
        });

        describe('vendor catalog service', () => {
            const catalogService: Service = { ...mockService, accessKey: '812' };

            it('creates the vendor business, stores the gid and submits the vendor reference', async () => {
                const { result } = renderActions({
                    isVendorCatalogService: true,
                    selectedService: catalogService,
                });

                await act(async () => {
                    await result.current.handleContinue();
                });

                expect(createVendorBusinessApi).toHaveBeenCalledWith(
                    1,
                    'corporate',
                    'ABCCE1234F',
                    'Private Limited Company',
                    'Peko Technologies Pvt Ltd',
                    'Karnataka',
                    'Jane Doe',
                    'jane@peko.one',
                    '9876543210',
                    '812'
                );
                expect(mockDispatch).toHaveBeenCalledWith({
                    type: 'governmentServices/setVendorGid',
                    payload: 'GID-1',
                });
                expect(mockDispatch).not.toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.objectContaining({ variant: 'info' }),
                    })
                );
                expect(submitGovernmentServiceApplicationApi).toHaveBeenCalledWith({
                    userId: 1,
                    userType: 'corporate',
                    accessKey: '812',
                    formData: {
                        profile: {
                            ...validProfile,
                            proposedName: undefined,
                            alternateName: undefined,
                        },
                        vendor: { applicationId: 555, gid: 'GID-1' },
                        amount: 5900,
                    },
                });
                expect(proceedToPayment).toHaveBeenCalledTimes(1);
            });

            it('shows an info toast when the business already exists', async () => {
                (createVendorBusinessApi as Mock).mockResolvedValue({
                    applicationId: 555,
                    gid: 'GID-1',
                    alreadyExists: true,
                });
                const { result } = renderActions({
                    isVendorCatalogService: true,
                    selectedService: catalogService,
                });

                await act(async () => {
                    await result.current.handleContinue();
                });

                expect(mockDispatch).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: { description: 'Business already exists', variant: 'info' },
                    })
                );
                expect(proceedToPayment).toHaveBeenCalled();
            });

            it('omits the gid from the vendor reference when none is returned', async () => {
                (createVendorBusinessApi as Mock).mockResolvedValue({
                    applicationId: 555,
                    gid: null,
                    alreadyExists: false,
                });
                const { result } = renderActions({
                    isVendorCatalogService: true,
                    selectedService: catalogService,
                });

                await act(async () => {
                    await result.current.handleContinue();
                });

                expect(mockDispatch).toHaveBeenCalledWith({
                    type: 'governmentServices/setVendorGid',
                    payload: null,
                });
                expect(submitGovernmentServiceApplicationApi).toHaveBeenCalledWith(
                    expect.objectContaining({
                        formData: expect.objectContaining({ vendor: { applicationId: 555 } }),
                    })
                );
            });

            it.each([null, { applicationId: 0, gid: 'GID-1' }, {}])(
                'shows an error toast and stops when business creation returns %j',
                async created => {
                    (createVendorBusinessApi as Mock).mockResolvedValue(created);
                    const { result } = renderActions({
                        isVendorCatalogService: true,
                        selectedService: catalogService,
                    });

                    await act(async () => {
                        await result.current.handleContinue();
                    });

                    expect(mockDispatch).toHaveBeenCalledWith(
                        expect.objectContaining({
                            payload: {
                                description: 'Could not register this business. Please try again.',
                                variant: 'error',
                            },
                        })
                    );
                    expect(submitGovernmentServiceApplicationApi).not.toHaveBeenCalled();
                    expect(proceedToPayment).not.toHaveBeenCalled();
                    expect(result.current.isApplying).toBe(false);
                }
            );
        });

        it('sets isApplying while the submission is in flight', async () => {
            let resolveSubmit: (value: unknown) => void = () => {};
            (submitGovernmentServiceApplicationApi as Mock).mockReturnValue(
                new Promise(resolve => {
                    resolveSubmit = resolve;
                })
            );
            const { result } = renderActions();

            let pending: Promise<void> = Promise.resolve();
            act(() => {
                pending = result.current.handleContinue();
            });
            await waitFor(() => expect(result.current.isApplying).toBe(true));

            await act(async () => {
                resolveSubmit({ id: 1 });
                await pending;
            });
            expect(result.current.isApplying).toBe(false);
        });
    });
});
