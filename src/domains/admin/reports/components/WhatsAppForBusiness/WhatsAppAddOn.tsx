import React, { useState } from 'react';

import { Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import AddOnHeader from './AddOnHeader';
import useFilter from '../../hooks/useFilter';
import useGetAddOnData from '../../hooks/whatsAppForBusiness/useGetAddOns';
import { StatusData } from '../../utils/whatsAppAddOn';

const WhatsAppAddOn = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        pageSize: 10,
        sort: 'DESC',
        from: oneMonthAgoFormatted,
        to: todayFormatted,
        sortField: '',
    };
    const [filters, setFilters] = useState(initialValues);
    // const [openModal, setOpenModal] = useState(false);
    // const [modalData, setModalData] = useState<Record>();
    const { tableData, count, isLoading, downloadReport } = useGetAddOnData(filters);
    const {
        handleSearch,
        handlePageChange,
        handleTableChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleCategoryFilters,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    // const handleEdit = (record: Record) => {
    //     setModalData(record);
    //     setOpenModal(true);
    // };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Corporate Name',
            sorter: true,
            dataIndex: ['credential', 'name'],
            key: 'credential.name',
            render: (_: any, data: any) => data.credential.name,
        },
        {
            title: 'Corporate ID',
            sorter: true,
            dataIndex: ['credential', 'username'],
            key: 'credential.username',
            render: (_: any, data: any) => data.credential.username,
        },

        {
            title: 'Add-on',
            sorter: true,
            dataIndex: 'addOnType',
            key: 'addOnType',
            render: (addOnType: string) =>
                ({ BOT_BUILDER: 'Bot Builder', SHOPIFY_INTEGRATION: 'Shopify Integration' })[
                    addOnType
                ] ?? '-',
        },
        {
            title: 'Amount Paid',
            sorter: true,
            dataIndex: 'subscriptionAmountPaid',
            key: 'subscriptionAmountPaid',
            render: (data: any) => `₹  ${formatNumberWithLocalString(data)}`,
        },
        {
            title: 'Amount',
            sorter: true,
            dataIndex: 'subscriptionPrice',
            key: 'subscriptionPrice',
            render: (data: any) => `₹  ${formatNumberWithLocalString(data)}`,
        },
        {
            title: 'Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Typography.Text>
                    {status.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) || '-'}
                </Typography.Text>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <AddOnHeader
                handleSearch={handleSearch}
                searchText={filters.searchText}
                statusData={StatusData}
                downloadReport={downloadReport}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
                handleCategoryFilters={handleCategoryFilters}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {/* {openModal && (
                <AddOnModal
                    setRefresh={setRefresh}
                    data={modalData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                />
            )} */}
        </Flex>
    );
};

export default WhatsAppAddOn;
