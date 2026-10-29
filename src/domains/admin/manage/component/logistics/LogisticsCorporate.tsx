import React, { useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Flex, Input, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import LogisticsCorporateDrawer from './LogisticsCorporateDrawer';
import { LogisticsCorporateRecord } from '../../api/logistics';
import useGetLogisticsCorporate from '../../hooks/useGetLogisticsCorporate';

const LogisticsCorporate = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<LogisticsCorporateRecord | null>(null);

    const [filters, setFilters] = useState({ searchText: '', page: 1, itemsPerPage: 10 });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const { tableData, count, loading, isUploading, uploadPan } = useGetLogisticsCorporate({
        page: filters.page,
        itemsPerPage: filters.itemsPerPage,
        searchText: filters.searchText,
    });

    const handleEdit = (record: LogisticsCorporateRecord) => {
        setSelectedRecord(record);
        setDrawerOpen(true);
    };

    const handleUpload = async (base64String: string, imageFormat: string) => {
        if (!selectedRecord) return false;
        return uploadPan(selectedRecord.credentialId, base64String, imageFormat);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'panUploadedAt',
            key: 'panUploadedAt',
            render: (val: string | null) => {
                if (!val) return <Typography.Text>-</Typography.Text>;
                const d = new Date(val);
                return (
                    <Typography.Text>
                        {formattedDateOnly(d)}, {formattedTime(d)}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Corporate Name',
            dataIndex: 'name',
            key: 'name',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Corporate ID',
            dataIndex: 'username',
            key: 'username',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Contact Person',
            dataIndex: 'contactPersonName',
            key: 'contactPersonName',
            render: (val: string | null) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Email ID',
            dataIndex: 'email',
            key: 'email',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Status',
            dataIndex: 'businessPanUrl',
            key: 'businessPanUrl',
            render: (val: string | null) => (
                <Typography.Text>{val ? 'Uploaded' : 'Not Uploaded'}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: LogisticsCorporateRecord) => (
                <Tooltip title="Edit">
                    <EditOutlined
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleEdit(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" align="center">
                <Typography.Title level={5} style={{ margin: 0 }}>
                    Logistics Corporate Details
                </Typography.Title>
                <Input.Search
                    placeholder="Search by name, email, or ID"
                    value={searchText}
                    onChange={updateSearchText}
                    style={{ width: 300 }}
                    allowClear
                />
            </Flex>

            <GenericTable
                rowKey={record => record.credentialId}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={loading}
            />

            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={p => setFilters(prev => ({ ...prev, page: p }))}
                total={count}
                pageSize={filters.itemsPerPage}
                showSizeChanger={false}
            />

            {drawerOpen && selectedRecord && (
                <LogisticsCorporateDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    record={selectedRecord}
                    isUploading={isUploading}
                    onUpload={handleUpload}
                />
            )}
        </Flex>
    );
};

export default LogisticsCorporate;
