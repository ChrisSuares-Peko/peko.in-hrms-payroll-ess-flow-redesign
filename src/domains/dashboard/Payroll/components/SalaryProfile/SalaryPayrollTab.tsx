import React, { useState } from 'react';

import { Flex, Typography, Table, Pagination, ConfigProvider, Col, Row, Select } from 'antd';
import { useLocation } from 'react-router-dom';

import DownloadPayslipData from '../../hooks/employeeSalaryHooks/SalaryProfileHooks/useDownloadPayrollSlipApi';
import EmailPayslipData from '../../hooks/employeeSalaryHooks/SalaryProfileHooks/useEmailPayrollSlipApi';
import { useGetEmployeePayrollSlipApi } from '../../hooks/employeeSalaryHooks/SalaryProfileHooks/useGetEmployeePaySlipListApi';
import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';
import useFilter from '../../utils/general/useFilter';
import { payrollColumn } from '../../utils/salaryProfileColumns/Data';
import { yearsArray } from '../../utils/salaryTable/data';

function SalaryPayrollTab() {
    const location = useLocation();
    const { eId, year } = location.state;
    const initialYear = year;

    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 5,
        filter: '',
        year: initialYear,
        month: '',
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handlePageChange, handleChangeYear } = useFilter({
        setFilter,
    });
    const { tableDatas, orderCount, tableLoading } = useGetEmployeePayrollSlipApi(
        eId,
        filter.page,
        filter.limit,
        filter.year
    );

    const { getPayslipDetails, loader } = DownloadPayslipData();

    const handleDownloadPayslip = async (id: string) => {
        await getPayslipDetails(id);
    };
    const { sendEmail, isLoading } = EmailPayslipData();
    const handleEmail = async (id: string) => {
        await sendEmail(id);
    };
    const themeConfig = {
        components: {
            Table: {
                rowHoverBg: 'inherit',
            },
        },
    };
    return (
        <Flex className="p-5" vertical>
            <Flex justify="space-between" align="center">
                <Typography.Text
                    // className="font-normal text-fontSubHeader"
                    // style={{ fontSize: '1.246rem' }}
                    className="me-3 text-textBlack "
                    style={{ fontSize: '0.880rem' }}
                >
                    Payroll Slip
                </Typography.Text>
                <Row gutter={9} className="justify-between xs:mt-10 md:mt-0">
                    <Col className="md:w-40">
                        <Select
                            options={yearsArray}
                            className="w-full"
                            onChange={handleChangeYear}
                            defaultValue={initialYear}
                        />
                    </Col>
                </Row>
            </Flex>

            <ConfigProvider theme={themeConfig}>
                <Table
                    className="mt-10"
                    columns={payrollColumn(handleDownloadPayslip, handleEmail)}
                    dataSource={tableDatas}
                    size="small"
                    scroll={{ x: 568 }}
                    pagination={false}
                    loading={isLoading || loader || tableLoading}
                />
            </ConfigProvider>
            {orderCount! > 0 && (
                <Pagination
                    current={filter.page}
                    size="default"
                    className="text-end pt-7"
                    total={orderCount}
                    onChange={handlePageChange}
                    pageSize={5}
                />
            )}
        </Flex>
    );
}
export default SalaryPayrollTab;
