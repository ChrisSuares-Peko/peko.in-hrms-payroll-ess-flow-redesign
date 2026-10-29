import React, { useEffect } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Row } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import TypographyText from '@components/atomic/typography/typographyText';

import {
    DECIMAL_QUANTITY_UNITS,
    GST_RATE_OPTIONS,
    UNIT_OPTIONS,
} from '../../constants/generateIrn';
import { ItemsFormValues } from '../../types/generateIrn';
import { calcCgst, calcIgst, calcTaxable, calcTotal } from '../../utils/generateIrnCalculations';
import { formatAmount } from '../../utils/helperFunctions';

const QuantityField = ({ index }: { index: number }) => {
    const { values, setFieldValue } = useFormikContext<ItemsFormValues>();
    const unit = values.items[index]?.unit ?? '';
    const quantity = values.items[index]?.quantity ?? 0;
    const allowsDecimals = DECIMAL_QUANTITY_UNITS.includes(unit);

    useEffect(() => {
        if (allowsDecimals) return;
        const str = String(quantity);
        if (!str.includes('.')) return;
        const rounded = Math.round(parseFloat(str));
        setFieldValue(`items[${index}].quantity`, Number.isFinite(rounded) ? rounded : 0);
    }, [allowsDecimals, quantity, setFieldValue, index]);

    return (
        <TextInput
            name={`items[${index}].quantity`}
            label="Quantity"
            placeholder="Enter Quantity"
            type="text"
            maxLength={8}
            allowTwoDecimalsOnly={allowsDecimals}
            allowNumbersOnly={!allowsDecimals}
            isRequired
        />
    );
};

interface Props {
    igstOnIntra: boolean;
}

const ItemsForm: React.FC<Props> = ({ igstOnIntra }) => {
    const { values, setFieldValue } = useFormikContext<ItemsFormValues>();

    return (
        <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
            <Flex vertical gap={16}>
                {values.items.map((item, index) => {
                    const taxable = calcTaxable(item);
                    const igst = calcIgst(item);
                    const cgst = calcCgst(item);
                    const total = calcTotal(item);
                    return (
                        <Flex
                            key={item.id}
                            vertical
                            gap={12}
                            className="rounded-xl border border-[#E4E4E7] p-5"
                        >
                            <Flex justify="space-between" align="center">
                                <TypographyText className="text-sm font-semibold">
                                    Item {index + 1}
                                </TypographyText>
                                {values.items.length > 1 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        onClick={() =>
                                            setFieldValue(
                                                'items',
                                                values.items.filter((_, i) => i !== index)
                                            )
                                        }
                                    />
                                )}
                            </Flex>

                            <Row gutter={[12, 0]}>
                                <Col flex={1}>
                                    <TextInput
                                        name={`items[${index}].description`}
                                        label="Description"
                                        placeholder="Enter Description"
                                        type="text"
                                        isRequired
                                    />
                                </Col>
                                <Col flex={1}>
                                    <TextInput
                                        name={`items[${index}].hsnSac`}
                                        label="HSN / SAC"
                                        placeholder="Enter HSN / SAC"
                                        type="text"
                                        maxLength={8}
                                        allowNumbersOnly
                                        isRequired
                                    />
                                </Col>
                                <Col flex={1}>
                                    <QuantityField index={index} />
                                </Col>
                                <Col flex={1}>
                                    <SelectInput
                                        name={`items[${index}].unit`}
                                        label="Unit"
                                        placeholder="Select Unit"
                                        options={UNIT_OPTIONS}
                                        isRequired
                                    />
                                </Col>
                                <Col flex={1}>
                                    <TextInput
                                        name={`items[${index}].unitPrice`}
                                        label="Unit Price"
                                        placeholder="Enter Unit Price"
                                        type="text"
                                        maxLength={8}
                                        allowTwoDecimalsOnly
                                        isRequired
                                    />
                                </Col>
                            </Row>

                            <Row gutter={[12, 0]}>
                                <Col flex={1} style={{ maxWidth: 200 }}>
                                    <TextInput
                                        name={`items[${index}].discount`}
                                        label="Discount (₹)"
                                        placeholder="Enter Discount (₹)"
                                        type="text"
                                        maxLength={8}
                                        allowTwoDecimalsOnly
                                    />
                                </Col>
                                <Col flex={1}>
                                    <SelectInput
                                        name={`items[${index}].gstRate`}
                                        label="GST Rate %"
                                        placeholder="Select GST Rate"
                                        options={GST_RATE_OPTIONS}
                                    />
                                </Col>
                                <Col flex={1}>
                                    <TextInput
                                        name={`items[${index}].taxableAmt`}
                                        label="Taxable Amt"
                                        placeholder=""
                                        type="text"
                                        values={formatAmount(taxable)}
                                        isDisabled
                                    />
                                </Col>
                                {igstOnIntra ? (
                                    <Col flex={1}>
                                        <TextInput
                                            name={`items[${index}].igst`}
                                            label={`IGST (${item.gstRate}%)`}
                                            placeholder=""
                                            type="text"
                                            values={formatAmount(igst)}
                                            isDisabled
                                        />
                                    </Col>
                                ) : (
                                    <>
                                        <Col flex={1}>
                                            <TextInput
                                                name={`items[${index}].cgst`}
                                                label={`CGST (${item.gstRate / 2}%)`}
                                                placeholder=""
                                                type="text"
                                                values={formatAmount(cgst)}
                                                isDisabled
                                            />
                                        </Col>
                                        <Col flex={1}>
                                            <TextInput
                                                name={`items[${index}].sgst`}
                                                label={`SGST (${item.gstRate / 2}%)`}
                                                placeholder=""
                                                type="text"
                                                values={formatAmount(cgst)}
                                                isDisabled
                                            />
                                        </Col>
                                    </>
                                )}
                                <Col flex={1}>
                                    <TextInput
                                        name={`items[${index}].itemTotal`}
                                        label="Item Total"
                                        placeholder=""
                                        type="text"
                                        values={formatAmount(total)}
                                        isDisabled
                                    />
                                </Col>
                            </Row>
                        </Flex>
                    );
                })}
            </Flex>
        </Form>
    );
};

export default ItemsForm;
