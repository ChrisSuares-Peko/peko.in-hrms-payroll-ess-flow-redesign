import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

export const officeUseInitialValues = {
    office_fileNo: '',
    office_dateReceived: '',
    office_receivedBy: '',
    office_engagementPartner: '',
    office_personResponsible: '',
    office_targetDate: '',
};

const OfficeUseSection: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">Office Use Only</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">For internal reference — filled by engagement team</Text>
        </Flex>
        <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
                <TextInput name="office_fileNo" label="Client / File No" type="text" placeholder="Enter file number" />
            </Col>
            <Col xs={24} sm={12}>
                <DatePickerInput name="office_dateReceived" label="Date Received" placeholder="Select date" classes="w-full" formItemClass="w-full" />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput name="office_receivedBy" label="Received By" type="text" placeholder="Enter name" />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput name="office_engagementPartner" label="Engagement Partner" type="text" placeholder="Enter partner name" />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput name="office_personResponsible" label="Person Responsible" type="text" placeholder="Enter name" />
            </Col>
            <Col xs={24} sm={12}>
                <DatePickerInput name="office_targetDate" label="Target / Due Date" placeholder="Select date" classes="w-full" formItemClass="w-full" />
            </Col>
        </Row>
    </div>
);

export default OfficeUseSection;
