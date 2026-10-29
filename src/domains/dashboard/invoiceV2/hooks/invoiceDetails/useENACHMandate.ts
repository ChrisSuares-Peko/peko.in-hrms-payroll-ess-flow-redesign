import { useState } from 'react';

import { message } from 'antd';

import { ENACHMandateFormValues } from '../../types/invoiceDetails';

const useENACHMandate = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // 1. Proceed to Customer Authorisation
    const proceedToAuthorisation = async (values: ENACHMandateFormValues): Promise<string> => {
        setIsSubmitting(true);
        try {
            // TODO: replace with real API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            return `https://peko.in/authorize/mandate/M${Date.now()}`;
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. Resend Authorization Link
    const resendAuthLink = async (): Promise<void> => {
        setIsResending(true);
        try {
            // TODO: replace with real API call
            await new Promise(resolve => setTimeout(resolve, 800));
            message.success('Authorization link resent');
        } finally {
            setIsResending(false);
        }
    };

    // 3. Cancel Mandate Setup
    const cancelMandateSetup = async (): Promise<void> => {
        setIsCancelling(true);
        try {
            // TODO: replace with real API call
            await new Promise(resolve => setTimeout(resolve, 500));
        } finally {
            setIsCancelling(false);
        }
    };

    return {
        isSubmitting,
        isResending,
        isCancelling,
        proceedToAuthorisation,
        resendAuthLink,
        cancelMandateSetup,
    };
};

export default useENACHMandate;
