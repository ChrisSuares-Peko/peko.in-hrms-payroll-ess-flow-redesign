import React from 'react';

import { Typography } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const { Title } = Typography;

const BankingInformation: React.FC = () => (
    <div style={{ marginBottom: 24, paddingTop: 32 }}>
        <Title level={5} style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: 20, fontFamily: 'Roboto, sans-serif' }}>
            Banking information
        </Title>

        <div style={{ marginTop: 16 }}>
        <TextInput
            name="bankName"
            type="text"
            label="Bank Name"
            placeholder="e.g. Emirates NDB"
            allowAlphabetsAndSpaceOnly
        />
        </div>

        <TextInput
            name="accountNumber"
            type="text"
            label="Account Number"
            placeholder="Number"
            allowNumbersOnly
            maxLength={18}
        />

        <TextInput
            name="ifscCode"
            type="text"
            label="IFSC Code"
            placeholder="e.g. HDFC0001234"
            convertToUppercase
            maxLength={11}
            allowAlphabetsAndNumbersOnly
        />
    </div>
);

export default BankingInformation;
