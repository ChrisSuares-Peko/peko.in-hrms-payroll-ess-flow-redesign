import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { createOwnerCardholderProfile } from '../../../api/user/switchRoleApi';
import { useEnsureOwnerCardholder } from '../../../hooks/admin/useEnsureOwnerCardholder';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/switchRoleApi', () => ({
    createOwnerCardholderProfile: vi.fn(),
}));

/** Only the Corporate account owns the programme; an employee reaches cards as role 'user'. */
const asAuth = (auth: Record<string, unknown>) =>
    (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn({ reducer: { auth } }));

describe('useEnsureOwnerCardholder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (createOwnerCardholderProfile as Mock).mockResolvedValue({ data: { created: false } });
    });

    it('provisions the row for the account owner', async () => {
        asAuth({ role: 'corporate' });

        renderHook(() => useEnsureOwnerCardholder());

        await waitFor(() => expect(createOwnerCardholderProfile).toHaveBeenCalledTimes(1));
    });

    // The endpoint is owner-only and answers 007, so an employee Admin — who also loads the People screen —
    // must not ask at all and be shown a refusal they cannot act on.
    it('does not ask for an employee admin, who also opens the People screen', async () => {
        asAuth({ role: 'user', employeeProfileId: '77', roleName: 'employee' });

        const { result } = renderHook(() => useEnsureOwnerCardholder());

        expect(createOwnerCardholderProfile).not.toHaveBeenCalled();
        // Nothing to provision, so the table must not be held behind a spinner either.
        expect(result.current.isProvisioning).toBe(false);
    });

    it('does not ask for a system user', async () => {
        asAuth({ role: 'system_user' });

        renderHook(() => useEnsureOwnerCardholder());

        expect(createOwnerCardholderProfile).not.toHaveBeenCalled();
    });

    it('asks once per mount, even though `created` re-renders the caller', async () => {
        asAuth({ role: 'corporate' });
        (createOwnerCardholderProfile as Mock).mockResolvedValue({ data: { created: true } });

        const { result, rerender } = renderHook(() => useEnsureOwnerCardholder());
        await waitFor(() => expect(result.current.created).toBe(true));
        rerender();

        expect(createOwnerCardholderProfile).toHaveBeenCalledTimes(1);
    });

    it('reports only a genuinely new row as created, so an existing one triggers no refetch', async () => {
        asAuth({ role: 'corporate' });
        (createOwnerCardholderProfile as Mock).mockResolvedValue({ data: { created: false } });

        const { result } = renderHook(() => useEnsureOwnerCardholder());

        await waitFor(() => expect(result.current.isProvisioning).toBe(false));
        expect(result.current.created).toBe(false);
    });

    // A refusal already surfaced its reason through the API client; the screen must still render.
    it('stops provisioning even when the call fails', async () => {
        asAuth({ role: 'corporate' });
        (createOwnerCardholderProfile as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useEnsureOwnerCardholder());

        await waitFor(() => expect(result.current.isProvisioning).toBe(false));
        expect(result.current.created).toBe(false);
    });
});
