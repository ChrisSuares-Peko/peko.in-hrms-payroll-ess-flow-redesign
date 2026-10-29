import React, { useState } from 'react';

import { Table, Typography, Input, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    onChange?: (data: any[], total: number) => void;
    fieldName?: string;
};

const OtherIncomeReportedByEmpl: React.FC<Props> = ({
    onChange,
    fieldName = 'otherIncome',
}: any) => {
    const { setFieldValue,values } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    // Initialize state for table data
    const [data] = useState([
        { key: '1', Component: 'Interest Income', amountPaid: 'interestIncome' },
        { key: '2', Component: 'Other sources', amountPaid: 'otherSources' },
        { key: 'X', Component: 'Total (Rs.)', amountPaid: 'total' }, // key can vary
    ]);

    // Handle input change
    const handleChange = (value: string, key: string) => {
        const currentGroup = (values?.[fieldName] ?? {}) as Record<string, unknown>;
        // Fix for incorrect calculation: ensure summing only actual values, not keys or indices
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

    const getCurrentGroup = () => (values?.[fieldName] ?? {}) as Record<string, unknown>;
    const getGroupString = (k: string) => {
        const v = getCurrentGroup()[k];
        return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
    };

    // useEffect(() => {
    //     setFieldValue(fieldName, {
    //         interestIncome: data[0]?.amountPaid || '',
    //         otherSources: data[1]?.amountPaid || '',
    //         total,
    //     });

    //     onChange?.(data, total);
    // }, [data, total, fieldName, onChange, setFieldValue]);

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

    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="font-semibold text-lg mb-5 text-left">
                4. Other Income Reported by Employee
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

export default OtherIncomeReportedByEmpl;
