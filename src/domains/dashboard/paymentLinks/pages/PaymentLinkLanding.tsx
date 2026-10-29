import { useEffect } from 'react';

import { Flex, Spin } from 'antd';

import PaymentLink from './PaymentLink';
import PaymentLinkOnboarding from './PaymentLinkOnboarding';
import { usePaymentLinkOnboarding } from '../hooks/usePaymentLinkOnboarding';

const PaymentLinkLanding = () => {
    const {  record, fetchStatus,statusLoading } = usePaymentLinkOnboarding();

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    if (statusLoading) {
        return (
            <Flex justify="center" align="center" className="h-[70vh]">
                <Spin size="large" />
            </Flex>
        );
    }

    // Only a NuPay-onboarded merchant sees the payment links home; legacy Decentro records
    // (vendor !== 'nupay') fall through to NuPay onboarding, else collect has no credentials.
    if (record?.status === 'active' && record?.vendor === 'nupay') {
        return <PaymentLink />;
    }

    return <PaymentLinkOnboarding onboardingRecord={record} refresh={()=>fetchStatus()} />;
};

export default PaymentLinkLanding;
