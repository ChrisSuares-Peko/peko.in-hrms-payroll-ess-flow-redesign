import React, { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString, formatNumberWithoutCommas } from '@utils/priceFormat';

import MobileRechargeProvidersHeader from './MobileRechargeProvidersHeader';
import MobileRechargeProvidersModal from './MobileRechargeProvidersModal';
import useFilter from '../../hooks/useFilters';
import useMobileRechargeProviders from '../../hooks/useMobileRechargeProviders';
import {
    MobileRechargeProviderData,
    RolePermissionAccessData,
} from '../../types/mobileRechargeProviderTypes';

type Props = {};

const MobileRechargeProviders = (props: Props) => {
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
    const [modalData, setModalData] = useState<MobileRechargeProviderData | undefined>(undefined);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Mobile Recharge Providers'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { isLoading, tableData, count, deleteProvider, updateStatus, setRefresh } =
        useMobileRechargeProviders(filters);

    const { handlePageChange, handleTableChange } = useFilter({
        setFilters,
    });

    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
    };

    const handleDelete = () => {
        if (modalData?.id) {
            deleteProvider(modalData.id);
        }
        setDeleteModal(false);
        setRefresh(true);
    };

    const handleStatusToggle = (providerId: number, currentStatus: boolean) => {
        updateStatus(providerId, currentStatus);
        setRefresh(true);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Display Name',
            dataIndex: 'displayName',
            sorter: true,
            key: 'displayName',
        },
        {
            title: 'Provider Name',
            dataIndex: 'providerName',
            sorter: true,
            key: 'providerName',
        },
        {
            title: 'Commission Type',
            dataIndex: 'commissionType',
            sorter: true,
            key: 'commissionType',
        },
        {
            title: 'Commission',
            dataIndex: 'commission',
            sorter: true,
            key: 'commission',
            render: (commission: number, record: any) => (
                <Typography.Text>
                    {record.commissionType === 'PERCENTAGE'
                        ? `${formatNumberWithoutCommas(commission)} %`
                        : `₹ ${formatNumberWithLocalString(commission)}`}
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            sorter: true,
            key: 'status',
            render: (status: boolean, record: any) => (
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {status ? (
                            <CheckOutlined
                                className={
                                    accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                                }
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleStatusToggle(record.id, status)
                                }
                            />
                        ) : (
                            <CloseOutlined
                                className={
                                    accessPermission?.update ? 'text-brandColor' : 'text-gray-400'
                                }
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update &&
                                    handleStatusToggle(record.id, status)
                                }
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Flex justify="center" gap={16}>
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
                                    className="text-gray-400 cursor-not-allowed"
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
                                    className="text-gray-400 cursor-not-allowed"
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
            <MobileRechargeProvidersHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                setRefresh={setRefresh}
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
                <MobileRechargeProvidersModal
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

export default MobileRechargeProviders;
