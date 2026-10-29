import { useEffect, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Grid, Input, Pagination, Typography } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import { getProfileCompanyApi } from '../../api/settings';
import { TABLE_HEADER_STYLE } from '../../constants/style';
import useInvoicePayments, { InvoicePaymentsFilters } from '../../hooks/useInvoicePayments';
import { InvoicePaymentRow, ManualPaymentRecord } from '../../types/CollectPayment';
import getInvoicePaymentsColumns from '../../utils/table_column/invoicePaymentsColumns';
import PaymentReceiptModal, { ReceiptContext } from '../documentDetails/PaymentReceiptModal';

const { useBreakpoint } = Grid;

const DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_END_DATE = dayjs();
const DEFAULT_START_DATE = DEFAULT_END_DATE.subtract(1, 'month');

const InvoicePaymentsTab = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const [billerName, setBillerName] = useState('');
    const [selectedRow, setSelectedRow] = useState<InvoicePaymentRow | null>(null);

    useEffect(() => {
        getProfileCompanyApi({ userId, userType }).then(company => {
            if (company) setBillerName(company.name || '');
        });
    }, [userId, userType]);

    const [filters, setFilters] = useState<InvoicePaymentsFilters>({
        searchText: '',
        page: 1,
        limit: 5,
        sort: 'DESC',
        sortField: 'paymentDate',
        startDate: DEFAULT_START_DATE.format(DATE_FORMAT),
        endDate: DEFAULT_END_DATE.format(DATE_FORMAT),
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const {
        rows,
        total,
        isLoading,
        downloadReceipt,
        shareReceipt,
        downloadingId,
        sharingId,
    } = useInvoicePayments(filters);

    const handleTableChange = (
        _: unknown,
        __: Record<string, FilterValue | null>,
        sorter: SorterResult<InvoicePaymentRow> | SorterResult<InvoicePaymentRow>[]
    ) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        setFilters(prev => ({
            ...prev,
            sortField: (s?.field as string) || 'paymentDate',
            sort: s?.order === 'ascend' ? 'ASC' : 'DESC',
            page: 1,
        }));
    };

    const columns = useMemo(
        () => getInvoicePaymentsColumns(row => setSelectedRow(row)),
        []
    );

    const selectedPayment: ManualPaymentRecord | null = selectedRow
        ? {
              id: selectedRow.paymentId,
              invoiceId: selectedRow.invoiceId,
              amount: selectedRow.amount,
              paymentMethod: selectedRow.paymentMethod,
              paymentDate: selectedRow.paymentDate,
              referenceId: selectedRow.referenceId,
              notes: selectedRow.notes,
              isDeleted: false,
              receiptNo: selectedRow.receiptNo,
          }
        : null;

    const receiptContext: ReceiptContext = {
        documentNo: selectedRow ? `${selectedRow.prefix ?? ''}${selectedRow.invoiceNumber}` : '',
        currency: selectedRow?.currency ?? 'INR',
        customerName: selectedRow?.customerName ?? '',
        customerEmail: selectedRow?.customerEmail ?? '',
        customerPhone: selectedRow?.customerPhone ?? '',
        billerName,
    };

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
                        Invoice Payments
                    </Typography.Text>
                    <Flex vertical={isMobile} align={isMobile ? 'stretch' : 'center'} gap={12}>
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
                            placeholder="Search invoice number, amount, method..."
                            value={searchText}
                            onChange={updateSearchText}
                            className={`${isMobile ? 'w-full' : 'w-[300px]'} h-10 rounded-lg border-[#E4E4E7]`}
                        />
                    </Flex>
                </Flex>

                <Flex
                    vertical
                    className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                >
                    <GenericTable
                        dataSource={rows.map(row => ({ ...row, key: row.paymentId }))}
                        columns={columns}
                        rowKey="paymentId"
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

            <PaymentReceiptModal
                open={!!selectedRow}
                payment={selectedPayment}
                context={receiptContext}
                onShare={paymentId => shareReceipt(selectedRow?.invoiceId ?? 0, paymentId)}
                sharing={sharingId === selectedRow?.paymentId}
                onDownload={paymentId => downloadReceipt(selectedRow?.invoiceId ?? 0, paymentId)}
                downloading={downloadingId === selectedRow?.paymentId}
                onClose={() => setSelectedRow(null)}
            />
        </>
    );
};

export default InvoicePaymentsTab;
