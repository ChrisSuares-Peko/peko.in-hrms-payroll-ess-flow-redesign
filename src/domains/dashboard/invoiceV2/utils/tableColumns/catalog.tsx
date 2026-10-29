import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { CatalogItemApiData } from '../../types/catalog';

type ActionHandlers = {
    onEdit: (item: CatalogItemApiData) => void;
    onDelete: (id: number) => void;
};

export const buildCatalogColumns = ({
    onEdit,
    onDelete,
}: ActionHandlers): ColumnsType<CatalogItemApiData> => [
    {
        title: 'Product',
        dataIndex: 'name',
        key: 'name',
        render: (v: string, r: CatalogItemApiData) => (
            <Flex vertical gap={2}>
                <span className="text-sm font-medium text-gray-900">{v}</span>
                {r.description && (
                    <span className="text-xs text-gray-400 line-clamp-1">{r.description}</span>
                )}
            </Flex>
        ),
    },
    {
        title: 'HSN/SAC Code',
        dataIndex: 'hsnCode',
        key: 'hsnCode',
        render: (v: string | null) => <span className="text-sm text-gray-700">{v || '—'}</span>,
    },
    {
        title: 'Unit Price',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        render: (v: string) => (
            <span className="text-sm font-medium text-gray-900">
                ₹
                {parseFloat(v).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </span>
        ),
    },
    {
        title: 'GST',
        dataIndex: 'gstPercent',
        key: 'gstPercent',
        render: (v: string) => (
            <span className="text-sm text-gray-700">{String(v).replace(/%$/, '')}%</span>
        ),
    },
    {
        title: 'Action',
        key: 'actions',
        width: 90,
        render: (_v: unknown, r: CatalogItemApiData) => (
            <Flex gap={4}>
                <Tooltip title="Edit">
                    <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(r)}
                    />
                </Tooltip>
                <Tooltip title="Delete">
                    <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete(r.id)}
                    />
                </Tooltip>
            </Flex>
        ),
    },
];
