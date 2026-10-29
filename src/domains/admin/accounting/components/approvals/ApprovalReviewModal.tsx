import { useEffect, useState } from 'react';

import { Button, Flex, Modal, Skeleton, Table, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import ApprovalChecklist from './ApprovalChecklist';
import DecisionPanel from './DecisionPanel';
import DriftTag from './DriftTag';
import useApprovalDecision from '../../hooks/useApprovalDecision';
import useApprovalReview, { ApprovalTarget } from '../../hooks/useApprovalReview';
import {
    ApprovalDecision,
    ApprovalDecisionResultItem,
    ApprovalEvidenceOrder,
    ApprovalJournalState,
} from '../../types/approvals';
import {
    approvalStatusPill,
    decisionNoteError,
    describeDecisionResult,
    eligiblePartners,
    evidenceItems,
    offlineWarning,
    partnerLabel,
} from '../../utils/approvals';
import { formatInr } from '../../utils/commission';
import StatusPill from '../common/StatusPill';
import SummaryStrip from '../serviceDetail/SummaryStrip';

type ApprovalReviewModalProps = {
    open: boolean;
    target: ApprovalTarget;
    canDecide: boolean;
    onClose: () => void;
    onDecided: () => void;
};

type Step = 'review' | ApprovalDecision;

const JOURNAL_STATE_META: Record<ApprovalJournalState, { label: string; className: string }> = {
    recorded: { label: 'Recorded', className: 'text-green-700' },
    failed: { label: 'Failed', className: 'text-amber-700' },
    skipped: { label: 'Skipped', className: 'text-navTextColor' },
    notRecorded: { label: 'Not recorded', className: 'text-navTextColor' },
};

const JournalStateCell = ({ order }: { order: ApprovalEvidenceOrder }) => {
    const state = (
        <Flex vertical className={order.journalDetail ? 'w-fit cursor-help' : undefined}>
            <Typography.Text className={JOURNAL_STATE_META[order.journalState].className}>
                {JOURNAL_STATE_META[order.journalState].label}
            </Typography.Text>
            {order.journalNote && (
                <Typography.Text className="text-xs text-muted">
                    {order.journalNote}
                </Typography.Text>
            )}
        </Flex>
    );
    return order.journalDetail ? <Tooltip title={order.journalDetail}>{state}</Tooltip> : state;
};

const ORDER_COLUMNS = [
    {
        title: 'Reference',
        key: 'reference',
        render: (_: unknown, order: ApprovalEvidenceOrder) => order.corporateTxnId || '—',
    },
    {
        title: 'Date',
        key: 'date',
        render: (_: unknown, order: ApprovalEvidenceOrder) =>
            dayjs(order.transactionDate).format('DD MMM YYYY'),
    },
    {
        title: 'Amount',
        key: 'amount',
        render: (_: unknown, order: ApprovalEvidenceOrder) => formatInr(order.amountInINR),
    },
    {
        title: 'Journal',
        key: 'journal',
        render: (_: unknown, order: ApprovalEvidenceOrder) => (
            <Flex gap={6} align="center">
                <JournalStateCell order={order} />
                {order.internal && (
                    <Tag className="m-0 rounded-full border-0 bg-gray-100 text-textBody">
                        Internal
                    </Tag>
                )}
            </Flex>
        ),
    },
];

const ApprovalReviewModal = ({
    open,
    target,
    canDecide,
    onClose,
    onDecided,
}: ApprovalReviewModalProps) => {
    const dispatch = useAppDispatch();
    const { review, isLoading, refetch } = useApprovalReview(target);
    const { decide, isDeciding } = useApprovalDecision();
    const [step, setStep] = useState<Step>('review');
    const [note, setNote] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [refused, setRefused] = useState<ApprovalDecisionResultItem[]>([]);

    useEffect(() => {
        setStep('review');
        setNote('');
        setRefused([]);
    }, [target.partnerPermissionId, target.nodeKey]);

    const row = review?.row ?? null;
    const siblings = review?.siblings ?? [];
    const nameOf = (id: number) =>
        partnerLabel(siblings.find(sibling => sibling.partnerPermissionId === id) || null);

    const startDecision = (decision: ApprovalDecision) => {
        setStep(decision);
        setRefused([]);
        const eligible = eligiblePartners(siblings, decision);
        const current = eligible.find(
            sibling => sibling.partnerPermissionId === target.partnerPermissionId
        );
        setSelectedIds(current ? [current.partnerPermissionId] : []);
    };

    const noteError = step === 'review' ? null : decisionNoteError(step, note);

    const submit = async () => {
        if (step === 'review' || !row) return;
        const result = await decide({
            nodeKey: row.nodeKey,
            partnerPermissionIds: selectedIds,
            decision: step,
            note: note.trim() || undefined,
        });
        if (!result) return;

        dispatch(showToast(describeDecisionResult(result, step, nameOf)));
        const failed = result.results.filter(item => !item.ok);
        if (result.decided > 0) onDecided();
        if (!failed.length) {
            onClose();
            return;
        }
        setRefused(failed);
        if (result.decided > 0) refetch();
    };

    const goingOffline =
        step === 'REJECTED'
            ? siblings
                  .filter(
                      sibling =>
                          selectedIds.includes(sibling.partnerPermissionId) &&
                          sibling.status === 'APPROVED'
                  )
                  .map(sibling => partnerLabel(sibling))
            : [];

    const footer =
        step === 'review'
            ? [
                  <Button key="close" onClick={onClose}>
                      Close
                  </Button>,
                  ...(canDecide && row && row.status !== 'REJECTED'
                      ? [
                            <Button key="reject" danger onClick={() => startDecision('REJECTED')}>
                                Reject
                            </Button>,
                        ]
                      : []),
                  ...(canDecide && row && (row.status !== 'APPROVED' || row.drift?.changed)
                      ? [
                            <Tooltip
                                key="approve"
                                title={
                                    row.readiness?.blocking.length
                                        ? 'Fix the failing checks before approving'
                                        : undefined
                                }
                            >
                                <Button
                                    type="primary"
                                    disabled={Boolean(row.readiness?.blocking.length)}
                                    onClick={() => startDecision('APPROVED')}
                                >
                                    Approve
                                </Button>
                            </Tooltip>,
                        ]
                      : []),
              ]
            : [
                  <Button key="back" onClick={() => setStep('review')}>
                      Back
                  </Button>,
                  <Button
                      key="confirm"
                      type="primary"
                      danger={step === 'REJECTED'}
                      loading={isDeciding}
                      disabled={!selectedIds.length || noteError !== null}
                      onClick={submit}
                  >
                      {`${step === 'APPROVED' ? 'Approve' : 'Reject'} for ${selectedIds.length} ${
                          selectedIds.length === 1 ? 'partner' : 'partners'
                      }`}
                  </Button>,
              ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={footer}
            width={760}
            destroyOnHidden
            title={row ? `${row.label} · ${partnerLabel(row)}` : 'Service approval'}
        >
            {isLoading || !review || !row ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <Flex vertical gap={20}>
                    <Flex gap={8} align="center" wrap="wrap">
                        <StatusPill {...approvalStatusPill(row.status)} />
                        {row.drift?.changed ? <DriftTag drift={row.drift} /> : null}
                        <Typography.Text className="text-[13px] text-textBody">
                            {row.switchedOn
                                ? 'Switched on in this partner’s menu'
                                : 'Switched off in this partner’s menu'}
                        </Typography.Text>
                        {row.decidedAt && (
                            <Typography.Text className="text-[13px] text-textBody">
                                {`Decided by ${row.decidedByName || 'system'} on ${dayjs(row.decidedAt).format('DD MMM YYYY')}`}
                            </Typography.Text>
                        )}
                    </Flex>
                    {row.note && (
                        <Typography.Text className="text-[13px] italic text-textBody">
                            {row.note}
                        </Typography.Text>
                    )}

                    <Flex vertical gap={8}>
                        <Typography.Text strong className="text-textHeadings">
                            Checklist
                        </Typography.Text>
                        <ApprovalChecklist items={review.checklist} />
                    </Flex>

                    {review.evidence && (
                        <Flex vertical gap={8}>
                            <Typography.Text strong className="text-textHeadings">
                                Journal evidence
                            </Typography.Text>
                            <SummaryStrip
                                items={evidenceItems(review.evidence)}
                                faq={{ screen: 'Approvals', tab: 'Evidence' }}
                            />
                            {review.evidence.recentOrders.length > 0 && (
                                <Table
                                    size="small"
                                    rowKey="id"
                                    pagination={false}
                                    columns={ORDER_COLUMNS}
                                    dataSource={review.evidence.recentOrders}
                                />
                            )}
                        </Flex>
                    )}

                    <Flex vertical gap={8}>
                        <Typography.Text strong className="text-textHeadings">
                            Decision history
                        </Typography.Text>
                        {review.history.length ? (
                            review.history.map(event => (
                                <Flex key={event.id} gap={8} align="start" wrap="wrap">
                                    <StatusPill
                                        {...approvalStatusPill(
                                            event.action === 'GRANDFATHERED'
                                                ? 'APPROVED'
                                                : event.action
                                        )}
                                    />
                                    <Typography.Text className="text-[13px] text-textBody">
                                        {`by ${event.actorName || 'system'} on ${dayjs(event.createdAt).format('DD MMM YYYY')}`}
                                        {event.note ? ` — ${event.note}` : ''}
                                    </Typography.Text>
                                </Flex>
                            ))
                        ) : (
                            <Typography.Text className="text-[13px] text-textBody">
                                No decision yet.
                            </Typography.Text>
                        )}
                    </Flex>

                    {step !== 'review' && (
                        <DecisionPanel
                            decision={step}
                            candidates={eligiblePartners(siblings, step)}
                            currentLabel={row.label}
                            selectedIds={selectedIds}
                            onSelect={setSelectedIds}
                            note={note}
                            onNoteChange={setNote}
                            noteError={note ? noteError : null}
                            offlineWarning={
                                goingOffline.length ? offlineWarning(row.label, goingOffline) : null
                            }
                            refused={refused}
                        />
                    )}
                </Flex>
            )}
        </Modal>
    );
};

export default ApprovalReviewModal;
