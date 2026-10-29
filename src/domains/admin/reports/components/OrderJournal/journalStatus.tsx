import { Flex, Tag, Typography } from 'antd';

export type JournalRecordStatus = {
    transaction?: boolean;
    refund?: boolean;
    adminRefund?: boolean;
    cashback?: boolean;
    cashbackReversal?: boolean;
};

export const JOURNAL_STATUS_TYPES: {
    label: string;
    key: keyof JournalRecordStatus;
    skippedOnUndefined?: boolean;
}[] = [
    { label: 'Transaction', key: 'transaction', skippedOnUndefined: true },
    { label: 'Refund', key: 'refund' },
    { label: 'Admin Refund', key: 'adminRefund' },
    { label: 'Cashback', key: 'cashback' },
    { label: 'Cashback Reversal', key: 'cashbackReversal' },
];

export type JournalData = Record<string, { skipped?: boolean; reason?: string } | undefined> | null;

type JournalOutcome = 'recorded' | 'skipped' | 'failed';

const OUTCOME_TAGS: Record<JournalOutcome, { color: string; label: string }> = {
    recorded: { color: 'green', label: 'Recorded' },
    skipped: { color: 'default', label: 'Skipped' },
    failed: { color: 'red', label: 'Failed' },
};

const outcomeOf = (value: boolean | undefined, skipped: boolean): JournalOutcome | null => {
    if (value === true) return 'recorded';
    if (skipped) return 'skipped';
    if (value === false) return 'failed';
    return null;
};

export const renderJournalStatus = (
    value?: boolean,
    opts?: { skippedOnUndefined?: boolean; skipped?: boolean }
) => {
    const outcome = outcomeOf(value, opts?.skipped === true);
    if (outcome)
        return <Tag color={OUTCOME_TAGS[outcome].color}>{OUTCOME_TAGS[outcome].label}</Tag>;
    return opts?.skippedOnUndefined ? (
        <Tag color="default">Not recorded</Tag>
    ) : (
        <Typography.Text type="secondary">—</Typography.Text>
    );
};

export const renderJournalStatusSummary = (
    status?: JournalRecordStatus | null,
    journalData?: JournalData
) => {
    const outcomes = JOURNAL_STATUS_TYPES.map(({ key }) =>
        outcomeOf(status?.[key], journalData?.[key]?.skipped === true)
    );
    const countOf = (outcome: JournalOutcome) => outcomes.filter(value => value === outcome).length;
    const success = countOf('recorded');
    const failure = countOf('failed');
    const skipped = countOf('skipped');
    if (!success && !failure && !skipped) return <Tag color="default">Not recorded</Tag>;
    return (
        <Flex vertical>
            {success > 0 && <Tag color="green">Success: {success}</Tag>}
            {failure > 0 && <Tag color="red">Failed: {failure}</Tag>}
            {skipped > 0 && <Tag color="default">Skipped: {skipped}</Tag>}
        </Flex>
    );
};
