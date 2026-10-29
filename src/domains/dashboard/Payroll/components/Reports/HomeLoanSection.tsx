import React from 'react';

import { Flex, Typography, Row, Col } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';

const HomeLoanSection = () => (
    <Flex
        gap={15}
        vertical
        className="rounded-lg border border-[#EAEAEA] xs:p-3 md:p-6 xs:mt-3 md:mt-6"
    >
        <Typography.Text className="text-[#1B1B1B] font-medium text-[1.1rem]">
            Deduction of Interest on Home Loan - Section 24(b)
        </Typography.Text>
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <TextInput
                    name="homeLoanInterestDetails.interestPaid"
                    label="Interest Payable/ Paid to the Lender"
                    type="text"
                    placeholder="Enter interest paid"
                    isRequired
                    allowNumbersAndDots
                />
            </Col>
            <Col xs={24} md={12}>
                <TextInput
                    name="homeLoanInterestDetails.lenderName"
                    label="Lender’s Name"
                    type="text"
                    placeholder="Enter lender’s name"
                    isRequired
                    allowAlphabetsAndSpaceOnly
                />
            </Col>
            <Col xs={24} md={12}>
                <TextInput
                    name="homeLoanInterestDetails.lenderPAN"
                    label="PAN of the Lender"
                    type="text"
                    placeholder="Enter lender’s PAN"
                    isRequired
                    allowUpperCaseOnly
                    maxLength={10}
                />
            </Col>
            <Col xs={24} md={12}>
                <TextInput
                    name="homeLoanInterestDetails.lenderAddress"
                    label="Lender’s Address"
                    type="text"
                    placeholder="Enter lender’s address"
                    isRequired
                    allowAlphabetsAndSpaceOnly
                />
            </Col>
            <Col xs={24} md={12}>
                <FileUploadInput
                    label="Upload Proof of Travel"
                    name="homeLoanInterestDetails.proofOfTravel"
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

export default HomeLoanSection;
