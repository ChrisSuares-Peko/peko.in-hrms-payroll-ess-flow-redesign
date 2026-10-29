import React from 'react';

import { Button, Col, Flex, Form, Row, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { useGetBankDetails } from '../../../hooks/OrganizationSettings/useGetBankDetailsApi';
import useOrganizationSettingsApi from '../../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { bankDetailsSchema } from '../../../schema/organizationSettings';


type Props = {
    setActiveTabKey?: any;
};

const BankDetails: React.FC<Props> = ({ setActiveTabKey }) => {
    const { updateBankDetails } = useOrganizationSettingsApi();
    const { data, generateBankDetailsDropdown } = useGetBankDetails();
    const { bankDetails, isLoading } = useAppSelector(state => state.reducer.orgSettings);
    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex vertical gap={20} className="pt-6">
            <Formik
                initialValues={{
                    bankName: bankDetails?.bankName || '',
                    accountNumber: bankDetails?.accountNumber || '',
                    accountHolderName: bankDetails?.accountHolderName || '',
                    ifscCode: bankDetails?.ifscCode || '',
                    branchAddress: bankDetails?.branchAddress || '',
                }}
                enableReinitialize
                validationSchema={bankDetailsSchema}
                onSubmit={async values => {
                    await updateBankDetails(values);
                }}
            >
                {({ handleSubmit, isSubmitting, setFieldValue }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Flex vertical>
                            <Typography.Text className="font-medium">
                                Company Bank Details
                            </Typography.Text>
                            <Row gutter={[20, 0]} className="mt-4">
                                <Col sm={24} md={6} className="w-full">
                                    <SelectInput
                                        name="bankAccount"
                                        placeholder="Select bank account"
                                        label="Select from saved bank account"
                                        options={generateBankDetailsDropdown(data) || []}
                                        classes="w-full md:w-[18rem]"
                                        handleChange={bankId => {
                                            const bankData = generateBankDetailsDropdown(data).find(
                                                bank => bank.value === bankId
                                            );
                                            if (bankData) {
                                                setFieldValue('bankName', bankData.bankName);
                                                setFieldValue(
                                                    'accountHolderName',
                                                    bankData.accountHolderName
                                                );
                                                setFieldValue(
                                                    'accountNumber',
                                                    bankData.accountNumber
                                                );
                                                setFieldValue('ifscCode', bankData.ifscCode);
                                                setFieldValue('branchAddress', bankData.bankBranch);
                                            }
                                        }}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={[20, 0]}>
                                <Col sm={24} md={6} className="w-full">
                                    <TextInput
                                        name="accountHolderName"
                                        placeholder="Enter account holder name"
                                        label="Account Holder Name"
                                        type="text"
                                        maxLength={50}
                                        classes="w-full md:w-[18rem]"
                                        allowAlphabetsAndSpaceOnly
                                        isRequired
                                    />
                                </Col>
                                <Col sm={24} md={6} className="w-full">
                                    <TextInput
                                        name="accountNumber"
                                        placeholder="Enter account number"
                                        label="Account Number"
                                        type="text"
                                        classes="w-full md:w-[18rem]"
                                        allowNumbersOnly
                                        isRequired
                                        maxLength={25}
                                    />
                                </Col>
                            </Row>

                            <Row gutter={[20, 0]}>
                                <Col sm={24} md={6} className="w-full">
                                    <TextInput
                                        name="bankName"
                                        placeholder="Enter bank name"
                                        label="Bank Name"
                                        type="text"
                                        classes="w-full md:w-[18rem]"
                                        allowAlphabetsAndSpaceOnly
                                        isRequired
                                    />
                                </Col>
                                <Col sm={24} md={6} className="w-full">
                                    <TextInput
                                        name="ifscCode"
                                        placeholder="Enter ifsc code"
                                        label="IFSC Code"
                                        type="text"
                                        classes="w-full md:w-[18rem]"
                                        allowAlphabetsAndNumbersOnly
                                        convertToUppercase
                                        maxLength={11}
                                        isRequired
                                    />
                                </Col>
                            </Row>
                            <Row gutter={[20, 0]}>
                                <Col sm={24} md={6} className="w-full">
                                    <TextAreaInput
                                        name="branchAddress"
                                        label="Branch Address"
                                        placeholder="Enter branch address"
                                        isRequired
                                        maxLength={250}
                                        showCount
                                    />
                                </Col>
                            </Row>
                        </Flex>
                        <Flex gap={10} className="mt-4">
                            <Button
                                className="px-12"
                                type="primary"
                                danger
                                htmlType="submit"
                                loading={isSubmitting}
                            >
                                Save
                            </Button>
                            <Button
                                className="px-12"
                                type="default"
                                danger
                                onClick={() => setActiveTabKey('1')}
                            >
                                Cancel
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default BankDetails;
