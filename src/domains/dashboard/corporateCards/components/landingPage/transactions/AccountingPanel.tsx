import {
    CheckCircleOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Input, Select, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';

import {
    ACCOUNTING_SPLITS,
    DEBIT_ACCOUNT_OPTIONS,
    GST_OPTIONS,
    TRANSACTIONS_COPY,
} from '../../../utils/transactionsData';
import { AccountingSplit } from '../../../utils/types';
import SectionCard from '../../common/SectionCard';

const { Text } = Typography;

const columns: ColumnsType<AccountingSplit> = [
    {
        key: 'debitAccount',
        title: 'Debit account',
        dataIndex: 'key',
        width: 170,
        render: () => (
            <Select
                size="small"
                placeholder="Select account"
                options={DEBIT_ACCOUNT_OPTIONS}
                className="w-full min-w-0"
            />
        ),
    },
    {
        key: 'amount',
        title: 'Amount (incl. GST)',
        dataIndex: 'key',
        width: 140,
        render: () => <Input placeholder="Enter" />,
    },
    {
        key: 'igst',
        title: 'IGST',
        dataIndex: 'key',
        width: 110,
        render: () => (
            <Select placeholder="Select" options={GST_OPTIONS} className="w-full min-w-0" />
        ),
    },
    {
        key: 'cgst',
        title: 'CGST',
        dataIndex: 'key',
        width: 110,
        render: () => (
            <Select placeholder="Select" options={GST_OPTIONS} className="w-full min-w-0" />
        ),
    },
    {
        key: 'sgst',
        title: 'SGST',
        dataIndex: 'key',
        width: 110,
        render: () => (
            <Select placeholder="Select" options={GST_OPTIONS} className="w-full min-w-0" />
        ),
    },
    {
        key: 'net',
        title: 'Net',
        dataIndex: 'net',
        width: 120,
        render: (net: string) => <Text className="text-sm text-textHeadings">{net}</Text>,
    },
    {
        key: 'gstAmount',
        title: 'GST amount',
        dataIndex: 'gstAmount',
        width: 130,
        render: (gstAmount: string) => (
            <Text className="text-sm text-textHeadings">{gstAmount}</Text>
        ),
    },
    {
        key: 'nonBusiness',
        title: 'Non-business',
        dataIndex: 'key',
        width: 130,
        render: () => <Checkbox>Personal</Checkbox>,
    },
    {
        key: 'memo',
        title: 'Memo',
        dataIndex: 'key',
        width: 140,
        render: () => <Input placeholder="Enter" />,
    },
    {
        key: 'actions',
        title: 'Actions',
        dataIndex: 'key',
        width: 90,
        render: () => (
            <Button type="text" danger aria-label="Remove split" icon={<DeleteOutlined />} />
        ),
    },
];

/** Transaction-detail "Accounting" panel: GST split-mapping table with QuickBooks export. */
const AccountingPanel = () => (
    <SectionCard title="Accounting">
        <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-lg bg-bgLightGray p-3">
                <InfoCircleOutlined className="mt-0.5 text-textGreyLight" />
                <Text className="text-xs text-textBody">{TRANSACTIONS_COPY.gstNote}</Text>
            </div>

            <div className="flex items-center justify-between">
                <Text className="text-sm font-semibold text-textHeadings">Split mapping</Text>
                <Button danger type="text" icon={<PlusOutlined />}>
                    Add Split
                </Button>
            </div>

            <GenericTable columns={columns} dataSource={ACCOUNTING_SPLITS} rowKey="key" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Text className="text-xs text-textBody">{TRANSACTIONS_COPY.allocationNote}</Text>
                <Tag
                    bordered={false}
                    className="m-0 flex items-center gap-1 rounded-full bg-savingsTagLightBg px-3 py-0.5 text-xs font-medium text-savingsTagLightText"
                >
                    <CheckCircleOutlined />
                    Balanced
                </Tag>
            </div>

            <Button type="primary" className="self-start">
                Map to QuickBooks
            </Button>
        </div>
    </SectionCard>
);

export default AccountingPanel;
