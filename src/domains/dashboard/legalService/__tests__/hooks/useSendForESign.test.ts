import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { sendForESignApi } from '../../api';
import useSendForESign from '../../hooks/useSendForESign';

vi.mock('../../api', () => ({
    sendForESignApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: () => dispatchMock,
}));

const mockPayload = {
    docket_title: 'NDA Agreement',
    documentBase64: 'base64-string',
    expiry_date: '2025-12-31',
    initiator_email: 'owner@example.com',
    reminder: true,
    sequentialSignature: false,
    isLegalDocument: true,
    legalDocumentId: 1,
    signers_info: [{ name: 'John Doe', email: 'john@example.com', phone: '9876543210' }],
    termsofUse: true,
} as any;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useSendForESign', () => {
    it('should call sendForESignApi with correct params', async () => {
        (sendForESignApi as Mock).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useSendForESign());

        await act(async () => {
            await result.current.sendForESign(mockPayload);
        });

        expect(sendForESignApi).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 1, userType: 'merchant', legalDocumentId: 1 })
        );
    });

    it('should dispatch success toast and return true when resp.status is true', async () => {
        (sendForESignApi as Mock).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useSendForESign());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.sendForESign(mockPayload);
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Document sent for e-sign successfully', variant: 'success' })
        );
        expect(returnValue).toBe(true);
    });

    it('should dispatch error toast and return false when resp.status is false', async () => {
        (sendForESignApi as Mock).mockResolvedValueOnce({ status: false, message: 'Custom error' });

        const { result } = renderHook(() => useSendForESign());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.sendForESign(mockPayload);
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Custom error', variant: 'error' })
        );
        expect(returnValue).toBe(false);
    });

    it('should dispatch default error toast and return false when API returns false', async () => {
        (sendForESignApi as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useSendForESign());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.sendForESign(mockPayload);
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Failed to send for e-signature', variant: 'error' })
        );
        expect(returnValue).toBe(false);
    });

    it('should set isSending to true during call and false after', async () => {
        let resolveApi: (v: any) => void;
        (sendForESignApi as Mock).mockReturnValue(new Promise(r => { resolveApi = r; }));

        const { result } = renderHook(() => useSendForESign());

        act(() => {
            result.current.sendForESign(mockPayload);
        });

        expect(result.current.isSending).toBe(true);

        await act(async () => { resolveApi({ status: true }); });

        await waitFor(() => expect(result.current.isSending).toBe(false));
    });
});
