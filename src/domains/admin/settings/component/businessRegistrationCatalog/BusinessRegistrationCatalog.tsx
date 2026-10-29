import { useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';

import getCatalogColumns from './Columns';
import CatalogHeader from './Header';
import CatalogModal from './Modal';
import useGetBusinessRegistrationCatalog from '../../hooks/useGetBusinessRegistrationCatalog';
import { CatalogRow } from '../../types/businessRegistrationCatalog';

const BusinessRegistrationCatalog = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'ASC' as 'ASC' | 'DESC',
        sortField: 'sortOrder',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<CatalogRow>();

    const { isLoading, isSyncing, tableData, count, handleRefresh, updateActiveStatus, syncFromVendor } =
        useGetBusinessRegistrationCatalog(filters);
    const { handleSearch, handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleActive = (id: number | string, isActive: boolean) => {
        updateActiveStatus({ id, status: !isActive });
    };
    const handleEdit = (record: CatalogRow) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
        setModalData(undefined);
    };

    const columns = getCatalogColumns({ handleActive, handleEdit });

    return (
        <Flex vertical gap={20}>
            <CatalogHeader
                handleSearch={handleSearch}
                searchText={filters.searchText}
                onSync={syncFromVendor}
                isSyncing={isSyncing}
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
                <CatalogModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    handleRefresh={handleRefresh}
                />
            )}
        </Flex>
    );
};

export default BusinessRegistrationCatalog;
