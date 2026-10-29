import { useEffect, useMemo, useState } from 'react';

import { Flex, Pagination, Select, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useGetSalaryHistory } from '@src/domains/dashboard/Payroll/hooks/employeeSalaryHooks/useGetSalaryHistory';
import useGetOrganizationSetting from '@src/domains/dashboard/Payroll/hooks/OrganizationSettings/useGetOrganizationDetailsApi';
import { getSalaryHistoryColumns } from '@src/domains/dashboard/Payroll/utils/salaryHistory/columns';
import { useAppSelector } from '@src/hooks/store';
import { useScrollToTop } from '@src/hooks/useScrollToTop';

const { Text } = Typography;

const PAGE_SIZE = 10;

const getSalaryHistoryYearOptions = (payrollFrom?: string) => {
    const currentYear = new Date().getFullYear();
    const payrollFromDate = payrollFrom ? new Date(payrollFrom) : null;
    const payrollStartYear = payrollFromDate && !Number.isNaN(payrollFromDate.getTime())
        ? payrollFromDate.getFullYear()
        : currentYear;

    if (payrollStartYear > currentYear) return [];

    return Array.from({ length: currentYear - payrollStartYear + 1 }, (_, index) => {
        const year = String(payrollStartYear + index);
        return { label: year, value: year };
    });
};

const SalaryHistory = () => {
    useScrollToTop();
    const navigate = useNavigate();
    const payrollFrom = useAppSelector(state => state.reducer.orgSettings.payrollSettings.payrollFrom);
    const { isLoading: isOrganizationSettingsLoading, hasLoaded: hasLoadedOrganizationSettings } = useGetOrganizationSetting();
    const [activeYear, setActiveYear] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const yearOptions = useMemo(
        () => (hasLoadedOrganizationSettings ? getSalaryHistoryYearOptions(payrollFrom) : []),
        [hasLoadedOrganizationSettings, payrollFrom]
    );
    const hasValidActiveYear = yearOptions.some(option => option.value === activeYear);
    const { rows, count, isLoading } = useGetSalaryHistory(activeYear, currentPage, PAGE_SIZE, hasValidActiveYear);
    const columns = getSalaryHistoryColumns(navigate);

    useEffect(() => {
        if (!yearOptions.length) {
            setActiveYear('');
            setCurrentPage(1);
            return;
        }

        if (!hasValidActiveYear) {
            setActiveYear(yearOptions[yearOptions.length - 1].value);
            setCurrentPage(1);
        }
    }, [hasValidActiveYear, yearOptions]);

    return (
        <Flex vertical gap={32} style={{ padding: '24px 16px 48px', width: '100%' }}>
            {/* Header */}
            <Text className="text-2xl font-semibold">
                Salary History
            </Text>

            {/* Filters row */}
            <Flex justify="start" align="center" gap={16}>
                <Select
                    placeholder="Select Year"
                    value={activeYear || undefined}
                    onChange={val => {
                        setActiveYear(val);
                        setCurrentPage(1);
                    }}
                    options={yearOptions}
                    disabled={!hasLoadedOrganizationSettings || isOrganizationSettingsLoading || !yearOptions.length}
                    style={{ width: 200, height: 44 }}
                />

               
            </Flex>

            {/* Table card */}
            <Flex
                vertical
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #EFF1F4',
                    borderRadius: 20,
                    overflow: 'hidden',
                }}
            >
                <GenericTable
                    dataSource={rows}
                    columns={columns}
                    loading={isLoading || isOrganizationSettingsLoading || !hasLoadedOrganizationSettings}
                    pagination={false}
                    rowKey="key"
                    style={{ width: '100%' }}
                />
                <Flex justify="flex-end" style={{ padding: '16px 24px' }}>
                    <Pagination
                        current={currentPage}
                        pageSize={PAGE_SIZE}
                        total={count}
                        onChange={setCurrentPage}
                        showSizeChanger={false}
                        
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default SalaryHistory;
