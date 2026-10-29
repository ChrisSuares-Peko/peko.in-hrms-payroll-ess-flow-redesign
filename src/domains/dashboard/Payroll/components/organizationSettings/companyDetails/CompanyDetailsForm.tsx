import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Tooltip, Typography } from 'antd';

import CityAutoCompleteInput from '@components/atomic/inputs/CityAutoCompleteInput';
import FileUploader from '@components/atomic/inputs/FileUploader';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import { industryOptions } from '../../../utils/orgSettings/companyDetailsData';

type Props = {
    statesList?: { label: string; value: string }[];
    companyProfileData: any;
    isWelcomePage?: any;
};

const CompanyDetailsForm: React.FC<Props> = ({ statesList, companyProfileData, isWelcomePage }) => (
    <Flex
        vertical
        className={` ${isWelcomePage ? 'xs:p-4 md:p-8 border rounded-2xl  border-[#EAEAEA]' : ''}`}
    >
        <Flex vertical>
            <Typography.Text className="font-medium text-[22px]">
                Company Details
            </Typography.Text>
            <Flex vertical className="mb-6">
                <Flex align="center" gap={6} className="mt-1 mb-0">
                    <Typography.Text className="font-medium">Company Logo</Typography.Text>

                    <Typography.Text>(optional)</Typography.Text>

                    <Tooltip title="This logo appears on your payslips, other documents shared with employees.">
                        <QuestionCircleOutlined
                            className="text-gray-400 cursor-pointer"
                            style={{ fontSize: 18 }}
                        />
                    </Tooltip>
                </Flex>

                <Flex>
                    <FileUploader
                        name="companyLogo"
                        format="companyLogoFormat"
                        initialImageUrl={
                            companyProfileData?.companyLogo ||
                            companyProfileData?.companyProfile?.companyLogo
                        }
                         allowedFileTypes={['image/jpeg', 'image/png', 'image/jpg']}
                         maxFileSize={10 * 1024}
                    />
                </Flex>
                <Typography.Text type="secondary" className="text-xs mt-2">
                    (File Formats Supported: JPG, JPEG, PNG. Max. size: 10 MB)
                </Typography.Text>
            </Flex>

            <Row gutter={20}>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        name="companyName"
                        placeholder="Enter company name"
                        label="Company Name"
                        type="text"
                        classes="w-full"
                        allowAlphabetsNumberAndSpecialCharacters={[' ', '-', '&', '.']}
                        isRequired
                        maxLength={50}
                    />
                </Col>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        name="companyAddressLine1"
                        placeholder="Enter Address"
                        label="Company Address Line 1"
                        type="text"
                        classes="w-full"
                        allowAlphabetsNumberAndSpecialCharacters={[
                            ' ',
                            ':',
                            '.',
                            '-',
                            '/',
                            '@',
                            '_',
                            '#',
                            '(',
                            ')',
                            ',,',
                            '.',
                        ]}
                        isRequired
                        maxLength={100}
                    />
                </Col>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        name="companyAddressLine2"
                        placeholder="Enter Address"
                        label="Company Address Line 2"
                        type="text"
                        classes="w-full"
                        allowAlphabetsNumberAndSpecialCharacters={[
                            ' ',
                            ':',
                            '.',
                            '-',
                            '/',
                            '@',
                            '_',
                            '#',
                            '(',
                            ')',
                            '.',
                            ',',
                        ]}
                        maxLength={100}
                    />
                </Col>                
                <Col sm={24} md={12} className="w-full">
                    <SelectInputWithSearch
                        name="state"
                        placeholder="Select state"
                        label="State"
                        options={[...(statesList || [])].sort((a, b) =>
                            a.label.localeCompare(b.label)
                        )}
                        isRequired
                    />
                </Col>
                <Col sm={24} md={12} className="w-full">
                    <CityAutoCompleteInput
                        name="city"
                        stateFieldName="state"
                        label="City"
                        placeholder="Enter City"
                        isRequired
                        classes="w-full rounded-sm"
                    />
                </Col>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        name="pinCode"
                        placeholder="Enter PIN Code"
                        label="PIN Code"
                        type="text"
                        classes="w-full"
                        allowNumbersOnly
                        isRequired
                        maxLength={6}
                    />
                </Col>
            </Row>
            <Row gutter={20}>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        name="contactNumber"
                        placeholder="Enter mobile number"
                        label="Mobile Number"
                        type="text"
                        classes="w-full"
                        allowNumbersOnly
                        isRequired
                        minLength={10}
                        maxLength={10}
                    />
                </Col>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        name="emailAddress"
                        placeholder="Enter email address"
                        label="Email Address"
                        type="text"
                        classes="w-full"
                        isRequired
                    />
                </Col>
            </Row>
            <Row gutter={20}>
                <Col sm={24} md={12} className="w-full">
                    <SelectInput
                        name="industry"
                        placeholder="Select industry"
                        label="Industry (optional)"
                        options={industryOptions}
                    />
                </Col>
            </Row>
        </Flex>

        <Flex vertical>
            <Flex className="xs:mb-2 md:mb-3">
                <Typography.Text className="font-medium">Organization Tax Details</Typography.Text>
            </Flex>

            <Row gutter={20}>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        showToolTip
                        tooltipText="company PAN should be in the format AAAAC9999A (first 5 letters, next 4 digits, last 1 letter; 4th letter must be C)"
                        isRequired
                        name="PAN"
                        placeholder="Enter PAN"
                        label="PAN"
                        type="text"
                        classes="w-full"
                        allowUpperCaseOnly
                        allowAlphabetsAndNumbersOnly
                        maxLength={10}
                    />
                </Col>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        isRequired
                        allowUpperCaseOnly
                        name="TAN"
                        placeholder="Enter TAN" // ABCD12345E
                        label="TAN"
                        type="text"
                        classes="w-full"
                        maxLength={10}
                    />
                </Col>
            </Row>
            <Row gutter={20}>
                <Col sm={24} md={12} className="w-full">
                    <TextInput
                        isRequired
                        name="TDSCode"
                        placeholder="Enter TDS code"
                        label="TDS Circle/AO Code"
                        type="text"
                        classes="w-full"
                        allowUpperCaseOnly
                        allowAlphabetsAndNumbersOnly
                        maxLength={8}
                    />
                </Col>
                <Col sm={24} md={12} className="w-full">
                    <SelectInput
                        isRequired
                        name="taxPaymentFrequency"
                        placeholder="Select tax payment frequency"
                        label="Tax Payment Frequency"
                        options={[
                            { label: 'Monthly', value: 'MONTHLY' },
                            { label: 'Quarterly', value: 'QUARTERLY' },
                            { label: 'Annually', value: 'ANNUALLY' },
                        ].sort((a, b) => a.label.localeCompare(b.label))}
                        classes="w-full"
                    />
                </Col>
            </Row>
        </Flex>
    </Flex>
);

export default CompanyDetailsForm;
