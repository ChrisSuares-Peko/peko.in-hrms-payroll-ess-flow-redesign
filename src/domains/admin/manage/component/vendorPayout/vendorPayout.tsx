import React, { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { useFindRolesService } from '@utils/findRolesService';

import { vendorColumns } from './vendorColumns';
import VendorHeader from './VendorHeader';
import VendorModal from './VendorModal';
import useFilter from '../../hooks/useFilters';
import useGetAllKybApi from '../../hooks/vendorPayout/useGetAllKybApi';
import useUpdateStatusApi from '../../hooks/vendorPayout/useUpdateStatusApi';
import { CorporateRecord, RolePermissionAccessData } from '../../types/vendorPayout';

const VendorPayout = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        pageSize: 10,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    };
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<CorporateRecord>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Vendor Payout'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const debounceSearchText = useDebounce(filters.searchText, 200);
    const { tableData, count, loading, setRefresh } = useGetAllKybApi({
        ...filters,
        searchText: debounceSearchText,
    });

    const { isLoading, downloadReport } = useUpdateStatusApi(filters);

    const {
        handleSearch,
        handlePageChange,
        handleTableChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useFilter({ setFilters, initalStartDate: filters.from, initalEndDate: filters.to });
    // const { isLoading, statusUpdate,setRefresh } = useUpdateCorporateTax();
    const handleEdit = (record: CorporateRecord) => {
        setModalData(record);
        setOpenModal(true);
    };
    const columns = vendorColumns(handleEdit, accessPermission);

    return (
        <Flex vertical gap={20}>
            <VendorHeader
                downloadReport={downloadReport}
                setRefresh={setRefresh}
                handleSearch={handleSearch}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={loading || isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <VendorModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    mode={modalData ? 'edit' : 'add'}
                />
            )}
        </Flex>
    );
};

export default VendorPayout;
