import { useEffect, useMemo, useRef, useState } from 'react';

import { Flex, Pagination } from 'antd';
import { debounce } from 'lodash';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import LegalTemplatesHeader from './Header';
import CreateUpdateModal from './Modal';
import useFilter from '../../hooks/useFilters';
import useLegalTemplates from '../../hooks/useLegalTemplates';
import useLegalTemplatesExport from '../../hooks/useLegalTemplatesExport';
import { LegalTemplatesBody, RolePermissionAccessData } from '../../types/legalTemplates';
import getLegalTemplatesColumns from '../columns/LegalTemplatesColumns';

const LegalTemplatesPage = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: 'createdAt',
    };

    const [filters, setFilters] = useState(initialValues);
    const [searchInput, setSearchInput] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalData, setModalData] = useState<LegalTemplatesBody | undefined>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data ?? [], 'Legal Templates');

    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { isLoading, tableData, count, handleRefresh, updateActiveStatus, deleteTemplate } =
        useLegalTemplates(filters);

    const { downloadReport } = useLegalTemplatesExport({
        searchText: filters.searchText,
        sort: filters.sort,
        sortField: filters.sortField,
    });

    const {
        handleSearch,
        handlePageChange,
        handleChangeFilters,
        setSearchText,
        handleTableChange,
    } = useFilter({ setFilters });

    const handleSearchRef = useRef(handleSearch);
    handleSearchRef.current = handleSearch;
    const debounceSearch = useMemo(() => debounce((e: any) => handleSearchRef.current(e), 600), []);

    const handleSearchChange = (e: any) => {
        setSearchInput(e.target.value.trimStart());
        debounceSearch(e);
    };

    const handleActive = (templateId: number | string, isActive: any) => {
        const active = !(isActive === 1 || isActive === true);
        updateActiveStatus({ templateId, status: active });
    };

    const handleEdit = (record: LegalTemplatesBody) => {
        setModalData(record);
        setOpenModal(true);
    };

    const handleConfirmation = (record: LegalTemplatesBody) => {
        setModalData(record);
        setDeleteModal(true);
    };

    const handleDelete = () => {
        if (modalData?.id) deleteTemplate(modalData.id);
        setDeleteModal(false);
    };

    const handleCreateModal = () => {
        setModalData(undefined);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setModalData(undefined);
        setOpenModal(false);
    };

    const columns = getLegalTemplatesColumns({
        handleActive,
        handleEdit,
        handleConfirmation,
        accessPermission,
    });

    return (
        <Flex vertical gap={20}>
            <LegalTemplatesHeader
                handleChangeFilters={handleChangeFilters}
                handleSearch={handleSearchChange}
                setSearchText={setSearchText}
                searchText={searchInput}
                setOpenModal={handleCreateModal}
                accessPermission={accessPermission}
                downloadReport={downloadReport}
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

export default LegalTemplatesPage;
