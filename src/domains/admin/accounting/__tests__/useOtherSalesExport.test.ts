import { act, renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadOtherSales } from '../api/otherSales';
import useOtherSalesExport from '../hooks/useOtherSalesExport';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({ reducer: { auth: { role: 'system-user', id: 3 } } }),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('../api/otherSales', () => ({ downloadOtherSales: vi.fn() }));

const FILTERS = {
    searchText: 'acme',
    from: '2026-10-01',
    to: '2026-10-06',
    vendorId: 9,
    partnerId: 55,
};

beforeEach(() => vi.clearAllMocks());

describe('useOtherSalesExport', () => {
    it('asks the server for the file with the current filters and who is asking', async () => {
        (downloadOtherSales as unknown as Mock).mockResolvedValue(new Blob(['x']));
        const { result } = renderHook(() => useOtherSalesExport(FILTERS));

        await act(() => result.current.exportAs('excel'));

        expect(downloadOtherSales).toHaveBeenCalledWith({
            userId: 3,
            userType: 'system-user',
            ...FILTERS,
            format: 'excel',
        });
    });

    it('saves the file under the title, the dates and the right extension', async () => {
        const blob = new Blob(['x']);
        (downloadOtherSales as unknown as Mock).mockResolvedValue(blob);
        const { result } = renderHook(() => useOtherSalesExport(FILTERS));

        await act(() => result.current.exportAs('excel'));
        await act(() => result.current.exportAs('pdf'));

        expect((saveAs as unknown as Mock).mock.calls).toEqual([
            [blob, 'Other Sales 2026-10-01 to 2026-10-06.xlsx'],
            [blob, 'Other Sales 2026-10-01 to 2026-10-06.pdf'],
        ]);
    });
});
