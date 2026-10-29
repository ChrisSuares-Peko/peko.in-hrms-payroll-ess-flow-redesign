import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { postPaymentRequest } from '../../api/index'; // Adjust the import path as necessary
import usePaymentRequest from '../../hooks/usePostPaymentApi'; // Adjust the import path as necessary
import { PaymentRequestResponse } from '../../types/types';

// Mock navigate function
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    postPaymentRequest: vi.fn(),
}));

describe('usePaymentRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock implementation for useAppSelector
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    auth: { role: 'user', id: '123' },
                },
            })
        );
    });

    test('should navigate to success path on successful payment request', async () => {
        const mockResponse: PaymentRequestResponse = {
            status: true,
            message: 'Payment request successful',
            data: {}, // Populate with actual data if needed
            responseCode: '200',
        };
        (postPaymentRequest as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => usePaymentRequest());

        // Call the hook function
        await act(async () => {
            await result.current.handlePaymentRequest({
                formDetails: {
                    companyName: '',
                    domainName: '',
                    adminEmail: '',
                    address: '',
                    country: '',
                },
            });
        });

        expect(postPaymentRequest).toHaveBeenCalledWith({
            /* expected parameters */
            userId: '123',
            userType: 'user',
            formDetails: {
                companyName: '',
                domainName: '',
                adminEmail: '',
                address: '',
                country: '',
            },
        });
        expect(mockNavigate).toHaveBeenCalledWith('/softwares/success');
    });

    test('should navigate to failed path on failed payment request', async () => {
        (postPaymentRequest as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => usePaymentRequest());

        // Call the hook function
        await act(async () => {
            await result.current.handlePaymentRequest({
                formDetails: {
                    companyName: '',
                    domainName: '',
                    adminEmail: '',
                    address: '',
                    country: '',
                },
            });
        });

        expect(postPaymentRequest).toHaveBeenCalledWith({
            /* expected parameters */
            userId: '123',
            userType: 'user',
            formDetails: {
                companyName: '',
                domainName: '',
                adminEmail: '',
                address: '',
                country: '',
            },
        });
        expect(mockNavigate).toHaveBeenCalledWith('/softwares/failed');
    });

    test('should call postPaymentRequest with correct parameters', async () => {
        // Setup mock data
        const mockResponse: PaymentRequestResponse = {
            status: false,
            message: '',
            data: {},
            responseCode: '',
        };
        (postPaymentRequest as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => usePaymentRequest());

        // Call the hook function
        await act(async () => {
            await result.current.handlePaymentRequest({
                formDetails: {
                    companyName: '',
                    domainName: '',
                    adminEmail: '',
                    address: '',
                    country: '',
                },
            });
        });

        expect(postPaymentRequest).toHaveBeenCalledWith({
            /* expected parameters */
            userId: '123',
            userType: 'user',
            formDetails: {
                companyName: '',
                domainName: '',
                adminEmail: '',
                address: '',
                country: '',
            },
        });
    });
});
