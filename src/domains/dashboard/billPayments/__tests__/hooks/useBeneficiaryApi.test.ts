import { renderHook, act, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    AddBeneficiaryApi,
    deleteBeneficiaryApi,
    getBeneficiaryOtp,
    getServiceBeneficiary,
    updateBeneficiaryApi,
} from '../../api/index';
import useBeneficiaryApis from '../../hooks/useBeneficiaryApis';
import { addEditBeneficiaryPayload, BeneficiaryActionType } from '../../types';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    AddBeneficiaryApi: vi.fn(),
    deleteBeneficiaryApi: vi.fn(),
    getBeneficiaryOtp: vi.fn(),
    getServiceBeneficiary: vi.fn(),
    updateBeneficiaryApi: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));
const mockAddBeneficiaryApi = AddBeneficiaryApi as Mock;
const mockGetServiceBeneficiary = getServiceBeneficiary as Mock;
const mockGetBeneficiaryOtp = getBeneficiaryOtp as Mock;
const mockUpdateBeneficiaryApi = updateBeneficiaryApi as Mock;
const mockDeleteBeneficiaryApi = deleteBeneficiaryApi as Mock;

describe('useBeneficiaryApis', () => {
    const accessKey = 'testAccessKey';
    const role = 'admin';
    const id = 123;

    beforeEach(() => {
        cleanup();
        (useAppSelector as Mock).mockImplementation((callback: (state: any) => any) =>
            callback({
                reducer: {
                    auth: {
                        role,
                        id,
                    },
                    beneficiary: { isLoading: false, refresh: false, beneficiaryData: [] },
                },
            })
        );
    });

    it('should fetch beneficiaries list', async () => {
        const mockBeneficiaries = { beneficiaries: [] };
        mockGetServiceBeneficiary.mockResolvedValue(mockBeneficiaries);

        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey,
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: undefined,
                beneficiaryActionType: 'ADD' as BeneficiaryActionType,
                setBeneficiaryActionType: vi.fn(),
                editValues: null,
            })
        );

        await act(async () => {
            await result.current.beneficiaryData;
        });

        expect(result.current.beneficiaryData).toEqual(mockBeneficiaries.beneficiaries);
        expect(getServiceBeneficiary).toHaveBeenCalledWith({
            userId: id,
            userType: role,
            accessKey,
        });
    });

    it('should send OTP for adding beneficiary', async () => {
        mockGetBeneficiaryOtp.mockResolvedValue({ status: true });

        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey,
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: undefined,
                beneficiaryActionType: 'ADD' as BeneficiaryActionType,
                setBeneficiaryActionType: vi.fn(),
                editValues: null,
            })
        );

        const values: any = {
            accessKey,
            beneficiaryId: 123,
            ActionType: 'ADD',
            name: 'John Doe',
            serviceProvider: 'Provider1',
            billerId: '123',
            customerParams: [],
        };

        await act(async () => {
            await result.current.sendOtpApi('ADD', values);
        });

        expect(getBeneficiaryOtp).toHaveBeenCalledWith({
            userId: id,
            userType: role,
            ActionType: 'ADD',
            accessKey,
            beneficiaryId: 123,
        });
    });

    it('should add a new beneficiary', async () => {
        mockAddBeneficiaryApi.mockResolvedValue({
            status: true,
            message: 'Beneficiary added successfully',
        });

        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey,
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: undefined,
                beneficiaryActionType: 'ADD' as BeneficiaryActionType,
                setBeneficiaryActionType: vi.fn(),
                editValues: null,
            })
        );

        const payload: any = { userId: id, userType: role, id: 123, otp: '123456', scope: 'scope' };

        await act(async () => {
            await result.current.addBeneficiary(payload);
        });

        expect(AddBeneficiaryApi).toHaveBeenCalledWith(payload);
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ description: 'Beneficiary added successfully', variant: 'success' })
        );
    });

    it('should update an existing beneficiary', async () => {
        mockUpdateBeneficiaryApi.mockResolvedValue({
            status: true,
            message: 'Beneficiary updated successfully',
        });

        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey,
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: undefined,
                beneficiaryActionType: 'EDIT' as BeneficiaryActionType,
                setBeneficiaryActionType: vi.fn(),
                editValues: {
                    id: 123,
                    accessKey: 'someAccessKey',
                    name: 'John Doe',
                    phoneNo: '1234567890',
                    serviceProvider: 'Provider1',
                    customerParams: [],
                    isActive: true,
                    credentialId: 123,
                    billerId: 'someBillerId',
                    providerCircle: 'Circle1',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    serviceOperator: {
                        serviceProvider: 'Provider1',
                        serviceImage: 'imageUrl',
                    },
                },
            })
        );

        const payload: addEditBeneficiaryPayload = {
            userId: id,
            userType: role,
            id: 123,
            accountNo: '123',
            isActive: 'true',
            credentialId: 'yourCredentialId',
        };
        await act(async () => {
            await result.current.updateBeneficicary(payload);
        });

        expect(updateBeneficiaryApi).toHaveBeenCalledWith(payload);
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ description: 'Beneficiary updated successfully', variant: 'success' })
        );
    });

    it('should delete a beneficiary', async () => {
        mockDeleteBeneficiaryApi.mockResolvedValue({
            status: true,
            message: 'Beneficiary deleted successfully',
        });

        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey,
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: undefined,
                beneficiaryActionType: 'DELETE' as BeneficiaryActionType,
                setBeneficiaryActionType: vi.fn(),
                editValues: {
                    id: 123,
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

        const payload = { userId: id, userType: role, id: 123, otp: '123456', scope: 'scope' };

        await act(async () => {
            const resp = await result.current.deleteBeneficicary(payload);
            expect(resp).toBe(true);
        });

        expect(deleteBeneficiaryApi).toHaveBeenCalledWith(payload);
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({ description: 'Beneficiary deleted successfully', variant: 'success' })
        );
    });

    it('should handle OTP submission for add and edit actions', async () => {
        const { result } = renderHook(() =>
            useBeneficiaryApis({
                accessKey,
                openOtpModal: vi.fn(),
                closeOtpModal: vi.fn(),
                closeAddModal: vi.fn(),
                closeConfirmationModal: vi.fn(),
                formRefName: undefined,
                beneficiaryActionType: 'ADD' as BeneficiaryActionType,
                setBeneficiaryActionType: vi.fn(),
                editValues: null,
            })
        );

        const values = {
            accessKey,
            beneficiaryId: 123,
            ActionType: 'ADD',
            name: 'John Doe',
            serviceProvider: 'Provider1',
            billerId: '123',
            customerParams: [],
        };

        await act(async () => {
            await result.current.handleOtpSubmit(values);
        });

        expect(getBeneficiaryOtp).toHaveBeenCalledWith({
            userId: id,
            userType: role,
            ActionType: 'ADD',
            accessKey: 'testAccessKey',
            beneficiaryId: 123,
        });
    });
});
