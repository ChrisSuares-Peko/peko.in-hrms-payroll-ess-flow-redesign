import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecurringListPage } from '../../../../hooks/recurring/list/useRecurringListPage';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
}));

describe('useRecurringListPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('modalOpen is false initially', () => {
        const { result } = renderHook(() => useRecurringListPage());

        expect(result.current.modalOpen).toBe(false);
    });

    it('handleMakeRecurring sets modalOpen to true', () => {
        const { result } = renderHook(() => useRecurringListPage());

        act(() => {
            result.current.handleMakeRecurring();
        });

        expect(result.current.modalOpen).toBe(true);
    });

    it('handleCloseModal sets modalOpen back to false', () => {
        const { result } = renderHook(() => useRecurringListPage());

        act(() => {
            result.current.handleMakeRecurring();
        });
        expect(result.current.modalOpen).toBe(true);

        act(() => {
            result.current.handleCloseModal();
        });
        expect(result.current.modalOpen).toBe(false);
    });

    it('handleView calls navigate with correct path and state', () => {
        const { result } = renderHook(() => useRecurringListPage());

        act(() => {
            result.current.handleView('sched-123');
        });

        expect(navigate).toHaveBeenCalledWith(
            expect.stringContaining('recurring-invoices/view'),
            { state: { id: 'sched-123' } }
        );
    });
});
