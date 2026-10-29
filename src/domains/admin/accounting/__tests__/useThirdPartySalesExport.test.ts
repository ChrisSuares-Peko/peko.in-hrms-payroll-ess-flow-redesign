import { act, renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadThirdPartySales } from '../api/thirdPartySales';
import useThirdPartySalesExport from '../hooks/useThirdPartySalesExport';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({ reducer: { auth: { role: 'system-user', id: 3 } } }),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('../api/thirdPartySales', () => ({ downloadThirdPartySales: vi.fn() }));

const FILTERS = {
    kind: 'payment-links' as const,
    searchText: 'acme',
    from: '2026-10-01',
    to: '2026-10-06',
    status: 'paid' as const,
};

const TITLE = 'Third-Party Sales (Payment Links)';

beforeEach(() => vi.clearAllMocks());

describe('useThirdPartySalesExport', () => {
    it('asks the server for the file with the current filters and who is asking', async () => {
        (downloadThirdPartySales as unknown as Mock).mockResolvedValue(new Blob(['x']));
        const { result } = renderHook(() => useThirdPartySalesExport(FILTERS, TITLE));

        await act(() => result.current.exportAs('excel'));

        expect(downloadThirdPartySales).toHaveBeenCalledWith({
            userId: 3,
            userType: 'system-user',
            ...FILTERS,
            format: 'excel',
        });
    });

    it('saves the file under the title, the dates and the right extension', async () => {
        const blob = new Blob(['x']);
        (downloadThirdPartySales as unknown as Mock).mockResolvedValue(blob);
        const { result } = renderHook(() => useThirdPartySalesExport(FILTERS, TITLE));

        await act(() => result.current.exportAs('excel'));
        await act(() => result.current.exportAs('pdf'));

        expect((saveAs as unknown as Mock).mock.calls).toEqual([
            [blob, 'Third-Party Sales (Payment Links) 2026-10-01 to 2026-10-06.xlsx'],
            [blob, 'Third-Party Sales (Payment Links) 2026-10-01 to 2026-10-06.pdf'],
        ]);
    });
});
