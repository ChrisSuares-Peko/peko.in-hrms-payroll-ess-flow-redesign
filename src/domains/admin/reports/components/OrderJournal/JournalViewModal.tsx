import { useEffect, useMemo, useState } from 'react';

import { Alert, Button, Descriptions, Flex, Modal, Table, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { manualJournalPath } from '@src/domains/admin/accounting/config/manualOperations';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { renderJournalStatus } from './journalStatus';
import { JournalKey } from '../../types/orderJournal';

type LineItem = {
    accountId: string;
    direction: 'debit' | 'credit';
    amount: number | string;
    description?: string;
};

type Journal = {
    lineItems?: LineItem[];
    journalDate?: string;
    referenceNumber?: string;
    notes?: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    label: string;
    journalKey: JournalKey;
    journal?: Journal | null;
    failed?: boolean;
    skipped?: boolean;
    corporateTxnId: string | number;
    resolveAccounts: (
        accountIds: string[],
        corporateTxnId?: string
    ) => Promise<Record<string, string>>;
};

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const FIX_LINK_TEXT = 'Fix in Manual Operations';

const JournalViewModal = ({
    open,
    onClose,
    label,
    journalKey,
    journal,
    failed,
    skipped,
    corporateTxnId,
    resolveAccounts,
}: Props) => {
    const [names, setNames] = useState<Record<string, string>>({});

    const lines = useMemo(() => journal?.lineItems ?? [], [journal]);

    useEffect(() => {
        if (!open) return;
        const ids = [...new Set(lines.map(l => String(l.accountId)))];
        if (ids.length) resolveAccounts(ids, String(corporateTxnId)).then(setNames);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, journal]);

    const totals = useMemo(() => {
        const debit = lines.reduce(
            (s, l) => s + (l.direction === 'debit' ? Number(l.amount) || 0 : 0),
            0
        );
        const credit = lines.reduce(
            (s, l) => s + (l.direction === 'credit' ? Number(l.amount) || 0 : 0),
            0
        );
        return { debit: round2(debit), credit: round2(credit) };
    }, [lines]);

    const amountCell = (row: LineItem, direction: 'debit' | 'credit') => {
        if (row.direction !== direction)
            return <Typography.Text type="secondary">—</Typography.Text>;
        return (
            <Typography.Text>₹ {formatNumberWithLocalString(Number(row.amount))}</Typography.Text>
        );
    };

    const columns = [
        {
            title: 'Account',
            dataIndex: 'accountId',
            render: (accountId: string) => (
                <Typography.Text>{names[accountId] || accountId}</Typography.Text>
            ),
        },
        {
            title: 'Debit',
            key: 'debit',
            width: 160,
            render: (_: any, r: LineItem) => amountCell(r, 'debit'),
        },
        {
            title: 'Credit',
            key: 'credit',
            width: 160,
            render: (_: any, r: LineItem) => amountCell(r, 'credit'),
        },
    ];

    const fixLink = failed ? (
        <Flex justify="end">
            <Link to={manualJournalPath(String(corporateTxnId), journalKey)}>
                <Button type="primary">{FIX_LINK_TEXT}</Button>
            </Link>
        </Flex>
    ) : null;

    const emptyBody = (
        <Flex vertical gap={16}>
            <Alert
                type="info"
                showIcon
                message="This journal has not been recorded yet."
                description="Once the journal is posted to the accounting provider, its exact entry will appear here."
            />
            {fixLink}
        </Flex>
    );

    const readBody = (
        <Flex vertical gap={16}>
            <Descriptions column={1} size="small">
                <Descriptions.Item label="Reference">
                    {journal?.referenceNumber || corporateTxnId}
                </Descriptions.Item>
                <Descriptions.Item label="Date">{journal?.journalDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="Notes">{journal?.notes || '-'}</Descriptions.Item>
            </Descriptions>

            <Table
                rowKey={(_: any, i?: number) => String(i)}
                columns={columns}
                dataSource={lines}
                pagination={false}
                size="small"
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0}>
                            <Typography.Text strong>Total</Typography.Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                            <Typography.Text strong>
                                ₹ {formatNumberWithLocalString(totals.debit)}
                            </Typography.Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                            <Typography.Text strong>
                                ₹ {formatNumberWithLocalString(totals.credit)}
                            </Typography.Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
            {fixLink}
        </Flex>
    );

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={800}
            destroyOnClose
            title={
                <Flex align="center" gap={8}>
                    <Typography.Text strong>{label} — Journal</Typography.Text>
                    {failed && renderJournalStatus(false, { skipped })}
                </Flex>
            }
        >
            {lines.length === 0 ? emptyBody : readBody}
        </Modal>
    );
};

export default JournalViewModal;
