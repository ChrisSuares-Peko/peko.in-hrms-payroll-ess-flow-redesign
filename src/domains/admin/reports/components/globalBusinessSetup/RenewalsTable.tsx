import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Row, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { DownloadType } from '@customtypes/general';
import { formattedDateTime } from '@utils/dateFormat';

import useAdminGlobalBusinessSetupRenewals from '../../hooks/globalBusinessSetup/useAdminGlobalBusinessSetupRenewals';

const { Text } = Typography;

type RenewalRow = {
    _id: string;
    vendor_renewal_id: string;
    application_id?: string;
    reference_id?: string;
    user_id?: number;
    renewal_type?: string;
    company_name?: string;
    country_name?: string;
    freezone?: string;
    due_date?: string;
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

export default function RenewalsTable() {
    const [filters, setFilters] = useState<{
        page: number;
        itemsPerPage: number;
        searchText: string;
        sort: 'ASC' | 'DESC';
    }>({
        page: 1,
        itemsPerPage: 10,
        searchText: '',
        sort: 'DESC',
    });

    const { rows, total, isLoading, isDownloading, downloadReport } =
        useAdminGlobalBusinessSetupRenewals(filters);

    const columns = [
        {
            title: 'Renewal ID',
            dataIndex: 'application_id',
            key: 'application_id',
            render: (v: string) => <Text>{v || 'N/A'}</Text>,
        },
        {
            title: 'Renewal Type',
            dataIndex: 'renewal_type',
            key: 'renewal_type',
            render: (v: string) => <Text>{humanize(v)}</Text>,
        },
        {
            title: 'Company',
            dataIndex: 'company_name',
            key: 'company_name',
            render: (v: string) => <Text>{v || 'N/A'}</Text>,
        },
        {
            title: 'Country',
            dataIndex: 'country_name',
            key: 'country_name',
            render: (v: string) => <Text>{v || 'N/A'}</Text>,
        },
        {
            title: 'Freezone',
            dataIndex: 'freezone',
            key: 'freezone',
            render: (v: string) => <Text>{humanize(v)}</Text>,
        },
        {
            title: 'Due Date',
            dataIndex: 'due_date',
            key: 'due_date',
            render: (v: string) => <Text>{formatDate(v)}</Text>,
        },
        {
            title: 'Reference',
            dataIndex: 'reference_id',
            key: 'reference_id',
            render: (v: string) => <Text>{v || 'N/A'}</Text>,
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
                rowKey={(r: RenewalRow) => r._id || r.vendor_renewal_id}
                columns={columns}
                dataSource={rows}
                pagination={false}
                loading={isLoading}
                style={{ overflow: 'auto' }}
                scroll={{ x: 1000 }}
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
