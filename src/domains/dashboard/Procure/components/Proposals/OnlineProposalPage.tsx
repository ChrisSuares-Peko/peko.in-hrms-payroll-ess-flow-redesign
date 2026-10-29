import React, { useState } from 'react';

import { FileTextOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Flex, Grid, Input, Layout, Result, Row, Select, Spin, Table, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Form, Formik } from 'formik';
import { useParams } from 'react-router-dom';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { usePublicProposal } from '../../hooks/usePublicProposal';
import { onlineProposalSchema } from '../../schema';
import ScrollToError from '../ScrollToError';

const { Title, Text } = Typography;

const GST_OPTIONS = [
    { value: '0', label: 'GST 0%' },
    { value: '5', label: 'GST 5%' },
    { value: '12', label: 'GST 12%' },
    { value: '18', label: 'GST 18%' },
    { value: '28', label: 'GST 28%' },
];

const GST_TYPE_OPTIONS = [
    { value: 'exclusive', label: 'Exclusive (GST added on top)' },
    { value: 'inclusive', label: 'Inclusive (GST included in price)' },
];

interface LineItem {
    key: string;
    rfqLineItemId: number;
    description: string;
    qty: number;
    unit: string;
    unitCost: string;
    estUnitCost: string;
    taxRate: string;
    gstType: 'inclusive' | 'exclusive';
}

const computeLineItemNet = (item: LineItem): number => {
    const qty = item.qty || 0;
    const unitCost = parseFloat(item.unitCost) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    const base = qty * unitCost;
    if (item.gstType === 'inclusive') return base;
    return base * (1 + taxRate / 100);
};

interface FormValues {
    validUntil: any;
    businessName: string;
    contactPerson: string;
    mobile: string;
    gstin: string;
    paymentTerms: string;
    deliveryTimeline: string;
    warranty: string;
    notesForBuyer: string;
    lineItems: LineItem[];
}

const formatDeadline = (dateStr: string) => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <Flex
        align="center"
        gap={12}
        style={{
            padding: '13px 13px',
            borderBottom: '0.37px solid #eaeaea',
            borderRadius: '22px 22px 0 0',
            background: '#fff',
        }}
    >
        <Flex
            align="center"
            justify="center"
            style={{ width: 37, height: 37, background: '#fff4f4', borderRadius: 10, flexShrink: 0 }}
        >
            <FileTextOutlined style={{ color: '#FF4F4F', fontSize: 16 }} />
        </Flex>
        <Flex vertical gap={2}>
            <Text style={{ fontWeight: 500, fontSize: 14, color: '#000', lineHeight: '1.186' }}>{title}</Text>
            {subtitle && (
                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 'normal' }}>{subtitle}</Text>
            )}
        </Flex>
    </Flex>
);

const OnlineProposalPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { data, isLoading, isInvalid, isExpired, isSubmitting: isApiSubmitting, isSubmitted, submitProposal } = usePublicProposal(token);
    const [attachments, setAttachments] = useState<UploadFile[]>([]);

    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    const handleAttachmentUpload = (file: File) => {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            message.error('Unsupported file type. Allowed: PDF, JPG, PNG.');
            return Upload.LIST_IGNORE;
        }
        return false;
    };

    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const CARD_STYLES = {
        style: { borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' as const },
        styles: { body: { padding: 0 } },
    };

    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    if (isLoading) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                <Spin size="large" tip="Loading RFQ details..." />
            </Flex>
        );
    }

    if (isInvalid) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                <Result status="404" title="Invalid Link" subTitle="This proposal link is invalid or does not exist." />
            </Flex>
        );
    }

    if (isExpired) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                <Result status="warning" title="Link Expired" subTitle="This proposal submission link has expired. Please contact the buyer for a new link." />
            </Flex>
        );
    }

    if (isSubmitted) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                <Result
                    status="success"
                    title="Proposal Submitted!"
                    subTitle={`Your proposal for ${data?.rfq.title} has been submitted successfully. The buyer will review and get back to you.`}
                />
            </Flex>
        );
    }

    const initialValues: FormValues = {
        validUntil: null,
        businessName: data?.vendor.businessName || '',
        contactPerson: data?.vendor.contactPerson || '',
        mobile: data?.vendor.phone || '',
        gstin: '',
        paymentTerms: data?.vendor.paymentTerms || '',
        deliveryTimeline: '',
        warranty: '',
        notesForBuyer: '',
        lineItems: data?.rfq.lineItems.map(item => ({
            key: String(item.id),
            rfqLineItemId: item.id,
            description: item.description,
            qty: parseFloat(item.qty),
            unit: item.unit,
            unitCost: '',
            estUnitCost: item.estUnitCost,
            taxRate: '0',
            gstType: 'exclusive' as const,
        })) ?? [],
    };

    return (
        <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={onlineProposalSchema}
            onSubmit={async (values) => {
                const convertedAttachments = await Promise.all(
                    attachments
                        .filter(f => f.originFileObj)
                        .map(async f => ({
                            fileName: f.name,
                            fileBase64: await toBase64(f.originFileObj as File),
                            fileFormat: f.name.split('.').pop()?.toLowerCase() ?? '',
                        }))
                );
                const proposalTotal = values.lineItems.reduce(
                    (sum, item) => sum + computeLineItemNet(item), 0
                );
                const success = await submitProposal({
                    submissionMode: 'Online',
                    totalAmount: proposalTotal,
                    validUntil: values.validUntil.format('YYYY-MM-DD'),
                    paymentTerms: values.paymentTerms,
                    businessName: values.businessName || undefined,
                    contactPerson: values.contactPerson || undefined,
                    contactEmail: data?.vendor.email || undefined,
                    contactMobile: values.mobile || undefined,
                    deliveryTimeline: values.deliveryTimeline || undefined,
                    warranty: values.warranty || undefined,
                    coverNote: values.notesForBuyer,
                    lineItems: values.lineItems.map(item => ({
                        rfqLineItemId: item.rfqLineItemId,
                        description: item.description,
                        unitPrice: parseFloat(item.unitCost),
                        qty: item.qty,
                        total: computeLineItemNet(item),
                        taxRate: parseFloat(item.taxRate) || 0,
                        gstType: item.gstType,
                    })),
                    ...(convertedAttachments.length > 0 && { pdfAttachment: convertedAttachments }),
                });
                if (!success) message.error('Failed to submit proposal. Please try again.');
            }}
        >
            {({ values, setFieldValue, errors, touched }) => {
                const proposalTotal = values.lineItems.reduce(
                    (sum, item) => sum + computeLineItemNet(item), 0
                );
                const cellStyle: React.CSSProperties = { fontSize: 14, fontWeight: 400, color: '#0a0a0a', verticalAlign: 'middle' };

                const hasLineItemError = Array.isArray(errors.lineItems) &&
                    (errors.lineItems as any[]).some((e: any) => e?.unitCost) &&
                    Array.isArray(touched.lineItems) &&
                    (touched.lineItems as any[]).some((t: any) => t?.unitCost);

                const lineItemColumns: ColumnsType<LineItem> = [
                    {
                        title: 'Item Name',
                        dataIndex: 'description',
                        key: 'description',
                        width: 200,
                        onCell: () => ({ style: cellStyle }),
                        render: (val: string) => (
                            <Text style={{ ...cellStyle, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {val}
                            </Text>
                        ),
                    },
                    {
                        title: 'Qty',
                        dataIndex: 'qty',
                        key: 'qty',
                        width: 60,
                        align: 'center' as const,
                        onCell: () => ({ style: cellStyle }),
                    },
                    {
                        title: 'Unit',
                        dataIndex: 'unit',
                        key: 'unit',
                        width: 60,
                        align: 'center' as const,
                        onCell: () => ({ style: cellStyle }),
                    },
                    {
                        title: 'Your Unit Price',
                        dataIndex: 'unitCost',
                        key: 'unitCost',
                        width: 130,
                        onCell: () => ({ style: cellStyle }),
                        render: (_: unknown, _record: LineItem, i: number) => (
                            <div className="[&_.ant-form-item]:!mb-0">
                                <TextInput
                                    name={`lineItems[${i}].unitCost`}
                                    type="text"
                                    placeholder="₹ 0"
                                    size="small"
                                    allowTwoDecimalsOnly
                                    inputMode="decimal"
                                />
                            </div>
                        ),
                    },
                    {
                        title: 'GST Rate',
                        key: 'taxRate',
                        width: 120,
                        onCell: () => ({ style: cellStyle }),
                        render: (_: unknown, _record: LineItem, i: number) => (
                            <Select
                                value={values.lineItems[i]?.taxRate ?? '0'}
                                onChange={val => setFieldValue(`lineItems[${i}].taxRate`, val)}
                                options={GST_OPTIONS}
                                size="small"
                                style={{ width: '100%', minWidth: 100 }}
                            />
                        ),
                    },
                    {
                        title: 'GST Type',
                        key: 'gstType',
                        width: 120,
                        onCell: () => ({ style: cellStyle }),
                        render: (_: unknown, _record: LineItem, i: number) => (
                            <Select
                                value={values.lineItems[i]?.gstType ?? 'exclusive'}
                                onChange={val => setFieldValue(`lineItems[${i}].gstType`, val)}
                                options={GST_TYPE_OPTIONS}
                                size="small"
                                style={{ width: '100%', minWidth: 100 }}
                            />
                        ),
                    },
                    {
                        title: 'Net Amount',
                        key: 'total',
                        width: 110,
                        align: 'right' as const,
                        onCell: () => ({ style: { ...cellStyle, fontWeight: 600 } }),
                        render: (_: unknown, record: LineItem) => (
                            <Text style={{ color: '#0a0a0a', fontWeight: 600 }}>
                                ₹{computeLineItemNet(record).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        ),
                    },
                ];

                const fieldLabel = (label: string, required?: boolean) => (
                    <Text style={{ fontWeight: 500, fontSize: 14, color: '#475569' }}>
                        {label}{required && <span style={{ color: '#FF4F4F' }}> *</span>}
                    </Text>
                );

                return (
                    <Form>
                        <ScrollToError />
                        <Layout style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                            <Layout.Content style={{ padding: isMobile ? '24px 16px' : '32px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
                                {/* Page heading */}
                                <Flex vertical gap={8} align="center" style={{ textAlign: 'center', marginBottom: 28 }}>
                                    <Title level={isMobile ? 4 : 3} style={{ margin: 0, fontWeight: 500 }}>Submit your proposal</Title>
                                    <Text style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', maxWidth: 600 }}>
                                        {'You\'ve been invited to quote for '}
                                        <Text style={{ fontSize: 15, fontWeight: 500, color: 'rgba(0,0,0,0.65)' }}>
                                            {data?.rfq.title ?? 'the buyer'}
                                        </Text>
                                        {' — review the scope below, enter your quote, and submit.'}
                                    </Text>
                                    {data?.rfq.submissionDeadline && (
                                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>
                                            Submission deadline: {formatDeadline(data.rfq.submissionDeadline)}
                                        </Text>
                                    )}
                                </Flex>

                                <Row gutter={[24, 24]} align="top">
                                    <Col xs={24} lg={16}>
                                        <Flex vertical gap={20}>
                                            {/* ── Your Details ── */}
                                            <Card {...CARD_STYLES}>
                                                <SectionHeader
                                                    title="Your Details"
                                                    subtitle="The buyer will use this information to verify and contact you."
                                                />
                                                <Flex vertical gap={22} style={{ padding: isMobile ? '16px' : '25px' }}>
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Business Name', true)}
                                                                <TextInput
                                                                    name="businessName"
                                                                    type="text"
                                                                    placeholder="Your business name"
                                                                    formItemClass="!mb-0"
                                                                />
                                                            </Flex>
                                                        </Col>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Contact Person', true)}
                                                                <TextInput
                                                                    name="contactPerson"
                                                                    type="text"
                                                                    placeholder="Full name of the person submitting this quote"
                                                                    formItemClass="!mb-0"
                                                                />
                                                            </Flex>
                                                        </Col>
                                                    </Row>
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Email Address')}
                                                                <Input
                                                                    value={data?.vendor.email}
                                                                    readOnly
                                                                    style={{ background: '#f5f5f5', borderColor: '#d9d9d9', borderRadius: 8 }}
                                                                />
                                                            </Flex>
                                                        </Col>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Mobile Number', true)}
                                                                <TextInput
                                                                    name="mobile"
                                                                    type="text"
                                                                    placeholder="10-digit mobile number"
                                                                    formItemClass="!mb-0"
                                                                    inputMode="tel"
                                                                    maxLength={10}
                                                                    allowNumbersOnly
                                                                />
                                                            </Flex>
                                                        </Col>
                                                    </Row>
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('GSTIN (optional)')}
                                                                <TextInput
                                                                    name="gstin"
                                                                    type="text"
                                                                    placeholder="15-character GSTIN (if registered)"
                                                                    formItemClass="!mb-0"
                                                                />
                                                            </Flex>
                                                        </Col>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Quote Valid Until', true)}
                                                                <DatePicker
                                                                    style={{ width: '100%', borderRadius: 8 }}
                                                                    status={touched.validUntil && errors.validUntil ? 'error' : undefined}
                                                                    value={values.validUntil}
                                                                    onChange={val => setFieldValue('validUntil', val)}
                                                                />
                                                                {touched.validUntil && errors.validUntil && (
                                                                    <Text style={{ color: '#ff4d4f', fontSize: 12 }}>{errors.validUntil as string}</Text>
                                                                )}
                                                            </Flex>
                                                        </Col>
                                                    </Row>
                                                </Flex>
                                            </Card>

                                            {/* ── Quote These Items ── */}
                                            <Card {...CARD_STYLES}>
                                                <Flex
                                                    vertical={isMobile}
                                                    justify="space-between"
                                                    align={isMobile ? 'flex-start' : 'center'}
                                                    gap={isMobile ? 10 : 12}
                                                    style={{ padding: isMobile ? '12px' : '13px', borderBottom: '0.37px solid #eaeaea', background: '#fff' }}
                                                >
                                                    <Flex align="center" gap={12}>
                                                        <Flex
                                                            align="center"
                                                            justify="center"
                                                            style={{ width: 37, height: 37, background: '#fff4f4', borderRadius: 10, flexShrink: 0 }}
                                                        >
                                                            <FileTextOutlined style={{ color: '#FF4F4F', fontSize: 16 }} />
                                                        </Flex>
                                                        <Flex vertical gap={2}>
                                                            <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>Quote These Items</Text>
                                                            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                                Enter your unit price for each item. Totals update as you type.
                                                            </Text>
                                                        </Flex>
                                                    </Flex>
                                                    <Flex gap={16} align="center" style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
                                                        <Flex vertical gap={2} align="flex-end">
                                                            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>Your Quote Total</Text>
                                                            <Text style={{ fontSize: 14, color: '#000', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                ₹{Number(proposalTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </Text>
                                                        </Flex>
                                                    </Flex>
                                                </Flex>
                                                <div style={{ padding: '16px' }}>
                                                    <div
                                                        style={{
                                                            border: `1px solid ${hasLineItemError ? '#ff4d4f' : '#e6e6e6'}`,
                                                            borderRadius: 16,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <Table
                                                            columns={lineItemColumns}
                                                            dataSource={values.lineItems}
                                                            rowKey="key"
                                                            pagination={false}
                                                            size="small"
                                                            scroll={{ x: 900 }}
                                                            style={{ borderRadius: 0 }}
                                                            components={{
                                                                header: {
                                                                    cell: (props: any) => (
                                                                        <th
                                                                            {...props}
                                                                            style={{
                                                                                ...props.style,
                                                                                background: '#fcfcfc',
                                                                                borderBottom: '1px solid #e6e6e6',
                                                                                fontSize: 12,
                                                                                fontWeight: 500,
                                                                                color: '#999',
                                                                            }}
                                                                        />
                                                                    ),
                                                                },
                                                            }}
                                                        />
                                                    </div>

                                                </div>
                                            </Card>

                                            {/* ── Commercial Terms ── */}
                                            <Card {...CARD_STYLES}>
                                                <SectionHeader title="Commercial Terms" />
                                                <Flex vertical gap={22} style={{ padding: isMobile ? '16px' : '25px' }}>
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Payment Terms', true)}
                                                                <Select
                                                                    value={values.paymentTerms || undefined}
                                                                    onChange={val => setFieldValue('paymentTerms', val)}
                                                                    placeholder="Select payment terms"
                                                                    style={{ width: '100%' }}
                                                                    status={touched.paymentTerms && errors.paymentTerms ? 'error' : undefined}
                                                                    options={[
                                                                        { label: 'Advance', value: 'Advance' },
                                                                        { label: 'On Delivery', value: 'On Delivery' },
                                                                        { label: 'Net 15', value: 'Net 15' },
                                                                        { label: 'Net 30', value: 'Net 30' },
                                                                        { label: 'Net 45', value: 'Net 45' },
                                                                        { label: 'Net 60', value: 'Net 60' },
                                                                    ]}
                                                                />
                                                                {touched.paymentTerms && errors.paymentTerms && (
                                                                    <Text style={{ color: '#ff4d4f', fontSize: 12 }}>{errors.paymentTerms as string}</Text>
                                                                )}
                                                            </Flex>
                                                        </Col>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Delivery Timeline', true)}
                                                                <TextInput
                                                                    name="deliveryTimeline"
                                                                    type="text"
                                                                    placeholder="e.g. 2 weeks from PO, or specific date"
                                                                    formItemClass="!mb-0"
                                                                />
                                                            </Flex>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col xs={24}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Warranty / Support (optional)')}
                                                                <TextAreaInput
                                                                    name="warranty"
                                                                    placeholder="e.g. 1 year on-site warranty, included support"
                                                                    minRows={3}
                                                                />
                                                            </Flex>
                                                        </Col>
                                                    </Row>
                                                </Flex>
                                            </Card>

                                            {/* ── Additional Information ── */}
                                            <Card {...CARD_STYLES}>
                                                <SectionHeader title="Additional Information" />
                                                <Flex vertical gap={22} style={{ padding: isMobile ? '16px' : '25px' }}>
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Notes for Buyer (optional)')}
                                                                <TextAreaInput
                                                                    name="notesForBuyer"
                                                                    placeholder="Add any clarification, assumptions, or context for your quote. (optional)"
                                                                    minRows={5}
                                                                />
                                                            </Flex>
                                                        </Col>
                                                        <Col xs={24} sm={12}>
                                                            <Flex vertical gap={10}>
                                                                {fieldLabel('Proposal Documents (optional)')}
                                                                <Flex gap={12} align="center">
                                                                    <Upload
                                                                        multiple
                                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                                        fileList={attachments}
                                                                        beforeUpload={handleAttachmentUpload}
                                                                        showUploadList={false}
                                                                        onChange={({ fileList: fl }) => setAttachments(fl)}
                                                                    >
                                                                        <Button
                                                                            icon={<UploadOutlined />}
                                                                            style={{ borderRadius: 8, height: 32, flexShrink: 0 }}
                                                                        >
                                                                            Click to Upload
                                                                        </Button>
                                                                    </Upload>
                                                                    <Text style={{ fontSize: 11, color: '#475569', opacity: 0.6, lineHeight: '16px' }}>
                                                                        PDF, DOC, JPG, PNG. Max 10MB per file. Up to 5 files.
                                                                    </Text>
                                                                </Flex>
                                                                {attachments.map((file, i) => (
                                                                    <Flex
                                                                        key={i}
                                                                        align="center"
                                                                        gap={8}
                                                                        style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8, padding: '6px 12px' }}
                                                                    >
                                                                        <PaperClipOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />
                                                                        <Text style={{ color: 'rgba(0,0,0,0.85)', fontSize: 14, flex: 1, wordBreak: 'break-all' }}>{file.name}</Text>
                                                                        <button
                                                                            type="button"
                                                                            style={{ color: 'rgba(0,0,0,0.25)', cursor: 'pointer', fontSize: 16, background: 'none', border: 'none', padding: 0, lineHeight: 1 }}
                                                                            onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                                            aria-label="Remove file"
                                                                        >×</button>
                                                                    </Flex>
                                                                ))}
                                                            </Flex>
                                                        </Col>
                                                    </Row>
                                                </Flex>
                                            </Card>

                                            {/* ── Submit ── */}
                                            <Flex vertical gap={10} style={{ paddingBottom: 48 }}>
                                                <Button
                                                    type="primary"
                                                    danger
                                                    loading={isApiSubmitting}
                                                    htmlType="submit"
                                                    style={{ height: 40, fontSize: 15, fontWeight: 500, borderRadius: 8, width: isMobile ? '100%' : 'fit-content', padding: '0 24px' }}
                                                >
                                                    Submit Proposal
                                                </Button>
                                                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                    Once you submit, the buyer will be notified and your proposal will appear in their review queue.
                                                </Text>
                                            </Flex>
                                        </Flex>
                                    </Col>

                                    {/* ── Sidebar ── */}
                                    <Col xs={24} lg={8}>
                                        <Flex vertical gap={16} style={isMobile ? undefined : { position: 'sticky', top: 24 }}>

                                            {/* Business Details */}
                                            <Card style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                                                <div style={{ padding: '23px 24px 22px', borderBottom: '0.37px solid #eaeaea' }}>
                                                    <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>Business details</Text>
                                                </div>
                                                <Flex vertical gap={20} style={{ padding: '24px' }}>
                                                    {[
                                                        { label: 'Name', value: data?.company?.name },
                                                        { label: 'Address', value: data?.company?.address },
                                                        { label: 'Email', value: data?.company?.email },
                                                        { label: 'Phone number', value: data?.company?.phone },
                                                        { label: 'GSTIN', value: data?.company?.gstin },
                                                    ].map(row => (
                                                        <Flex key={row.label} justify="space-between" align="center" gap={12}>
                                                            <Text style={{ color: '#969696', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{row.label}</Text>
                                                            <Text style={{ color: '#070707', fontSize: 14, fontWeight: 500, textAlign: 'right' }}>{row.value ?? '—'}</Text>
                                                        </Flex>
                                                    ))}
                                                </Flex>
                                            </Card>

                                            {/* RFQ Snapshot */}
                                            <Card style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                                                <div style={{ padding: '23px 24px 22px', borderBottom: '0.37px solid #eaeaea' }}>
                                                    <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>RFQ Snapshot</Text>
                                                </div>
                                                <Flex vertical gap={20} style={{ padding: '24px' }}>
                                                    {[
                                                        { label: 'Buyer', value: data?.rfq.title ? data.rfq.title.split('—')[0]?.trim() : '—' },
                                                        { label: 'RFQ Title', value: data?.rfq.title ?? '—' },
                                                        { label: 'Requested Items', value: String(data?.rfq.lineItems.length ?? 0) },
                                                    ].map(row => (
                                                        <Flex key={row.label} justify="space-between" align="center" gap={12}>
                                                            <Text style={{ color: '#969696', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{row.label}</Text>
                                                            <Text style={{ color: '#070707', fontSize: 14, fontWeight: 500, textAlign: 'right' }}>{row.value}</Text>
                                                        </Flex>
                                                    ))}
                                                    <div style={{ height: 1, background: '#eaeaea' }} />
                                                    <Flex justify="space-between" align="center" gap={12}>
                                                        <Text style={{ color: '#969696', fontSize: 12, fontWeight: 500 }}>Reference</Text>
                                                        <Text style={{ color: '#969696', fontSize: 12, fontWeight: 500 }}>{data?.rfq.refNumber ?? '—'}</Text>
                                                    </Flex>
                                                </Flex>
                                            </Card>

                                            {/* Terms & Timeline */}
                                            <Card style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }} styles={{ body: { padding: '24px' } }}>
                                                <Title level={5} style={{ margin: '0 0 8px' }}>Terms &amp; Timeline</Title>
                                                <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: 14, lineHeight: '22px', display: 'block', marginBottom: data?.rfq.buyerNotes ? 16 : 0, whiteSpace: 'pre-wrap' }}>
                                                    {data?.rfq.termsAndConditions || 'N/A'}
                                                </Text>
                                                {data?.rfq.buyerNotes && (
                                                    <Card
                                                        style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12 }}
                                                        styles={{ body: { padding: 16 } }}
                                                    >
                                                        <Title level={5} style={{ margin: '0 0 6px', fontSize: 14 }}>Buyer Notes</Title>
                                                        <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{data.rfq.buyerNotes}</Text>
                                                    </Card>
                                                )}
                                            </Card>

                                            {/* RFQ Documents */}
                                            {(data?.rfq.attachments?.length ?? 0) > 0 && (
                                                <Card style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }} styles={{ body: { padding: '24px' } }}>
                                                    <Title level={5} style={{ margin: '0 0 16px' }}>RFQ Documents</Title>
                                                    <Flex vertical gap={10}>
                                                        {data!.rfq.attachments?.map((doc, i) => (
                                                            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                                <Card
                                                                    style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, cursor: 'pointer' }}
                                                                    styles={{ body: { padding: '12px 16px' } }}
                                                                >
                                                                    <Flex align="center" gap={10}>
                                                                        <PaperClipOutlined style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)' }} />
                                                                        <Text style={{ color: 'rgba(0,0,0,0.85)', fontSize: 14, fontWeight: 500 }}>{doc.fileName}</Text>
                                                                    </Flex>
                                                                </Card>
                                                            </a>
                                                        ))}
                                                    </Flex>
                                                </Card>
                                            )}

                                        </Flex>
                                    </Col>

                                </Row>
                            </Layout.Content>
                        </Layout>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default OnlineProposalPage;
