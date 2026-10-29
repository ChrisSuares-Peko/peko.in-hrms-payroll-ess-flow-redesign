import React, { useState } from 'react';

import { Button, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateOnly } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import DomainHostingCancellationsHeader from './DomainHostingCancellationsHeader';
import DomainHostingRefundModal from './DomainHostingRefundModal';
import useGetCancellationRequests from '../../hooks/domainHostingCancellations/useGetCancellationRequests';
import { DomainHostingCancellation } from '../../types/domainHostingCancellations';

const { Title } = Typography;

const DomainHostingCancellations = () => {
    const today = dayjs().format('YYYY-MM-DD');
    const oneMonthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

    const [filters, setFilters] = useState({
        searchText: '',
        from: oneMonthAgo,
        to: today,
        sort: 'DESC' as 'ASC' | 'DESC',
        page: 1,
        limit: 10,
    });
    const [selectedRecord, setSelectedRecord] = useState<DomainHostingCancellation | null>(null);

    const { isLoading, tableData, count, refetch } = useGetCancellationRequests(filters);

    const debounceSearch = debounce(
        (val: string) => setFilters(f => ({ ...f, searchText: val, page: 1 })),
        500
    );

    const columns = [
        {
            title: 'Txn ID',
            dataIndex: 'corporateTxnId',
            render: (v: string) => <span className="text-xs font-mono">{v}</span>,
        },
        {
            title: 'Customer',
            render: (_: unknown, r: DomainHostingCancellation) => (
                <div>
                    <div>{r.credential?.name || '—'}</div>
                    <div className="text-xs text-gray-400">{r.credential?.username}</div>
                </div>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'transactionDate',
            render: (v: string) => formattedDateOnly(new Date(v)),
        },
        {
            title: 'Amount',
            dataIndex: 'amountInINR',
            render: (v: number) => `₹ ${formatNumberWithLocalString(v)}`,
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            render: (v: string) => <Tag>{v}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (v: string) => (
                <Tag color={v === 'REFUNDED' ? 'green' : 'orange'}>
                    {v === 'CANCELLATION_REQUESTED' ? 'Refund Pending' : v}
                </Tag>
            ),
        },
        {
            title: 'Action',
            render: (_: unknown, r: DomainHostingCancellation) =>
                r.status === 'REFUNDED' ? (
                    <Tag color="green">Refunded</Tag>
                ) : (
                    <Button size="small" type="primary" onClick={() => setSelectedRecord(r)}>
                        Refund
                    </Button>
                ),
        },
    ];

    return (
        <div className="p-4">
            <Title level={4} className="mb-4">
                Domain & Hosting — Cancellation Requests
            </Title>

            <DomainHostingCancellationsHeader
                searchText={filters.searchText}
                handleSearch={e => debounceSearch(e.target.value)}
                from={filters.from}
                to={filters.to}
                onDateChange={(from, to) => setFilters(f => ({ ...f, from, to, page: 1 }))}
            />

            <div className="border border-gray-200 rounded-xl overflow-x-auto mb-4">
                <GenericTable
                    rowKey="corporateTxnId"
                    columns={columns}
                    dataSource={tableData}
                    loading={isLoading}
                    pagination={false}
                />
            </div>

            <Pagination
                current={filters.page}
                pageSize={filters.limit}
                total={count}
                showSizeChanger
                pageSizeOptions={['10', '20', '50']}
                onChange={(page, pageSize) => setFilters(f => ({ ...f, page, limit: pageSize }))}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
            />

            {selectedRecord && (
                <DomainHostingRefundModal
                    open={!!selectedRecord}
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    onSuccess={refetch}
                />
            )}
        </div>
    );
};

export default DomainHostingCancellations;
