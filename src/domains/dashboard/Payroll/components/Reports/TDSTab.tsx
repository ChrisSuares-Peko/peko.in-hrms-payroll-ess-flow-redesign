import React, { useMemo, useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Flex, Form, Input, Pagination, Row, Select, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { saveAs } from 'file-saver';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import { useAppSelector } from '@src/hooks/store';
import { yearsData } from '@utils/yearData';

import TDSDetailsModal from './TDSDetailsModal';
import { getSalaryDetailsByEmployeeId } from '../../api/employeeSalaryApi/employeeSalary';
import { downloadPayslipByEmployee } from '../../api/employeeSalaryApi/SalaryProfileApi';
import useExportTds from '../../hooks/reports/useExportTDSApi';
import useGetTDSReportByEmployeeApi from '../../hooks/reports/useGetTDSReportByEmployeeApi';
import useGetTDSReportListApi from '../../hooks/reports/useGetTDSReportListApi';
import { filterState, SalaryProfileTdsDetails } from '../../types/salaryProfileTypes/employeeSalaryTable';
import { TDSReportItem } from '../../types/types';
import { taxRegimeOptions } from '../../utils/general/data';
import useFilter from '../../utils/general/useFilter';
import { monthsArray } from '../../utils/salaryTable/data';
import TDSDetailsDrawer from '../EmployeeSalary/TDSDetailsDrawer';


const TDSTab = () => {
    // const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [openTDSDetailsModal, setOpenTDSDetailsModal] = useState(false);

    const { tdsEmployeeDetails, detailsLoading, getTDSReportByEmployee } =
        useGetTDSReportByEmployeeApi();
    // The same step-by-step TDS breakdown the employee's Salary Profile shows (slabs, 87A
    // rebate / marginal relief, surcharge — each with its worked-calculation tooltip), so
    // both screens explain the tax identically. Falls back to the summary modal when that
    // month has no salary record to build it from.
    const [profileTdsDetails, setProfileTdsDetails] = useState<SalaryProfileTdsDetails | null>(null);
    const [profileTdsLoading, setProfileTdsLoading] = useState(false);
    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();

    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 10,
        filter: '',
        year: initialYear,
        month: initialMonth,
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const [regimeType,setRegimeType] = useState<string>("")
    const { handleSearch, handlePageChange, handleChangeMonth, handleChangeYear } = useFilter({
        setFilter,
    });
    const { tableDatas, tableLoading } = useGetTDSReportListApi(
        filter.month,
        filter.year,
        regimeType
    );
    const {getTDSExcel} = useExportTds()

    const handleOpenDetails = async (selectedRowData: TDSReportItem) => {
        setOpenTDSDetailsModal(true);
        setProfileTdsDetails(null);
        setProfileTdsLoading(true);
        const [salaryDetails] = await Promise.all([
            getSalaryDetailsByEmployeeId({
                userId: id,
                userType: role,
                id: selectedRowData.employeeId,
                month: filter.month,
                year: filter.year,
            }),
            getTDSReportByEmployee(selectedRowData.employeeId, filter.month, filter.year),
        ]);
        setProfileTdsDetails(salaryDetails ? salaryDetails.tdsDetails || null : null);
        setProfileTdsLoading(false);
    };

    const filteredTableData = useMemo(
        () =>
            tableDatas.filter(item =>
                item.name.toLowerCase().includes(filter.searchText.toLowerCase())
            ),
        [filter.searchText, tableDatas]
    );

    const startIndex = (filter.page - 1) * filter.limit;
    const paginatedTableData = filteredTableData.slice(startIndex, startIndex + filter.limit);
    const orderCount = filteredTableData.length;

    const handleDownloadPayslip = async (record: TDSReportItem) => {
        setDownloadingId(record.employeeId);
        const data = await downloadPayslipByEmployee({
            userId: id,
            userType: role,
            employeeId: record.employeeId,
            year: filter.year,
            month: filter.month,
        });
        if (data) {
            const uint8Array = new Uint8Array((data as any).pdfData.data);
            const blob = new Blob([uint8Array], { type: 'application/pdf' });
            saveAs(blob, `Payslip_${record.name}_${filter.month}_${filter.year}.pdf`);
        }
        setDownloadingId(null);
    };

    const handleExport = () => {
    

        getTDSExcel(`${filter.month}`,`${filter.year}`,regimeType)
    };

    const getInitials = (name: string) =>
        name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();

    const tdsColumns: ColumnsType<TDSReportItem> = [
        {
            title: 'Employee Name',
            dataIndex: 'name',
            render: (name: string, record) => (
                <Flex align="center" gap={10}>
                    {record.profileImage ? (
                        <Avatar src={record.profileImage} style={{ backgroundColor: '#fde3cf', color: '#f56a00' }} />
                    ) : (
                        <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                            {getInitials(name)}
                        </Avatar>
                    )}
                    <Typography.Text>{name}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
        },
        {
            title: 'Tax Regime',
            dataIndex: 'taxRegime',
        },
        {
            title: 'TDS Frequency',
            dataIndex: 'tdsFrequency',
        },
        {
            title: 'Taxable Income',
            dataIndex: 'taxableIncome',
            render: value => `₹${Number(value || 0).toLocaleString('en-IN')}`,
        },
        {
            title: 'Exemptions',
            dataIndex: 'exemptions',
            render: value => `₹${Number(value || 0).toLocaleString('en-IN')}`,
        },
        {
            title: 'TDS Deduction',
            dataIndex: 'tdsDeduction',
            render: value => `₹${Number(value || 0).toLocaleString('en-IN')}`,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: TDSReportItem) => (
                <Button
                    type="text"
                    icon={<DownloadOutlined style={{ color: '#ef4444' }} />}
                    loading={downloadingId === record.employeeId}
                    onClick={e => {
                        e.stopPropagation();
                        handleDownloadPayslip(record);
                    }}
                />
            ),
        },
    ];

    return (
        <Row>
            <Flex className="md:mt-8 xs:mt-4 xs:pr-0 md:pr-[15px]">
                <Formik
                    initialValues={{
                        address: '',
                        taxRegime:regimeType
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        setSubmitting(false);
                    }}
                >
                    {({ handleSubmit, setFieldValue }) => (
                        <Form layout="vertical" onFinish={handleSubmit}>
                            <Col className="md:mt-6 xs:mt-4">
                                <SelectInput
                                    name="taxRegime"
                                    options={taxRegimeOptions}
                                    
                                    label={
                                        <Typography.Text className=" text-[#000000] font-normal text-sm">
                                            Select Global Tax Regime
                                        </Typography.Text>
                                    }
                                    handleChange={(value)=>setRegimeType(value)}
                                    placeholder="Select tax regime"
                                />
                            </Col>
                        </Form>
                    )}
                </Formik>
            </Flex>
            <Col span={24}>
                <Col md={24} className="mb-6">
                    {/* <Flex justify="space-between"> */}
                    <Row gutter={[8,16]}>
                        <Col md={15} xs={24} className="mb-1">
                            <Input
                                placeholder="Search employee by name"
                                suffix={<SearchOutlined />}
                                allowClear
                                value={filter.searchText}
                                onChange={e => {
                                    const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                                    handleSearch({ ...e, target: { ...e.target, value } });
                                }}
                            />
                        </Col>
                        <Col md={3}>
                            <Select
                                options={monthsArray}
                                className="w-full"
                                onChange={handleChangeMonth}
                                defaultValue={initialMonth.toString()}
                            />
                        </Col>
                        <Col md={3}>
                            <Select
                                options={yearsData}
                                className="w-full"
                                onChange={handleChangeYear}
                                defaultValue={initialYear}
                            />
                        </Col>
                        <Col md={3}>
                            <Button onClick={handleExport} className="w-full" icon={<DownloadOutlined />}>
                                Export
                            </Button>
                        </Col>
                    </Row>
                </Col>
                <Table
                    className="mt-4"
                    scroll={{ x: 568 }}
                    columns={tdsColumns}
                    dataSource={paginatedTableData}
                    loading={tableLoading}
                    pagination={false}
                    onRow={record => ({
                        onClick: e => {
                            if (!(e.target as HTMLElement).closest('button')) {
                                handleOpenDetails(record as TDSReportItem);
                            }
                        },
                        className: 'cursor-pointer',
                    })}
                />
                <Pagination
                    current={filter.page}
                    onChange={handlePageChange}
                    size="default"
                    className="text-end pt-7"
                    total={orderCount}
                    pageSize={filter.limit}
                />
                {profileTdsLoading || profileTdsDetails ? (
                    <TDSDetailsDrawer
                        open={openTDSDetailsModal}
                        onClose={() => setOpenTDSDetailsModal(false)}
                        details={profileTdsDetails}
                        loading={profileTdsLoading}
                    />
                ) : (
                    <TDSDetailsModal
                        open={openTDSDetailsModal}
                        handleCancel={() => setOpenTDSDetailsModal(false)}
                        selectedRow={tdsEmployeeDetails}
                        loading={detailsLoading}
                    />
                )}
            </Col>
        </Row>
    );
};

export default TDSTab;
