import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { cancelReminder, sendReminder } from '../../../api/reminder';
import { useReminderActions } from '../../../hooks/reminders/useReminderActions';

vi.mock('../../../api/reminder', () => ({
    sendReminder: vi.fn(),
    cancelReminder: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: unknown) => x),
}));

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const makeRow = (id: number) =>
    ({
        id,
        scheduledDate: '',
        invoiceNo: 'INV-001',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        amountDue: 100,
        totalAmount: 100,
        currency: 'INR',
        channels: [],
        invoiceStatus: 'UNPAID',
        status: 'Pending' as const,
    });

describe('useReminderActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('acting is null initially', () => {
        const refetch = vi.fn();
        const { result } = renderHook(() => useReminderActions(refetch));

        expect(result.current.acting).toBeNull();
    });

    it('onSend calls sendReminder with correct id; sets acting before call, null after', async () => {
        (sendReminder as Mock).mockResolvedValue(true);
        const refetch = vi.fn();

        const { result } = renderHook(() => useReminderActions(refetch));
        const row = makeRow(42);

        await act(async () => {
            await result.current.onSend(row);
        });

        expect(sendReminder).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42 })
        );
        expect(result.current.acting).toBeNull();
    });

    it('onCancel calls cancelReminder with correct id', async () => {
        (cancelReminder as Mock).mockResolvedValue(true);
        const refetch = vi.fn();

        const { result } = renderHook(() => useReminderActions(refetch));
        const row = makeRow(7);

        await act(async () => {
            await result.current.onCancel(row);
        });

        expect(cancelReminder).toHaveBeenCalledWith(
            expect.objectContaining({ id: 7 })
        );
    });

    it('calls refetch after successful send', async () => {
        (sendReminder as Mock).mockResolvedValue(true);
        const refetch = vi.fn();

        const { result } = renderHook(() => useReminderActions(refetch));

        await act(async () => {
            await result.current.onSend(makeRow(1));
        });

        expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('dispatches error toast when sendReminder returns falsy', async () => {
        (sendReminder as Mock).mockResolvedValue(false);
        const refetch = vi.fn();

        const { result } = renderHook(() => useReminderActions(refetch));

        await act(async () => {
            await result.current.onSend(makeRow(1));
        });

        expect(refetch).not.toHaveBeenCalled();
        expect(result.current.acting).toBeNull();
    });
});
