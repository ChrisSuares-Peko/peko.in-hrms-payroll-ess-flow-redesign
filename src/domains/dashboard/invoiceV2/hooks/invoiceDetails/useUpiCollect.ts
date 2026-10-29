import { message } from 'antd';
import dayjs from 'dayjs';

import {
    SendUPICollectFormValues,
    UPICollectPendingData,
    UPICollectSuccessData,
} from '../../types/invoiceDetails';

const useUpiCollect = () => {
    // 1. Send UPI Request
    const sendUpiRequest = async (values: SendUPICollectFormValues): Promise<UPICollectPendingData> => {
        // TODO: replace with real API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            amount: values.amount,
            upiId: values.upiId,
            expiryMinutes: Number(values.requestExpiry),
        };
    };

    // 2. Cancel Request
    const cancelRequest = async (): Promise<void> => {
        // TODO: replace with real API call
        await new Promise(resolve => setTimeout(resolve, 500));
    };

    // 3. Send Reminder
    const sendReminder = async (): Promise<void> => {
        // TODO: replace with real API call
        await new Promise(resolve => setTimeout(resolve, 800));
        message.success('Reminder sent to customer');
    };

    // 4. Retry Payment
    const retryPayment = async (): Promise<void> => {
        // TODO: replace with real API call
        await new Promise(resolve => setTimeout(resolve, 500));
    };

    // Dummy: simulate payment approval
    const pollPaymentStatus = async (amount: string): Promise<UPICollectSuccessData> => {
        // TODO: replace with real polling/webhook
        await new Promise(resolve => setTimeout(resolve, 8000));
        return {
            amount,
            referenceId: `TXN${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            dateTime: dayjs().format('MMM D, YYYY [at] h:mm A'),
        };
    };

    return { sendUpiRequest, cancelRequest, sendReminder, retryPayment, pollPaymentStatus };
};

export default useUpiCollect;
