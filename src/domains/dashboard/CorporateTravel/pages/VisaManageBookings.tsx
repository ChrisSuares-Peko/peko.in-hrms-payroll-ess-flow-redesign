import { useCallback, useEffect, useState } from 'react';

import {
    Button,
    DatePicker,
    Flex,
    Pagination,
    Skeleton,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import '../assets/visaManageBookings.css';

import { listVisaBookings } from '../api/visa';

const { RangePicker } = DatePicker;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
    // new / submitted
    'new':                       { bg: '#EFF6FF', text: '#3B82F6' },
    'application created':       { bg: '#EFF6FF', text: '#3B82F6' },
    'submitted':                 { bg: '#EFF6FF', text: '#3B82F6' },
    // documents
    'documents pending':         { bg: '#FFF7ED', text: '#F97316' },
    'pending documents':         { bg: '#FFF7ED', text: '#F97316' },
    'documents under review':    { bg: '#EFF6FF', text: '#3B82F6' },
    'under review':              { bg: '#EFF6FF', text: '#3B82F6' },
    'documents verified':        { bg: '#EBFFE7', text: '#26A411' },
    // in-progress
    'processing':                { bg: '#F5F3FF', text: '#7C3AED' },
    'pickup scheduled':          { bg: '#FFF7ED', text: '#F97316' },
    'ready for pickup':          { bg: '#FFF7ED', text: '#F97316' },
    'embassy submission':        { bg: '#EFF6FF', text: '#3B82F6' },
    'appointment booked':        { bg: '#EFF6FF', text: '#3B82F6' },
    'embassy visit':             { bg: '#F5F3FF', text: '#7C3AED' },
    // approved / issued / delivered
    'visa issued':               { bg: '#EBFFE7', text: '#26A411' },
    'visa stamped':              { bg: '#EBFFE7', text: '#26A411' },
    'visa approved':             { bg: '#EBFFE7', text: '#26A411' },
    'approved':                  { bg: '#EBFFE7', text: '#26A411' },
    'documents returned':        { bg: '#EBFFE7', text: '#26A411' },
    'visa delivered':            { bg: '#EBFFE7', text: '#26A411' },
    'delivered':                 { bg: '#EBFFE7', text: '#26A411' },
    // rejected
    'rejected':                  { bg: '#FFF4F3', text: '#D7341E' },
    'visa rejected':             { bg: '#FFF4F3', text: '#D7341E' },
    'documents rejected':        { bg: '#FFF4F3', text: '#D7341E' },
};

const FORMAT_CONFIG: Record<string, { bg: string; text: string }> = {
    evisa:      { bg: '#EDE9FE', text: '#6D28D9' },
    'stamp visa': { bg: '#F1F5F9', text: '#334155' },
};

const StatusBadge = ({ value }: { value: string }) => {
    const key = value?.toLowerCase() ?? '';
    const config = STATUS_CONFIG[key] ?? { bg: '#F3F4F6', text: '#6B7280' };
    return (
        <Typography.Text
            style={{
                backgroundColor: config.bg,
                color: config.text,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
            }}
        >
            {value}
        </Typography.Text>
    );
};

const FormatBadge = ({ value }: { value: string }) => {
    const key = value?.toLowerCase() ?? '';
    const config = FORMAT_CONFIG[key] ?? { bg: '#F3F4F6', text: '#6B7280' };
    return (
        <Typography.Text
            style={{
                backgroundColor: config.bg,
                color: config.text,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
            }}
        >
            {value}
        </Typography.Text>
    );
};

// ─── Table columns ────────────────────────────────────────────────────────────

const buildColumns = (navigate: ReturnType<typeof useNavigate>) => [
    {
        title: 'Name / Email',
        dataIndex: 'employee',
        key: 'employee',
        width: 200,
        render: (_: any, record: any) => (
            <Flex vertical gap={2}>
                <Typography.Text style={{ fontSize: 14, fontWeight: 500, color: '#191C1F' }}>
                    {record.employeeName}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, color: '#5F6C72' }}>
                    {record.employeeEmail}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Travel Date',
        dataIndex: 'travelDate',
        key: 'travelDate',
        width: 150,
        render: (val: string) => (
            <Typography.Text style={{ fontSize: 14, color: '#191C1F' }}>
                {val ? dayjs(val).format('DD MMM YYYY') : '—'}
            </Typography.Text>
        ),
    },
    {
        title: 'Destination',
        dataIndex: 'destination',
        key: 'destination',
        width: 160,
        render: (val: string) => (
            <Typography.Text style={{ fontSize: 14, color: '#191C1F' }}>{val ?? '—'}</Typography.Text>
        ),
    },
    {
        title: 'Visa Type',
        dataIndex: 'visaType',
        key: 'visaType',
        width: 130,
        render: (val: string) => (
            <Typography.Text style={{ fontSize: 14, color: '#191C1F' }}>{val ?? '—'}</Typography.Text>
        ),
    },
    {
        title: 'Format',
        dataIndex: 'format',
        key: 'format',
        width: 130,
        render: (val: string) => val ? <FormatBadge value={val} /> : <Typography.Text>—</Typography.Text>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 170,
        render: (val: string) => val ? <StatusBadge value={val} /> : <Typography.Text>—</Typography.Text>,
    },
    {
        title: 'View',
        key: 'view',
        width: 90,
        render: (_: any, record: any) => (
            <Button
                type="text"
                style={{ color: '#FF4F4F', fontWeight: 500, padding: '0 8px', cursor: 'pointer' }}
                onClick={() =>
                    navigate(
                        `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.visaTracking}/${record.orderNumber}`
                    )
                }
            >
                View
            </Button>
        ),
    },
];

// ─── Data mapper ──────────────────────────────────────────────────────────────

const mapToRow = (item: any, index: number) => ({
    key: item.id ?? index,
    orderNumber: item.order_number ?? item.orderNumber ?? item.id ?? '—',
    employeeName: item.employee
        ?? (item.applicants?.[0]
            ? `${item.applicants[0].first_name} ${item.applicants[0].last_name}`.trim()
            : null)
        ?? '—',
    employeeEmail: item.credential?.email ?? item.customer_email ?? '—',
    travelDate: item.travelDate ?? item.travel_date ?? null,
    destination: item.destination ?? item.visiting_country ?? '—',
    visaType: item.visaCategory ?? '—',
    format: item.visaFormat ?? item.visa_format ?? null,
    status: item.frontend_status ?? item.applicationStatus ?? '—',
});

// ─── Component ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const VisaManageBookings = () => {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const columns = buildColumns(navigate);

    const defaultFrom = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
    const defaultTo = dayjs().format('YYYY-MM-DD');

    const [fromDate, setFromDate] = useState(defaultFrom);
    const [toDate, setToDate] = useState(defaultTo);
    const [dateError, setDateError] = useState('');
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const resp = await listVisaBookings({
            userType: role,
            userId: id,
            page,
            limit: ITEMS_PER_PAGE,
            from: fromDate,
            to: toDate,
        });
        if (resp) {
            const list = Array.isArray(resp) ? resp : resp.data ?? [];
            const count = (resp as any).total ?? list.length;
            setRows(list.map(mapToRow));
            setTotal(count);
        }
        setIsLoading(false);
    }, [role, id, page, fromDate, toDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [fromDate, toDate]);

    return (
        <Flex vertical gap={0} className="w-full">
            {/* Header row */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-5">
                <Typography.Paragraph
                    style={{ margin: 0, fontSize: 18, fontWeight: 500, color: '#191C1F' }}
                    className="py-1"
                >
                    Track Visa Status
                </Typography.Paragraph>

                <Flex gap={12} align="center" wrap="wrap">
                    <Flex vertical gap={4}>
                        <RangePicker
                            value={[dayjs(fromDate), dayjs(toDate)]}
                            format="YYYY-MM-DD"
                            status={dateError ? 'error' : undefined}
                            onChange={dates => {
                                if (dates?.[0] && dates?.[1]) {
                                    const from = dates[0];
                                    const to = dates[1];
                                    if (to.isBefore(from)) {
                                        setDateError('End date cannot be before start date');
                                        return;
                                    }
                                    if (to.diff(from, 'month', true) > 12) {
                                        setDateError('Date range cannot exceed 12 months');
                                        return;
                                    }
                                    setDateError('');
                                    setFromDate(from.format('YYYY-MM-DD'));
                                    setToDate(to.format('YYYY-MM-DD'));
                                }
                            }}
                            className="h-9"
                        />
                        {dateError && (
                            <Typography.Text style={{ color: '#ff4d4f', fontSize: 12 }}>{dateError}</Typography.Text>
                        )}
                    </Flex>
                </Flex>
            </Flex>

            {/* Table */}
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <div className="visa-status-table" style={{ overflowX: 'auto' }}>
                    <GenericTable
                        columns={columns}
                        dataSource={rows}
                        loading={false}
                        bordered={false}
                        rowExpandable
                    />
                </div>
            )}

            {/* Pagination */}
            {total > ITEMS_PER_PAGE && (
                <Pagination
                    current={page}
                    pageSize={ITEMS_PER_PAGE}
                    total={total}
                    size="small"
                    onChange={setPage}
                    className="sm:text-end text-center mt-10"
                />
            )}
        </Flex>
    );
};

export default VisaManageBookings;
