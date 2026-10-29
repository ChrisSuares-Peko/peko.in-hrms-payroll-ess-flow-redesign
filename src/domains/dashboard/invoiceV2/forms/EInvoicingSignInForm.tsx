import React from 'react';

import { Flex } from 'antd';

import PasswordInput from '@components/atomic/inputs/PasswordInput';
import TextInput from '@components/atomic/inputs/TextInput';

const EInvoicingSignInForm: React.FC = () => (
    <Flex vertical>
        <TextInput
            name="gstin"
            label="GSTIN"
            placeholder="Enter GSTIN"
            type="text"
            convertToUppercase
            maxLength={15}
            allowedCharacters="A-Z0-9"
        />
        <TextInput
            name="clientId"
            label="Client ID"
            placeholder="Enter Client ID"
            type="text"
            allowAlphabetsAndNumbersOnly
        />
        <PasswordInput
            name="password"
            label="Password"
            placeholder="Enter Password"
            type="password"
        />
    </Flex>
);

export default EInvoicingSignInForm;
