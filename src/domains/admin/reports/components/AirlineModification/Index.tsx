import React, { useState } from 'react';

import { Button, Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounce from '@src/hooks/useDebounce';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { snakeCaseToSentenceCase } from '@utils/wordFormat';

import Header from './Header';
import useAirlineModification from '../../hooks/airline/useAirlineModification';
import useFilter from '../../hooks/useFilter';
import useGetCorporateDatas from '../../hooks/useGetCorporateDatas';
import useGetPartnerDatas from '../../hooks/usePartnersForCorporate';

const AirlineModification = () => {
    const navigate = useNavigate();
    const today = dayjs();
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
    const { isLoading, tableData, count, downloadReport } = useAirlineModification(filters);
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
            title: 'Created Date',
            sorter: true,
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
            sorter: true,
            dataIndex: ['transaction', 'corporateTxnId'],
            key: 'transactionId',
            render: (_: any, data: any) => (
                <Typography.Text>
                    {data?.transaction?.corporateTxnId ||
                        data?.flightBooking?.transaction?.corporateTxnId}
                </Typography.Text>
                // new transaction id OR old booking transaction id
            ),
        },
        {
            title: 'Confirmation Number',
            sorter: false,
            dataIndex: 'flightBooking.bookingReferenceId',
            key: 'flightBooking.bookingReferenceId',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.flightBooking?.bookingReferenceId}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            sorter: false,
            dataIndex: 'modificationStatus',
            key: 'modificationStatus',
            render: (modificationStatus: any, data: any) => (
                <Typography.Text>{snakeCaseToSentenceCase(modificationStatus)}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            dataIndex: 'id',
            key: 'id',
            render: (id: any) => (
                <Flex gap="middle">
                    <Button
                        // disabled={!accessPermission?.update}
                        onClick={() => {
                            // if (accessPermission?.update) {
                            navigate(
                                `${paths.reportsAdmin.AirlineModification.modificationRequest}?request=${id}`
                            );
                            // }
                        }}
                        danger
                    >
                        View Request
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
        </Flex>
    );
};

export default AirlineModification;
