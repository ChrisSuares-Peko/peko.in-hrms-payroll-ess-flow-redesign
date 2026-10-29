import React from 'react';

import { Flex, Typography, Row, Col } from 'antd';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';

const LTASection = () => (
    <Flex
        gap={15}
        vertical
        className="rounded-lg border border-[#EAEAEA] xs:p-3 md:p-6 xs:mt-3 md:mt-6"
    >
        <Typography.Text className="text-[#1B1B1B] font-medium text-[1.1rem]">
            Leave Travel Allowance (LTA) - Section 10(5)
        </Typography.Text>
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <TextInput
                    name="ltaDetails.ltaAmountClaimed"
                    label="LTA Amount Claimed"
                    type="text"
                    placeholder="Enter LTA amount claimed"
                    isRequired
                    allowTwoDecimalsOnly
                    maxLength={10}
                />
            </Col>
            <Col xs={24} md={12}>
                {/* <TextInput
                    name="ltaDetails.travelDate"
                    label="Travel Date"
                    type="text"
                    placeholder="Enter travel date"
                    isRequired
                /> */}
                <DatePickerInput
                    name="ltaDetails.travelDate"
                    label="Travel Date"
                    placeholder="Select the travel date"
                    classes="rounded-sm w-full"
                  
                    isRequired
                />
            </Col>
            <Col xs={24} md={12}>
                <TextInput
                    name="ltaDetails.travelDestination"
                    label="Travel Destination"
                    type="text"
                    placeholder="Enter travel destination"
                    isRequired
                    allowAlphabetsAndSpaceOnly
                />
            </Col>
            <Col xs={24} md={12}>
                <FileUploadInput
                    label="Proof of Travel"
                    name="ltaDetails.proofOfTravel"
                    format="supportingDocFormat"
                    showNotification
                    showFileName
                    allowedFileTypes={['image/jpeg', 'image/png']}
                    maxFileSize={200}
                    descriptionText="File Formats Supported: JPG, JPEG, PNG. Max. size: 200 KB"
                />
            </Col>
        </Row>
    </Flex>
);

export default LTASection;
