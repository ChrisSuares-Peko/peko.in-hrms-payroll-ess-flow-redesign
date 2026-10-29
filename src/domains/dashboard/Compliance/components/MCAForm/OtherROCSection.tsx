import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@src/components/atomic/inputs/TextAreaInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

const FILING_TYPE_OPTIONS = [
    { label: 'INC-22', value: 'INC-22' },
    { label: 'DIR-12', value: 'DIR-12' },
    { label: 'SH-7', value: 'SH-7' },
    { label: 'MGT-14', value: 'MGT-14' },
    { label: 'CHG-1', value: 'CHG-1' },
    { label: 'Other', value: 'Other' },
];

const OtherROCSection: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">Other ROC Filing</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                Provide details for any event-based or other ROC filings
            </Text>
        </Flex>

        <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
                <SelectInputWithSearch
                    name="other_filingType"
                    label="Filing Type"
                    placeholder="Select filing type"
                    options={FILING_TYPE_OPTIONS}
                    classes="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <DatePickerInput
                    name="other_eventDate"
                    label="Event / Trigger Date"
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="other_amounts"
                    label="Amount Involved (₹)"
                    type="text"
                    placeholder="Enter amount (if applicable)"
                    allowNumbersOnly
                />
            </Col>
            <Col xs={24}>
                <TextAreaInput
                    name="other_details"
                    label="Filing Details / Description"
                    placeholder="Describe the event and any additional information required for this filing"
                    minRows={3}
                />
            </Col>
        </Row>
    </div>
);

export default OtherROCSection;
