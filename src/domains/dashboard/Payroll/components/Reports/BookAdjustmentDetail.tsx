import React, { useState, useEffect } from 'react';

import { Table, Typography, Input, Flex, DatePicker, Grid } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    onChange?: (data: any[]) => void;
    fieldName?: string;
};

const BookAdjustment: React.FC<Props> = ({ onChange, fieldName = 'bookAdjustments' }: any) => {
    const { setFieldValue,values } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const [rows, setRows] = useState([
        {
            key: '1',
            serialNo: 1,
            receiptNumber24G: '',
            ddoSerialNo24G: '',
            transferVoucherDate: '',
            matchingStatus: '',
        },
    ]);

    // Keep Formik and parent in sync when rows change
    useEffect(() => {
        const data = (values?.[fieldName] || []) as any
        setRows(data.map((x:any,i:any)=>({...x,key:i+1})))
    }, [fieldName, values]);

    const handleChange = (value: string, key: string, field: string) => {
        setRows(prevRows =>
            prevRows.map(row => (row.key === key ? { ...row, [field]: value } : row))
        );

        // Format and send to Formik immediately
        const newRows = rows.map(row => (row.key === key ? { ...row, [field]: value } : row));

        const formattedData = newRows.map(row => ({
            serialNo: parseInt(row.key, 10),
            receiptNumber24G: row.receiptNumber24G,
            ddoSerialNo24G: row.ddoSerialNo24G,
            transferVoucherDate: row.transferVoucherDate,
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
            title: 'Book Identification Number (BIN)',
            children: [
                {
                    title: <Text style={headerStyle}>Receipt Numbers of Form No. 24G</Text>,
                    dataIndex: 'receiptNumber24G',
                    key: 'receiptNumber24G',
                    render: (_: string, record: any) => (
                        <Input
                            placeholder="Enter"
                            value={record.receiptNumber24G}
                            onChange={e =>
                                handleChange(e.target.value, record.key, 'receiptNumber24G')
                            }
                        />
                    ),
                },
                {
                    title: <Text style={headerStyle}>DDO serial number in Form no. 24G</Text>,
                    dataIndex: 'ddoSerialNo24G',
                    key: 'ddoSerialNo24G',
                    render: (_: string, record: any) => (
                        <Input
                            placeholder="Enter"
                            value={record.ddoSerialNo24G}
                            onChange={e =>
                                handleChange(e.target.value, record.key, 'ddoSerialNo24G')
                            }
                        />
                    ),
                },
                {
                    title: <Text style={headerStyle}>Date of transfer voucher (dd/mm/yyyy)</Text>,
                    dataIndex: 'transferVoucherDate',
                    key: 'transferVoucherDate',
                    render: (_: string, record: any) => (
                        <DatePicker
                            className="w-full"
                            value={
                                record.transferVoucherDate
                                    ? dayjs(record.transferVoucherDate, 'YYYY-MM-DD')
                                    : null
                            }
                            format="DD/MM/YYYY"
                            onChange={date =>
                                handleChange(
                                    date ? date.format('YYYY-MM-DD') : '',
                                    record.key,
                                    'transferVoucherDate'
                                )
                            }
                        />
                    ),
                },
                {
                    title: <Text style={headerStyle}>Status of matching with Form no. 24G</Text>,
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
                10. Book Adjustment Details
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

export default BookAdjustment;
