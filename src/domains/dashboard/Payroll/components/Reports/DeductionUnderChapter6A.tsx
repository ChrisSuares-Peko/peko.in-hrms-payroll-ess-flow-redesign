import React, { useEffect, useState } from 'react';

import { Table, Typography, Input, Button, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    onChange?: (data: any[], total: number) => void;
    fieldName?: string;
};

const DeductionUnderChapter6A: React.FC<Props> = ({ onChange, fieldName = 'chapterVia' }: any) => {
    const { setFieldValue,values } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    // Initial table data
    const [data, setData] = useState([
        { key: '1', section: '80C', description: 'LIC, PPF, ELSS, etc.', amount: '' },
        { key: '2', section: '80D', description: 'Medical Insurance', amount: '' },
        { key: '3', section: '80E', description: 'Education Loan', amount: '' },
        { key: '4', section: '80G', description: 'Donations', amount: '' },
        { key: '5', section: '80CCD(1B)', description: 'NPS', amount: '' },
    ]);

    // Add new row
    const addRow = () => {
        const newRow = {
            key: (data.length + 1).toString(),
            section: '',
            description: '',
            amount: '',
        };
        const newData = [...data, newRow];
        setData(newData);

        // Extract data without key for Formik
        const formattedData = newData.map(row => ({
            section: row.section,
            description: row.description,
            amount: parseFloat(row.amount) || 0,
        }));

        setFieldValue(fieldName, formattedData);

        onChange?.(formattedData, totalDeduction);
    };

    // Calculate total deduction
    const totalDeduction = data.reduce((sum, row) => {
        const value = parseFloat(row.amount);
        return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);

    // Keep Formik and parent in sync when data changes
    useEffect(() => {
        // Extract data without key for Formik
        const formattedData = values?.[fieldName];

        setFieldValue(fieldName, formattedData);
        setData(formattedData)
        onChange?.(formattedData, totalDeduction);
    }, [fieldName, onChange, setFieldValue, totalDeduction, values]);

    const columns = [
        {
            title: <Text style={headerStyle}>Section</Text>,
            dataIndex: 'section',
            key: 'section',
            render: (text: string, _: any, index: number) => (
                <Input
                    value={text}
                    placeholder="Enter"
                    onChange={e => {
                        const newData = [...data];
                        newData[index].section = e.target.value;
                        setData(newData);

                        const formattedData = newData.map(row => ({
                            section: row.section,
                            description: row.description,
                            amount: parseFloat(row.amount) || 0,
                        }));

                        const total = newData.reduce((sum, row) => {
                            const value = parseFloat(row.amount);
                            return sum + (Number.isNaN(value) ? 0 : value);
                        }, 0);

                        setFieldValue(fieldName, formattedData);

                        onChange?.(formattedData, total);
                    }}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Description</Text>,
            dataIndex: 'description',
            key: 'description',
            render: (text: string, _: any, index: number) => (
                <Input
                    value={text}
                    placeholder="Enter"
                    onChange={e => {
                        const newData = [...data];
                        newData[index].description = e.target.value;
                        setData(newData);

                        const formattedData = newData.map(row => ({
                            section: row.section,
                            description: row.description,
                            amount: parseFloat(row.amount) || 0,
                        }));

                        const total = newData.reduce((sum, row) => {
                            const value = parseFloat(row.amount);
                            return sum + (Number.isNaN(value) ? 0 : value);
                        }, 0);

                        setFieldValue(fieldName, formattedData);

                        onChange?.(formattedData, total);
                    }}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Amount (₹)</Text>,
            dataIndex: 'amount',
            key: 'amount',
            render: (text: string, _: any, index: number) => (
                <Input
                    value={text}
                    placeholder="Enter"
                    onKeyDown={e => { if (e.key.length === 1 && !/[0-9.]/.test(e.key)) e.preventDefault(); }}
                    onChange={e => {
                        const newData = [...data];
                        newData[index].amount = e.target.value;
                        setData(newData);

                        const formattedData = newData.map(row => ({
                            section: row.section,
                            description: row.description,
                            amount: row.amount,
                        }));

                        const total = newData.reduce((sum, row) => {
                            const value = parseFloat(row.amount);
                            return sum + (Number.isNaN(value) ? 0 : value);
                        }, 0);

                        setFieldValue(fieldName, formattedData);

                        onChange?.(formattedData, total);
                    }}
                />
            ),
        },
    ];

    return (
        <Flex vertical className="mt-6">
            <Flex justify="space-between" align="center" wrap="wrap" gap={8} className="mt-6">
                <Typography.Text className="font-semibold text-lg mb-5 text-left">
                    6. Deductions under Chapter VI-A
                </Typography.Text>

                <Button type="link" danger className="px-0" onClick={addRow}>
                    + Add New Row
                </Button>
            </Flex>

            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    dataSource={data}
                    columns={columns}
                    pagination={false}
                    scroll={isMobile ? { x: 980 } : undefined}
                    footer={() => (
                        <div className="flex items-center justify-between font-semibold">
                            <span>Total Deductions (₹)</span>
                            <span>{totalDeduction}</span>
                        </div>
                    )}
                />
            </div>
        </Flex>
    );
};
export default DeductionUnderChapter6A;
