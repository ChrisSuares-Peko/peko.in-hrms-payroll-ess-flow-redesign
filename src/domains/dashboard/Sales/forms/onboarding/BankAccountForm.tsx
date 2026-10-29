import React from 'react';

import { Flex, Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const BankAccountForm: React.FC = React.memo(() => (
    <Form layout="vertical">
        <Flex gap={16}>
            <TextInput
                name="bankName"
                label="Bank Name"
                placeholder="Enter bank name"
                type="text"
                isRequired
                allowAlphabetsAndSpaceOnly
                maxLength={100}
                formItemClass="flex-1"
            />
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
        </Flex>
        <TextInput
            name="ifsc"
            label="IFSC Code"
            placeholder="Enter IFSC code"
            type="text"
            isRequired
            convertToUppercase
            maxLength={11}
        />
    </Form>
));

export default BankAccountForm;
