import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const ADT1Section: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">ADT-1 — Auditor Appointment</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                Form ADT-1 must be filed within 30 days of the auditor appointment
            </Text>
        </Flex>

        <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
                <SelectInputWithSearch
                    name="adt1_appointed"
                    label="First Auditor Appointed?"
                    placeholder="Select"
                    options={YES_NO_OPTIONS}
                    classes="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <DatePickerInput
                    name="adt1_appointmentDate"
                    label="Appointment Date"
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <DatePickerInput
                    name="adt1_boardMeetingDate"
                    label="Board Meeting Date"
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="adt1_auditorName"
                    label="Auditor / Firm Name"
                    type="text"
                    placeholder="Enter auditor or firm name"
                    isRequired
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="adt1_membershipNo"
                    label="Membership / FRN Number"
                    type="text"
                    placeholder="Enter membership or FRN number"
                    isRequired
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="adt1_auditorPan"
                    label="Auditor PAN"
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    convertToUppercase
                    maxLength={10}
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="adt1_auditorAddress"
                    label="Auditor / Firm Address"
                    type="text"
                    placeholder="Enter address"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="adt1_auditorEmail"
                    label="Auditor Email"
                    type="email"
                    placeholder="Enter email"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="adt1_auditorPhone"
                    label="Auditor Phone"
                    type="text"
                    placeholder="10-digit mobile number"
                    allowNumbersOnly
                    maxLength={10}
                    addonBefore="+91"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="adt1_appointmentPeriod"
                    label="Appointment Period"
                    type="text"
                    placeholder="e.g. Till conclusion of 1st AGM"
                />
            </Col>
            <Col xs={24} sm={12}>
                <DatePickerInput
                    name="adt1_agmDate"
                    label="AGM Date (if applicable)"
                    placeholder="Select date"
                    classes="w-full"
                    formItemClass="w-full"
                />
            </Col>
        </Row>
    </div>
);

export default ADT1Section;
