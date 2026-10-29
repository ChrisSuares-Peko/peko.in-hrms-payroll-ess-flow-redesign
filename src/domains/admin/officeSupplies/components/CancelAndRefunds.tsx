import { useState } from 'react';

import { Flex, Pagination } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import Header from './Header';
import OndcOrdersTable from './OndcOrdersTable';
import useCancelAndRefunds from '../hooks/useCancelAndRefunds';
import useFilter from '../hooks/useFilter';
import { AllOrdersRow } from '../types/types';

/**
 * Cancellations & Refunds tab — lists the real ONDC orders in orderState
 * "Cancelled" (fetched by useCancelAndRefunds via getAllOndcOrders with
 * status="Cancelled"). Rendered with the shared OndcOrdersTable; Fulfilment is
 * omitted since a cancelled order's Delivery leg is stale.
 */
const CancelAndRefunds = () => {
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
    const { isLoading, tableData, count, downloadReport } = useCancelAndRefunds(filters);
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

export default CancelAndRefunds;
