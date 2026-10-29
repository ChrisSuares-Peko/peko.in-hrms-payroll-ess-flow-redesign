import React, { memo } from 'react';

import { Col } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { TableProps } from 'antd/lib';

import useScreenSize from '@src/hooks/useScreenSize';

import SubscriptionMobileTable from './SubscriptionMobileTable';
import SubscriptionWebTable from './SubscriptionWebTable';
import { subscriptionTransactionRow } from '../types/index';

type Props = {
    data: subscriptionTransactionRow[];
    isLoading: boolean;
    page: number;
    handlePageChange: (page: number, pageSize: number) => void;
    count: number | undefined;
    isCashbackTable: boolean;
    handleSort: (sort: string) => void;
    handleFilter: (sort: FilterValue | null) => void;
    handleTableChange: TableProps<any>['onChange'];
    handleFilterChange: (value: any) => void;
    filter: string;
};

const SubscriptionTable = ({
    count,
    data,
    handleFilter,
    handlePageChange,
    handleSort,
    isCashbackTable,
    isLoading,
    page,
    handleTableChange,
    handleFilterChange,
    filter,
}: Props) => {
    const { xs } = useScreenSize();
    return (
        <Col span={24}>
            {xs ? (
                <SubscriptionMobileTable
                    isLoading={isLoading}
                    page={page}
                    data={data}
                    count={count}
                    handlePageChange={handlePageChange}
                    isCashbackTable={isCashbackTable}
                />
            ) : (
                <SubscriptionWebTable
                    filter={filter}
                    handleFilterChange={handleFilterChange}
                    page={page}
                    data={data}
                    isloading={isLoading}
                    count={count}
                    handlePageChange={handlePageChange}
                    isCashbackTable={isCashbackTable}
                    handleSort={handleSort}
                    handleFilter={handleFilter}
                    handleTableChange={handleTableChange}
                />
            )}
        </Col>
    );
};

export default memo(SubscriptionTable);
