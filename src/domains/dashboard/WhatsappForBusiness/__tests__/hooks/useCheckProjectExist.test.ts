import { renderHook, act } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { userPayload } from '../../../plans/types';
import { checkProjectExist } from '../../api/index';
import useCheckProjectExist from '../../hooks/useCheckProjectExist';

vi.mock('../../api/index', () => ({
    checkProjectExist: vi.fn(),
}));

describe('useCheckProjectExist Hook', () => {
    const mockPayload: userPayload = {
        userId: 123,
        userType: 'admin',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return false when checkProjectExist API returns a truthy value', async () => {
        (checkProjectExist as Mock).mockResolvedValue({ status: 'exists' });

        const { result } = renderHook(() => useCheckProjectExist());

        let response;
        await act(async () => {
            response = await result.current.checkProject(mockPayload);
        });

        expect(checkProjectExist).toHaveBeenCalledWith(mockPayload);
        expect(response).toBe(false);
    });

    it('should return true when checkProjectExist API returns a falsy value', async () => {
        (checkProjectExist as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useCheckProjectExist());

        let response;
        await act(async () => {
            response = await result.current.checkProject(mockPayload);
        });

        expect(checkProjectExist).toHaveBeenCalledWith(mockPayload);
        expect(response).toBe(true);
    });

    it('should call checkProjectExist API with correct payload', async () => {
        (checkProjectExist as Mock).mockResolvedValue({});

        const { result } = renderHook(() => useCheckProjectExist());

        await act(async () => {
            await result.current.checkProject(mockPayload);
        });

        expect(checkProjectExist).toHaveBeenCalledWith(mockPayload);
    });
});
