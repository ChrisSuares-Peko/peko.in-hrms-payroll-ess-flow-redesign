import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const SendPaymentLinkForm: React.FC = () => (
    <Form layout="vertical">
        <TextInput
            name="amount"
            label="Amount"
            placeholder="Enter amount"
            type="text"
            allowDecimalsOnly
            isRequired
            isDisabled
        />

        <TextInput
            name="customerName"
            label="Customer Name (Optional)"
            placeholder="Enter Customer Name (Optional)"
            type="text"
        />

        <TextInput
            name="customerPhone"
            label="Customer Phone (Optional)"
            placeholder="Enter Customer Phone (Optional)"
            type="text"
            allowNumbersOnly
        />
    </Form>
);

export default React.memo(SendPaymentLinkForm);
