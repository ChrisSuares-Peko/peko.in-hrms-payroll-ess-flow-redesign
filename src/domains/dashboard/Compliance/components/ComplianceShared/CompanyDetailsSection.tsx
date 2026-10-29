import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import useIndianStates from '../../hooks/useIndianStates';

const { Text } = Typography;

const COMPANY_TYPE_OPTIONS = [
    { label: 'Private Limited Company', value: 'Private Limited Company' },
    { label: 'One Person Company (OPC)', value: 'One Person Company (OPC)' },
    { label: 'Public Limited Company', value: 'Public Limited Company' },
    { label: 'Section 8 Company', value: 'Section 8 Company' },
    { label: 'Other', value: 'Other' },
];

export const companyDetailsInitialValues = {
    company_name: '',
    company_cin: '',
    company_incorporationDate: '',
    company_type: '',
    company_pan: '',
    company_tan: '',
    company_gstin: '',
    company_registeredAddress: '',
    company_email: '',
    company_mobile: '',
    company_authorisedCapital: '',
    company_paidUpCapital: '',
    company_businessActivity: '',
    company_financialYear: '',
    contact_name: '',
    contact_designation: '',
    contact_mobile: '',
    contact_email: '',
};

const CompanyDetailsSection: React.FC = () => {
    const { stateOptions, isLoading: statesLoading } = useIndianStates();

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Company Details</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">All fields marked with * are mandatory</Text>
            </Flex>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <TextInput name="company_name" label="Full Company Name" type="text" placeholder="As per Certificate of Incorporation" isRequired />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_cin" label="CIN Number" type="text" placeholder="e.g. U74999MH2024PTC123456" isRequired convertToUppercase maxLength={21} />
                </Col>
                <Col xs={24} sm={12}>
                    <DatePickerInput name="company_incorporationDate" label="Date of Incorporation" placeholder="Select date" isRequired classes="w-full" formItemClass="w-full" />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch name="company_type" label="Company Type" placeholder="Select company type" options={COMPANY_TYPE_OPTIONS} isRequired classes="w-full" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_pan" label="Company PAN" type="text" placeholder="e.g. ABCDE1234F" convertToUppercase maxLength={10} />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_tan" label="Company TAN" type="text" placeholder="e.g. ABCD12345E" convertToUppercase maxLength={10} />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_gstin" label="GSTIN" type="text" placeholder="15-digit GSTIN (if applicable)" convertToUppercase maxLength={15} />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch name="company_registeredState" label="Registered State" placeholder="Select state" options={stateOptions} loading={statesLoading} classes="w-full" />
                </Col>
                <Col xs={24}>
                    <TextInput name="company_registeredAddress" label="Registered Office Address" type="text" placeholder="Enter full registered address" isRequired />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_email" label="Official Email ID" type="email" placeholder="Enter official email" isRequired />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_mobile" label="Official Mobile Number" type="text" placeholder="10-digit mobile number" isRequired allowNumbersOnly maxLength={10} addonBefore="+91" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_authorisedCapital" label="Authorised Share Capital (₹)" type="text" placeholder="Enter amount" allowNumbersOnly />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_paidUpCapital" label="Paid-up / Subscribed Share Capital (₹)" type="text" placeholder="Enter amount" allowNumbersOnly />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_businessActivity" label="Main Business Activity" type="text" placeholder="e.g. Software Development" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="company_financialYear" label="Financial Year" type="text" placeholder="e.g. 2024-25" />
                </Col>
            </Row>

            <div className="border-t border-[#f0f0f0] mt-4 pt-4">
                <Text className="!text-[13px] !font-semibold !text-[#314259] block mb-3">Primary Contact Person</Text>
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                        <TextInput name="contact_name" label="Name" type="text" placeholder="Enter contact name" isRequired />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput name="contact_designation" label="Designation" type="text" placeholder="Enter designation" />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput name="contact_mobile" label="Mobile" type="text" placeholder="10-digit mobile" allowNumbersOnly maxLength={10} addonBefore="+91" />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput name="contact_email" label="Email" type="email" placeholder="Enter email" />
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default CompanyDetailsSection;
