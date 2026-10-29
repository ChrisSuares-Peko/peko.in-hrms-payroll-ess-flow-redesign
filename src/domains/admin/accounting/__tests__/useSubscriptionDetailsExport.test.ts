import { act, renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadSubscriptionDetails } from '../api/subscriptionDetails';
import useSubscriptionDetailsExport from '../hooks/useSubscriptionDetailsExport';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({ reducer: { auth: { role: 'system-user', id: 3 } } }),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('../api/subscriptionDetails', () => ({ downloadSubscriptionDetails: vi.fn() }));

const FILTERS = {
    searchText: 'acme',
    from: '2026-10-01',
    to: '2026-10-06',
    partnerId: 'default',
    billingType: 'MONTHLY' as const,
};

beforeEach(() => vi.clearAllMocks());

describe('useSubscriptionDetailsExport', () => {
    it('asks the server for the file with the current filters and who is asking', async () => {
        (downloadSubscriptionDetails as unknown as Mock).mockResolvedValue(new Blob(['x']));
        const { result } = renderHook(() => useSubscriptionDetailsExport(FILTERS));

        await act(() => result.current.exportAs('pdf'));

        expect(downloadSubscriptionDetails).toHaveBeenCalledWith({
            userId: 3,
            userType: 'system-user',
            ...FILTERS,
            format: 'pdf',
        });
    });

    it('saves the file under the title, the dates and the right extension', async () => {
        const blob = new Blob(['x']);
        (downloadSubscriptionDetails as unknown as Mock).mockResolvedValue(blob);
        const { result } = renderHook(() => useSubscriptionDetailsExport(FILTERS));

        await act(() => result.current.exportAs('excel'));
        await act(() => result.current.exportAs('pdf'));

        expect((saveAs as unknown as Mock).mock.calls).toEqual([
            [blob, 'Subscription Details 2026-10-01 to 2026-10-06.xlsx'],
            [blob, 'Subscription Details 2026-10-01 to 2026-10-06.pdf'],
        ]);
    });
});
