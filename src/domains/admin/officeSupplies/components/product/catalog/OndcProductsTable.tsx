import { Avatar, Flex, Switch, Tooltip, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import GenericTable from '@components/atomic/GenericTable';
import { Pill } from '@src/domains/admin/officeSupplies/components/detail/DetailPrimitives';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { AdminOndcProduct } from '../../../types/ondcProduct';

dayjs.extend(relativeTime);

const IN_STOCK = { bg: '#ecfdf3', color: '#027a48' };
const OUT_STOCK = { bg: '#fef2f2', color: '#ef4444' };
const DOMAIN_STYLE = { bg: '#f5f5f5', color: '#475156' };

type Props = {
    tableData: AdminOndcProduct[] | undefined;
    isLoading: boolean;
    onTableChange: TableProps<AdminOndcProduct>['onChange'];
    onToggleVisibility: (id: number, visible: boolean) => void;
    onView: (record: AdminOndcProduct) => void;
};

const OndcProductsTable = ({ tableData, isLoading, onTableChange, onToggleVisibility, onView }: Props) => {
    const columns = [
        {
            title: 'Product',
            key: 'name',
            width: 260,
            render: (_: any, r: AdminOndcProduct) => (
                <Flex align="center" gap={10}>
                    <Avatar shape="square" size={40} src={r.image || undefined} className="!bg-[#f2f4f7]">
                        {r.name?.[0] || 'P'}
                    </Avatar>
                    <Typography.Text className="text-[#101828]">{r.name}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Seller',
            dataIndex: 'vendorName',
            key: 'vendorName',
            width: 140,
            render: (v: string | null) => v || '-',
        },
        {
            title: 'Category',
            key: 'category',
            width: 190,
            render: (_: any, r: AdminOndcProduct) =>
                [r.category, r.localCategory].filter(Boolean).join(' › ') || '-',
        },
        {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            width: 90,
            render: (d: string) =>
                d ? (
                    <Pill bg={DOMAIN_STYLE.bg} color={DOMAIN_STYLE.color}>
                        {d}
                    </Pill>
                ) : (
                    '-'
                ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 100,
            sorter: true,
            render: (p: string | null) => (p ? `₹${formatNumberWithLocalString(Number(p))}` : '-'),
        },
        {
            title: 'Availability',
            key: 'inStock',
            width: 120,
            render: (_: any, r: AdminOndcProduct) => {
                const s = r.inStock ? IN_STOCK : OUT_STOCK;
                return (
                    <Pill bg={s.bg} color={s.color}>
                        {r.inStock ? 'In stock' : 'Out of stock'}
                    </Pill>
                );
            },
        },
        {
            title: 'Last Synced',
            dataIndex: 'lastSyncedAt',
            key: 'lastSyncedAt',
            width: 110,
            sorter: true,
            render: (t: string) =>
                t ? (
                    <Tooltip title={dayjs(t).format('MMM D, YYYY hh:mm A')}>
                        <span className="text-[#868686]">{dayjs(t).fromNow()}</span>
                    </Tooltip>
                ) : (
                    '-'
                ),
        },
        {
            title: 'Visible on Peko',
            key: 'visibleOnPeko',
            width: 130,
            render: (_: any, r: AdminOndcProduct) => (
                <Switch
                    checked={r.visibleOnPeko}
                    onChange={checked => onToggleVisibility(r.id, checked)}
                    style={{ backgroundColor: r.visibleOnPeko ? '#22c55e' : undefined }}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'action',
            width: 80,
            render: (_: any, r: AdminOndcProduct) => (
                <Typography.Link className="!text-lightRed" onClick={() => onView(r)}>
                    View
                </Typography.Link>
            ),
        },
    ];

    return (
        <GenericTable
            rowKey={record => record.id}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            loading={isLoading}
            onChange={onTableChange}
        />
    );
};

export default OndcProductsTable;
