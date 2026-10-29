import React from 'react';

import { Row, Col, Typography } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import useActiveYearsApi from '../../hooks/OrganizationSettings/useActiveYearsApi';

interface Props {
    getIncomeDeclaration: any;
    values: any;
}

const EmployeeAndFinancialYearSelector = ({ getIncomeDeclaration, values }: Props) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { years, errorMessage } = useActiveYearsApi();
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <SelectInputWithSearch
                    name="employee"
                    options={generateEmployeesDropdown(data) || []}
                    placeholder="Select employee"
                    label="Employee name"
                    isRequired
                    disableDeselect
                    handleChange={e => {
                        getIncomeDeclaration({ employee: e, financialYear: values.financialYear });
                    }}
                />
            </Col>
            <Col xs={24} md={12}>
                <SelectInput
                    name="financialYear"
                    options={years?.years || []}
                    label="Select Financial Year"
                    placeholder="Select financial year"
                    handleChange={e => {
                        getIncomeDeclaration({ employee: e, financialYear: values.financialYear });
                    }}
                />
                {errorMessage && (
                    <Typography.Text type="danger" className="block -mt-4">
                        {errorMessage}
                    </Typography.Text>
                )}
            </Col>
        </Row>
    );
};

export default EmployeeAndFinancialYearSelector;
