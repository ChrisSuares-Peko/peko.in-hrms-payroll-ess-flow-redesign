import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@src/components/atomic/inputs/TextAreaInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

const HALF_YEAR_OPTIONS = [
    { label: 'April – September', value: 'April–September' },
    { label: 'October – March', value: 'October–March' },
];

const MSME1Section: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">MSME-1 — Outstanding Payments</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                Half-yearly statement of outstanding dues to MSME suppliers — due Apr 30 &amp; Oct 31
            </Text>
        </Flex>

        <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
                <SelectInputWithSearch
                    name="msme_halfYear"
                    label="Half-Year Period"
                    placeholder="Select period"
                    options={HALF_YEAR_OPTIONS}
                    classes="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="msme_outstandingAmount"
                    label="Total Outstanding Amount (₹)"
                    type="text"
                    placeholder="Enter amount"
                    allowNumbersOnly
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="msme_vendorCount"
                    label="Number of MSME Vendors"
                    type="text"
                    placeholder="Enter count"
                    allowNumbersOnly
                />
            </Col>
            <Col xs={24}>
                <TextAreaInput
                    name="msme_delayReason"
                    label="Reason for Delay in Payment (if any)"
                    placeholder="Describe any reason for delayed payments to MSME vendors"
                    minRows={3}
                />
            </Col>
        </Row>
    </div>
);

export default MSME1Section;
