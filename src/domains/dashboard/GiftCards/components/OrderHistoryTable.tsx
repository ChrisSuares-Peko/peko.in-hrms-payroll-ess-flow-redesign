import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Table, Typography, Flex, Input, TableColumnsType, Pagination, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import useFilter from '@src/domains/dashboard/GiftCards/hooks/useFilter';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';
import { toTitleCase } from '@utils/wordFormat';

import { useOrderHistoryTable } from '../hooks/useOrderHistoryTable';
import { setAddressData, setBuyAgain, setFormData, setProductData } from '../slices/checkoutSlice';
import { GiftCardOrderTypes } from '../types/employee';
import { OrderHistoryTableData, filterState } from '../types/types';

type OrderHistoryPageProps = {};

const isExpandable = (orderType: string) =>
    orderType !== 'Buy for Self';

/* eslint-disable react/prop-types */
const RecipientDetails: React.FC<{ record: OrderHistoryTableData }> = ({ record }) => {
    const { addressDetails, orderType } = record;
    if (!addressDetails) return null;

    const isEmployeeOrder =
        orderType === 'Buy for Employees' || orderType === GiftCardOrderTypes.BUYFOREMPLOYEE;
    const employees = addressDetails.employee ?? [];

    if (isEmployeeOrder && employees.length > 0) {
        return (
            <div className="py-2 px-4 bg-gray-50">
                <Typography.Text className="font-medium text-sm block mb-3">
                    Recipient Details
                </Typography.Text>
                {employees.map((emp, idx) => (
                    <Flex key={idx} className="mt-2">
                        <Flex gap={8} className="min-w-[300px]">
                            <Typography.Text className="text-gray-500">
                                Recipient Name
                            </Typography.Text>
                            <Typography.Text>
                                {emp.receiverFirstName || '-'}
                            </Typography.Text>
                        </Flex>
                        <Flex gap={8}>
                            <Typography.Text className="text-gray-500">
                                Recipient Email:
                            </Typography.Text>
                            <Typography.Text>
                                {emp.receiverEmail || '-'}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                ))}
            </div>
        );
    }

    return (
        <div className="py-2 px-4 bg-gray-50">
            <Typography.Text className="font-medium text-sm block mb-3">
                Recipient Details
            </Typography.Text>
            <Flex className="mt-2">
                <Flex gap={8} className="min-w-[300px]">
                    <Typography.Text className="text-gray-500">
                        Receiver Name:
                    </Typography.Text>
                    <Typography.Text>
                        {addressDetails.receiverFirstName || '-'}
                    </Typography.Text>
                </Flex>
                <Flex gap={8}>
                    <Typography.Text className="text-gray-500">
                        Receiver Email:
                    </Typography.Text>
                    <Typography.Text>
                        {addressDetails.receiverEmail || '-'}
                    </Typography.Text>
                </Flex>
            </Flex>
        </div>
    );
};
/* eslint-enable react/prop-types */

const OrderHistoryPage: React.FC<OrderHistoryPageProps> = () => {
    const initialValues = {
        search: '',
        start: 1,
        length: 10,
        draw: 1,
        from: '',
        to: '',
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
    const { handleSearch, handlePageChange } = useFilter({ setFilter });
    const { data, isLoading, count } = useOrderHistoryTable(
        filter.draw,
        filter.start,
        filter.length,
        filter.search
    );
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const toggleRow = (key: string) => {
        setExpandedRowKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const OrderHistoryColumns: TableColumnsType<OrderHistoryTableData> = [
        {
            title: 'Date',
            dataIndex: 'date',
            render: (date: Date) => formattedDateTime(new Date(date)),
        },
        {
            title: 'Gift Card Name',
            dataIndex: 'giftCardName',
        },
        {
            title: 'Order ID',
            dataIndex: 'txnId',
        },

        {
            title: 'Order Type',
            dataIndex: 'orderType',
            render: (orderType: string) => {
                if (orderType === 'Buy for other') return 'Buy for Other';
                if (orderType === 'Buy for self') return 'Buy for Self';
                if (orderType === 'Buy for Employee') return 'Buy for Employees';
                return orderType ?? '-';
            },
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            render: (quantity: string) => quantity ?? '-',
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            render: (text: string) => <span>{toTitleCase(text)}</span>,
        },
        {
            title: 'Total Amount',
            dataIndex: 'amount',
            render: (amount: number) => (
               <Typography.Text>₹ {Number(amount).toFixed(2)}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (text: string) => (
                <span
                    className={`${text === 'SUCCESS' ? 'text-textGreen' : 'text-bgOrange2'} capitalize`}
                >
                    {text === 'FAILURE' ? 'Failed' : text.toLowerCase()}
                </span>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record: any) => (
                <Button
                    tabIndex={0}
                    type="default"
                    className="border-brandSecondary text-brandSecondary"
                    onClick={() => {
                        dispatch(setFormData(record.formData));
                        dispatch(setProductData(record.productDetails));
                        dispatch(setAddressData(record.addressDetails));
                        dispatch(setBuyAgain(true));
                        navigate(
                            `${paths.dashboard.giftCards}/${paths.giftcards.details}/${record.productDetails.id}`
                        );
                    }}
                >
                    Buy Again
                </Button>
            ),
        },
    ];

    return (
        <Flex vertical gap={20} className="pt-7">
            <Flex justify="space-between" className="mb-4">
                <Typography.Paragraph className={`text-xl  font-medium `}>
                    Order History
                </Typography.Paragraph>
                <Flex align="center">
                    <Input
                        placeholder="Search"
                        allowClear
                        suffix={<SearchOutlined />}
                        variant="outlined"
                        style={{
                            width: 'calc(100% - 10px)',
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                        }}
                        value={filter.search}
                        onChange={handleSearch}
                    />
                </Flex>
            </Flex>
            <Table
                columns={OrderHistoryColumns}
                dataSource={data.map(item => ({ ...item, key: item.txnId }))}
                loading={isLoading}
                pagination={false}
                expandable={{
                    expandedRowKeys,
                    onExpand: (_, record: OrderHistoryTableData) => toggleRow(record.txnId),
                    expandedRowRender: (record: OrderHistoryTableData) => (
                        <RecipientDetails record={record} />
                    ),
                    rowExpandable: (record: OrderHistoryTableData) =>
                        isExpandable(record.orderType),
                    expandIcon: ({ expanded, onExpand, record }) =>
                        isExpandable(record.orderType) ? (
                            <button
                                type="button"
                                onClick={e => onExpand(record, e)}
                                className={`ant-table-row-expand-icon ${expanded ? 'ant-table-row-expand-icon-expanded' : 'ant-table-row-expand-icon-collapsed'}`}
                            />
                        ) : null,
                }}
            />
            <Pagination
                current={filter.start}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-7"
                total={count}
            />
        </Flex>
    );
};

export default OrderHistoryPage;
