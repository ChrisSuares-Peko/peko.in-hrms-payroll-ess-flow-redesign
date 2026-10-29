import React, { useEffect, useState } from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import AttestationCategoryHeader from './AttestationHeader';
import AttestationCategoryModal from './AttestationModal';
import useGetAttestationCategories from '../../hooks/useAttestationCategory';
import useFilter from '../../hooks/useFilters';
import { AttestationCategoryData, RolePermissionAccessData } from '../../types/attestationTypes';

type Props = {};

const AttestationCategory = (props: Props) => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<AttestationCategoryData | undefined>(undefined);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Attestation'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const {
        isLoading,
        tableData,
        count,
        // updateStatus,
        deleteCategory,
        downloadReport,
        setRefresh,
    } = useGetAttestationCategories(filters);

    const { handlePageChange, handleTableChange } = useFilter({
        setFilters,
    });

    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
        // setRefresh(true);
    };

    const handleDelete = () => {
        if (modalData?.id) {
            deleteCategory(modalData.id);
        }
        setDeleteModal(false);
        setRefresh(true);
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
            title: 'Country',
            dataIndex: 'country',
            sorter: true,
            key: 'country',
        },
        {
            title: 'Country Code',
            dataIndex: 'countryCode',
            sorter: true,
            key: 'countryCode',
        },
        {
            title: 'Label',
            dataIndex: 'label',
            sorter: true,
            key: 'label',
        },
        {
            title: 'Value',
            dataIndex: 'value',
            sorter: true,
            key: 'value',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            sorter: true,
            key: 'price',
            render: (price: number) => `₹ ${price}`,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Flex justify="space-between">
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>
                            {!accessPermission?.update ? (
                                <EditOutlined
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
                            ) : (
                                <EditOutlined onClick={() => handleEdit(record)} />
                            )}
                        </span>
                    </Tooltip>
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>
                            {!accessPermission?.update ? (
                                <DeleteOutlined
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
                            ) : (
                                <DeleteOutlined
                                    className="text-brandColor"
                                    onClick={() => {
                                        setModalData(record);
                                        setDeleteModal(true);
                                    }}
                                />
                            )}
                        </span>
                    </Tooltip>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <AttestationCategoryHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                setRefresh={setRefresh}
                downloadReport={downloadReport}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
                className="text-end pt-7"
            />
            {openModal && (
                <AttestationCategoryModal
                    data={modalData}
                    open={openModal}
                    setRefresh={setRefresh}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={isLoading}
                />
            )}
        </Flex>
    );
};

export default AttestationCategory;
