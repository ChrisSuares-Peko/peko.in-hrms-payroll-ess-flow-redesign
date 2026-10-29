import { ApiClient } from '@src/services/config';

import { PaymentVirtualAccountBalanceData } from '../../types/virtualAccount';

export interface OneTimePaymentPayload {
    month: string;
    employeeId: string | number;
    amount: number;
    remark?: string;
    virtualAccountNumber: string;
}

export const postOneTimePayment = async (
    corporateId: string | number,
    payload: OneTimePaymentPayload
): Promise<{ status: boolean; message: string } | false> => {
    try {
        const res = await ApiClient.post(`corporate/${corporateId}/payroll/one-time-payment`, payload);
        return res as unknown as { status: boolean; message: string };
    } catch {
        return false;
    }
};

export const getPaymentVirtualAccountBalance = async ({
    userId,
    userType,
}: {
    userId: string | number;
    userType: string;
}): Promise<PaymentVirtualAccountBalanceData | false> => {
    try {
        const resp: { data: PaymentVirtualAccountBalanceData } = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/virtual-account/balance`
        );
        return resp.data;
    } catch {
        return false;
    }
};
