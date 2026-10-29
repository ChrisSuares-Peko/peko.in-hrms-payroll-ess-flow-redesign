import { useState } from 'react';

import { Flex, Pagination } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';

import GenericTable from '@components/atomic/GenericTable';

import Header from './Header';
import usePaytmBpos from '../../hooks/usePaytmBpos';
import usePaytmBposFilter from '../../hooks/usePaytmBposFilter';
import PaytmBposColumns from '../columns/PaytmBposColumns';

const DemoRequests = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: todayFormatted,
        to: todayFormatted,
        id: '',
    };
    const [filters, setFilters] = useState(initialValues);

    const {
        handleSearch,
        handlePageChange,
        handleDateChange,
        handleTableChange,
        handleFromChange,
        handleToChange,
    } = usePaytmBposFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { isLoading, tableData, count, updateBposStatus } = usePaytmBpos(filters);
    const debounceSearch = debounce((searchQuery: string) => handleSearch(searchQuery), 600);
    const columns = PaytmBposColumns(updateBposStatus);
    return (
        <Flex vertical gap={20}>
            <Header
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleSearch={debounceSearch}
                searchText={filters.searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
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
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default DemoRequests;
