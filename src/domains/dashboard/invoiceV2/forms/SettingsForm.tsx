import React from 'react';

import { Checkbox, Collapse, Flex, Form, Switch, Typography, Avatar } from 'antd';
import { useFormikContext } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import NumberWithUnit from '@components/atomic/inputs/NumberWIthUnit';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import FileUploadField from '../components/shared/FileUploadField';
import RichTextEditorField from '../components/shared/RichTextEditorField';
import {
    DOCUMENT_TYPE_OPTIONS,
    GST_OPTIONS,
    IMAGE_ACCEPT,
    IMAGE_MIME_TYPES,
    IMAGE_TYPES_LABEL,
    INR_OPTION,
    PAYMENT_MODE_OPTIONS,
} from '../constants/settings';
import { SettingsFormValues } from '../types/settings';

const { Panel } = Collapse;

const IMAGE_UPLOAD_CONFIG = {
    allowedTypes: IMAGE_MIME_TYPES,
    acceptedTypesLabel: IMAGE_TYPES_LABEL,
    accept: IMAGE_ACCEPT,
    maxFileSizeMB: 2,
};

const SettingsForm: React.FC = () => {
    const { values, setFieldValue } = useFormikContext<SettingsFormValues>();

    return (
        <Form layout="vertical">
            <Flex vertical gap={16}>
                {/* Business Details Card */}
                <Flex vertical className="border border-[#E4E4E7] rounded-xl overflow-hidden">
                    <Collapse
                        defaultActiveKey={['business-details']}
                        ghost
                        expandIconPosition="end"
                    >
                        <Panel
                            key="business-details"
                            header={
                                <Typography.Text className="text-sm font-semibold text-[#101828]">
                                    Business Details
                                </Typography.Text>
                            }
                        >
                            <Flex vertical>
                                <Flex className="mb-4">
                                    <Avatar
                                        src={values.logoUrl ?? undefined}
                                        size={56}
                                        shape="circle"
                                        className="border border-stone-200 bg-gray-100"
                                    >
                                        {!values.logoUrl && (
                                            <Typography.Text className="text-xs text-gray-400">
                                                No Logo
                                            </Typography.Text>
                                        )}
                                    </Avatar>
                                </Flex>

                                <TextInput
                                    name="businessName"
                                    label="Business Name"
                                    placeholder="-"
                                    type="text"
                                    isDisabled
                                />

                                <InputTextArea
                                    name="address"
                                    label="Address"
                                    placeholder="-"
                                    autoSize={{ minRows: 2, maxRows: 2 }}
                                    isDisabled
                                />

                                <Flex gap={12}>
                                    <Flex vertical className="flex-1">
                                        <TextInput
                                            name="city"
                                            label="City"
                                            placeholder="-"
                                            type="text"
                                            isDisabled
                                        />
                                    </Flex>
                                    <Flex vertical className="flex-1">
                                        <TextInput
                                            name="state"
                                            label="State"
                                            placeholder="-"
                                            type="text"
                                            isDisabled
                                        />
                                    </Flex>
                                </Flex>

                                <Flex gap={10}>
                                    <Flex vertical className="flex-1">
                                        <TextInput
                                            name="pincode"
                                            label="Pincode"
                                            placeholder="-"
                                            type="text"
                                            isDisabled
                                        />
                                    </Flex>
                                    <Flex vertical className="flex-1">
                                        <TextInput
                                            name="phone"
                                            label="Phone Number"
                                            placeholder="-"
                                            type="text"
                                            isDisabled
                                        />
                                    </Flex>
                                </Flex>

                                <Flex gap={10}>
                                    <Flex vertical className="flex-1">
                                        <TextInput
                                            name="email"
                                            label="Email"
                                            placeholder="-"
                                            type="text"
                                            isDisabled
                                        />
                                    </Flex>
                                    <Flex vertical className="flex-1">
                                        <TextInput
                                            name="gstNo"
                                            label="GST No."
                                            placeholder="-"
                                            type="text"
                                            isDisabled
                                        />
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Panel>
                    </Collapse>
                </Flex>

                {/* Document Settings Card */}
                <Flex vertical className="border border-[#E4E4E7] rounded-xl overflow-hidden">
                    <Collapse
                        defaultActiveKey={['document-settings']}
                        ghost
                        expandIconPosition="end"
                    >
                        <Panel
                            key="document-settings"
                            header={
                                <Typography.Text className="text-sm font-semibold text-[#101828]">
                                    Document Settings
                                </Typography.Text>
                            }
                        >
                            <Flex vertical>
                                <SelectInput
                                    name="gstPercent"
                                    label="Default GST % (for new line items)"
                                    placeholder="Select GST"
                                    options={GST_OPTIONS}
                                />

                                <SelectInput
                                    name="currency"
                                    label="Default Currency"
                                    placeholder="Select currency"
                                    options={INR_OPTION}
                                    isDisabled
                                />

                                <SelectInput
                                    name="paymentMode"
                                    label="Default Payment Mode"
                                    placeholder="Select payment mode"
                                    options={PAYMENT_MODE_OPTIONS}
                                    allowClear
                                />

                                <NumberWithUnit
                                    name="defaultDueDays"
                                    label="Default Due Date (days from invoice date)"
                                    unit="days"
                                    min={1}
                                    max={365}
                                    precision={0}
                                />

                                <Form.Item>
                                    <Checkbox
                                        checked={!!values.autoUpdateDocNumber}
                                        onChange={e =>
                                            setFieldValue('autoUpdateDocNumber', e.target.checked)
                                        }
                                    >
                                        <Typography.Text className="text-sm text-[#475569]">
                                            Auto update document number
                                        </Typography.Text>
                                    </Checkbox>
                                </Form.Item>

                                <SelectInputWithSearch
                                    name="selectedDocumentType"
                                    label="Document Type"
                                    placeholder="Select document type"
                                    options={DOCUMENT_TYPE_OPTIONS}
                                />

                                {values.selectedDocumentType && (
                                    <>
                                        <TextInput
                                            name={`documentPrefixes.${values.selectedDocumentType}`}
                                            label="Document Number Prefix"
                                            placeholder="Enter prefix"
                                            type="text"
                                        />
                                        <Typography.Text className="text-xs text-[#6A7282] -mt-4 pb-4 block">
                                            Documents will be numbered as:{' '}
                                            {values.documentPrefixes?.[
                                                values.selectedDocumentType
                                            ] || 'INV-'}
                                            001, etc.
                                        </Typography.Text>
                                    </>
                                )}

                                <RichTextEditorField
                                    name="termsAndConditions"
                                    label="Terms & Conditions"
                                    placeholder="Enter your terms and conditions..."
                                />

                                <RichTextEditorField
                                    name="notes"
                                    label="Notes"
                                    placeholder="Enter default notes for documents..."
                                />

                                <FileUploadField
                                    {...IMAGE_UPLOAD_CONFIG}
                                    label="Upload Signature"
                                    fieldName="signature"
                                    uploadLabel="Click to upload signature"
                                    existingUrl={values.signatureUrl}
                                    displayName="Signature.png"
                                    removeFieldName="removeSignature"
                                />
                            </Flex>
                        </Panel>
                    </Collapse>
                </Flex>

                {/* Catalog Card */}
                <Flex vertical className="border border-[#E4E4E7] rounded-xl overflow-hidden">
                    <Collapse
                        defaultActiveKey={['catalog']}
                        ghost
                        expandIconPosition="end"
                    >
                        <Panel
                            key="catalog"
                            header={
                                <Flex vertical>
                                    <Typography.Text className="text-sm font-semibold text-[#101828]">
                                        Catalog
                                    </Typography.Text>
                                    <Typography.Text className="text-xs text-[#6A7282]">
                                        Behaviour when generating invoices.
                                    </Typography.Text>
                                </Flex>
                            }
                        >
                            <Flex align="center" justify="space-between" gap={16}>
                                <Flex vertical>
                                    <Typography.Text className="text-sm font-medium text-slate-800">
                                        Auto-add new line items to catalog
                                    </Typography.Text>
                                    <Typography.Text className="text-xs text-gray-500 mt-0.5">
                                        When you generate an invoice, any item that is not already
                                        in your catalog will be added automatically.
                                    </Typography.Text>
                                </Flex>
                                <Switch
                                    checked={!!values.autoAddItemsToCatalog}
                                    onChange={checked =>
                                        setFieldValue('autoAddItemsToCatalog', checked)
                                    }
                                />
                            </Flex>
                        </Panel>
                    </Collapse>
                </Flex>
            </Flex>
        </Form>
    );
};

export default React.memo(SettingsForm);
