/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import OrderUpdateModal from './OrderModal';
import { updateOrderApi } from '../../api/works';
import useFilter from '../../hooks/useFilter';
import useGetWorksOrders from '../../hooks/useGetWorksOrders';
import { RolePermissionAccessData } from '../../types/reportsScheduling';
import { WorkOrderTableItems, updateResponse } from '../../types/works';
// import { WorkOptions } from '../../utils/data';

const OrderContent = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Peko Works'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: '',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
        id: '',
    };
    const [additionalFilters, setAdditionalFilters] = useState({
        corporateId: '',
        partnerId: '',
    });
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebounce(searchText, 500);
    const [filters, setFilters] = useState(initialValues);
    const [openModal, setOpenModal] = useState(false);
    const [updateLoader, setUpdateLoader] = useState(false);
    const [modalData, setModalData] = useState<WorkOrderTableItems>();

    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { isLoading, tableData, count, getAllTableData, downloadReport } = useGetWorksOrders(
        filters,
        additionalFilters
    );

    const handleCloseModal = () => {
        setOpenModal(false);
        setModalData(undefined);
    };
    const handleRefresh = () => {
        getAllTableData();
    };
    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleChange = async (value: string, record: any) => {
        setUpdateLoader(true);
        const orderId = record.order.id;
        const res: updateResponse | false = await updateOrderApi({
            userId: id,
            userType: role,
            id: orderId,
            workspaceOrderStatus: value,
        });
        if (res) {
            setUpdateLoader(false);
            handleRefresh();
        }
        setUpdateLoader(false);
    };
    const generateOrderBtn = (status: string) => {
        const statusColors: Record<string, { badgeColor: string; textColor: string }> = {
            PENDING: { badgeColor: '#FFF4F3', textColor: '#D7341E' },
            ONPROGRESS: { badgeColor: '#E3F5FF', textColor: '#54AEE1' },
            COMPLETED: { badgeColor: '#EBFFE7', textColor: '#26A411' },
            // CANCELLED: { badgeColor: '#E9E9E9', textColor: '#000000' },
        };

        const { badgeColor, textColor } = statusColors[status] || {
            badgeColor: 'gray',
            textColor: 'white',
        };

        return (
            <Tag
                style={{
                    borderRadius: 12,
                    fontWeight: 500,
                    fontSize: 12,
                    padding: '4px 12px',
                    marginBottom: 4,
                    color: textColor,
                }}
                color={badgeColor}
            >
                {status === 'ONPROGRESS' ? 'IN PROGRESS' : status}
            </Tag>
        );
    };
    const updateSearchText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };
    const columns = [
        {
            title: 'Transaction Date',
            sorter: true,
            dataIndex: ['order', 'transactionDate'],
            key: 'transactionDate',
            render: (date: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction ID',
            sorter: true,
            dataIndex: ['order', 'corporateTxnId'],
            key: 'corporateTxnId',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.order.corporateTxnId || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate ID',
            sorter: true,
            dataIndex: ['credential', 'username'],
            key: 'corporateUserName',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential.username || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate Name',
            sorter: true,
            dataIndex: ['credential', 'name'],
            key: 'corporateName',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential.name}</Typography.Text>
            ),
        },
        {
            title: 'Partner Name',
            sorter: true,
            dataIndex: ['credential', 'registeredBy'],
            render: (_: any, data: any) => (
                <Typography.Text>
                    {data?.credential?.registeredByCredential?.name ?? '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Work Name',
            dataIndex: ['order', 'orderResponse'],
            key: 'workName',
            render: (_: any, data: any) => {
                const orderResponse = JSON.parse(data?.order.orderResponse);
                return (
                    <Typography.Text>
                        {orderResponse?.planDetails?.work?.name || '-'}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Plan Name',
            dataIndex: ['order', 'orderResponse'],
            key: 'planName',
            render: (_: any, data: any) => {
                const orderResponse = JSON.parse(data?.order.orderResponse);
                return <Typography.Text>{orderResponse?.planDetails?.name || '-'}</Typography.Text>;
            },
        },
        {
            title: 'Price',
            sorter: true,
            dataIndex: ['order', 'amountInINR'],
            key: 'amount',
            render: (_: any, data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(data.order.amountInINR))}
                </Typography.Text>
            ),
        },
        // {
        //     title: 'Current Status',
        //     sorter: true,
        //     dataIndex: ['order', 'workspaceOrderStatus'],
        //     key: 'statusBtn',
        //     render: (_: any, data: any) => generateOrderBtn(data.order.workspaceOrderStatus),
        // },
        // {
        //     title: 'Change Status',
        //     sorter: true,
        //     dataIndex: ['order', 'workspaceOrderStatus'],
        //     key: 'status',
        //     render: (status: string, record: any) => (
        //         <Tooltip
        //             placement="top"
        //             title={
        //                 !accessPermission?.update
        //                     ? 'Sorry, you do not have permission to perform this action'
        //                     : ''
        //             }
        //         >
        //             <span>
        //                 <Select
        //                     defaultValue={record?.order.workspaceOrderStatus}
        //                     className="w-32 rounded-md"
        //                     onChange={
        //                         accessPermission?.update
        //                             ? value => handleChange(value, record)
        //                             : undefined
        //                     }
        //                     // onChange={value => handleChange(value, record)}
        //                     options={WorkOptions}
        //                     loading={updateLoader}
        //                     disabled={!accessPermission?.update}
        //                 />
        //             </span>
        //         </Tooltip>
        //     ),
        // },
        {
            title: 'View',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: any) => <EyeOutlined onClick={() => handleEdit(record)} />,
        },
    ];

    useEffect(() => {
        setFilters(prevFilters => ({
            ...prevFilters,
            searchText: debouncedSearchText,
            page: 1,
        }));
    }, [debouncedSearchText]);

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                handleSearch={updateSearchText}
                searchText={searchText}
                setAdditionalFilters={setAdditionalFilters}
                additionalFilters={additionalFilters}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
            />
            <GenericTable
                rowKey={record => record.order.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && (
                <OrderUpdateModal
                    data={modalData}
                    open={openModal}
                    handleCancel={handleCloseModal}
                    handleRefresh={handleRefresh}
                />
            )}
        </Flex>
    );
};

export default OrderContent;
