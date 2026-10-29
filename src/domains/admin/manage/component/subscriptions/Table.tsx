import React, { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import BulkUploadModal from '@components/molecular/modals/BulkUploadModal';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import OperatorHeader from './Header';
import CreateUpdateModal from './Modal';
import useSoftwareBulkUpload from '../../hooks/subscriptions/useSoftwareBulkUpload';
import useSubscriptionData from '../../hooks/subscriptions/useSubscription';
import useFilter from '../../hooks/useFilters';
import { RolePermissionAccessData, SubscriptionBody } from '../../types/subscription';
import getSubscriptionColumns from '../columns/SubscriptionColumns';

const SubscriptionPage = () => {
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
    const [openBulkModal, setOpenBulkModal] = useState(false);
    const [modalData, setModalData] = useState<SubscriptionBody>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Software Products');
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const {
        isLoading,
        tableData,
        count,
        handleRefresh,
        updateActiveStatus,
        deleteSubscriptionRow,
        downloadReport,
    } = useSubscriptionData(filters);

    const { getSoftwareBulkUploadTemplate, isTemplateFileLoading, BulkUpload, isExcelUploading } =
        useSoftwareBulkUpload();
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleActive = (subscriptionId: number | string, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ subscriptionId, status: active });
    };
    const handleEdit = (record: SubscriptionBody) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteSubscriptionRow(modalData!?.id);
        setDeleteModal(false);
    };
    const handleCreateModal = () => {
        setOpenModal(true);
        setModalData(undefined);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
        setModalData(undefined);
    };
    const handleConfirmation = (record: SubscriptionBody) => {
        setModalData(record);
        setDeleteModal(true);
    };
    const columns = getSubscriptionColumns({
        handleActive,
        handleEdit,
        handleConfirmation,
        accessPermission,
    });

    return (
        <Flex vertical gap={20}>
            <OperatorHeader
                downloadReport={downloadReport}
                handleSearch={updateSearchText}
                searchText={searchText}
                setOpenModal={handleCreateModal}
                setOpenBulkModal={setOpenBulkModal}
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
            {openModal && (
                <CreateUpdateModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    handleRefresh={handleRefresh}
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

            {openBulkModal && (
                <BulkUploadModal
                    open={openBulkModal}
                    handleCancel={() => setOpenBulkModal(false)}
                    handleBulkUpload={file => BulkUpload(file)}
                    isUploading={isExcelUploading}
                    handleTemplateDownload={getSoftwareBulkUploadTemplate}
                    isTemplateFileLoading={isTemplateFileLoading}
                />
            )}
        </Flex>
    );
};

export default SubscriptionPage;
