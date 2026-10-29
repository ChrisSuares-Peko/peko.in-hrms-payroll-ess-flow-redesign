import React, { useEffect } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Form, Row, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik, setNestedObjectValues } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import ScrollToError from '../ScrollToError';
import SectionHeader from './SectionHeader';
import { getRFQsAll } from '../../api';
import newRFQsIcon from '../../assets/icons/newRFQsIcon.svg';
import purchaseRequestIcon12 from '../../assets/icons/purchaseRequestIcon2.svg';
import { editPurchaseOrderSchema, newPurchaseOrderSchema } from '../../schema';
import { RFQDetail } from '../../types';
import { PAYMENT_TERMS } from '../../utils/data';
import { EditableLineItem, computeLineItemTotal, getLineItemColumns } from '../../utils/LineItemColumns';

const { Title, Text } = Typography;

export interface LineItem extends EditableLineItem {
    amount: string | number;
}

export interface PrefillState {
    title?: string;
    vendor?: string;
    paymentTerms?: string;
    notes?: string;
    lineItems?: LineItem[];
    proposalId?: number;
    linkedRFQ?: string;
    currency?: string;
    deliveryAddress?: string;
    deliveryDate?: string;
    internalNotes?: string;
}

const defaultLineItem = (): LineItem => ({
    key: String(Date.now()),
    description: '',
    qty: '1',
    unit: 'Each',
    amount: '',
    taxRate: '0',
    gstType: 'exclusive',
});

export const getInitialValues = (prefill: PrefillState = {}) => ({
    title: prefill.title ?? '',
    vendor: prefill.vendor ?? '',
    linkedRFQ: prefill.linkedRFQ ?? '',
    deliveryDate: prefill.deliveryDate ?? '',
    currency: prefill.currency ?? 'INR',
    deliveryAddress: prefill.deliveryAddress ?? '',
    paymentTerms: prefill.paymentTerms ?? '',
    notes: prefill.notes ?? '',
    internalNotes: prefill.internalNotes ?? '',
    lineItems: prefill.lineItems?.length
        ? prefill.lineItems
        : [{ key: '1', description: '', qty: '1', unit: 'Unit', amount: '', taxRate: '0', gstType: 'exclusive' }] as LineItem[],
});

type Props = {
    vendors: { id: number; businessName: string }[];
    isSubmitting: boolean;
    isIssuingPO?: boolean;
    prefill: PrefillState;
    onSubmit: (values: ReturnType<typeof getInitialValues>, items: LineItem[]) => Promise<void>;
    onIssuePO?: (values: ReturnType<typeof getInitialValues>, items: LineItem[]) => Promise<void>;
    onCancel: () => void;
    title?: string;
    rfqOptions?: { id: number; refNumber: string; title?: string }[];
    allowPastDates?: boolean;
    readOnlyLineItems?: boolean;
};

const NewPurchaseOrderForm: React.FC<Props> = ({ vendors, isSubmitting, isIssuingPO, prefill, onSubmit, onIssuePO, onCancel, title = 'New Purchase Order', rfqOptions, allowPastDates, readOnlyLineItems = false }) => {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const [rfqsFetched, setRfqsFetched] = React.useState<RFQDetail[]>([]);
    useEffect(() => {
        if (rfqOptions) return;
        getRFQsAll({ corporateId: String(corporateId) }).then(data => {
            if (data) setRfqsFetched(data);
        });
    }, [corporateId, rfqOptions]);
    const rfqs = rfqOptions ?? rfqsFetched;

    const initialValues = getInitialValues(prefill);

    return (
        <Card bordered={false} className="rounded-3xl w-full" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 'clamp(16px, 4vw, 32px)' } }}>
            <Flex vertical align="center" style={{ marginBottom: 40 }}>
                <Title level={4} className="!mb-1">{title}</Title>
                <Text className="text-[#000000] text-xs block text-center">
                    Create and issue a purchase order to a vendor
                </Text>
            </Flex>

            <Formik
                initialValues={initialValues}
                validationSchema={allowPastDates ? editPurchaseOrderSchema : newPurchaseOrderSchema}
                onSubmit={values => onSubmit(values, values.lineItems)}
            >
                {({ handleSubmit, values, setFieldValue, validateForm, setTouched }) => {
                    const addItem = () =>
                        setFieldValue('lineItems', [...values.lineItems, defaultLineItem()]);

                    const removeItem = (key: string) =>
                        setFieldValue(
                            'lineItems',
                            values.lineItems.filter(i => i.key !== key)
                        );

                    const totalAmount = values.lineItems.reduce(
                        (sum, i) => sum + computeLineItemTotal(
                            parseFloat(String(i.qty)) || 0,
                            parseFloat(String(i.amount)) || 0,
                            parseFloat(String(i.taxRate)) || 0,
                            String(i.gstType ?? 'exclusive'),
                        ), 0
                    );
                    const totalQty = values.lineItems.reduce(
                        (sum, i) => sum + (parseFloat(String(i.qty)) || 0),
                        0
                    );

                    const columns = getLineItemColumns({
                        removeItem,
                        itemsLength: values.lineItems.length,
                        amountField: 'amount',
                        amountLabel: 'Est. Amount',
                        readOnly: readOnlyLineItems,
                    });

                    return (
                        <Form layout="vertical" onFinish={() => handleSubmit()}>
                            <ScrollToError />

                            {/* Section 1: Vendor and Delivery */}
                            <Card bordered={false} className="rounded-3xl mb-4 mt-2" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 'clamp(12px, 3vw, 20px) clamp(12px, 3vw, 24px)' } }}>
                                <SectionHeader
                                    icon={newRFQsIcon}
                                    title="Vendor and Delivery"
                                    subtitle="Who are you ordering from and when?"
                                />
                                <Divider style={{ margin: '0 0 16px' }} />

                                <Row gutter={12}>
                                    <Col xs={24} sm={12}>
                                        <TextInput
                                            name="title"
                                            type="text"
                                            label="Title"
                                            placeholder="Enter purchase order title"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <SelectInputWithSearch
                                            name="vendor"
                                            label="Vendor"
                                            placeholder="Select vendor"
                                            isRequired
                                            options={vendors.map(v => ({
                                                value: String(v.id),
                                                label: v.businessName,
                                            }))}
                                            classes="w-full"
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={12}>
                                    <Col xs={24} sm={12}>
                                        <SelectInputWithSearch
                                            name="linkedRFQ"
                                            label="Linked RFQ (optional)"
                                            placeholder="None"
                                            options={rfqs.map((rfq: any) => ({
                                                value: String(rfq.id),
                                                label: rfq.refNumber,
                                            }))}
                                            classes="w-full"
                                            handleChange={(val: string) => {
                                                const matched = rfqs.find((r: any) => String(r.id) === String(val));
                                                if (matched?.refNumber) setFieldValue('title', matched.refNumber);
                                            }}
                                        />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <DatePickerInput
                                            name="deliveryDate"
                                            label="Delivery Date"
                                            placeholder="Select date"
                                            classes="w-full"
                                            allowClear
                                            minDate={allowPastDates ? undefined : dayjs()}
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={12}>
                                    <Col xs={24} sm={12}>
                                        <TextInput
                                            name="deliveryAddress"
                                            type="text"
                                            label="Delivery Address"
                                            placeholder="Enter delivery address"
                                            isRequired
                                        />
                                    </Col>
                                </Row>
                                {/* <Row gutter={12}>
                                    <Col span={24}>
                                        <TextInput
                                            name="deliveryAddress"
                                            type="text"
                                            label="Delivery Address"
                                            placeholder="Enter delivery address"
                                            isRequired
                                        />
                                    </Col>
                                </Row> */}
                            </Card>

                            {/* Section 2: Line Items */}
                            <Card
                                bordered={false}
                                className="rounded-3xl mb-4"
                                style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
                                styles={{ body: { padding: '20px 24px' } }}
                            >
                                <SectionHeader
                                    icon={newRFQsIcon}
                                    title="Line Items"
                                    subtitle="Itemised list of goods or services being ordered"
                                    action={
                                        !readOnlyLineItems ? (
                                            <Button size="small" danger icon={<PlusOutlined />} onClick={addItem}>
                                                Add Row
                                            </Button>
                                        ) : undefined
                                    }
                                />
                                <Divider style={{ margin: '0 0 16px' }} />

                                <Table
                                    dataSource={values.lineItems}
                                    columns={columns}
                                    pagination={false}
                                    size="small"
                                    rowKey="key"
                                    scroll={{ x: 'max-content' }}
                                    className="text-xs [&_.ant-table-cell]:align-top"
                                />
                                <Row gutter={12} className="mt-3">
                                    <Col xs={12} sm={12}>
                                        <Card bordered={false} className="rounded-lg" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '10px 14px' } }}>
                                            <Text className="text-xs text-gray-400 block">Total Quantity</Text>
                                            <Text strong className="text-sm">{totalQty}</Text>
                                        </Card>
                                    </Col>
                                    <Col xs={12} sm={12}>
                                        <Card bordered={false} className="rounded-lg" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '10px 14px' } }}>
                                            <Text className="text-xs text-gray-400 block">Total Amount</Text>
                                            <Text strong className="text-sm">
                                                ₹{' '}
                                                {totalAmount.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </Text>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Section 3: Payment & Notes */}
                            <Card
                                bordered={false}
                                className="rounded-3xl mb-4"
                                style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
                                styles={{ body: { padding: '20px 24px' } }}
                            >
                                <SectionHeader
                                    icon={purchaseRequestIcon12}
                                    title="Payment & Notes"
                                    subtitle="Payment terms and any additional instructions"
                                    iconSize={20}
                                />
                                <Divider style={{ margin: '0 0 16px' }} />

                                <SelectInput
                                    name="paymentTerms"
                                    label="Payment Terms"
                                    placeholder="Select payment terms"
                                    options={PAYMENT_TERMS}
                                    classes="w-full"
                                />
                                <TextAreaInput
                                    name="notes"
                                    label="Notes (visible to vendor)"
                                    placeholder=""
                                    minRows={4}
                                    showCount
                                    maxLength={250}
                                    removeEmoji
                                />
                                <TextAreaInput
                                    name="internalNotes"
                                    label="Internal Notes"
                                    placeholder=""
                                    minRows={4}
                                    showCount
                                    maxLength={250}
                                    removeEmoji
                                />
                            </Card>

                            <Flex gap={12} wrap="wrap">
                                {onIssuePO && (
                                    <Button
                                        type="primary"
                                        danger
                                        loading={isIssuingPO}
                                        disabled={isSubmitting || isIssuingPO}
                                        className="flex-1 sm:flex-none"
                                        onClick={async () => {
                                            const errors = await validateForm();
                                            if (Object.keys(errors).length > 0) {
                                                setTouched(setNestedObjectValues(errors, true));
                                                requestAnimationFrame(() => {
                                                    const firstError = document.querySelector('.ant-form-item-has-error, [data-form-error="true"]');
                                                    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                });
                                                return;
                                            }
                                            await onIssuePO(values, values.lineItems);
                                        }}
                                    >
                                        Issue PO
                                    </Button>
                                )}
                                <Button
                                    danger
                                    htmlType="submit"
                                    loading={isSubmitting}
                                    disabled={isSubmitting || isIssuingPO}
                                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f', background: '#fff' }}
                                    className="flex-1 sm:flex-none"
                                >
                                    Save Draft
                                </Button>
                                <Button
                                    danger
                                    onClick={onCancel}
                                    disabled={isSubmitting || isIssuingPO}
                                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f', background: '#fff' }}
                                    className="flex-1 sm:flex-none"
                                >Cancel</Button>
                            </Flex>
                        </Form>
                    );
                }}
            </Formik>
        </Card>
    );
};

export default NewPurchaseOrderForm;
