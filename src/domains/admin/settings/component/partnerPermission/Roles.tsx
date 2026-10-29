import React, { Suspense, lazy, useEffect, useState } from 'react';

import {
    CheckOutlined,
    CloseOutlined,
    EditOutlined,
    EyeOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
// import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import RolesHeader from './RolesHeader';
import useFilter from '../../hooks/useFilters';
import { useGetRoles } from '../../hooks/useGetRoles';
import { Role, RolePermissionAccessData } from '../../types/partnerPermission';

const RoleModal = lazy(() => import('./RoleModal'));
const CashbackModel = lazy(() => import('./CashbackModel'));
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
    // const [deleteModal, setDeleteModal] = useState(false);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const [modalData, setModalData] = useState<Role>();
    const { services } = useAppSelector(state => state.reducer.services);
    const service = useFindRolesService(services?.data, 'Partner Permissions'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [cashbackModalVisible, setCashbackModalVisible] = useState(false);
    const [cashbackData, setCashbackData] = useState<any>();
    const [cashbackLoading, setCashbackLoading] = useState(false);
    const [partnerName, setPartnerName] = useState<string | null>(null);

    const {
        isLoading,
        tableData,
        count,
        // deleteRoleById,
        setRefresh,
        updateActiveStatus,
        downloadReport,
        fetchCashbackData,
        fetchRoleById,
        isFetchingRole,
    } = useGetRoles(filters);
    const { handleSearch, handlePageChange, handleTableChange } = useFilter({ setFilters });
    // Editing off the row the paginated list already returned skips whatever the
    // single-record endpoint might have that the list doesn't — fetch the full
    // record fresh. Fall back to the row data if the fetch fails.
    const [editingId, setEditingId] = useState<number | string | null>(null);
    const handleEdit = async (record: Role) => {
        setEditingId(record.id);
        const data = await fetchRoleById(record.id);
        setModalData(data || record);
        setOpenModal(true);
        setEditingId(null);
    };

    const handleCheckRole = async (record: Role) => {
        const response = await fetchCashbackData(record.registeredBy);
        setCashbackData(response);
        setPartnerName(record.partnerName || 'default');
        setCashbackLoading(false);
        setCashbackModalVisible(true);
    };
    // const handleDelete = () => {
    //     deleteRoleById(modalData!?.id);
    //     setDeleteModal(false);
    // };

    const handleActive = (id: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ id, status: active });
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
            title: 'Partner Name',
            render: (record: Role) => (
                <Flex vertical>
                    <Typography.Text>
                        {record?.registeredBy === null ? 'default' : record?.partnerName || 'N/A'}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Partner ID',
            render: (record: Role) => (
                <Flex vertical>
                    <Typography.Text>{record?.registeredBy ?? '-'}</Typography.Text>
                </Flex>
            ),
            sorter: true,
        },
        {
            title: 'Edit',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Role) => {
                let editIcon;
                if (!accessPermission?.update) {
                    editIcon = (
                        <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} disabled />
                    );
                } else if (isFetchingRole && editingId === record.id) {
                    editIcon = <LoadingOutlined />;
                } else {
                    editIcon = <EditOutlined onClick={() => handleEdit(record)} />;
                }
                return (
                <Flex justify="start">
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>{editIcon}</span>
            </Tooltip>
                    {/* <DeleteOutlined
                        className=" text-brandColor ml-7"
                        onClick={() => {
                            setModalData(record);
                            setDeleteModal(true);
                        }}
                    /> */}
                </Flex>
                );
            },
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: any) => (
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
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleActive(record.id, record.status)
                                }
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
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleActive(record.id, record.status)
                                }
                                disabled={!accessPermission?.update}
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Cashback Status',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Role) => (
                <Flex justify="start">
                    <EyeOutlined onClick={() => handleCheckRole(record)} />
                </Flex>
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
                    />
                )}
            </Suspense>
            <Suspense>
                {cashbackModalVisible && (
                    <CashbackModel
                        open={cashbackModalVisible}
                        handleCancel={() => setCashbackModalVisible(false)}
                        data={cashbackData}
                        partnerName={partnerName}
                        isLoading={cashbackLoading}
                    />
                )}
            </Suspense>
            {/* {deleteModal && (
                <ConfirmationModal
                    handleSubmit={handleDelete}
                    handleCancel={() => setDeleteModal(false)}
                    isOpen={deleteModal}
                    title="Do you want to proceed with the deletion?"
                    isLoading={false}
                />
            )} */}
        </Flex>
    );
};

export default Roles;
