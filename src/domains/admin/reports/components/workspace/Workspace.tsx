import React, { useEffect, useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Flex, Pagination, Select, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import OrderUpdateModal from './OrderModal';
import useFilter from '../../hooks/useFilter';
import usePartnersForCorporate from '../../hooks/usePartnersForCorporate';
import useWorkspace from '../../hooks/useWorkspace';
import { RolePermissionAccessData } from '../../types/workspace';

export type DropDown = {
    value: number | string;
    label: string;
}[];

const statusOptions: DropDown = [
    {
        value: 'PENDING',
        label: 'PENDING',
    },
    {
        value: 'ONPROGRESS',
        label: 'ONPROGRESS',
    },
    {
        value: 'COMPLETE',
        label: 'COMPLETE',
    },
];

const Workspace = () => {
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<any>();

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
        partnerId: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
        handlePartnerChange,
        searchText,
        setSearchText,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Workspace Orders'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const { searchText: userSearchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, getAllTableData, downloadReport, updateStatus } =
        useWorkspace(filters);
    const debouncedSearchText = useDebounce(searchText, 300);
    const { partnerData } = usePartnersForCorporate(debouncedSearchText);
    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
        setModalData(undefined);
    };
    const handleRefresh = () => {
        getAllTableData();
    };
    const columns = [
        {
            title: 'Transaction Date',
            dataIndex: 'transactionDate',
            sorter: true,
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
            dataIndex: 'corporateTxnId',
        },
        {
            title: 'Corporate ID',
            sorter: true,
            dataIndex: ['credential', 'username'],
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential.username || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate Name',
            dataIndex: ['credential', 'name'],
            sorter: true,
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential.name || '-'}</Typography.Text>
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
            title: 'Plan Name',
            dataIndex: 'orderResponse',
            key: 'orderResponse',
            render: (data: any) => (
                <Typography.Text>{JSON.parse(data)?.planDetails?.name}</Typography.Text>
            ),
        },
        {
            title: 'Billing Cycle',
            dataIndex: 'orderResponse',
            key: 'orderResponse',
            render: (data: any) => (
                <Typography.Text className="capitalize">
                    {JSON.parse(data)?.planDetails?.billingCycle.toLowerCase()}
                </Typography.Text>
            ),
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            sorter: true,
            key: 'paymentMode',
            render: (data: any) => (
                <Typography.Text className="capitalize">{data.toLowerCase()}</Typography.Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amountInINR',
            sorter: true,
            key: 'amountInINR',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data)}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'workspaceOrderStatus',
            key: 'workspaceOrderStatus',
            sorter: true,
            render: (status: any, data: any) => (
                <Flex>
                    <Tooltip
                        placement="top"
                        title={
                            !accessPermission?.update
                                ? 'Sorry, you do not have permission to perform this action'
                                : ''
                        }
                    >
                        <span>
                            <Select
                                onChange={value => updateStatus(data.id, value)}
                                disabled={!accessPermission?.update}
                                placeholder="Please select a status"
                                filterOption={false}
                                options={statusOptions}
                                defaultValue={status ? status.toUpperCase() : ''}
                            />
                        </span>
                    </Tooltip>
                </Flex>
            ),
        },
        {
            title: 'View',
            dataIndex: 'view',
            render: (_: any, record: any) => <EyeOutlined onClick={() => handleEdit(record)} />,
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                from={filters.from}
                to={filters.to}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleSearch={updateSearchText}
                handleChangeFilters={handlePartnerChange}
                searchText={userSearchText}
                categoryDatas={partnerData}
                setPartnerSearchText={setSearchText}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                style={{ overflow: 'auto' }}
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

export default Workspace;
