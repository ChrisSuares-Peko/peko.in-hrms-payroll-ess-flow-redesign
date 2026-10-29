import React from 'react';

import { Card, Col, Divider, Flex, Row, Tag, Typography } from 'antd';
import { Link as RouterLink } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { InvoiceData } from '../../types';

const { Text } = Typography;

const labelStyle: React.CSSProperties = { fontSize: 12, color: '#8a98aa' };
const valueStyle: React.CSSProperties = { fontSize: 14, color: '#314259', fontWeight: 400 };

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <Flex vertical gap={5}>
        <Text style={labelStyle}>{label}</Text>
        {children}
    </Flex>
);

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusColors: Record<string, { color: string; bg: string }> = {
    Paid:     { color: '#03a254', bg: '#ecfdf5' },
    Pending:  { color: '#fa8c16', bg: '#fff7e6' },
    Overdue:  { color: '#f5222d', bg: '#fff1f0' },
    Verified: { color: '#1677ff', bg: '#e6f4ff' },
};

interface Props { detail: InvoiceData | null; }

const InvoiceInfoCard: React.FC<Props> = ({ detail }) => (
    <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
        <Flex vertical gap={16}>
            <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                    <Field label="Invoice Date"><Text style={valueStyle}>{fmtDate(detail?.invoiceDate)}</Text></Field>
                </Col>
                <Col xs={12} sm={6}>
                    <Field label="Received Date"><Text style={valueStyle}>{fmtDate(detail?.receivedDate)}</Text></Field>
                </Col>
                <Col xs={12} sm={6}>
                    <Field label="Amount">
                        <Text style={valueStyle}>{detail?.purchaseOrder?.currency === 'INR' ? '₹' : (detail?.purchaseOrder?.currency ?? '')} {detail?.amount != null ? Number(detail.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</Text>
                    </Field>
                </Col>
                <Col xs={12} sm={6}>
                    <Field label="Payment Status">
                        {detail?.status ? (
                            <Tag style={{
                                background: (statusColors[detail.status] ?? { bg: '#f5f5f5' }).bg,
                                color: (statusColors[detail.status] ?? { color: '#595959' }).color,
                                border: 'none', borderRadius: 20, padding: '2px 10px', width: 'fit-content', margin: 0,
                            }}>
                                {detail.status}
                            </Tag>
                        ) : <Text style={valueStyle}>—</Text>}
                    </Field>
                </Col>
            </Row>

            <Divider style={{ margin: 0 }} />

            <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                    <Field label="Due Date"><Text style={valueStyle}>{fmtDate(detail?.dueDate)}</Text></Field>
                </Col>
                <Col xs={12} sm={6}>
                    <Field label="PO Reference">
                        {detail?.purchaseOrder?.refNumber
                            ? <RouterLink to={`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${detail.purchaseOrder.id}`} style={{ fontSize: 14, color: '#1677ff' }}>{detail.purchaseOrder.refNumber}</RouterLink>
                            : <Text style={valueStyle}>—</Text>}
                    </Field>
                </Col>
                <Col xs={12} sm={6}>
                    <Field label="Vendor Email"><Text style={{ ...valueStyle, wordBreak: 'break-all' }}>{detail?.purchaseOrder?.vendor?.email ?? '—'}</Text></Field>
                </Col>
                <Col xs={12} sm={6}>
                    <Field label="Payment Reference"><Text style={valueStyle}>{detail?.paymentReferenceId ?? '—'}</Text></Field>
                </Col>
            </Row>

            <Divider style={{ margin: 0 }} />

            <Field label="Notes">
                <Text style={valueStyle}>{detail?.notes ?? '—'}</Text>
            </Field>
        </Flex>
    </Card>
);

export default InvoiceInfoCard;
