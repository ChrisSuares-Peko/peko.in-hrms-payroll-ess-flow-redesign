import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import CheckboxInput from '@src/components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

import DocUploadField from '../ComplianceDetail/DocUploadField';

const { Text } = Typography;

const DECLARATION_TEXT =
    'I/We hereby declare that all information provided in this form is true, correct, and complete to the best of my/our knowledge and belief. I/We understand that any false information may result in legal consequences. I/We authorise the engagement team to file this compliance on behalf of the company.';

export const declarationInitialValues = {
    decl_agreed: false,
    decl_signatoryName: '',
    decl_designation: '',
    decl_dinOrPan: '',
    decl_place: '',
    decl_date: '',
    decl_signature: '',
    decl_companySeal: '',
};

const DeclarationSection: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">Declaration &amp; Authorization</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Please read and confirm before submitting</Text>
        </Flex>

        <div className="bg-[#fafafa] rounded-[12px] p-4 mb-5 border border-[#f0f0f0]">
            <Text className="!text-[13px] !text-[#475569] leading-relaxed">{DECLARATION_TEXT}</Text>
        </div>

        <Flex vertical gap={16}>
            <CheckboxInput name="decl_agreed" isRequired>
                <span className="text-[13px] text-[#314259]">
                    I agree to the above declaration and authorise filing on behalf of the company
                </span>
            </CheckboxInput>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <TextInput name="decl_signatoryName" label="Name of Authorised Signatory" type="text" placeholder="Enter full name" isRequired />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="decl_designation" label="Designation" type="text" placeholder="e.g. Director" />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="decl_dinOrPan" label="DIN / PAN" type="text" placeholder="Enter DIN or PAN" convertToUppercase />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput name="decl_place" label="Place" type="text" placeholder="Enter city / place" />
                </Col>
                <Col xs={24} sm={12}>
                    <DatePickerInput name="decl_date" label="Date" placeholder="Select date" classes="w-full" formItemClass="w-full" />
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                    <DocUploadField name="decl_signature" label="Signature Upload (optional)" />
                </Col>
                <Col xs={24} sm={12}>
                    <DocUploadField name="decl_companySeal" label="Company Seal / Stamp (optional)" />
                </Col>
            </Row>
        </Flex>
    </div>
);

export default DeclarationSection;
