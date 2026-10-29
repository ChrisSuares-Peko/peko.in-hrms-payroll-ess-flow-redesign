import React from 'react';

import { Flex, Typography, Row, Col } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';

const HRASection = () => (
    <Flex gap={15} vertical className="rounded-lg border border-[#EAEAEA] xs:p-3 md:p-6">
        <Typography.Text className="text-[#1B1B1B] font-medium text-[1.1rem]">
            House Rent Allowance (HRA) - Section 10(13A)
        </Typography.Text>
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <TextInput
                    name="hraDetails.totalRentPaid"
                    label="Total Rent Paid(Annually)"
                    type="text"
                    placeholder="Enter total rent paid"
                    isRequired
                    allowTwoDecimalsOnly
                    maxLength={10}
                />
            </Col>
            <Col xs={24} md={12}>
                <TextInput
                    name="hraDetails.landlordName"
                    label="Landlord's Name"
                    type="text"
                    placeholder="Enter landlord's name"
                    isRequired
                    allowAlphabetsAndSpaceOnly
                />
            </Col>
            <Col xs={24} md={12}>
                <TextInput
                    name="hraDetails.landlordPAN"
                    label="Landlord’s PAN (Mandatory if rent > ₹1 lakh annually)"
                    type="text"
                    placeholder="Enter landlord’s PAN"
                    isRequired
                    allowUpperCaseOnly
                    maxLength={10}
                />
            </Col>
            <Col xs={24} md={12}>
                <TextInput
                    name="hraDetails.rentedPropertyAddress"
                    label="Address of Rented Property"
                    type="text"
                    placeholder="Enter address of rented property"
                    isRequired
                    allowAlphabetsAndSpaceOnly
                />
            </Col>
            <Col xs={24} md={12}>
                <FileUploadInput
                    label="Upload Rent Receipts"
                    name="hraDetails.rentReceipts"
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

export default HRASection;
