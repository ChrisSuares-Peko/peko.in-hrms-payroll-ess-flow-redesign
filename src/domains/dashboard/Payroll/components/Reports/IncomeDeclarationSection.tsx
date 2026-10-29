import React from 'react';

import { Flex, Typography,  Col } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';

const IncomeDeclarationSection = () => (
    <Flex
        gap={15}
        vertical
        className="rounded-lg border border-[#EAEAEA] xs:p-3 md:p-6 xs:mt-3 md:mt-6"
    >
        <Typography.Text className="text-[#1B1B1B] font-medium text-[1.1rem]">
            Income Declaration
        </Typography.Text>
        <Col >
            <Col xs={24} md={12}>
                <TextInput
                    name="incomeDeclaration.annualIncome"
                    label="Annual Income"
                    type="text"
                    placeholder="Enter annual income"
                    isRequired
                    allowTwoDecimalsOnly
                    maxLength={10}
                />
            </Col>
            <Col xs={24} md={12}>
                <FileUploadInput
                    label="Upload Annual Income Proof"
                    name="incomeDeclaration.incomeProof"
                    format="supportingDocFormat"
                    showNotification
                    showFileName
                    allowedFileTypes={['image/jpeg', 'image/png']}
                    maxFileSize={200}
                    descriptionText="File Formats Supported: JPG, JPEG, PNG. Max. size: 200 KB"
                />
            </Col>
        </Col>
    </Flex>
);

export default IncomeDeclarationSection;
