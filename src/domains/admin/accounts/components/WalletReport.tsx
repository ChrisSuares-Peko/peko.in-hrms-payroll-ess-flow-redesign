import React, { useEffect, useState } from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Pagination, Row, Select, Spin, TableProps } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { DownloadType } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import WalletJournalDrawer from './WalletJournalDrawer';
import { retryWalletTransferJournal } from '../api/walletReport';
import useFilter from '../hooks/useFilter';
import useGetCorporate from '../hooks/useGetCorporate';
import { useWalletReportsApi } from '../hooks/useWalletReport';
import { Reports } from '../types/WalletReportTypes';
import { dateFormat, disabledDate, initialFilters } from '../utils/data';
import { walletReportcolumns } from '../utils/walletReportColumns';

type Props = {};

const WalletReport = (props: Props) => {
    const today = dayjs();
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');

    const localInitialFilters = {
        ...initialFilters,
        from: oneMonthAgoFormatted,
    };

    const [filters, setFilters] = useState(localInitialFilters);
    const [dateLoading, setDateLoading] = useState(false);
    // const [search, setSearch] =useState<string>('')
    const { corporateList, isLoading: CorporateListLoading } = useGetCorporate();

    const { handlePageChange, handleSort, handleChangeCorporate, handleSearch } = useFilter({
        setFilters,
        initalStartDate: filters.from,
        initalEndDate: filters.to,
    });

    const [data, setData] = useState<Reports[] | undefined>([]);
    const [count, setCount] = useState<number | undefined>(0);
    const [dataLoading, setDataLoading] = useState(true);
    const [journalRecord, setJournalRecord] = useState<Reports | null>(null);
    const [retryingJournal, setRetryingJournal] = useState(false);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const {
        data: apiData,
        isLoading,
        count: apiCount,
        downloadReport,
        getWalletReportList,
    } = useWalletReportsApi(
        filters.from,
        filters.to,
        filters.page,
        filters.sort,
        filters.searchText!,
        filters.corporateId,
        filters.sortField
    );

    const { xs } = useScreenSize();

    useEffect(() => {
        setDataLoading(true);
    }, [filters.from, filters.to]);

    useEffect(() => {
        if (!isLoading) {
            setData(apiData);
            setCount(apiCount);
            setDataLoading(false);
        }
    }, [apiData, isLoading, apiCount]);

    const handleDateChangeWithLoading = (dates: any) => {
        if (!dates) return;
        const [fromDate, toDate] = dates;
        setDateLoading(true);
        setFilters(prev => ({
            ...prev,
            from: fromDate.format('YYYY-MM-DD'),
            to: toDate.format('YYYY-MM-DD'),
            page: 1,
        }));
        setTimeout(() => setDateLoading(false), 300); // short delay to allow loader to appear
    };

    const handleFromChangeWithLoading = (date: any) => {
        setDateLoading(true);
        setFilters(prev => ({
            ...prev,
            from: date.format('YYYY-MM-DD'),
            page: 1,
        }));
        setTimeout(() => setDateLoading(false), 300);
    };

    const handleToChangeWithLoading = (date: any) => {
        setDateLoading(true);
        setFilters(prev => ({
            ...prev,
            to: date.format('YYYY-MM-DD'),
            page: 1,
        }));
        setTimeout(() => setDateLoading(false), 300);
    };

    const handleTableChange: TableProps<any>['onChange'] = (pagination, filter, sorter) => {
        let sort;
        let field;

        if (Array.isArray(sorter)) {
            if (sorter.length > 0) {
                ({ field } = sorter[0]);
                sort = sorter[0].order === 'ascend' ? 'ASC' : 'DESC';
            }
        } else if (sorter.order) {
            ({ field } = sorter);
            sort = sorter.order === 'ascend' ? 'ASC' : 'DESC';
        } else {
            setFilters(prevState => ({
                ...prevState,
                sortField: '',
                sort: 'DESC',
                page: 1,
            }));
        }

        if (field) {
            handleSort(field.toString(), sort);
        }
    };

    const handleRetryJournal = async (record: Reports) => {
        setRetryingJournal(true);
        const result = await retryWalletTransferJournal({
            userId: id,
            userType: role,
            id: record.id,
        });
        setRetryingJournal(false);
        if (result && result.success) {
            dispatch(
                showToast({ description: 'Journal retried successfully.', variant: 'success' })
            );
            await getWalletReportList();
            setJournalRecord(current =>
                current ? { ...current, journalRecordStatus: { walletTransfer: true } } : current
            );
        } else {
            dispatch(
                showToast({
                    description: (result && (result.reason || result.error)) || 'Retry failed',
                    variant: 'error',
                })
            );
        }
    };

    return (
        <>
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

                <Flex className="flex-col justify-end gap-3 px-0 md:flex-row">
                    <Flex className="flex-col justify-end gap-2 px-0 md:flex-row">
                        <Input
                            value={filters.searchText}
                            placeholder="Search by Batch/TransactionID"
                            suffix={<SearchOutlined />}
                            onChange={handleSearch}
                            allowClear
                            type="text"
                            variant="outlined"
                            maxLength={100}
                        />
                    </Flex>
                    <Select
                        options={corporateList}
                        placeholder="Select Corporate"
                        showSearch
                        loading={CorporateListLoading}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={handleChangeCorporate}
                        allowClear
                        className="w-full md:w-auto min-w-52"
                    />
                    <Spin spinning={dateLoading}>
                        {xs ? (
                            <Flex
                                className="w-full sm:w-fit"
                                justify="space-between"
                                align="center"
                            >
                                <DatePicker
                                    onChange={handleFromChangeWithLoading}
                                    format={dateFormat}
                                    defaultValue={dayjs(filters.from, dateFormat)}
                                    disabledDate={disabledDate}
                                />
                                <SwapRightOutlined />
                                <DatePicker
                                    onChange={handleToChangeWithLoading}
                                    format={dateFormat}
                                    defaultValue={dayjs(filters.to, dateFormat)}
                                    disabledDate={disabledDate}
                                />
                            </Flex>
                        ) : (
                            <DatePicker.RangePicker
                                onChange={handleDateChangeWithLoading}
                                format={dateFormat}
                                value={[
                                    dayjs(filters.from, dateFormat),
                                    dayjs(filters.to, dateFormat),
                                ]}
                                disabledDate={disabledDate}
                                className="w-full md:w-auto"
                            />
                        )}
                    </Spin>
                </Flex>
            </Row>
            <GenericTable
                rowKey={record => record.id}
                bordered={false}
                columns={walletReportcolumns(setJournalRecord)}
                dataSource={data}
                onChange={handleTableChange}
                loading={dataLoading}
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
            <WalletJournalDrawer
                open={!!journalRecord}
                record={journalRecord}
                onClose={() => setJournalRecord(null)}
                onRetry={handleRetryJournal}
                retrying={retryingJournal}
            />
        </>
    );
};

export default WalletReport;
