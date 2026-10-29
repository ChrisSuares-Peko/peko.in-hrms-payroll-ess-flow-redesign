import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getAllGuidelines, getTemplate } from '../../../../api/reminder';
import useInvoiceReminders from '../../../../hooks/invoice/view/useInvoiceReminders';

vi.mock('../../../../api/reminder', () => ({
    getAllGuidelines: vi.fn(),
    getTemplate: vi.fn(),
    addGuideline: vi.fn(),
    updateGuideline: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('react-redux', () => ({
    useDispatch: () => dispatchMock,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: any) => x),
}));

describe('useInvoiceReminders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches guidelines and templates on mount when invoiceId=123', async () => {
        (getAllGuidelines as Mock).mockResolvedValue({ rows: [], count: 0 });
        (getTemplate as Mock).mockResolvedValue({ rows: [] });

        const { result } = renderHook(() => useInvoiceReminders(123));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(getAllGuidelines).toHaveBeenCalledWith(
            expect.objectContaining({ invoiceId: 123 })
        );
        expect(getTemplate).toHaveBeenCalled();
    });

    it('loading becomes false after fetch', async () => {
        (getAllGuidelines as Mock).mockResolvedValue({ rows: [], count: 0 });
        (getTemplate as Mock).mockResolvedValue({ rows: [] });

        const { result } = renderHook(() => useInvoiceReminders(123));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.loading).toBe(false);
    });

    it('validateForm returns false when no channel selected (email=false, sms=false)', async () => {
        (getAllGuidelines as Mock).mockResolvedValue({ rows: [], count: 0 });
        (getTemplate as Mock).mockResolvedValue({ rows: [] });

        const { result } = renderHook(() => useInvoiceReminders(123));
        await waitFor(() => expect(result.current.loading).toBe(false));

        let returnValue: boolean | undefined;
        act(() => {
            returnValue = result.current.validateForm({
                data: [{ email: false, sms: false, templet: {} }],
            });
        });

        expect(returnValue).toBe(false);
        expect(dispatchMock).toHaveBeenCalled();
    });

    it('validateForm returns true when email=true and emailId is provided', async () => {
        (getAllGuidelines as Mock).mockResolvedValue({ rows: [], count: 0 });
        (getTemplate as Mock).mockResolvedValue({ rows: [] });

        const { result } = renderHook(() => useInvoiceReminders(123));
        await waitFor(() => expect(result.current.loading).toBe(false));

        let returnValue: boolean | undefined;
        act(() => {
            returnValue = result.current.validateForm({
                data: [
                    {
                        email: true,
                        sms: false,
                        templet: {
                            email: { subject: 'Hello', body: 'Body', emailId: 'test@example.com' },
                        },
                    },
                ],
            });
        });

        expect(returnValue).toBe(true);
    });
});
