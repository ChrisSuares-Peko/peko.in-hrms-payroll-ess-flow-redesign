import { useState, useEffect } from 'react';

import { DownloadOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row, Select, Tag, Image, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';


import tickIcon from '@src/assets/icons/tickicon.png';
import { BoldText } from '@src/domains/dashboard/logistics/components/CustomText';
import { paths } from '@src/routes/paths';

import EmployeesSalaryTable from './EmployeesSalaryTable';
import NoProcessedPayrollEmpty from './NoProcessedPayrollEmpty';
import DownloadSalaryData from '../../hooks/employeeSalaryHooks/salaryTableHooks/useExportSalaryApi';
import { useGetEmployeeSalaryApi } from '../../hooks/employeeSalaryHooks/salaryTableHooks/useGetAllEmployeeSalaryApi';
import useActiveYearsApi from '../../hooks/OrganizationSettings/useActiveYearsApi';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import useFilter from '../../utils/general/useFilter';
import { monthsArray } from '../../utils/salaryTable/data';

const PROCESSED_STATUSES = 'UPCOMING,PENDING,PAID,APPROVED,FAILD,INITIATED';

const EmployeesSalaryListTab = ({
    reloadTable,
    onDateChange,
    handleSalaryCycle,
    setSalaryArray,
    onPaymentStatusChange,
}: any) => {
    const initialYear = new Date().getFullYear();
    const initialMonth = new Date().getMonth() + 1;
    const { years } = useActiveYearsApi();
    const navigate = useNavigate();


    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 10,
        filter: PROCESSED_STATUSES,
        year: initialYear,
        month: initialMonth,
    };

    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handleSearch, handlePageChange, handleChangeMonth, handleChangeYear } = useFilter({
        setFilter,

        onMonthChange: month => {
            setFilter(prev => ({ ...prev, month }));
            onDateChange(month, filter.year);
        },
        onYearChange: year => {
            setFilter(prev => ({ ...prev, year }));
            onDateChange(filter.month, year);
        },
    });
    const formatDate = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        const month = months[date.getMonth()]; // Month is zero-based
        const day = date.getDate().toString().padStart(2, '0');
        return `${day} ${month} ${year}`;
    };
    const { tableDatas, orderCount, tableLoading, salaryCycle } = useGetEmployeeSalaryApi(
        filter.searchText,
        filter.sort,
        filter.page,
        filter.limit,
        filter.filter,
        filter.year,
        filter.month,
        reloadTable
    );

    useEffect(() => {
        if (onPaymentStatusChange) {
            onPaymentStatusChange((tableDatas[0] as any)?.status || '');
        }
    }, [tableDatas, onPaymentStatusChange]);

    // const prevSalaryArray = useRef(salaryArray);

    // useEffect(() => {
    //     if (salaryArray !== prevSalaryArray.current) {
    //         setSalaryArray(salaryArray);
    //         prevSalaryArray.current = salaryArray;
    //     }
    // }, [salaryArray, setSalaryArray]);

    // handleSalaryCycle(salaryCycle);

    const { getSalaryDetails, loader } = DownloadSalaryData();
    const handleExport = async () => {
        try {
            getSalaryDetails(filter.month, filter.year, 'APPROVED');
        } catch (error) {
            console.error('Error exporting data: ', error);
        }
    };

    return (
        <Row gutter={20}>
            <Col span={13}>
                <Input
                    placeholder="Search Employee by name or ID "
                    prefix={<SearchOutlined />}
                    value={filter.searchText}
                    onChange={e => {
                        const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                        handleSearch({ ...e, target: { ...e.target, value } });
                    }}
                    allowClear
                    type="text"
                    maxLength={100}
                />
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Select
                    options={monthsArray}
                    className="w-full "
                    onChange={handleChangeMonth}
                    defaultValue={initialMonth.toString()}
                />
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Select
                    options={years?.years}
                    // options={yearsArray}
                    className="w-full"
                    onChange={handleChangeYear}
                    defaultValue={initialYear}
                />
            </Col>
            <Col xs={24} sm={12} md={3}>
                <Button
                    danger
                    icon={<DownloadOutlined />}
                    style={{
                        color: 'black',
                        borderColor: '#e5e7eb',
                        backgroundColor: 'transparent',
                        borderRadius: '2px',
                    }}
                    onClick={handleExport}
                    className="w-full"
                    loading={loader}
                >
                    Export
                </Button>
            </Col>

            <Col span={24}>
                <Row justify="center" className="mt-3" align="middle">
                    <Col span={24}>
                        {salaryCycle ? (
                            <Tag
                                className=""
                                style={{
                                    width: '100%',
                                    textAlign: 'start',
                                    height: '40px',
                                    alignItems: 'center',
                                    lineHeight: '40px',
                                    fontSize: '13px',
                                    backgroundColor: '#F6FFED',
                                }}
                            >
                                <Image
                                    src={tickIcon}
                                    style={{ height: '60%', width: '60%' }}
                                    className=""
                                    preview={false}
                                />
                                Showing the salary from{' '}
                                <BoldText
                                    text={formatDate(salaryCycle?.salaryCycleStart.split('T')[0])}
                                />{' '}
                                to{' '}
                                <BoldText
                                    text={formatDate(salaryCycle?.salaryCycleEnd.split('T')[0])}
                                />
                                <Tooltip
                                    title={`Salary Cycle: ${salaryCycle?.salaryCycleDays} days`}
                                >
                                    <InfoCircleOutlined
                                        style={{
                                            marginLeft: '8px',
                                            color: '#1890ff',
                                            cursor: 'pointer',
                                        }}
                                    />
                                </Tooltip>
                            </Tag>
                        ) : null}
                    </Col>
                </Row>
                {!tableLoading && tableDatas.length === 0 && !filter.searchText ? (
                    <NoProcessedPayrollEmpty
                        onRunPayroll={() =>
                            navigate(paths.payroll.salaryProfile, {
                                state: { month: Number(filter.month), year: filter.year },
                            })
                        }
                    />
                ) : (
                    <EmployeesSalaryTable
                        data={tableDatas}
                        count={orderCount}
                        isLoading={tableLoading}
                        filter={filter}
                        setFilter={setFilter}
                        page={filter.page}
                        handlePageChange={handlePageChange}
                    />
                )}
            </Col>
        </Row>
    );
};

export default EmployeesSalaryListTab;
