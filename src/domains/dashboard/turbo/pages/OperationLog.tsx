import { useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Flex, Input, Table, Typography, Pagination, DatePicker } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import useDebounceSearch from '@src/hooks/useDebounceSearch';
import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import useFilter from '../hooks/useFilter';
import useGetAllLogsApi from '../hooks/useGetAllLogsApi';
import { filterState } from '../types/index';

const { Text, Paragraph } = Typography;

const OperationLog = () => {
    const columns = [
        {
            title: 'Date',
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
            title: 'Action Type',
            dataIndex: 'actionType',
            key: 'actionType',
            render: (actionType: string) => getReadableActionText(actionType),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (description: string) => description,
        },
        {
            title: 'Asset',
            dataIndex: 'meta',
            key: 'meta',
            render: (meta: Record<string, any> | number | null | undefined) => {
                if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
                    return (
                        <Flex>
                            {Object.entries(meta).map(([key, value]) => (
                                <Flex key={key}>
                                    {String(value)}
                                </Flex>
                            ))}
                        </Flex>
                    );
                }
        
                return 'N/A';
            },
        },
    ];

    const { xs } = useScreenSize();
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        from: lastMonth.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
    };
    const dateFormat = 'YYYY-MM-DD';
    const [filter, setFilter] = useState<filterState>(initialValues);
    const { searchText, updateSearchText } = useDebounceSearch(setFilter);
    // You can handle API fetching here if needed for additional side effects
    const { count, isLoading, logs } = useGetAllLogsApi(filter);
    const disabledDate = (current: any) => current && current > moment().startOf('day');
    const { handleSearch, handlePageChange, handleDateChange, handleFromChange, handleToChange } =
        useFilter({
            setFilter,
            initalStartDate: initialValues.from,
            initalEndDate: initialValues.to,
        });
    function getReadableActionText(action: string): string {
        const actionMap: Record<string, string> = {
            ADD_VEHICLE: 'Vehicle added',
            ADD_DRIVER: 'Driver added',
            DELETE_VEHICLE: 'Vehicle deleted',
            DELETE_DRIVER: 'Driver deleted',
            UPDATE_VEHICLE: 'Vehicle updated',
            UPDATE_DRIVER: 'Driver updated',
            RC_LOOKUP: 'RC verified',
            DL_LOOKUP: 'DL verified',
            ASSIGN_DRIVER: 'Driver assigned',
            UNASSIGN_DRIVER: 'Driver unassigned',
            REASSIGN_DRIVER: 'Driver reassigned',
            UPDATE_FASTAG: 'FASTag updated',
            FASTAG_RECHARGE: 'FASTag recharged',
            UPDATE_SERVICE_DATES: 'Service dates updated',
            UPLOAD_DOCUMENT: 'Document uploaded',
            UPDATE_DOCUMENT: 'Document updated',
            DELETE_DOCUMENT: 'Document deleted',
            REQUEST_QUOTE: 'Insurance quote requested',
        };

        return (
            actionMap[action] ||
            action
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, char => char.toUpperCase())
        );
    }

    return (
        <>
            <Flex vertical>
                {xs ? (
                    <>
                        <Paragraph className="w-full py-5 text-lg font-medium">
                            Operations Log
                        </Paragraph>
                        <Flex justify="space-between" className="mb-5">
                            <DatePicker
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(filter.from, dateFormat)}
                                disabledDate={disabledDate}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(filter.to, dateFormat)}
                                disabledDate={disabledDate}
                            />
                        </Flex>
                        <Flex align="center" className="mb-3">
                            <Input
                                placeholder="Search"
                                style={{
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                }}
                                value={searchText}
                                onChange={updateSearchText}
                                suffix={<SearchOutlined />}
                                allowClear
                            />
                        </Flex>
                    </>
                ) : (
                    <Flex justify="space-between" className="">
                        <Text className="text-lg font-medium xl:text-xl lg:text-lg sm:text-lg ">
                            Operations Log
                        </Text>
                        <Flex>
                            <DatePicker.RangePicker
                                onChange={handleDateChange}
                                format="YYYY-MM-DD"
                                value={[
                                    dayjs(filter.from, dateFormat),
                                    dayjs(filter.to, dateFormat),
                                ]}
                                className="w-full sm:w-fit h-9 sm:mt-[0.7rem] md:mt-0 "
                                disabledDate={current => current && current > dayjs().endOf('day')}
                            />
                            <Flex align="center" style={{ marginLeft: '10px' }}>
                                <Input
                                    placeholder="Search"
                                    suffix={<SearchOutlined />}
                                    allowClear
                                    type="text"
                                    maxLength={100}
                                    value={filter.searchText}
                                    onChange={handleSearch}
                                />
                            </Flex>
                        </Flex>
                    </Flex>
                )}
            </Flex>
            <Table
                scroll={{ x: 756 }}
                loading={isLoading}
                dataSource={logs}
                columns={columns}
                pagination={false}
                className="mt-5"
            />
            <Pagination
                className="mt-10 text-center sm:text-end"
                total={count}
                current={filter.page}
                onChange={handlePageChange}
            />
        </>
    );
};

export default OperationLog;
