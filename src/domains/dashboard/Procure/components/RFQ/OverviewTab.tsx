import React, { useState } from 'react';

import { FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Grid, Row, Table, Typography } from 'antd';

import { formatShortDate } from '../../utils';

const { Text } = Typography;

interface OverviewTabProps {
    record: any;
    onSendReminder: (email: string) => void;
}

const vendorBadge: Record<string, { color: string; bg: string; dot: string }> = {
    'Under Review': { color: '#0803a2', bg: '#f4f3ff', dot: '#6c63ff' },
    Pending:       { color: '#81650c', bg: '#fffdf3', dot: '#f0b429' },
    Invited:       { color: '#1677ff', bg: '#e6f4ff', dot: '#1677ff' },
    Draft:         { color: '#8c8c8c', bg: '#f5f5f5', dot: '#8c8c8c' },
    'Not Invited': { color: '#8c8c8c', bg: '#f5f5f5', dot: '#8c8c8c' },
};

const SECTION_CARD_STYLE = { border: '0.37px solid #eaeaea', borderRadius: 22, marginBottom: 16 };

const SectionCard: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
    <Card style={SECTION_CARD_STYLE} styles={{ body: { padding: 0 } }}>
        <Flex
            align="center"
            justify="space-between"
            gap={12}
            style={{
                padding: '13px 17px',
                borderBottom: '0.37px solid #eaeaea',
                borderRadius: '22px 22px 0 0',
                background: '#fff',
            }}
        >
            <Flex align="center" gap={12}>
                <Flex
                    align="center"
                    justify="center"
                    style={{ width: 37, height: 37, borderRadius: 10, background: '#fff4f4', flexShrink: 0 }}
                >
                    <FileTextOutlined style={{ fontSize: 16, color: '#ff4f4f' }} />
                </Flex>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#000' }}>{title}</Text>
            </Flex>
            {action}
        </Flex>
        <Flex vertical style={{ padding: 17 }}>
            {children}
        </Flex>
    </Card>
);

const lineItemColumns = [
    {
        title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Item name</Text>,
        dataIndex: 'description',
        key: 'description',
        render: (v: string) => <Text style={{ fontSize: 13, color: '#0a0a0a', whiteSpace: 'normal', wordBreak: 'break-word' }}>{v}</Text>,
    },
    {
        title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Qty</Text>,
        dataIndex: 'qty',
        key: 'qty',
        width: 70,
        render: (v: any) => <Text style={{ fontSize: 13 }}>{parseFloat(v).toLocaleString('en-IN')}</Text>,
    },
    {
        title: <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Unit</Text>,
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
        render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
];

const OverviewTab: React.FC<OverviewTabProps> = ({ record, onSendReminder }) => {
    const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;

    const handleSendReminder = async (email: string) => {
        setLoadingEmail(email);
        await onSendReminder(email);
        setLoadingEmail(null);
    };

    return (
    <Flex vertical gap={0}>
        {/* RFQ Details */}
        <SectionCard title="RFQ Details">
            <Row gutter={[30, 20]}>
                <Col xs={24} sm={12}>
                    <Flex vertical gap={4}>
                        <Text style={{ fontSize: 11, color: '#969696', letterSpacing: 0.33 }}>Deadline</Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#070707' }}>{formatShortDate(record.submissionDeadline)}</Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={12}>
                    <Flex vertical gap={4}>
                        <Text style={{ fontSize: 11, color: '#969696', letterSpacing: 0.33 }}>Created</Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#070707' }}>{formatShortDate(record.createdAt)}</Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={12}>
                    <Flex vertical gap={4}>
                        <Text style={{ fontSize: 11, color: '#969696', letterSpacing: 0.33 }}>Requested by</Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#070707' }}>{record.purchaseRequest?.requestedBy ?? '—'}</Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={12}>
                    <Flex vertical gap={4}>
                        <Text style={{ fontSize: 11, color: '#969696', letterSpacing: 0.33 }}>Vendors Invited</Text>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#070707' }}>{record.vendorInvites?.length ?? 0}</Text>
                    </Flex>
                </Col>
                {record.termsAndConditions && (
                    <Col span={24}>
                        <Flex vertical gap={4}>
                            <Text style={{ fontSize: 11, color: '#969696', letterSpacing: 0.33 }}>Terms &amp; Conditions</Text>
                            <Text style={{ fontSize: 14, fontWeight: 500, color: '#070707', whiteSpace: 'pre-wrap' }}>{record.termsAndConditions}</Text>
                        </Flex>
                    </Col>
                )}
            </Row>
        </SectionCard>

        {/* Line Items */}
        <SectionCard title="Line Items">
            <Card style={{ border: '1px solid #e6e6e6', borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                <Table
                    columns={lineItemColumns}
                    dataSource={record.lineItems ?? []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    scroll={{ x: 480 }}
                    className="[&_.ant-table-thead_.ant-table-cell]:bg-[#fcfcfc] [&_.ant-table-thead_.ant-table-cell]:text-[#999] [&_.ant-table-thead_.ant-table-cell]:before:!hidden"
                    summary={pageData => {
                        if (!pageData.length) return null;
                        const totalItems = pageData.reduce((sum: number, li: any) => sum + parseFloat(li.qty || 0), 0);
                        return (
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0}>
                                    <Text style={{ fontSize: 11, color: '#969696' }}>Total Qty</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                    <Text style={{ fontSize: 14, fontWeight: 600, color: '#070707' }}>{totalItems}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                        );
                    }}
                />
            </Card>
        </SectionCard>

        {/* Notes */}
        {record.buyerNotes && (
            <SectionCard title="Notes">
                <Text style={{ fontSize: 14, color: '#070707', lineHeight: '20px', whiteSpace: 'pre-wrap' }}>{record.buyerNotes}</Text>
            </SectionCard>
        )}

        {/* Attachments */}
        {record.attachments?.length > 0 && (
            <SectionCard title="Attachments">
                <Flex vertical gap={10}>
                    {record.attachments.map((a: any) => (
                        <Flex key={a.fileName} align="center" gap={10}>
                            <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                            <a href={a.url} target="_blank" rel="noreferrer">
                                <Text style={{ fontSize: 14, color: '#292d32' }}>{a.fileName}</Text>
                            </a>
                        </Flex>
                    ))}
                </Flex>
            </SectionCard>
        )}

        {/* Invited Vendors */}
        <SectionCard title={`Invited vendors (${record.vendorInvites?.length ?? 0})`}>
            <Flex vertical gap={0}>
                {(!record.vendorInvites || record.vendorInvites.length === 0) && (
                    <Text style={{ fontSize: 13, color: '#999', padding: '12px 0', display: 'block' }}>No vendors invited</Text>
                )}
                {record.vendorInvites?.map((invite: any, index: number) => {
                    const name      = invite.vendor?.businessName ?? invite.externalEmail ?? '—';
                    const email     = invite.vendor?.email ?? null;
                    const statusLabel = invite.status || 'Not Invited';
                    const bg_       = vendorBadge[statusLabel] ?? { color: '#595959', bg: '#f5f5f5', dot: '#595959' };
                    const isPending = invite.status === 'Invited' || invite.status === 'Pending';
                    const isLast    = index === (record.vendorInvites?.length ?? 0) - 1;
                    const vendorEmail = invite.externalEmail || invite.vendor?.email || '';

                    return (
                        <React.Fragment key={invite.id}>
                            <Flex vertical={isMobile} justify="space-between" align={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 10 : 8} wrap="wrap" style={{ padding: '12px 0' }}>
                                <Flex vertical gap={6}>
                                    <Text style={{ fontSize: 14, fontWeight: 500, color: '#282828' }}>{name}</Text>
                                    {email && <Text style={{ fontSize: 13, color: '#666' }}>{email}</Text>}
                                </Flex>
                                <Flex vertical={isMobile} align={isMobile ? 'stretch' : 'center'} gap={8} style={{ width: isMobile ? '100%' : 'auto' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        color: bg_.color,
                                        background: bg_.bg,
                                        borderRadius: 20,
                                        padding: '3px 10px',
                                        fontSize: 14,
                                        fontWeight: 500,
                                        minWidth: 100,
                                        justifyContent: 'center',
                                    }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: bg_.dot, display: 'inline-block', flexShrink: 0 }} />
                                        {statusLabel}
                                    </span>
                                    {isPending && (
                                        <Button
                                            danger
                                            size="small"
                                            block={isMobile}
                                            loading={loadingEmail === vendorEmail}
                                            onClick={() => handleSendReminder(vendorEmail)}
                                            style={{ fontWeight: 500, borderRadius: 6 }}
                                        >
                                            Send reminder
                                        </Button>
                                    )}
                                </Flex>
                            </Flex>
                            {!isLast && <Divider style={{ margin: '4px 0' }} />}
                        </React.Fragment>
                    );
                })}
            </Flex>
        </SectionCard>
    </Flex>
    );
};

export default OverviewTab;
