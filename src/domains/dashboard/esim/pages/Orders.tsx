import React, { useState } from 'react';

import { Row, Col } from 'antd';
import dayjs from 'dayjs';

import useDebounceSearch from '@src/hooks/useDebounceSearch';

import OrderHeader from '../components/orders/OrderHeader';
import OrderTable from '../components/orders/OrderTable';
import useFilter from '../hooks/useFilters';
import useGetOrdersList from '../hooks/useGetOrdersList';

type Props = {};

const Orders = (props: Props) => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthBefore = today.subtract(1, 'month'); // Subtract 1 month
    const oneMonthBeforeFormatted = oneMonthBefore.format('YYYY-MM-DD');
    const [filter, setFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        startDate: oneMonthBeforeFormatted,
        endDate: todayFormatted,
    });

    const { handlePageChange, handleDateChange, handleToChange, handleFromChange } = useFilter({
        setFilters,
        initalStartDate: filter.startDate,
        initalEndDate: filter.endDate,
    });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const { data, totalRecord, isLoading } = useGetOrdersList(
        filter.itemsPerPage,
        filter.page,
        filter.searchText,
        filter.startDate,
        filter.endDate
    );

    return (
        <Row>
            <Col span={24}>
                <OrderHeader
                    handleSearch={updateSearchText}
                    searchText={searchText}
                    handleDateChange={handleDateChange}
                    handleFromChange={handleFromChange}
                    handleToChange={handleToChange}
                    fromDate={filter.startDate}
                    toDate={filter.endDate}
                />
            </Col>
            <Col className="" span={24}>
                <OrderTable
                    data={data}
                    totalRecord={totalRecord}
                    isLoading={isLoading}
                    handlePageChange={handlePageChange}
                    filter={filter}
                />
            </Col>
        </Row>
    );
};

export default Orders;
