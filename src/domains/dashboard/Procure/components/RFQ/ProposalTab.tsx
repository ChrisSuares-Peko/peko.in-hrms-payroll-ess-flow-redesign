import React, { useState } from 'react';

import { Button, Flex, Grid, Modal, Skeleton, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { useProposals } from '../../hooks/useProposals';

const { Text } = Typography;

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
    Accepted:      { label: 'Accepted',     color: '#43B75D', bg: '#ECFDF5' },
    Rejected:      { label: 'Rejected',     color: '#ff4d4f', bg: '#FEF2F2' },
    'Under Review':{ label: 'Under Review', color: '#475569', bg: '#F8FAFC' },
    'Under review':{ label: 'Under Review', color: '#475569', bg: '#F8FAFC' },
    Shortlisted:   { label: 'Shortlisted',  color: '#D97706', bg: '#FFFBEB' },
};

interface Props {
    rfqId: string | number;
    rfqTitle?: string;
    purchaseRequestId?: number | null;
    refreshKey?: number;
}

const ProposalTab: React.FC<Props> = ({ rfqId, rfqTitle, purchaseRequestId, refreshKey }) => {
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;
    const { isLoading, isSubmitting, proposals, rfqLineItems, fetchProposals, accept, decline, undoAccept, undoDecline } = useProposals({ rfqId });

    const [confirmProposal, setConfirmProposal]       = useState<any>(null);
    const [rejectProposal, setRejectProposal]         = useState<any>(null);
    const [undoRejectProposal, setUndoRejectProposal] = useState<any>(null);
    const [undoAcceptProposal, setUndoAcceptProposal] = useState<any>(null);

    React.useEffect(() => {
        if (refreshKey) fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    const handleAccept = async (proposalId: number) => {
        const result = await accept(proposalId, rfqId);
        if (result) fetchProposals();
    };

    const handleDecline = async (proposalId: number) => {
        const result = await decline(proposalId, rfqId);
        if (result) fetchProposals();
    };

    const handleUndoDecline = async (proposalId: number) => {
        const result = await undoDecline(proposalId, rfqId);
        if (result) fetchProposals();
    };

    const handleUndoAccept = async (proposalId: number) => {
        const result = await undoAccept(proposalId, rfqId);
        if (result) fetchProposals();
    };

    const handleView = (proposalId: number) =>
        navigate(`${paths.dashboard.procure}/${paths.procure.proposals.index}/${proposalId}?rfqId=${rfqId}`);

    const handleCreatePO = (p: any) => {
        const sourceItems = p.lineItems?.length ? p.lineItems : rfqLineItems;
        navigate(
            `${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.create}`,
            {
                state: {
                    proposalId: p.id,
                    title: rfqTitle ?? '',
                    purchaseRequestId: purchaseRequestId ?? null,
                    linkedRFQ: String(rfqId),
                    vendor: String(p.vendorId),
                    paymentTerms: p.paymentTerms ?? '',
                    notes: p.coverNote ?? '',
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
    };

    const vendorName = (p: any) => p.vendor?.businessName ?? `Vendor #${p.vendorId}`;

    const renderActions = (p: any) => {
        const cls = 'h-9 w-36 text-xs sm:text-sm rounded-md';
        const viewBtn = <Button danger variant="outlined" className={cls} onClick={() => handleView(p.id)}>View Proposal</Button>;

        switch (p.status) {
            case 'Accepted': {
                const linkedPO = p.purchaseOrder;
                return (
                    <>
                        {viewBtn}
                        {linkedPO && (
                            <Button danger variant="outlined" className={cls} onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${linkedPO.id}`)}>
                                View {linkedPO.refNumber ?? 'PO'}
                            </Button>
                        )}
                        {!linkedPO && (
                            <Button type="primary" danger className={cls} onClick={() => handleCreatePO(p)}>Create PO</Button>
                        )}
                        {!linkedPO && (
                            <Button danger variant="outlined" className={cls} onClick={() => setUndoAcceptProposal(p)}>Undo Accept</Button>
                        )}
                    </>
                );
            }
            case 'Rejected': {
                const linkedPO = p.purchaseOrder;
                return (
                    <>
                        {viewBtn}
                        {linkedPO ? (
                            <Button danger variant="outlined" className={cls} onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${linkedPO.id}`)}>
                                View {linkedPO.refNumber ?? 'PO'}
                            </Button>
                        ) : (
                            <Button danger variant="outlined" className={cls} onClick={() => setUndoRejectProposal(p)}>Undo Reject</Button>
                        )}
                    </>
                );
            }
            case 'Under Review':
            case 'Under review':
            default:
                return (
                    <>
                        {viewBtn}
                        <Button type="primary" danger className={cls} onClick={() => setConfirmProposal(p)}>Accept</Button>
                        <Button danger variant="outlined" className={cls} onClick={() => setRejectProposal(p)}>Reject</Button>
                    </>
                );
        }
    };

    if (isLoading) {
        return (
            <Flex vertical gap={10}>
                {[1, 2].map(k => (
                    <div key={k} style={{ background: '#fff', border: '0.37px solid #c4c4c4', borderRadius: 22, padding: isMobile ? '16px' : '28px 46px' }}>
                        <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                ))}
            </Flex>
        );
    }

    if (!proposals.length) {
        return <Text className="text-sm text-gray-400">No proposals submitted yet.</Text>;
    }

    return (
        <>
        <Modal
            open={!!confirmProposal}
            title={`Accept ${vendorName(confirmProposal ?? {})}'s proposal?`}
            okText="Yes, accept"
            cancelText="Cancel"
            okButtonProps={{ danger: true, type: 'primary', loading: isSubmitting }}
            onCancel={() => setConfirmProposal(null)}
            onOk={async () => {
                await handleAccept(confirmProposal.id);
                setConfirmProposal(null);
            }}
        >
            <Text>You&apos;re accepting <Text strong>{vendorName(confirmProposal ?? {})}</Text>&apos;s quote of <Text strong style={{ color: '#FF4F4F' }}>
                {confirmProposal?.totalAmount != null ? `₹${Number(confirmProposal.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </Text> for this RFQ.</Text>
            <div style={{ marginTop: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 6 }}>See What Happens</Text>
                <Text style={{ display: 'block' }}>This proposal is marked <Text strong>Accepted</Text>.</Text>
                <Text>You can then create a Purchase Order for {vendorName(confirmProposal ?? {})} straight from this quote.</Text>
            </div>
        </Modal>

        <Modal
            open={!!rejectProposal}
            title={`Reject ${vendorName(rejectProposal ?? {})}'s proposal?`}
            okText="Yes, reject"
            cancelText="Cancel"
            okButtonProps={{ danger: true, type: 'primary', loading: isSubmitting }}
            onCancel={() => setRejectProposal(null)}
            onOk={async () => {
                await handleDecline(rejectProposal.id);
                setRejectProposal(null);
            }}
        >
            <Text>Are you sure you want to reject <Text strong>{vendorName(rejectProposal ?? {})}</Text>&apos;s proposal? This action can be undone later.</Text>
        </Modal>

        <Modal
            open={!!undoRejectProposal}
            title={`Undo rejection of ${vendorName(undoRejectProposal ?? {})}'s proposal?`}
            okText="Yes, undo"
            cancelText="Cancel"
            okButtonProps={{ loading: isSubmitting }}
            onCancel={() => setUndoRejectProposal(null)}
            onOk={async () => {
                await handleUndoDecline(undoRejectProposal.id);
                setUndoRejectProposal(null);
            }}
        >
            <Text>This will move <Text strong>{vendorName(undoRejectProposal ?? {})}</Text>&apos;s proposal back to <Text strong>Under Review</Text>.</Text>
        </Modal>

        <Modal
            open={!!undoAcceptProposal}
            title={`Undo acceptance of ${vendorName(undoAcceptProposal ?? {})}'s proposal?`}
            okText="Yes, undo"
            cancelText="Cancel"
            okButtonProps={{ loading: isSubmitting }}
            onCancel={() => setUndoAcceptProposal(null)}
            onOk={async () => {
                await handleUndoAccept(undoAcceptProposal.id);
                setUndoAcceptProposal(null);
            }}
        >
            <Text>This will move <Text strong>{vendorName(undoAcceptProposal ?? {})}</Text>&apos;s proposal back to <Text strong>Under Review</Text>.</Text>
        </Modal>

        <Flex vertical gap={10}>
            {proposals.map((p: any) => {
                const cfg = statusCfg[p.status] ?? { color: '#475569', bg: '#F8FAFC' };
                return (
                    <div
                        key={p.id}
                        style={{
                            background: '#fff',
                            border: '0.37px solid #c4c4c4',
                            borderRadius: 22,
                            padding: isMobile ? '16px' : '28px 46px',
                        }}
                    >
                        <Flex
                            justify="space-between"
                            align="flex-start"
                            wrap={isMobile ? 'wrap' : 'nowrap'}
                            gap={isMobile ? 10 : 0}
                            style={{ marginBottom: 16 }}
                        >
                            <Flex vertical gap={6}>
                                <Text strong style={{ fontSize: 16 }}>
                                    {p.vendor?.businessName ?? `Vendor #${p.vendorId}`}
                                </Text>
                                <Text style={{ color: '#969696', fontSize: 14 }}>
                                    Submitted {new Date(p.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.submissionMode}
                                </Text>
                            </Flex>
                            <Flex gap={12} align="center">
                                <Tag style={{ color: cfg.color, background: cfg.bg, border: 'none', borderRadius: 20, padding: '2px 10px', fontWeight: 500 }}>
                                    {cfg.label}
                                </Tag>
                                <Text strong style={{ fontSize: 18, color: '#FF4F4F' }}>
                                    {p.totalAmount != null ? <>₹ {Number(p.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</> : '—'}
                                </Text>
                            </Flex>
                        </Flex>
                        <Flex gap={8} wrap="wrap">
                            {renderActions(p)}
                        </Flex>
                    </div>
                );
            })}

        </Flex>
        </>
    );
};

export default ProposalTab;
