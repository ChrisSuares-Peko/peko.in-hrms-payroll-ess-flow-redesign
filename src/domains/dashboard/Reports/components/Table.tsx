import React from 'react';

import { Col, Grid } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { TableProps } from 'antd/lib';

import MobileTable from './MobileTable';
import WebTable from './WebTable';
import { transactionType } from '../types/index';

type Props = {
    data: transactionType[];
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

const Table = ({
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
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    return (
        <Col span={24}>
            {screens.xs ? (
                <MobileTable
                    isLoading={isLoading}
                    page={page}
                    data={data}
                    count={count}
                    handlePageChange={handlePageChange}
                    isCashbackTable={isCashbackTable}
                />
            ) : (
                <WebTable
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

export default Table;
