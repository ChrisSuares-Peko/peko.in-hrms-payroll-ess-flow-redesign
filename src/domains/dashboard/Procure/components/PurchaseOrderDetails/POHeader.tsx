import React, { useState } from 'react';

import { Button, Flex, Grid, Tag, Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import CancelPOModal from './CancelPOModal';
import IssuePOModal from './IssuePOModal';
import ReopenPOModal from './ReopenPOModal';
import type { POBillingState } from '../../types';
import { normalizePOStatus, PO_STATUS_COLOR } from '../../utils/data';

const { Title, Text } = Typography;

type Props = {
    poId:           number;
    poRef:          string;
    title?:         string | null;
    vendor:         string;
    vendorEmail?:   string;
    totalAmount?:   string;
    currency?:      string;
    linkedRfq?:     string;
    status:         string;
    billingState?:  POBillingState;
    cancelReason?:  string | null;
    isUpdating:     boolean;
    onStatusChange: (id: number, nextStatus: string) => void;
    onCancel:       (reason: string) => Promise<boolean>;
    onDownload?:    () => void;
    onEdit?:        () => void;
};

const POHeader: React.FC<Props> = ({
    poId, poRef, title, vendor, vendorEmail, totalAmount, currency, linkedRfq,
    status, billingState = 'NONE', cancelReason, isUpdating, onStatusChange, onCancel, onDownload, onEdit,
}) => {
    const [issueOpen,  setIssueOpen]  = useState(false);
    const [closeOpen,  setCloseOpen]  = useState(false);
    const [reopenOpen, setReopenOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    const { md } = Grid.useBreakpoint();

    const displayStatus = normalizePOStatus(status);
    const statusCfg     = PO_STATUS_COLOR[displayStatus] ?? { color: '#535353', bg: '#f2f2f2' };

    // Draft: edit/delete · Issued + unbilled: cancel · billed: close · fully billed: locked
    const isLocked       = billingState === 'FULL';
    const isIssued       = displayStatus === 'PO Issued';
    const isIssueAction  = displayStatus === 'Draft' || (isIssued && !isLocked);
    const isCancelAction = isIssued && billingState === 'NONE';
    const isCloseAction  = isIssued && billingState !== 'NONE';
    const isReopenAction = displayStatus === 'Closed' && !isLocked;

    return (
        <>
            <Flex vertical={!md} justify="space-between" align={md ? 'center' : 'flex-start'} wrap="wrap" gap={12}>
                <Flex vertical gap={4} style={{ minWidth: 0, flex: md ? 1 : undefined, width: md ? undefined : '100%' }}>
                    {title && <Title level={4} style={{ margin: 0 }} ellipsis={{ tooltip: title }}>{title}</Title>}
                    <Text style={{ fontSize: title ? 13 : undefined, fontWeight: title ? undefined : 600, color: '#000' }}>{poRef}</Text>
                    <Text style={{ fontSize: 13, color: '#666' }}>{vendor}</Text>
                    {vendorEmail && <Text style={{ fontSize: 12, color: '#999' }}>{vendorEmail}</Text>}
                    {displayStatus === 'Cancelled' && cancelReason && (
                        <Text style={{ fontSize: 12, color: '#d4380d' }}>Cancelled: {cancelReason}</Text>
                    )}
                </Flex>
                <Flex gap={10} align="center" wrap="wrap" style={{ flexShrink: 0 }}>
                    <Tag style={{ color: statusCfg.color, background: statusCfg.bg, border: 'none', borderRadius: 20, fontWeight: 500, fontSize: 13, padding: '3px 10px', margin: 0 }}>
                        {displayStatus}
                    </Tag>
                    {isIssueAction && (
                        <Button
                            type="primary"
                            danger
                            loading={isUpdating && !issueOpen && !closeOpen && !reopenOpen && !cancelOpen}
                            style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                            onClick={() => setIssueOpen(true)}
                        >
                            Issue PO to vendor
                        </Button>
                    )}
                    {isCloseAction && (
                        <Button
                            danger
                            variant="outlined"
                            loading={isUpdating && closeOpen}
                            style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                            onClick={() => setCloseOpen(true)}
                        >
                            Close PO
                        </Button>
                    )}
                    {isCancelAction && (
                        <Button
                            danger
                            variant="outlined"
                            loading={isUpdating && cancelOpen}
                            style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                            onClick={() => setCancelOpen(true)}
                        >
                            Cancel PO
                        </Button>
                    )}
                    {isReopenAction && (
                        <Button
                            danger
                            variant="outlined"
                            loading={isUpdating && reopenOpen}
                            style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                            onClick={() => setReopenOpen(true)}
                        >
                            Re-open PO
                        </Button>
                    )}
                    {displayStatus === 'Draft' && onEdit && (
                        <Button
                            danger
                            style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                            onClick={onEdit}
                        >
                            Edit PO
                        </Button>
                    )}
                    {onDownload && displayStatus !== 'Draft' && (
                        <Button
                            style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8, borderColor: '#cbd5e1', color: '#475569' }}
                            onClick={onDownload}
                        >
                            Download PO
                        </Button>
                    )}
                </Flex>
            </Flex>

            {/* Issue PO confirmation */}
            <IssuePOModal
                open={issueOpen}
                onClose={() => setIssueOpen(false)}
                onConfirm={() => { setIssueOpen(false); onStatusChange(poId, 'send'); }}
                isLoading={isUpdating}
                poRef={poRef}
                vendor={vendor}
                vendorEmail={vendorEmail}
                totalAmount={totalAmount}
                currency={currency}
                linkedRfq={linkedRfq}
            />

            <ConfirmationModal
                isOpen={closeOpen}
                handleCancel={() => setCloseOpen(false)}
                title="Close this PO?"
                description={`Closing ${poRef} will mark it as completed and move it to Closed status.`}
                handleSubmit={() => { setCloseOpen(false); onStatusChange(poId, 'close'); }}
                isLoading={isUpdating}
            />

            <CancelPOModal
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onConfirm={async reason => { if (await onCancel(reason)) setCancelOpen(false); }}
                isLoading={isUpdating}
                poRef={poRef}
                vendor={vendor}
            />

            <ReopenPOModal
                open={reopenOpen}
                onClose={() => setReopenOpen(false)}
                onConfirm={() => { setReopenOpen(false); onStatusChange(poId, 'send'); }}
                isLoading={isUpdating}
                poRef={poRef}
                vendor={vendor}
            />
        </>
    );
};

export default POHeader;
