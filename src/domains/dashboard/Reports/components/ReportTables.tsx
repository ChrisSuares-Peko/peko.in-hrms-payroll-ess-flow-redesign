import React, { useMemo } from 'react';

import { Col, Row, Typography } from 'antd';

import Headers from './Headers';
import Table from './Table';
import useFilter from '../hooks/useFilter';
import useReportExcelCSVPDFListing from '../hooks/useReportListing';
import { filterOption, filterState, transactionType } from '../types/index';

interface TableProps {
    title: string;
    category: filterOption[];
    filter: filterState;
    setFilter: (value: any) => void;
    handleFilterChange: (value: any) => void;
    initalStartDate: string;
    initalEndDate: string;
    data: transactionType[];
    isLoading: boolean;
    count: number | undefined;
    initialValues: filterState;
    isCashbackTable?: boolean;
}

const ReportTables: React.FC<TableProps> = ({
    data,
    count,
    isLoading,
    title,
    category,
    filter,
    setFilter,
    initalStartDate,
    initalEndDate,
    initialValues,
    isCashbackTable = false,
    handleFilterChange,
}) => {
    const { downloadReport, orderLoading } = useReportExcelCSVPDFListing(filter, title);
    const {
        handleSearch,
        handleChangeFilters,
        handlePageChange,
        handleFilter,
        handleSort,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
    } = useFilter({ setFilter, initalStartDate, initalEndDate });

    const memoizedHandlers = useMemo(
        () => ({
            handleSearch,
            handleChangeFilters,
            handlePageChange,
            handleFilter,
            handleSort,
            handleDateChange,
            handleFromChange,
            handleToChange,
            handleTableChange,
        }),
        [
            handleSearch,
            handleChangeFilters,
            handlePageChange,
            handleFilter,
            handleSort,
            handleDateChange,
            handleFromChange,
            handleToChange,
            handleTableChange,
        ]
    );

    const memoizedHeaders = useMemo(
        () => (
            <Headers
                text={title}
                category={category}
                from={filter.from}
                to={filter.to}
                initialFrom={initialValues.from}
                initialTo={initialValues.to}
                handleChangeFilters={memoizedHandlers.handleChangeFilters}
                handleDateChange={memoizedHandlers.handleDateChange}
                handleSearch={memoizedHandlers.handleSearch}
                handleFromChange={memoizedHandlers.handleFromChange}
                handleToChange={memoizedHandlers.handleToChange}
                handleDownloadReport={downloadReport}
                isLoading={isLoading}
                searchText={filter.searchText}
                isCashbackTable={isCashbackTable}
                orderLoading={orderLoading}
            />
        ),
        [
            title,
            category,
            filter.from,
            filter.to,
            filter.searchText,
            initialValues.from,
            initialValues.to,
            memoizedHandlers.handleChangeFilters,
            memoizedHandlers.handleDateChange,
            memoizedHandlers.handleSearch,
            memoizedHandlers.handleFromChange,
            memoizedHandlers.handleToChange,
            downloadReport,
            isLoading,
            isCashbackTable,
            orderLoading,
        ]
    );

    return (
        <Row gutter={[0, 8]}>
            <Col span={24}>
                <Row justify="space-between" align="middle">
                    <Col className="mb-2 mr-10">
                        <Typography.Title level={4} style={{ fontWeight: 400 }}>
                            {title}
                        </Typography.Title>
                    </Col>
                    <Col flex="auto" className="">
                        {memoizedHeaders}
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Table
                    handleFilterChange={handleFilterChange}
                    filter={filter.filter}
                    page={filter.page}
                    data={data}
                    isLoading={isLoading}
                    count={count}
                    handlePageChange={memoizedHandlers.handlePageChange}
                    isCashbackTable={isCashbackTable}
                    handleSort={memoizedHandlers.handleSort}
                    handleFilter={memoizedHandlers.handleFilter}
                    handleTableChange={memoizedHandlers.handleTableChange}
                />
            </Col>
        </Row>
    );
};

export default React.memo(ReportTables);
