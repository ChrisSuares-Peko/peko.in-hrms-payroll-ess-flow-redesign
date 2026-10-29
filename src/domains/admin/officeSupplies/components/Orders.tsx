import { useState } from 'react';

import { Flex, Pagination } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { STATUS_STYLES } from '@src/domains/dashboard/officeSupplies/components/OrderHistory/OndcStatusTag';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';

import Header from './Header';
import OndcOrdersTable from './OndcOrdersTable';
import useFilter from '../hooks/useFilter';
import useOndcOrders from '../hooks/useOndcOrders';
import { AllOrdersRow } from '../types/types';

const ORDER_STATE_OPTIONS = Object.entries(STATUS_STYLES).map(([value, { label }]) => ({ value, label }));

const OrderContent = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
        sortField: '',
        status: undefined as string | undefined,
        sellerName: undefined as string | undefined,
        needsAttention: false,
        delayedOnly: false,
    };
    const [filters, setFilters] = useState(initialValues);
    const navigate = useNavigate();
    const { handlePageChange, handleDateChange, handleFromChange, handleToChange, handleTableChange } =
        useFilter({
            setFilters,
            initalStartDate: initialValues.from,
            initalEndDate: initialValues.to,
        });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, sellerOptions, downloadReport, getAllTableData } =
        useOndcOrders(filters);
    const openDetails = (record: AllOrdersRow) =>
        navigate(`${paths.systemUser.manage}/${paths.manage.orders}/details/${record.id}`);

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
                orderStateOptions={ORDER_STATE_OPTIONS}
                orderState={filters.status}
                onOrderStateChange={value =>
                    setFilters(prev => ({ ...prev, status: value, page: 1 }))
                }
                sellerOptions={sellerOptions}
                seller={filters.sellerName}
                onSellerChange={value => setFilters(prev => ({ ...prev, sellerName: value, page: 1 }))}
                needsAttentionActive={filters.needsAttention}
                onToggleNeedsAttention={() =>
                    setFilters(prev => ({ ...prev, needsAttention: !prev.needsAttention, page: 1 }))
                }
                delayedOnlyActive={filters.delayedOnly}
                onToggleDelayedOnly={() =>
                    setFilters(prev => ({ ...prev, delayedOnly: !prev.delayedOnly, page: 1 }))
                }
            />
            <OndcOrdersTable
                tableData={tableData}
                isLoading={isLoading}
                onTableChange={handleTableChange}
                onView={openDetails}
                onRefunded={getAllTableData}
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

export default OrderContent;
