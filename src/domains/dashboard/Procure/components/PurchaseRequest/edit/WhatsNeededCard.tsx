import React from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Row, Table, Typography } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import purchaseRequestIcon12 from '@src/domains/dashboard/Procure/assets/icons/purchaseRequestIcon2.svg';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '@src/domains/dashboard/Procure/utils/data';

import { type LineItem } from './formConfig';
import SectionHeader from './SectionHeader';
import { sectionCard } from './shared';

const { Text } = Typography;

interface Props {
    values: { lineItems: LineItem[]; notes: string };
    setFieldValue: (field: string, value: any) => void;
    onAddLineItem: () => void;
    onRemoveLineItem: (key: string) => void;
}

const WhatsNeededCard: React.FC<Props> = ({ values, setFieldValue, onAddLineItem, onRemoveLineItem }) => {
    const columns = [
        {
            title: <Text className="text-xs font-medium">Item name</Text>,
            dataIndex: 'itemName',
            key: 'itemName',
            render: (_: unknown, _row: LineItem, i: number) => (
                <div className="flex flex-col gap-2">
                    <TextInput name={`lineItems[${i}].itemName`} type="text" placeholder="Enter item name" formItemClass="!mb-0" isRequired />
                    <TextInput name={`lineItems[${i}].description`} type="text" placeholder="Description" formItemClass="!mb-0" />
                </div>
            ),
        },
        {
            title: <Text className="text-xs font-medium">Qty</Text>,
            dataIndex: 'qty',
            key: 'qty',
            width: 80,
            render: (_: unknown, _row: LineItem, i: number) => (
                <TextInput name={`lineItems[${i}].qty`} type="text" placeholder="0" allowTwoDecimalsOnly inputMode="numeric" maxLength={8} formItemClass="!mb-0" />
            ),
        },
        {
            title: <Text className="text-xs font-medium">Unit</Text>,
            dataIndex: 'unit',
            key: 'unit',
            width: 100,
            render: (_: unknown, _row: LineItem, i: number) => (
                <SelectInput name={`lineItems[${i}].unit`} placeholder="" options={UNIT_OPTIONS} classes="w-full" formItemClass="!mb-0" />
            ),
        },
        {
            title: '',
            key: 'action',
            width: 40,
            render: (_: unknown, row: LineItem) => (
                <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveLineItem(row.key)}
                    disabled={values.lineItems.length === 1}
                    className="!block !pt-[5px]"
                />
            ),
        },
    ];

    return (
        <Card {...sectionCard}>
            <SectionHeader icon={purchaseRequestIcon12} title="What's Needed" subtitle="Describe the goods or services required" />
            <Divider className="!my-3 !-mx-6" style={{ width: 'calc(100% + 48px)' }} />

            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12}>
                    <SelectInput
                        name="category"
                        label="Category"
                        placeholder="Select category"
                        isRequired
                        options={CATEGORY_OPTIONS}
                        showSearch
                        filterOption={(input: string, option: any) =>
                            String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <DatePickerInput name="neededBy" label="Needed by" placeholder="Select date" classes="w-full" needConfirm={false} minDate={dayjs()} />
                </Col>
            </Row>

            <Table
                dataSource={values.lineItems}
                columns={columns}
                pagination={false}
                size="small"
                rowKey="key"
                scroll={{ x: 'max-content' }}
                className="!text-xs [&_.ant-table-cell]:align-top mb-3"
            />

            <Button type="link" danger icon={<PlusOutlined />} className="!p-0 !h-auto !text-sm !mb-2" onClick={onAddLineItem}>
                Add item
            </Button>

            <Row gutter={12} className="mb-4">
                <Col xs={12}>
                    <Card bordered={false} className="rounded-lg" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '10px 14px' } }}>
                        <Text className="text-xs text-gray-400 block">Total Item</Text>
                        <Text strong className="text-sm">{values.lineItems.length}</Text>
                    </Card>
                </Col>
            </Row>

            <Flex vertical style={{ marginBottom: -16 }}>
                <TextAreaInput name="notes" label="Notes (Optional)" placeholder="" minRows={3} />
            </Flex>
        </Card>
    );
};

export default WhatsNeededCard;
