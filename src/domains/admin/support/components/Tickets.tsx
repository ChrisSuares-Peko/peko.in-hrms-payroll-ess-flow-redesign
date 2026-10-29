import { useEffect, useState } from 'react';

import { SwapRightOutlined } from '@ant-design/icons';
import {
    Button,
    Flex,
    DatePicker,
    Table,
    Col,
    Pagination,
    Grid,
    Skeleton,
    Row,
    Typography,
} from 'antd';
import dayjs from 'dayjs';

import { DownloadType } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import CustomModal from './CustomModal';
import TicketsMobile from './TicketsMobile';
import useFilter from '../hooks/useFilter';
import { useGetIssueListingType } from '../hooks/useIssueTypeApi';
import { useGetModuleListingType } from '../hooks/useModuleApi';
import { useTicketListingApi } from '../hooks/useTicketListingApi';
import { setTicketData } from '../slices/supportSlice';
import { ticketListingTableData } from '../types/type';
import { initialFilters } from '../utils';

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';

const Tickets = () => {
    const dispatch = useAppDispatch();
    useGetModuleListingType();
    useGetIssueListingType();
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shouldRefreshTickets, setShouldRefreshTickets] = useState(false);
    const today = dayjs();
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const lastInitialFilter = {
        ...initialFilters,
        from: oneMonthAgoFormatted,
    };
    const [filters, setFilters] = useState(lastInitialFilter);

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
    const { data, isLoading, count, getTicketList, downloadReport, isReportLoading } =
        useTicketListingApi(filters.from, filters.to, filters.page, filters.status);
    useEffect(() => {
        if (shouldRefreshTickets) {
            getTicketList();
            setShouldRefreshTickets(false);
        }
    }, [shouldRefreshTickets, getTicketList, setShouldRefreshTickets]);

    const disabledDate = (current: any) => current && current > dayjs().endOf('day');

    dispatch(setTicketData(data));

    const columns = [
        {
            title: 'Created Date',
            dataIndex: 'date',
            render: (date: string) => <span>{formattedDateOnly(new Date(date))}</span>,
        },
        {
            title: 'Ticket Number',
            dataIndex: 'ticketId',
            render: (text: string, record: ticketListingTableData) => (
                <Typography.Paragraph>{record.ticketId}</Typography.Paragraph>
            ),
        },
        {
            title: 'Customer Name',
            dataIndex: 'merchantName',
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
            title: 'Description',
            dataIndex: 'description',
            render: (text: string) => <Typography.Paragraph>{text}</Typography.Paragraph>,
        },
    ];
    return (
        <Flex className="w-full mt-8" vertical>
            {isModalOpen && (
                <CustomModal
                    getTicketList={getTicketList}
                    open={isModalOpen}
                    closeModal={() => setIsModalOpen(false)}
                />
            )}

            <Row justify="space-between" className="w-full gap-5">
                <Flex className="flex justify-start gap-3">
                    <Button danger onClick={() => downloadReport(DownloadType.Excel)}>
                        Excel
                    </Button>
                    <Button danger onClick={() => downloadReport(DownloadType.Csv)}>
                        CSV
                    </Button>
                    <Button danger onClick={() => downloadReport(DownloadType.Pdf)}>
                        PDF
                    </Button>
                </Flex>
                <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                    {/* <Typography.Title level={5}>Tickets</Typography.Title> */}
                    <Flex wrap="wrap" gap="small" justify="space-between">
                        {!screens.xs ? (
                            <RangePicker
                                onChange={handleDateChange}
                                format={dateFormat}
                                className="w-full mb-5 sm:mb-auto sm:w-auto"
                                value={[
                                    dayjs(filters.from, dateFormat),
                                    dayjs(filters.to, dateFormat),
                                ]}
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
            </Row>
            <Col span={24}>
                {screens.xs && (
                    <>
                        <TicketsMobile isLoading={isLoading} data={data} />
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
                {!screens.xs && isLoading && <Skeleton active />}
                {!screens.xs && !isLoading && (
                    <>
                        <Table
                            rowKey={record => record.id}
                            bordered={false}
                            columns={columns}
                            dataSource={data}
                            scroll={{ x: 992 }}
                            loading={isLoading || isReportLoading}
                            pagination={false}
                            className="w-full mt-8"
                        />
                        <Pagination
                            current={filters.page}
                            onChange={handlePageChange}
                            size="default"
                            className="text-end pt-7"
                            total={count}
                            showSizeChanger={false}
                        />
                    </>
                )}
            </Col>
        </Flex>
    );
};
export default Tickets;
