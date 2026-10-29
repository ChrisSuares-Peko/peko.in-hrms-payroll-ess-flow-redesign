import React, { Suspense, lazy, useEffect, useState } from 'react';

import {
    CheckOutlined,
    CloseOutlined,
    EditOutlined,
    LinkOutlined,
    MailOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { Flex, Typography, Pagination, Button, Tooltip } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
// import EditPartnerRoleModal from './EditPartnerRoleModal';
import { useFindRolesService } from '@utils/findRolesService';

import PartnerUserHeader from './PartnerUserHeader';
import useFilter from '../hooks/useFilters';
import { useGetPartnerUserData } from '../hooks/useGetPartnerUserData';
import { RolePermissionAccessData, User } from '../types/systemUserTypes';

const EditPartnerRoleModal = lazy(() => import('./EditPartnerRoleModal'));
// const EditPartnerUserModal = lazy(() => import('./EditPartnerUserModal'));
const PartnerUser = () => {
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
    const [modalData] = useState<User>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Partners'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    // const [modalTableData, setTableModalData] = useState<any>();
    const {
        isLoading,
        tableData,
        editModalData,
        count,
        deleteUserById,
        updateActiveStatus,
        resentEmailById,
        setRefresh,
        downloadReport,
        getSytemUserDetails,
    } = useGetPartnerUserData(filters);
    const { handleSearch, handlePageChange, handleTableChange } = useFilter({ setFilters });
    const handleEdit = async (record: any) => {
        await getSytemUserDetails(record.credentialId);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteUserById(modalData!?.id);
        setDeleteModal(false);
    };
    const handleResentMail = (record: User) => {
        resentEmailById(record.credentialId);
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
            title: 'Username',
            sorter: true,
            dataIndex: ['credential', 'username'],
            key: 'credential',
            render: (_: any, record: any) => (
                <Typography.Text>{record?.credential.username || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Name',
            sorter: true,
            dataIndex: ['credential', 'name'],
            key: 'credential',
            render: (_: any, record: any) => (
                <Typography.Text>{record?.credential.name || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Role',
            sorter: true,
            dataIndex: ['roleAndPermission', 'roleName'],
            key: 'roleAndPermission',
            render: (_: any, record: any) => (
                <Typography.Text>{record?.roleAndPermission?.roleName || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Contact Details',
            dataIndex: 'email',
            render: (email: any, record: User) => (
                <Flex vertical>
                    <Flex gap={8}>
                        <MailOutlined />
                        <Typography.Text>{email}</Typography.Text>
                    </Flex>
                    <Flex gap={8}>
                        <PhoneOutlined />
                        <Typography.Text>{record.mobileNo || 'N/A'}</Typography.Text>
                    </Flex>
                    <Flex gap={8}>
                        <LinkOutlined />
                        {record.portalUrl ? (
                            <Typography.Link
                                target="_blank" // Open link in new tab
                                rel="noopener noreferrer"
                                href={`//${record.portalUrl}`}
                            >
                                {record.portalUrl}
                            </Typography.Link>
                        ) : (
                            <Typography.Text>N/A</Typography.Text>
                        )}
                    </Flex>
                </Flex>
            ),
            key: 'email',
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            sorter: true,
            key: 'isActive',
            render: (status: any, record: User) =>
                (
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
                                        handleActive(record.credentialId, record.isActive)
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
                                        handleActive(record.credentialId, record.isActive)
                                    }
                                    disabled={!accessPermission?.update}
                                />
                            )}
                        </span>
                    </Tooltip>
                ),
        },
        {
            title: 'Resend Email',
            dataIndex: 'resent',
            key: 'resent',
            render: (_: any, record: User) => (
                <Button danger size="small" disabled={!accessPermission?.update} onClick={() => handleResentMail(record)}>
                    Resend Email
                </Button>
            ),
        },
        {
            title: 'Edit',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: User) => (
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
                    {/* <DeleteOutlined
                        className=" text-brandColor ml-7"
                        onClick={() => {
                            setModalData(record);
                            setDeleteModal(true);
                        }}
                    /> */}
                      </span>
                      </Tooltip>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <PartnerUserHeader
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
                loading={isLoading}
                // scroll={{ x: 756 }}
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
            <Suspense>
                {/* {openModal && (
                    <EditPartnerUserModal
                        data={modalTableData}
                        handleCancel={() => setOpenModal(false)}
                        open={openModal}
                        setRefresh={setRefresh}
                        
                    />
                )} */}
                {openModal && (
                    <EditPartnerRoleModal
                        data={editModalData}
                        handleCancel={() => setOpenModal(false)}
                        open={openModal}
                        setRefresh={setRefresh}
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

export default PartnerUser;
