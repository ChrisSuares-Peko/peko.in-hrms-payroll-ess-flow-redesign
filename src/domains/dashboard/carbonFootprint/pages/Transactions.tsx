import React, { useEffect, useState } from 'react';

import { Flex, Row, Typography, Col } from 'antd';
import dayjs from 'dayjs';

import useDebounce from '@src/hooks/useDebounce';

import Headers from '../components/transactions/Headers';
import Table from '../components/transactions/Table';
import useGetTransactionData from '../hooks/useGetTransactionData';
import useTransactionFilter from '../hooks/useTransactionFilter';
import { InitialValues, filtersState } from '../types/dashboard';

const { Title } = Typography;

const Transactions: React.FC = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initaialValues: InitialValues = {
        searchQuery: '',
        category: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        filter: '',
        from: todayFormatted,
        to: todayFormatted,
    };
    const [filters, setFilters] = useState<filtersState>(initaialValues);
    const { count, data, isLoading } = useGetTransactionData(
        filters.searchQuery,
        filters.sort,
        filters.page,
        filters.itemsPerPage,
        filters.filter,
        filters.from,
        filters.to
    );
    const {
        handlePageChange,
        handleFilter,
        handleSort,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useTransactionFilter({ setFilters, initaialValues });
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebounce(searchText, 500);

    const updateSearchText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    useEffect(() => {
        setFilters(prevFilter => ({
            ...prevFilter,
            searchQuery: debouncedSearchText,
            page: 1,
        }));
    }, [debouncedSearchText]);
    return (
        <Row className="my-10" gutter={[0, 20]}>
            <Col xs={24} lg={4}>
                <Flex>
                    <Title level={4} style={{ fontWeight: 400 }}>
                        Transactions
                    </Title>
                </Flex>
            </Col>
            <Col xs={{ span: 24 }} lg={{ span: 18, offset: 2 }} xl={{ span: 15, offset: 5 }}>
                <Headers
                    from={filters.from}
                    to={filters.to}
                    handleDateChange={handleDateChange}
                    handleSearch={updateSearchText}
                    isLoading={isLoading}
                    searchText={searchText}
                    handleFromChange={handleFromChange}
                    handleToChange={handleToChange}
                />
            </Col>
            <Table
                page={filters.page}
                data={data}
                isLoading={isLoading}
                count={count}
                handlePageChange={handlePageChange}
                handleSort={handleSort}
                handleFilter={handleFilter}
            />
        </Row>
    );
};

export default Transactions;
