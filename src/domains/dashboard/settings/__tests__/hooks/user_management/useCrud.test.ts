import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import { SuccessGenericResponse } from '@customtypes/general';
import {
    freezeCardholderCards,
    getCardUsers,
} from '@src/domains/dashboard/corporateCards/api/admin/cardUsersApi';
import { getKybStatus } from '@src/domains/dashboard/corporateCards/api/admin/kybStatusApi';
import { showToast } from '@src/slices/apiSlice';

import {
    chagneStatusSubCorporate,
    createSubCorporate,
    deleteSubCorporate,
    resendInvitation,
    updateSubCorporate,
    validateCreateSubCorporate,
} from '../../../api/userManagement';
import useCrud from '../../../hooks/user_management/useCrud';
import { SubCorporate } from '../../../types/userManagement';

const store = vi.hoisted(() => ({ userAccessibleServices: ['service1', 'service2'] }));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: () => ({ services: { userAccessibleServices: store.userAccessibleServices } }),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

vi.mock('../../../api/userManagement', () => ({
    chagneStatusSubCorporate: vi.fn(),
    createSubCorporate: vi.fn(),
    deleteSubCorporate: vi.fn(),
    resendInvitation: vi.fn(),
    updateSubCorporate: vi.fn(),
    validateCreateSubCorporate: vi.fn(),
}));

// deleteSubUser best-effort freezes the member's corporate cards first (only when the corporate has the
// service). Mock it so the real api (→ ApiClient/store) isn't pulled into this hook's import graph.
vi.mock('@src/domains/dashboard/corporateCards/api/admin/cardUsersApi', () => ({
    freezeCardholderCards: vi.fn(),
    getCardUsers: vi.fn(),
}));

vi.mock('@src/domains/dashboard/corporateCards/api/admin/kybStatusApi', () => ({
    getKybStatus: vi.fn(),
}));

describe('useCrud', () => {
    const handleCancel = vi.fn();
    const reloadTable = vi.fn();
    const selectedRow: SubCorporate = {
        id: 1,
        name: 'Test User',
        services: [{ label: 'service1', hasAccess: true }],
        email: '',
        mobileNo: '',
        role: '',
        corporateCredentialID: '',
        status: 'INACTIVE',
        isDeleted: 0,
        createdAt: '',
        updatedAt: '',
        credentialId: 0,
        corporateUserId: 0,
    };

    it('should validate before creating a sub-user', async () => {
        const validateResponse = {};
        vi.mocked(validateCreateSubCorporate).mockResolvedValue(validateResponse);

        const { result } = renderHook(() => useCrud({ handleCancel, reloadTable, selectedRow }));

        await act(async () => {
            await result.current.validateBeforeCreateSubUser({
                name: 'Test User',
                email: 'test@example.com',
                mobileNo: 98546958465,
                role: 'sub corporate',
                username: 'test user1',
            });
        });

        expect(result.current.isLoading).toBe(false);
        expect(validateCreateSubCorporate).toHaveBeenCalled();
        expect(result.current.isInitialSubmit).toBe(false);
    });

    it('should create a sub-user', async () => {
        const createResponse: SuccessGenericResponse<{}> = {
            status: true,
            responseCode: '200',
            message: 'User created successfully',
            data: {},
        };
        vi.mocked(createSubCorporate).mockResolvedValue(createResponse);

        const { result } = renderHook(() =>
            useCrud({ handleCancel, reloadTable, selectedRow: undefined })
        );

        await act(async () => {
            await result.current.createSubUser({
                name: 'Test User',
                email: 'test@example.com',
                services: { service1: true },
                mobileNo: 0,
                role: '',
                username: '',
            });
        });

        expect(result.current.isLoading).toBe(false);
        expect(createSubCorporate).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            variant: 'success',
            description: createResponse.message,
        });
        expect(handleCancel).toHaveBeenCalled();
        expect(reloadTable).toHaveBeenCalled();
    });

    it('should update service access for a sub-user', async () => {
        const updateResponse: SuccessGenericResponse<{}> = {
            status: true,
            responseCode: '200',
            message: 'User updated successfully',
            data: {},
        };
        vi.mocked(updateSubCorporate).mockResolvedValue(updateResponse);

        const { result } = renderHook(() => useCrud({ handleCancel, reloadTable, selectedRow }));

        await act(async () => {
            await result.current.updateServiceAccess({ service1: true }, 1);
        });

        expect(result.current.isLoading).toBe(false);
        expect(updateSubCorporate).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            variant: 'success',
            description: updateResponse.message,
        });
        expect(handleCancel).toHaveBeenCalled();
        expect(reloadTable).toHaveBeenCalled();
    });

    it('should delete a sub-user', async () => {
        const deleteResponse: SuccessGenericResponse<{}> = {
            status: true,
            responseCode: '200',
            message: 'User deleted successfully',
            data: {},
        };
        vi.mocked(deleteSubCorporate).mockResolvedValue(deleteResponse);

        const { result } = renderHook(() => useCrud({ handleCancel, reloadTable, selectedRow }));

        await act(async () => {
            await result.current.deleteSubUser(1);
        });

        expect(result.current.isLoading).toBe(false);
        expect(deleteSubCorporate).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            variant: 'success',
            description: deleteResponse.message,
        });
        expect(handleCancel).toHaveBeenCalled();
        expect(reloadTable).toHaveBeenCalled();
    });

    describe('when the corporate has Corporate Cards', () => {
        const deleteResponse: SuccessGenericResponse<{}> = {
            status: true,
            responseCode: '000',
            message: 'User deleted successfully',
            data: {},
        };

        beforeEach(() => {
            vi.clearAllMocks();
            store.userAccessibleServices = ['corporate_cards'];
            vi.mocked(deleteSubCorporate).mockResolvedValue(deleteResponse);
        });

        afterEach(() => {
            store.userAccessibleServices = ['service1', 'service2'];
        });

        // A corporate that never applied (or has closed) has no live application; the cardholders API would
        // refuse with 403, so the delete must skip the card check instead of aborting.
        it('deletes without the card check when there is no live card account', async () => {
            vi.mocked(getKybStatus).mockResolvedValue({
                status: true,
                responseCode: '000',
                message: '',
                data: { application: null },
            });

            const { result } = renderHook(() => useCrud({ handleCancel, reloadTable, selectedRow }));
            await act(async () => {
                await result.current.deleteSubUser(1);
            });

            expect(getCardUsers).not.toHaveBeenCalled();
            expect(freezeCardholderCards).not.toHaveBeenCalled();
            expect(deleteSubCorporate).toHaveBeenCalledWith(1);
        });

        it('blocks the delete when the member still holds cards on a live account', async () => {
            vi.mocked(getKybStatus).mockResolvedValue({
                status: true,
                responseCode: '000',
                message: '',
                data: { application: {} as never },
            });
            vi.mocked(getCardUsers).mockResolvedValue({
                status: true,
                responseCode: '000',
                message: '',
                data: { count: 1, rows: [{ id: 1, cardCount: 2 } as never] },
            });

            const { result } = renderHook(() => useCrud({ handleCancel, reloadTable, selectedRow }));
            await act(async () => {
                await result.current.deleteSubUser(1);
            });

            expect(deleteSubCorporate).not.toHaveBeenCalled();
            expect(result.current.unableToDelete).toBe(true);
        });
    });

    it('should block a sub-user', async () => {
        const blockResponse = {};
        vi.mocked(chagneStatusSubCorporate).mockResolvedValue(blockResponse);

        const { result } = renderHook(() => useCrud({ handleCancel, reloadTable, selectedRow }));

        await act(async () => {
            await result.current.blockSubUser(1, 'INACTIVE');
        });

        expect(result.current.isLoading).toBe(false);
        expect(chagneStatusSubCorporate).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            variant: 'success',
            description: 'User status updated successfully',
        });
        expect(handleCancel).toHaveBeenCalled();
        expect(reloadTable).toHaveBeenCalled();
    });

    it('should resend invitation to a sub-user', async () => {
        const resendResponse = {};
        vi.mocked(resendInvitation).mockResolvedValue(resendResponse);

        const { result } = renderHook(() => useCrud({ handleCancel, reloadTable, selectedRow }));

        await act(async () => {
            await result.current.resendInvite(1);
        });

        expect(result.current.isLoading).toBe(false);
        expect(resendInvitation).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            description: 'Resend successfully',
            variant: 'success',
        });
    });
});
