import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Empty, Flex, Input, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import ReportOrderMobileList from '../components/orders/ReportOrderMobileList';
import ReportOrderTable from '../components/orders/ReportOrderTable';
import ReportPageHeader from '../components/shared/ReportPageHeader';
import useReportOrders from '../hooks/useReportOrders';
import { ReportOrderDetail } from '../types/index';
import { vehicleReportsRoot } from '../utils/reportMeta';

const { RangePicker } = DatePicker;

// Car Report Order History: every report the corporate has purchased.
const ReportOrderHistoryPage = () => {
    const navigate = useNavigate();
    const { xs } = useScreenSize();
    const {
        rows,
        count,
        isLoading,
        isError,
        refetch,
        filter,
        handleSearch,
        handleDateChange,
        handlePageChange,
    } = useReportOrders();

    const viewOrder = (order: ReportOrderDetail) =>
        navigate(
            `${vehicleReportsRoot}/${paths.turbo.reportOrders}/${paths.turbo.reportOrderDetails}?orderId=${order.orderId}`
        );

    // Direct PDF when the row carries one; otherwise the order page, which
    // fetches a late PDF on open.
    const downloadOrder = (order: ReportOrderDetail) => {
        const reportUrl = order.reportUrl ?? order.valuation?.reportUrl;
        if (reportUrl) {
            window.open(reportUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        viewOrder(order);
    };

    return (
        <Flex vertical gap={24}>
            <ReportPageHeader
                title="Car Report Order History"
                subtitle="Track, view and download your purchased car reports."
            />

            <Flex
                vertical
                gap={20}
                className="rounded-2xl bg-white p-4 shadow-[0px_2px_20px_rgba(0,0,0,0.04)] sm:p-6"
            >
                <Flex
                    align="center"
                    justify="space-between"
                    gap={12}
                    className="flex-col sm:flex-row"
                >
                    <Typography.Text className="text-lg font-medium text-[#0A0A0A]">
                        Order History
                    </Typography.Text>
                    <Flex gap={12} className="w-full flex-wrap sm:w-auto">
                        <RangePicker
                            placeholder={['From date', 'To date']}
                            onChange={dates =>
                                handleDateChange(
                                    dates?.[0] ? dayjs(dates[0]).format('YYYY-MM-DD') : '',
                                    dates?.[1] ? dayjs(dates[1]).format('YYYY-MM-DD') : ''
                                )
                            }
                        />
                        <Input
                            placeholder="Search"
                            allowClear
                            suffix={<SearchOutlined className="text-[#98A2B3]" />}
                            value={filter.searchText}
                            onChange={event => handleSearch(event.target.value)}
                            className="sm:w-[240px]"
                        />
                    </Flex>
                </Flex>

                {/* A failed request is not an empty order history — offer a retry
                    instead of the "no orders yet" empty state, which would read as
                    "you have never bought a report". */}
                {isError && !isLoading ? (
                    <Empty description="We couldn't load your order history.">
                        <Button type="primary" onClick={refetch}>
                            Try again
                        </Button>
                    </Empty>
                ) : (
                    <>
                        {xs ? (
                            <ReportOrderMobileList
                                rows={rows}
                                isLoading={isLoading}
                                onView={viewOrder}
                                onDownload={downloadOrder}
                            />
                        ) : (
                            <ReportOrderTable
                                rows={rows}
                                isLoading={isLoading}
                                onView={viewOrder}
                                onDownload={downloadOrder}
                            />
                        )}
                    </>
                )}

                {count > filter.itemsPerPage && (
                    <Pagination
                        className="text-center sm:text-end"
                        total={count}
                        current={filter.page}
                        pageSize={filter.itemsPerPage}
                        showSizeChanger={false}
                        onChange={handlePageChange}
                    />
                )}
            </Flex>
        </Flex>
    );
};

export default ReportOrderHistoryPage;
