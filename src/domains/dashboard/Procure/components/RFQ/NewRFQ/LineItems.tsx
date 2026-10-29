import React from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Grid, Image, Row, Table, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

import newRFQsIcon from '../../../assets/icons/newRFQsIcon.svg';

const { Text } = Typography;

export interface LineItem {
    key: string;
    description: string;
    qty: number | string;
    unit: string;
    price: number | string;
}

type Props = {
    addItem: () => void;
    removeItem: (key: string) => void;
};

const UNIT_OPTIONS = [
    { value: 'Unit', label: 'Unit' },
    { value: 'Each', label: 'Each' },
    { value: 'Box', label: 'Box' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Litre', label: 'Litre' },
    { value: 'Hour', label: 'Hour' },
];

const LineItems: React.FC<Props> = ({ addItem, removeItem }) => {
    const { values } = useFormikContext<{ lineItems: LineItem[] }>();
    const { md } = Grid.useBreakpoint();
    const isMobile = !md;
    const items = values.lineItems ?? [];

    const columns = [
        {
            title: 'Description', dataIndex: 'description', key: 'description', width: 260,
            render: (_: unknown, _row: LineItem, i: number) => (
                <TextInput
                    name={`lineItems[${i}].description`}
                    type="text"
                    placeholder="Describe the requested item or scope"
                    maxLength={200}
                    isRequired
                    formItemClass="!mb-0"
                    removeEmoji
                />
            ),
        },
        {
            title: 'Qty', dataIndex: 'qty', key: 'qty', width: 70,
            render: (_: unknown, _row: LineItem, i: number) => (
                <TextInput
                    name={`lineItems[${i}].qty`}
                    type="text"
                    placeholder="0"
                    allowTwoDecimalsOnly
                    inputMode="numeric"
                    maxLength={8}
                    formItemClass="!mb-0"
                />
            ),
        },
        {
            title: 'Unit', dataIndex: 'unit', key: 'unit', width: 90,
            render: (_: unknown, _row: LineItem, i: number) => (
                <SelectInput
                    name={`lineItems[${i}].unit`}
                    placeholder=""
                    options={UNIT_OPTIONS}
                    classes="w-full"
                    formItemClass="!mb-0"
                />
            ),
        },
        {
            title: '', key: 'action', width: 40,
            render: (_: unknown, row: LineItem) => (
                <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(row.key)}
                    disabled={items.length === 1}
                    className="!block !pt-[5px]"
                />
            ),
        },
    ];

    return (
        <Card bordered={false} className="mb-4" style={{ borderRadius: 20, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 24 } }}>
            <Flex vertical={isMobile} justify={isMobile ? undefined : 'space-between'} align={isMobile ? 'flex-start' : 'center'} gap={8}>
                <Flex gap={10} align="center" style={{ flex: 1, minWidth: 0 }}>
                    <Flex
                        align="center"
                        justify="center"
                        className="shrink-0 text-sm rounded-lg w-7 h-7 bg-[#FFF4F4]"
                    >
                        <Image src={newRFQsIcon} alt="New RFQ" width={16} height={16} preview={false} />
                    </Flex>
                    <Flex vertical style={{ minWidth: 0 }}>
                        <Text strong className="text-sm">Line Items</Text>
                        <Text className="text-xs text-[rgba(0,0,0,0.45)]">Itemised list of goods or services being ordered</Text>
                    </Flex>
                </Flex>
                <Button
                    icon={<PlusOutlined className="!text-[13px] !text-[#ff4f4f]" />}
                    onClick={addItem}
                    className="!h-[30px] !bg-white !border !border-[rgba(255,79,79,0.25)] !rounded-lg !text-[#ff4f4f] !text-xs !font-medium !px-3"
                >
                    Add Row
                </Button>
            </Flex>
            <Divider className="!my-3 !-mx-6" style={{ width: 'calc(100% + 48px)' }} />

            <div style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 0 }}>
                <Table
                    dataSource={items}
                    columns={columns}
                    pagination={false}
                    size="small"
                    rowKey="key"
                    scroll={{ x: 'max-content' }}
                    className="!text-xs [&_.ant-table-cell]:align-top [&_.ant-table]:!rounded-none [&_.ant-table-container]:!rounded-none [&_.ant-table-thead_th:first-child]:!rounded-tl-none [&_.ant-table-thead_th:last-child]:!rounded-tr-none"
                />
            </div>

            <Row gutter={12} className="mt-3">
                <Col xs={24} sm={8} className="flex">
                    <Card bordered={false} className="rounded-lg flex-1" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '10px 14px' } }}>
                        <Text className="text-xs text-gray-400 block">Total Quantity</Text>
                        <Text strong className="text-sm">
                            {items.reduce((sum, i) => sum + Number(i.qty), 0)}
                        </Text>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};

export default LineItems;
