import React from 'react';

import { Table, Typography, Input, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    onChange?: (data: any[]) => void;
    fieldName?: string;
};

const QuarterlyTDS: React.FC<Props> = ({ onChange, fieldName = 'quarterSummary' }: any) => {
    const { setFieldValue,values } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const quarterData: any[] = values?.[fieldName] || [];

    const totals = {
        amountPaidCredited: quarterData.reduce((acc: number, row: any) => acc + (parseFloat(row.amountPaidCredited) || 0), 0),
        taxDeducted: quarterData.reduce((acc: number, row: any) => acc + (parseFloat(row.taxDeducted) || 0), 0),
        taxDeposited: quarterData.reduce((acc: number, row: any) => acc + (parseFloat(row.taxDeposited) || 0), 0),
    };

    const blockNonNumeric = (e: React.KeyboardEvent) => {
        if (e.key.length === 1 && !/[0-9.]/.test(e.key)) e.preventDefault();
    };

    const handleChange = (value: string, key: string, field: string) => {
        const newData = quarterData.map((row: any) =>
            row.quarter === key ? { ...row, [field]: value } : row
        );
        setFieldValue(fieldName, newData);
        onChange?.(newData);
    };

    const columns = [
        {
            title: 'Quarter',
            dataIndex: 'quarter',
            key: 'quarter',
        },
        {
            title: <Text style={headerStyle}>Receipt Number of 24Q</Text>,
            dataIndex: 'receiptNumber24Q',
            key: 'receiptNumber24Q',
            render: (_: string, record: any) =>
                record?.key?.toLowerCase().includes('total') ? (
                    <Text strong>{}</Text>
                ) : (
                    <Input
                        placeholder="Enter"
                        value={record.receiptNumber24Q}
                        onChange={e => handleChange(e.target.value, record.quarter, 'receiptNumber24Q')}
                    />
                ),
        },
        {
            title: <Text style={headerStyle}>Amount paid/credited</Text>,
            dataIndex: 'amountPaidCredited',
            key: 'amountPaidCredited',
            render: (_: string, record: any) =>
                record?.key?.toLowerCase().includes('total') ? (
                    <Text strong>{totals.amountPaidCredited.toFixed(2)}</Text>
                ) : (
                    <Input
                        placeholder="Enter"
                        value={record.amountPaidCredited}
                        onKeyDown={blockNonNumeric}
                        onChange={e => handleChange(e.target.value, record.quarter, 'amountPaidCredited')}
                    />
                ),
        },
        {
            title: <Text style={headerStyle}>Amount of tax deducted (Rs.)</Text>,
            dataIndex: 'taxDeducted',
            key: 'taxDeducted',
            render: (_: string, record: any) =>
                record?.key?.toLowerCase().includes('total') ? (
                    <Text strong>{totals.taxDeducted.toFixed(2)}</Text>
                ) : (
                    <Input
                        placeholder="Enter"
                        value={record.taxDeducted}
                        onKeyDown={blockNonNumeric}
                        onChange={e => handleChange(e.target.value, record.quarter, 'taxDeducted')}
                    />
                ),
        },
        {
            title: <Text style={headerStyle}>Amount of tax deposited / remitted (Rs.)</Text>,
            dataIndex: 'taxDeposited',
            key: 'taxDeposited',
            render: (_: string, record: any) =>
                record?.key?.toLowerCase().includes('total') ? (
                    <Text strong>{totals.taxDeposited.toFixed(2)}</Text>
                ) : (
                    <Input
                        placeholder="Enter"
                        value={record.taxDeposited}
                        onKeyDown={blockNonNumeric}
                        onChange={e => handleChange(e.target.value, record.quarter, 'taxDeposited')}
                    />
                ),
        },
    ];

    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="font-semibold text-lg text-left">
                9. Quarterly TDS Summary
            </Typography.Text>
            <style>{`.total-row td { background-color: #fafafa !important; }`}</style>
            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns}
                    dataSource={[
                        ...quarterData,
                        {
                            key: 'Total (Rs.)',
                            quarter: 'Total (Rs.)',
                            receiptNumber: '',
                            amountPaidCredited: (
                                <Text strong>{totals.amountPaidCredited.toFixed(2)}</Text>
                            ),
                            taxDeducted: <Text strong>{totals.taxDeducted.toFixed(2)}</Text>,
                            taxDeposited: <Text strong>{totals.taxDeposited.toFixed(2)}</Text>,
                        },
                    ]}
                    pagination={false}
                    bordered
                    scroll={isMobile ? { x: 1200 } : undefined}
                    rowClassName={record => (record.key || '').toLowerCase().includes('total') ? 'total-row' : ''}
                />
            </div>
        </Flex>
    );
};

export default QuarterlyTDS;
