import React, { useState, useEffect } from 'react';

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import WhatsAppNumberModal from './WhatsAppNumberModal';
import WhatsAppNumbersHeaders from './WhatsAppNumbersHeaders';
import useDeleteNumber from '../../hooks/whatsappNotification/useDeleteNumber';
import useEditStatus from '../../hooks/whatsappNotification/useEditStatus'; // Import the useEditStatus hook
import useWhatsAppData from '../../hooks/whatsappNotification/useWhatsAppData';
import { getData, numbers, RolePermissionAccessData } from '../../types/whatsappNotification';

const WhatsAppNumbers = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
    };

    const [filters, setFilters] = useState<getData>(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Peko WhatsApp Numbers'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<numbers>();

    const { whatsappNumbers, totalCount, isLoading, fetchWhatsAppNumbers, downloadReport } =
        useWhatsAppData({
            page: filters.page,
            searchText: filters.searchText || '',
            itemsPerPage: filters.itemsPerPage,
        });

    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleSearch = (e: any) => {
        let searchText = e.target.value;
        if (searchText.startsWith('+')) {
            searchText = searchText.slice(1);
        }
        setFilters(prev => ({
            ...prev,
            searchText,
            page: 1,
        }));
        fetchWhatsAppNumbers({ ...filters, searchText, page: 1 }); // Call fetch after updating filters
    };

    const { handleEditStatus, loading: statusLoading } = useEditStatus();
    const { handleDeleteNumber } = useDeleteNumber();

    const handleEdit = (record: numbers) => {
        setModalData(record);
        setOpenModal(true);
    };

    const handleDelete = async () => {
        if (modalData) {
            const success = await handleDeleteNumber(modalData.whatsappNumber);
            if (success) {
                fetchWhatsAppNumbers(filters);
                setDeleteModal(false);
            }
        }
    };

    const toggleStatus = async (record: numbers) => {
        const updatedStatus = !record.status;
        const success = await handleEditStatus(record.whatsappNumber, updatedStatus);
        if (success) {
            fetchWhatsAppNumbers(filters);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => `${text || '-'}`, // Add + prefix
        },
        {
            title: 'WhatsApp Number',
            dataIndex: 'whatsappNumber',
            key: 'whatsappNumber',
            render: (text: string) => `+${text}`, // Add + prefix
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: boolean, record: numbers) => (
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
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                                } ${statusLoading ? 'disabled' : ''}`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    (accessPermission?.update || !statusLoading) &&
                                    toggleStatus(record)
                                }
                                disabled={!accessPermission?.update}
                            />
                        ) : (
                            <CloseOutlined
                                className={`cursor-pointer ${
                                    accessPermission?.update ? 'text-brandColor' : 'text-gray-400'
                                } ${statusLoading ? 'disabled' : ''} `}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    (accessPermission?.update || !statusLoading) &&
                                    toggleStatus(record)
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
            render: (_: any, record: numbers) => (
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
                                    className="ml-7"
                                    style={{ color: 'gray', cursor: 'not-allowed' }}
                                    disabled
                                />
                            ) : (
                                <DeleteOutlined
                                    className=" text-brandColor ml-7"
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
            <WhatsAppNumbersHeaders
                setRefresh={() => fetchWhatsAppNumbers(filters)}
                handleSearch={handleSearch} // Pass updated handleSearch
                searchText={filters.searchText}
                accessPermission={accessPermission}
                handleDownloadReport={downloadReport}
            />
            <GenericTable
                rowKey={record => record.whatsappNumber}
                columns={columns}
                dataSource={whatsappNumbers}
                pagination={false}
                loading={isLoading || statusLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={totalCount}
                showSizeChanger={false}
            />
            {openModal && (
                <WhatsAppNumberModal
                    setRefresh={() => fetchWhatsAppNumbers(filters)}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )}
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

export default WhatsAppNumbers;
