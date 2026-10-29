import React, { useState } from 'react';

import { DownloadOutlined, FileTextOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Flex, Grid, Layout, Result, Row, Spin, Table, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Form, Formik } from 'formik';
import { useParams } from 'react-router-dom';
import * as Yup from 'yup';


import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { usePublicPO } from '../../hooks/usePublicPO';
import ScrollToError from '../ScrollToError';

const { Title, Text } = Typography;

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <Flex
        align="center"
        gap={12}
        style={{ padding: '13px 13px', borderBottom: '0.37px solid #eaeaea', borderRadius: '22px 22px 0 0', background: '#fff' }}
    >
        <Flex align="center" justify="center" style={{ width: 37, height: 37, background: '#fff4f4', borderRadius: 10, flexShrink: 0 }}>
            <FileTextOutlined style={{ color: '#FF4F4F', fontSize: 16 }} />
        </Flex>
        <Flex vertical gap={2}>
            <Text style={{ fontWeight: 500, fontSize: 14, color: '#000', lineHeight: '1.186' }}>{title}</Text>
            {subtitle && <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 'normal' }}>{subtitle}</Text>}
        </Flex>
    </Flex>
);

const ReadOnlyField: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <Flex vertical gap={10}>
        <Text style={{ fontWeight: 500, fontSize: 14, color: '#475569' }}>{label}</Text>
        <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 8, border: '1px solid #d9d9d9', fontSize: 12, color: 'rgba(0,0,0,0.85)', minHeight: 34 }}>
            {value || '—'}
        </div>
    </Flex>
);

const acknowledgeSchema = Yup.object({
    invoiceNumber: Yup.string().required('Invoice number is required'),
    invoiceAmount: Yup.string().required('Invoice amount is required'),
    invoiceDate: Yup.mixed().required('Invoice date is required'),
    notesForBuyer: Yup.string(),
    bankAccountHolder: Yup.string().required('Account holder name is required'),
    bankName: Yup.string().required('Bank name is required'),
    accountNumber: Yup.string()
        .required('Account number is required')
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number cannot exceed 18 digits')
        .matches(/^\d+$/, 'Account number must contain digits only'),
    ifsc: Yup.string()
        .required('IFSC is required')
        .min(11, 'IFSC code must be 11 characters')
        .max(11, 'IFSC code cannot exceed 11 characters')
        .matches(/^[A-Z0-9]*$/, 'IFSC code must be alphanumeric and uppercase')
        .test(
            'valid-ifsc',
            'Enter a valid IFSC code (e.g. SBIN0001234)',
            value => !value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)
        ),
});

interface LineItem {
    key: string;
    description: string;
    qty: string;
    unit: string;
    unitPrice: string;
    total: string;
    taxRate?: string;
    gstType?: 'inclusive' | 'exclusive';
}

const OnlinePOAcknowledgePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { data, isLoading, isInvalid, isExpired, isAcknowledged, isSubmitting, isSubmitted, isDownloadingPdf, acknowledgePO, downloadPdf } = usePublicPO(token);
    const [invoiceFile, setInvoiceFile] = useState<UploadFile | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

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
                <Spin size="large" tip="Loading Purchase Order details..." />
            </Flex>
        );
    }

    if (isInvalid) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                <Result status="404" title="Invalid Link" subTitle="This PO acknowledgement link is invalid or does not exist." />
            </Flex>
        );
    }

    if (isExpired) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                <Result status="warning" title="Link Expired" subTitle="This link has expired. Please contact the buyer for assistance." />
            </Flex>
        );
    }

    if (isSubmitted || isAcknowledged) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                <Result
                    status="success"
                    title="Purchase Order Acknowledged!"
                    subTitle={`You have successfully acknowledged ${data?.po.refNumber ?? 'the Purchase Order'}. The buyer has been notified and will initiate payment.`}
                />
            </Flex>
        );
    }

    const sym = CURRENCY_SYMBOLS[(data?.po.currency ?? 'INR').toUpperCase()] ?? '₹';
    const buyerName = data?.buyer.companyName || null;

    const lineItemRows: LineItem[] = (data?.po.lineItems ?? []).map(item => ({
        key: String(item.id),
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
        taxRate: item.taxRate,
        gstType: item.gstType,
    }));

    const computeLineNet = (item: { qty: string; unitPrice: string; total: string; taxRate?: string; gstType?: string }) => {
        if (item.taxRate != null && item.gstType) {
            const base = Number(item.qty) * Number(item.unitPrice);
            return item.gstType === 'inclusive' ? base : base * (1 + Number(item.taxRate) / 100);
        }
        return parseFloat(item.total || '0');
    };

    const totalPayable = (data?.po.lineItems ?? []).reduce((sum, item) => sum + computeLineNet(item), 0);

    const lineItemColumns: ColumnsType<LineItem> = [
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (val: string) => (
                <Text style={{ fontSize: 13, display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {val}
                </Text>
            ),
        },
        { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 60, align: 'center' as const },
        { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 60, align: 'center' as const },
        {
            title: 'Est. Unit Cost',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            width: 110,
            align: 'right' as const,
            render: (val: string) => `${sym} ${Number(val).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
        },
        {
            title: 'GST Rate',
            dataIndex: 'taxRate',
            key: 'taxRate',
            width: 90,
            align: 'center' as const,
            render: (val?: string) => (
                <Text style={{ fontSize: 12, color: '#475569' }}>
                    {val != null && val !== '' ? `GST ${parseInt(val, 10)}%` : '—'}
                </Text>
            ),
        },
        {
            title: 'GST Type',
            dataIndex: 'gstType',
            key: 'gstType',
            width: 100,
            align: 'center' as const,
            render: (val?: string) => (
                <Text style={{ fontSize: 12, color: '#475569' }}>
                    {{ inclusive: 'Inclusive', exclusive: 'Exclusive' }[val ?? ''] ?? '—'}
                </Text>
            ),
        },
        {
            title: 'Net Amount',
            key: 'total',
            width: 110,
            align: 'right' as const,
            render: (_: unknown, record: LineItem) => {
                const net = computeLineNet(record as any);
                return <Text style={{ fontWeight: 600 }}>{`${sym}${net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>;
            },
        },
    ];

    const fieldLabel = (label: string, required?: boolean) => (
        <Text style={{ fontWeight: 500, fontSize: 14, color: '#475569' }}>
            {label}{required && <span style={{ color: '#FF4F4F' }}> *</span>}
        </Text>
    );

    return (
        <Formik
            initialValues={{
                invoiceNumber: '',
                invoiceAmount: data?.po.totalAmount ?? '',
                invoiceDate: null as any,
                notesForBuyer: '',
                bankAccountHolder: '',
                bankName: '',
                accountNumber: '',
                ifsc: '',
            }}
            enableReinitialize
            validationSchema={acknowledgeSchema}
            onSubmit={async (values) => {
                let invoiceFilePayload;
                if (invoiceFile?.originFileObj) {
                    const base64 = await toBase64(invoiceFile.originFileObj as File);
                    invoiceFilePayload = {
                        fileName: invoiceFile.name,
                        fileBase64: base64,
                        fileFormat: invoiceFile.name.split('.').pop()?.toLowerCase() ?? '',
                    };
                }

                const success = await acknowledgePO({
                    invoiceNumber: values.invoiceNumber,
                    invoiceAmount: values.invoiceAmount,
                    invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
                    notesForBuyer: values.notesForBuyer,
                    bankAccountHolder: values.bankAccountHolder,
                    bankName: values.bankName,
                    accountNumber: values.accountNumber,
                    ifsc: values.ifsc,
                    ...(invoiceFilePayload && { invoiceFile: invoiceFilePayload }),
                });
                if (!success) message.error('Failed to acknowledge PO. Please try again.');
            }}
        >
            {({ values, setFieldValue, errors, touched, validateForm, submitForm }) => (
                <Form>
                    <ScrollToError />
                    <Layout style={{ minHeight: '100vh', background: '#f8f8f8' }}>
                        <Layout.Content style={{ padding: isMobile ? '24px 16px' : '32px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

                            {/* Page heading */}
                            <Flex vertical gap={8} align="center" style={{ textAlign: 'center', marginBottom: 28 }}>
                                <Title level={isMobile ? 4 : 3} style={{ margin: 0, fontWeight: 500 }}>Acknowledge Purchase Order</Title>
                                <Text style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', maxWidth: 629 }}>
                                    <Text style={{ fontSize: 15, fontWeight: 500, color: 'rgba(0,0,0,0.65)' }}>{buyerName ?? 'The buyer'}</Text>
                                    {' has issued '}
                                    <Text style={{ fontSize: 15, fontWeight: 500, color: 'rgba(0,0,0,0.65)' }}>{data?.po.refNumber ?? ''}</Text>
                                    {' to you. Review the order, attach your invoice, and confirm your bank details to receive payment.'}
                                </Text>
                                {data?.rfq?.title && (
                                    <Text style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>{data.rfq.title}</Text>
                                )}
                            </Flex>

                            <Row gutter={[20, 20]} align="top">
                                <Col xs={24} lg={16}>
                                    <Flex vertical gap={20}>

                                        {/* ── PO Details (read-only) ── */}
                                        <Card {...CARD_STYLES}>
                                            <SectionHeader title="PO Details" subtitle="Details of the order issued to you. These fields are read-only." />
                                            <Flex vertical gap={22} style={{ padding: isMobile ? '16px' : '25px' }}>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12}><ReadOnlyField label="Buyer" value={buyerName} /></Col>
                                                    <Col xs={24} sm={12}><ReadOnlyField label="PO Reference" value={data?.po.refNumber} /></Col>
                                                </Row>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12}><ReadOnlyField label="Total Amount" value={data?.po.totalAmount ? `${sym}${Number(data.po.totalAmount).toLocaleString('en-IN')}` : undefined} /></Col>
                                                    <Col xs={24} sm={12}><ReadOnlyField label="Payment Terms" value={data?.po.paymentTerms} /></Col>
                                                </Row>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12}><ReadOnlyField label="Delivery Date" value={data?.po.deliveryDate ? formatDate(data.po.deliveryDate) : undefined} /></Col>
                                                    <Col xs={24} sm={12}><ReadOnlyField label="Delivery Address" value={data?.po.deliveryAddress} /></Col>
                                                </Row>
                                            </Flex>
                                        </Card>

                                        {/* ── Line Items (read-only) ── */}
                                        <Card {...CARD_STYLES}>
                                            <SectionHeader title="Line Items" subtitle="These are the line items issued in the purchase order." />
                                            <div style={{ padding: '16px' }}>
                                                <div style={{ border: '1px solid #e6e6e6', borderRadius: 16, overflow: 'hidden' }}>
                                                    <Table
                                                        columns={lineItemColumns}
                                                        dataSource={lineItemRows}
                                                        rowKey="key"
                                                        pagination={false}
                                                        size="small"
                                                        scroll={{ x: 'max-content' }}
                                                        style={{ borderRadius: 0 }}
                                                        components={{
                                                            header: {
                                                                cell: (props: any) => (
                                                                    <th {...props} style={{ ...props.style, background: '#fcfcfc', borderBottom: '1px solid #e6e6e6', fontSize: 12, fontWeight: 500, color: '#999' }} />
                                                                ),
                                                            },
                                                        }}
                                                        summary={() => (
                                                            <Table.Summary.Row>
                                                                <Table.Summary.Cell index={0} colSpan={6} align="right">
                                                                    <Text style={{ fontWeight: 600, fontSize: 12, color: '#1e293b' }}>Total Payable</Text>
                                                                </Table.Summary.Cell>
                                                                <Table.Summary.Cell index={1} align="right">
                                                                    <Text style={{ fontWeight: 600, fontSize: 14, color: '#ff4f4f' }}>{`${sym}${totalPayable.toLocaleString('en-IN')}`}</Text>
                                                                </Table.Summary.Cell>
                                                            </Table.Summary.Row>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </Card>

                                        {/* ── Acknowledge & Submit Invoice ── */}
                                        <Card {...CARD_STYLES}>
                                            <SectionHeader
                                                title="Acknowledge & Submit Invoice"
                                                subtitle="Confirm receipt of this PO by attaching your invoice. The buyer is notified the moment you submit."
                                            />
                                            <Flex vertical gap={22} style={{ padding: isMobile ? '16px' : '25px' }}>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Invoice Number', true)}
                                                            <TextInput name="invoiceNumber" type="text" placeholder="e.g. INV-2026-104" formItemClass="!mb-0" />
                                                        </Flex>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Invoice Amount', true)}
                                                            <TextInput name="invoiceAmount" type="text" placeholder={`${sym}0`} formItemClass="!mb-0" allowTwoDecimalsOnly inputMode="decimal" />
                                                        </Flex>
                                                    </Col>
                                                </Row>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Invoice Date', true)}
                                                            <DatePicker
                                                                style={{ width: '100%', borderRadius: 8 }}
                                                                status={touched.invoiceDate && errors.invoiceDate ? 'error' : undefined}
                                                                value={values.invoiceDate}
                                                                onChange={val => setFieldValue('invoiceDate', val)}
                                                            />
                                                            {touched.invoiceDate && errors.invoiceDate && (
                                                                <Text style={{ color: '#ff4d4f', fontSize: 12 }}>{errors.invoiceDate as string}</Text>
                                                            )}
                                                        </Flex>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Invoice File', true)}
                                                            <Flex gap={8} align="center">
                                                                <Upload
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                    maxCount={1}
                                                                    fileList={invoiceFile ? [invoiceFile] : []}
                                                                    beforeUpload={() => false}
                                                                    showUploadList={false}
                                                                    onChange={({ fileList }) => setInvoiceFile(fileList[0] ?? null)}
                                                                >
                                                                    <Button icon={<UploadOutlined />} style={{ borderRadius: 8, height: 32, flexShrink: 0 }}>
                                                                        Click to Upload
                                                                    </Button>
                                                                </Upload>
                                                                <Flex vertical gap={2}>
                                                                    <Text style={{ fontSize: 13, color: '#475569' }}>Attach your tax invoice for this PO.</Text>
                                                                    <Text style={{ fontSize: 11, color: '#475569', opacity: 0.5 }}>PDF or image. Max 10MB</Text>
                                                                </Flex>
                                                            </Flex>
                                                            {invoiceFile && (
                                                                <Flex align="center" gap={8} style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8, padding: '6px 12px' }}>
                                                                    <PaperClipOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />
                                                                    <Text style={{ flex: 1, fontSize: 13, wordBreak: 'break-all' }}>{invoiceFile.name}</Text>
                                                                    <button
                                                                        type="button"
                                                                        style={{ color: 'rgba(0,0,0,0.25)', cursor: 'pointer', fontSize: 16, background: 'none', border: 'none', padding: 0, lineHeight: 1 }}
                                                                        onClick={() => setInvoiceFile(null)}
                                                                        aria-label="Remove file"
                                                                    >×</button>
                                                                </Flex>
                                                            )}
                                                        </Flex>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col xs={24}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Notes for Buyer (optional)')}
                                                            <TextAreaInput name="notesForBuyer" placeholder="Any additional context for the buyer about this invoice." minRows={3} />
                                                        </Flex>
                                                    </Col>
                                                </Row>
                                            </Flex>
                                        </Card>

                                        {/* ── Bank Account Details ── */}
                                        <Card {...CARD_STYLES}>
                                            <SectionHeader
                                                title="Bank Account Details"
                                                subtitle="Required so the buyer can release payment to the correct account."
                                            />
                                            <Flex vertical gap={22} style={{ padding: isMobile ? '16px' : '25px' }}>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Account Holder Name', true)}
                                                            <TextInput name="bankAccountHolder" type="text" placeholder="e.g. Rashi Peripherals" formItemClass="!mb-0" />
                                                        </Flex>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Bank Name', true)}
                                                            <TextInput name="bankName" type="text" placeholder="e.g. HDFC Bank" formItemClass="!mb-0" />
                                                        </Flex>
                                                    </Col>
                                                </Row>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('Account Number', true)}
                                                            <TextInput name="accountNumber" type="text" placeholder="9 to 18 digits account number" formItemClass="!mb-0" inputMode="numeric" maxLength={18} />
                                                        </Flex>
                                                    </Col>
                                                    <Col xs={24} sm={12}>
                                                        <Flex vertical gap={10}>
                                                            {fieldLabel('IFSC', true)}
                                                            <TextInput name="ifsc" type="text" placeholder="11-character IFSC (e.g. SBIN0001234)" formItemClass="!mb-0" allowUpperCaseOnly maxLength={11} />
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
                                                loading={isSubmitting}
                                                style={{ height: 40, fontSize: 15, fontWeight: 500, borderRadius: 8, width: isMobile ? '100%' : 'fit-content', padding: '0 24px' }}
                                                onClick={async () => {
                                                    const errs = await validateForm();
                                                    if (Object.keys(errs).length === 0) {
                                                        setConfirmOpen(true);
                                                    } else {
                                                        submitForm();
                                                    }
                                                }}
                                            >
                                                Acknowledge & Submit Invoice
                                            </Button>
                                            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                Once you submit, the buyer will be notified and will initiate payment to the bank account above.
                                            </Text>
                                        </Flex>

                                        <ConfirmationModal
                                            isOpen={confirmOpen}
                                            title="Are you sure you want to confirm this PO?"
                                            handleSubmit={() => {
                                                setConfirmOpen(false);
                                                submitForm();
                                            }}
                                            handleCancel={() => setConfirmOpen(false)}
                                            isLoading={isSubmitting}
                                        />
                                    </Flex>
                                </Col>

                                {/* ── Sidebar ── */}
                                <Col xs={24} lg={8}>
                                    <Flex vertical gap={16} style={isMobile ? undefined : { position: 'sticky', top: 24 }}>

                                        {/* Order Snapshot */}
                                        <Card style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                                            <div style={{ padding: '23px 24px 22px', borderBottom: '0.37px solid #eaeaea' }}>
                                                <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>Order Snapshot</Text>
                                            </div>
                                            <Flex vertical gap={20} style={{ padding: '24px' }}>
                                                {[
                                                    { label: 'Buyer', value: buyerName ?? '—' },
                                                    { label: 'Vendor', value: data?.vendor.businessName ?? '—' },
                                                    { label: 'Line Items', value: String(data?.po.lineItems?.length ?? 0) },
                                                    { label: 'Total payable', value: data?.po.totalAmount ? `${sym}${Number(data.po.totalAmount).toLocaleString('en-IN')}` : '—' },
                                                    { label: 'Payment Terms', value: data?.po.paymentTerms ?? '—' },
                                                    { label: 'Delivery Date', value: data?.po.deliveryDate ? formatDate(data.po.deliveryDate) : '—' },
                                                ].map(row => (
                                                    <Flex key={row.label} justify="space-between" align="center" gap={12}>
                                                        <Text style={{ color: '#969696', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{row.label}</Text>
                                                        <Text style={{ color: '#070707', fontSize: 14, fontWeight: 500, textAlign: 'right' }}>{row.value}</Text>
                                                    </Flex>
                                                ))}
                                                <div style={{ height: 1, background: '#eaeaea' }} />
                                                <Flex justify="space-between" align="center" gap={12}>
                                                    <Text style={{ color: '#969696', fontSize: 12, fontWeight: 500 }}>Reference</Text>
                                                    <Text style={{ color: '#969696', fontSize: 12, fontWeight: 500 }}>{data?.po.refNumber ?? '—'}</Text>
                                                </Flex>
                                            </Flex>
                                        </Card>

                                        {/* Notes from Buyer */}
                                        {data?.po.notesToVendor && (
                                            <Card style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                                                <div style={{ padding: '23px 24px 22px', borderBottom: '0.37px solid #eaeaea' }}>
                                                    <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>Notes from Buyer</Text>
                                                </div>
                                                <div style={{ padding: '24px' }}>
                                                    <Text style={{ color: '#969696', fontSize: 14, fontWeight: 500, lineHeight: '20px' }}>
                                                        {data.po.notesToVendor}
                                                    </Text>
                                                </div>
                                            </Card>
                                        )}

                                        {/* PO Document */}
                                        <Card style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                                            <div style={{ padding: '23px 24px 22px', borderBottom: '0.37px solid #eaeaea' }}>
                                                <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>PO Document</Text>
                                            </div>
                                            <div style={{ padding: '24px' }}>
                                                <Flex align="center" gap={10}>
                                                    <div style={{ width: 32, height: 32, background: '#fff4f4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <FileTextOutlined style={{ color: '#FF4F4F', fontSize: 16 }} />
                                                    </div>
                                                    <Text style={{ color: '#292d32', fontSize: 14, fontWeight: 500, flex: 1 }}>
                                                        {data?.po.refNumber ?? 'PO Document'}.pdf
                                                    </Text>
                                                    <Button
                                                        type="text"
                                                        icon={<DownloadOutlined style={{ color: '#292d32', fontSize: 16 }} />}
                                                        onClick={downloadPdf}
                                                        loading={isDownloadingPdf}
                                                        style={{ padding: 4 }}
                                                    />
                                                </Flex>
                                            </div>
                                        </Card>

                                    </Flex>
                                </Col>
                            </Row>
                        </Layout.Content>
                    </Layout>
                </Form>
            )}
        </Formik>
    );
};

export default OnlinePOAcknowledgePage;
