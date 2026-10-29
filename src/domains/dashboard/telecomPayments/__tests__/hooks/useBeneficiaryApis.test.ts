import { act, cleanup, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, vi, test, afterEach, it } from 'vitest';

import { BeneficiaryState, setData } from '@src/domains/dashboard/billPayments/slices/beneficiary';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    AddBeneficiaryApi,
    deleteBeneficiaryApi,
    getBeneficiaryOtp,
    getlatestbeneficiary,
    updateBeneficiaryApi,
} from '../../api/index';
import useBeneficiaryApis from '../../hooks/useBeneficiaryApis';
import { BeneficiaryActionType } from '../../types';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    getlatestbeneficiary: vi.fn(),
    getServiceBeneficiary: vi.fn(),
    getBeneficiaryOtp: vi.fn(),
    AddBeneficiaryApi: vi.fn(),
    updateBeneficiaryApi: vi.fn(),
    deleteBeneficiaryApi: vi.fn(),
}));

vi.mock('../../../billPayments/slices/beneficiary', () => ({
    setData: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('useBeneficiaryApis', () => {
    const dispatchMock = vi.fn();
    beforeEach(() => {
        (useAppDispatch as Mock).mockReturnValue(dispatchMock);
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({
                reducer: {
                    auth: { id: '123', role: 'user' },
                    beneficiary: {
                        beneficiaryData: [],
                        isLoading: false,
                        refresh: false,
                        formIntialValues: {},
                    },
                },
            })
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
        (useAppSelector as Mock).mockReturnValue({
            role: 'admin',
            id: '123',
            reducer: { beneficiary: { beneficiaryData: [], isLoading: false } },
        });
    });

    it('should fetch beneficiaries successfully', async () => {
        const mockResponse: BeneficiaryState = {
            beneficiaryData: [
                {
                    id: 1,
                    accessKey: 'someAccessKey',
                    name: 'same',
                    phoneNo: '1234567890',
                    serviceProvider: 'someProvider',
                    billerId: 'someBillerId',
                    providerCircle: 'someCircle',
                    isActive: true,
                    customerParams: [],
                    createdAt: '2023-01-01T00:00:00Z',
                    updatedAt: '2023-01-01T00:00:00Z',
                    credentialId: 123,
                    serviceOperator: {
                        serviceProvider: 'string',
                        serviceImage: 'string',
                    },
                },
            ],
            isLoading: false,
            refresh: false,
            formIntialValues: {},
            complaintResponse: undefined,
        };
        (getlatestbeneficiary as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey: '',
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: {
                    current: {
                        resetForm: vi.fn(),
                        values: {},
                        errors: {},
                        touched: {},
                        isSubmitting: false,
                        setSubmitting: vi.fn(),
                        handleSubmit: vi.fn(),
                        handleChange: vi.fn(),
                        handleBlur: vi.fn(),
                        setFieldValue: vi.fn(),
                        setFieldTouched: vi.fn(),
                        validateForm: vi.fn(),
                        validateField: vi.fn(),
                    } as any,
                },
                beneficiaryActionType: BeneficiaryActionType.ADD,
                setBeneficiaryActionType: vi.fn(),
                editValues: null,
            })
        );

        await act(async () => {
            await result.current.sendOtpApi('ADD');
        });
        expect(getBeneficiaryOtp).toHaveBeenCalled();
    });

    test('adds a beneficiary', async () => {
        (AddBeneficiaryApi as Mock).mockResolvedValue({ status: true, message: 'Success' });
        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey: '',
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: {
                    current: {
                        resetForm: vi.fn(),
                        values: {},
                        errors: {},
                        touched: {},
                        isSubmitting: false,
                        setSubmitting: vi.fn(),
                        handleSubmit: vi.fn(),
                        handleChange: vi.fn(),
                        handleBlur: vi.fn(),
                        setFieldValue: vi.fn(),
                        setFieldTouched: vi.fn(),
                        validateForm: vi.fn(),
                        validateField: vi.fn(),
                    } as any,
                },
                beneficiaryActionType: BeneficiaryActionType.EDIT,
                setBeneficiaryActionType: vi.fn(),
                editValues: null,
            })
        );

        await act(async () => {
            await result.current.addBeneficiary({
                userId: 123,
                userType: 'user',
                name: 'Test',
                isActive: '1',
                credentialId: '123',
                scope: 'email',
                otp: '1234',
            });
        });

        expect(AddBeneficiaryApi).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(setData({ refresh: true, isLoading: false }));
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Success', variant: 'success' })
        );
    });

    test('updates a beneficiary', async () => {
        (updateBeneficiaryApi as Mock).mockResolvedValue({ status: true, message: 'Updated' });
        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey: '',
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: {
                    current: {
                        resetForm: vi.fn(),
                        values: {},
                        errors: {},
                        touched: {},
                        isSubmitting: false,
                        setSubmitting: vi.fn(),
                        handleSubmit: vi.fn(),
                        handleChange: vi.fn(),
                        handleBlur: vi.fn(),
                        setFieldValue: vi.fn(),
                        setFieldTouched: vi.fn(),
                        validateForm: vi.fn(),
                        validateField: vi.fn(),
                    } as any,
                },
                beneficiaryActionType: BeneficiaryActionType.DELETE,
                setBeneficiaryActionType: vi.fn(),
                editValues: {
                    id: 1,
                    accessKey: '',
                    name: '',
                    phoneNo: '',
                    serviceProvider: '',
                    billerId: null,
                    providerCircle: '',
                    isActive: false,
                    customerParams: [],
                    createdAt: '',
                    updatedAt: '',
                    credentialId: 0,
                    serviceOperator: {
                        serviceProvider: '',
                        serviceImage: '',
                    },
                },
            })
        );

        await act(async () => {
            await result.current.updateBeneficicary({
                id: 1,
                userId: 123,
                userType: 'user',
                name: 'Updated',
                isActive: '1',
                credentialId: '123',
                scope: 'email',
                otp: '1234',
            });
        });

        expect(updateBeneficiaryApi).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Updated', variant: 'success' })
        );
    });

    test('deletes a beneficiary', async () => {
        (deleteBeneficiaryApi as Mock).mockResolvedValue({ status: true, message: 'Deleted' });
        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey: '',
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: {
                    current: {
                        resetForm: vi.fn(),
                        values: {},
                        errors: {},
                        touched: {},
                        isSubmitting: false,
                        setSubmitting: vi.fn(),
                        handleSubmit: vi.fn(),
                        handleChange: vi.fn(),
                        handleBlur: vi.fn(),
                        setFieldValue: vi.fn(),
                        setFieldTouched: vi.fn(),
                        validateForm: vi.fn(),
                        validateField: vi.fn(),
                    } as any,
                },
                beneficiaryActionType: BeneficiaryActionType.ADD,
                setBeneficiaryActionType: vi.fn(),
                editValues: {
                    id: 1,
                    accessKey: '',
                    name: '',
                    phoneNo: '',
                    serviceProvider: '',
                    billerId: null,
                    providerCircle: '',
                    isActive: false,
                    customerParams: [],
                    createdAt: '',
                    updatedAt: '',
                    credentialId: 0,
                    serviceOperator: {
                        serviceProvider: '',
                        serviceImage: '',
                    },
                },
            })
        );

        await act(async () => {
            await result.current.deleteBeneficicary({
                userId: 123,
                userType: 'user',
                id: 1,
                scope: 'email',
                otp: '1234',
            });
        });

        expect(deleteBeneficiaryApi).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Deleted', variant: 'success' })
        );
    });
});
