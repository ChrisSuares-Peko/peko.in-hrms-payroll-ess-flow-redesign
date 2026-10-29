import React, { lazy, useCallback, useEffect, useState } from 'react';

import { Button, Flex, Pagination, Table, Typography } from 'antd';

import useDebounce from '@src/hooks/useDebounce';
import { formattedDateTime } from '@utils/dateFormat';

import CustomerHeader from './CustomerHeader';
import { useCustomers } from '../../hooks/useCustomers';
import useFilter from '../../hooks/useFilter';

const CustomerModal = lazy(() => import('./CustomerModal'));
const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));
const { Text } = Typography;

const CustomerTable = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<any>();
    const { isLoading, tableData, count, setRefresh, customerDelete } = useCustomers(filters);
    const { handleSearch, handlePageChange, searchText } = useFilter({
        setFilters,
    });

    const debouncedSearchText = useDebounce(searchText, 500);

    useEffect(() => {
        setFilters(prevFilters => ({
            ...prevFilters,
            searchText: debouncedSearchText,
            page: 1,
        }));
    }, [debouncedSearchText]);

    const handleEdit = useCallback(
        (record: Document) => {
            setModalData(record);
            setOpenModal(true);
        },
        [setModalData, setOpenModal]
    );

    const handleDelete = useCallback(() => {
        customerDelete(modalData?.id);
        setDeleteModal(false);
    }, [customerDelete, modalData?.id, setDeleteModal]);

    const columns = [
        {
            title: 'Date & Time',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: any) => formattedDateTime(new Date(createdAt)),
        },
        {
            title: 'Customer Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email ID',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Customer Address',
            dataIndex: 'address',
            key: 'address',
            width: '20%',
            render: (address: string) => (
                <Flex className="w-40">
                    <Text className="truncate hover:text-clip hover:text-wrap">{address}</Text>
                </Flex>
            ),
        },
        {
            title: 'Mobile Number',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
        },
        {
            title: 'Customer TRN',
            dataIndex: 'trnNo',
            key: 'trnNo',
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: any) => (
                <Flex>
                    <Button danger type="text" onClick={() => handleEdit(record)}>
                        Edit
                    </Button>
                    <Button
                        danger
                        type="text"
                        onClick={() => {
                            setModalData(record);
                            setDeleteModal(true);
                        }}
                    >
                        Delete
                    </Button>
                </Flex>
            ),
        },
    ];
    return (
        <Flex vertical gap={20}>
            <CustomerHeader
                setRefresh={setRefresh}
                handleSearch={handleSearch}
                searchText={searchText}
            />
            {/* <Flex justify="space-between">
                <Text />

                <Button
                    type="primary"
                    className="mt-8 w-fit"
                    danger
                    onClick={handleAdd}
                    // loading={isLoading}
                >
                    <Text className="text-xs font-medium text-white">
                        Add Customer
                    </Text>
                </Button>
            </Flex> */}
            <Table
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                scroll={{ x: 756 }}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <CustomerModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}{' '}
            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Are you sure you want to delete the customer?"
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default CustomerTable;
