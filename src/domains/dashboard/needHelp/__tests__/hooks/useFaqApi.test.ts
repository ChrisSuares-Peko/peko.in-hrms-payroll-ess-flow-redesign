import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { getFaq } from '../../api/index';
import useFaqApi from '../../hooks/useGetFaq';

// Mock API response
const mockFaqData = [
    { question: 'What is your return policy?', answer: 'You can return items within 30 days.' },
    { question: 'How long is the warranty?', answer: '1-year warranty on all products.' },
];

// ✅ Mock the `getFaq` API function
vi.mock('../../api/index', () => ({
    getFaq: vi.fn(),
}));

describe('useFaqApi Hook', () => {
    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useFaqApi());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });

    it('should fetch FAQs and update state correctly', async () => {
        (getFaq as any).mockResolvedValue(mockFaqData);

        const { result } = renderHook(() => useFaqApi());

        await act(async () => {
            await result.current.getAllFaqs('general');
        });

        expect(getFaq).toHaveBeenCalledWith('general');
        expect(result.current.data).toEqual(mockFaqData);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false even if API call fails', async () => {
        (getFaq as any).mockResolvedValue(null);

        const { result } = renderHook(() => useFaqApi());

        await act(async () => {
            await result.current.getAllFaqs('general');
        });

        expect(getFaq).toHaveBeenCalledWith('general');
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});
