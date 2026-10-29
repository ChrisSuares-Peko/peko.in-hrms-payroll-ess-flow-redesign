import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useEInvoiceAuth } from '../../../hooks/eInvoiceAuth/useEInvoiceAuth';

const selectorMock = vi.fn();
vi.mock('react-redux', () => ({
    useSelector: (selector: any) => selectorMock(selector),
}));

const setMockState = (eInvoiceAuth: Record<string, unknown>) => {
    selectorMock.mockImplementation((selector: any) =>
        selector({ reducer: { eInvoiceAuth } })
    );
};

describe('useEInvoiceAuth', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('returns isAuthenticated=true when authToken and valid expiry are present', () => {
        setMockState({
            authToken: 'token-123',
            tokenExpiry: '2026-01-01T15:00:00Z',
            gstin: '29ABCDE1234F1Z5',
            clientId: 'client-1',
        });

        const { result } = renderHook(() => useEInvoiceAuth());

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.sessionInfo.isActive).toBe(true);
        expect(result.current.sessionInfo.gstin).toBe('29ABCDE1234F1Z5');
        expect(result.current.sessionInfo.clientId).toBe('client-1');
    });

    it('returns isAuthenticated=false when authToken missing', () => {
        setMockState({
            authToken: null,
            tokenExpiry: '2026-01-01T15:00:00Z',
            gstin: null,
            clientId: null,
        });

        const { result } = renderHook(() => useEInvoiceAuth());

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.sessionInfo.isActive).toBe(false);
    });

    it('returns isAuthenticated=false when tokenExpiry is in the past', () => {
        setMockState({
            authToken: 'token-123',
            tokenExpiry: '2026-01-01T09:00:00Z',
            gstin: 'g',
            clientId: 'c',
        });

        const { result } = renderHook(() => useEInvoiceAuth());

        expect(result.current.isAuthenticated).toBe(false);
    });

    it('falls back to em-dash for missing gstin/clientId', () => {
        setMockState({
            authToken: 'token-123',
            tokenExpiry: '2026-01-01T15:00:00Z',
            gstin: null,
            clientId: null,
        });

        const { result } = renderHook(() => useEInvoiceAuth());

        expect(result.current.sessionInfo.gstin).toBe('—');
        expect(result.current.sessionInfo.clientId).toBe('—');
    });

    it('does not crash when tokenExpiry is null (no interval set up)', () => {
        setMockState({
            authToken: null,
            tokenExpiry: null,
            gstin: null,
            clientId: null,
        });

        const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
        renderHook(() => useEInvoiceAuth());
        expect(setIntervalSpy).not.toHaveBeenCalled();
        setIntervalSpy.mockRestore();
    });

    it('clears interval on unmount', () => {
        setMockState({
            authToken: 'token-123',
            tokenExpiry: '2026-01-01T15:00:00Z',
            gstin: 'g',
            clientId: 'c',
        });

        const clearSpy = vi.spyOn(globalThis, 'clearInterval');
        const { unmount } = renderHook(() => useEInvoiceAuth());
        unmount();
        expect(clearSpy).toHaveBeenCalled();
        clearSpy.mockRestore();
    });
});
