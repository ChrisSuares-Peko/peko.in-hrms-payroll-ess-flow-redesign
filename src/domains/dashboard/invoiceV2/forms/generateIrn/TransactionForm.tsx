import React, { useEffect, useRef } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Col, Flex, Form, Row } from 'antd';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import RadioGroupInput from '@components/atomic/inputs/RadioGroupInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import TypographyText from '@components/atomic/typography/typographyText';

import { DOCUMENT_TYPE_OPTIONS, SUPPLY_TYPE_OPTIONS } from '../../constants/generateIrn';
import { TransactionFormValues } from '../../types/generateIrn';

interface Props {
    prefixMap: Record<string, string>;
    nextNumber: string;
    isNextNumberLoading?: boolean;
    isSettingsLoading?: boolean;
}

const PrefixWatcher: React.FC<{ prefixMap: Record<string, string> }> = ({ prefixMap }) => {
    const { values, setFieldValue } = useFormikContext<TransactionFormValues>();

    useEffect(() => {
        const prefix = prefixMap[values.documentType] ?? '';
        setFieldValue('documentPrefix', prefix);
    }, [values.documentType, prefixMap, setFieldValue]);

    return null;
};

const NumberWatcher: React.FC<{ nextNumber: string }> = ({ nextNumber }) => {
    const { setFieldValue } = useFormikContext<TransactionFormValues>();
    const hasSet = useRef(false);

    useEffect(() => {
        if (nextNumber && !hasSet.current) {
            setFieldValue('documentNumber', nextNumber);
            hasSet.current = true;
        }
    }, [nextNumber, setFieldValue]);

    return null;
};

const TransactionForm: React.FC<Props> = ({
    prefixMap,
    nextNumber,
    isNextNumberLoading,
    isSettingsLoading,
}) => (
    <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
        <PrefixWatcher prefixMap={prefixMap} />
        <NumberWatcher nextNumber={nextNumber} />
        <Row gutter={[56, 20]}>
            <Col xs={24} md={12}>
                <SelectInput
                    name="supplyType"
                    label="Supply Type"
                    placeholder="Select Supply Type"
                    options={SUPPLY_TYPE_OPTIONS}
                    isRequired
                />
            </Col>
            <Col xs={24} md={12}>
                <SelectInput
                    name="documentType"
                    label="Document Type"
                    placeholder="Select Document Type"
                    options={DOCUMENT_TYPE_OPTIONS}
                    isRequired
                />
            </Col>
            <Col xs={24} md={12}>
                <Flex vertical gap={6}>
                    <TypographyText className="text-sm font-medium text-[#374151]">
                        Document Number <span className="text-red-500">*</span>
                    </TypographyText>
                    <Flex gap={8} align="flex-start">
                        <TextInput
                            name="documentPrefix"
                            type="text"
                            placeholder="Prefix"
                            maxLength={6}
                            convertToUppercase
                            isDisabled={isSettingsLoading}
                            suffix={
                                isSettingsLoading ? (
                                    <LoadingOutlined className="text-[#9CA3AF]" />
                                ) : undefined
                            }
                            formItemClass="w-28 flex-shrink-0 [&_.ant-form-item-explain]:absolute"
                        />
                        <TextInput
                            name="documentNumber"
                            type="text"
                            placeholder="Enter Number"
                            maxLength={16}
                            allowAlphabetsAndNumbersOnly
                            isRequired
                            isDisabled={isNextNumberLoading}
                            suffix={
                                isNextNumberLoading ? (
                                    <LoadingOutlined className="text-[#9CA3AF]" />
                                ) : undefined
                            }
                            formItemClass="flex-1 [&_.ant-form-item-explain]:absolute"
                        />
                    </Flex>
                </Flex>
            </Col>
            <Col xs={24} md={12}>
                <DatePickerInput
                    name="documentDate"
                    label="Document Date"
                    placeholder="Select Document Date"
                    isRequired
                    classes="w-full"
                    needConfirm={false}
                />
            </Col>
            <Col xs={24} sm={12}>
                <RadioGroupInput
                    name="reverseCharge"
                    label="Reverse Charge"
                    options={[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                    ]}
                    simple
                />
            </Col>
            <Col xs={24} sm={12}>
                <RadioGroupInput
                    name="igstOnIntra"
                    label="IGST on Intra-State Supply"
                    options={[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false },
                    ]}
                    simple
                />
            </Col>
        </Row>
    </Form>
);

export default TransactionForm;
