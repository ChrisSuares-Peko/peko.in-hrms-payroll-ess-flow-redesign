import React, { useCallback, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import {
    Col,
    Flex,
    Input,
    Pagination,
    PaginationProps,
    Row,
    Select,
    Skeleton,
    Space,
    Table,
    Typography,
} from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';

import useGetInvoice from '../hooks/useGetInvoice';
import DownloadInvoiceData from '../hooks/useInvoiceDownloadApi';
import useTracker from '../hooks/useTracker';
import { setInvoiceId } from '../slices/InvoicesSlices';

const { Text } = Typography;

const InvoiceHistory = () => {
    const {
        data,
        isLoading,
        searchText,
        setSearchText,
        count,
        currentPage,
        setCurrentPage,
        limit,
        setLimit,
    } = useGetInvoice();

    const navigate = useNavigate();

    const { updateStatus } = useTracker();
    const [statusValues, setStatusValues] = useState<any>({});

    const dispatch = useDispatch();

    const handleChange = useCallback(
        (value: string, id: number) => {
            setStatusValues({ ...statusValues, [id]: value });
            updateStatus(value, id);
        },
        [statusValues, updateStatus] // Dependencies are statusValues and updateStatus
    );

    const toTitleCase = useMemo(
        () => (text: string) =>
            text?.replace(
                /\w\S*/g,
                (word: string) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
            ),
        [] // No dependencies as this is a simple transformation function
    );

    const statusColors = {
        Pending: '#C89C00',
        Expired: '#FF4F4F',
        Paid: '#05BE63',
    };

    const statusStyles = {
        PAID: {
            text: '#16a34a',
            background: '#d1fae5',
            border: '#bbf7d0',
        },
        PENDING: {
            text: '#a16207',
            background: '#fef9c3',
            border: '#fde68a',
        },
        EXPIRED: {
            text: '#d97b7b',
            background: '#ffc2c2',
            border: '#d87e7e',
        },
    };

    function findColorByStatus(status: string) {
        let value = statusStyles.PENDING;
        if (status === 'PAID' || status === 'PENDING' || status === 'EXPIRED') {
            value = statusStyles[status];
        }
        return value;
    }

    const columns = (handleDownload: (id: string) => void) => [
        {
            title: 'Date & Time',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => <span>{formattedDateTime(new Date(date))}</span>,
        },
        {
            title: 'Customer Name',
            dataIndex: 'recipientDetails',
            key: 'recipientDetails',
            render: (recipientDetails: string) => {
                const obj = recipientDetails ? JSON.parse(recipientDetails) : null;
                return obj ? obj.customerName : 'N/A';
            },
        },
        {
            title: 'Invoice Number',
            dataIndex: 'id',
            key: 'id',
            render: (id: any) => id || 'N/A',
        },
        {
            title: 'Amount',
            dataIndex: 'paymentDetails',
            key: 'productDetails',
            render: (paymentDetails: string) => {
                if (!paymentDetails) {
                    return 'N/A';
                }
                try {
                    const obj = JSON.parse(paymentDetails);
                    const amountDue = obj && obj.amountDue ? obj.amountDue : null; // Access amountDue directly from obj
                    return amountDue !== null ? `₹ ${amountDue}` : 'N/A';
                } catch (error) {
                    return 'N/A';
                }
            },
        },

        {
            title: 'Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            render: (text: string) => toTitleCase(text),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: any) => {
                const currentStatus = statusValues[record.id] || status;
                return (
                    <Flex>
                        {record.paymentMode === 'payment link' ? (
                            <Flex>
                                <Text
                                    className="px-5 py-1 text-sm rounded-xl text-nowrap"
                                    style={{
                                        color: findColorByStatus(status).text,
                                        background: findColorByStatus(status).background,
                                        borderColor: findColorByStatus(status).border,
                                    }}
                                >
                                    {status}
                                </Text>
                            </Flex>
                        ) : (
                            <Select
                                className="w-32"
                                value={currentStatus}
                                style={{ width: 120 }}
                                onChange={value => handleChange(value, record.id)}
                                options={[
                                    {
                                        value: 'PENDING',
                                        label: (
                                            <span style={{ color: statusColors.Pending }}>
                                                Pending
                                            </span>
                                        ),
                                    },
                                    {
                                        value: 'EXPIRED',
                                        label: (
                                            <span style={{ color: statusColors.Expired }}>
                                                Expired
                                            </span>
                                        ),
                                    },
                                    {
                                        value: 'PAID',
                                        label: (
                                            <span style={{ color: statusColors.Paid }}>
                                                Completed
                                            </span>
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </Flex>
                );
            },
        },
        {
            title: 'Action',
            dataIndex: 'id',
            key: 'action',
            render: (id: any) => (
                <Space size="middle">
                    <Text
                        className="cursor-pointer text-nowrap"
                        onClick={() => {
                            dispatch(setInvoiceId(id));
                            navigate(paths.invoice.trackDetails);
                        }}
                        style={{ color: 'red' }}
                    >
                        View
                    </Text>
                    <Text
                        className="cursor-pointer text-nowrap"
                        onClick={() => handleDownload(id)}
                        style={{ color: 'red' }}
                    >
                        Download
                    </Text>
                </Space>
            ),
        },
    ];

    const { getInvoiceDetails, loader } = DownloadInvoiceData();

    const handleDownload = useCallback(
        async (id: string) => {
            await getInvoiceDetails(id);
        },
        [getInvoiceDetails] // No dependencies, only needs to be created once
    );

    const handlePageChange: PaginationProps['onChange'] = (page, length) => {
        setCurrentPage(page);
        setLimit(length);
    };

    return (
        <Flex vertical gap={10} className="w-full">
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={24} sm={12} md={6}>
                    <Text className="text-lg font-medium xl:text-xl lg:text-lg sm:text-lg ">
                        Track Payments
                    </Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search for orders"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={100}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </Col>
            </Row>
            {isLoading ? (
                <Skeleton className="mt-5" paragraph={{ rows: 15 }} active />
            ) : (
                <Table
                    className=""
                    columns={columns(handleDownload)}
                    dataSource={data?.invoiceData}
                    loading={loader}
                    pagination={false}
                    rowKey="id"
                />
            )}
            <Pagination
                current={currentPage}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-7 xs:mb-12 md:mb-0"
                defaultPageSize={limit}
                total={count}
            />
        </Flex>
    );
};

export default InvoiceHistory;
