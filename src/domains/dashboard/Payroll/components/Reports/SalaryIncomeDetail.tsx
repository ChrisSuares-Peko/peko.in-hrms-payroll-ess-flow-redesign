import React from 'react';

import { Table, Typography, Input, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

const SalaryIncomeDetail: React.FC = () => {
    const { values, setFieldValue } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const handleChange = (field: string, value: string) => {
        const numericValue = value.replace(/[^\d]/g, '');
        setFieldValue(`salaryIncome.${field}`, numericValue);
        const updated = { ...values.salaryIncome, [field]: numericValue };
        const total =
            (Number(updated.grossSalary) || 0) +
            (Number(updated.perquisitesValue) || 0) +
            (Number(updated.profitsInLieu) || 0);
        setFieldValue('salaryIncome.total', total);
    };
    const data = [
        {
            key: '1',
            Component: 'Gross Salary (basic, allowances)',
            field: 'grossSalary',
            amountPaid: values.salaryIncome.grossSalary,
        },
        {
            key: '2',
            Component: 'Value of Perquisites u/s 17(2)',
            field: 'perquisitesValue',
            amountPaid: values.salaryIncome.perquisitesValue,
        },
        {
            key: '3',
            Component: 'Profits in lieu of salary u/s 17(3)',
            field: 'profitsInLieu',
            amountPaid: values.salaryIncome.profitsInLieu,
        },
        {
            key: '4',
            Component: 'Total (Rs.)',
            field: 'total',
            amountPaid: values.salaryIncome.total,
        },
    ];

    const columns = [
        {
            title: <Text style={headerStyle}>Component</Text>,
            dataIndex: 'Component',
        },
        {
            title: <Text style={headerStyle}>Amount (₹)</Text>,
            render: (_: any, record: any) =>
                record.field === 'total' ? (
                    <Text strong>{values.salaryIncome.total}</Text>
                ) : (
                    <Input
                        placeholder="Enter"
                        value={record.amountPaid}
                        onChange={e => handleChange(record.field, e.target.value)}
                    />
                ),
        },
    ];
    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="font-semibold text-lg mb-5 text-left">
                1. Salary & Income Details
            </Typography.Text>
            <style>{`.total-row td { background-color: #fafafa !important; }`}</style>
            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                    bordered
                    scroll={isMobile ? { x: 780 } : undefined}
                    rowClassName={record => (record.field === 'total' ? 'total-row' : '')}
                />
            </div>
        </Flex>
    );
};

export default SalaryIncomeDetail;
