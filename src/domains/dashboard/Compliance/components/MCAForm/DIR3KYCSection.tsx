import React from 'react';

import { Alert, Col, Flex, Row, Typography } from 'antd';

import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const KYC_TYPE_OPTIONS = [
    { label: 'First Time', value: 'First Time' },
    { label: 'Web Update', value: 'Web Update' },
];

const DIR3KYCSection: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">DIR-3 KYC — Director KYC</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                Annual KYC mandatory for all directors holding a DIN
            </Text>
        </Flex>

        <Alert
            type="warning"
            showIcon
            message="Late filing after 30 June attracts a reactivation fee of ₹5,000 per director."
            className="mb-5 !rounded-[12px]"
        />

        <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
                <TextInput
                    name="dir3_directorsForKyc"
                    label="Directors for KYC (Names / DINs)"
                    type="text"
                    placeholder="e.g. Ravi Kumar — DIN 12345678"
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInputWithSearch
                    name="dir3_kycType"
                    label="KYC Type"
                    placeholder="Select KYC type"
                    options={KYC_TYPE_OPTIONS}
                    classes="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInputWithSearch
                    name="dir3_mobileChanged"
                    label="Mobile Number Changed?"
                    placeholder="Select"
                    options={YES_NO_OPTIONS}
                    classes="w-full"
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInputWithSearch
                    name="dir3_emailChanged"
                    label="Email Changed?"
                    placeholder="Select"
                    options={YES_NO_OPTIONS}
                    classes="w-full"
                />
            </Col>
        </Row>
    </div>
);

export default DIR3KYCSection;
