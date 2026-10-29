import { renderHook, act } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { issueTypeListing } from '../../api/index';
import { useGetIssueListingType } from '../../hooks/useIssueTypeApi';
import { setIssueData } from '../../slices/supportSlice';

// ✅ Mock API Response
const mockIssueData = {
    issueTypes: [
        { label: 'Bug Report', value: 'bug' },
        { label: 'Feature Request', value: 'feature' },
    ],
};

vi.mock('react-redux', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useDispatch: vi.fn(() => vi.fn()), // ✅ Fix: Properly mocking useDispatch
    };
});

// ✅ Mock API Call
vi.mock('../../api/index', () => ({
    issueTypeListing: vi.fn(),
}));

// ✅ Mock Redux Action
vi.mock('../../slices/supportSlice', () => ({
    setIssueData: vi.fn(),
}));

describe('useGetIssueListingType Hook', () => {
    let dispatchMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        (useDispatch as any).mockReturnValue(dispatchMock);
    });

    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useGetIssueListingType());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.issueTypes).toEqual([]);
    });

    it('should fetch issue types and update state correctly', async () => {
        (issueTypeListing as any).mockResolvedValue(mockIssueData);

        const { result } = renderHook(() => useGetIssueListingType());

        await act(async () => {
            await result.current.issueTypes;
        });

        expect(issueTypeListing).toHaveBeenCalled();
        expect(result.current.issueTypes).toEqual(mockIssueData.issueTypes);
        expect(result.current.isLoading).toBe(false);
        expect(dispatchMock).toHaveBeenCalledWith(setIssueData(mockIssueData.issueTypes));
    });

    it('should not call API again if data is already available', async () => {
        (issueTypeListing as any).mockResolvedValue(mockIssueData);

        const { result, rerender } = renderHook(() => useGetIssueListingType());

        await act(async () => {
            await result.current.issueTypes;
        });

        expect(issueTypeListing).toHaveBeenCalledTimes(1);

        rerender();

        expect(issueTypeListing).toHaveBeenCalledTimes(1);
    });
});
