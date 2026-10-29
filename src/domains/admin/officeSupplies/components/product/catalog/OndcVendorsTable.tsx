import { Flex, Tag, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import GenericTable from '@components/atomic/GenericTable';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { AdminOndcEasySplitSeller } from '../../../types/ondcSeller';

dayjs.extend(relativeTime);

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: '#ecfdf3', color: '#027a48' },
    INACTIVE: { bg: '#fef2f2', color: '#ef4444' },
    BLOCKED: { bg: '#fef2f2', color: '#ef4444' },
};

type Props = {
    tableData: AdminOndcEasySplitSeller[];
    isLoading: boolean;
    onTableChange?: TableProps<AdminOndcEasySplitSeller>['onChange'];
};

const OndcVendorsTable = ({ tableData, isLoading, onTableChange }: Props) => {
    const columns = [
        {
            title: 'Vendor',
            key: 'vendorName',
            width: 200,
            render: (_: unknown, r: AdminOndcEasySplitSeller) => (
                <Flex vertical gap={2}>
                    <Typography.Text className="text-[#101828] font-medium">
                        {r.vendorName || '—'}
                    </Typography.Text>
                    <Typography.Text className="text-[12px] text-[#667085]">
                        {r.providerId}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Cashfree vendor id',
            dataIndex: 'cashfreeVendorId',
            key: 'cashfreeVendorId',
            width: 180,
            render: (v: string) => (
                <Typography.Text className="font-mono text-[13px]">{v || '—'}</Typography.Text>
            ),
        },
        {
            title: 'Cashfree status',
            dataIndex: 'cashfreeVendorStatus',
            key: 'cashfreeVendorStatus',
            width: 130,
            render: (status: string | null) => {
                if (!status) return '—';
                const style = STATUS_STYLE[status] || { bg: '#f5f5f5', color: '#475156' };
                return (
                    <Tag
                        className="!m-0 !border-0 !rounded-md !px-2 !py-0.5"
                        style={{ background: style.bg, color: style.color }}
                    >
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: 'Split eligible',
            dataIndex: 'splitEligible',
            key: 'splitEligible',
            width: 110,
            render: (v: boolean | null) => {
                if (v === true) return 'Yes';
                if (v === false) return 'No';
                return '—';
            },
        },
        {
            title: 'Pending to settle',
            dataIndex: 'pendingToSettle',
            key: 'pendingToSettle',
            width: 150,
            render: (amount: number) => (
                <Typography.Text className={amount > 0 ? 'font-semibold text-[#101828]' : 'text-[#667085]'}>
                    ₹{formatNumberWithLocalString(Number(amount || 0))}
                </Typography.Text>
            ),
        },
        {
            title: 'Pending orders',
            dataIndex: 'pendingOrderCount',
            key: 'pendingOrderCount',
            width: 120,
            render: (n: number) => n || 0,
        },
        {
            title: 'Earliest due',
            dataIndex: 'earliestPayoutDueAt',
            key: 'earliestPayoutDueAt',
            width: 160,
            render: (iso: string | null) =>
                iso ? dayjs(iso).format('DD MMM YYYY, HH:mm') : '—',
        },
        {
            title: 'Last synced',
            dataIndex: 'vendorSyncedAt',
            key: 'vendorSyncedAt',
            width: 140,
            render: (iso: string | null) => (iso ? dayjs(iso).fromNow() : '—'),
        },
    ];

    return (
        <GenericTable
            rowKey="id"
            columns={columns}
            dataSource={tableData}
            loading={isLoading}
            pagination={false}
            onChange={onTableChange}
            scroll={{ x: 1200 }}
        />
    );
};

export default OndcVendorsTable;
