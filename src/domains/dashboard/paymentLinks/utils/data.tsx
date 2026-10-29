import {
    CopyOutlined,
    ExclamationCircleOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { Button, Flex, Image, message, TableProps, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import PaymentlinkIcon from '../assets/icons/paymentlink.svg';
import { FormState } from '../components/createPaymentLink/CreatePaymentLinkModal.types';
import {
    ENachMandateExecutionListItem,
    ENachMandateListItem,
    OnboardingRecord,
    SettlementRequestRow,
    VirtualAccountStatementApiRow,
    VirtualAccountStatementRow,
    VirtualAccountStatementSummary,
} from '../types/paymentLinkTypes';

interface IData {
    key: string;
    date: string;
    paymentName: string;
    paymentId: string;
    amount: string;
    status: string;
    paymentLink: string;
    action: string;
}

export const columns: TableProps<IData>['columns'] = [
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
    },
    {
        title: 'Payment Name',
        dataIndex: 'paymentName',
        key: 'paymentName',
    },
    {
        title: 'Payment Id',
        dataIndex: 'paymentId',
        key: 'paymentId',
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
    },
    {
        title: 'Payment Link',
        dataIndex: 'paymentLink',
        key: 'paymentLink',
        render: () => (
            <Flex gap="middle">
                <Button danger>Download</Button>
                <CopyOutlined className="text-iconRed" />
            </Flex>
        ),
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        render: () => 'Edit',
    },
];

export const data: IData[] = [
    {
        key: '1',
        date: '2014-12-24 23:12:00',
        paymentName: 'Al Azeez Vendor',
        paymentId: '1703673676590',
        amount: '₹ 160.00',
        status: 'pending',
        paymentLink: '',
        action: '',
    },
    {
        key: '2',
        date: '2014-12-24 23:12:00',
        paymentName: 'Al Ain water Vendor',
        paymentId: '1703673676590',
        amount: '₹ 160.00',
        status: 'pending',
        paymentLink: '',
        action: '',
    },
    {
        key: '3',
        date: '2014-12-24 23:12:00',
        paymentName: 'Oasis',
        paymentId: '1703673676590',
        amount: '₹ 160.00',
        status: 'pending',
        paymentLink: '',
        action: '',
    },
];

export const EXPIRY_OPTIONS = [
    { label: '5 minutes', value: '5m', minutes: 5 },
    { label: '10 minutes', value: '10m', minutes: 10 },
    { label: '1 hour', value: '1h', minutes: 60 },
    { label: '6 hours', value: '6h', minutes: 360 },
    { label: '12 hours', value: '12h', minutes: 720 },
    { label: '24 hours', value: '24h', minutes: 1440 },
];

export const IMAGE_URL_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;

export const convertCanvasToPngBlob = async (canvas: HTMLCanvasElement): Promise<Blob | null> =>
    new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
    });

export const createWhiteBackgroundCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
        return null;
    }
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);
    return { canvas, context };
};

export const loadImage = async (imageSrc: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = document.createElement('img');
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
        image.src = imageSrc;
    });

export const canRenderAsImage = async (source: string): Promise<boolean> => {
    if (!source) {
        return false;
    }

    if (source.startsWith('data:image/')) {
        return true;
    }

    try {
        const response = await fetch(source);
        const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
        if (response.ok && contentType.startsWith('image/')) {
            return true;
        }
    } catch {
        // Fallback to extension heuristic when content-type cannot be read (CORS/network).
    }

    return IMAGE_URL_EXTENSION_REGEX.test(source);
};

// Entity types for NuPay merchant onboarding — values MUST match the backend
// (payment MS: SUPPORTED_ENTITY_TYPES). Drives the required documents in the Documents step.
export const ENTITY_TYPE_OPTIONS = [
    { label: 'Individual', value: 'individual' },
    { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
    { label: 'Partnership', value: 'partnership' },
    { label: 'Private Limited', value: 'private_limited' },
];

// product_type is fixed per service and set by the backend on submit — never a form field.
export const ONBOARDING_PRODUCT_TYPE = 'collection';

export const onboardingSteps = [
    { id: 1, title: 'Activate Service', description: 'Click the button to enable collections' },
    { id: 2, title: 'Complete Onboarding', description: 'Complete the onboarding process' },
    { id: 3, title: 'Share & Collect', description: 'Send payment links to customers' },
];

export const statusCards = [
    {
        key: 'service',
        title: 'Service Status',
        description: 'Activate to start collecting payments from customers',
        status: 'Not Active',
        statusColor: '#FF4D4F',
        statusBg: '#FFF1F0',
        icon: <ExclamationCircleOutlined className="text-[1.3rem] text-[#FF4D4F]" />,
    },
    {
        key: 'gateway',
        title: 'Payment Gateway',
        description: 'Payment gateway unlocks after service is activated',
        status: 'Not Active',
        statusColor: '#FF4D4F',
        statusBg: '#FFF1F0',
        icon: <LockOutlined className="text-[1.3rem] text-[#FF4D4F]" />,
    },
];

export const collectPaymentOptions = [
    {
        icon: <Image src={PaymentlinkIcon} height={30} width={30} />,
        iconBg: '#FFF1F1',
        title: 'Create Payment Link',
        description: 'Share a link to collect payments instantly',
        openModal: 'createLink' as const,
    },
];

export const virtualAccountStatementSummary: VirtualAccountStatementSummary = {
    accountName: 'Peko India Collections',
    virtualAccountNumber: '87234890012456',
    ifsc: 'YESB0000123',
    currentBalance: 348250.75,
};

export const virtualAccountStatementRows: VirtualAccountStatementRow[] = [
    {
        key: 'vas-1',
        dateTime: '2026-04-15T10:12:00+05:30',
        transactionId: 'VA240415001',
        description: 'Customer settlement from payment link',
        type: 'Credit',
        amount: 45000,
        balance: 348250.75,
        status: 'SUCCESS',
    },
    {
        key: 'vas-2',
        dateTime: '2026-04-15T09:05:00+05:30',
        transactionId: 'VA240415002',
        description: 'Vendor refund transfer',
        type: 'Debit',
        amount: 12500,
        balance: 303250.75,
        status: 'SUCCESS',
    },
    {
        key: 'vas-3',
        dateTime: '2026-04-14T18:22:00+05:30',
        transactionId: 'VA240414003',
        description: 'UPI collect settlement',
        type: 'Credit',
        amount: 27500,
        balance: 315750.75,
        status: 'SUCCESS',
    },
    {
        key: 'vas-4',
        dateTime: '2026-04-14T15:40:00+05:30',
        transactionId: 'VA240414004',
        description: 'Scheduled payout in progress',
        type: 'Debit',
        amount: 18000,
        balance: 297750.75,
        status: 'PENDING',
    },
    {
        key: 'vas-5',
        dateTime: '2026-04-13T13:15:00+05:30',
        transactionId: 'VA240413005',
        description: 'Dynamic QR collection',
        type: 'Credit',
        amount: 9200,
        balance: 315750.75,
        status: 'SUCCESS',
    },
    {
        key: 'vas-6',
        dateTime: '2026-04-13T11:00:00+05:30',
        transactionId: 'VA240413006',
        description: 'Beneficiary transfer retry',
        type: 'Debit',
        amount: 6400,
        balance: 306550.75,
        status: 'FAILED',
    },
];

export const settlementRequestRows: SettlementRequestRow[] = [
    {
        key: 'sr-1',
        requestedOn: '2026-04-15T11:10:00+05:30',
        requestId: 'SRQ2404151110001',
        amount: 28000,
        remarks: 'Weekly vendor payout batch',
        status: 'PENDING',
    },
    {
        key: 'sr-2',
        requestedOn: '2026-04-14T17:35:00+05:30',
        requestId: 'SRQ2404141735002',
        amount: 50000,
        remarks: 'Settlement request for marketplace collections',
        status: 'SUCCESS',
    },
    {
        key: 'sr-3',
        requestedOn: '2026-04-13T14:20:00+05:30',
        requestId: 'SRQ2404131420003',
        amount: 15500,
        remarks: 'Ad hoc withdrawal to operating account',
        status: 'PENDING',
    },
    {
        key: 'sr-4',
        requestedOn: '2026-04-12T10:05:00+05:30',
        requestId: 'SRQ2404121005004',
        amount: 22000,
        remarks: 'Partner settlement retry request',
        status: 'FAILED',
    },
];

export const statusColorMap: Record<string, string> = {
    completed: 'green',
    success: 'green',
    pending: 'orange',
    in_progress: 'blue',
    processing: 'blue',
    failed: 'red',
};

export const getStatusColor = (status: string) =>
    statusColorMap[status?.toLowerCase()] ?? 'default';

export const getStatusLabel = (status: string) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'in_progress' || s === 'processing') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export const MAX_EXPIRY_MINUTES = 24 * 60;

export const defaultForm: FormState = {
    amount: '',
    purposeMessage: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
};

export const formatAmount = (amount?: number) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;

export const transactionTypeConfig: Record<string, { color: string; bg: string }> = {
    Credit: { color: '#027A48', bg: '#ECFDF3' },
    Debit: { color: '#B42318', bg: '#FEF3F2' },
};

export const settlementStatusConfig: Record<SettlementRequestRow['status'], { label: string; color: string; bg: string }> = {
    SUCCESS: { label: 'Successful', color: '#16A34A', bg: '#F0FDF4' },
    PENDING: { label: 'Pending', color: '#D97706', bg: '#FFFBEB' },
    FAILED: { label: 'Failed', color: '#DC2626', bg: '#FEF2F2' },
};

export const statementColumns: ColumnsType<VirtualAccountStatementApiRow> = [
    {
        title: 'Date & Time',
        dataIndex: 'dateTime',
        key: 'dateTime',
        width: 200,
        render: value => (
            <Typography.Text className="text-sm text-gray-500">
                {value ? dayjs(value).format('MMM D, YYYY [at] h:mm A') : '—'}
            </Typography.Text>
        ),
    },
    {
        title: 'Transaction ID',
        dataIndex: 'transactionId',
        key: 'transactionId',
        width: 160,
        render: value => <Typography.Text className="text-sm font-medium">{value ?? '—'}</Typography.Text>,
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        width: 240,
        render: value => (
            <Typography.Text className="text-sm text-[#344054]">{value ?? '—'}</Typography.Text>
        ),
    },
    {
        title: 'Payer',
        dataIndex: 'payerName',
        key: 'payerName',
        width: 160,
        render: value => (
            <Typography.Text className="text-sm text-[#344054]">{value ?? '—'}</Typography.Text>
        ),
    },
    {
        title: 'Mode',
        dataIndex: 'paymentMode',
        key: 'paymentMode',
        width: 100,
        render: value => (
            <Typography.Text className="text-sm text-[#344054]">{value ?? '—'}</Typography.Text>
        ),
    },
    {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        render: value => {
            if (!value) return <Typography.Text className="text-sm">—</Typography.Text>;
            const config = transactionTypeConfig[value] ?? { color: '#344054', bg: '#F2F4F7' };
            return (
                <Tag
                    style={{
                        color: config.color,
                        background: config.bg,
                        border: 'none',
                        borderRadius: 999,
                        fontWeight: 500,
                    }}
                >
                    {value}
                </Tag>
            );
        },
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 130,
        align: 'right',
        render: value => (
            <Typography.Text className="text-sm font-medium">
                {value != null ? formatAmount(value) : '—'}
            </Typography.Text>
        ),
    },
];

export const settlementRequestColumns: ColumnsType<SettlementRequestRow> = [
    {
        title: 'Requested On',
        dataIndex: 'requestedOn',
        key: 'requestedOn',
        width: 200,
        render: value => (
            <Typography.Text className="text-sm text-gray-500">
                {dayjs(value).format('MMM D, YYYY [at] h:mm A')}
            </Typography.Text>
        ),
    },
    {
        title: 'Request ID',
        dataIndex: 'requestId',
        key: 'requestId',
        width: 170,
        render: value => <Typography.Text className="text-sm font-medium">{value}</Typography.Text>,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        align: 'right',
        render: value => <Typography.Text className="text-sm font-medium">{formatAmount(value)}</Typography.Text>,
    },
    {
        title: 'Remarks',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 280,
        render: value => <Typography.Text className="text-sm text-[#344054]">{value}</Typography.Text>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: value => {
            const config = settlementStatusConfig[value as SettlementRequestRow['status']];
            return (
                <Tag
                    style={{
                        color: config.color,
                        background: config.bg,
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 500,
                    }}
                >
                    {config.label}
                </Tag>
            );
        },
    },
];

export const getStatusColorEnachMandate = (status?: string) => {
    const value = String(status || '').toUpperCase();
    if (value === 'DONE') return { color: '#16A34A', bg: '#F0FDF4' };
    if (value === 'NOT_DONE') return { color: '#DC2626', bg: '#FEF2F2' };
    if (value === 'NOT_INITIATED') return { color: '#6B7280', bg: '#F3F4F6' };
    if (value === 'ACTIVE' || value === 'SUCCESS') return { color: '#16A34A', bg: '#F0FDF4' };
    if (
        value === 'INITIATED' ||
        value === 'PENDING' ||
        value === 'CANCELLATION_PENDING' ||
        value === 'PAUSE_PENDING' ||
        value === 'UNPAUSE_PENDING'
    )
        return { color: '#D97706', bg: '#FFFBEB' };
    if (value === 'FAILED' || value === 'REJECTED' || value === 'FAILURE' || value === 'ERROR')
        return { color: '#DC2626', bg: '#FEF2F2' };
    if (value === 'PAUSED') return { color: '#7C3AED', bg: '#F5F3FF' };
    if (value === 'CANCELLED' || value === 'CANCELED') return { color: '#6B7280', bg: '#F3F4F6' };
    return { color: '#374151', bg: '#F3F4F6' };
};

export const columnsEnachMandate: TableProps<ENachMandateListItem>['columns'] = [
    {
        title: 'Customer Name',
        dataIndex: 'customer_name',
        key: 'customer_name',
        width: 180,
        render: value => (
            <Typography.Text className="text-sm font-medium">{value || '-'}</Typography.Text>
        ),
    },
    {
        title: 'Customer Email',
        dataIndex: 'customer_email',
        key: 'customer_email',
        width: 180,
        render: value => (
            <Typography.Text className="text-sm font-medium">{value || '-'}</Typography.Text>
        ),
    },
    {
        title: 'Phone',
        dataIndex: 'customer_phone',
        key: 'customer_phone',
        width: 140,
        render: value => <Typography.Text className="text-sm">{value || '-'}</Typography.Text>,
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        render: value => (
            <Typography.Text className="text-sm font-medium">{formatAmount(value)}</Typography.Text>
        ),
    },
    {
        title: 'Frequency',
        dataIndex: 'frequency',
        key: 'frequency',
        width: 120,
        render: value => (
            <Typography.Text className="text-sm capitalize">{value || '-'}</Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (_, record) => {
            const value = record?.status || '-';
            const cfg = getStatusColorEnachMandate(value);
            return (
                <Tag
                    style={{
                        color: cfg.color,
                        background: cfg.bg,
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 500,
                    }}
                >
                    {value || '-'}
                </Tag>
            );
        },
    },
];

export const EXECUTION_PAGE_SIZE = 5;
export const DEBIT_DATE_VALIDATION_MESSAGE =
    'Debit date should have at least 2 days gap from the mandate start date. Please provide a valid Debit date. Hint: debit_date(string), format: yyyy-mm-dd';
export const MANAGE_AND_INITIATE_LOCKED_STATUSES = new Set([
    'REJECTED',
    'CANCELLED',
    'CANCELED',
    'CANCELLATION_PENDING',
]);

export const paymentColumns: ColumnsType<ENachMandateExecutionListItem> = [
    {
        title: 'Payment Date',
        dataIndex: 'payment_date',
        key: 'payment_date',
        render: value => (value ? dayjs(value).format('DD MMM YYYY, hh:mm A') : '-'),
    },
    {
        title: 'Processed / Failed Date',
        dataIndex: 'processed_or_failed_at',
        key: 'processed_or_failed_at',
        render: value => (value ? dayjs(value).format('DD MMM YYYY, hh:mm A') : '-'),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: value => formatAmount(Number(value || 0)),
    },
    {
        title: 'Current Status',
        dataIndex: 'status',
        key: 'status',
        render: value => {
            const cfg = getStatusColorEnachMandate(value);
            return (
                <Tag
                    style={{
                        color: cfg.color,
                        background: cfg.bg,
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 500,
                    }}
                >
                    {String(value || '-').toUpperCase()}
                </Tag>
            );
        },
    },
];

// expires_at must be a positive integer (hours) per backend validation
export const expiryOptions = [
    { value: 1, label: '1 Hour' },
    { value: 2, label: '2 Hours' },
    { value: 6, label: '6 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' },
];

export const howItWorks = [
    'Customer receives a notification in their UPI app',
    'They can approve or decline the payment request',
    "You'll be notified instantly when the payment is completed",
];

export const useCases = [
    { title: 'Monthly Services', description: 'Recurring service fees and retainers' },
    { title: 'Subscriptions', description: 'Software, memberships, and plans' },
    { title: 'EMIs', description: 'Equated monthly installment payments' },
];

export interface BankDetailItem {
    label: string;
    value: string;
}

export const getVirtualAccountStatementDetails = (): BankDetailItem[] => [
    { label: 'Account Name', value: virtualAccountStatementSummary.accountName },
    { label: 'Virtual Account Number', value: virtualAccountStatementSummary.virtualAccountNumber },
    { label: 'IFSC Code', value: virtualAccountStatementSummary.ifsc },
];

export const getBankDetails = (bankDetailsData?: OnboardingRecord | null): BankDetailItem[] => [
    { label: 'Account Name', value: bankDetailsData?.businessName || 'Peko India - Demo Business' },
    {
        label: 'Account Number',
        value:
            bankDetailsData?.virtualAccountNumber ||
            bankDetailsData?.accountNumber ||
            '3024567890123456',
    },
    {
        label: 'IFSC Code',
        value: bankDetailsData?.virtualIfsc || bankDetailsData?.ifsc || 'HDFC0001234',
    },
    { label: 'Branch', value: 'Virtual Account Branch' },
];

export const transferMethods = [
    {
        name: 'NEFT',
        description: 'National Electronic Funds Transfer (typically processed in batches)',
    },
    { name: 'RTGS', description: 'Real Time Gross Settlement (instant, minimum ₹2 lakh)' },
    { name: 'IMPS', description: 'Immediate Payment Service (instant, 24x7)' },
];

export const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    message.success('Copied to clipboard');
};

export const copyAllDetails = (bankDetails: BankDetailItem[]) => {
    const text = bankDetails.map(d => `${d.label}: ${d.value}`).join('\n');
    navigator.clipboard.writeText(text);
    message.success('All details copied');
};

export const shareViaWhatsApp = (bankDetails: BankDetailItem[]) => {
    const lines = bankDetails.map(d => `${d.label}: ${d.value}`);
    const text = `Bank Transfer Details\n${lines.join('\n')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};
