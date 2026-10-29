import { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import getGovtServiceColumns from './Columns';
import GovtServicesHeader from './GovtServicesHeader';
import GovtServicesModal from './GovtServicesModal';
import useFilter from '../../hooks/useFilters';
import useGetGovtServices from '../../hooks/useGetGovtServices';
import { GovtService, RolePermissionAccessData } from '../../types/govtServicesTypes';

const GovtServices = () => {
    const initialFilters = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'ASC',
        sortField: 'sortOrder',
    };

    const [filters, setFilters] = useState(initialFilters);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<GovtService>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Government Services');

    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { isLoading, isSyncing, tableData, count, setRefresh, handleToggleStatus, syncFromVendor } =
        useGetGovtServices(filters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleEdit = (record: GovtService) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
        setModalData(undefined);
    };

    const columns = getGovtServiceColumns({
        handleActive: handleToggleStatus,
        handleEdit,
        accessPermission,
    });

    return (
        <Flex vertical gap={20}>
            <GovtServicesHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                onSync={syncFromVendor}
                isSyncing={isSyncing}
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
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <GovtServicesModal
                    open={openModal}
                    data={modalData}
                    handleCancel={handleCloseModal}
                    setRefresh={setRefresh}
                />
            )}
        </Flex>
    );
};

export default GovtServices;
