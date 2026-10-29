import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Row, Select, Tag, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { DownloadType } from '@customtypes/general';
import { formattedDateTime } from '@utils/dateFormat';

import useAdminGlobalBusinessSetupApplications from '../../hooks/globalBusinessSetup/useAdminGlobalBusinessSetupApplications';

const { Text } = Typography;

type ApplicationRow = {
    _id: string;
    vendor_app_id: string;
    reference_id?: string;
    user_id?: number;
    proposed_name?: string;
    country?: { _id?: string; name?: string };
    type?: string;
    freezone?: string;
    is_paid?: boolean;
    provider_id?: string;
    application_id?: string;
    tracking_id?: string;
    vendor_created_at?: string;
    synced_at?: string;
};

const humanize = (v?: string) => {
    if (!v) return 'N/A';
    return v
        .split(/[_\s-]+/)
        .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ');
};

const formatDate = (v?: string) => (v ? formattedDateTime(new Date(v)) : 'N/A');

export default function ApplicationsTable() {
    const [filters, setFilters] = useState<{
        page: number;
        itemsPerPage: number;
        searchText: string;
        sort: 'ASC' | 'DESC';
        isPaid?: boolean;
    }>({
        page: 1,
        itemsPerPage: 10,
        searchText: '',
        sort: 'DESC',
    });

    const { rows, total, isLoading, isDownloading, downloadReport } =
        useAdminGlobalBusinessSetupApplications(filters);

    const paymentStatusValue = (() => {
        if (filters.isPaid === true) return 'paid';
        if (filters.isPaid === false) return 'pending';
        return undefined;
    })();

    const resolveIsPaid = (v?: string): boolean | undefined => {
        if (v === 'paid') return true;
        if (v === 'pending') return false;
        return undefined;
    };

    const columns = [
        {
            title: 'Application No.',
            dataIndex: 'application_id',
            key: 'application_id',
            render: (v: string, r: ApplicationRow) => (
                <Text>{v || r.tracking_id || r.vendor_app_id}</Text>
            ),
        },
        {
            title: 'Proposed Name',
            dataIndex: 'proposed_name',
            key: 'proposed_name',
            render: (v: string) => <Text>{v || 'N/A'}</Text>,
        },
        {
            title: 'Country',
            key: 'country',
            render: (_: unknown, r: ApplicationRow) => <Text>{r.country?.name || 'N/A'}</Text>,
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (v: string) => <Text>{v === 'freezone' ? 'Free Zone' : humanize(v)}</Text>,
        },
        {
            title: 'Freezone',
            dataIndex: 'freezone',
            key: 'freezone',
            render: (v: string) => <Text>{humanize(v)}</Text>,
        },
        {
            title: 'Tracking ID',
            dataIndex: 'tracking_id',
            key: 'tracking_id',
            render: (v: string) => <Text>{v || 'N/A'}</Text>,
        },
        {
            title: 'Reference',
            dataIndex: 'reference_id',
            key: 'reference_id',
            render: (v: string) => <Text>{v || 'N/A'}</Text>,
        },
        {
            title: 'Paid',
            dataIndex: 'is_paid',
            key: 'is_paid',
            render: (v: boolean) =>
                v ? <Tag color="success">Paid</Tag> : <Tag color="warning">Pending</Tag>,
        },
        {
            title: 'Created',
            dataIndex: 'vendor_created_at',
            key: 'vendor_created_at',
            render: (v: string) => <Text>{formatDate(v)}</Text>,
        },
        {
            title: 'Synced',
            dataIndex: 'synced_at',
            key: 'synced_at',
            render: (v: string) => <Text>{formatDate(v)}</Text>,
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Row justify="space-between" className="w-full gap-5">
                <Flex className="flex justify-start gap-3">
                    <Button
                        danger
                        loading={isDownloading}
                        onClick={() => downloadReport(DownloadType.Excel)}
                    >
                        Excel
                    </Button>
                    <Button
                        danger
                        loading={isDownloading}
                        onClick={() => downloadReport(DownloadType.Csv)}
                    >
                        CSV
                    </Button>
                    <Button
                        danger
                        loading={isDownloading}
                        onClick={() => downloadReport(DownloadType.Pdf)}
                    >
                        PDF
                    </Button>
                </Flex>

                <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                    <Select
                        className="min-w-40 md:w-fit"
                        placeholder="Payment status"
                        allowClear
                        value={paymentStatusValue}
                        options={[
                            { value: 'paid', label: 'Paid' },
                            { value: 'pending', label: 'Pending' },
                        ]}
                        onChange={v =>
                            setFilters(prev => ({
                                ...prev,
                                page: 1,
                                isPaid: resolveIsPaid(v),
                            }))
                        }
                    />
                    <Input
                        value={filters.searchText}
                        placeholder="Search"
                        className="md:w-fit"
                        suffix={<SearchOutlined />}
                        allowClear
                        maxLength={100}
                        onChange={e =>
                            setFilters(prev => ({
                                ...prev,
                                searchText: e.target.value,
                                page: 1,
                            }))
                        }
                    />
                </Flex>
            </Row>

            <GenericTable
                rowKey={(r: ApplicationRow) => r._id || r.vendor_app_id}
                columns={columns}
                dataSource={rows}
                pagination={false}
                loading={isLoading}
                style={{ overflow: 'auto' }}
                scroll={{ x: 1100 }}
            />

            <Pagination
                current={filters.page}
                pageSize={filters.itemsPerPage}
                total={total}
                showSizeChanger={false}
                className="text-end pt-7"
                onChange={page => setFilters(prev => ({ ...prev, page }))}
            />
        </Flex>
    );
}
