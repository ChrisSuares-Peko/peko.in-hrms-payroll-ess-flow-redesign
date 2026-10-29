import { useEffect } from 'react';

import { Skeleton } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';

import usePaymentGateways from '../../hooks/paymentMethods/usePaymentGateways';

// Only a PAYMENT_GATEWAY row carries a provider; wallet rows never show this field.
const GatewayProviderSelect = () => {
    const { values, setFieldValue } = useFormikContext<{
        paymentMethod?: string;
        pgProvider?: string;
    }>();
    const { gateways, loading } = usePaymentGateways();
    const isGateway = values.paymentMethod === 'PAYMENT_GATEWAY';

    useEffect(() => {
        if (!isGateway && values.pgProvider) setFieldValue('pgProvider', '');
    }, [isGateway, values.pgProvider, setFieldValue]);

    if (!isGateway) return null;
    if (loading) return <Skeleton.Input active block />;

    return (
        <SelectInput
            name="pgProvider"
            isRequired
            options={gateways}
            placeholder="Please select a payment gateway"
            label="Payment Gateway"
        />
    );
};

export default GatewayProviderSelect;
