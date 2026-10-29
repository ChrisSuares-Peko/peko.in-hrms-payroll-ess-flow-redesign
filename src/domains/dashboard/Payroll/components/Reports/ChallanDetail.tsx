import React, { useState, useEffect } from 'react';

import { Table, Typography, Input, Flex, DatePicker, Grid } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    onChange?: (data: any[]) => void;
    fieldName?: string;
};

const ChallanDetail: React.FC<Props> = ({ onChange, fieldName = 'challans' }: any) => {
    const { setFieldValue,values } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const [rows, setRows] = useState([
        {
            key: '1',
            serialNo: 1,
            bsrCode: '',
            taxDepositedDate: '',
            challanSerialNo: '',
            matchingStatus: '',
        },
    ]);

    useEffect(() => {
        setRows(values?.[fieldName]?.map((x: any, i: any) => ({ ...x, key: i + 1 })) || []);
    }, [fieldName, values]);

    const handleChange = (value: string, key: string, field: string) => {
        setRows(prevRows =>
            prevRows.map(row => (row.key === key ? { ...row, [field]: value } : row))
        );

        // Format and send to Formik immediately
        const newRows = rows.map(row => (row.key === key ? { ...row, [field]: value } : row));

        const formattedData = newRows.map(row => ({
            serialNo: parseInt(row.key, 10),
            bsrCode: row.bsrCode,
            taxDepositedDate: row.taxDepositedDate,
            challanSerialNo: row.challanSerialNo,
            matchingStatus: row.matchingStatus,
        }));

        setFieldValue(fieldName, formattedData);

        onChange?.(formattedData);
    };

    const columns = [
        {
            title: 'Sl. No.',
            dataIndex: 'key',
            key: 'key',
            width: 80,
        },
        {
            title: 'Challan Identification Number (CIN)',
            children: [
                {
                    title: <Text style={headerStyle}>BSR Code of the Bank Branch</Text>,
                    dataIndex: 'bsrCode',
                    key: 'bsrCode',
                    render: (_: string, record: any) => (
                        <Input
                            placeholder="Enter"
                            value={record.bsrCode}
                            onChange={e => handleChange(e.target.value, record.key, 'bsrCode')}
                        />
                    ),
                },
                {
                    title: (
                        <Text style={headerStyle}>Date on which Tax deposited (dd/mm/yyyy)</Text>
                    ),
                    dataIndex: 'taxDepositedDate',
                    key: 'taxDepositedDate',
                    render: (_: string, record: any) => (
                        <DatePicker
                            className="w-full"
                            value={
                                record.taxDepositedDate
                                    ? dayjs(record.taxDepositedDate, 'YYYY-MM-DD')
                                    : null
                            }
                            format="DD/MM/YYYY"
                            onChange={date =>
                                handleChange(
                                    date ? date.format('YYYY-MM-DD') : '',
                                    record.key,
                                    'taxDepositedDate'
                                )
                            }
                        />
                    ),
                },
                {
                    title: <Text style={headerStyle}>Challan Serial Number</Text>,
                    dataIndex: 'challanSerialNo',
                    key: 'challanSerialNo',
                    render: (_: string, record: any) => (
                        <Input
                            placeholder="Enter"
                            value={record.challanSerialNo}
                            onChange={e =>
                                handleChange(e.target.value, record.key, 'challanSerialNo')
                            }
                        />
                    ),
                },
                {
                    title: <Text style={headerStyle}>Status of matching with OLTAS</Text>,
                    dataIndex: 'matchingStatus',
                    key: 'matchingStatus',
                    render: (_: string, record: any) => (
                        <Input
                            placeholder="Enter"
                            value={record.matchingStatus}
                            onChange={e =>
                                handleChange(e.target.value, record.key, 'matchingStatus')
                            }
                        />
                    ),
                },
            ],
        },
    ];

    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="font-semibold text-lg text-left">
                11. Challan Details
            </Typography.Text>
            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns}
                    dataSource={rows}
                    pagination={false}
                    bordered
                    scroll={isMobile ? { x: 1200 } : undefined}
                />
            </div>
        </Flex>
    );
};

export default ChallanDetail;
