import React from 'react';

import { Col, Form, Row } from 'antd';
import { useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { BankAccountFormValues } from '../../types/customer';

const AddBankAccountForm: React.FC = () => {
    const { handleSubmit } = useFormikContext<BankAccountFormValues>();

    return (
        <Form layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
                <Col span={12}>
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
                <Col span={12}>
                    <TextInput
                        name="accountNumber"
                        label="Account Number"
                        placeholder="Enter Account Number"
                        type="text"
                        isRequired
                        allowNumbersOnly
                        maxLength={18}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <TextInput
                        name="ifscCode"
                        label="IFSC Code"
                        placeholder="Enter IFSC Code"
                        type="text"
                        isRequired
                        convertToUppercase
                        allowAlphabetsAndNumbersOnly
                        maxLength={11}
                    />
                </Col>
                <Col span={12}>
                    <TextInput
                        name="swiftCode"
                        label="Swift Code"
                        placeholder="Enter Swift code"
                        type="text"
                        convertToUppercase
                        allowAlphabetsAndNumbersOnly
                        maxLength={11}
                    />
                </Col>
            </Row>
        </Form>
    );
};

export default React.memo(AddBankAccountForm);
