import React from 'react';

import { Form, Typography } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { EXPIRY_OPTIONS } from '../../constants/invoiceDetails';

const SendUPICollectForm: React.FC = () => (
    <Form layout="vertical">
        <TextInput
            name="amount"
            label="Amount"
            placeholder="Enter amount"
            type="text"
            allowDecimalsOnly
            isRequired
        />
        <TextInput
            name="upiId"
            label="Customer UPI ID"
            placeholder="Customer UPI ID"
            type="text"
            isRequired
        />
        <Typography.Text className="text-xs text-[#52525b] -mt-5 pb-3 block">
            Enter the customer&apos;s UPI ID (e.g., username@paytm, 9876543210@ybl)
        </Typography.Text>
        <SelectInput
            name="requestExpiry"
            label="Request Expiry"
            placeholder="Select Request Expiry"
            options={EXPIRY_OPTIONS}
            isRequired
        />
        <Typography.Text className="text-xs text-[#52525b] -mt-5 block">
            The payment request will expire if not approved within this time
        </Typography.Text>
    </Form>
);

export default React.memo(SendUPICollectForm);
