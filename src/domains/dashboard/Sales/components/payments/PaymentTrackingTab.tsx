import React, { useCallback, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Grid, Input, Pagination, Typography } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import PaymentDetails from './PaymentDetails';
import { downloadPaymentReceiptApi } from '../../api/payments';
import { TABLE_HEADER_STYLE } from '../../constants/style';
import usePaymentTracking from '../../hooks/usePaymentTracking';
import getPaymentTrackingColumns, {
    PaymentRow,
} from '../../utils/table_column/paymentTrackingColumns';
import UpdatePaymentStatus from '../collectPayment/recordManual/UpdatePaymentStatus';

const { useBreakpoint } = Grid;

const DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_END_DATE = dayjs();
const DEFAULT_START_DATE = DEFAULT_END_DATE.subtract(1, 'month');

type Props = {
    onPaymentRecorded?: () => void;
};

const PaymentTrackingTab = ({ onPaymentRecorded }: Props = {}) => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editRow, setEditRow] = useState<PaymentRow | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const handleDownloadReceipt = useCallback(async (invoiceId: number) => {
        setDownloadingId(invoiceId);
        const result = await downloadPaymentReceiptApi({ userId, userType, invoiceId });
        const raw = result?.pdfBuffer ?? result?.buffer ?? result;
        let bufferData: number[] | null = null;
        if (Array.isArray(raw?.data)) {
            bufferData = raw.data;
        } else if (raw && typeof raw === 'object') {
            const values = Object.values(raw).filter((v): v is number => typeof v === 'number');
            if (values.length) bufferData = values;
        }
        if (bufferData?.length) {
            const bytes = new Uint8Array(bufferData);
            const blob = new Blob([bytes], { type: result?.fileType || 'application/pdf' });
            saveAs(blob, `receipt-${invoiceId}.pdf`);
        } else {
            dispatch(showToast({ description: 'Failed to download receipt.', variant: 'error' }));
        }
        setDownloadingId(null);
    }, [userId, userType, dispatch]);
    const [filters, setFilters] = useState({
        searchText: '',
        page: 1,
        limit: 5,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: 'createdAt',
        startDate: DEFAULT_START_DATE.format(DATE_FORMAT),
        endDate: DEFAULT_END_DATE.format(DATE_FORMAT),
        status: '',
        paymentMethod: '',
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { rows, total, isLoading, exportingType, handleExport } = usePaymentTracking(filters);

    const handleTableChange = (
        _: unknown,
        tableFilters: Record<string, FilterValue | null>,
        sorter: SorterResult<PaymentRow> | SorterResult<PaymentRow>[]
    ) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        const statusValues = tableFilters?.status as string[] | null;
        const methodValues = tableFilters?.method as string[] | null;
        setFilters(prev => ({
            ...prev,
            sortField: (s?.field as string) || 'date',
            sort: s?.order === 'ascend' ? 'ASC' : 'DESC',
            status: statusValues?.join(',') || '',
            paymentMethod: methodValues?.join(',') || '',
            page: 1,
        }));
    };

    const statusFilter = filters.status ? filters.status.split(',') : undefined;
    const methodFilter = filters.paymentMethod ? filters.paymentMethod.split(',') : undefined;
    const columns = useMemo(
        () => getPaymentTrackingColumns(
            statusFilter,
            methodFilter,
            id => setSelectedId(id),
            handleDownloadReceipt,
            downloadingId
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filters.status, filters.paymentMethod, downloadingId]
    );

    if (selectedId) {
        return <PaymentDetails id={selectedId} onBack={() => setSelectedId(null)} />;
    }

    return (
        <>
            <Flex vertical gap={20}>
                <Flex
                    vertical={isMobile}
                    justify={isMobile ? undefined : 'space-between'}
                    align={isMobile ? 'stretch' : 'center'}
                    gap={isMobile ? 12 : 0}
                >
                    <Typography.Text className="text-lg font-semibold leading-6">
                        Payment Records
                    </Typography.Text>
                    <Flex vertical={isMobile} align={isMobile ? 'stretch' : 'center'} gap={12}>
                        <Flex gap={8}>
                            <Button
                                danger
                                className="rounded-md font-medium"
                                loading={exportingType === 'excel'}
                                onClick={() => handleExport('excel')}
                            >
                                Excel
                            </Button>
                            <Button
                                danger
                                className="rounded-md font-medium"
                                loading={exportingType === 'csv'}
                                onClick={() => handleExport('csv')}
                            >
                                CSV
                            </Button>
                            <Button
                                danger
                                className="rounded-md font-medium"
                                loading={exportingType === 'pdf'}
                                onClick={() => handleExport('pdf')}
                            >
                                PDF
                            </Button>
                        </Flex>
                        <DatePicker.RangePicker
                            className={`h-10 rounded-lg border-[#E4E4E7] ${isMobile ? 'w-full' : ''}`}
                            value={[
                                filters.startDate ? dayjs(filters.startDate, DATE_FORMAT) : null,
                                filters.endDate ? dayjs(filters.endDate, DATE_FORMAT) : null,
                            ]}
                            onChange={(_, dateStrings) =>
                                setFilters(prev => ({
                                    ...prev,
                                    startDate: dateStrings[0] || '',
                                    endDate: dateStrings[1] || '',
                                    page: 1,
                                }))
                            }
                            format={DATE_FORMAT}
                        />
                        <Input
                            prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                            placeholder="Search customers..."
                            value={searchText}
                            onChange={updateSearchText}
                            className={`${isMobile ? 'w-full' : 'w-[260px]'} h-10 rounded-lg border-[#E4E4E7]`}
                        />
                    </Flex>
                </Flex>

                <Flex
                    vertical
                    className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                >
                    <GenericTable
                        dataSource={rows}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        className="w-full"
                        loading={isLoading}
                        onChange={handleTableChange}
                        components={{
                            header: {
                                cell: ({
                                    style,
                                    ...rest
                                }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                    <th {...rest} style={{ ...style, ...TABLE_HEADER_STYLE }} />
                                ),
                            },
                        }}
                    />
                    <Pagination
                        current={filters.page}
                        pageSize={filters.limit}
                        total={total}
                        onChange={(page, pageSize) =>
                            setFilters(prev => ({ ...prev, page, limit: pageSize }))
                        }
                        size="default"
                        showSizeChanger={false}
                        className="justify-end text-end py-4 px-5 [&_.ant-pagination-item-active]:!border-[#42526D] [&_.ant-pagination-item-active_a]:!text-[#42526D]"
                    />
                </Flex>
            </Flex>

            <UpdatePaymentStatus
                open={!!editRow}
                editRow={editRow}
                onClose={() => setEditRow(null)}
                onPaymentSaved={() => {
                    setEditRow(null);
                    onPaymentRecorded?.();
                }}
            />
        </>
    );
};

export default PaymentTrackingTab;
