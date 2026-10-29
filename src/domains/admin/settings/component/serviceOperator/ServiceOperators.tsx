import React, { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import OperatorHeader from './Header';
import OperatorModal from './OperatorModal';
import useFilter from '../../../manage/hooks/useFilters';
import useOperatorData from '../../hooks/useOperator';
import { RolePermissionAccessData, serviceOperator } from '../../types/serviceOperator';
import getOperatorColumns from '../../utils/table_column/OperatorColumns';

const ServiceOperatorPage = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
    };
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Service Operators'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<serviceOperator>();

    const { searchText, setSearchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, handleRefresh, updateActiveStatus, downloadReport } =
        useOperatorData(filters);

    const { handlePageChange, handleChangeFilters, handleTableChange } = useFilter({
        setFilters,
    });

    const handleActive = (operatorId: number | string, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ operatorId, serviceStatus: active });
    };
    const handleEdit = (record: serviceOperator) => {
        setModalData(record);
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
    const columns = getOperatorColumns({ handleActive, handleEdit, accessPermission });

    return (
        <Flex vertical gap={20}>
            <OperatorHeader
                downloadReport={downloadReport}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                setSearchText={setSearchText}
                searchText={searchText}
                setOpenModal={handleCreateModal}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={record => record.id!}
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
                <OperatorModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    handleRefresh={handleRefresh}
                />
            )}
        </Flex>
    );
};

export default ServiceOperatorPage;
