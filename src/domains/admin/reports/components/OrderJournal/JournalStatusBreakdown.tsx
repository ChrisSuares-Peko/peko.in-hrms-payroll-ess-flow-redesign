import { useState } from 'react';

import { EyeOutlined, InfoCircleOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Descriptions, Flex, Tooltip, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { manualJournalPath } from '@src/domains/admin/accounting/config/manualOperations';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { JOURNAL_STATUS_TYPES, renderJournalStatus } from './journalStatus';
import JournalViewModal from './JournalViewModal';
import { retryAllFailedJournals, retryJournal } from '../../api/orderJournal';
import { JournalKey } from '../../types/orderJournal';

type SelectedType = { label: string; key: JournalKey };

const retryAllLabel = (hasRefused: boolean, hasBlocked: boolean) => {
    if (hasRefused && hasBlocked) return 'Retry Failed & Skipped Journals';
    return hasBlocked ? 'Retry Skipped Journals' : 'Retry Failed Journals';
};

type Props = {
    status?: Record<string, boolean | undefined> | null;
    journalData?: Record<string, any> | null;
    corporateTxnId: string | number;
    resolveAccounts: (
        accountIds: string[],
        corporateTxnId?: string
    ) => Promise<Record<string, string>>;
    onRetried?: () => void;
};

const JournalStatusBreakdown = ({
    status,
    journalData,
    corporateTxnId,
    resolveAccounts,
    onRetried,
}: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [selected, setSelected] = useState<SelectedType | null>(null);
    const [retryingKey, setRetryingKey] = useState<JournalKey | null>(null);
    const [isRetryingAll, setIsRetryingAll] = useState(false);
    const unposted = Object.entries(status ?? {})
        .filter(([, value]) => value === false)
        .map(([key]) => key);
    const hasBlocked = unposted.some(key => journalData?.[key]?.skipped === true);
    const hasRefused = unposted.some(key => journalData?.[key]?.skipped !== true);

    const handleRetryAll = async () => {
        setIsRetryingAll(true);
        const result = await retryAllFailedJournals({
            userId: id,
            userType: role,
            corporateTxnId: String(corporateTxnId),
        });
        setIsRetryingAll(false);

        if (result && result.results) {
            const entries = Object.values(result.results) as {
                success: boolean;
                reason?: string;
                error?: string;
            }[];
            const succeeded = entries.filter(r => r.success).length;
            const refused = entries.find(r => !r.success && (r.reason || r.error));
            const why = refused ? ` ${refused.reason || refused.error}` : '';
            dispatch(
                showToast({
                    description: `${succeeded} of ${entries.length} retried successfully.${why}`,
                    variant: succeeded === entries.length ? 'success' : 'error',
                })
            );
            onRetried?.();
        } else {
            dispatch(showToast({ description: 'Retry all failed to run', variant: 'error' }));
        }
    };

    const handleRetry = async (key: JournalKey) => {
        setRetryingKey(key);
        const result = await retryJournal({
            userId: id,
            userType: role,
            corporateTxnId: String(corporateTxnId),
            journalKey: key,
        });
        setRetryingKey(null);

        if (result && result.success) {
            dispatch(showToast({ description: `${key} retried successfully`, variant: 'success' }));
            onRetried?.();
        } else {
            dispatch(
                showToast({
                    description: (result && (result.error || result.reason)) || 'Retry failed',
                    variant: 'error',
                })
            );
        }
    };

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center">
                <Typography.Title level={5} style={{ margin: 0 }}>
                    Journal Status
                </Typography.Title>
                {unposted.length > 0 && (
                    <Button
                        size="small"
                        danger
                        icon={<SyncOutlined />}
                        loading={isRetryingAll}
                        onClick={handleRetryAll}
                    >
                        {retryAllLabel(hasRefused, hasBlocked)}
                    </Button>
                )}
            </Flex>
            <Descriptions bordered column={1} size="small">
                {JOURNAL_STATUS_TYPES.map(({ label, key, skippedOnUndefined }) => {
                    const hasJournal = (journalData?.[key]?.lineItems ?? []).length > 0;
                    const reason = journalData?.[key]?.reason ?? null;
                    const isFailed = status?.[key] === false;
                    return (
                        <Descriptions.Item key={key} label={label}>
                            <Flex align="center" justify="space-between" gap={8}>
                                {renderJournalStatus(status?.[key], {
                                    skippedOnUndefined,
                                    skipped: journalData?.[key]?.skipped === true,
                                })}
                                <Flex align="center" gap={6}>
                                    {status?.[key] !== true && (
                                        <Link
                                            to={manualJournalPath(String(corporateTxnId), key)}
                                            className="text-xs"
                                            aria-label={`Record ${label} by hand`}
                                        >
                                            Record
                                        </Link>
                                    )}
                                    {reason && (
                                        <Tooltip title={reason}>
                                            <InfoCircleOutlined className="text-[#8c8c8c]" />
                                        </Tooltip>
                                    )}
                                    {isFailed && (
                                        <Tooltip title="Retry this one">
                                            <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<ReloadOutlined />}
                                                loading={retryingKey === key}
                                                onClick={() => handleRetry(key)}
                                            />
                                        </Tooltip>
                                    )}
                                    <Tooltip
                                        title={
                                            hasJournal ? 'View journal' : 'No line items to show'
                                        }
                                    >
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EyeOutlined />}
                                            disabled={!hasJournal}
                                            onClick={() => setSelected({ label, key })}
                                        />
                                    </Tooltip>
                                </Flex>
                            </Flex>
                        </Descriptions.Item>
                    );
                })}
            </Descriptions>

            <JournalViewModal
                open={!!selected}
                onClose={() => setSelected(null)}
                label={selected?.label ?? ''}
                journalKey={selected?.key ?? 'transaction'}
                journal={selected ? journalData?.[selected.key] : null}
                failed={selected ? status?.[selected.key] === false : false}
                skipped={selected ? journalData?.[selected.key]?.skipped === true : false}
                corporateTxnId={corporateTxnId}
                resolveAccounts={resolveAccounts}
            />
        </Flex>
    );
};

export default JournalStatusBreakdown;
