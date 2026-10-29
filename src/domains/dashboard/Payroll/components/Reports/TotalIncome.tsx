import React from 'react';

import { Table, Typography, Input, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;
type Props = {
    onChange?: (data: any) => void;
    fieldName?: string;
};

const TotalIncome: React.FC<Props> = ({ onChange, fieldName = 'totalIncome' }) => {
    const headerStyle = { color: '#42526D', fontWeight: 600 };
    const { setFieldValue,values } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const row = values?.[fieldName] ?? {};

    const blockNonNumeric = (e: React.KeyboardEvent) => {
        if (e.key.length === 1 && !/[0-9.]/.test(e.key)) e.preventDefault();
    };

    const handleChange = (value: string, field: string) => {
        const updatedRow = { ...row, [field]: value };
        const totalIncome =
            (parseFloat(updatedRow.grossIncome) || 0) -
            (parseFloat(updatedRow.totalDeduction) || 0);
        setFieldValue(fieldName, { ...updatedRow, totalIncome });
        onChange?.({ ...updatedRow, totalIncome });
    };

    const totalIncomeChargable =
        (parseFloat(row.grossIncome) || 0) - (parseFloat(row.totalDeduction) || 0);

    const columns = [
        {
            title: <Text style={headerStyle}>Gross Total Income (5)</Text>,
            dataIndex: 'grossIncome',
            key: 'grossIncome',
            render: (_: string, record: any) => (
                <Input
                    placeholder="Enter"
                    value={record.grossIncome}
                    onKeyDown={blockNonNumeric}
                    onChange={e => handleChange(e.target.value, 'grossIncome')}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Total Deductions (6)</Text>,
            dataIndex: 'totalDeduction',
            key: 'totalDeduction',
            render: (_: string, record: any) => (
                <Input
                    placeholder="Enter"
                    value={record.totalDeduction}
                    onKeyDown={blockNonNumeric}
                    onChange={e => handleChange(e.target.value, 'totalDeduction')}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Total Income (Formula: 5 – 6)</Text>,
            dataIndex: 'totalIncome',
            key: 'totalIncome',
            render: () => <Text strong>{totalIncomeChargable || ''}</Text>,
        },
    ];

    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="font-semibold text-lg text-left">
                7. Total Income
                <p>
                    <Typography.Text className="font-light">Formula: (5 – 6)</Typography.Text>
                </p>
            </Typography.Text>
            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns}
                    dataSource={[{ ...row, key: '1' }]}
                    pagination={false}
                    bordered
                    scroll={isMobile ? { x: 920 } : undefined}
                />
            </div>
        </Flex>
    );
};

export default TotalIncome;
