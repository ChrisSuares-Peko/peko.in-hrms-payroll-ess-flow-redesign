import React, { useState } from 'react';

import { Button, Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { toTitleCase } from '@utils/wordFormat';

import Header from './Header';
import useAirlineBookings from '../../hooks/airline/useAirlineBookings';
import useDownloadTicket from '../../hooks/airline/useDownloadTicket';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
// import useGetPartnerDatas from '../../hooks/useGetPartnerDatas';

const Index = () => {
    const dispatch = useAppDispatch();
    const today = dayjs();
    const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

    const { HandleDownloadTicket } = useDownloadTicket();
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: '',
        page: 1,
        itemsPerPage: 10,
        from: today.subtract(30, 'day').format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
        id: '',
        partnerId: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = useAirlineBookings(filters);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        searchText,
        setSearchText,
        handleChangeFilters,
        // handlePartnerChange,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);
    // const { partnerDatas } = useGetPartnerDatas(debouncedSearchText);

    const downloadTicket = async (id: number) => {
        try {
            // setDownloadedTicketLoading(true);
            setLoadingRowId(id);
            const res = await HandleDownloadTicket(id);
            if (res) {
                const uint8Array = new Uint8Array(res.pdfFile.data);
                const blob = new Blob([uint8Array], { type: 'application/pdf' });
                await saveAs(blob, res?.pdfName || 'invoice.pdf');

                setLoadingRowId(null);
            } else {
                setLoadingRowId(null);
            }
        } catch (error) {
            setLoadingRowId(null);
            dispatch(
                showToast({
                    description: 'Something went wrong while generating invoice',
                    variant: 'error',
                })
            );
        }
    };

    const formatStatus = (status: string = '') => {
        const formatted = status.toLowerCase().replace(/_/g, ' ');

        switch (formatted) {
            case 'cancelled request for refund':
                return 'Cancelled and Refund Requested';
            case 'cancelled and refunded':
                return 'Cancelled and Refunded';
            default:
                return formatted
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
        }
    };

    const columns = [
        {
            title: 'Date',
            sorter: true,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (_: any, data: any) => {
                const txnDate = data?.createdAt;
                return (
                    <Flex vertical>
                        <Typography.Text>{formattedDateOnly(new Date(txnDate))}</Typography.Text>
                        <Typography.Text>{formattedTime(new Date(txnDate))}</Typography.Text>
                    </Flex>
                );
            },
        },

        {
            title: 'Corporate',
            sorter: false,
            dataIndex: ['credential', 'name'],
            key: 'corporateTxnId',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>{data?.credential?.name}</Typography.Text>
                    <Typography.Text>{data?.credential?.username}</Typography.Text>
                </Flex>
            ),
        },
        // {
        //     title: 'Partner Name',
        //     sorter: true,
        //     dataIndex: ['credential', 'registeredBy'],
        //     render: (_: any, data: any) => (
        //         <Typography.Text>
        //             {data?.credential?.registeredByCredential?.name ?? '-'}
        //         </Typography.Text>
        //     ),
        // },
        {
            title: 'Transaction ID',
            sorter: true,
            dataIndex: ['transaction', 'corporateTxnId'],
            key: 'corporateTxnId',
            render: (_: any, data: any) => {
                const ids = [data?.transaction?.corporateTxnId];
                return (
                    <Flex vertical>
                        {ids.map((id, index) => (
                            <Typography.Text key={index}>{id}</Typography.Text>
                        ))}
                    </Flex>
                );
            },
        },
        {
            title: 'Confirmation Number',
            sorter: true,
            dataIndex: 'BookingId',
            key: 'bookingReferenceId',
            render: (value: any) => <Typography.Text>{value}</Typography.Text>,
        },

        {
            title: 'Amount',
            dataIndex: ['order', 'amountInINR'],
            key: 'amountInINR',
            render: (_: any, data: any) => {
                const amount = data?.order?.amountInINR || 0;

                return <Typography.Text>₹ {formatNumberWithLocalString(amount)}</Typography.Text>;
            },
        },
        {
            title: 'Payment Mode',
            dataIndex: ['order', 'paymentMode'],
            key: 'paymentMode',
            render: (_: any, data: any) => (
                <Typography.Text>{toTitleCase(data?.order?.paymentMode || 'N/A')}</Typography.Text>
            ),
        },
        {
            title: 'PNR',
            key: 'airlineLocator',
            render: (_: any, data: any) => {
                const ticketDocs = data?.PNR || [];


                return (
                    <Typography.Text>
                        {ticketDocs}
                    </Typography.Text>
                );
            },
        },

        {
            title: 'Status',
            dataIndex: 'bookingStatus',
            key: 'bookingStatus',
            render: (bookingStatus: string) => {
                const status = bookingStatus || 'N/A';
                return (
                    <Flex vertical>
                        <Typography.Text>{formatStatus(status)}</Typography.Text>
                    </Flex>
                );
            },
        },
        {
            title: 'Action',
            dataIndex: 'id',
            key: 'id',
            render: (_: any, data: any) => (
                <Flex gap="middle">
                    <Button
                        loading={loadingRowId === data.id}
                        onClick={() => downloadTicket(data.id)}
                        danger
                        size="small"
                        // disabled={data?.order?.status !== 'SUCCESS'}
                    >
                        View Ticket
                    </Button>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                dropDownData={corporateDatas}
                // partnerDropDownData={partnerDatas}
                // handlePartnerChange={handlePartnerChange}
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
        </Flex>
    );
};

export default Index;
