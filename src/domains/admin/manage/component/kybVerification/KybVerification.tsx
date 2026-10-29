import React, { useState } from 'react';

import { Flex, Pagination } from 'antd';
import { debounce } from 'lodash';

import GenericTable from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';

import getKybVerificationColumns from './Columns';
import KybHeader from './Header';
import UpdateModal from './Modal';
import useGetAllKybsApi from '../../hooks/kybVerifications/useGetAllKybsApi';

const KybVerification = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<any>();

    const {
        loading: isLoading,
        tableData: kybData,
        count: kybCount,
        updateStatusKyb,
    } = useGetAllKybsApi(filters);

    const {
        handleSearch,
        handlePageChange,
        handleChangeFilters,
        setSearchText,
        handleTableChange,
    } = useFilter({
        setFilters,
    });
    const debounceSearch = debounce((searchQuery: string) => handleSearch(searchQuery), 600);

    const handleEdit = (record: any) => {
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

    const columns = getKybVerificationColumns({
        handleEdit,
    });
    return (
        <Flex vertical gap={20}>
            <KybHeader
                handleChangeFilters={handleChangeFilters}
                handleSearch={debounceSearch}
                setSearchText={setSearchText}
                searchText={filters.searchText}
                setOpenModal={handleCreateModal}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={kybData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={kybCount}
                showSizeChanger={false}
            />
            {openModal && (
                <UpdateModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    updateStatusKyb={updateStatusKyb}
                />
            )}
        </Flex>
    );
};

export default KybVerification;
