import { useState } from 'react';

import { Flex, Pagination } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import Header from './Header';
import OndcOrdersTable from './OndcOrdersTable';
import useFilter from '../hooks/useFilter';
import useReturnRequest from '../hooks/useReturnRequest';
import { AllOrdersRow } from '../types/types';

/**
 * Returns tab — every ONDC order with return activity, live requests included
 * (fetched by useReturnRequest via getAllOndcOrders with returnsOnly). Rendered
 * with the shared OndcOrdersTable; Fulfilment is swapped for Return Status,
 * since a returning order's Delivery leg is stale ("Delivered") and the stage
 * of the return is the thing this tab is actually about.
 */
const ReturnRequests = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
        id: '',
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const navigate = useNavigate();
    const {
        handleSearch,
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const debounceSearch = debounce((searchQuery: string) => handleSearch(searchQuery), 600);
    const { isLoading, tableData, count, downloadReport } = useReturnRequest(filters);
    const openDetails = (record: AllOrdersRow) =>
        navigate(`${paths.systemUser.manage}/${paths.manage.orders}/details/${record.id}`);

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                handleSearch={debounceSearch}
                searchText={filters.searchText}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
            />
            <OndcOrdersTable
                tableData={tableData}
                isLoading={isLoading}
                onTableChange={handleTableChange}
                onView={openDetails}
                showFulfilment={false}
                showReturnStatus
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

export default ReturnRequests;
