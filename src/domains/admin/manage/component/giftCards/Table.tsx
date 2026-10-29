import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Flex, Pagination } from 'antd';
import { debounce } from 'lodash';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import AutoUpdateModal from './AutoUpdateModal';
import GiftCardHeader from './Header';
import CreateUpdateModal from './Modal';
import useFilter from '../../hooks/useFilters';
import useGiftCardsData from '../../hooks/useGiftCards';
import { GiftCardsBody, RolePermissionAccessData } from '../../types/giftCards';
import getGiftCardsColumns from '../columns/GiftCardColumns';

const GiftCardsPage = () => {
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
    const [openUpdateModal, setOpenUpdateModal] = useState(false);
    const [modalData, setModalData] = useState<GiftCardsBody>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Gift Cards'); // Get the service
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
        downloadReport,
        vendorData,
    } = useGiftCardsData(filters);
    const {
        handleSearch,
        handlePageChange,
        handleChangeFilters,
        setSearchText,
        handleTableChange,
    } = useFilter({
        setFilters,
    });
    const handleSearchRef = useRef(handleSearch);
    handleSearchRef.current = handleSearch;
    const debounceSearch = useMemo(() => debounce((e: any) => handleSearchRef.current(e), 600), []);
    const handleSearchChange = (e: any) => {
        setSearchInput(e.target.value.trimStart());
        debounceSearch(e);
    };
    const handleActive = (giftCardId: number | string, isActive: any) => {
        let active;
        if (isActive === 1 || isActive === true) active = false;
        else active = true;
        updateActiveStatus({ giftCardId, status: active });
    };
    const handleEdit = (record: GiftCardsBody) => {
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
    const handleCloseUpdateModal = () => {
        setOpenUpdateModal(false);
    };

    const columns = getGiftCardsColumns({
        handleActive,
        handleEdit,
        accessPermission,
        vendorData,
    });
    return (
        <Flex vertical gap={20}>
            <GiftCardHeader
                downloadReport={downloadReport}
                handleChangeFilters={handleChangeFilters}
                handleSearch={handleSearchChange}
                setSearchText={setSearchText}
                searchText={searchInput}
                setOpenModal={handleCreateModal}
                setOpenUpdateModal={setOpenUpdateModal}
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
                <CreateUpdateModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    handleRefresh={handleRefresh}
                />
            )}
            {openUpdateModal && (
                <AutoUpdateModal
                    open={openUpdateModal}
                    handleCancel={handleCloseUpdateModal}
                    handleRefresh={handleRefresh}
                    vendorData={vendorData}
                />
            )}
        </Flex>
    );
};

export default GiftCardsPage;
