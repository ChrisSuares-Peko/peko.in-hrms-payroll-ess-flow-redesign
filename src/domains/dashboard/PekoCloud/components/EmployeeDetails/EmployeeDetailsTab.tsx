import React from 'react';

import { Col, Flex, Tabs, TabsProps } from 'antd';

import EmployeeDetailsTable from './employeeDetailsTable';

type Props = {
    reloadInfo: React.Dispatch<React.SetStateAction<boolean>>;
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    orderCount?: number;
    tableLoading: boolean;
    tableDatas: any;
    handleSearch: any;
    handlePageChange: any;
    page: number;
    limit: number;
};
const EmployeeDetailsTab = ({
    reloadInfo,
    setReloadTable,
    orderCount,
    tableLoading,
    tableDatas,
    handlePageChange,
    handleSearch,
    limit,
    page,
}: Props) => {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Employees',
            children: (
                <EmployeeDetailsTable
                    reloadInfo={reloadInfo}
                    setReloadTable={setReloadTable}
                    handlePageChange={handlePageChange}
                    handleSearch={handleSearch}
                    tableLoading={tableLoading}
                    orderCount={orderCount}
                    tableDatas={tableDatas}
                    page={page}
                    limit={limit}
                />
            ),
        },
        // {
        //     key: '2',
        //     label: 'Usage History',
        //     children: '',
        //     disabled: true,
        // },
    ];

    return (
        <Flex vertical className="">
            <Col xs={24}>
                <Tabs defaultActiveKey="1" items={items} />
            </Col>
        </Flex>
    );
};

export default EmployeeDetailsTab;
