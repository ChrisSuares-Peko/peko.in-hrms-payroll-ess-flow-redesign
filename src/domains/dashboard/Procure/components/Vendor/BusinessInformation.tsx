import React from 'react';

import { Flex, Form, Tag, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { VENDOR_STATUS_OPTIONS, VENDOR_TAG_OPTIONS } from '../../utils/data';

const { Text, Title } = Typography;

const TagSelector: React.FC = () => {
    const { values, setFieldValue } = useFormikContext<{ tags: string[] }>();
    const tags = values.tags ?? [];

    const toggleTag = (tag: string) => {
        const next = tags.includes(tag)
            ? tags.filter(t => t !== tag)
            : [...tags, tag];
        setFieldValue('tags', next);
    };

    return (
        <Flex vertical gap={6}>
            <Flex gap={4} wrap="wrap">
                {VENDOR_TAG_OPTIONS.map(tag => {
                    const active = tags.includes(tag);
                    return (
                        <Tag
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            style={{
                                cursor: 'pointer',
                                borderRadius: 20,
                                padding: '4px 14px',
                                fontSize: 13,
                                fontWeight: 500,
                                border: `1px solid ${active ? '#FF4F4F' : '#cbd5e1'}`,
                                color: active ? '#FF4F4F' : '#1e293b',
                                background: active ? '#fff1f0' : '#fff',
                                userSelect: 'none',
                            }}
                        >
                            {tag}
                        </Tag>
                    );
                })}
            </Flex>
            <Text style={{ fontSize: 10, color: '#bfbfbf' }}>
                Choose tags so buyers can filter and shortlist this vendor faster.
            </Text>
        </Flex>
    );
};

const BusinessInformation: React.FC = () => (
    <div style={{ marginBottom: 0 }}>
        <Title level={5} style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 20, fontFamily: 'Roboto, sans-serif' }}>
            Business information
        </Title>

        <div style={{ marginTop: 16 }}>
        <TextInput
            name="businessName"
            type="text"
            label="Business Name"
            placeholder="Business name"
            isRequired
            allowAlphabetsAndSpecialCharacters={["'", '.', ',', '-']}
            maxLength={50}
        />
        </div>

        <TextInput
            name="gstin"
            type="text"
            label="GSTIN"
            placeholder="Enter GSTIN (e.g., 27AAACT2727Q1ZV)"
            convertToUppercase
            allowAlphabetsAndNumbersOnly
            maxLength={15}
        />

        <TextInput
            name="contactPerson"
            type="text"
            label="Contact person"
            placeholder="Contact person name"
            isRequired
        />

        <TextInput
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter Address"
            isRequired
        />

        <TextInput
            name="phone"
            type="text"
            label="Phone"
            placeholder="+971 4 XXX XXXX"
            allowNumbersOnly
            maxLength={10}
        />

        <Form.Item label="Tags">
            <TagSelector />
        </Form.Item>

        <TextInput
            name="paymentTerms"
            type="text"
            label="Payments Terms"
            placeholder="Net 30"
        />

        <SelectInput
            name="status"
            label="Status"
            placeholder="Select status"
            options={VENDOR_STATUS_OPTIONS}
            isRequired
        />

        <TextAreaInput
            name="notes"
            label="Notes"
            placeholder="Add any additional notes about this vendor (optional)"
            maxLength={500}
            showCount
            minRows={3}
        />
    </div>
);

export default BusinessInformation;
