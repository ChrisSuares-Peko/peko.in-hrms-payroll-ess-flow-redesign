import { act, renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { setPaymentData } from '@src/slices/payment';

import { fetchBill, JRIVendorBalance } from '../../api';
import usePayment from '../../hooks/usePayment';


vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));


vi.mock('../../api', () => ({
    JRIVendorBalance: vi.fn(),
    fetchBill: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('usePayment', () => {
    const mockDispatch = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useAppSelector as any).mockReturnValue({ role: 'user', id: '123' });
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should handle prepaid payment', async () => {
        const { result } = renderHook(() => usePayment());

        const mockSurchargeResponse = { surcharge: 10, corporateCashback: 5 };
        const mockVendorBalanceResponse = true;

       
        (JRIVendorBalance as Mock).mockResolvedValue(mockVendorBalanceResponse);
        (getSurcharge as Mock).mockResolvedValue(mockSurchargeResponse);

        const values = {
            amount: 100,
            mobileNumber: '9876543210',
            serviceProvider: 'TestProvider',
            circle: 'TestCircle',
        };

        await act(async () => {
            await result.current.handlePrepaidPay(values);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: setPaymentData.type,
                payload: expect.objectContaining({
                    totalAmount: 110,
                    title: 'Recharge Summary',
                }),
            })
        );

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });
it('should handle postpaid payment', async () => {
  const { result } = renderHook(() => usePayment());

  const mockBillResponse = {
    data: {
      bill: {
        amount: 200,
        customerName: 'John Doe',
        dueDate: '2023-10-31',
      },
      refId: 'ref123',
      billerRefId: 'biller123',
      exactness: 'exact',
    },
  };

  const mockSurchargeResponse = { surcharge: 20, corporateCashback: 10 };

  (fetchBill as Mock).mockResolvedValue(mockBillResponse);
  (getSurcharge as Mock).mockResolvedValue(mockSurchargeResponse);

  await act(async () => {
    await result.current.handlePostpaidPay({
      serviceProvider: 'TestProvider',
      mobile: '9876543210',
    });
  });

  const secondDispatchCall = mockDispatch.mock.calls[1][0];

  expect(secondDispatchCall.type).toBe(setPaymentData.type);

  expect(secondDispatchCall.payload.title).toBe('Recharge Summary');
  expect(secondDispatchCall.payload.earningCashbackAmount).toBe(10);

  expect(secondDispatchCall.payload.billSummary).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ key: 'Service name' }),
      expect.objectContaining({ key: 'Customer name' }),
      expect.objectContaining({ key: 'Due date' }),
      expect.objectContaining({ key: 'Amount' }),
    ])
  );
  expect(secondDispatchCall.payload.paymentSummary).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: 'Platform fee (inclusive of GST)',
      }),
    ])
  );

  expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
});

    it('should handle beneficiary payment', async () => {
        const { result } = renderHook(() => usePayment());

        const beneficiary = {
            id: 1,
            accessKey: 'prepaid',
            name: 'John Doe',
            phoneNo: '9876543210',
            serviceProvider: 'TestProvider',
            billerId: null,
            providerCircle: 'TestCircle',
            isActive: true,
            customerParams: [{ name: 'mobile', value: '9876543210' }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            credentialId: 123,
            serviceOperator: {
                serviceProvider: 'TestProvider',
                serviceImage: 'http://example.com/image.png',
            },
        };

        await act(async () => {
            await result.current.handleBeneficiaryPay(beneficiary, '/benficiary');
        });

        expect(mockNavigate).toHaveBeenCalledWith(`${paths.dashboard.payments}`);
    });
});
