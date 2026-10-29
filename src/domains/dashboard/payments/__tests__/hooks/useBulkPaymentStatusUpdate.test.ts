import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { setUserInfo } from '@src/slices/userSlice';

import { getBulkPaymentStatusApi } from '../../api/index';
import useBulkPaymentStatusUpdate from '../../hooks/useBulkPaymentStatusUpdate';

// Mock necessary modules
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getBulkPaymentStatusApi: vi.fn(),
}));

// Create a test setup
describe('useBulkPaymentStatusUpdate', () => {
    const setBulkPaymentDataMock = vi.fn();
    const dispatchMock = vi.fn();
    const user = { user: { balance: 100 } };
    const bulkPaymentData = [
        {
            corporateTxnId: 1,
            paymentStatus: 'PENDING',
            account: 'account1',
            amount: 100,
            surcharge: 10,
            batchId: 456,
        },
        {
            corporateTxnId: 2,
            paymentStatus: 'PENDING',
            account: 'account2',
            amount: 200,
            surcharge: 20,
            batchId: 456,
        },
    ];
    const id = 123;
    const role = 'admin';
    const batchId = 456;

    beforeEach(() => {
        (useAppDispatch as Mock).mockReturnValue(dispatchMock);
        (useAppSelector as Mock).mockReturnValue({ user });
    });

    it('should call getBulkPaymentStatusApi when batchId is provided', async () => {
        const resp = { bulkPaymentStatus: [{ corporateTxnId: 1, status: 'SUCCESS' }] };
        (getBulkPaymentStatusApi as Mock).mockResolvedValue(resp);

        renderHook(() =>
            useBulkPaymentStatusUpdate(id, role, batchId, bulkPaymentData, setBulkPaymentDataMock)
        );

        // Ensure getBulkPaymentStatusApi was called with the correct arguments
        expect(getBulkPaymentStatusApi).toHaveBeenCalledWith(
            { userId: id, userType: role },
            batchId
        );
    });

    it('should update user balance when pusher event is triggered (without pusher logic)', async () => {
        const resp = { bulkPaymentStatus: [{ corporateTxnId: 1, status: 'SUCCESS' }] };
        (getBulkPaymentStatusApi as Mock).mockResolvedValue(resp);

        renderHook(() =>
            useBulkPaymentStatusUpdate(id, role, batchId, bulkPaymentData, setBulkPaymentDataMock)
        );

        // Simulate state update triggered by pusher event
        await act(async () => {
            dispatchMock(
                setUserInfo({
                    user: {
                        balance: '150',
                        credentialId: 0,
                        role: '',
                        companyName: '',
                        roleName: '',
                        logo: '',
                        productTour: {
                            dashboard: false,
                            payroll: false
                        },
                        gstVerified: '',
                        panVerified: '',
                        contactPersonName: '',
                        email: '',
                        mobileNo: '',
                        chatId: '',
                    },
                })
            );
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            setUserInfo({
                user: {
                    balance: '150',
                    credentialId: 0,
                    role: '',
                    companyName: '',
                    roleName: '',
                    logo: '',
                    productTour: {
                        dashboard: false,
                        payroll: false
                    },
                    gstVerified: '',
                    panVerified: '',
                    contactPersonName: '',
                    email: '',
                    mobileNo: '',
                    chatId: '',
                },
            })
        );
    });
});
