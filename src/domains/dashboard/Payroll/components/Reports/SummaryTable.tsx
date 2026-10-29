import React from 'react';

import { Table, Typography, Input, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;
const SummaryTable: React.FC = () => {
    const { values, setFieldValue } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const columns = [
        {
            title: <Text style={headerStyle}>Quarter</Text>,
            dataIndex: 'quarter',
            key: 'quarter',
            render: (text: string) => <Text>{text}</Text>,
        },
        {
            // title: "Receipt Numbers of original quarterly statements of TDS under sub-section (3) of Section 200",
            title: (
                <Text style={headerStyle}>
                    Receipt Numbers of original quarterly statements of TDS under sub-section (3) of
                    Section 200
                </Text>
            ),
            key: 'receiptNumber',
            render: (_: any, record: any, index: number) =>
                record.isTotal ? (
                    <Text />
                ) : (
                    <Input
                        placeholder="Enter"
                        value={values.quarterSummary[index]?.receiptNumber}
                        onChange={e =>
                            setFieldValue(`quarterSummary.${index}.receiptNumber`, e.target.value)
                        }
                    />
                ),
        },
        {
            // title: "Amount paid / credited",
            title: <Text style={headerStyle}>Amount paid/credited</Text>,
            key: 'amountPaidCredited',
            render: (_: any, record: any, index: number) => {
                if (record.isTotal) {
                    const total = values.quarterSummary
                        .filter((q: any) => !q.isTotal)
                        .reduce(
                            (sum: number, q: any) => sum + (Number(q.amountPaidCredited) || 0),
                            0
                        );
                    return <Text strong>{total.toFixed(2)}</Text>;
                }
                return (
                    <Input
                        placeholder="Enter"
                        value={values.quarterSummary[index]?.amountPaidCredited}
                        onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val))
                                setFieldValue(
                                    `quarterSummary.${index}.amountPaidCredited`,
                                    val
                                );
                        }}
                    />
                );
            },
        },
        {
            // title: "Amount of tax deducted (Rs.)",
            title: <Text style={headerStyle}>Amount of tax deducted (Rs.) </Text>,
            key: 'taxDeducted',
            render: (_: any, record: any, index: number) => {
                if (record.isTotal) {
                    const total = values.quarterSummary
                        .filter((q: any) => !q.isTotal)
                        .reduce((sum: number, q: any) => sum + (Number(q.taxDeducted) || 0), 0);
                    return <Text strong>{total.toFixed(2)}</Text>;
                }
                return (
                    <Input
                        placeholder="Enter"
                        value={values.quarterSummary[index]?.taxDeducted}
                        onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val))
                                setFieldValue(`quarterSummary.${index}.taxDeducted`, val);
                        }}
                    />
                );
            },
        },
        {
            // title: "Amount of tax deposited / remitted (Rs.)",
            title: <Text style={headerStyle}>Amount of tax deposited / remitted (Rs.) </Text>,
            key: 'taxDeposited',
            render: (_: any, record: any, index: number) => {
                if (record.isTotal) {
                    const total = values.quarterSummary
                        .filter((q: any) => !q.isTotal)
                        .reduce((sum: number, q: any) => sum + (Number(q.taxDeposited) || 0), 0);
                    return <Text strong>{total.toFixed(2)}</Text>;
                }
                return (
                    <Input
                        placeholder="Enter"
                        value={values.quarterSummary[index]?.taxDeposited}
                        onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val))
                                setFieldValue(`quarterSummary.${index}.taxDeposited`, val);
                        }}
                    />
                );
            },
        },
    ];

    // Prepare data with total row
    const tableData = [...values.quarterSummary, { quarter: 'Total (Rs.)', isTotal: true }];

    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="mb-4 text-lg font-semibold md:text-center">
                Summary of amount paid/credited and tax deducted at source thereon in respect of the
                employee
            </Typography.Text>

            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns}
                    dataSource={tableData}
                    pagination={false}
                    rowKey="quarter"
                    bordered
                    scroll={isMobile ? { x: 1100 } : undefined}
                    onRow={(record: any) =>
                        record.isTotal ? { style: { backgroundColor: '#fafafa' } } : {}
                    }
                />
            </div>
        </Flex>
    );
};

export default SummaryTable;
