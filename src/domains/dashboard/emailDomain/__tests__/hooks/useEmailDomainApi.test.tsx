import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store'; // Mock this if needed

import { getEmailDomains } from '../../api';
import useEmailDomainApi from '../../hooks/useEmailDomainApi';

vi.mock('../../api');
vi.mock('@src/hooks/store');

const mockGetEmailDomains = getEmailDomains as Mock;
const mockUseAppSelector = useAppSelector as Mock;

describe('useEmailDomainApi', () => {
    beforeEach(() => {
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should set loading to true initially and fetch Business Emailss', async () => {
        const mockResponse = {
            data: [
                {
                    id: '1',
                    name: 'Test Domain',
                    offersText: '',
                    status: '',
                    createdAt: '',
                    updatedAt: '',
                    image: '',
                },
            ],
            recordsTotal: 1,
        };
        mockGetEmailDomains.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useEmailDomainApi('test', 1, 10));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.data).toEqual([
                {
                    id: '1',
                    name: 'Test Domain',
                    offersText: '',
                    status: '',
                    createdAt: '',
                    updatedAt: '',
                    image: '',
                },
            ]);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.count).toBe(1);
        });
    });

    it('should handle API failure gracefully', async () => {
        mockGetEmailDomains.mockResolvedValue(false);

        const { result } = renderHook(() => useEmailDomainApi('test', 1, 10));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.data).toEqual([]);
            expect(result.current.count).toBeUndefined();
        });
    });
});
