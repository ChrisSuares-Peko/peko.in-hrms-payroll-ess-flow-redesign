import { renderHook, act } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { moduleTypeListing } from '../../api/index';
import { useGetModuleListingType } from '../../hooks/useModuleApi';
import { setModuleData } from '../../slices/supportSlice';

const mockModuleData = {
    modules: [
        { label: 'Module A', value: 'moduleA' },
        { label: 'Module B', value: 'moduleB' },
    ],
};

vi.mock('react-redux', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useDispatch: vi.fn(() => vi.fn()),
    };
});

vi.mock('../../api/index', () => ({
    moduleTypeListing: vi.fn(),
}));

vi.mock('../../slices/supportSlice', () => ({
    setModuleData: vi.fn(),
}));

describe('useGetModuleListingType Hook', () => {
    let dispatchMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        (useDispatch as any).mockReturnValue(dispatchMock);
    });

    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useGetModuleListingType());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.moduleTypes).toEqual([]);
    });

    it('should fetch module types and update state correctly', async () => {
        (moduleTypeListing as any).mockResolvedValue(mockModuleData);

        const { result } = renderHook(() => useGetModuleListingType());

        await act(async () => {
            await result.current.moduleTypes;
        });

        expect(moduleTypeListing).toHaveBeenCalled();
        expect(result.current.moduleTypes).toEqual(mockModuleData.modules);
        expect(result.current.isLoading).toBe(false);
        expect(dispatchMock).toHaveBeenCalledWith(setModuleData(mockModuleData.modules));
    });

    it('should not call API again if data is already available', async () => {
        (moduleTypeListing as any).mockResolvedValue(mockModuleData);

        const { result, rerender } = renderHook(() => useGetModuleListingType());

        await act(async () => {
            await result.current.moduleTypes;
        });

        expect(moduleTypeListing).toHaveBeenCalledTimes(1);

        rerender();

        expect(moduleTypeListing).toHaveBeenCalledTimes(1);
    });

    it('should update state correctly when new module types are received', async () => {
        const newMockModuleData = {
            modules: [
                { label: 'Module C', value: 'moduleC' },
                { label: 'Module D', value: 'moduleD' },
            ],
        };

        (moduleTypeListing as any).mockResolvedValue(newMockModuleData);

        const { result } = renderHook(() => useGetModuleListingType());

        await act(async () => {
            await result.current.moduleTypes;
        });

        expect(moduleTypeListing).toHaveBeenCalled();
        expect(result.current.moduleTypes).toEqual(newMockModuleData.modules);
        expect(dispatchMock).toHaveBeenCalledWith(setModuleData(newMockModuleData.modules));
    });
});
