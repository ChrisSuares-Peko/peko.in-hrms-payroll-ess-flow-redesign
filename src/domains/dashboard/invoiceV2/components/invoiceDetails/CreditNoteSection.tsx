import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Table, Typography } from 'antd';

import { CreditNoteRow, CreditNoteStatus } from '../../types/creditNote';
import { CREDIT_NOTE_REASON_LABELS } from '../../utils/constants/creditNote';
import { formatCurrencyAmount, formatDate } from '../../utils/helperFunctions';
import CreditNoteStatusSelect from '../creditNote/CreditNoteStatusSelect';

interface Props {
    creditNotes: CreditNoteRow[];
    onCreateCreditNote: () => void;
    onUpdateStatus: (creditNoteId: string, status: CreditNoteStatus) => Promise<boolean>;
}

const buildColumns = (
    onUpdateStatus: (creditNoteId: string, status: CreditNoteStatus) => Promise<boolean>
) => [
    {
        title: 'Credit Note No',
        dataIndex: 'creditNoteNumber',
        key: 'creditNoteNumber',
        render: (val: string, record: CreditNoteRow) => (
            <Typography.Text className="text-sm font-medium text-gray-800">
                {record.prefix ? `${record.prefix}${val}` : val}
            </Typography.Text>
        ),
    },
    {
        title: 'Date',
        dataIndex: 'issueDate',
        key: 'issueDate',
        render: (val: string) => (
            <Typography.Text className="text-sm text-gray-700">{formatDate(val)}</Typography.Text>
        ),
    },
    {
        title: 'Reason',
        dataIndex: 'reason',
        key: 'reason',
        render: (val: string) => (
            <Typography.Text className="text-sm text-gray-500">
                {CREDIT_NOTE_REASON_LABELS[val] ?? val}
            </Typography.Text>
        ),
    },
    {
        title: 'Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (val: string, record: CreditNoteRow) => (
            <Typography.Text className="text-sm font-medium text-red-500">
                -{formatCurrencyAmount(val, record.currency)}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: CreditNoteStatus, record: CreditNoteRow) => (
            <CreditNoteStatusSelect
                creditNoteId={record.id}
                status={status}
                onChange={onUpdateStatus}
            />
        ),
    },
];

const CreditNoteSection = ({ creditNotes, onCreateCreditNote, onUpdateStatus }: Props) => {
    const columns = buildColumns(onUpdateStatus);

    return (
        <Card
            className="w-full rounded-2xl"
            styles={{ body: { padding: 0, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 } }}
        >
            <Flex vertical gap={12} className="px-5 pt-5">
                <Flex justify="space-between" align="center" gap={8} wrap>
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-xl font-semibold">
                            Credit Notes
                        </Typography.Text>
                        <Typography.Text className="text-sm text-gray-500">
                            Credit notes issued against this invoice
                        </Typography.Text>
                    </Flex>
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        onClick={onCreateCreditNote}
                    >
                        Create Credit Note
                    </Button>
                </Flex>
            </Flex>

            {creditNotes.length === 0 ? (
                <Flex vertical align="center" gap={4} className="px-5 py-6">
                    <Typography.Text className="text-sm text-gray-500">
                        No credit notes issued against this invoice
                    </Typography.Text>
                    <button
                        type="button"
                        onClick={onCreateCreditNote}
                        className="text-sm text-red-500 font-medium bg-transparent border-0 p-0 cursor-pointer"
                    >
                        Issue the first credit note
                    </button>
                </Flex>
            ) : (
                <div className="mt-3">
                    <Table
                        dataSource={creditNotes.map(cn => ({ ...cn, key: cn.id }))}
                        columns={columns}
                        pagination={false}
                        size="small"
                        scroll={{ x: 500, ...(creditNotes.length > 3 ? { y: 220 } : {}) }}
                    />
                </div>
            )}
        </Card>
    );
};

export default CreditNoteSection;
