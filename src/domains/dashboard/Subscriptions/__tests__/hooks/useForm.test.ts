import { renderHook, act, cleanup } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../../payments/slices/payment';
import useForm from '../../hooks/useForm';
import useSurchargeDetails from '../../hooks/useSurchargeApi';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

vi.mock('../../../payments/slices/payment', () => ({
    setPaymentData: vi.fn(),
}));

vi.mock('../../hooks/useSurchargeApi', () => ({
    default: vi.fn(),
}));

describe('useForm hook', () => {
    const mockNavigate = vi.fn();
    const mockDispatch = vi.fn();
    const mockSetPaymentData = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mocking default values for selectors and hooks
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    subscription: {
                        subscriptionDetails: { data: { name: 'Test Name' } },
                        amount: '100',
                        planId: 'plan123',
                    },
                },
            })
        );

        // Provide mock implementation for useSurchargeDetails
        (useSurchargeDetails as Mock).mockReturnValue({
            surchargeData: {
                surcharge: '20',
                corporateCashback: '10',
            },
        });
        (formatNumberWithLocalString as Mock).mockReturnValue('20.00');
        (useNavigate as Mock).mockImplementation(() => mockNavigate);
        (useAppDispatch as Mock).mockImplementation(() => mockDispatch);
        (vi.mocked(setPaymentData) as unknown as Mock).mockImplementation(mockSetPaymentData);
    });
    afterEach(() => {
        cleanup();
    });
    test('should initialize correctly', () => {
        const { result } = renderHook(() => useForm());

        expect(result.current).toHaveProperty('handleSubmission');
    });

    test('should call dispatch with correct arguments on handleSubmission', async () => {
        const { result } = renderHook(() => useForm());

        const values = {
            companyName: 'Test Company',
            contactName: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            domainName: 'example.com',
            adminEmail: 'admin@example.com',
        };

        await act(async () => {
            await result.current.handleSubmission(values);
        });

        expect(mockSetPaymentData).toHaveBeenCalledWith({
            billSummary: [
                { key: 'Service name', value: 'Softwares' },
                { key: 'Software', value: 'Test Name' },
                { key: 'Company', value: 'Test Company' },
                { key: 'Amount', value: '20.00' },
            ],
            paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 20.00' }],
            totalAmount: 120,
            title: 'Bill Summary',
            payload: {
                planId: 'plan123',
                amount: '100',
                formDetails: values,
                accessKey: 'subscription_payments',
                currentUrl: window.location.href,
            },
            url: 'purchase/softwares/payment',
            earningCashbackAmount: 10,
        });

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });

    test('should call dispatch with correct total amount on handleSubmission', async () => {
        const { result } = renderHook(() => useForm());

        const values = {
            companyName: 'Test Company',
            contactName: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            domainName: 'example.com',
            adminEmail: 'admin@example.com',
        };

        await act(async () => {
            await result.current.handleSubmission(values);
        });

        const expectedTotal = parseFloat('100') + parseFloat('20.00');

        expect(mockSetPaymentData).toHaveBeenCalledWith(
            expect.objectContaining({
                totalAmount: expectedTotal,
            })
        );
    });

    test('should handle empty values correctly on handleSubmission', async () => {
        const { result } = renderHook(() => useForm());

        const emptyValues = {
            companyName: '',
            contactName: '',
            email: '',
            phone: '',
            domainName: '',
            adminEmail: '',
        };

        await act(async () => {
            await result.current.handleSubmission(emptyValues);
        });

        expect(mockSetPaymentData).toHaveBeenCalledWith({
            billSummary: [
                { key: 'Service name', value: 'Softwares' },
                { key: 'Software', value: 'Test Name' },
                { key: 'Company', value: '' },
                { key: 'Amount', value: '20.00' },
            ],
            paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 20.00' }],
            totalAmount: 120,
            title: 'Bill Summary',
            payload: {
                planId: 'plan123',
                amount: '100',
                formDetails: emptyValues,
                accessKey: 'subscription_payments',
                currentUrl: window.location.href,
            },
            url: 'purchase/softwares/payment',
            earningCashbackAmount: 10,
        });

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });

    test('should include correct currentUrl in payload', async () => {
        const { result } = renderHook(() => useForm());

        const values = {
            companyName: 'Test Company',
            contactName: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            domainName: 'example.com',
            adminEmail: 'admin@example.com',
        };

        await act(async () => {
            await result.current.handleSubmission(values);
        });

        expect(mockSetPaymentData).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    currentUrl: window.location.href,
                }),
            })
        );
    });
});
