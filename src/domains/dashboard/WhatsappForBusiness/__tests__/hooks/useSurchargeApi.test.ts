import { renderHook, act } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';

import GetSurcharge from '../../hooks/useSurchargeApi';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('GetSurcharge Hook', () => {
    const mockUser = {
        role: 'admin',
        id: 'user-123',
    };

    beforeEach(() => {
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({ reducer: { auth: mockUser } })
        );
        vi.clearAllMocks();
    });

    it('should return getSurchargeData function', () => {
        const { result } = renderHook(() => GetSurcharge());
        expect(result.current.getSurchargeData).toBeInstanceOf(Function);
    });

    it('should call getSurcharge API with correct parameters', async () => {
        (getSurcharge as Mock).mockResolvedValue({ surcharge: '10', corporateCashback: '5' });

        const { result } = renderHook(() => GetSurcharge());

        await act(async () => {
            await result.current.getSurchargeData('100');
        });

        expect(getSurcharge).toHaveBeenCalledWith({
            userId: 'user-123',
            userType: 'admin',
            amount: 100,
            accessKey: accessKeys.whatsappBasic,
        });
    });

    it('should update state when API call is successful', async () => {
        const mockResponse = { surcharge: '10', corporateCashback: '5' };
        (getSurcharge as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => GetSurcharge());

        let response;
        await act(async () => {
            response = await result.current.getSurchargeData('100');
        });

        expect(response).toEqual(mockResponse);
    });

    it('should return null if API call fails', async () => {
        (getSurcharge as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetSurcharge());

        let response;
        await act(async () => {
            response = await result.current.getSurchargeData('100');
        });

        expect(response).toBeNull();
    });
});
