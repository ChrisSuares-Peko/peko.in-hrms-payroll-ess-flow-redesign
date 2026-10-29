import React from 'react';

import { Col } from 'antd';
import { FilterValue } from 'antd/es/table/interface';

import useScreenSize from '@src/hooks/useScreenSize';

import MobileTable from './MobileTable';
import WebTable from './WebTable';
import { tableData } from '../../types/dashboard';

type Props = {
    data: tableData[];
    isLoading: boolean;
    page: number;
    handlePageChange: (page: number, pageSize: number) => void;
    count: number | undefined;
    handleSort: (sort: string) => void;
    handleFilter: (sort: FilterValue | null) => void;
};

const Table = ({
    count,
    data,
    handleFilter,
    handlePageChange,
    handleSort,
    isLoading,
    page,
}: Props) => {
    const { xs } = useScreenSize();

    return (
        <Col span={24}>
            {xs ? (
                <MobileTable
                    page={page}
                    data={data}
                    count={count}
                    handlePageChange={handlePageChange}
                    isLoading={isLoading}
                />
            ) : (
                <WebTable
                    page={page}
                    data={data}
                    isloading={isLoading}
                    count={count}
                    handlePageChange={handlePageChange}
                    handleSort={handleSort}
                    handleFilter={handleFilter}
                />
            )}
        </Col>
    );
};

export default Table;
