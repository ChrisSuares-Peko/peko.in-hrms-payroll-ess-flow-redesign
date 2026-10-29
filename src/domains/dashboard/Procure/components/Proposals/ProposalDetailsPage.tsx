import React, { useEffect, useState } from 'react';

import { FilePdfOutlined } from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Flex, Grid, Modal, Row, Skeleton, Table, Tag, Typography } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getRFQById } from '../../api';
import { useProposals } from '../../hooks/useProposals';
import {
    proposalCardStyle as cardStyle,
    proposalDetailLineItemColumns as lineItemColumns,
    proposalRightCardStyle as rightCardStyle,
    proposalSubCardStyle as subCardStyle,
    statusCfg,
} from '../../utils/ProposalColumns';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <Flex vertical gap={14}>
        <Text style={{ fontSize: 14, color: '#969696', letterSpacing: '0.42px' }}>{label}</Text>
        <Text style={{ fontSize: 16, color: '#070707', fontWeight: 500 }}>{value ?? '—'}</Text>
    </Flex>
);

const ProposalDetailsPage: React.FC = () => {
    const { proposalId } = useParams<{ proposalId: string }>();
    const [searchParams] = useSearchParams();
    const rfqId = searchParams.get('rfqId') ?? undefined;
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const { detail, isLoading, proposals, accept, decline, undoAccept, undoDecline, fetchDetail, isSubmitting } = useProposals({ id: proposalId, rfqId });
    const [rfqDetail, setRfqDetail] = useState<any>(null);

    const [showAcceptModal, setShowAcceptModal]         = useState(false);
    const [showRejectModal, setShowRejectModal]         = useState(false);
    const [showUndoAcceptModal, setShowUndoAcceptModal] = useState(false);
    const [showUndoRejectModal, setShowUndoRejectModal] = useState(false);

    useEffect(() => {
        if (!detail?.rfqId || detail?.rfq) return;
        getRFQById({ corporateId: String(corporateId), id: detail.rfqId }).then(data => {
            if (data) setRfqDetail(data);
        });
    }, [detail?.rfqId, detail?.rfq, corporateId]);

    if (isLoading) {
        return (
            <Row gutter={20}>
                <Col xs={24} lg={16}><Card className="mb-4"><Skeleton active paragraph={{ rows: 8 }} /></Card></Col>
                <Col xs={24} lg={8}><Card><Skeleton active paragraph={{ rows: 5 }} /></Card></Col>
            </Row>
        );
    }

    if (!detail) return <Text className="p-8 block text-gray-400">Proposal not found.</Text>;

    const cfg         = statusCfg[detail.status] ?? { label: detail.status, color: '#595959', bg: '#f5f5f5' };
    const vendorName  = detail.vendor?.businessName ?? (detail as any).externalEmail ?? `Vendor #${detail.vendorId}`;
    const resolvedRfq = detail.rfq ?? rfqDetail;
    const rfqType     = resolvedRfq?.type ?? '';
    const rawRefNumber = resolvedRfq?.refNumber ?? (detail.rfqId ? `${rfqType || 'RFQ'} #${detail.rfqId}` : '-');
    const rfqRef      = rfqType ? rawRefNumber.replace(/^RFQ-/i, `${rfqType}-`) : rawRefNumber;
    const rfqTitle    = resolvedRfq?.title ?? '';
    const submittedAt = detail.submittedAt
        ? new Date(detail.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
    const validUntil  = detail.validUntil
        ? (() => { const [y, m, d] = detail.validUntil.split('T')[0].split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); })()
        : '—';
    const lineItems   = detail.lineItems ?? [];
    const rawAttachment = detail.pdfAttachment;
    let attachments: { url: string; fileName: string }[] = [];
    if (rawAttachment) {
        attachments = Array.isArray(rawAttachment) ? rawAttachment : [rawAttachment];
    }

    return (
        <>
        <Row gutter={20}>

            {/* ── LEFT ── */}
            <Col xs={24} lg={15}>

                {/* Header card */}
                <Card className="mb-4" style={cardStyle} styles={{ body: { padding: isMobile ? '20px 20px' : '40px 50px' } }}>
                    <Flex justify="space-between" align="center" wrap gap={12}>
                        <div>
                            <Title level={4} style={{ marginBottom: 6, fontWeight: 500, fontSize: 24 }}>{vendorName}</Title>
                            <Text style={{ fontSize: 14, color: '#262626' }}>{rfqRef}{rfqType && rfqType !== '-' ? ` · ${rfqType}` : ''}</Text>
                        </div>
                        <Flex gap={12} align="center" justify={isMobile ? 'center' : undefined} wrap style={{ width: isMobile ? '100%' : undefined }}>
                            <Tag style={{ color: cfg.color, background: cfg.bg, border: 'none', borderRadius: 20, padding: '2px 10px', fontWeight: 500, fontSize: 14, margin: 0 }}>
                                {cfg.label}
                            </Tag>
                            <Button
                                danger
                                variant="outlined"
                                className="h-9 w-36 text-xs sm:text-sm rounded-md"
                                onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.rfq.index}/${detail.rfqId}`)}>
                                View {rfqType || 'RFQ'}
                            </Button>
                            <Button
                                type="primary"
                                danger
                                className="h-9 w-36 text-xs sm:text-sm rounded-md"
                                onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.proposals.index}/compare/${detail.rfqId}`, { state: { proposalId, rfqId } })}>
                                Compare
                            </Button>
                        </Flex>
                    </Flex>
                </Card>

                {/* Proposal Overview */}
                <Card className="mb-4" style={cardStyle} styles={{ body: { padding: isMobile ? 20 : 40 } }}>
                    <Flex vertical gap={10} style={{ marginBottom: isMobile ? 24 : 50 }}>
                        <Text strong style={{ fontSize: 20, lineHeight: '24px' }}>Proposal Overview</Text>
                        <Text style={{ fontSize: 16, color: 'rgba(0,0,0,0.5)', lineHeight: '22px' }}>
                            Commercial summary for this vendor response.
                        </Text>
                    </Flex>

                    {/* Row 1: Total Amount, Valid Until, Payment Terms */}
                    <Row gutter={[{ xs: 16, sm: 32, md: 80 }, 24]} style={{ marginBottom: isMobile ? 24 : 50 }}>
                        <Col xs={24} sm={12} md={8}>
                            <Field label="Total Amount" value={detail.totalAmount != null ? `₹ ${Number(detail.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'} />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Field label="Valid Until" value={validUntil} />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Field label="Payment Terms" value={detail.paymentTerms} />
                        </Col>
                    </Row>

                    {/* Row 2: Delivery Timeline, Warranty / Support (online only) */}
                    {detail.submissionMode === 'Online' && (
                        <Row gutter={[{ xs: 16, sm: 32, md: 80 }, 24]} style={{ marginBottom: isMobile ? 24 : 50 }}>
                            <Col xs={24} sm={12} md={8}>
                                <Field label="Delivery Timeline" value={(detail as any).deliveryTimeline ?? '—'} />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Field label="Warranty / Support" value={(detail as any).warranty ?? '—'} />
                            </Col>
                        </Row>
                    )}

                    {/* Row 3: Vendors, RFQ, Submission Mode */}
                    <Row gutter={[{ xs: 16, sm: 32, md: 80 }, 24]}>
                        <Col xs={24} sm={12} md={8}>
                            <Field label="Vendors" value={vendorName} />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Field label={rfqType || 'RFQ'} value={`${rfqRef} · ${rfqTitle}`} />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Flex vertical gap={14}>
                                <Text style={{ fontSize: 14, color: '#969696', letterSpacing: '0.42px' }}>Submission Mode</Text>
                                <Tag style={{ borderRadius: 20, background: '#fff', border: '1.26px solid #CBD5E1', color: '#475569', padding: '2px 10px', margin: 0, width: 'fit-content', fontSize: 15, fontWeight: 500 }}>
                                    {detail.submissionMode}
                                </Tag>
                            </Flex>
                        </Col>
                    </Row>

                    {/* Line Items */}
                    <Card size="small" style={{ ...subCardStyle, marginTop: isMobile ? 32 : 66 }} styles={{ body: { padding: 0 } }}>
                        <Text strong style={{ fontSize: 16, display: 'block', padding: '20px 20px 16px' }}>Line Items</Text>
                        <Table
                            dataSource={lineItems}
                            columns={lineItemColumns}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            locale={{ emptyText: 'No line items' }}
                        />
                    </Card>

                    {/* Notes + Attachments */}
                    {(detail.coverNote || attachments.length > 0) && (
                        <Card size="small" style={{ ...subCardStyle, marginTop: 28 }} styles={{ body: { padding: isMobile ? '20px 20px' : '27px 33px' } }}>
                            {detail.coverNote && (
                                <Flex vertical gap={10} style={{ marginBottom: attachments.length > 0 ? 30 : 0 }}>
                                    <Text style={{ fontSize: 13, color: '#969696', letterSpacing: '0.4px' }}>Notes from vendor</Text>
                                    <Text style={{ fontSize: 16, color: '#070707', fontWeight: 500 }}>{detail.coverNote}</Text>
                                </Flex>
                            )}
                            {attachments.length > 0 && (
                                <Flex vertical gap={12}>
                                    <Text style={{ fontSize: 13, color: '#969696', letterSpacing: '0.4px' }}>Attachments</Text>
                                    <Flex gap={40} wrap="wrap">
                                        {attachments.map((a, i) => (
                                            <Flex key={i} gap={16} align="center">
                                                <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 22 }} />
                                                <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#292d32', fontWeight: 500 }}>{a.fileName}</a>
                                            </Flex>
                                        ))}
                                    </Flex>
                                </Flex>
                            )}
                        </Card>
                    )}
                </Card>
            </Col>
            

            {/* ── RIGHT ── */}
            <Col xs={24} lg={9}>

                {/* Decision Context */}
                 <Card className="mb-4" style={rightCardStyle} styles={{ body: { padding: '36px 28px' } }}>
                    <Title level={3} style={{ marginBottom: 0, fontWeight: 500, fontSize: 20 }}>Decision Context</Title>
                    <Descriptions
                        style={{ marginTop: 20 }}
                        column={1}
                        size="small"
                        colon={false}
                        styles={{
                            label:   { color: '#969696', fontSize: 14 },
                            content: { color: '#070707', fontSize: 16, fontWeight: 500, justifyContent: 'flex-end' },
                        }}
                        items={[
                            { key: '1', label: 'Vendors',        children: vendorName,                                                    style: { paddingBottom: 24 } },
                            { key: '2', label: 'Contact Person', children: (detail as any).contactPerson ?? detail.vendor?.contactPerson ?? '—', style: { paddingBottom: 24 } },
                            { key: '3', label: 'Email',          children: (detail as any).contactEmail  ?? detail.vendor?.email         ?? '—', style: { paddingBottom: 24 } },
                            { key: '4', label: 'Mobile',         children: (detail as any).contactMobile ?? detail.vendor?.phone         ?? '—', style: { paddingBottom: 24 } },
                            { key: '5', label: `${rfqType || 'RFQ'} Proposals`, children: proposals.length || '—',                       style: { paddingBottom: 24 } },
                            { key: '6', label: 'Submitted',      children: submittedAt,                                                   style: { paddingBottom: 24 } },
                            { key: '7', label: 'Channel',        children: detail.submissionMode,                                         style: { paddingBottom: 0  } },
                        ]}
                    />
                </Card>

                {/* Next action */}
                <Card style={rightCardStyle} styles={{ body: { padding: '36px 28px' } }}>
                    <Title level={3} style={{ marginBottom: 0, fontWeight: 500, fontSize: 20 }}>Next action</Title>
                    <Flex gap={8} wrap className="w-full" style={{ marginTop: 24 }}>
                        {detail.purchaseOrder ? (
                            <Button type="primary" danger style={{ borderRadius: 8, height: 40, flex: 1 }}
                                onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${detail.purchaseOrder.id}`)}>
                                View {detail.purchaseOrder.refNumber ?? 'PO'}
                            </Button>
                        ) : (
                            <>
                                {detail.status === 'Accepted' && (
                                    <>
                                        <Button type="primary" danger style={{ borderRadius: 8, height: 40, flex: 1 }}
                                            onClick={() => {
                                                const sourceItems = detail.lineItems?.length ? detail.lineItems : [];
                                                const linkedRfqId = detail.rfqId ? String(detail.rfqId) : rfqId ?? undefined;
                                                navigate(
                                                    `${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.create}`,
                                                    {
                                                        state: {
                                                            proposalId: detail.id,
                                                            linkedRFQ: linkedRfqId,
                                                            title: rfqTitle || undefined,
                                                            vendor: detail.vendorId ? String(detail.vendorId) : undefined,
                                                            paymentTerms: detail.paymentTerms ?? '',
                                                            notes: detail.coverNote ?? '',
                                                            lineItems: sourceItems.map((item: any, i: number) => ({
                                                                key: String(item.id ?? item.rfqLineItemId ?? i),
                                                                description: item.description ?? '',
                                                                qty: Number(item.qty) || 1,
                                                                unit: item.unit ?? 'Each',
                                                                amount: Number(item.unitPrice ?? item.estUnitCost) || 0,
                                                                taxRate: item.taxRate != null ? String(parseInt(item.taxRate, 10)) : '0',
                                                                gstType: item.gstType ?? 'exclusive',
                                                            })),
                                                        },
                                                    }
                                                );
                                            }}>
                                            Create PO
                                        </Button>
                                        <Button style={{ borderRadius: 8, height: 40, flex: 1 }}
                                            onClick={() => setShowUndoAcceptModal(true)}>
                                            Undo Accept
                                        </Button>
                                    </>
                                )}
                                {detail.status === 'Rejected' && (
                                    <Button danger variant="outlined" style={{ borderRadius: 8, height: 40, flex: 1 }}
                                        onClick={() => setShowUndoRejectModal(true)}>
                                        Undo Reject
                                    </Button>
                                )}
                                {detail.status !== 'Accepted' && detail.status !== 'Declined' && detail.status !== 'Rejected' && (
                                    <>
                                        <Button type="primary" danger style={{ borderRadius: 8, height: 40, flex: 1 }}
                                            onClick={() => setShowAcceptModal(true)}>
                                            Accept
                                        </Button>
                                        <Button danger variant="outlined" style={{ borderRadius: 8, height: 40, flex: 1 }}
                                            onClick={() => setShowRejectModal(true)}>
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </Flex>
                </Card>
            </Col>
        </Row>

        <Modal
            open={showAcceptModal}
            title="Accept this proposal?"
            okText="Yes, accept"
            cancelText="Cancel"
            okButtonProps={{ danger: true, type: 'primary', loading: isSubmitting }}
            onCancel={() => setShowAcceptModal(false)}
            onOk={async () => {
                const ok = await accept(detail.id, detail.rfqId);
                if (ok) { setShowAcceptModal(false); fetchDetail(); }
            }}
        >
            <Text>You&apos;re accepting <Text strong>{vendorName}</Text>&apos;s quote of <Text strong style={{ color: '#FF4F4F' }}>{detail.totalAmount != null ? `₹ ${Number(detail.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</Text> for this RFQ.</Text>
            <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>See What Happens</Text>
                <Text style={{ display: 'block' }}>This proposal is marked <Text strong>Accepted</Text>.</Text>
                <Text>You can then create a Purchase Order for {vendorName} straight from this quote.</Text>
            </div>
        </Modal>

        <Modal
            open={showRejectModal}
            title="Reject this proposal?"
            okText="Yes, reject"
            cancelText="Cancel"
            okButtonProps={{ danger: true, type: 'primary', loading: isSubmitting }}
            onCancel={() => setShowRejectModal(false)}
            onOk={async () => {
                const ok = await decline(detail.id, detail.rfqId);
                if (ok) { setShowRejectModal(false); fetchDetail(); }
            }}
        >
            <Text>Are you sure you want to reject <Text strong>{vendorName}</Text>&apos;s proposal? This action can be undone later.</Text>
        </Modal>

        <Modal
            open={showUndoAcceptModal}
            title="Undo acceptance?"
            okText="Yes, undo"
            cancelText="Cancel"
            okButtonProps={{ loading: isSubmitting }}
            onCancel={() => setShowUndoAcceptModal(false)}
            onOk={async () => {
                const ok = await undoAccept(detail.id, detail.rfqId);
                if (ok) { setShowUndoAcceptModal(false); fetchDetail(); }
            }}
        >
            <Text>This will move <Text strong>{vendorName}</Text>&apos;s proposal back to <Text strong>Under Review</Text>.</Text>
        </Modal>

        <Modal
            open={showUndoRejectModal}
            title="Undo rejection?"
            okText="Yes, undo"
            cancelText="Cancel"
            okButtonProps={{ loading: isSubmitting }}
            onCancel={() => setShowUndoRejectModal(false)}
            onOk={async () => {
                const ok = await undoDecline(detail.id, detail.rfqId);
                if (ok) { setShowUndoRejectModal(false); fetchDetail(); }
            }}
        >
            <Text>This will move <Text strong>{vendorName}</Text>&apos;s proposal back to <Text strong>Under Review</Text>.</Text>
        </Modal>
        </>
    );
};

export default ProposalDetailsPage;
