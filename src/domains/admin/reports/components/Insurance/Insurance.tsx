import React, { useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import useFilter from '../../hooks/useFilter';
import useGetAllInsurance from '../../hooks/useGetAllInsurance';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';

const Insurances = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        page: 1,
        itemsPerPage: 10,
        from: todayFormatted,
        to: todayFormatted,
        id: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const {
        handleSearch,
        handlePageChange,
        handleDateChange,
        handleChangeFilters,
        searchText,
        setSearchText,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const { corporateDatas } = useGetCorporateDatas(searchText);
    const { isLoading, tableData, count, downloadReport } = useGetAllInsurance(filters);

    const columns = [
        {
            title: 'Transaction Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (data: any) => (
                <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'Order ID',
            dataIndex: 'transactionID',
            key: 'transactionID',
            render: (data: any) => <Typography.Text>{data}</Typography.Text>,
        },
        {
            title: 'Policy Name',
            dataIndex: 'policyName',
            key: 'policyName',
            render: (data: any) => <Typography.Text>{data}</Typography.Text>,
        },
        {
            title: 'Policy Premium',
            dataIndex: 'policyPremium',
            key: 'policyPremium',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data))}</Typography.Text>
            ),
        },
        {
            title: 'Policy Tenure',
            dataIndex: 'policyTenure',
            key: 'policyTenure',
            render: (data: any) => <Typography.Text>{data} Year(s)</Typography.Text>,
        },
        {
            title: 'Insurance Status',
            dataIndex: 'insuranceStatus',
            key: 'insuranceStatus',

            render: (text: string, record: any) => (
                <Tooltip
                    placement="bottomLeft"
                    color="gray"
                    title={record.statusMessage || 'No remarks available'}
                >
                    <Typography.Text>{text}</Typography.Text>
                    <QuestionCircleOutlined style={{ marginLeft: 5, color: '#1890ff' }} />
                </Tooltip>
            ),
        },
        {
            title: 'Corporate Name/ID',
            dataIndex: 'credential',
            key: 'credential',
            render: (data: any) => (
                <Typography.Text>
                    {data.name}({data.username})
                </Typography.Text>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                corporateData={corporateDatas}
                setSearchText={setSearchText}
                handleChangeFilters={handleChangeFilters}
                handleSearch={handleSearch}
                searchText={filters.searchText}
                handleDateChange={handleDateChange}
                handleDownloadReport={downloadReport}
                from={filters.from}
                to={filters.to}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                onChange={handleTableChange}
                loading={isLoading}
                // scroll={{ x: 756 }}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default Insurances;
