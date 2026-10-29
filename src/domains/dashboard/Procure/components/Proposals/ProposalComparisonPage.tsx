import React, { useState } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Modal, Skeleton, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { useProposals } from '../../hooks/useProposals';
import { useRFQ } from '../../hooks/useRFQ';
import {
    ACCEPT_BG, ACCEPT_BORDER, CELL_BORDER, CELL_PAD,
    LABEL_BG, LABEL_COL_WIDTH, OUTER_BORDER, VENDOR_COL_MIN,
    statusCfg,
} from '../../utils/ProposalColumns';

const { Title, Text } = Typography;

const LabelCell: React.FC<{ bold?: boolean; children: React.ReactNode; last?: boolean }> = ({ bold, children, last }) => (
    <Flex vertical justify="center" style={{ width: LABEL_COL_WIDTH, minWidth: LABEL_COL_WIDTH, padding: CELL_PAD, background: LABEL_BG, ...(!last && { borderBottom: CELL_BORDER }) }}>
        <Text style={{ fontSize: bold ? 16 : 14, fontWeight: bold ? 500 : 400, color: bold ? '#000' : 'rgba(0,0,0,0.6)' }}>{children}</Text>
    </Flex>
);

const VendorCell: React.FC<{ accepted: boolean; bold?: boolean; last?: boolean; children: React.ReactNode }> = ({ accepted, bold, last, children }) => (
    <Flex vertical justify="center" style={{ width: VENDOR_COL_MIN, minWidth: VENDOR_COL_MIN, padding: CELL_PAD, background: accepted ? ACCEPT_BG : '#fff', borderLeft: CELL_BORDER, ...(!last && { borderBottom: CELL_BORDER }) }}>
        <Text style={{ fontSize: bold ? 16 : 14, fontWeight: bold ? 600 : 500, color: accepted ? '#2a803d' : 'rgba(0,0,0,0.85)', textTransform: 'capitalize' }}>
            {children}
        </Text>
    </Flex>
);

const ProposalComparisonPage: React.FC = () => {
    const { rfqId } = useParams<{ rfqId: string }>();
    const navigate  = useNavigate();

    const { proposals, rfqLineItems, isLoading, accept, decline, undoAccept, undoDecline, fetchProposals } = useProposals({ rfqId });
    const { detail: rfq } = useRFQ(rfqId);

    const [confirmingId, setConfirmingId]   = useState<string | number | null>(null);
    const [rejectingId, setRejectingId]     = useState<string | number | null>(null);
    const [processingKey, setProcessingKey] = useState<string | null>(null);

    const parseAmt   = (a: any) => Number(a) || 0;
    const fmtAmt     = (a: any, currency?: string) => a != null ? `${currency ?? '₹'} ${Number(a).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
    const formatDate = (d: string) => {
        if (!d) return '-';
        const [y, m, day] = d.split('T')[0].split('-').map(Number);
        return new Date(y, m - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const isAccepted = (p: any) => p.status === 'Accepted';
    const isDeclined = (p: any) => p.status === 'Rejected';

    const summaryRows = [
        { label: 'Overall Total',      getValue: (p: any) => fmtAmt(p.totalAmount, p.currency),             bold: true  },
        { label: 'Valid Until',        getValue: (p: any) => formatDate(p.validUntil),                       bold: false },
        { label: 'Payment Terms',      getValue: (p: any) => p.paymentTerms      ?? '-',                     bold: false },
        { label: 'Delivery Timeline',  getValue: (p: any) => p.deliveryTimeline  ?? p.deliveryDays  ?? '-',  bold: false },
        { label: 'Warranty / Support', getValue: (p: any) => p.warrantySupport   ?? p.warranty      ?? '-',  bold: false },
        { label: 'Submission Mode',    getValue: (p: any) => p.submissionMode    ?? '-',                     bold: false },
    ];

    const buildActionNode = (p: any) => {
        const btnStyle = { borderRadius: 8, fontWeight: 500, fontSize: 12 };
        if (isAccepted(p)) return (
            <Flex gap={8} wrap="nowrap" align="center">
                <Button type="primary" danger size="small" style={btnStyle}
                    onClick={() => navigate(
                        `${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.create}`,
                        { state: { proposalId: p.id, title: rfq?.title ?? '', linkedRFQ: rfqId, vendor: p.vendorId ? String(p.vendorId) : undefined, paymentTerms: p.paymentTerms ?? '', notes: p.coverNote ?? '', lineItems: (p.lineItems ?? []).map((li: any, i: number) => ({ key: String(li.id ?? li.rfqLineItemId ?? i), description: li.description ?? '', qty: Number(li.qty) || 1, unit: li.unit ?? 'Each', amount: Number(li.unitPrice ?? li.estUnitCost) || 0, taxRate: li.taxRate != null ? String(parseInt(li.taxRate, 10)) : '0', gstType: li.gstType ?? 'exclusive' })) } }
                    )}>Create PO</Button>
                <Button size="small" style={btnStyle} loading={processingKey === `${p.id}-undo`} onClick={() => setConfirmingId(`undo-${p.id}`)}>Undo accept</Button>
            </Flex>
        );
        if (isDeclined(p)) return (
            <Button danger size="small" style={{ ...btnStyle, alignSelf: 'flex-start' }} loading={processingKey === `${p.id}-reopen`} onClick={() => setRejectingId(`reopen-${p.id}`)}>Reopen</Button>
        );
        return (
            <Flex gap={8} wrap="wrap">
                <Button type="primary" danger size="small" style={btnStyle} loading={processingKey === `${p.id}-accept`} onClick={() => setConfirmingId(p.id)}>Accept</Button>
                <Button danger size="small" style={btnStyle} loading={processingKey === `${p.id}-reject`} onClick={() => setRejectingId(p.id)}>Reject</Button>
            </Flex>
        );
    };

    const runModal = async (fn: (id: any) => Promise<any>, id: any, key: string, onDone: () => void) => {
        setProcessingKey(key);
        const result = await fn(id);
        setProcessingKey(null);
        if (result !== false) { onDone(); fetchProposals(); }
    };

    if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

    return (
        <Flex vertical gap={16}>
            <Card styles={{ body: { padding: '18px 20px' } }} style={{ border: OUTER_BORDER, borderRadius: 14 }}>
                <Title level={4} style={{ marginBottom: 4, fontWeight: 500 }}>Comparing Proposals</Title>
                <Text style={{ fontSize: 14, color: '#000' }}>{rfq?.title ?? '—'} · {proposals.length} proposals</Text>
            </Card>

            {proposals.length === 0 && (
                <Card styles={{ body: { padding: '48px 20px' } }} style={{ border: OUTER_BORDER, borderRadius: 14, textAlign: 'center' }}>
                    <Empty description="No proposals received yet." />
                </Card>
            )}

            {proposals.length > 0 && (
                <Card styles={{ body: { padding: 0 } }} style={{ border: OUTER_BORDER, borderRadius: 22, overflowX: 'auto', width: 'fit-content', maxWidth: '100%', margin: '0 auto' }}>
                    <Flex vertical style={{ width: LABEL_COL_WIDTH + proposals.length * VENDOR_COL_MIN }}>

                        {/* Vendor header row */}
                        <Flex style={{ borderRadius: '22px 22px 0 0', overflow: 'hidden' }}>
                            <Flex align="center" style={{ width: LABEL_COL_WIDTH, minWidth: LABEL_COL_WIDTH, padding: CELL_PAD, background: '#fff', borderBottom: CELL_BORDER }}>
                                <Text style={{ fontSize: 16, fontWeight: 500, color: '#000' }}>Line Items</Text>
                            </Flex>
                            {proposals.map((p: any) => {
                                const accepted = isAccepted(p);
                                return (
                                    <Flex key={p.id} vertical gap={accepted ? 8 : 0} justify="center" style={{ width: VENDOR_COL_MIN, minWidth: VENDOR_COL_MIN, padding: CELL_PAD, background: LABEL_BG, borderLeft: CELL_BORDER, borderBottom: accepted ? ACCEPT_BORDER : CELL_BORDER }}>
                                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#000', textTransform: 'capitalize' }}>
                                            {p.vendor?.businessName ?? p.externalEmail ?? `Vendor #${p.vendorId}`}
                                        </Text>
                                        {accepted && (
                                            <Tag icon={<CheckOutlined />} style={{ background: '#43b75d', border: ACCEPT_BORDER, borderRadius: 999, padding: '2px 8px 2px 4px', fontSize: 10, fontWeight: 500, color: '#fff', margin: 0, width: 'fit-content' }}>
                                                Best Value
                                            </Tag>
                                        )}
                                    </Flex>
                                );
                            })}
                        </Flex>

                        {/* Line item rows */}
                        {rfqLineItems.map((item: any, idx: number) => (
                            <Flex key={item.id ?? idx}>
                                <Flex vertical gap={6} justify="center" style={{ width: LABEL_COL_WIDTH, minWidth: LABEL_COL_WIDTH, padding: CELL_PAD, background: LABEL_BG, borderBottom: CELL_BORDER }}>
                                    <Text style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>{item.description}</Text>
                                    {(item.quantity || item.unit) && <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{[item.quantity, item.unit].filter(Boolean).join(' ')}</Text>}
                                </Flex>
                                {proposals.map((p: any) => {
                                    const accepted  = isAccepted(p);
                                    const byId      = (p.lineItems ?? []).find((l: any) => l.rfqLineItemId === item.id);
                                    const byPos     = (p.lineItems ?? [])[idx];
                                    const li        = byId ?? (byPos && parseAmt(byPos.unitPrice) > 0 ? byPos : undefined);
                                    const total     = li ? (li.total ?? li.totalPrice ?? (parseAmt(li.unitPrice) * parseAmt(li.qty))) : null;
                                    return (
                                        <Flex key={p.id} vertical gap={6} justify="center" style={{ width: VENDOR_COL_MIN, minWidth: VENDOR_COL_MIN, padding: CELL_PAD, background: accepted ? ACCEPT_BG : '#fff', borderLeft: CELL_BORDER, borderBottom: CELL_BORDER }}>
                                            <Text style={{ fontSize: 14, fontWeight: 500, color: accepted ? '#2a803d' : 'rgba(0,0,0,0.85)', textTransform: 'capitalize' }}>{total != null ? fmtAmt(total, p.currency) : '-'}</Text>
                                            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'capitalize' }}>{li?.unitPrice != null ? `${fmtAmt(li.unitPrice, p.currency)} / ${item.unit ?? 'unit'}` : '-'}</Text>
                                        </Flex>
                                    );
                                })}
                            </Flex>
                        ))}

                        {/* Summary rows */}
                        {summaryRows.map(row => (
                            <Flex key={row.label}>
                                <LabelCell bold={row.bold}>{row.label}</LabelCell>
                                {proposals.map((p: any) => (
                                    <VendorCell key={p.id} accepted={isAccepted(p)} bold={row.bold}>{row.getValue(p)}</VendorCell>
                                ))}
                            </Flex>
                        ))}

                        {/* Decision row */}
                        <Flex>
                            <LabelCell last><Text style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>Decision</Text></LabelCell>
                            {proposals.map((p: any) => {
                                const accepted = isAccepted(p);
                                const cfg      = statusCfg[p.status] ?? statusCfg['Under review'];
                                return (
                                    <Flex key={p.id} vertical gap={8} justify="center" style={{ width: VENDOR_COL_MIN, minWidth: VENDOR_COL_MIN, padding: CELL_PAD, background: accepted ? ACCEPT_BG : '#fff', borderLeft: CELL_BORDER }}>
                                        <Tag style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, color: cfg.color, background: cfg.bg, border: `1.263px solid ${cfg.border}`, alignSelf: 'flex-start' }}>
                                            {cfg.label}
                                        </Tag>
                                        {buildActionNode(p)}
                                    </Flex>
                                );
                            })}
                        </Flex>

                    </Flex>

                    {/* Modals */}
                    <Modal open={confirmingId !== null && !String(confirmingId).startsWith('undo-')} title="Accept Proposal" okText="Yes, Accept" cancelText="Cancel" okButtonProps={{ loading: processingKey !== null }} onCancel={() => setConfirmingId(null)}
                        onOk={() => runModal((id) => accept(id, rfqId!), confirmingId, `${confirmingId}-accept`, () => setConfirmingId(null))}>
                        <Text>Are you sure you want to accept this proposal? A Purchase Order can be created after acceptance.</Text>
                    </Modal>

                    <Modal open={String(confirmingId).startsWith('undo-')} title="Undo Acceptance" okText="Yes, Undo" cancelText="Cancel" okButtonProps={{ loading: processingKey !== null }} onCancel={() => setConfirmingId(null)}
                        onOk={() => { const id = String(confirmingId).replace('undo-', ''); runModal((i) => undoAccept(i, rfqId!), id, `${id}-undo`, () => setConfirmingId(null)); }}>
                        <Text>Are you sure you want to undo the acceptance of this proposal?</Text>
                    </Modal>

                    <Modal open={rejectingId !== null && !String(rejectingId).startsWith('reopen-')} title="Reject Proposal" okText="Yes, Reject" cancelText="Cancel" okButtonProps={{ loading: processingKey !== null, danger: true }} onCancel={() => setRejectingId(null)}
                        onOk={() => runModal((id) => decline(id, rfqId!), rejectingId, `${rejectingId}-reject`, () => setRejectingId(null))}>
                        <Text>Are you sure you want to reject this proposal?</Text>
                    </Modal>

                    <Modal open={String(rejectingId).startsWith('reopen-')} title="Reopen Proposal" okText="Yes, Reopen" cancelText="Cancel" okButtonProps={{ loading: processingKey !== null }} onCancel={() => setRejectingId(null)}
                        onOk={() => { const id = String(rejectingId).replace('reopen-', ''); runModal((i) => undoDecline(i, rfqId!), id, `${id}-reopen`, () => setRejectingId(null)); }}>
                        <Text>Are you sure you want to reopen this proposal for consideration?</Text>
                    </Modal>
                </Card>
            )}
        </Flex>
    );
};

export default ProposalComparisonPage;
