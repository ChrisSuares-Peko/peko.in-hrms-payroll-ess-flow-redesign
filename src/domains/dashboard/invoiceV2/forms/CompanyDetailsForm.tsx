import React from 'react';

import { Flex, Form, Typography } from 'antd';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';

import FileUploadField from '../components/shared/FileUploadField';
import {
    ADDITIONAL_DOCS,
    DOC_UPLOAD_CONFIG,
    READONLY_FIELDS,
    REQUIRED_DOCS,
} from '../constants/remittance';

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Typography.Text className="text-base font-semibold text-[#101828] block py-2">
        {title}
    </Typography.Text>
);

const CompanyDetailsForm: React.FC = () => (
    <Form layout="vertical">
        <Flex vertical gap={0}>
            <SectionHeader title="Business Information" />

            {READONLY_FIELDS.map(({ name, label }) => (
                <TextInput
                    key={name}
                    name={name}
                    label={label}
                    placeholder={label}
                    type="text"
                    isDisabled
                />
            ))}

            <InputTextArea
                name="communicationAddress"
                label="Communication Address"
                placeholder="Enter communication address"
                autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <InputTextArea
                name="registeredAddress"
                label="Registered Address"
                placeholder="Enter registered address"
                autoSize={{ minRows: 2, maxRows: 4 }}
            />

            <SectionHeader title="Required Documents" />

            {REQUIRED_DOCS.map(({ fieldName, label, subtitle }) => (
                <FileUploadField
                    key={fieldName}
                    {...DOC_UPLOAD_CONFIG}
                    label={label}
                    fieldName={fieldName}
                    subtitle={subtitle}
                />
            ))}

            <SectionHeader title="Settlement Information" />

            <InputTextArea
                name="settlementBankAccountDetails"
                label="Settlement Bank Account Details"
                placeholder="Enter complete bank account details for settlement"
                autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <FileUploadField
                {...DOC_UPLOAD_CONFIG}
                label="Settlement Bank Account Details Proof"
                fieldName="settlementBankAccountProof"
            />

            <SectionHeader title="Additional Documents" />

            {ADDITIONAL_DOCS.map(({ fieldName, label, subtitle }) => (
                <FileUploadField
                    key={fieldName}
                    {...DOC_UPLOAD_CONFIG}
                    label={label}
                    fieldName={fieldName}
                    subtitle={subtitle}
                />
            ))}
        </Flex>
    </Form>
);

export default React.memo(CompanyDetailsForm);
