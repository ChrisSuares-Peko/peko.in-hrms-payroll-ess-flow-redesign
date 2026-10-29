import React from 'react';

import { Col, Form, Row } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Savings', value: 'Savings' },
    { label: 'Current', value: 'Current' },
];

const AddDomesticBankForm: React.FC = () => (
    <Form layout="vertical">
        <Row gutter={16}>
            <Col span={12}>
                <TextInput
                    name="accountHolderName"
                    label="Account Holder Name"
                    placeholder="Enter Account Holder Name"
                    type="text"
                    allowAlphabetsAndSpaceOnly
                    maxLength={50}
                    isRequired
                />
            </Col>
            <Col span={12}>
                <TextInput
                    name="bankName"
                    label="Bank Name"
                    placeholder="Enter Bank Name"
                    type="text"
                    allowAlphabetsAndSpaceOnly
                    maxLength={50}
                    isRequired
                />
            </Col>
            <Col span={12}>
                <TextInput
                    name="accountNumber"
                    label="Account Number"
                    placeholder="Enter Account Number"
                    type="text"
                    allowNumbersOnly
                    maxLength={18}
                    isRequired
                />
            </Col>
            <Col span={12}>
                <TextInput
                    name="ifscCode"
                    label="IFSC Code"
                    placeholder="Enter IFSC Code"
                    type="text"
                    allowAlphabetsAndNumbersOnly
                    maxLength={11}
                    allowUpperCaseOnly
                    isRequired
                />
            </Col>
            <Col span={12}>
                <SelectInput
                    name="accountType"
                    label="Account Type"
                    placeholder="Select Account Type"
                    options={ACCOUNT_TYPE_OPTIONS}
                    isRequired
                />
            </Col>
            <Col span={12}>
                <TextInput
                    name="bankBranch"
                    label="Branch Name"
                    placeholder="Enter Branch Name"
                    type="text"
                    maxLength={50}
                    isRequired
                />
            </Col>
        </Row>
    </Form>
);

export default React.memo(AddDomesticBankForm);
