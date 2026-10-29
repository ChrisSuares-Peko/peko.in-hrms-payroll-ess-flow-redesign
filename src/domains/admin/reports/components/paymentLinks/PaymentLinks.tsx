import React, { useState } from 'react';

import { Flex, Pagination } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import usePaymentLinks from '../../hooks/usePaymentLinks';
import PaymentLinkColumns from '../../utils/paymentLinkColumn';

const PaymentLinks = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: '',
        sortField: '',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
        id: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const [tooltipText, setTooltipText] = useState('Copy to clipboard');

    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleChangeFilters,
        searchText,
        setSearchText,
        handleCategoryFilters,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);

    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = usePaymentLinks(filters);
    const columns = PaymentLinkColumns({ tooltipText, setTooltipText });

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                dropDownData={corporateDatas}
                setSearchText={setSearchText}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                searchText={searchTransaction}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
                handleCategoryFilters={handleCategoryFilters}
            />
            <GenericTable
                handleSort={handleTableChange}
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default PaymentLinks;
