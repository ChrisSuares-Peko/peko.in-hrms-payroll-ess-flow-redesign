import { useMemo, useState } from 'react';

import { EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Flex, Modal, Table, Tag, Tooltip, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Reports } from '../types/WalletReportTypes';

type Props = {
    open: boolean;
    record: Reports | null;
    onClose: () => void;
    onRetry: (record: Reports) => Promise<void>;
    retrying: boolean;
};

const WalletJournalDrawer = ({ open, record, onClose, onRetry, retrying }: Props) => {
    const [journalOpen, setJournalOpen] = useState(false);
    const posted = record?.journalRecordStatus?.walletTransfer;
    const data = record?.journalData?.walletTransfer;
    const amount = record?.transactionType === 'CREDIT' ? record.creditAmount : record?.debitAmount;
    const canRetry = posted !== true;
    const skipped = data?.skipped === true;
    const lines = useMemo(() => data?.lineItems ?? [], [data?.lineItems]);
    const totals = useMemo(
        () => ({
            debit: lines.reduce(
                (sum, line) => sum + (line.direction === 'debit' ? Number(line.amount) || 0 : 0),
                0
            ),
            credit: lines.reduce(
                (sum, line) => sum + (line.direction === 'credit' ? Number(line.amount) || 0 : 0),
                0
            ),
        }),
        [lines]
    );

    const journalColumns = [
        {
            title: 'Account',
            dataIndex: 'accountId',
            render: (accountId: string) => {
                const accountName = data?.accountNames?.[accountId] || accountId;
                return accountName === 'Subscribers Wallet' && record?.credential?.username
                    ? `${accountName} - ${record.credential.username}`
                    : accountName;
            },
        },
        {
            title: 'Debit',
            render: (_: unknown, line: (typeof lines)[number]) =>
                line.direction === 'debit' ? `₹ ${formatNumberWithLocalString(line.amount)}` : '—',
        },
        {
            title: 'Credit',
            render: (_: unknown, line: (typeof lines)[number]) =>
                line.direction === 'credit' ? `₹ ${formatNumberWithLocalString(line.amount)}` : '—',
        },
    ];
    let statusTag = <Tag>Not recorded</Tag>;
    if (skipped) statusTag = <Tag>Skipped</Tag>;
    else if (posted === true) statusTag = <Tag color="green">Recorded</Tag>;
    else if (posted === false) statusTag = <Tag color="red">Failed</Tag>;

    return (
        <Drawer
            title={<Typography.Text strong>Journal Entry</Typography.Text>}
            open={open}
            onClose={onClose}
            width={600}
            destroyOnClose
        >
            <Flex vertical gap={24}>
                <div>
                    <Typography.Title level={5}>Journal Status</Typography.Title>
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: '45%' }}>
                        <Descriptions.Item label="Wallet Transfer">
                            <Flex align="center" justify="space-between">
                                {statusTag}
                                <Flex align="center" gap={6}>
                                    {data?.reason && (
                                        <Tooltip title={data.reason}>
                                            <InfoCircleOutlined className="text-[#8c8c8c]" />
                                        </Tooltip>
                                    )}
                                    <Tooltip
                                        title={
                                            lines.length
                                                ? 'View journal'
                                                : 'No journal lines to show'
                                        }
                                    >
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EyeOutlined />}
                                            disabled={!lines.length}
                                            onClick={() => setJournalOpen(true)}
                                        />
                                    </Tooltip>
                                </Flex>
                            </Flex>
                        </Descriptions.Item>
                        {data?.reason && (
                            <Descriptions.Item label="Reason">{data.reason}</Descriptions.Item>
                        )}
                    </Descriptions>
                </div>

                <div>
                    <Typography.Title level={5}>Financial Breakdown</Typography.Title>
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Transfer Type">
                            {record?.transactionType || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Amount">
                            ₹ {formatNumberWithLocalString(amount || 0)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Corporate COA">
                            Subscribers Wallet
                        </Descriptions.Item>
                        <Descriptions.Item label="Admin COA">Cashback Expense</Descriptions.Item>
                    </Descriptions>
                </div>

                {canRetry && record && (
                    <Button
                        type="primary"
                        danger
                        loading={retrying}
                        onClick={() => onRetry(record)}
                    >
                        Retry Journal
                    </Button>
                )}
            </Flex>
            <Modal
                title="Wallet Transfer — Journal"
                open={journalOpen}
                onCancel={() => setJournalOpen(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Descriptions column={1} size="small" className="mb-4">
                    <Descriptions.Item label="Reference">
                        {data?.referenceNumber || record?.corporateTxnId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Date">{data?.journalDate || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Notes">{data?.notes || '-'}</Descriptions.Item>
                </Descriptions>
                <Table
                    rowKey={(_, index) => String(index)}
                    columns={journalColumns}
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
            </Modal>
        </Drawer>
    );
};

export default WalletJournalDrawer;
