import React, { useEffect, useState } from 'react';

import { EyeOutlined, SwapRightOutlined } from '@ant-design/icons';
import {
    Button,
    Flex,
    Select,
    Space,
    Typography,
    DatePicker,
    Table,
    Col,
    Pagination,
    Skeleton,
} from 'antd';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';

import { ENV } from '@src/config-global';
import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateTime } from '@utils/dateFormat';

import CustomModal from './CustomModal';
import TicketsMobile from './TicketsMobile';
import useFilter from '../hooks/useFilter';
import { useGetIssueListingType } from '../hooks/useIssueTypeApi';
import { useGetModuleListingType } from '../hooks/useModuleApi';
import { useTicketListingApi } from '../hooks/useTicketListingApi';
// import { setTicketData } from '../slices/supportSlice';
import { ticketListingTableData } from '../types/type';

const { Text } = Typography;

interface TicketsProps {
    handleButtonClick: (record: ticketListingTableData) => void;
    shouldRefreshTickets: boolean;
    setShouldRefreshTickets: (val: boolean) => void;
}
const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';

const parseHtmlToText = (htmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || '';
};

const Tickets = ({
    handleButtonClick,
    shouldRefreshTickets,
    setShouldRefreshTickets,
}: TicketsProps) => {
    const { state } = useLocation();
    const { moduleTypes, isLoading: moduleLoading } = useGetModuleListingType();
    useGetIssueListingType();
    const { xs } = useScreenSize();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const today = new Date();

    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const formatDate = (date: any) => date.toISOString().split('T')[0];

    const initialFilters = {
        page: 1,
        itemsPerPage: 10,
        filter: '',
        module: 'all',
        from: formatDate(lastMonth),
        to: formatDate(today),
    };
    const statusMapping: { [key: number]: string } = {
        2: 'OPEN',
        3: 'PENDING',
        4: 'RESOLVED',
        5: 'CLOSED',
    };
    const statusStyles: {
        [key: string]: { text: string; background: string; border: string };
    } = {
        OPEN: {
            text: 'text-green-600',
            background: 'bg-green-100',
            border: 'border-green-200',
        },
        PENDING: {
            text: 'text-yellow-700',
            background: 'bg-yellow-100',
            border: 'border-yellow-300',
        },
        RESOLVED: {
            text: 'text-[#7C6666]',
            background: 'bg-[#DDDDDD]',
            border: 'border-[#c2bdbd]',
        },
        CLOSED: {
            text: 'text-[#D97B7B]',
            background: 'bg-[#FFC2C2]',
            border: 'border-[#d87e7e]',
        },
    };
    const [filters, setFilters] = useState(initialFilters);

    const {
        handleChangeModule,
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useFilter({
        setFilters,
        initalStartDate: filters.from,
        initalEndDate: filters.to,
    });
    const { data, isLoading, count, getTicketList } = useTicketListingApi(
        filters.from,
        filters.to,
        filters.page,
        filters.module
    );

    useEffect(() => {
        if (shouldRefreshTickets) {
            getTicketList();
            setShouldRefreshTickets(false);
        }
    }, [shouldRefreshTickets, getTicketList, setShouldRefreshTickets]);

    const isComingFromDashboard = state ? state.item : null;

    useEffect(() => {
        if (isComingFromDashboard) {
            setIsModalOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [isComingFromDashboard]);

    const disabledDate = (current: any) => current && current > dayjs().endOf('day');

    // dispatch(setTicketData(data));

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            render: (date: string) => <span>{formattedDateTime(new Date(date))}</span>,
        },
        {
            title: 'ID',
            dataIndex: 'ticketId',
        },
        {
            title: 'Issue Type',
            dataIndex: 'issueType',
        },
        {
            title: 'Module',
            dataIndex: 'module',
        },

        {
            title: 'Issue Details',
            dataIndex: 'description',
            render: (description: any) => {
                const textContent = parseHtmlToText(description);
                return <Flex className="truncate max-w-60 text-ellipsis">{textContent}</Flex>;
            },
        },

        // {
        //     title: 'Updates',
        //     dataIndex: 'updates',
        //     render: (text: number) => (
        //         <div style={{ display: 'flex', alignItems: 'center' }}>
        //             {text > 0 && (
        //                 <Badge
        //                     count={text}
        //                     className="mr-1"
        //                     style={{ backgroundColor: '#05BE63' }}
        //                 />
        //             )}
        //             <Text
        //                 className={text === 0 ? 'text-gray-800' : 'text-textLime text-sm'}
        //             >
        //                 {text === 0 ? '-' : 'New Message'}
        //             </Text>
        //         </div>
        //     ),
        // },
        // {
        //     title: 'Status',
        //     dataIndex: 'status',
        //     render: (status: string) => {
        //         status = status === 'PENDING' ? 'OPEN' : status;
        //         const statusStyles: {
        //             [key: string]: { text: string; background: string; border: string };
        //         } = {
        //             OPEN: {
        //                 text: 'text-green-600',
        //                 background: 'bg-green-100',
        //                 border: 'border-green-200',
        //             },
        //             PENDING: {
        //                 text: 'text-yellow-700',
        //                 background: 'bg-yellow-100',
        //                 border: 'border-yellow-300',
        //             },
        //             RESOLVED: {
        //                 text: 'text-[#7C6666]',
        //                 background: 'bg-[#DDDDDD]',
        //                 border: 'border-[#c2bdbd]',
        //             },
        //             REJECTED: {
        //                 text: 'text-[#D97B7B]',
        //                 background: 'bg-[#FFC2C2]',
        //                 border: 'border-[#d87e7e]',
        //             },
        //         };
        //         const style = statusStyles[status];
        //         if (style) {
        //             return (
        //                 <Space
        //                     className={`px-4 justify-center items-center font-medium py-1 rounded-full ${style.background} border ${style.border}`}
        //                 >
        //                     <Paragraph
        //                         className={`text-xs font-normal leading-none ${style.text}`}
        //                     >
        //                         {status}
        //                     </Paragraph>
        //                 </Space>
        //             );
        //         }
        //         return null;
        //     },
        // },

        // {
        //     title: 'Status',
        //     dataIndex: 'status',
        //     render: (status: number) => {
        //         // Map the status number to the corresponding text value
        //         const statusText = statusMapping[status];

        //         // Apply the correct styles
        //         const style = statusStyles[statusText];
        //         if (style) {
        //             return (
        //                 <Space
        //                     className={`px-4 justify-center items-center font-medium py-1 rounded-full ${style.background} border ${style.border}`}
        //                 >
        //                     <Paragraph
        //                         className={`text-xs font-normal leading-none ${style.text}`}
        //                     >
        //                         {statusText}
        //                     </Paragraph>
        //                 </Space>
        //             );
        //         }
        //         return null;
        //     },
        // },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status: number | string) => {
                const statusText = typeof status === 'string' ? status : statusMapping[status];
                const style = statusStyles[statusText];
                if (style) {
                    return (
                        <Space
                            className={`px-4 justify-center items-center font-medium py-1 rounded-full ${style.background} border ${style.border}`}
                        >
                            <Text className={`text-xs font-normal leading-none ${style.text}`}>
                                {statusText ?? status}
                            </Text>
                        </Space>
                    );
                }
                return null;
            },
        },
        {
            title: 'View',
            dataIndex: 'view',
            render: (_: any, record: ticketListingTableData) =>
                ENV === 'production' ? (
                    <EyeOutlined onClick={() => handleButtonClick(record)} />
                ) : (
                    <EyeOutlined
                        style={{ pointerEvents: 'unset', opacity: 0.5, cursor: 'not-allowed' }}
                    />
                ),
        },
    ];
    return (
        <Flex className="w-full mt-5" vertical>
            {isModalOpen && (
                <CustomModal
                    getTicketList={getTicketList}
                    open={isModalOpen}
                    closeModal={() => setIsModalOpen(false)}
                />
            )}

            <Flex wrap="wrap" justify="space-between" gap={20}>
                <Text className="text-xl">Tickets</Text>
                <Flex wrap="wrap" gap="small" justify="space-between">
                    <Button
                        type="primary"
                        size="middle"
                        className="w-full sm:w-auto"
                        onClick={() => setIsModalOpen(!isModalOpen)}
                        danger
                    >
                        Raise a Ticket
                    </Button>
                    <Select
                        defaultValue="All"
                        className="w-full sm:w-48"
                        options={[
                            {
                                value: 'all',
                                label: 'All',
                            },
                            ...moduleTypes,
                        ]}
                        onChange={handleChangeModule}
                        loading={moduleLoading}
                    />
                    {!xs ? (
                        <RangePicker
                            onChange={handleDateChange}
                            format={dateFormat}
                            className="w-full mb-5 sm:mb-auto sm:w-auto"
                            defaultValue={[
                                dayjs(filters.from, dateFormat),
                                dayjs(filters.to, dateFormat),
                            ]}
                            allowClear={false}
                            disabledDate={disabledDate}
                        />
                    ) : (
                        <Flex
                            className="w-full mb-5 sm:mb-auto sm:w-auto"
                            justify="space-between"
                            align="center"
                        >
                            <DatePicker
                                disabledDate={disabledDate}
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(filters.from, dateFormat)}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                disabledDate={disabledDate}
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(filters.to, dateFormat)}
                            />
                        </Flex>
                    )}
                </Flex>
            </Flex>
            <Col span={24}>
                {xs && (
                    <>
                        <TicketsMobile
                            isLoading={isLoading}
                            data={data}
                            handleButtonClick={handleButtonClick}
                        />
                        <Pagination
                            current={filters.page}
                            onChange={handlePageChange}
                            className="text-center"
                            size="small"
                            total={count}
                            showSizeChanger={false}
                        />
                    </>
                )}
                {!xs && isLoading && <Skeleton active />}
                {!xs && !isLoading && (
                    <>
                        <Table
                            rowKey={record => record.id}
                            bordered={false}
                            columns={columns}
                            dataSource={data}
                            scroll={{ x: 992 }}
                            loading={isLoading}
                            pagination={false}
                            className="w-full mt-8"
                        />
                        <Pagination
                            current={filters.page}
                            onChange={handlePageChange}
                            size="default"
                            className="text-end pt-7"
                            style={{ display: 'block' }}
                            total={count}
                            showSizeChanger={false}
                        />
                    </>
                )}
            </Col>
        </Flex>
    );
};
export default React.memo(Tickets);
