import { renderHook, waitFor } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAccountingServiceCommissionModes } from '../api/services';
import useCommissionModes from '../hooks/useCommissionModes';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: () => ({ role: 'systemUser', id: 9 }),
}));

vi.mock('../api/services', () => ({ getAccountingServiceCommissionModes: vi.fn() }));

const ALL = ['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useCommissionModes', () => {
    it('is loading until the supported modes arrive, then lists them as options', async () => {
        (getAccountingServiceCommissionModes as Mock).mockResolvedValue({
            accessKey: 'whatsApp_for_busines',
            commissionModes: ALL,
        });

        const { result } = renderHook(() => useCommissionModes('whatsApp_for_busines'));

        expect(result.current.isLoading).toBe(true);
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getAccountingServiceCommissionModes).toHaveBeenCalledWith({
            userId: 9,
            userType: 'systemUser',
            accessKey: 'whatsApp_for_busines',
        });
        expect(result.current.options.map(option => option.value)).toEqual(ALL);
        expect(result.current.options.map(option => option.label)).toEqual([
            'Margin',
            'Agent Markup',
            'Principal Markup',
        ]);
    });

    it('offers only Margin for a service that does not support markup', async () => {
        (getAccountingServiceCommissionModes as Mock).mockResolvedValue({
            accessKey: 'bus_tickets',
            commissionModes: ['MARGIN'],
        });

        const { result } = renderHook(() => useCommissionModes('bus_tickets'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.options.map(option => option.value)).toEqual(['MARGIN']);
    });

    it('falls back to Margin only when the modes cannot be loaded', async () => {
        (getAccountingServiceCommissionModes as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useCommissionModes('esim_tunz'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.options.map(option => option.value)).toEqual(['MARGIN']);
    });

    it('asks again for another service, and does not call the api without an access key', async () => {
        (getAccountingServiceCommissionModes as Mock).mockResolvedValue({
            accessKey: 'x',
            commissionModes: ALL,
        });

        const { result, rerender } = renderHook(({ key }) => useCommissionModes(key), {
            initialProps: { key: 'esim_tunz' as string | undefined },
        });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        rerender({ key: 'workspace' });
        expect(result.current.isLoading).toBe(true);
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getAccountingServiceCommissionModes).toHaveBeenCalledTimes(2);

        rerender({ key: undefined });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getAccountingServiceCommissionModes).toHaveBeenCalledTimes(2);
        expect(result.current.options.map(option => option.value)).toEqual(['MARGIN']);
    });
});
