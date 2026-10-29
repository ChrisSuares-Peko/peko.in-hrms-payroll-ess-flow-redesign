import React from 'react';

import {
    Table,
    Typography,
    Input,
    Flex,
    Button,
    DatePicker,
    TableColumnsType,
    Grid,
    Col,
} from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

const { Text } = Typography;

const ChallanDetailsSection: React.FC = () => {
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const { values, setFieldValue } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const { challans } = values;

    const tableData = challans.map((item: any, index: number) => ({
        ...item,
        key: index,
    }));

    const updateRow = (index: number, field: string, value: string) => {
        const updated = [...challans];
        updated[index][field] = value;
        setFieldValue('challans', updated);
    };

    const handleAdd = () => {
        const newRow = {
            serialNo: challans.length + 1,
            taxDeposited: '',
            bsrCode: '',
            taxDepositedDate: '',
            challanSerialNo: '',
            oltasMatchingStatus: '',
        };

        setFieldValue('challans', [...challans, newRow]);
    };

    const columns:TableColumnsType = [
        {
            title: <Text style={headerStyle}>Sl. No.</Text>,
            dataIndex: 'serialNo',
            key: 'serialNo',
            render: (_: any, record: any, index: number) => (
                <Input
                    placeholder="Enter"
                    value={record.serialNo}
                    onChange={e => updateRow(index, 'serialNo', e.target.value)}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Challan Identification Number (CIN)</Text>,
            children:[
{
            title: <Text style={headerStyle}>Tax Deposited in respect of the deductee (Rs.)</Text>,
            dataIndex: 'taxDeposited',
            key: 'taxDeposited',
            render: (_: any, record: any, index: number) => (
                <Input
                    placeholder="Enter"
                    value={record.taxDeposited}
                    onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val))
                            updateRow(index, 'taxDeposited', val);
                    }}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>BSR Code of the Bank Branch</Text>,
            dataIndex: 'bsrCode',
            key: 'bsrCode',
            render: (_: any, record: any, index: number) => (
                <Input
                    placeholder="Enter 7-digit BSR code"
                    value={record.bsrCode}
                    maxLength={7}
                    onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d{0,7}$/.test(val))
                            updateRow(index, 'bsrCode', val);
                    }}
                    status={record.bsrCode && record.bsrCode.length !== 7 ? 'error' : ''}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Date on which Tax deposited (dd/mm/yyyy)</Text>,
            dataIndex: 'taxDepositedDate',
            key: 'taxDepositedDate',
            render: (_: any, record: any, index: number) => (
                <DatePicker
                    style={{ width: '100%' }}
                    value={
                        record.taxDepositedDate
                            ? dayjs(record.taxDepositedDate, 'YYYY-MM-DD')
                            : null
                    }
                    format="DD/MM/YYYY"
                    onChange={date =>
                        updateRow(index, 'taxDepositedDate', date ? date.format('YYYY-MM-DD') : '')
                    }
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Challan Serial Number</Text>,
            dataIndex: 'challanSerialNo',
            key: 'challanSerialNo',
            render: (_: any, record: any, index: number) => (
                <Input
                    placeholder="Enter 5-digit number"
                    value={record.challanSerialNo}
                    maxLength={5}
                    onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d{0,5}$/.test(val))
                            updateRow(index, 'challanSerialNo', val);
                    }}
                    status={record.challanSerialNo && record.challanSerialNo.length !== 5 ? 'error' : ''}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Status of matching with OLTAS*</Text>,
            dataIndex: 'oltasMatchingStatus',
            key: 'oltasMatchingStatus',
            render: (_: any, record: any, index: number) => (
                <Input
                    placeholder="Enter"
                    value={record.oltasMatchingStatus}
                    onChange={e => updateRow(index, 'oltasMatchingStatus', e.target.value)}
                />
            ),
        },
            ]
        },
        
    ];

    return (
        <Flex vertical className="mt-6">
            <Typography.Title level={5}>
                II. Details of tax deducted and deposited in the central government account through
                challan
            </Typography.Title>

            <Text type="secondary" className="block mb-3">
                (The deductor to provide payment-wise details of tax deducted and deposited with
                respect to the deductee)
            </Text>

            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns as any}
                    dataSource={tableData}
                    bordered
                    pagination={false}
                    scroll={isMobile ? { x: 1300 } : undefined}
                />
            </div>

            <Col>
                <Button type="default" danger onClick={handleAdd} className="px-2 mt-1">
                    + Add New Row
                </Button>
            </Col>
        </Flex>
    );
};

export default ChallanDetailsSection;
