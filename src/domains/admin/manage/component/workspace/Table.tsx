import React, { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';
import { debounce } from 'lodash';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import WorkspaceHeader from './Header';
import CreateUpdateModal from './Modal';
import useFilter from '../../hooks/useFilters';
import useWorkspaceData from '../../hooks/useWorkspace';
import { RolePermissionAccessData, WorkspaceBody } from '../../types/workspace';
import getWorkspaceColumns from '../columns/WorkspaceColumns';

const WorkspacePage = () => {
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
    const [modalData, setModalData] = useState<WorkspaceBody>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Workspaces'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const {
        isLoading,
        tableData,
        count,
        handleRefresh,
        updateActiveStatus,
        deleteWorkspaceData,
        downloadReport,
    } = useWorkspaceData(filters);
    const { handleSearch, handlePageChange, handleTableChange } = useFilter({ setFilters });
    const debounceSearch = debounce((searchQuery: string) => handleSearch(searchQuery), 600);
    const handleActive = (workspaceId: number | string, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ workspaceId, status: active });
    };
    const handleEdit = (record: WorkspaceBody) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deleteWorkspaceData({ workspaceId: modalData!?.id });
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
    const handleConfirmation = (record: WorkspaceBody) => {
        setModalData(record);
        setDeleteModal(true);
    };
    const columns = getWorkspaceColumns({
        handleActive,
        handleEdit,
        handleConfirmation,
        accessPermission,
    });
    return (
        <Flex vertical gap={20}>
            <WorkspaceHeader
                downloadReport={downloadReport}
                handleSearch={debounceSearch}
                searchText={filters.searchText}
                setOpenModal={handleCreateModal}
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
        </Flex>
    );
};

export default WorkspacePage;
