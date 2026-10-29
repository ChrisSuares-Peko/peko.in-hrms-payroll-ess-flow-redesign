/**
 * @file useGetAssistance.test.tsx
 * @description Unit tests for useGetAssistance hook.
 *
 * Test coverage:
 *  - Returns isLoading (false) and requestAssistance on mount
 *  - Sets isLoading=true during the API call and false after
 *  - Navigates to getAssistanceSuccess on successful response (data.status truthy)
 *  - Dispatches showToast error when API returns falsy status
 *  - Dispatches showToast error when API returns false
 *  - Passes correct payload (userId, userType, productName) to getAssistance
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useGetAssistance from '../../../hooks/general/useGetAssistance';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockGetAssistance = vi.fn();
vi.mock('../../../api', () => ({
    getAssistance: (...args: unknown[]) => mockGetAssistance(...args),
}));

const mockShowToast = vi.fn();
vi.mock('@src/slices/apiSlice', () => ({
    showToast: (...args: unknown[]) => {
        mockShowToast(...args);
        return { type: 'api/showToast', payload: args[0] };
    },
}));

// ---------------------------------------------------------------------------
// Redux store
// ---------------------------------------------------------------------------

const buildStore = () =>
    configureStore({
        reducer: {
            reducer: () => ({
                auth: { id: 'user-123', role: 'buyer' },
            }),
        },
    });

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const makeWrapper = () => {
    const store = buildStore();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGetAssistance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test Initial state: isLoading=false, requestAssistance is a function.
     */
    it('returns isLoading=false and a requestAssistance function on mount', () => {
        const { result } = renderHook(() => useGetAssistance(), { wrapper: makeWrapper() });

        expect(result.current.isLoading).toBe(false);
        expect(typeof result.current.requestAssistance).toBe('function');
    });

    /**
     * @test Passes correct payload to getAssistance.
     */
    it('calls getAssistance with userId, userType, and productName', async () => {
        mockGetAssistance.mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useGetAssistance(), { wrapper: makeWrapper() });

        await act(async () => {
            await result.current.requestAssistance('Slack');
        });

        expect(mockGetAssistance).toHaveBeenCalledWith({
            userId: 'user-123',
            userType: 'buyer',
            productName: 'Slack',
        });
    });

    /**
     * @test Navigates to getAssistanceSuccess when API returns truthy status.
     */
    it('navigates to getAssistanceSuccess on successful API response', async () => {
        mockGetAssistance.mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useGetAssistance(), { wrapper: makeWrapper() });

        await act(async () => {
            await result.current.requestAssistance('Notion');
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('get-assistance-success')
        );
        expect(mockShowToast).not.toHaveBeenCalled();
    });

    /**
     * @test Dispatches error toast when API returns status=false.
     */
    it('dispatches error toast when API returns falsy status', async () => {
        mockGetAssistance.mockResolvedValueOnce({ status: false });

        const { result } = renderHook(() => useGetAssistance(), { wrapper: makeWrapper() });

        await act(async () => {
            await result.current.requestAssistance('Jira');
        });

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    /**
     * @test Dispatches error toast when API returns false (network/server failure).
     */
    it('dispatches error toast when getAssistance returns false', async () => {
        mockGetAssistance.mockResolvedValueOnce(false);

        const { result } = renderHook(() => useGetAssistance(), { wrapper: makeWrapper() });

        await act(async () => {
            await result.current.requestAssistance('Asana');
        });

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    /**
     * @test isLoading transitions: false → true during call → false after call.
     */
    it('sets isLoading=true during the API call and resets to false after', async () => {
        let resolveApi!: (value: unknown) => void;
        mockGetAssistance.mockReturnValueOnce(
            new Promise(res => {
                resolveApi = res;
            })
        );

        const { result } = renderHook(() => useGetAssistance(), { wrapper: makeWrapper() });

        act(() => {
            result.current.requestAssistance('Monday');
        });

        await waitFor(() => expect(result.current.isLoading).toBe(true));

        await act(async () => {
            resolveApi({ status: true });
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
