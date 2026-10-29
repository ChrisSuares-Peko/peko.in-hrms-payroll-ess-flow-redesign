import { useEffect, useState } from 'react';

import { Pagination, Table } from 'antd';
import type { TableColumnsType } from 'antd';

import { useGetEmployeeSalaryApi } from '../../hooks/employeeSalaryHooks/salaryTableHooks/useGetAllEmployeeSalaryApi';
import { ProcessSalaryType } from '../../types/employeeOnboarding';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';

const BulkEmployeesTable = ({ month, year }: { month: number; year: number }) => {
    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 10,
        // Review only ever lists employees actually awaiting approval this month — an
        // employee already PAID/APPROVED in an earlier run (e.g. everyone else, when a
        // late-added employee is being back-filled into an already-processed month) must
        // never reappear here for re-approval.
        filter: 'PENDING',
        year,
        month,
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const [currentPage, setCurrentPage] = useState(initialValues.page);
    const [limit, setLimit] = useState(initialValues.limit);
    const handlePageChange = (page: number, Limit: number) => {
        setCurrentPage(page);
        setLimit(Limit);
    };

    // const handleSizeChange = (current: number, size: number) => {
    //     setCurrentPage(current);
    //     setLimit(size);
    //     setFilter(prev => ({ ...prev, page: current, limit: size }));
    // };

    const {
        orderCount,
        tableLoading,
        salaryArray: salaryData,
    } = useGetEmployeeSalaryApi(
        filter.searchText,
        filter.sort,
        filter.page,
        filter.limit,
        filter.filter,
        filter.year,
        filter.month,
        false
    );
    useEffect(() => {
        // Trigger data fetching whenever the filter changes
        setFilter(prev => ({ ...prev, page: currentPage, limit }));
    }, [currentPage, limit]);

    const columns: TableColumnsType<ProcessSalaryType> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },

        {
            title: 'Employee ID',
            dataIndex: 'employeeId',
            key: 'employeeId',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Total Salary',
            dataIndex: 'monthlySalary',
            key: 'monthlySalary',
        },

        {
            title: 'Bonus',
            dataIndex: 'totalBonus',
            key: 'totalBonus',
            render: value => ` ${value.toLocaleString()}`,
        },
        {
            title: 'Incentives',
            dataIndex: 'totalIncentive',
            key: 'totalIncentive',
            render: value => ` ${value.toLocaleString()}`,
        },
        {
            title: 'Over Time',
            dataIndex: 'totalOvertime',
            key: 'overtime',
            render: value => ` ${value.toLocaleString()}`,
        },
        {
            title: 'Deduction',
            dataIndex: 'totalDeduction',
            key: 'deduction',
            render: value => ` ${value.toLocaleString()}`,
        },
        {
            title: 'Net Pay',
            dataIndex: 'totalPayable',
            key: 'totalPayable',
            render: value => `AED ${value.toLocaleString()}`,
        },
    ];

    return (
        <>
            <Table
                columns={columns}
                dataSource={salaryData}
                rowKey="id"
                pagination={false}
                loading={tableLoading}
                style={{ overflow: 'auto' }}
            />
            <Pagination
                size="default"
                className="md:text-end pt-7 xs:text-center"
                current={currentPage}
                total={orderCount}
                onChange={handlePageChange}
                defaultPageSize={10}
            />
        </>
    );
};

export default BulkEmployeesTable;
