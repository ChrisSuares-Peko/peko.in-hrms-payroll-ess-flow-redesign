import React, { useMemo, useState } from 'react';

import { FileTextOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Grid, Spin, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import uploadButtonIcon from '../../assets/icons/uploadButtonIcon.svg';
import { useInvoice } from '../../hooks/useInvoice';
import { InvoiceData, PurchaseOrderDetail } from '../../types';
import { normalizePOStatus } from '../../utils/data';
import PayInvoiceModal from '../Invoicing/PayInvoiceModal';

const { Text } = Typography;

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const currencySymbol = (code: string) => CURRENCY_SYMBOLS[code?.toUpperCase()] ?? code;

const formatDate = (d?: string | null): string => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const invoiceStatusCfg: Record<string, { color: string; bg: string; dot: string }> = {
    'Paid':      { color: '#43B75D', bg: '#ecfdf5', dot: '#43B75D' },
    'Submitted': { color: '#43B75D', bg: '#ecfdf5', dot: '#43B75D' },
    'Pending':   { color: '#fa8c16', bg: '#fff7e6', dot: '#fa8c16' },
    'Overdue':   { color: '#f5222d', bg: '#fff1f0', dot: '#f5222d' },
    'Disputed':  { color: '#8c8c8c', bg: '#f5f5f5', dot: '#8c8c8c' },
};

const SectionHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
    <Flex
        align="center"
        justify="space-between"
        style={{ padding: '13px 17px', borderBottom: '0.37px solid #eaeaea' }}
    >
        <Flex align="center" gap={12}>
            <Flex
                align="center"
                justify="center"
                style={{ width: 37, height: 37, background: '#fff4f4', borderRadius: 10, flexShrink: 0 }}
            >
                <FileTextOutlined style={{ color: '#FF4F4F', fontSize: 16 }} />
            </Flex>
            <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>{title}</Text>
        </Flex>
        {action}
    </Flex>
);

type Props = {
    record: PurchaseOrderDetail;
    poId: number;
};

const OverviewTab: React.FC<Props> = ({ record, poId }) => {
    const navigate = useNavigate();
    const { md } = Grid.useBreakpoint();
    const isMobile = !md;
    const invoiceFilters = useMemo(() => ({ purchaseOrderId: poId, limit: 50 }), [poId]);
    const { tableData: invoices, isLoading: isLoadingInvoices } = useInvoice(invoiceFilters);

    const [payingInvoice, setPayingInvoice] = useState<any | null>(null);

    const handleUploadInvoice = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${poId}/upload-invoice`);

    const sym = currencySymbol(record.currency);
    const displayStatus = normalizePOStatus(record.status);

    const lineItemColumns: TableColumnsType<any> = [
        {
            title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Item name</Text>,
            dataIndex: 'description',
            key: 'description',
            render: (v) => <Text style={{ fontSize: 13, color: '#0a0a0a', whiteSpace: 'normal', wordBreak: 'break-word' }}>{v}</Text>,
        },
        {
            title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Qty</Text>,
            dataIndex: 'qty',
            key: 'qty',
            width: 80,
            render: (v) => <Text style={{ fontSize: 13 }}>{Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>,
        },
        {
            title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Unit</Text>,
            dataIndex: 'unit',
            key: 'unit',
            width: 80,
            render: (v) => <Text style={{ fontSize: 13 }}>{v}</Text>,
        },
        {
            title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Est. Unit Cost</Text>,
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            width: 140,
            align: 'right' as const,
            render: (v) => <Text style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{sym} {Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>,
        },
        {
            title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>GST Rate</Text>,
            dataIndex: 'taxRate',
            key: 'taxRate',
            width: 100,
            align: 'center' as const,
            render: (v: any) => <Text style={{ fontSize: 13, color: '#475569' }}>{v != null && v !== '' ? `GST ${parseInt(v, 10)}%` : '—'}</Text>,
        },
        {
            title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>GST Type</Text>,
            dataIndex: 'gstType',
            key: 'gstType',
            width: 100,
            align: 'center' as const,
            render: (v: any) => <Text style={{ fontSize: 13, color: '#475569' }}>{{ inclusive: 'Inclusive', exclusive: 'Exclusive' }[v as string] ?? '—'}</Text>,
        },
        {
            title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Net Amount</Text>,
            key: 'total',
            width: 140,
            align: 'right' as const,
            render: (_: any, row: any) => {
                const qty = Number(row.qty);
                const unitPrice = Number(row.unitPrice);
                const taxRate = parseFloat(row.taxRate) || 0;
                const gstType = row.gstType ?? 'exclusive';
                let net = Number(row.total) || qty * unitPrice;
                if (row.taxRate != null && row.gstType) {
                    net = gstType === 'inclusive' ? qty * unitPrice : qty * unitPrice * (1 + taxRate / 100);
                }
                return <Text style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{sym} {net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>;
            },
        },
    ];

    const detailFields = [
        ...(record.title ? [{ label: 'Title', value: record.title }] : []),
        { label: 'Total Amount',    value: `${sym} ${Number(record.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'Payment Terms',   value: record.paymentTerms ?? '-' },
        { label: 'Delivery Date',   value: formatDate(record.deliveryDate) },
        { label: 'Status',          value: displayStatus },
        { label: 'Linked RFQ',      value: (record as any).rfq?.refNumber ?? '-' },
        { label: 'Address',         value: record.deliveryAddress ?? '-' },
        { label: 'Notes to Vendor', value: record.notesToVendor ?? '-' },
    ];

    return (
        <Flex vertical gap={20}>
            {/* ── PO Details ── */}
            <Card
                style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
            >
                <SectionHeader title="PO Details" />
                <div style={{ padding: isMobile ? '16px' : '24px 28px' }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '24px 30px',
                        }}
                    >
                        {detailFields.map(({ label, value }) => (
                            <Flex key={label} vertical gap={4} style={{ minWidth: 0 }}>
                                <Text style={{ fontSize: 11, color: '#969696', letterSpacing: '0.33px' }}>{label}</Text>
                                <Text style={{ fontSize: 14, fontWeight: 500, color: '#070707', wordBreak: 'break-word' }}>
                                    {value}
                                </Text>
                            </Flex>
                        ))}
                    </div>
                </div>
            </Card>

            {/* ── Line Items ── */}
            <Card
                style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
            >
                <SectionHeader title="Line Items" />
                <div style={{ padding: '16px' }}>
                    <div style={{ border: '1px solid #e6e6e6', borderRadius: 16, overflow: 'hidden' }}>
                        <Table
                            columns={lineItemColumns}
                            dataSource={(record.lineItems ?? []).map((item: any) => ({ ...item }))}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            scroll={{ x: 480 }}
                            tableLayout="fixed"
                            className="[&_.ant-table-thead_.ant-table-cell]:bg-[#fcfcfc] [&_.ant-table-thead_.ant-table-cell]:text-[#999] [&_.ant-table-thead_.ant-table-cell]:before:!hidden"
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={6}>
                                        <Text style={{ fontSize: 12, fontWeight: 500, color: '#999', display: 'block', textAlign: 'right', paddingRight: 8 }}>
                                            Total
                                        </Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">
                                        <Text style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {sym} {Number(record.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Text>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />
                    </div>
                </div>
            </Card>

            {/* ── Related Invoices ── */}
            <Card
                style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
            >
                <SectionHeader
                    title="Related Invoices"
                    action={displayStatus !== 'Draft' && displayStatus !== 'Cancelled' ? (
                        <Button
                            size="small"
                            danger
                            variant="outlined"
                            icon={<img src={uploadButtonIcon} alt="Upload" />}
                            style={{ borderRadius: 8, height: 32, fontSize: 12, fontWeight: 500 }}
                            onClick={handleUploadInvoice}
                        >
                            Upload Invoice
                        </Button>
                    ) : undefined}
                />
                <Flex vertical gap={0} style={{ padding: isMobile ? '12px' : '16px 20px' }}>
                    {isLoadingInvoices && (
                        <Flex justify="center" style={{ padding: 20 }}>
                            <Spin size="small" />
                        </Flex>
                    )}
                    {!isLoadingInvoices && invoices.length === 0 && (
                        <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)' }}>No invoices attached yet.</Text>
                    )}
                    {!isLoadingInvoices && invoices.map((inv: InvoiceData, idx: number) => {
                        const cfg = invoiceStatusCfg[inv.status] ?? { color: '#8c8c8c', bg: '#f5f5f5', dot: '#8c8c8c' };
                        return (
                            <React.Fragment key={inv.id}>
                                {idx > 0 && <div style={{ height: 1, background: '#eaeaea', margin: '12px 0' }} />}
                                <Flex
                                    vertical={isMobile}
                                    justify="space-between"
                                    align={isMobile ? 'flex-start' : 'center'}
                                    gap={isMobile ? 8 : 12}
                                >
                                    <Flex vertical gap={6} style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#282828' }}>
                                            {inv.invoiceNumber}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
                                            Submitted {formatDate(inv.invoiceDate)}
                                        </Text>
                                    </Flex>
                                    <Flex align="center" gap={12} wrap="wrap" style={{ flexShrink: 0 }}>
                                        <Text style={{ fontSize: 14, fontWeight: 600, color: '#282828', whiteSpace: 'nowrap' }}>
                                            {sym} {inv.amount}
                                        </Text>
                                        <Tag
                                            style={{
                                                color: cfg.color,
                                                background: cfg.bg,
                                                border: 'none',
                                                borderRadius: 20,
                                                fontSize: 13,
                                                fontWeight: 500,
                                                margin: 0,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '4px 10px',
                                            }}
                                        >
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
                                            {inv.status}
                                        </Tag>
                                        {inv.paymentStatus !== 'Paid' && inv.status !== 'Paid' && (
                                            <Button
                                                size="small"
                                                danger
                                                variant="outlined"
                                                style={{ borderRadius: 8, height: 32, fontSize: 12, fontWeight: 500 }}
                                                onClick={() => setPayingInvoice(inv)}
                                            >
                                                Initiate Payout
                                            </Button>
                                        )}
                                    </Flex>
                                </Flex>
                                {inv.attachments?.length > 0 && (
                                    <Flex vertical gap={6} style={{ marginTop: 10 }}>
                                        {inv.attachments.map((att, i) => (
                                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                <Flex align="center" gap={8}>
                                                    <PaperClipOutlined style={{ color: '#FF4F4F', fontSize: 14 }} />
                                                    <Text style={{ fontSize: 13, color: '#292d32', fontWeight: 500 }}>{att.fileName}</Text>
                                                </Flex>
                                            </a>
                                        ))}
                                    </Flex>
                                )}
                                {inv.notes && (
                                    <Text style={{ fontSize: 12, color: '#282828', marginTop: 6, display: 'block' }}>
                                        Notes: {inv.notes}
                                    </Text>
                                )}
                            </React.Fragment>
                        );
                    })}
                    {/* {!isLoadingInvoices && invoices.length > 0 && (
                        <Button
                            type="link"
                            danger
                            style={{ padding: 0, fontSize: 12, fontWeight: 500, width: 'fit-content', marginTop: 12 }}
                            onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.invoicing.index}`)}
                        >
                            View all invoices
                        </Button>
                    )} */}
                </Flex>
            </Card>
        <PayInvoiceModal
            open={!!payingInvoice}
            invoice={payingInvoice}
            onConfirm={() => setPayingInvoice(null)}
            onCancel={() => setPayingInvoice(null)}
        />
        </Flex>
    );
};

export default OverviewTab;
