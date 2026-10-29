import React from 'react';

import { Table, Typography, Input, Flex, DatePicker, Button, Col, Grid } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext, FieldArray } from 'formik';

const { Text } = Typography;
const BookAdjustmentSection: React.FC = () => {
    const { values, setFieldValue } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const columns = () => [
        {
            title: <Typography.Text style={headerStyle}>Sl. No.</Typography.Text>,
            dataIndex: 'serialNo',
            render: (_: any, record: any, index: any) => (
                <Input
                    value={values.bookAdjustments[index].serialNo}
                    onChange={e =>
                        setFieldValue(`bookAdjustments.${index}.serialNo`, e.target.value)
                    }
                />
            )
        },
        {
            title: (
                <Typography.Text style={headerStyle}>
                    Tax Deposited in respect of the deductee (Rs.)
                </Typography.Text>
            ),
            dataIndex: 'taxDeposited',
            render: (_: any, record: any, index: any) => (
                <Input
                    value={values.bookAdjustments[index].taxDeposited}
                    onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val))
                            setFieldValue(`bookAdjustments.${index}.taxDeposited`, val);
                    }}
                />
            ),
        },
        {
            title: (
                <Typography.Text style={headerStyle}>
                    Book Identification Number (BIN)
                </Typography.Text>
            ),
            children: [
                {
                    title: (
                        <Typography.Text style={headerStyle}>
                            Receipt Numbers of Form No. 24G
                        </Typography.Text>
                    ),
                    dataIndex: 'receiptNumber24G',
                    render: (_: any, record: any, index: any) => (
                        <Input
                            placeholder="Enter (max 15 chars)"
                            value={values.bookAdjustments[index].receiptNumber24G}
                            maxLength={15}
                            onChange={e => {
                                const val = e.target.value.toUpperCase();
                                if (val === '' || /^[A-Z0-9]{0,15}$/.test(val))
                                    setFieldValue(`bookAdjustments.${index}.receiptNumber24G`, val);
                            }}
                        />
                    ),
                },
                {
                    title: (
                        <Typography.Text style={headerStyle}>
                            DDO serial number in Form no. 24G
                        </Typography.Text>
                    ),
                    dataIndex: 'ddoSerialNo24G',
                    render: (_: any, record: any, index: any) => (
                        <Input
                            placeholder="Enter 5-digit number"
                            value={values.bookAdjustments[index].ddoSerialNo24G}
                            maxLength={5}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === '' || /^\d{0,5}$/.test(val))
                                    setFieldValue(`bookAdjustments.${index}.ddoSerialNo24G`, val);
                            }}
                            status={values.bookAdjustments[index].ddoSerialNo24G && values.bookAdjustments[index].ddoSerialNo24G.length !== 5 ? 'error' : ''}
                        />
                    ),
                },
                {
                    title: (
                        <Typography.Text style={headerStyle}>
                            Date of transfer voucher (dd/mm/yyyy)
                        </Typography.Text>
                    ),
                    dataIndex: 'transferVoucherDate',
                    render: (_: any, record: any, index: any) => (
                        <DatePicker
                            className="w-full"
                            value={
                                values.bookAdjustments[index].transferVoucherDate
                                    ? dayjs(values.bookAdjustments[index].transferVoucherDate, 'YYYY-MM-DD')
                                    : null
                            }
                            format="DD/MM/YYYY"
                            onChange={date =>
                                setFieldValue(
                                    `bookAdjustments.${index}.transferVoucherDate`,
                                    date ? date.format('YYYY-MM-DD') : ''
                                )
                            }
                        />
                    ),
                },
            ],
        },
        {
            title: (
                <Typography.Text style={headerStyle}>
                    Status of matching with Form no. 24G
                </Typography.Text>
            ),
            dataIndex: 'form24GMatchingStatus',
            render: (_: any, record: any, index: any) => (
                <Input
                    value={values.bookAdjustments[index].form24GMatchingStatus}
                    onChange={e =>
                        setFieldValue(
                            `bookAdjustments.${index}.form24GMatchingStatus`,
                            e.target.value
                        )
                    }
                />
            ),
        },
    ];

    return (
        <Flex vertical className="mt-6">
            <Typography.Title level={5}>
                I. DETAILS OF TAX DEDUCTED AND DEPOSITED IN THE CENTRAL GOVERNMENT ACCOUNT THROUGH
                BOOK ADJUSTMENT (optional)
            </Typography.Title>
            <Text type="secondary" className="block mb-3">
                (The deductor to provide payment wise details of tax deducted and deposited with
                respect to the deductee)
            </Text>
            <FieldArray
                name="bookAdjustments"
                render={() =>
                    <div className="w-full overflow-x-auto md:overflow-x-visible">
                        <Table
                            columns={columns()}
                            dataSource={values.bookAdjustments}
                            pagination={false}
                            bordered
                            scroll={isMobile ? { x: 1250 } : undefined}
                        />
                    </div>
                }
            />
            <Col>
                <Button
                    type="default"
                    className="px-2 mt-1"
                    danger
                    onClick={() =>
                        setFieldValue('bookAdjustments', [
                            ...values.bookAdjustments,
                            {
                                serialNo: (values.bookAdjustments?.length ?? 0) + 1,
                                taxDeposited: '',
                                receiptNumber24G: '',
                                ddoSerialNo24G: '',
                                transferVoucherDate: '',
                                form24GMatchingStatus: '',
                            },
                        ])
                    }
                >
                    + Add New Row
                </Button>
            </Col>
        </Flex>
    );
};

export default BookAdjustmentSection;
