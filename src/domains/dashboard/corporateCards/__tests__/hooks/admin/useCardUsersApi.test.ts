import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getCardUsers } from '../../../api/admin/cardUsersApi';
import { useCardUsersApi } from '../../../hooks/admin/useCardUsersApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/cardUsersApi', () => ({
    getCardUsers: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makeUser = (overrides = {}) => ({
    id: 10,
    name: 'Alice Adams',
    email: 'alice@example.com',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    kycStatus: 'COMPLETED',
    joined: '2024-01-15T00:00:00Z',
    ...overrides,
});

describe('useCardUsersApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=true and members=[]', () => {
        (getCardUsers as Mock).mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => useCardUsersApi());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.members).toEqual([]);
    });

    it('maps users and sets isLoading=false on success', async () => {
        const user = makeUser();
        (getCardUsers as Mock).mockResolvedValue({ data: { rows: [user] } });

        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.members).toHaveLength(1);
        const m = result.current.members[0];
        expect(m.key).toBe('10');
        expect(m.name).toBe('Alice Adams');
        expect(m.email).toBe('alice@example.com');
    });

    // Role is an authorization value, and the server matches it EXACTLY ('admin' resolves to Employee).
    // Title-casing it for display would show "Admin" for a member the server treats as an Employee, and the
    // Edit modal — which prefills from this value — would then offer that as a valid selection, turning a
    // Save the admin meant as a no-op into a real promotion. So it is surfaced exactly as stored.
    it.each([['EMPLOYEE'], ['admin'], ['Accountant'], ['Admin']])(
        'surfaces role %s exactly as stored, never re-cased',
        async stored => {
            (getCardUsers as Mock).mockResolvedValue({
                data: { rows: [makeUser({ role: stored })] },
            });
            const { result } = renderHook(() => useCardUsersApi());
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.members[0].role).toBe(stored);
        }
    );

    // The column is nullable, and `u.role.charAt(0)` used to throw here — taking down the whole People list.
    it('does not crash on a member with no role', async () => {
        (getCardUsers as Mock).mockResolvedValue({
            data: { rows: [makeUser({ role: null as unknown as string })] },
        });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].role).toBe('');
    });

    it.each([
        ['ACTIVE', 'Active'],
        ['INACTIVE', 'Inactive'],
        ['PENDING', 'Pending'],
    ])('maps the account status %s → "%s"', async (status, label) => {
        (getCardUsers as Mock).mockResolvedValue({ data: { rows: [makeUser({ status })] } });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].accountStatus).toBe(label);
    });

    // The directory column is ENUM('PENDING','ACTIVE','INACTIVE') with a PENDING default, so an
    // unrecognised value must read as Pending rather than being printed raw into the table.
    it('falls back to "Pending" for an unrecognised account status', async () => {
        (getCardUsers as Mock).mockResolvedValue({
            data: { rows: [makeUser({ status: 'SOMETHING_NEW' })] },
        });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].accountStatus).toBe('Pending');
    });

    it.each([
        ['NOT_STARTED', 'Not started'],
        ['INITIATED', 'Initiated'],
        ['PENDING', 'Pending'],
        ['COMPLETED', 'Completed'],
        ['REJECTED', 'Rejected'],
    ])('maps the KYC status %s → "%s"', async (kycStatus, label) => {
        (getCardUsers as Mock).mockResolvedValue({ data: { rows: [makeUser({ kycStatus })] } });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].kycStatus).toBe(label);
    });

    // NOT_STARTED is what the backend already substitutes for a member with no KYC row at all.
    it('falls back to "Not started" for an unrecognised KYC status', async () => {
        (getCardUsers as Mock).mockResolvedValue({
            data: { rows: [makeUser({ kycStatus: 'UNKNOWN' })] },
        });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].kycStatus).toBe('Not started');
    });

    it('maps the sub-user status PENDING → inviteStatus "PENDING"', async () => {
        (getCardUsers as Mock).mockResolvedValue({
            data: { rows: [makeUser({ status: 'PENDING' })] },
        });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].inviteStatus).toBe('PENDING');
    });

    it('maps the sub-user status ACTIVE → inviteStatus "ACTIVE"', async () => {
        (getCardUsers as Mock).mockResolvedValue({
            data: { rows: [makeUser({ status: 'ACTIVE' })] },
        });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].inviteStatus).toBe('ACTIVE');
    });

    it('leaves inviteStatus undefined for an unknown sub-user status', async () => {
        (getCardUsers as Mock).mockResolvedValue({
            data: { rows: [makeUser({ status: 'WHATEVER' })] },
        });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members[0].inviteStatus).toBeUndefined();
    });

    it('fetches the full list (no page arg → itemsPerPage 100) with role and id', async () => {
        (getCardUsers as Mock).mockResolvedValue(false);
        renderHook(() => useCardUsersApi());
        await waitFor(() =>
            expect(getCardUsers).toHaveBeenCalledWith('admin', 1, {
                kycStatus: undefined,
                page: 1,
                itemsPerPage: 100,
            })
        );
    });

    it('forwards the kycStatus filter to getCardUsers', async () => {
        (getCardUsers as Mock).mockResolvedValue(false);
        renderHook(() => useCardUsersApi(0, 'COMPLETED'));
        await waitFor(() =>
            expect(getCardUsers).toHaveBeenCalledWith('admin', 1, {
                kycStatus: 'COMPLETED',
                page: 1,
                itemsPerPage: 100,
            })
        );
    });

    it('requests a 10-row page and exposes total when a page is passed', async () => {
        (getCardUsers as Mock).mockResolvedValue({ data: { rows: [makeUser()], count: 42 } });
        const { result } = renderHook(() => useCardUsersApi(0, undefined, 2));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getCardUsers).toHaveBeenCalledWith('admin', 1, {
            kycStatus: undefined,
            page: 2,
            itemsPerPage: 10,
        });
        expect(result.current.total).toBe(42);
        expect(result.current.pageSize).toBe(10);
    });

    it('leaves members=[] when API returns false', async () => {
        (getCardUsers as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members).toEqual([]);
    });

    it('leaves members=[] when rows array is empty', async () => {
        (getCardUsers as Mock).mockResolvedValue({ data: { rows: [] } });
        const { result } = renderHook(() => useCardUsersApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.members).toEqual([]);
    });

    it('re-fetches when refreshKey changes', async () => {
        (getCardUsers as Mock).mockResolvedValue(false);
        const { rerender } = renderHook(({ key }) => useCardUsersApi(key), {
            initialProps: { key: 0 },
        });
        await waitFor(() => expect(getCardUsers).toHaveBeenCalledTimes(1));

        rerender({ key: 1 });
        await waitFor(() => expect(getCardUsers).toHaveBeenCalledTimes(2));
    });
});
