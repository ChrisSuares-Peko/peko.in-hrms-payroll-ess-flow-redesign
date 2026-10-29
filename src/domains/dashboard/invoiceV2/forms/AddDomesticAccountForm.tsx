import React from 'react';

import { Col, Form, Row } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { AddDomesticAccountFormValues } from '../types/ManageBankAccounts';

const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Savings', value: 'Savings' },
    { label: 'Current', value: 'Current' },
];

const AddDomesticAccountForm: React.FC = () => {
    const { handleSubmit } = useFormikContext<AddDomesticAccountFormValues>();

    return (
        <Form layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <TextInput
                        name="accountHolderName"
                        label="Account Holder Name"
                        placeholder="Enter Account Holder Name"
                        type="text"
                        isRequired
                        maxLength={100}
                        allowAlphabetsAndSpaceOnly
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="bankName"
                        label="Bank Name"
                        placeholder="Enter Bank Name"
                        type="text"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={100}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <TextInput
                        name="accountNumber"
                        label="Account Number"
                        placeholder="Enter Account Number"
                        type="text"
                        allowNumbersOnly
                        isRequired
                        maxLength={18}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="ifscCode"
                        label="IFSC Code"
                        placeholder="Enter IFSC Code"
                        type="text"
                        convertToUppercase
                        isRequired
                        maxLength={11}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <SelectInput
                        name="accountType"
                        label="Account Type"
                        placeholder="Select Account Type"
                        isRequired
                        options={ACCOUNT_TYPE_OPTIONS}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="bankBranch"
                        label="Branch Name"
                        placeholder="Enter Branch Name"
                        type="text"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={100}
                    />
                </Col>
            </Row>
        </Form>
    );
};

export default React.memo(AddDomesticAccountForm);
