import React, { useState } from 'react';

import { Badge, Flex, Pagination, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import ComplaintMobileTable from './ComplaintMobileTable';
import ComplaintTableHeader from './ComplaintTableHeader';
import useFilter from '../../hooks/useFilter';
import useComplaintListApi from '../../hooks/useGetComplaintListApi';
import { complaintStatusLabel, findColorByStatus } from '../../utils/complaintStatus';

const ComplaintRegistrationTable = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    // Handling cases where last month has fewer days
    if (lastMonth.getDate() !== today.getDate()) {
        lastMonth.setDate(0);
    }
    const initialValues = {
        page: 1,
        itemsPerPage: 10,
        filter: '',
        // module: 'all',
        searchText: '',
        from: lastMonth.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
    };
    const [filters, setFilters] = useState(initialValues);

    const { complaintDta, isLoading, count } = useComplaintListApi(filters);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { xs } = useScreenSize();

    // const {
    //     tableData,
    //     count,
    //     loading,
    //     setRefresh,
    //     updateStatusEmailDomain,
    //     downloadReport,
    //     deleteEmailDomain,
    // } = useGetAllEmailDomain(filters);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useFilter({
        setFilters,
        initalStartDate: filters.from,
        initalEndDate: filters.to,
    });

    const columns = [
        {
            title: 'Complaint Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Complaint ID',
            dataIndex: 'bbpsSupportHistory',
            key: 'bbpsSupportHistory',
            render: (bbpsSupportHistory: any) => (
                <Typography.Text> {bbpsSupportHistory?.complaintId || 'N/A'}</Typography.Text>
            ),
        },
        {
            title: 'B-Connect Transaction ID',
            dataIndex: 'bbpsSupportHistory', // Access bbpsSupportHistory
            key: 'txnRefId',
            render: (bbpsSupportHistory: any) => (
                <Typography.Text>
                    {bbpsSupportHistory?.requestBody?.txnRefId || 'N/A'}
                </Typography.Text>
            ),
        },
        {
            title: 'Assigned To',
            dataIndex: 'bbpsSupportHistory', // Access bbpsSupportHistory
            key: 'complaintAssigned',
            render: (bbpsSupportHistory: any) => (
                <Typography.Text>{bbpsSupportHistory?.complaintAssigned || 'N/A'}</Typography.Text>
            ),
        },
        // {
        //     title: 'Offers',
        //     dataIndex: 'offersText',
        //     key: 'offersText',
        //     width: 250,
        //     render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        // },
        // {
        //     title: 'Mobile Number',
        //     dataIndex: 'mobileNumber',
        //     key: 'mobileNumber',
        //     render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        // },
        {
            title: 'Type of Complaint',
            dataIndex: 'issueType',
            key: 'issueType',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Complaint Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: any) => (
                <Flex>
                    {/* <Typography.Text
                                                   className="px-5 py-1 text-sm rounded-xl text-nowrap"
                                                   style={{
                                                       color: findColorByStatus(status).text,
                                                       background: findColorByStatus(status).background,
                                                       borderColor: findColorByStatus(status).border,
                                                   }}
                                               >
                                                   {status}
                                               </Typography.Text> */}
                    <Badge
                        status="warning"
                        text={complaintStatusLabel(status)}
                        className="px-2 rounded-2xl"
                        style={{
                            color: findColorByStatus(status).text,
                            backgroundColor: findColorByStatus(status).background,
                            padding: '2px 7px',
                            border: '1px ',
                            borderRadius: '15px',
                        }}
                    />
                </Flex>
            ),
        },
    ];
    return (
        <Flex vertical className="mt-2">
            <ComplaintTableHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
            />
            {xs ? (
                <ComplaintMobileTable complaints={complaintDta} isLoading={isLoading} />
            ) : (
                <GenericTable
                    rowKey={record => record.id}
                    className="w-full mt-6"
                    bordered={false}
                    columns={columns}
                    dataSource={complaintDta}
                    pagination={false}
                    scroll={{ x: 992 }}
                    loading={isLoading}
                />
            )}
            <Pagination
                current={filters.page}
                onChange={handlePageChange}
                size="default"
                className="pt-7 text-center md:text-end"
                style={{ display: 'block' }}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default ComplaintRegistrationTable;
