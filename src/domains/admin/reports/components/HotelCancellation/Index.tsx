import { useState, useEffect } from 'react';

import { Button, Flex, Pagination, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { snakeCaseToSentenceCase, toTitleCase } from '@utils/wordFormat';

import Header from './Header';
import RefundModal from './RefundModal';
import useHotels from '../../hooks/hotels/useHotels';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import useGetPartnerDatas from '../../hooks/usePartnersForCorporate';
import { RolePermissionAccessData } from '../../types/reportsScheduling';

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

const HotelCancellation = () => {
    const today = dayjs();
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<any>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Hotel Cancellation'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: 'transactionDate',
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
    } = useHotels(filters);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        searchText,
        setSearchText,
        handleChangeFilters,
        handlePartnerChange,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);
    const { partnerData } = useGetPartnerDatas(debouncedSearchText);
    const columns = [
        {
            title: 'Date',
            sorter: false,
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
            sorter: false,
            dataIndex: ['credential', 'name'],
            key: 'corporateTxnId',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>{data?.credential.name}</Typography.Text>
                    <Typography.Text>{data?.credential.username}</Typography.Text>
                </Flex>
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
            title: 'Transaction ID',
            sorter: false,
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.corporateTxnId}</Typography.Text>
            ),
        },
        {
            title: 'Amount',
            sorter: false,
            dataIndex: 'amountInINR',
            key: 'amountInINR',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>₹ {data?.amountInINR}</Typography.Text>
                    <Typography.Text>{toTitleCase(data?.paymentMode || 'N/A')}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            sorter: false,
            render: (value: string) => toTitleCase(value || 'N/A'),
        },
        {
            title: 'Refunded Amount',
            sorter: false,
            dataIndex: ['shipmentStatus', 'refundDetails', 'refundAmount'],
            key: 'ecomOrderStatus',
            render: (_: any, data: any) => {
                const refundingAmount = data?.shipmentStatus?.refundDetails?.refundAmount;
                return (
                    <Typography.Text>
                        {refundingAmount
                            ? `₹ ${formatNumberWithLocalString(refundingAmount)}`
                            : 'N/A'}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Status',
            sorter: false,
            dataIndex: 'status',
            key: 'status',
            render: (_: any, data: any) => (
                <Typography.Text>{snakeCaseToSentenceCase(data?.status || '')}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            sorter: false,
            dataIndex: 'id',
            key: 'id',
            render: (_: any, data: any) => {
                const { transactionDate, status, paymentMode } = data;
                const orderResponse = JSON.parse(data?.orderResponse || '{}');
                const paymentModeResponse= JSON.parse(data?.paymentModeResponse || '{}');
                const {refundStatus} = paymentModeResponse
                const bookingStatus = orderResponse?.bookingStatus || '';
                const refundingAmount = data?.shipmentStatus?.refundDetails?.refundAmount;
                const isdisabled =
                    status === 'REFUNDED' || bookingStatus !== 'Processed' || !refundingAmount || refundStatus==="PENDING" ;

                const { status: s2, message } = calculateTimeRemainingToNext1026AMUTC(
                    transactionDate,
                    status,
                    paymentMode
                );

                return (
                    <>
                        {s2 ? (
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
                                        disabled={isdisabled || !accessPermission?.update} // Disable if `accessPermission?.update` is false
                                        onClick={() => {
                                            if (accessPermission?.update) {
                                                setOpenModal(true);
                                                setModalData(data);
                                            }
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
                className="text-end pt-7"
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

export default HotelCancellation;
