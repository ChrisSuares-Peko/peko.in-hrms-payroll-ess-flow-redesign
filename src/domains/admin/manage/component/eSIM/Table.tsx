import React, { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import BulkUploadModal from '@components/molecular/modals/BulkUploadModal';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import Header from './Header';
import CreateUpdateModal from './Modal';
import useEsimBulkUpload from '../../hooks/useEsimBulkUpload';
import useEsimPlansData from '../../hooks/useEsimPlans';
import useFilter from '../../hooks/useFilters';
import useTunzSyncPlans from '../../hooks/useTunzSyncPlans';
import { EsimPlan, RolePermissionAccessData } from '../../types/eSIM';
import getEsimPlanColumns from '../columns/eSIMPlansColumns';

const ConnectPage = () => {
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
    const [modalData, setModalData] = useState<EsimPlan>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'eSIM Plans'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { searchText, updateSearchText, setSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        tableData,
        count,
        handleRefresh,
        updateActiveStatus,
        deleteConnectProvider,
        downloadReport,
    } = useEsimPlansData(filters);

    const { isLoading: syncPlansLoading, syncPlansTunz } = useTunzSyncPlans();
    const dispatch = useAppDispatch();

    const handleSyncPlans = async () => {
        const result = await syncPlansTunz();
        if (result) {
            dispatch(
                showToast({ description: 'Tunz plans synced successfully', variant: 'success' })
            );
            handleRefresh();
        }
    };

    const { handlePageChange, handleChangeFilters, handleTableChange } = useFilter({
        setFilters,
    });
    const { getEsimBulkUploadTemplate, BulkUpload, isExcelUploading, isTemplateFileLoading } =
        useEsimBulkUpload();
    const handleActive = (planId: number | undefined, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ planId, status: active });
    };
    const handleEdit = (record: EsimPlan) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteConnectProvider({ planId: modalData!?.id });
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
    const handleConfirmation = (record: EsimPlan) => {
        setModalData(record);
        setDeleteModal(true);
    };
    const columns = getEsimPlanColumns({
        handleActive,
        handleEdit,
        handleConfirmation,
        accessPermission,
    });

    return (
        <Flex vertical gap={20}>
            <Header
                downloadReport={downloadReport}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                setSearchText={setSearchText}
                searchText={searchText}
                setOpenModal={handleCreateModal}
                setOpenBulkModal={setOpenBulkModal}
                accessPermission={accessPermission}
                onSyncingPlans={handleSyncPlans}
                syncPlansLoading={syncPlansLoading}
            />
            <GenericTable
                rowKey={record => record.id || ''}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="justify-end text-end pt-7"
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
                    mode={modalData ? 'edit' : 'add'}
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
                    handleBulkUpload={async file => {
                        await BulkUpload(file);
                        handleRefresh();
                    }}
                    isUploading={isExcelUploading}
                    handleTemplateDownload={getEsimBulkUploadTemplate}
                    isTemplateFileLoading={isTemplateFileLoading}
                />
            )}
        </Flex>
    );
};

export default ConnectPage;
