import React from 'react';

import { Flex, Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const BankVerificationForm: React.FC = React.memo(() => (
    <Form layout="vertical">
        <Flex gap={16}>
            <TextInput
                name="accountNumber"
                label="Account Number"
                placeholder="Enter account number"
                type="text"
                isRequired
                allowNumbersOnly
                maxLength={18}
                formItemClass="flex-1"
            />
            <TextInput
                name="ifsc"
                label="IFSC Code"
                placeholder="Enter IFSC code"
                type="text"
                isRequired
                convertToUppercase
                maxLength={11}
                formItemClass="flex-1"
            />
        </Flex>
        <TextInput
            name="name"
            label="Account Holder Name"
            placeholder="e.g. Acme Trading Pvt Ltd"
            type="text"
            isRequired
            maxLength={100}
        />
        <TextInput
            name="phone"
            label="Phone Number"
            placeholder="e.g. 9876543210"
            type="text"
            isRequired
            allowNumbersOnly
            maxLength={10}
            isDisabled
        />
    </Form>
));

export default BankVerificationForm;
