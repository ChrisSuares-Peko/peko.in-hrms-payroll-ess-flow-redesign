import React, { Suspense, lazy, useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';

import PartnerServicesHeader from './PartnerServicesHeader';
import usePartnerServices from '../hooks/usePartnerServices';
import { PartnerServiceAccessRow } from '../types/partnerServices';
import { RolePermissionAccessData } from '../types/systemUserTypes';

const AssignPartnerServicesModal = lazy(() => import('./AssignPartnerServicesModal'));

const PartnerServices = () => {
    const [filters, setFilters] = useState({ page: 1, itemsPerPage: 10, searchText: '' });
    const [openModal, setOpenModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<
        { id: number; name: string } | undefined
    >(undefined);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Partner Services');
    useEffect(() => {
        if (service) {
            setAccessPermission(service);
        }
    }, [service]);

    const {
        listLoading,
        tableData,
        count,
        setRefresh,
        deleteServiceAccess,
        updateServiceStatus,
        modalLoading,
        partnerOptions,
        initialRoles,
        fetchExistingAccess,
        assignServiceAccess,
        resetInitialRoles,
    } = usePartnerServices(filters);

    const handlePageChange = (page: number) => setFilters(prev => ({ ...prev, page }));
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFilters(prev => ({ ...prev, searchText: e.target.value, page: 1 }));

    const assignedPartnerIds = new Set((tableData ?? []).map(row => row.partnerId));
    const availablePartnerOptions = partnerOptions.filter(p => !assignedPartnerIds.has(p.value));

    const handleManageServices = (record: PartnerServiceAccessRow) => {
        setSelectedPartner({
            id: record.partnerId,
            name: record.credential?.name ?? `Partner ${record.partnerId}`,
        });
        setOpenModal(true);
    };

    const handleAssignPermission = () => {
        resetInitialRoles();
        setSelectedPartner(undefined);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedPartner(undefined);
    };

    const handleDeleteConfirm = async () => {
        if (deleteRecordId !== null) {
            await deleteServiceAccess(deleteRecordId);
        }
        setDeleteModal(false);
        setDeleteRecordId(null);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Partner Name',
            key: 'partnerName',
            render: (record: PartnerServiceAccessRow) => (
                <Typography.Text>{record.credential?.name ?? 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'Partner ID',
            dataIndex: 'partnerId',
            key: 'partnerId',
            render: (partnerId: number) => <Typography.Text>{partnerId ?? '-'}</Typography.Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: boolean | number, record: PartnerServiceAccessRow) => {
                const isActive = status === 1 || status === true;
                if (!accessPermission?.update) {
                    return isActive ? (
                        <CheckOutlined className="text-gray-400" />
                    ) : (
                        <CloseOutlined className="text-gray-400" />
                    );
                }
                return (
                    <Tooltip
                        placement="top"
                        title={isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                        {isActive ? (
                            <CheckOutlined
                                className="cursor-pointer text-textLime"
                                onClick={() => updateServiceStatus(record.id, false)}
                            />
                        ) : (
                            <CloseOutlined
                                className="cursor-pointer text-brandColor"
                                onClick={() => updateServiceStatus(record.id, true)}
                            />
                        )}
                    </Tooltip>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: PartnerServiceAccessRow) => (
                <Flex justify="start" gap={12}>
                    <Tooltip placement="top" title="Manage services">
                        <EditOutlined
                            className={
                                accessPermission?.update
                                    ? 'cursor-pointer'
                                    : 'text-gray-400 cursor-not-allowed'
                            }
                            onClick={() => accessPermission?.update && handleManageServices(record)}
                        />
                    </Tooltip>
                    <Tooltip placement="top" title="Delete">
                        <DeleteOutlined
                            className={
                                accessPermission?.update
                                    ? 'cursor-pointer text-brandColor'
                                    : 'text-gray-400 cursor-not-allowed'
                            }
                            onClick={() => {
                                if (!accessPermission?.update) return;
                                setDeleteRecordId(record.id);
                                setDeleteModal(true);
                            }}
                        />
                    </Tooltip>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <PartnerServicesHeader
                searchText={filters.searchText}
                handleSearch={handleSearch}
                handleAssignPermission={handleAssignPermission}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={listLoading}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            <Suspense>
                {openModal && (
                    <AssignPartnerServicesModal
                        open={openModal}
                        handleCancel={handleCloseModal}
                        setRefresh={setRefresh}
                        partner={selectedPartner}
                        isLoading={modalLoading}
                        partnerOptions={availablePartnerOptions}
                        initialRoles={initialRoles}
                        fetchExistingAccess={fetchExistingAccess}
                        assignServiceAccess={assignServiceAccess}
                    />
                )}
            </Suspense>
            <ConfirmationModal
                isOpen={deleteModal}
                handleCancel={() => {
                    setDeleteModal(false);
                    setDeleteRecordId(null);
                }}
                title="Delete Partner Service Access"
                description="Are you sure you want to delete this partner's service access? This action cannot be undone."
                handleSubmit={handleDeleteConfirm}
                isLoading={listLoading}
            />
        </Flex>
    );
};

export default PartnerServices;
