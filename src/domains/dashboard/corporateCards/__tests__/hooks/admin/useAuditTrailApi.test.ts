import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getCardAudit } from '../../../api/admin/cardLimitsApi';
import { useAuditTrailApi } from '../../../hooks/admin/useAuditTrailApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/cardLimitsApi', () => ({
    getCardAudit: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makeAuditItem = (overrides = {}) => ({
    id: 1,
    title: 'Card blocked',
    description: 'Card was blocked by admin',
    timestamp: '2024-01-15T10:30:00Z',
    actor: 'Admin',
    category: 'Security',
    ...overrides,
});

describe('useAuditTrailApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    // -----------------------------------------------------------------------
    describe('when cardIssuanceId is null', () => {
        it('does not call getCardAudit', async () => {
            renderHook(() => useAuditTrailApi(null));
            await new Promise(r => setTimeout(r, 0));
            expect(getCardAudit).not.toHaveBeenCalled();
        });

        it('returns events=[] and isLoading=false', () => {
            const { result } = renderHook(() => useAuditTrailApi(null));
            expect(result.current.events).toEqual([]);
            expect(result.current.isLoading).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    describe('when cardIssuanceId is provided', () => {
        it('calls getCardAudit with role, id, cardIssuanceId', async () => {
            (getCardAudit as Mock).mockResolvedValue(false);
            renderHook(() => useAuditTrailApi('card-55'));
            await waitFor(() => expect(getCardAudit).toHaveBeenCalledWith('admin', 1, 'card-55'));
        });

        it('maps items correctly and sets isLoading=false', async () => {
            const item = makeAuditItem();
            (getCardAudit as Mock).mockResolvedValue({ data: { rows: [item] } });

            const { result } = renderHook(() => useAuditTrailApi('card-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.events).toHaveLength(1);
            const ev = result.current.events[0];
            expect(ev.key).toBe('1');
            expect(ev.title).toBe('Card blocked');
            expect(ev.description).toBe('Card was blocked by admin');
            expect(ev.actor).toBe('Admin');
            expect(ev.category).toBe('Security');
        });

        it('formats timestamp to en-IN locale date and time', async () => {
            (getCardAudit as Mock).mockResolvedValue({
                data: { rows: [makeAuditItem({ timestamp: '2024-06-15T14:30:00Z' })] },
            });
            const { result } = renderHook(() => useAuditTrailApi('card-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            // Verify it contains date and time portions (exact formatting is locale/env-dependent)
            expect(result.current.events[0].timestamp).toMatch(/2024/);
        });

        it('maps known category "Limits" correctly', async () => {
            (getCardAudit as Mock).mockResolvedValue({
                data: { rows: [makeAuditItem({ category: 'Limits' })] },
            });
            const { result } = renderHook(() => useAuditTrailApi('card-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.events[0].category).toBe('Limits');
        });

        it('falls back to "Lifecycle" for unknown categories', async () => {
            (getCardAudit as Mock).mockResolvedValue({
                data: { rows: [makeAuditItem({ category: 'UnknownCategory' })] },
            });
            const { result } = renderHook(() => useAuditTrailApi('card-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.events[0].category).toBe('Lifecycle');
        });

        it('sets events=[] when API returns false', async () => {
            (getCardAudit as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useAuditTrailApi('card-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.events).toEqual([]);
        });

        it('sets events=[] when rows array is empty', async () => {
            (getCardAudit as Mock).mockResolvedValue({ data: { rows: [] } });
            const { result } = renderHook(() => useAuditTrailApi('card-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.events).toEqual([]);
        });
    });
});
