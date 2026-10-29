import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getCodeIssue } from '../../api/index';
import useGetCodeIssue from '../../hooks/useCodeIssueApi';

// 🛠️ Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('../../api/index', () => ({
    getCodeIssue: vi.fn(),
}));

describe('useGetCodeIssue Hook', () => {
    const mockGiftCardID = 'gift-card-123';
    const mockResponse = { issueStatus: 'success', code: 'ABC123' };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should call getCodeIssue with correct parameters and return data on success', async () => {
        (getCodeIssue as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGetCodeIssue());

        let response;
        await act(async () => {
            response = await result.current(mockGiftCardID);
        });

        expect(getCodeIssue).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            cardID: mockGiftCardID,
        });
        expect(response).toEqual(mockResponse);
    });

    it('should return null if getCodeIssue API returns false', async () => {
        (getCodeIssue as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGetCodeIssue());

        let response;
        await act(async () => {
            response = await result.current(mockGiftCardID);
        });

        expect(getCodeIssue).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            cardID: mockGiftCardID,
        });
        expect(response).toBeNull();
    });
});
