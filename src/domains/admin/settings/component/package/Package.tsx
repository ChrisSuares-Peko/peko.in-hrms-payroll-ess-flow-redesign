import React, { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import OperatorHeader from './Header';
import CreateUpdateModal from './PackageModal';
import useFilter from '../../../manage/hooks/useFilters';
import usePackage from '../../hooks/usePackage';
import { Packages, RolePermissionAccessData } from '../../types/package';
import getPackageColumns from '../../utils/table_column/PackageColumns';

const PackagePage = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
        partnerId: '',
    };
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Packages'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<Packages>();

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        tableData,
        count,
        handleRefresh,
        updateActiveStatus,
        deletePackageDetails,
        downloadReport,
    } = usePackage(filters);
    const { handlePageChange, handleTableChange, handlePartnerChange } = useFilter({
        setFilters,
    });

    const handleActive = (packageId: number | string, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ packageId, status: active });
    };
    const handleEdit = (record: Packages) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleDelete = () => {
        deletePackageDetails({ packageId: modalData!?.id });
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
    const handleConfirmation = (record: Packages) => {
        setModalData(record);
        setDeleteModal(true);
    };
    const columns = getPackageColumns({
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
                handlePartnerChange={handlePartnerChange}
                accessPermission={accessPermission}
                handleRefresh={handleRefresh}
                partnerId={filters.partnerId}
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

export default PackagePage;
