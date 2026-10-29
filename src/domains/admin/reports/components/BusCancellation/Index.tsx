import { useState } from 'react';

import { Button, Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { snakeCaseToSentenceCase, toTitleCase } from '@utils/wordFormat';

import { calculateBusRefundAmount } from './busCancellationUtils';
import Header from './Header';
import RefundModal from './RefundModal';
import useBusCancellation from '../../hooks/bus/useBusCancellation';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import useGetPartnerDatas from '../../hooks/usePartnersForCorporate';

const BusCancellation = () => {
    const today = dayjs();
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<any>();

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
    } = useBusCancellation(filters);

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
            key: 'credential',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>{data?.credential?.name}</Typography.Text>
                    <Typography.Text>{data?.credential?.username}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction ID',
            sorter: false,
            dataIndex: ['order', 'corporateTxnId'],
            key: 'corporateTxnId',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.order?.corporateTxnId ?? '-'}</Typography.Text>
            ),
        },
        {
            title: 'Route',
            sorter: false,
            dataIndex: ['tripDetails', 'sourceCity'],
            key: 'route',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>
                        {data?.tripDetails?.sourceCity ?? '-'} → {data?.tripDetails?.destinationCity ?? '-'}
                    </Typography.Text>
                    {data?.tripDetails?.doj && (
                        <Typography.Text type="secondary">
                            {formattedDateOnly(new Date(data.tripDetails.doj))}
                        </Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Amount',
            sorter: false,
            dataIndex: ['order', 'amountInINR'],
            key: 'amountInINR',
            render: (_: any, data: any) => (
                <Flex vertical>
                    <Typography.Text>
                        ₹ {formatNumberWithLocalString(data?.order?.amountInINR)}
                    </Typography.Text>
                    <Typography.Text>{toTitleCase(data?.order?.paymentMode || 'N/A')}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Refund Amount',
            sorter: false,
            dataIndex: 'refundedAmount',
            key: 'refundedAmount',
            render: (_: any, data: any) => {
                const refunded = data?.refundedAmount;
                if (refunded != null) {
                    return <Typography.Text>₹ {formatNumberWithLocalString(refunded)}</Typography.Text>;
                }
                const calculated = calculateBusRefundAmount(
                    data?.order?.amountInINR,
                    data?.cancellationPolicy,
                    data?.tripDetails?.doj,
                    data?.tripDetails?.pickUpTime
                );
                return (
                    <Typography.Text>
                        {calculated > 0 ? `₹ ${formatNumberWithLocalString(calculated)}` : 'N/A'}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Status',
            sorter: false,
            dataIndex: ['order', 'status'],
            key: 'status',
            render: (_: any, data: any) => (
                <Typography.Text>{snakeCaseToSentenceCase(data?.order?.status || '')}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            sorter: false,
            dataIndex: 'id',
            key: 'action',
            render: (_: any, data: any) => {
                const status = data?.order?.status;
                const paymentMode = data?.order?.paymentMode;
                const isRefunded = status === 'REFUNDED';
                const isWallet = paymentMode === 'WALLET';
                const isDisabled = isRefunded || isWallet;

                return (
                    <Button
                        type="default"
                        size="small"
                        disabled={isDisabled}
                        onClick={() => {
                            setOpenModal(true);
                            setModalData(data);
                        }}
                        danger
                    >
                        Refund
                    </Button>
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
                rowKey={record => record.id ?? record.corporateTxnId}
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

export default BusCancellation;
