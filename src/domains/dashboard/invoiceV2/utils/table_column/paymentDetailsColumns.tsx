import { Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { InfoRow } from '../../types/invoiceDetails';

const statusColor: Record<string, string> = {
    PAID: 'green',
    PENDING: 'gold',
    EXPIRED: 'red',
};

const cellStyle = { padding: '4px 12px' };

export const paymentDetailsColumns: ColumnsType<InfoRow> = [
    {
        dataIndex: 'label',
        width: 250,
        onCell: () => ({ style: cellStyle }),
        render: (text: string) => (
            <Typography.Text className="font-medium text-neutral-500">{text}</Typography.Text>
        ),
    },
    {
        dataIndex: 'value',
        onCell: () => ({ style: cellStyle }),
        render: (value: string, row) =>
            row.isBadge && value ? (
                <Tag
                    color={statusColor[value] ?? 'gold'}
                    className="rounded-full px-3 py-1 text-xs font-medium border-0"
                >
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                </Tag>
            ) : (
                <Typography.Text className="text-sm text-gray-800 whitespace-pre-line">{value ?? '—'}</Typography.Text>
            ),
    },
];
