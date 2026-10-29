import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, DatePicker, Empty, Flex, Input, Pagination, Row, Skeleton, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import MoreTransactions from '@assets/svg/moretransactions.svg';
import useDebounce from '@src/hooks/useDebounce';

import TableMobile from './TableMobile';
import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';

const MobileTable = () => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [searchTextInput, setSearchTextInput] = React.useState('');
    const { RangePicker } = DatePicker;
    const todayFormatted = dayjs().format('YYYY-MM-DD');
    const oneMonthBefore = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
    const [fromDate, setFromDate] = useState<string>(oneMonthBefore);
    const [toDate, setToDate] = useState<string>(todayFormatted);

    const handleDateChange = (
        dates: [Dayjs | null, Dayjs | null] | null,
        dateStrings: [string, string]
    ) => {
        if (dates && dates[0] && dates[1]) {
            setFromDate(dates[0].format('YYYY-MM-DD'));
            setToDate(dates[1].format('YYYY-MM-DD'));
        } else {
            setFromDate(
                new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
            );
            setToDate(new Date().toISOString().substring(0, 10));
        }
    };

    const debouncedSearch = useDebounce(searchTextInput, 200);
    const { orders, isLoading, count } = useOrderHistoryApi({
        itemsPerPage: pageSize,
        page: currentPage,
        sort: 'DESC',
        search: debouncedSearch,
        fromDate,
        toDate,
    });

    return (
        <>
            <Typography.Paragraph className="text-lg font-medium text-nowrap">
                Order History
            </Typography.Paragraph>
            <Flex vertical className="gap-5 my-5">
                <RangePicker
                    onChange={(dates, dateStrings) =>
                        handleDateChange(dates as [Dayjs | null, Dayjs | null] | null, dateStrings)
                    }
                    format="YYYY-MM-DD"
                    value={[dayjs(fromDate), dayjs(toDate)]}
                    disabledDate={current => current && current > dayjs().endOf('day')}
                />
                <Input
                    suffix={<SearchOutlined />}
                    allowClear
                    placeholder="Search"
                    value={searchTextInput}
                    onChange={e => setSearchTextInput(e.target.value)}
                />
            </Flex>

            <Row align="middle" className="px-3 py-5 rounded-md bg-bgLightGray">
                <Col xs={7}>
                    <Flex justify="start">
                        <Typography.Text>Date</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={9}>
                    <Flex justify="start">
                        <Typography.Text>Plan</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={7}>
                    <Flex justify="start">
                        <Typography.Text>Status</Typography.Text>
                    </Flex>
                </Col>
            </Row>
            {isLoading ? (
                <Skeleton paragraph={{ rows: 6 }} className="mt-5" />
            ) : (
                <Flex vertical className="h-full">
                    {orders.length > 0 ? (
                        orders.map(transaction => <TableMobile transaction={transaction} />)
                    ) : (
                        <Flex vertical justify="center" align="center" className="h-full">
                            <Empty image={MoreTransactions} description="No data found" />
                        </Flex>
                    )}
                </Flex>
            )}
            <Pagination
                current={currentPage}
                className="mt-10 text-center"
                size="small"
                total={count}
                showSizeChanger={false}
                onChange={(page, pageSize2) => {
                    setCurrentPage(page);
                    setPageSize(pageSize2);
                }}
            />
        </>
    );
};

export default MobileTable;
