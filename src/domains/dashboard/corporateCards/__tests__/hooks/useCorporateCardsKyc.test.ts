import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { useCorporateCardsKyc } from '../../hooks/useCorporateCardsKyc';
import { initiateKyc, setKycStage } from '../../slices/corporateCardsSlice';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../slices/corporateCardsSlice', () => ({
    initiateKyc: vi.fn((role: string) => ({ type: 'corporateCards/initiateKyc', payload: role })),
    setKycStage: vi.fn((stage: string) => ({ type: 'corporateCards/setKycStage', payload: stage })),
    resetCorporateCardsKyc: vi.fn(() => ({ type: 'corporateCards/resetCorporateCardsKyc' })),
    setViewAs: vi.fn(),
}));

const mockDispatch = vi.fn();

const makeState = (kycStage = 'initiate', viewAs = 'user') => ({
    reducer: {
        corporateCards: { kycStage, viewAs },
    },
});

describe('useCorporateCardsKyc', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn(makeState('initiate', 'user'))
        );
    });

    // -----------------------------------------------------------------------
    describe('reads state from Redux', () => {
        it('returns stage from state.reducer.corporateCards.kycStage', () => {
            (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
                fn(makeState('verified', 'admin'))
            );
            const { result } = renderHook(() => useCorporateCardsKyc());
            expect(result.current.stage).toBe('verified');
        });

        it('returns viewAs from state.reducer.corporateCards.viewAs', () => {
            (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
                fn(makeState('initiate', 'admin'))
            );
            const { result } = renderHook(() => useCorporateCardsKyc());
            expect(result.current.viewAs).toBe('admin');
        });

        it('reflects "submitted" stage correctly', () => {
            (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
                fn(makeState('submitted', 'user'))
            );
            const { result } = renderHook(() => useCorporateCardsKyc());
            expect(result.current.stage).toBe('submitted');
        });
    });

    // -----------------------------------------------------------------------
    describe('initiateKyc', () => {
        it('dispatches the initiateKyc action with the given role', () => {
            const { result } = renderHook(() => useCorporateCardsKyc());
            act(() => {
                result.current.initiateKyc('admin');
            });
            expect(initiateKyc).toHaveBeenCalledWith('admin');
            expect(mockDispatch).toHaveBeenCalled();
        });

        it('dispatches initiateKyc with "user" role', () => {
            const { result } = renderHook(() => useCorporateCardsKyc());
            act(() => {
                result.current.initiateKyc('user');
            });
            expect(initiateKyc).toHaveBeenCalledWith('user');
        });
    });

    // -----------------------------------------------------------------------
    describe('goToDashboard', () => {
        it('dispatches setKycStage("verified")', () => {
            const { result } = renderHook(() => useCorporateCardsKyc());
            act(() => {
                result.current.goToDashboard();
            });
            expect(setKycStage).toHaveBeenCalledWith('verified');
            expect(mockDispatch).toHaveBeenCalled();
        });
    });
});
