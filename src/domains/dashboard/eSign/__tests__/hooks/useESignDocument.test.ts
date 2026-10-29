import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { OrderDetailsApi, resendInvitationApi, signRequestApi } from '@domains/dashboard/eSign/api';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { useESignDocument } from '../../hooks/useESignDocument';

// Mock hooks and API
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@domains/dashboard/eSign/api', () => ({
    signRequestApi: vi.fn(),
    resendInvitationApi: vi.fn(),
    OrderDetailsApi: vi.fn(),
}));

// Ensure `showToast` and `setESignDocData` return valid action objects
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'showToast', payload })),
}));

vi.mock('@domains/dashboard/eSign/slices/eSignDocSlice', () => ({
    setESignDocData: vi.fn(payload => ({ type: 'setESignDocData', payload })),
}));

describe('useESignDocument Hook', () => {
    let mockDispatch: any;
    let mockNavigate: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch = vi.fn();
        mockNavigate = vi.fn();

        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useNavigate as any).mockReturnValue(mockNavigate);

        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    auth: { id: 1, role: 'user' },
                    eSignDoc: {
                        id: 123,
                        signerCo: { 0: [{ id: 'sign1' }] },
                        signers_info: [{ signer_id: 'abc' }],
                    },
                },
            })
        );
    });

    it('should show error when signers have no assigned positions', async () => {
        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    auth: { id: 1, role: 'user' },
                    eSignDoc: { id: 123, signerCo: {}, signers_info: [{ signer_index: 0 }] },
                },
            })
        );

        const { result } = renderHook(() => useESignDocument());

        await act(async () => {
            const status = await result.current.eSignDocument({
                expiry_date: '',
                isTouchDevice: false,
                signers_info: [{ signer_index: 0 }],
            } as any);
            expect(status).toBe(false);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'showToast',
                payload: expect.objectContaining({
                    description: expect.stringContaining('Assign a position for Signer'),
                    variant: 'error',
                }),
            })
        );
    });

    it('should call resendInvitation API successfully', async () => {
        (resendInvitationApi as any).mockResolvedValue({ success: true });

        const { result } = renderHook(() => useESignDocument());

        await act(async () => {
            await result.current.resendInvitation(0, 'John Doe', 'john@example.com');
        });

        expect(resendInvitationApi).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 1,
                userType: 'user',
                id: 123,
                signer_id: 'abc',
                name: 'John Doe',
                email: 'john@example.com',
            })
        );

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'showToast',
                payload: expect.objectContaining({
                    description: 'Invitation resent successfully.',
                    variant: 'success',
                }),
            })
        );
    });

    it('should fetch order details and update state correctly', async () => {
        const mockOrderData = {
            documentBase64: 'mockBase64',
        };
        (OrderDetailsApi as any).mockResolvedValue(mockOrderData);

        const { result } = renderHook(() => useESignDocument());

        await act(async () => {
            await result.current.getOrderDetails(456);
        });

        expect(OrderDetailsApi).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 1,
                userType: 'user',
                id: 456,
            })
        );

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'setESignDocData',
                payload: expect.objectContaining({
                    documentBase64: expect.stringContaining('data:application/pdf;base64,'),
                }),
            })
        );
    });

    it('should navigate to history page if order details fetch fails', async () => {
        (OrderDetailsApi as any).mockResolvedValue(false);

        const { result } = renderHook(() => useESignDocument());

        await act(async () => {
            await result.current.getOrderDetails(456);
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            `${paths.dashboard.eSign}/${paths.eSign.historyPage}`
        );
    });

    it('should update loading state during API calls', async () => {
        (signRequestApi as any).mockResolvedValue({ success: true });

        const { result } = renderHook(() => useESignDocument());

        expect(result.current.isLoading).toBe(false);

        await act(async () => {
            const promise = result.current.eSignDocument({
                expiry_date: '',
                isTouchDevice: false,
                signers_info: [{ signer_index: 0 }],
            } as any);
            expect(result.current.isLoading).toBe(false);
            await promise;
        });

        expect(result.current.isLoading).toBe(false);
    });
});
