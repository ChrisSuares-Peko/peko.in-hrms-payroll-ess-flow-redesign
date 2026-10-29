import React, { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useFilter from '@domains/admin/manage/hooks/useFilters';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import DisabledServiceHeader from './DisabledServiceHeader';
import useGetDisabledService from '../../hooks/disableService/useGetDisabledService';
import { RolePermissionAccessData, Service } from '../../types/disabledTypes';

const DisabledService = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
    };
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Disable Services'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [filters, setFilters] = useState(initialValues);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<Service>();
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        deleteDoc,
        setRefresh,
        downloadReport,
    } = useGetDisabledService(filters);
    const { handlePageChange } = useFilter({ setFilters });
    const handleActive = (serviceId: number | string, status: any) => {
        let active;
        if (status === 1 || status === true) active = false;
        else active = true;
        updateActiveStatus({ serviceId, serviceStatus: active });
    };

    const handleDelete = () => {
        deleteDoc(modalData!?.Id);
        setDeleteModal(false);
    };
    const columns = [
        // {
        //     title: 'Date',
        //     dataIndex: 'createdAt',
        //     key: 'createdAt',
        //     render: (createdAt: any) => formattedDateTime(new Date(createdAt))
        // },
        {
            title: 'Service Operator',
            dataIndex: 'serviceProvider',
            key: 'serviceProvider',
            render: (data: any, record: any) => (
                <Typography.Text>{record?.serviceOperator?.serviceProvider || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate ID',
            dataIndex: 'username',
            key: 'username',
            render: (data: any, record: any) => (
                <Typography.Text>{record?.credential?.username || '-'}</Typography.Text>
            ),
        },

        {
            title: 'Corporate Name',
            dataIndex: 'name',
            key: 'name',
            render: (data: any, record: any) => (
                <Typography.Text>{record?.credential?.name || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Partner',
            dataIndex: 'partnerName',
            key: 'partnerName',
            render: (data: any, record: any) => (
                <Typography.Text>
                    {record?.credential?.registeredByCredential?.name || '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Sub Partner',
            dataIndex: 'subPartnerName',
            key: 'subPartnerName',
            render: (data: any, record: any) => (
                <Typography.Text>{record?.credential?.subPartner?.name || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'serviceStatus',
            key: 'serviceStatus',
            render: (status: any, record: Service) => (
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
                                    handleActive(record.Id, record.serviceStatus)
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
                                    handleActive(record.Id, record.serviceStatus)
                                }
                                disabled={!accessPermission?.update}
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: Service) => (
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
                                <DeleteOutlined
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
                            ) : (
                                <DeleteOutlined
                                    className=" text-brandColor"
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
            <DisabledServiceHeader
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={updateSearchText}
                searchText={searchText}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={record => record.Id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
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

export default DisabledService;
