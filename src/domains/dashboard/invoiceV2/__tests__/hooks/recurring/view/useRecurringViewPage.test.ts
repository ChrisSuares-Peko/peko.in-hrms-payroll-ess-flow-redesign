import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecurringViewPage } from '../../../../hooks/recurring/view/useRecurringViewPage';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
    useLocation: () => ({ state: { id: 42 } }),
}));

vi.mock('../../../../hooks/recurring/view/useRecurringDetail', () => ({
    useRecurringDetail: vi.fn(() => ({
        schedule: null,
        isLoading: false,
        isActioning: false,
        handlePause: vi.fn(),
        handleResume: vi.fn(),
        handleEnd: vi.fn(),
        refetch: vi.fn(),
    })),
    default: vi.fn(() => ({
        schedule: null,
        isLoading: false,
        isActioning: false,
        handlePause: vi.fn(),
        handleResume: vi.fn(),
        handleEnd: vi.fn(),
        refetch: vi.fn(),
    })),
}));

vi.mock('../../../../utils/recurrenceEngine', () => ({
    freqTextFromApi: vi.fn(() => 'Monthly'),
}));

vi.mock('@src/routes/paths', () => ({
    paths: { invoice: { index: 'invoice', recurring: 'recurring' } },
}));

describe('useRecurringViewPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('recurringId derived from location.state.id as string "42"', () => {
        const { result } = renderHook(() => useRecurringViewPage());
        expect(result.current.recurringId).toBe('42');
    });

    it('isActive, isPaused, isEnded are all false when schedule is null', () => {
        const { result } = renderHook(() => useRecurringViewPage());
        expect(result.current.isActive).toBe(false);
        expect(result.current.isPaused).toBe(false);
        expect(result.current.isEnded).toBe(false);
    });

    it('isActive=true when schedule.status=ACTIVE', async () => {
        const { useRecurringDetail } = await import('../../../../hooks/recurring/view/useRecurringDetail');
        (useRecurringDetail as ReturnType<typeof vi.fn>).mockReturnValue({
            schedule: { status: 'ACTIVE', sourceInvoice: { name: 'Customer A' }, frequency: { unit: 'MONTHS', every: 1 } },
            isLoading: false,
            isActioning: false,
            handlePause: vi.fn(),
            handleResume: vi.fn(),
            handleEnd: vi.fn(),
            refetch: vi.fn(),
        });

        const { result } = renderHook(() => useRecurringViewPage());
        expect(result.current.isActive).toBe(true);
    });

    it('backToList calls navigate', () => {
        const { result } = renderHook(() => useRecurringViewPage());
        act(() => {
            result.current.backToList();
        });
        expect(navigate).toHaveBeenCalled();
    });
});
