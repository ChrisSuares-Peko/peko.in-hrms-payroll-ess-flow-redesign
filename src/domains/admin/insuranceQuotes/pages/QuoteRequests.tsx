import { useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Select, Tag, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd/lib';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import QuoteRequestDrawer from '../components/QuoteRequestDrawer';
import useQuoteRequests from '../hooks/useQuoteRequests';
import { QuoteRequest } from '../types/quoteRequests';
import { STATUS_META, STATUS_OPTIONS } from '../utils/status';

const QuoteRequests = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: 'createdAt',
        status: undefined as string | undefined,
        insuranceType: undefined as string | undefined,
    };
    const [filters, setFilters] = useState(initialValues);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeRecord, setActiveRecord] = useState<QuoteRequest>();

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, updating, tableData, count, updateStatus, downloadReport } =
        useQuoteRequests(filters);

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleTableChange: TableProps<QuoteRequest>['onChange'] = (_pagination, _filter, sorter) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s && s.order) {
            setFilters(prev => ({
                ...prev,
                sortField: (s.field as string) || 'createdAt',
                sort: s.order === 'ascend' ? 'ASC' : 'DESC',
                page: 1,
            }));
        } else {
            setFilters(prev => ({ ...prev, sortField: 'createdAt', sort: 'DESC', page: 1 }));
        }
    };

    const openDrawer = (record: QuoteRequest) => {
        setActiveRecord(record);
        setDrawerOpen(true);
    };

    const columns = [
        {
            title: 'Submitted On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text type="secondary">
                        {formattedTime(new Date(createdAt))}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Corporate',
            dataIndex: ['credential', 'name'],
            key: 'corporate',
            render: (_: unknown, record: QuoteRequest) => (
                <Typography.Text>{record.credential?.name || '-'}</Typography.Text>
            ),
        },
        { title: 'Full Name', dataIndex: 'fullName', key: 'fullName' },
        { title: 'Mobile Number', dataIndex: 'mobileNumber', key: 'mobileNumber' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Insurance Type', dataIndex: 'insuranceType', key: 'insuranceType' },
        {
            title: 'Vehicle No.',
            dataIndex: 'vehicleNumber',
            key: 'vehicleNumber',
            render: (vehicleNumber: string | null) => (
                <Typography.Text>{vehicleNumber || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: QuoteRequest['status']) => (
                <Tag color={STATUS_META[status]?.color}>{STATUS_META[status]?.label || status}</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_: unknown, record: QuoteRequest) => (
                <Tooltip title="View / Update">
                    <Button size="small" onClick={() => openDrawer(record)}>
                        Manage
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Button
                    icon={<DownloadOutlined />}
                    onClick={() => downloadReport('excel')}
                    disabled={!count}
                >
                    Export Excel
                </Button>
                <Flex gap={12} wrap="wrap">
                    <Select
                        placeholder="Filter by status"
                        allowClear
                        options={STATUS_OPTIONS}
                        style={{ width: 180 }}
                        value={filters.status}
                        onChange={value => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
                    />
                    <Input.Search
                        placeholder="Search by name, mobile, email or vehicle"
                        allowClear
                        value={searchText}
                        onChange={updateSearchText}
                        style={{ width: 320 }}
                    />
                </Flex>
            </Flex>

            <GenericTable
                rowKey={(record: QuoteRequest) => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                pageSize={filters.itemsPerPage}
                showSizeChanger={false}
            />

            {drawerOpen && (
                <QuoteRequestDrawer
                    open={drawerOpen}
                    record={activeRecord}
                    updating={updating}
                    handleClose={() => setDrawerOpen(false)}
                    handleSave={updateStatus}
                />
            )}
        </Flex>
    );
};

export default QuoteRequests;
