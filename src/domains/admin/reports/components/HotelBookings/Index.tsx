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
import useDownloadTicket from '../../hooks/hotels/useDownloadTicket';
import useHotelBookings from '../../hooks/hotels/useHotelBookings';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';

const Index = () => {
    const dispatch = useAppDispatch();
    const today = dayjs();
    const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

    const { HandleDownloadTicket } = useDownloadTicket();
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
    };
    const [filters, setFilters] = useState(initialValues);
    const { searchText: searchTransaction, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, downloadReport } = useHotelBookings(filters);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        searchText,
        setSearchText,
        handleChangeFilters,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const debouncedSearchText = useDebounce(searchText, 300);
    const { corporateDatas } = useGetCorporateDatas(debouncedSearchText);

    const downloadTicket = async (id: number) => {
        try {
            // setDownloadedTicketLoading(true);
            setLoadingRowId(id);
            const res = await HandleDownloadTicket(id);
            if (res) {
                const fileData =
                               res?.pdfFile ??
                               res?.pdfBase64;
           
                           let uint8Array: Uint8Array | null = null;
                           if (typeof fileData === 'string') {
                               if (fileData.includes(',')) {
                                   const parts = fileData.split(',').map(part => Number(part.trim()));
                                   uint8Array = new Uint8Array(parts);
                               } else {
                                   const binaryString = atob(fileData);
                                   const bytes = new Uint8Array(binaryString.length);
                                   for (let i = 0; i < binaryString.length; i += 1) {
                                       bytes[i] = binaryString.charCodeAt(i);
                                   }
                                   uint8Array = bytes;
                               }
                           } else if (Array.isArray(fileData)) {
                               uint8Array = new Uint8Array(fileData);
                           } else if (fileData && typeof fileData === 'object') {
                               if (fileData.data && Array.isArray(fileData.data)) {
                                   uint8Array = new Uint8Array(fileData.data);
                               } else {
                                   const values = Object.keys(fileData)
                                       .sort((a, b) => Number(a) - Number(b))
                                       .map(key => Number(fileData[key]));
                                   uint8Array = new Uint8Array(values);
                               }
                           }
           
                           if (!uint8Array) {
                               throw new Error('Invalid ticket file data');
                           }
           
                           const arrayBuffer = uint8Array.buffer.slice(
                               uint8Array.byteOffset,
                               uint8Array.byteOffset + uint8Array.byteLength
                           ) as ArrayBuffer;
                           const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                           await saveAs(blob, res?.data?.pdfName || res?.pdfName || 'Ticket.pdf');

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
            case 'on request':
                return 'Pending Confirmation';
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

        {
            title: 'Transaction ID',
            sorter: true,
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: (_: any, data: any) => {
                const corporateTxnId = data?.corporateTxnId;
                return (
                    <Flex vertical>
                        <Typography.Text>{corporateTxnId}</Typography.Text>
                    </Flex>
                );
            },
        },
        {
            title: 'Booking Number',
            sorter: false,
            dataIndex: 'bookingReferenceId',
            key: 'bookingReferenceId',
            render: (_: any, data: any) => {
                const orderResponse = data?.orderResponse ? JSON.parse(data.orderResponse) : null;
                console.log("orderResponse",orderResponse)
                const bookingReferenceId = orderResponse?.bookingDetailsResponse?.BookingRefNo

                return (
                    <Flex vertical>
                        <Typography.Text>{bookingReferenceId}</Typography.Text>
                    </Flex>
                );
            },
        },

        {
            title: 'Amount',
            dataIndex: 'amountInINR',
            key: 'amountInINR',
            sorter: false,
            render: (value: any) => `₹ ${formatNumberWithLocalString(value ?? 0)}`,
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            sorter: false,
            render: (value: string) => toTitleCase(value || 'N/A'),
        },

        {
            title: 'Status',
            key: 'bookingStatus',
            render: (_: any, data: any) => {
                const orderResponse = data?.orderResponse ? JSON.parse(data.orderResponse) : null;
                 console.log("orderResponse",orderResponse)
                const bookingStatus = orderResponse?.bookingDetailsResponse?.HotelBookingStatus;

                return (
                    <Flex vertical>
                        <Typography.Text>{formatStatus(bookingStatus)}</Typography.Text>
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
                        // disabled={data?.status !== 'SUCCESS'}
                        size="small"
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
