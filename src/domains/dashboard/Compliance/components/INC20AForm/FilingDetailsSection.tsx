import React from 'react';

import { Alert, Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import type { INC20AFormValues } from './inc20aTypes';

const { Text } = Typography;

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const FilingDetailsSection: React.FC = () => {
    const { values } = useFormikContext<INC20AFormValues>();

    const dueDateDisplay = React.useMemo(() => {
        if (!values.company_incorporationDate) return null;
        const date = new Date(values.company_incorporationDate);
        if (Number.isNaN(date.getTime())) return null;
        date.setDate(date.getDate() + 180);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    }, [values.company_incorporationDate]);

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">INC-20A Filing Details</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Share subscription and bank account details</Text>
            </Flex>

            {dueDateDisplay && (
                <div className="mb-4">
                    <Alert
                        type="info"
                        showIcon
                        message={`INC-20A must be filed by: ${dueDateDisplay} (within 180 days of incorporation)`}
                    />
                </div>
            )}

            {values.filing_hasShareCapital === 'No' && (
                <div className="mb-4">
                    <Alert type="warning" showIcon message="INC-20A is not applicable for companies without share capital." />
                </div>
            )}

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="filing_hasShareCapital"
                        label="Does the Company Have Share Capital?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="filing_rocVerified"
                        label="ROC Office Verified?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="filing_accountOpened"
                        label="Bank Account Opened?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="filing_bankName" label="Bank Name" type="text" placeholder="Enter bank name" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="filing_branchName" label="Branch Name" type="text" placeholder="Enter branch name" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="filing_accountNumber" label="Account Number" type="text" placeholder="Enter account number" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="filing_totalSubscribedCapital" label="Total Subscribed Capital (₹)" type="text" placeholder="Enter amount" allowNumbersOnly />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="filing_totalMoneyReceived" label="Total Money Received (₹)" type="text" placeholder="Must equal subscribed capital" allowNumbersOnly isRequired />
                </Col>
                <Col xs={24} sm={12}>
                    <DatePickerInput name="filing_moneyReceivedDates" label="Date(s) Money Received" placeholder="Select date" classes="w-full" formItemClass="w-full" />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="filing_onlySubscriptionTransactions"
                        label="Only Subscription Transactions in Account?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="filing_signingDirector" label="Director Signing with DSC" type="text" placeholder="Enter director name" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="filing_certifyingProfessional" label="Certifying Professional" type="text" placeholder="Enter professional name" />
                </Col>
            </Row>
        </div>
    );
};

export default FilingDetailsSection;
