import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@src/components/atomic/inputs/TextAreaInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const DPT3Section: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">DPT-3 — Return of Deposits</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                Annual return of outstanding loans / deposits — due by 30 June
            </Text>
        </Flex>

        <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
                <TextInput
                    name="dpt3_financialYear"
                    label="Financial Year"
                    type="text"
                    placeholder="e.g. 2024-25"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="dpt3_outstandingAmount"
                    label="Total Outstanding Amount (₹)"
                    type="text"
                    placeholder="Enter amount"
                    allowNumbersOnly
                />
            </Col>
            <Col xs={24}>
                <TextAreaInput
                    name="dpt3_loanBreakup"
                    label="Loan / Deposit Breakup"
                    placeholder="Provide details of each loan — lender name, amount, rate, tenure"
                    minRows={3}
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInputWithSearch
                    name="dpt3_publicDeposits"
                    label="Public Deposits Accepted?"
                    placeholder="Select"
                    options={YES_NO_OPTIONS}
                    classes="w-full"
                />
            </Col>
        </Row>
    </div>
);

export default DPT3Section;
