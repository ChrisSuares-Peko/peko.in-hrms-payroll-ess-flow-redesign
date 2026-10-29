import { Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { InfoRow } from '../../types/documentDetails';

const statusColor: Record<string, string> = {
    PAID: 'green',
    PENDING: 'gold',
    EXPIRED: 'red',
};

export const paymentDetailsColumns: ColumnsType<InfoRow> = [
    {
        dataIndex: 'label',
        width: 160,
        render: (text: string) => (
            <Typography.Text className="font-medium text-neutral-500">{text}</Typography.Text>
        ),
    },
    {
        dataIndex: 'value',
        onCell: () => ({ style: { wordBreak: 'break-word', overflowWrap: 'break-word' } }),
        render: (value: string, row) =>
            row.isBadge && value ? (
                <Tag
                    color={statusColor[value] ?? 'gold'}
                    className="rounded-full px-3 py-1 text-xs font-medium border-0"
                >
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                </Tag>
            ) : (
                <Typography.Text
                    className={`text-sm text-gray-800 break-words${row.isMultiline ? ' whitespace-pre-line' : ''}`}
                >
                    {value ?? '—'}
                </Typography.Text>
            ),
    },
];
