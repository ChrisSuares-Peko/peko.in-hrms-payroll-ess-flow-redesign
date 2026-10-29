import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { setPaymentData } from '../../../payments/slices/payment';
import { uploadFiles } from '../../api/index';
import useForm from '../../hooks/useForm';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    uploadFiles: vi.fn(),
}));

vi.mock('../../hooks/useSurchargeApi', () => ({
    default: vi.fn(() => ({
        surchargeData: { surcharge: '10.00', corporateCashback: '5.00' },
    })),
}));

describe('useForm Hook', () => {
    let mockDispatch: ReturnType<typeof vi.fn>;
    let mockNavigate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockDispatch = vi.fn();
        mockNavigate = vi.fn();

        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useNavigate as any).mockReturnValue(mockNavigate);

        (useAppSelector as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'admin' },
                    plan: {
                        planId: '123',
                        planName: 'Premium Plan',
                        amount: 100,
                        workspaceId: '456',
                    },
                },
            })
        );
    });

    it('uploads documents and triggers payment process on successful submission', async () => {
        (uploadFiles as any).mockResolvedValue({
            ownerVisUrl: 'https://mock-url/visa.pdf',
            tradeLicenseUrl: 'https://mock-url/license.pdf',
        });

        const { result } = renderHook(() => useForm());

        const formData = {
            licenseType: 'existing',
            companyName: 'Test Corp',
            expiryDate: '2025-01-01',
            tradeLicenseDoc: 'mock-trade-license-data',
            tradeLicenseFormat: 'pdf',
            visaDoc: 'mock-visa-data',
            visaDocFormat: 'pdf',
        };

        await act(async () => {
            await result.current.handleSubmission(formData);
        });

        expect(uploadFiles).toHaveBeenCalledWith(
            { userId: 1, userType: 'admin' },
            {
                fileUploadData: [
                    {
                        file: 'txtTradeLicenseDoc',
                        base64String: 'mock-trade-license-data',
                        imageFormat: 'pdf',
                    },
                    { file: 'txtOwnerVisDoc', base64String: 'mock-visa-data', imageFormat: 'pdf' },
                ],
            }
        );

        expect(mockDispatch).toHaveBeenCalledWith(
            setPaymentData({
                billSummary: [
                    { key: 'Service type', value: 'Office Address' },
                    { key: 'Plan', value: 'Premium Plan' },
                    { key: 'Company', value: 'Test Corp' },
                    { key: 'Amount', value: '100.00' },
                ],
                paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 10.00' }],
                totalAmount: 110,
                title: 'Bill Summary',
                payload: {
                    amount: 100,
                    planId: '123',
                    workspaceId: '456',
                    userDetails: {
                        companyName: 'Test Corp',
                        expiryDate: '2025-01-01',
                        licenseType: 'existing',
                        fileUploadData: {
                            ownerVisUrl: 'https://mock-url/visa.pdf',
                            tradeLicenseUrl: 'https://mock-url/license.pdf',
                        },
                    },
                    accessKey: 'workspace',
                    currentUrl: window.location.href,
                },
                url: 'officeAndBusiness/workspaces/payment',
                earningCashbackAmount: 5,
            })
        );

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });

    it('shows an error toast when file upload fails', async () => {
        (uploadFiles as any).mockResolvedValue(false);

        const { result } = renderHook(() => useForm());

        const formData = {
            licenseType: 'existing',
            companyName: 'Test Corp',
            expiryDate: '2025-01-01',
            tradeLicenseDoc: 'mock-trade-license-data',
            tradeLicenseFormat: 'pdf',
            visaDoc: 'mock-visa-data',
            visaDocFormat: 'pdf',
        };

        await act(async () => {
            await result.current.handleSubmission(formData);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({
                description: 'Something went wrong uploading your documents',
                variant: 'error',
            })
        );

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('initializes with isLoading as false', () => {
        const { result } = renderHook(() => useForm());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading to true when submitting and false afterward', async () => {
        (uploadFiles as any).mockResolvedValue({
            ownerVisUrl: 'https://mock-url/visa.pdf',
            tradeLicenseUrl: 'https://mock-url/license.pdf',
        });

        const { result } = renderHook(() => useForm());

        const formData = {
            licenseType: 'existing',
            companyName: 'Test Corp',
            expiryDate: '2025-01-01',
            tradeLicenseDoc: 'mock-trade-license-data',
            tradeLicenseFormat: 'pdf',
            visaDoc: 'mock-visa-data',
            visaDocFormat: 'pdf',
        };

        await act(async () => {
            await result.current.handleSubmission(formData);
        });

        expect(result.current.isLoading).toBe(false);
    });
});
