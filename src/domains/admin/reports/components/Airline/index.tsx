import { useEffect, useState } from 'react';

import { Button, Flex, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { toTitleCase } from '@utils/wordFormat';

import Header from './Header';
import RefundModal from './RefundModal';
import useAirline from '../../hooks/airline/useAirline';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import usePartnersForCorporate from '../../hooks/usePartnersForCorporate';
import { Booking, RolePermissionAccessData } from '../../types/airline';

function calculateTimeRemainingToNext1026AMUTC(
    transactionDate: string | number | Date,
    status: string,
    paymentMode: string
) {
    try {
        if (status === 'REFUNDED' || paymentMode === 'WALLET') {
            return { status: true, message: '' };
        }
        const oneHourInMilliseconds = 3600000;
        const oneMinuteInMilliseconds = 60000;

        // Get the current UTC date and time
        const nowUTC = new Date();

        const transactionDateUTC = new Date(transactionDate);
        const next1026AMUTC = new Date(nowUTC);
        next1026AMUTC.setHours(10, 26, 0, 0); // Set to 10:26 AM
        if (nowUTC.getHours() > 10 || (nowUTC.getHours() === 10 && nowUTC.getMinutes() >= 26)) {
            next1026AMUTC.setDate(next1026AMUTC.getDate() + 1); // Move to the next day if current time is past 10:26 AM
        }

        // Subtract the timestamps (using getTime()) to find the time difference
        const diff =
            (next1026AMUTC.getTime() - transactionDateUTC.getTime()) / oneHourInMilliseconds;
        if (diff > 24) {
            return { status: true, message: '' };
        }

        // Calculate the difference in milliseconds
        const diffMs = next1026AMUTC.getTime() - nowUTC.getTime();

        // Calculate hours and minutes remaining
        const hours = Math.floor(diffMs / oneHourInMilliseconds);
        const minutes = Math.floor((diffMs % oneHourInMilliseconds) / oneMinuteInMilliseconds);

        return { status: false, message: `${hours}h ${minutes} min to refund` };
    } catch (error) {
        return { status: false, message: 'N/A' };
    }
}

const Airline = () => {
    const today = dayjs();
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<Booking>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
  
    const service = useFindRolesService(services?.data, 'Airline Cancellation'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: 'createdAt',
        page: 1,
        itemsPerPage: 10,
        from: today.subtract(30, 'day').format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
        id: '',
        partnerId: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const {
        isLoading,
        modalLoading,
        tableData,
        count,
        getAllTableData,
        downloadReport,
        refundAmount,
    } = useAirline(filters);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        searchText,
        setSearchText,
        handleChangeFilters,
        handleTableChange,
        handlePartnerChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);
    const { partnerData } = usePartnersForCorporate(debouncedSearchText);
    const columns = [
        {
            title: 'Date',
            sorter: true,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>
                        {formattedDateOnly(new Date(data?.createdAt))}
                    </Typography.Text>
                    <Typography.Text>{formattedTime(new Date(data?.createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Corporate',
            // sorter: true,
            dataIndex: ['credential', 'name'],
            key: 'corporateTxnId',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>{data?.credential?.name}</Typography.Text>
                    <Typography.Text>{data?.credential?.username}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction Id',
            sorter: true,
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: (_: any, data: any) => {
                const corporateTxnIds = [data?.transaction?.corporateTxnId];
                if (data?.flightModifiedBookings.length > 0) {
                    data.flightModifiedBookings.forEach((booking: any) => {
                        const cancellationFlow =
                            booking?.modificationStatus === 'REQUESTED_FOR_CANCELLATION' ||
                            booking?.modificationStatus === 'CANCELLED_AND_REFUNDED';
                        if (cancellationFlow) {
                            corporateTxnIds.push(booking?.transaction?.corporateTxnId);
                        }
                    });
                }
                return (
                    <Flex vertical>
                        {corporateTxnIds.map((txnId, index) => (
                            <Typography.Text key={index}>
                                {txnId} {index > 0 && '(Modified)'}
                            </Typography.Text>
                        ))}
                    </Flex>
                );
            },
        },
        {
            title: 'Amount',
            sorter: true,
            dataIndex: 'debitAmount',
            key: 'debitAmount',
            render: (_: any, data: Booking) => {
                // const amountInINR = data?.order?.amountInINR || 'N/A'
                const orderAmount = data?.order?.amountInINR || 'N/A';
                const paymentMode = data?.order?.paymentMode || 'N/A';
                return (
                    <Flex vertical>
                        <Typography.Text>
                            ₹ {formatNumberWithLocalString(orderAmount)}
                            {' - '}
                            {toTitleCase(paymentMode)}
                        </Typography.Text>
                    </Flex>
                );
            },
        },
        {
            title: 'Payment Status',
            sorter: true,
            dataIndex: 'status',
            key: 'status',
            render: (_: any, data: any) => {
                const status = [data?.transaction?.status || 'N/A'];
                // if (data?.flightModifiedBookings.length > 0) {
                //     data.flightModifiedBookings.forEach((booking: any) => {
                //         const cancellationFlow =
                //             booking?.modificationStatus === 'REQUESTED_FOR_CANCELLATION' ||
                //             booking?.modificationStatus === 'CANCELLED_AND_REFUNDED';
                //         if (cancellationFlow) {
                //             status.push(booking?.transaction?.status || 'N/A');
                //         }
                //     });
                // }
                return (
                    <Flex vertical>
                        {status.map((s, index) => (
                            <Typography.Text key={index}>{s}</Typography.Text>
                        ))}
                    </Flex>
                );
            },
        },
        {
            title: 'Refunded',
            sorter: true,
            dataIndex: 'debitAmount',
            key: 'debitAmount',
            render: (_: any, data: any) => {
                const payments = [];
                if (data?.refundedAmount) payments.push(data?.refundedAmount);
                if (data?.flightModifiedBookings.length > 0) {
                    data.flightModifiedBookings.forEach((booking: any) => {
                        const cancellationFlow =
                            booking?.modificationStatus === 'REQUESTED_FOR_CANCELLATION' ||
                            booking?.modificationStatus === 'CANCELLED_AND_REFUNDED';
                        if (cancellationFlow && booking?.refundedAmount) {
                            payments.push(booking?.refundedAmount);
                        }
                    });
                }
                return (
                    <Flex vertical>
                        {payments.map((refundedAmount, index) => (
                            <Typography.Text key={index}>
                                ₹ {formatNumberWithLocalString(refundedAmount)}
                            </Typography.Text>
                        ))}
                    </Flex>
                );
            },
        },
        // {
        //     title: 'Booking Status',
        //     sorter: true,
        //     dataIndex: 'id',
        //     key: 'id',
        //     render: (_: any, data: Booking) => {
        //         // let status = data?.order?.orderResponse?.data[0]?.bookingStatus || 'N/A'
        //         const status2 = data?.order?.ecomOrderStatus || 'N/A'
        //         return <Typography.Text> {status2}</Typography.Text>
        //     },
        // },
        {
            title: 'Action',
            sorter: true,
            dataIndex: 'id',
            key: 'id',
            render: (_: any, data: Booking) => {
                const { bookingStatus } = data;
                const { status, message } = calculateTimeRemainingToNext1026AMUTC(
                    data.transactionDate,
                    data.status,
                    data.order.paymentMode
                );
                return (
                    <>
                        {status ? (
                            <Tooltip
                                placement="top"
                                title={
                                    !accessPermission?.update
                                        ? 'Sorry, you do not have permission to perform this action'
                                        : ''
                                }
                            >
                                <span>
                                    <Button
                                        type="default"
                                        size="small"
                                        disabled={
                                            bookingStatus === 'CANCELLED_AND_REFUNDED' ||
                                            !accessPermission?.update
                                        }
                                        onClick={() => {
                                            // const resp = await getCancellationCharges(
                                            //     data.BookingId
                                            // );
                                            // setCancellationCharges(resp);
                                            setOpenModal(true);
                                            setModalData(data);
                                        }}
                                        danger
                                    >
                                        Refund
                                    </Button>
                                </span>
                            </Tooltip>
                        ) : (
                            <Typography.Text>{message}</Typography.Text>
                        )}
                    </>
                );
            },
        },
    ];
    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                dropDownData={corporateDatas}
                partnerDropDownData={partnerData}
                handlePartnerChange={handlePartnerChange}
                setSearchText={setSearchText}
                handleChangeFilters={handleChangeFilters}
                handleSearch={updateSearchText}
                searchText={searchTransaction}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from}
                to={filters.to}
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
            {openModal && (
                <RefundModal
                    open={openModal}
                    handleCancel={() => {
                        setOpenModal(false);
                        setModalData(undefined);
                    }}
                    data={modalData!}
                    handleRefresh={getAllTableData}
                    refundAmount={refundAmount}
                    loading={modalLoading}
                />
            )}
        </Flex>
    );
};

export default Airline;
