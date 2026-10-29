import React, { memo } from 'react';

import { Col, Row, Typography } from 'antd';

import SubscriptionHeader from './SubscriptionHeader';
import SubscriptionTable from './SubscriptionTable';
// import useFilter from '../hooks/useFilter';
import useSubscriptionFilter from '../hooks/useSubscriptionFilter';
import useSubscriptionReportListing from '../hooks/useSubscriptionReportListing';
import { filterOption, filterState, subscriptionTransactionRow } from '../types/index';

const { Title } = Typography;
interface tableProps {
    title: string;
    subscription: filterOption[];
    filter: filterState;
    setFilter: (value: any) => void;
    handleFilterChange: (value: any) => void;
    initalStartDate: string;
    initalEndDate: string;
    data: subscriptionTransactionRow[];
    isLoading: boolean;
    count: number | undefined;
    initialValues: filterState;
    isCashbackTable?: boolean;
}
const SubscriptionReportTables = ({
    data,
    count,
    isLoading,
    title,
    subscription,
    filter,
    setFilter,
    initalStartDate,
    initalEndDate,
    initialValues,
    isCashbackTable = false,
    handleFilterChange,
}: tableProps) => {
    const { downloadReport } = useSubscriptionReportListing(filter, title);
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
    } = useSubscriptionFilter({ setFilter, initalStartDate, initalEndDate });
    return (
        <Row gutter={[0, 8]}>
            <Col span={24}>
                <Row justify="space-between" align="middle">
                    <Col className="mb-2 mr-10">
                        <Title level={4} style={{ fontWeight: 400 }}>
                            {title}
                        </Title>
                    </Col>
                    <Col flex="auto" className="mb-2">
                        <SubscriptionHeader
                            text={title}
                            subscription={subscription}
                            from={filter.from}
                            to={filter.to}
                            initialFrom={initialValues.from} // Pass initial from date
                            initialTo={initialValues.to} // Pass initial to date
                            handleChangeFilters={handleChangeFilters}
                            handleDateChange={handleDateChange}
                            handleSearch={handleSearch}
                            handleFromChange={handleFromChange}
                            handleToChange={handleToChange}
                            handleDownloadReport={downloadReport}
                            isLoading={isLoading}
                            searchText={filter.searchText}
                            isCashbackTable={isCashbackTable}
                            hasData={data.length > 0}
                        />
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <SubscriptionTable
                    handleFilterChange={handleFilterChange}
                    filter={filter.filter}
                    page={filter.page}
                    data={data}
                    isLoading={isLoading}
                    count={count}
                    handlePageChange={handlePageChange}
                    isCashbackTable={isCashbackTable}
                    handleSort={handleSort}
                    handleFilter={handleFilter}
                    handleTableChange={handleTableChange}
                />
            </Col>
        </Row>
    );
};

export default memo(SubscriptionReportTables);
