import React from 'react';

import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import { SavingSummary, SubmitItemRow } from './SubmitProgressItems';
import { Step, useAiCheckStream } from '../hooks/useAiCheckStream';
import { ProgressStepKey, useSubmitProgress } from '../hooks/useSubmitProgress';

const { Text } = Typography;

interface AiCheckModalProps {
    open: boolean;
    referenceId: string | null;
    apiSuccess?: boolean;
    submitError?: { message: string; errors?: string[] } | null;
    isResubmitting?: boolean;
    onReview: () => void;
    onContinue: () => void;
    onSubmitAnyway?: () => void;
}

// ─── Bouncing Dots (while pending) ─────────────────────────────────────────
function BouncingDots() {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: '#FF4F4F',
                        animation: 'peko-bounce 0.9s ease-in-out infinite',
                        animationDelay: `${i * 120}ms`,
                    }}
                />
            ))}
        </span>
    );
}

// ─── Shimmer progress bar (while pending) ──────────────────────────────────
function ShimmerBar() {
    return (
        <div
            style={{
                height: 2,
                borderRadius: 999,
                background: '#F3F4F6',
                overflow: 'hidden',
                marginBottom: 12,
            }}
        >
            <div
                style={{
                    height: '100%',
                    width: '33%',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, transparent, #FF4F4F, transparent)',
                    animation: 'peko-shimmer 1.8s ease-in-out infinite',
                }}
            />
        </div>
    );
}

// ─── Step row icon ─────────────────────────────────────────────────────────
function StepIcon({ status }: { status: Step['status'] }) {
    if (status === 'loading') {
        return (
            <span style={{ position: 'relative', display: 'inline-flex', width: 12, height: 12 }}>
                <span
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: '#FF4F4F',
                        opacity: 0.5,
                        animation: 'peko-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                />
                <span
                    style={{
                        position: 'relative',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#FF4F4F',
                    }}
                />
            </span>
        );
    }
    if (status === 'success') {
        return <CheckCircleFilled style={{ color: '#26A411', fontSize: 20 }} />;
    }
    if (status === 'error') {
        return <CloseCircleFilled style={{ color: '#FAAD14', fontSize: 20 }} />;
    }
    // pending
    return (
        <span
            style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#E5E7EB',
            }}
        />
    );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
const AiCheckModal: React.FC<AiCheckModalProps> = ({
    open,
    referenceId,
    apiSuccess = false,
    submitError = null,
    isResubmitting = false,
    onReview,
    onContinue,
    onSubmitAnyway,
}) => {
    const { steps, updates, errors, isComplete, isFailed, isPending } = useAiCheckStream(
        referenceId,
        open,
        apiSuccess
    );
    const { itemsByStep, summary } = useSubmitProgress(updates);

    const hasSubmitError = Boolean(submitError);

    // Compliance verdicts (mirror the vendor): blocked stops the flow, flagged
    // still submits (an admin verifies later). Both arrive as stream `updates`.
    const isBlocked = updates.some(u => u.stage === 'compliance_blocked');
    const isFlagged = updates.some(u => u.stage === 'compliance_flagged');
    // A genuine validation/needs-review failure — NOT a compliance verdict.
    const hasValidationError = hasSubmitError || (isFailed && !isBlocked && !isFlagged);
    // Clean success or flagged-but-submitted → the user may proceed.
    const canProceed = !isBlocked && !hasValidationError && (isComplete || isFlagged);
    // Merge stream errors with submit-API errors so the per-step bullet list
    // renders all of them under the failed step (vendor parity — no separate
    // banner). Headline-only `submitError.message` is added as a fallback
    // when no array errors are present, so we never lose the BE's reason.
    const effectiveErrors: string[] = [
        ...errors,
        ...(submitError?.errors ?? []),
        ...(submitError &&
        (!submitError.errors || submitError.errors.length === 0) &&
        submitError.message
            ? [submitError.message]
            : []),
    ];
    // Pusher's `validation_failed` event already marks a step as 'error'
    // organically. But when a submit-API failure arrives before any Pusher
    // event (network drop, pre-AI 4xx), no step has errored yet — flip the
    // currently-loading step (or 'preparing' if all are still pending) so
    // the per-step error bullets actually render.
    const effectiveSteps = (() => {
        const anyStreamErrored = steps.some(s => s.status === 'error');
        if (anyStreamErrored || !hasSubmitError) return steps;
        const next = steps.map(s => ({ ...s }));
        const loadingIdx = next.findIndex(s => s.status === 'loading');
        const targetIdx = loadingIdx >= 0 ? loadingIdx : 0;
        if (next[targetIdx]) next[targetIdx].status = 'error';
        return next;
    })();
    const hasErrors = effectiveErrors.length > 0 || hasSubmitError;
    // When the submit API failed, the Pusher stream never starts, so isPending
    // would otherwise stay true forever. Override it so the footer renders.
    const effectivePending = isPending && !hasSubmitError;
    const showFooter = !effectivePending || hasErrors;

    let headerText = 'Submission complete';
    if (effectivePending) headerText = 'Processing your application with our AI assistant';
    else if (isBlocked) headerText = 'Blocked by compliance';
    else if (hasValidationError) headerText = 'Submission needs review';

    return (
        <Modal
            open={open}
            closable={false}
            maskClosable={false}
            footer={null}
            width={520}
            destroyOnClose
        >
            {/* Global keyframes (inline) */}
            <style>{`
                @keyframes peko-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes peko-shimmer {
                    0% { transform: translateX(-200%); }
                    100% { transform: translateX(500%); }
                }
                @keyframes peko-ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                @keyframes peko-cursor-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>

            {/* Header */}
            <Flex align="center" gap={10} className="pb-3">
                {effectivePending && <BouncingDots />}
                {hasSubmitError && (
                    <ExclamationCircleFilled style={{ color: '#FF4F4F', fontSize: 18 }} />
                )}
                <Text className="text-base font-medium text-neutral-800">{headerText}</Text>
            </Flex>

            {/* Shimmer while pending */}
            {effectivePending && <ShimmerBar />}

            {/* Step list — always rendered. Errors (Pusher stream + submit-API)
                surface inline as bullets under whichever step is in 'error'
                state, matching vendor's CompanySubmitModal. */}
            <ul
                style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    // Bound the streamed step/sub-item list so a long submission
                    // (many fields/files/compliance rows) scrolls inside the
                    // modal instead of growing past the viewport. Header and
                    // footer stay fixed outside this scroll container.
                    maxHeight: '55vh',
                    overflowY: 'auto',
                    paddingRight: 4,
                }}
            >
                {effectiveSteps.map(step => {
                    const stepItems =
                        step.stage in itemsByStep ? itemsByStep[step.stage as ProgressStepKey] : [];
                    const doneItemStatuses = ['ok', 'done', 'clear', 'review', 'blocked'];
                    const doneCount = stepItems.filter(i =>
                        doneItemStatuses.includes(i.status)
                    ).length;
                    const rowStyle: React.CSSProperties = {
                        display: 'flex',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 12,
                        transition: 'all 0.5s ease',
                    };
                    if (step.status === 'loading') {
                        rowStyle.background = '#FFF7F7';
                        rowStyle.boxShadow = 'inset 0 0 0 1px rgba(255, 79, 79, 0.2)';
                    } else if (step.status === 'success') {
                        rowStyle.background = 'rgba(38, 164, 17, 0.06)';
                    } else if (step.status === 'error') {
                        rowStyle.background = 'rgba(250, 173, 20, 0.1)';
                        rowStyle.boxShadow = 'inset 0 0 0 1px rgba(250, 173, 20, 0.25)';
                    }

                    let labelColor = '#9CA3AF'; // pending
                    if (step.status === 'loading') labelColor = '#FF4F4F';
                    else if (step.status === 'success') labelColor = '#4B5563';
                    else if (step.status === 'error') labelColor = '#D97706';

                    const labelWeight =
                        step.status === 'loading' || step.status === 'error' ? 500 : 400;

                    return (
                        <li key={step.stage} style={rowStyle}>
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 2,
                                }}
                            >
                                <StepIcon status={step.status} />
                            </div>

                            <Flex vertical gap={6} style={{ minWidth: 0, flex: 1 }}>
                                <Flex align="center" justify="space-between" gap={8}>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: labelColor,
                                            fontWeight: labelWeight,
                                            transition: 'color 0.3s ease',
                                        }}
                                    >
                                        {step.label}
                                        {step.status === 'loading' && (
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 1,
                                                    height: '0.85em',
                                                    background: '#FF4F4F',
                                                    marginLeft: 2,
                                                    verticalAlign: 'middle',
                                                    animation:
                                                        'peko-cursor-blink 1s step-end infinite',
                                                }}
                                            />
                                        )}
                                    </Text>
                                    {stepItems.length > 0 && step.status === 'loading' && (
                                        <Text
                                            className="text-xs text-neutral-400"
                                            style={{
                                                flexShrink: 0,
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {doneCount} / {stepItems.length}
                                        </Text>
                                    )}
                                </Flex>

                                {stepItems.length > 0 && step.status !== 'pending' && (
                                    <Flex vertical>
                                        {stepItems.map(item => (
                                            <SubmitItemRow key={item.key} item={item} />
                                        ))}
                                    </Flex>
                                )}

                                {step.stage === 'saving' && summary && (
                                    <SavingSummary summary={summary} />
                                )}

                                {step.status === 'error' && hasErrors && (
                                    <ul
                                        style={{
                                            listStyle: 'none',
                                            padding: 0,
                                            margin: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 4,
                                        }}
                                    >
                                        {effectiveErrors.map((err, i) => (
                                            <li
                                                key={i}
                                                style={{
                                                    fontSize: 12,
                                                    color: '#B45309',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 6,
                                                }}
                                            >
                                                <span style={{ marginTop: 2, flexShrink: 0 }}>
                                                    •
                                                </span>
                                                <span>{err}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Flex>
                        </li>
                    );
                })}
            </ul>

            {/* Footer — vendor parity: the modal stays open on success and the
                user clicks Continue to proceed (no auto-navigate). */}
            {showFooter && (
                <Flex
                    align="center"
                    justify={isFlagged && canProceed ? 'space-between' : 'flex-end'}
                    gap={8}
                    className="pt-4 mt-2"
                >
                    {isFlagged && canProceed && (
                        <Text className="text-xs text-neutral-500">
                            This application was flagged for compliance review — an admin will
                            verify and approve.
                        </Text>
                    )}

                    {isBlocked && (
                        <Button onClick={onReview} danger>
                            Close
                        </Button>
                    )}

                    {!isBlocked && hasValidationError && (
                        <Flex gap={8}>
                            <Button onClick={onReview} danger disabled={isResubmitting}>
                                Review
                            </Button>
                            {onSubmitAnyway && (
                                <Button
                                    type="primary"
                                    danger
                                    loading={isResubmitting}
                                    onClick={onSubmitAnyway}
                                >
                                    Submit Anyway
                                </Button>
                            )}
                        </Flex>
                    )}

                    {!isBlocked && !hasValidationError && canProceed && (
                        <Button type="primary" danger onClick={onContinue}>
                            Continue
                        </Button>
                    )}
                </Flex>
            )}
        </Modal>
    );
};

export default AiCheckModal;
