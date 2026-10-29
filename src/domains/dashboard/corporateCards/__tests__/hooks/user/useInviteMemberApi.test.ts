import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createCardMember, validateCardMember } from '../../../api/user/cardMembersApi';
import { useInviteMemberApi } from '../../../hooks/user/useInviteMemberApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((opts: any) => ({ type: 'SHOW_TOAST', payload: opts })),
}));

vi.mock('../../../api/user/cardMembersApi', () => ({
    validateCardMember: vi.fn(),
    createCardMember: vi.fn(),
}));

const mockDispatch = vi.fn();

const makeDetails = (overrides = {}) => ({
    firstName: 'Alice',
    lastName: 'Adams',
    mobileNo: '9876543210',
    email: 'alice@peko.one',
    department: 'Sales',
    role: 'Employee',
    ...overrides,
});

describe('useInviteMemberApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useInviteMemberApi());
        expect(result.current.isLoading).toBe(false);
    });

    describe('submitInvite', () => {
        it('sets isLoading=true during the request and false after', async () => {
            let resolve!: (v: any) => void;
            (validateCardMember as Mock).mockImplementation(
                () =>
                    new Promise(r => {
                        resolve = r;
                    })
            );

            const { result } = renderHook(() => useInviteMemberApi());
            act(() => {
                result.current.submitInvite(makeDetails());
            });
            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                resolve(false);
            });
            expect(result.current.isLoading).toBe(false);
        });

        it('validates with the combined name, email, mobileNo and role', async () => {
            (validateCardMember as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useInviteMemberApi());
            const details = makeDetails({
                firstName: 'Bob',
                lastName: 'Baker',
                email: 'bob@peko.one',
                mobileNo: '1234567890',
                role: 'Admin',
            });

            await act(async () => {
                await result.current.submitInvite(details);
            });

            expect(validateCardMember).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Bob Baker',
                    email: 'bob@peko.one',
                    mobileNo: '1234567890',
                    role: 'Admin',
                })
            );
        });

        it('does not create and returns false when validation fails', async () => {
            (validateCardMember as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useInviteMemberApi());

            let returned: any;
            await act(async () => {
                returned = await result.current.submitInvite(makeDetails());
            });

            expect(returned).toBe(false);
            expect(createCardMember).not.toHaveBeenCalled();
            expect(showToast).not.toHaveBeenCalled();
        });

        it('creates the member after validation passes', async () => {
            (validateCardMember as Mock).mockResolvedValue({ data: {} });
            (createCardMember as Mock).mockResolvedValue({ data: {} });
            const { result } = renderHook(() => useInviteMemberApi());

            await act(async () => {
                await result.current.submitInvite(makeDetails());
            });

            expect(createCardMember).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Alice Adams',
                    email: 'alice@peko.one',
                    role: 'Employee',
                })
            );
        });

        // The service grant is the server's to decide: it clamps Corporate Cards against the partner tree,
        // so a client-supplied list could only ever be ignored or, worse, trusted.
        it('does not send a service grant from the client', async () => {
            (validateCardMember as Mock).mockResolvedValue({ data: {} });
            (createCardMember as Mock).mockResolvedValue({ data: {} });
            const { result } = renderHook(() => useInviteMemberApi());

            await act(async () => {
                await result.current.submitInvite(makeDetails());
            });

            expect((createCardMember as Mock).mock.calls[0][0]).not.toHaveProperty('services');
        });

        it('dispatches a success toast and returns true when the member is created', async () => {
            (validateCardMember as Mock).mockResolvedValue({ data: {} });
            (createCardMember as Mock).mockResolvedValue({ data: {} });
            const { result } = renderHook(() => useInviteMemberApi());

            let returned: any;
            await act(async () => {
                returned = await result.current.submitInvite(makeDetails());
            });

            expect(returned).toBe(true);
            expect(showToast).toHaveBeenCalledWith({
                variant: 'success',
                description: 'Invitation sent successfully.',
            });
        });

        it('does not toast and returns false when creation fails', async () => {
            (validateCardMember as Mock).mockResolvedValue({ data: {} });
            (createCardMember as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useInviteMemberApi());

            let returned: any;
            await act(async () => {
                returned = await result.current.submitInvite(makeDetails());
            });

            expect(returned).toBe(false);
            expect(showToast).not.toHaveBeenCalled();
        });
    });
});
