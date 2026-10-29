import React from 'react';

import { Alert, Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import MultiSelectInput from '@src/components/atomic/inputs/MultiSelectInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { GSTFormValues } from './gstTypes';

const { Text } = Typography;

const FREQUENCY_OPTIONS = [
    { label: 'Monthly', value: 'Monthly' },
    { label: 'QRMP (Quarterly Return Monthly Payment)', value: 'QRMP' },
    { label: 'Composition Scheme', value: 'Composition' },
];

const RETURN_TYPE_OPTIONS = [
    { label: 'GSTR-1', value: 'GSTR1' },
    { label: 'GSTR-3B', value: 'GSTR3B' },
    { label: 'CMP-08 (Composition Quarterly)', value: 'CMP08' },
    { label: 'GSTR-9 / 9C (Annual)', value: 'GSTR9' },
    { label: 'GSTR-4 (Composition Annual)', value: 'GSTR4' },
    { label: 'Nil Return', value: 'NIL' },
];

const DATA_SOURCE_OPTIONS = [
    { label: 'Tally', value: 'Tally' },
    { label: 'Zoho Books', value: 'Zoho' },
    { label: 'Excel', value: 'Excel' },
    { label: 'Physical Invoices', value: 'Invoices' },
];

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const GSTReturnSection: React.FC = () => {
    const { values } = useFormikContext<GSTFormValues>();

    if (!values.gst_selectedTypes.includes('GST_RETURN')) return null;

    const isComposition = values.ret_frequency === 'Composition';
    const isNilReturn = values.ret_returnTypes.includes('NIL');

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">GST Return Filing</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Provide details for GST return preparation and filing
                </Text>
            </Flex>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_gstin"
                        label="GSTIN"
                        type="text"
                        placeholder="e.g. 27AAPFU0939F1ZV"
                        isRequired
                        convertToUppercase
                        maxLength={15}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_period"
                        label="Return Period"
                        type="text"
                        placeholder="e.g. Apr 2025 or Q1 FY 2025-26"
                        isRequired
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="ret_frequency"
                        label="Filing Frequency"
                        placeholder="Select frequency"
                        options={FREQUENCY_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <MultiSelectInput
                        name="ret_returnTypes"
                        label="Return Types"
                        placeholder="Select return types to file"
                        options={RETURN_TYPE_OPTIONS}
                        classes="w-full"
                    />
                </Col>

                {isComposition && (
                    <Col xs={24}>
                        <Alert
                            type="info"
                            showIcon
                            message="Composition taxpayers must file CMP-08 (quarterly) and GSTR-4 (annual) only. Other return types are not applicable."
                            className="!rounded-[10px] !mb-2"
                        />
                    </Col>
                )}

                {!isNilReturn && (
                    <>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="ret_outwardSupplies"
                                label="Total Outward Supplies / Sales (₹)"
                                type="text"
                                placeholder="Enter total sales amount"
                                allowNumbersOnly
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="ret_inwardSupplies"
                                label="Total Inward Supplies / Purchases (₹)"
                                type="text"
                                placeholder="Enter total purchase amount"
                                allowNumbersOnly
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <SelectInputWithSearch
                                name="ret_dataSource"
                                label="Data Source / Accounting Software"
                                placeholder="Select data source"
                                options={DATA_SOURCE_OPTIONS}
                                classes="w-full"
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="ret_itc"
                                label="Input Tax Credit (ITC) (₹)"
                                type="text"
                                placeholder="Enter ITC amount"
                                allowNumbersOnly
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="ret_rcmLiability"
                                label="Reverse Charge Liability (₹)"
                                type="text"
                                placeholder="Enter RCM liability amount"
                                allowNumbersOnly
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <SelectInputWithSearch
                                name="ret_hasAmendments"
                                label="Amendments to Earlier Returns?"
                                placeholder="Select Yes / No"
                                options={YES_NO_OPTIONS}
                                classes="w-full"
                            />
                        </Col>
                    </>
                )}

                {isNilReturn && (
                    <Col xs={24}>
                        <Alert
                            type="warning"
                            showIcon
                            message="Nil Return selected — no supply details are required. Only GSTIN and period information will be filed."
                            className="!rounded-[10px] !mt-2"
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default GSTReturnSection;
