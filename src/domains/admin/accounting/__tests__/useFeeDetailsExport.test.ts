import { act, renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadFeeDetails } from '../api/feeDetails';
import useFeeDetailsExport from '../hooks/useFeeDetailsExport';

const dispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({ reducer: { auth: { role: 'system-user', id: 3 } } }),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('../api/feeDetails', () => ({ downloadFeeDetails: vi.fn() }));

const FILTERS = {
    feeType: 'commission' as const,
    searchText: 'acme',
    from: '2026-09-06',
    to: '2026-10-06',
    vendorId: 9,
};

const setup = () => renderHook(() => useFeeDetailsExport(FILTERS, 'Commission Details'));

beforeEach(() => vi.clearAllMocks());

describe('useFeeDetailsExport', () => {
    it('asks the server for the file with the current filters and who is asking', async () => {
        (downloadFeeDetails as unknown as Mock).mockResolvedValue(new Blob(['x']));
        const { result } = setup();

        await act(() => result.current.exportAs('excel'));

        expect(downloadFeeDetails).toHaveBeenCalledWith({
            userId: 3,
            userType: 'system-user',
            ...FILTERS,
            format: 'excel',
        });
    });

    it('saves the file under a name that carries the title, the dates and the right extension', async () => {
        const blob = new Blob(['x']);
        (downloadFeeDetails as unknown as Mock).mockResolvedValue(blob);
        const { result } = setup();

        await act(() => result.current.exportAs('excel'));
        await act(() => result.current.exportAs('pdf'));

        expect((saveAs as unknown as Mock).mock.calls).toEqual([
            [blob, 'Commission Details 2026-09-06 to 2026-10-06.xlsx'],
            [blob, 'Commission Details 2026-09-06 to 2026-10-06.pdf'],
        ]);
    });

    it('marks which format is being prepared, then clears it', async () => {
        let finish: (value: Blob) => void = () => {};
        (downloadFeeDetails as unknown as Mock).mockReturnValue(
            new Promise<Blob>(resolve => {
                finish = resolve;
            })
        );
        const { result } = setup();

        let pending: Promise<void>;
        act(() => {
            pending = result.current.exportAs('pdf');
        });
        expect(result.current.exportingFormat).toBe('pdf');

        await act(async () => {
            finish(new Blob(['x']));
            await pending;
        });
        expect(result.current.exportingFormat).toBeNull();
    });

    it('tells the user when it fails, and saves nothing', async () => {
        (downloadFeeDetails as unknown as Mock).mockResolvedValue(false);
        const { result } = setup();

        await act(() => result.current.exportAs('excel'));

        expect(saveAs).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ variant: 'error' }),
            })
        );
        expect(result.current.exportingFormat).toBeNull();
    });
});
