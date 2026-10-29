import React, { useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import TaxHeader from './KybHeader';
import CollectorKybModal from './KybModal';
import useGetCollectorKyb from '../../hooks/collectorKyb/useGetCollectorKyb';
import useFilter from '../../hooks/useFilters';
import { Records } from '../../types/collectorKyb';

const CollectorKyb = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        pageSize: 10,
        sort: 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<Records>();
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const { tableData, count, loading, setRefresh, downloadReport } = useGetCollectorKyb(filters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleEdit = (record: Records) => {
        setModalData(record);
        setOpenModal(true);
    };
    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Corporate Name',
            sorter: true,
            dataIndex: ['corporateUser', 'name'],
            render: (_: any, data: Records) => (
                <Typography.Text>{data?.corporateUser.name || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Email ID',
            dataIndex: 'supplierEmail',
            sorter: true,
            key: 'supplierEmail',
            render: (supplierEmail: string) => (
                <Typography.Text>{supplierEmail || '-'}</Typography.Text>
            ),
        },
        {
            title: 'KYB Status',
            sorter: true,
            dataIndex: 'kybStatus',
            key: 'kybStatus',
            render: (kybStatus: string) => (
                <Typography.Text>{kybStatus ? kybStatus.toLowerCase() : '-'}</Typography.Text>
            ),
        },
        {
            title: 'eSign Status',
            sorter: true,
            dataIndex: 'eSignStatus',
            key: 'eSignStatus',
            render: (eSignStatus: string) => (
                <Typography.Text>{eSignStatus ? eSignStatus.toLowerCase() : '-'}</Typography.Text>
            ),
        },
        {
            title: 'Edit',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Records) => (
                <Flex justify="space-between">
                    <EditOutlined onClick={() => handleEdit(record)} />
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <TaxHeader
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={loading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && modalData && (
                <CollectorKybModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
        </Flex>
    );
};

export default CollectorKyb;
