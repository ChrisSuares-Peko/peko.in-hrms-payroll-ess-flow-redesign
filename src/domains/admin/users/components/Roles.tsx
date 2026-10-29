import React, { Suspense, lazy, useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import RolesHeader from './RolesHeader';
import useFilter from '../hooks/useFilters';
import { useGetRoles } from '../hooks/useGetRoles';
import { Role, RolePermissionAccessData } from '../types/systemUserTypes';

const RoleModal = lazy(() => import('./RoleModal'));

const Roles = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: 'createdAt',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<Role>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services);
    const service = useFindRolesService(services?.data, 'Roles'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const debouncedSearchText = useDebounce(filters.searchText, 300);
    const {
        isLoading,
        tableData,
        count,
        deleteRoleById,
        setRefresh,
        updateActiveStatus,
        downloadReport,
    } = useGetRoles({ ...filters, searchText: debouncedSearchText });
    const { handleSearch, handlePageChange, handleTableChange } = useFilter({ setFilters });
    const handleEdit = (record: Role) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteRoleById(modalData!?.id);
        setDeleteModal(false);
    };

    const handleActive = (corporateId: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ corporateId, isActive: active });
    };

    const columns = [
        {
            title: 'Date',
            sorter: true,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Role Name',
            dataIndex: 'roleName',
            key: 'roleName',
            sorter: true,
        },
        {
            title: 'Edit',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Role) => (
                <Flex justify="start">
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
                    {/* <DeleteOutlined
                        className=" text-brandColor ml-7"
                        onClick={() => {
                            setModalData(record);
                            setDeleteModal(true);
                        }}
                    /> */}
                </Flex>
            ),
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: any) =>(
                <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                {status === 1 || status === true ? (
                    <CheckOutlined
                       className={`cursor-pointer ${
                        accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                    }`}
                    style={{
                        cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                    }}
                        onClick={() =>  accessPermission?.update && handleActive(record.id, record.status)}
                        disabled={!accessPermission?.update}
                    />
                ) : (
                    <CloseOutlined
                        className={`cursor-pointer ${
                            accessPermission?.update ? 'text-brandColor' : 'text-gray-400'
                        }`}
                        style={{
                            cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                        }}
                        onClick={() =>  accessPermission?.update && handleActive(record.id, record.status)}
                        disabled={!accessPermission?.update}
                    />
               
                )}
                </span>
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <RolesHeader
                handleDownloadReport={downloadReport}
                searchText={filters.searchText}
                handleSearch={handleSearch}
                setRefresh={setRefresh}
                accessPermission={accessPermission}
            />

            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                onChange={handleTableChange}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            <Suspense>
                {openModal && (
                    <RoleModal
                        open={openModal}
                        handleCancel={() => setOpenModal(false)}
                        setRefresh={setRefresh}
                        data={modalData}
                        accessPermission={accessPermission}
                    />
                )}
            </Suspense>
            {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default Roles;
