import React, { useEffect, useState } from 'react';

import { Table, Typography, Input, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    values?: any;
    onChange?: (data: any[], total: number) => void;
    fieldName?: string;
};

type FormikFormValues = Record<string, Record<string, unknown> | undefined>;

const DeductionUnderSec16: React.FC<Props> = ({
    values,
    onChange,
    fieldName = 'deductions16',
}) => {
    const { setFieldValue, values: fieldValues } = useFormikContext<FormikFormValues>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    // Initialize state for table data
    const [data] = useState([
        { key: '1', Component: 'Standard Deduction', amountPaid: 'standardDeduction' },
        { key: '2', Component: 'Entertainment Allowance', amountPaid: 'entertainmentAllowance' },
        { key: '3', Component: 'Tax on Employment (Professional Tax)', amountPaid: 'professionalTax' },
        { key: 'X', Component: 'Total (Rs.)', amountPaid: 'total' },
    ]);

    // Handle input change
    const handleChange = (value: string, key: string) => {
        console.log(fieldValues)
        const currentGroup = (fieldValues?.[fieldName] ?? {}) as Record<string, unknown>;
        const filteredValues = Object.entries({
            ...currentGroup,
            [key]: value,
        })
            .filter(([k]) => k !== 'total').filter(([k]) => k!=="_id")
            .map(([, v]) => parseFloat(v as string) || 0);
        const sum = filteredValues.reduce((acc, v) => acc + v, 0);
        setFieldValue(fieldName, {
            ...currentGroup,
            [key]:value,
            total: sum
        });
    };

    const getCurrentGroup = () => (fieldValues?.[fieldName] ?? {}) as Record<string, unknown>;
    const getGroupString = (k: string) => {
        const v = getCurrentGroup()[k];
        return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
    };

    // Calculate total dynamically (exclude the "Total" row itself)
    const total = data
        .filter(row => !(row.Component || '').toLowerCase().includes('total'))
        .reduce((sum, row) => sum + (parseFloat(row.amountPaid) || 0), 0);

    const columns = [
        {
            title: <Text style={headerStyle}>Component</Text>,
            dataIndex: 'Component',
            key: 'component',
            render: (text: string) => <Text>{text}</Text>,
        },
        {
            title: <Text style={headerStyle}>Amount (₹)</Text>,
            dataIndex: 'amountPaid',
            key: 'amountPaid',
            render: (_: any, record: any) =>
                (record.Component || '').toLowerCase().includes('total') ? (
                    <Text strong>{getGroupString(record.amountPaid)}</Text>
                ) : (
                    <Input
                        placeholder="Enter"
                        value={getGroupString(record.amountPaid)}
                        onKeyDown={e => { if (e.key.length === 1 && !/[0-9.]/.test(e.key)) e.preventDefault(); }}
                        onChange={e => handleChange(e.target.value, record.amountPaid)}
                    />
                ),
        },
    ];

    useEffect(() => {
        setFieldValue(fieldName, {
            standardDeduction: data[0]?.amountPaid || '',
            entertainmentAllowance: data[1]?.amountPaid || '',
            professionalTax: data[2]?.amountPaid || '',
            total,
        });

        onChange?.(data, total);
    }, [data, total, fieldName, onChange, setFieldValue]);

    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="font-semibold text-lg mb-5 text-left">
                2. Deductions under Section 16
            </Typography.Text>
            <style>{`.total-row td { background-color: #fafafa !important; }`}</style>
            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                    bordered
                    scroll={isMobile ? { x: 780 } : undefined}
                    rowClassName={record => (record.Component || '').toLowerCase().includes('total') ? 'total-row' : ''}
                />
            </div>
        </Flex>
    );
};

export default DeductionUnderSec16;
