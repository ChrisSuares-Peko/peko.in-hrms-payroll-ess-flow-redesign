import { useEffect, useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Flex, InputNumber, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { getFinancialFields } from './journalFields';
import JournalStatusBreakdown from './JournalStatusBreakdown';
import { retryJournal } from '../../api/orderJournal';
import { JournalKey } from '../../types/orderJournal';

type Props = {
    open: boolean;
    onClose: () => void;
    record: any | null;
    resolveAccounts: (
        accountIds: string[],
        corporateTxnId?: string
    ) => Promise<Record<string, string>>;
    onRetried?: () => void;
};

// Only these two types' rebuild actually reads the edited breakdown fields.
const EDITABLE_VIA_BREAKDOWN: JournalKey[] = ['transaction', 'refund'];

const resolveRetryableKey = (status: Record<string, boolean | undefined>): JournalKey | null => {
    const failedKeys = EDITABLE_VIA_BREAKDOWN.filter(key => status[key] === false);
    if (failedKeys.length) {
        return failedKeys.includes('transaction') ? 'transaction' : failedKeys[0];
    }
    return status.transaction === undefined ? 'transaction' : null;
};

// A "transaction" retry that also fixed Refund/Admin Refund reports what happened to those too.
const describeCascade = (cascaded?: Partial<Record<JournalKey, { success: boolean }>>) => {
    if (!cascaded) return '';
    const parts = Object.entries(cascaded).map(
        ([key, result]) => `${key}: ${result?.success ? 'succeeded' : 'still failing'}`
    );
    return parts.length ? ` Also retried — ${parts.join(', ')}.` : '';
};

const OrderJournalDrawer = ({ open, onClose, record, resolveAccounts, onRetried }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const status = record?.journalRecordStatus ?? {};
    const journalData: Record<string, any> = record?.journalData ?? {};
    const financialFields = getFinancialFields(journalData);
    const retryableKey = resolveRetryableKey(status);
    // With no stored financial numbers there is nothing to recompute from, so a retry would just
    // post an empty journal — offer it only when there's actually data behind it. The Journal
    // Status tooltip still explains why it was skipped.
    const canRetry = !!retryableKey && financialFields.length > 0;

    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [values, setValues] = useState<Record<string, number>>({});

    useEffect(() => {
        setIsEditing(false);
        setValues(
            Object.fromEntries(financialFields.map(({ key }) => [key, journalData[key] ?? 0]))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [record?.corporateTxnId]);

    const handleSave = async () => {
        if (!retryableKey || !record?.corporateTxnId || isSubmitting) return;
        setIsSubmitting(true);
        const result = await retryJournal({
            userId: id,
            userType: role,
            corporateTxnId: record.corporateTxnId,
            journalKey: retryableKey,
            journalData: values,
        });
        setIsSubmitting(false);

        if (result && result.success) {
            dispatch(
                showToast({
                    description: `Journal retried successfully.${describeCascade(result.cascaded)}`,
                    variant: 'success',
                })
            );
            setIsEditing(false);
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
        <Drawer
            title={<Typography.Text strong>Journal Entry</Typography.Text>}
            open={open}
            onClose={onClose}
            width={600}
            destroyOnClose
        >
            <Flex vertical gap={16}>
                <JournalStatusBreakdown
                    status={status}
                    journalData={journalData}
                    corporateTxnId={record?.corporateTxnId}
                    resolveAccounts={resolveAccounts}
                    onRetried={onRetried}
                />

                <Flex justify="space-between" align="center">
                    <Typography.Title level={5} style={{ margin: 0 }}>
                        Financial Breakdown
                    </Typography.Title>
                    {/* Saving here always recomputes + reposts to the provider (unlike Peko-AE,
                        there's no separate persist-only path), so "Edit & Retry" is accurate for
                        both a Failed and a Skipped row — not just the Skipped one AE labels this way. */}
                    {canRetry && !isEditing && (
                        <Button
                            size="small"
                            type="primary"
                            danger
                            icon={<EditOutlined />}
                            onClick={() => setIsEditing(true)}
                        >
                            Edit & Retry
                        </Button>
                    )}
                </Flex>

                {!isEditing ? (
                    <Descriptions bordered column={1} size="small">
                        {financialFields.map(({ key, label, isPercent }) => (
                            <Descriptions.Item key={key} label={label}>
                                {isPercent
                                    ? `${formatNumberWithLocalString(journalData[key] ?? 0)}%`
                                    : `₹ ${formatNumberWithLocalString(journalData[key] ?? 0)}`}
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                ) : (
                    <Flex vertical gap={16}>
                        <div className="grid grid-cols-2 gap-4">
                            {financialFields.map(({ key, label }) => (
                                <Flex vertical gap={4} key={key}>
                                    <Typography.Text>{label}</Typography.Text>
                                    <InputNumber
                                        className="w-full"
                                        value={values[key] ?? 0}
                                        onChange={value =>
                                            setValues(prev => ({ ...prev, [key]: value ?? 0 }))
                                        }
                                    />
                                </Flex>
                            ))}
                        </div>
                        <Flex gap={8}>
                            <Button onClick={() => setIsEditing(false)} block>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                danger
                                loading={isSubmitting}
                                onClick={handleSave}
                                block
                            >
                                Update & Retry
                            </Button>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Drawer>
    );
};

export default OrderJournalDrawer;
