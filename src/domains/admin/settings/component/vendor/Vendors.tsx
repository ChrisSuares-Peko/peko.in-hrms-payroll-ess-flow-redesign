import React, { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import VendorHeader from './VendorHeader';
import VendorModal from './VendorModal';
import useFilter from '../../../manage/hooks/useFilters';
import useVendorData from '../../hooks/useVendor';
import { RolePermissionAccessData, Vendor } from '../../types/vendors';
import getVendorColumns from '../../utils/table_column/VendorColumns';

const VendorPage = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<Vendor>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Vendors', 'Settings'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { searchText, setSearchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, updateActiveStatus, handleRefresh, downloadReport } =
        useVendorData(filters);

    const { handlePageChange, handleChangeFilters, handleTableChange } = useFilter({
        setFilters,
    });

    const handleActive = (vendorId: number | string, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ vendorId, isActive: active });
    };
    const handleEdit = (record: Vendor) => {
        // eslint-disable-next-line no-nested-ternary
        const optionalsArray = Array.isArray(record.optionals)
            ? record.optionals
            : typeof record.optionals === 'object' && record.optionals !== null
              ? Object.entries(record.optionals).map(([key, value]) => ({ key, value }))
              : [];

        setModalData({ ...record, optionals: optionalsArray });
        setOpenModal(true);
    };
    const handleCreateModal = () => {
        setOpenModal(true);
        setModalData(undefined);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
        setModalData(undefined);
    };
    const columns = getVendorColumns({
        handleActive,
        handleEdit,
        accessPermission,
    });

    return (
        <Flex vertical gap={20}>
            <VendorHeader
                downloadReport={downloadReport}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                setSearchText={setSearchText}
                searchText={searchText}
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
                <VendorModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    handleRefresh={handleRefresh}
                />
            )}
        </Flex>
    );
};

export default VendorPage;
