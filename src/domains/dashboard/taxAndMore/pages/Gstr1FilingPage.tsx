/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CheckCircleFilled,
    CheckCircleOutlined,
    CheckOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
    LockOutlined,
    PlusOutlined,
    ReloadOutlined,
    SyncOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Button, Flex, Form, Modal, Select, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Formik, Form as FormikForm, useFormikContext } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';

import CheckboxInput from '@src/components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import RadioGroupInput from '@src/components/atomic/inputs/RadioGroupInput';
import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    addAmendments,
    addGstr1Document,
    addGstr1HsnManual,
    addSalesInvoices,
    deleteAmendment,
    deleteGstr1Document,
    deleteGstr1HsnManual,
    deleteSalesInvoice,
    generateGstrEvcOtp,
    updateSalesInvoice,
} from '../api/tax';
import InvoiceCsvUploadModal from '../components/InvoiceCsvUploadModal';
import useGstr1 from '../hooks/useGstr1';
import useGstSetup from '../hooks/useGstSetup';
import {
    advancesSchema,
    amendmentSchema,
    b2bFormSchema,
    b2cLargeSchema,
    b2cSmallSchema,
    cdnrSchema,
    cdnurSchema,
    documentsSchema,
    exportsSchema,
    hsnSchema,
    panSchema,
} from '../schema';
import { setFinancialYear } from '../slice/taxMoreSlice';
import {
    AddSalesInvoiceItem,
    AmendmentRow,
    AmendType,
    B2BRow,
    DocumentRow,
    Gstr1Amendments,
    Gstr1MonthStatus,
    Gstr1PortalSummary,
    Gstr1Summary,
    GstrMonth,
    HsnSummaryRow,
    SalesInvoiceRow,
} from '../types';
import {
    AMEND_SUBTITLES,
    AMENDMENT_TABS,
    AmendTabKey,
    B2C_SUBTITLES,
    B2C_TABS,
    B2CTabKey,
    buildEmptyMonths,
    buildGstrMonths,
    defaultNilExempt,
    DOC_TYPES,
    CDNUR_SUPPLY_TYPE_OPTIONS,
    EXPORT_TYPE_OPTIONS,
    GSTR1_STEPS,
    INDIAN_STATES,
    FINANCIAL_YEARS,
    MONTH_LABELS,
    MONTH_LABELS_SHORT,
    NIL_EXEMPT_ROWS,
    NilExemptField,
    NilExemptKey,
    NilExemptValues,
    NOTE_TYPE_OPTIONS,
    PLACE_OF_SUPPLY_OPTIONS,
    TAX_RATE_OPTIONS,
    TAX_RATES,
    UQC_OPTIONS,
} from '../utils/data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        n
    );
const fmtC = (n: number) => `₹${fmt(n)}`;
const RUPEE_PREFIX = <span style={{ color: 'currentColor' }}>₹</span>;

// ─── Shared sub-components ────────────────────────────────────────────────────

const InfoBanner = ({ text, icon = 'info' }: { text: string; icon?: 'info' | 'warn' }) => (
    <Flex
        gap={8}
        align="center"
        className="rounded-lg px-4 py-3 border"
        style={{
            backgroundColor: icon === 'warn' ? '#f0f9ff' : '#f0f9ff',
            borderColor: icon === 'warn' ? '#bae6fd' : '#bae6fd',
        }}
    >
        <InfoCircleOutlined style={{ color: '#0ea5e9', fontSize: 13, flexShrink: 0 }} />
        <Typography.Text className="text-xs text-[#0369a1]">{text}</Typography.Text>
    </Flex>
);

const NavButtons = ({
    step,
    onBack,
    onNext,
    nextDisabled,
    nextLabel,
}: {
    step: number;
    onBack: () => void;
    onNext: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
}) => (
    <Flex align="center" justify="space-between" style={{ marginTop: 8 }}>
        {step === 1 ? (
            <span />
        ) : (
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                style={{ height: 48, width: 152, borderColor: '#cbd5e1', color: '#475569' }}
            >
                Back
            </Button>
        )}
        <Button
            type="primary"
            danger
            onClick={onNext}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            style={{ height: 48, width: 152 }}
            disabled={nextDisabled || step === 8}
        >
            {nextLabel ?? 'Next'}
        </Button>
    </Flex>
);

function SubTabBar<T extends string>({
    tabs,
    active,
    counts,
    onChange,
}: {
    tabs: readonly { key: T; label: string }[];
    active: T;
    counts?: Record<string, number>;
    onChange: (key: T) => void;
}) {
    return (
        <div className="border-b border-[#e2e8f0] overflow-x-auto">
            <Flex gap={0} style={{ minWidth: 'max-content' }}>
                {tabs.map(tab => {
                    const isActive = tab.key === active;
                    const count = counts?.[tab.key];
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            className={`whitespace-nowrap text-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                isActive
                                    ? 'border-brandColor text-brandColor'
                                    : 'border-transparent text-[#475569] hover:text-[#1e293b]'
                            }`}
                            onClick={() => onChange(tab.key)}
                        >
                            {tab.label}
                            {count !== undefined && (
                                <span
                                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                        isActive
                                            ? 'bg-[#fff1f2] text-brandColor'
                                            : 'bg-[#f1f5f9] text-[#64748b]'
                                    }`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </Flex>
        </div>
    );
}

interface AddB2BForm {
    receiverGstin: string;
    receiverName: string;
    invoiceNo: string;
    invoiceDate: string;
    placeOfSupply: string;
    taxRate: number;
    taxableValue: number;
    reverseCharge: boolean;
}

const EMPTY_B2B_FORM: AddB2BForm = {
    receiverGstin: '',
    receiverName: '',
    invoiceNo: '',
    invoiceDate: '',
    placeOfSupply: '',
    taxRate: 18,
    taxableValue: 0,
    reverseCharge: false,
};
// ─── Step 1 — Select Period ───────────────────────────────────────────────────

const MonthCell = ({
    month,
    selected,
    onClick,
}: {
    month: GstrMonth;
    selected: boolean;
    onClick: () => void;
}) => {
    const isFiled = month.status === 'filed';
    const getBg = () => {
        if (selected) return 'bg-brandColor';
        if (isFiled) return 'bg-[#ecfdf5]';
        return 'bg-white';
    };
    const getBorder = () => {
        if (selected) return 'border-brandColor';
        if (isFiled) return 'border-[#a7f3d0]';
        return 'border-[#e5e7eb]';
    };
    const getLabelCls = () => {
        if (selected) return 'text-white font-semibold';
        if (isFiled) return 'text-[#047857] font-medium';
        return 'text-[#1f2937]';
    };
    const getYearCls = () => {
        if (selected) return 'text-white opacity-80';
        if (isFiled) return 'text-[#047857] opacity-70';
        return 'text-[#94a3b8] opacity-70';
    };
    return (
        <button
            type="button"
            className={`flex-1 min-w-0 border rounded-xl px-3 py-3 text-left cursor-pointer transition-all hover:shadow-sm ${getBg()} ${getBorder()}`}
            onClick={onClick}
        >
            <Typography.Text className={`block text-xs font-medium ${getLabelCls()}`}>
                {month.label}
            </Typography.Text>
            <Typography.Text className={`block text-[10px] ${getYearCls()}`}>
                {month.year}
            </Typography.Text>
            {isFiled && !selected && (
                <Typography.Text className="block text-[9px] text-[#059669] font-semibold mt-0.5">
                    Filed
                </Typography.Text>
            )}
        </button>
    );
};

const SelectPeriodStep = ({
    months: apiMonths,
    fy,
    onFyChange,
    selectedMonthNum,
    onMonthChange,
    returnType,
    onReturnTypeChange,
    onNext,
    onBack,
    isLoadingMonths,
}: {
    months: Gstr1MonthStatus[];
    fy: string;
    onFyChange: (v: string) => void;
    selectedMonthNum: number;
    onMonthChange: (m: number) => void;
    returnType: 'regular' | 'nil';
    onReturnTypeChange: (v: 'regular' | 'nil') => void;
    onNext: () => void;
    onBack: () => void;
    isLoadingMonths?: boolean;
}) => {
    const months = apiMonths.length > 0 ? buildGstrMonths(apiMonths, fy) : buildEmptyMonths(fy);
    const rows = [months.slice(0, 4), months.slice(4, 8), months.slice(8, 12)];
    const startYear = parseInt(fy.split('-')[0], 10);
    const calYear = selectedMonthNum >= 4 ? startYear : startYear + 1;
    const selectedKey = `${MONTH_LABELS[selectedMonthNum - 1]}-${calYear}`;
    const selectedMonthObj = months.find(m => m.key === selectedKey);
    const selectedLabel = selectedMonthObj
        ? `${selectedMonthObj.label} ${selectedMonthObj.year}`
        : '';

    const handleMonthClick = (m: GstrMonth) => {
        const labelPart = m.key.split('-')[0];
        const monthNum = MONTH_LABELS.findIndex(l => l === labelPart) + 1;
        if (monthNum >= 1 && monthNum <= 12) onMonthChange(monthNum);
    };

    return (
        <Flex vertical gap={24}>
            <Typography.Text className="font-bold text-xl text-[#1e293b]">
                Select Filing Period
            </Typography.Text>
            <Flex vertical gap={12}>
                <Typography.Text className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
                    Financial Year
                </Typography.Text>
                <Flex gap={8}>
                    {FINANCIAL_YEARS.map(f => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => onFyChange(f)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                                f === fy
                                    ? 'bg-brandColor text-white border-brandColor'
                                    : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </Flex>
            </Flex>
            <Flex vertical gap={8}>
                <Typography.Text className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
                    Month
                </Typography.Text>
                <div style={{ position: 'relative' }}>
                    <Flex vertical gap={6}>
                        {rows.map((row, ri) => (
                            <Flex key={ri} gap={6}>
                                {row.map(m => (
                                    <MonthCell
                                        key={m.key}
                                        month={m}
                                        selected={m.key === selectedKey}
                                        onClick={() => handleMonthClick(m)}
                                    />
                                ))}
                            </Flex>
                        ))}
                    </Flex>
                    {isLoadingMonths && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 12,
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1,
                            }}
                        >
                            <LoadingOutlined style={{ fontSize: 20, color: '#FF3A3A' }} />
                        </div>
                    )}
                </div>
            </Flex>
            <Flex vertical gap={10}>
                <Typography.Text className="text-sm font-semibold text-[#1e293b]">
                    Return Type
                </Typography.Text>
                <Formik initialValues={{ returnType }} enableReinitialize onSubmit={() => {}}>
                    {({ values }) => {
                        if (values.returnType !== returnType)
                            onReturnTypeChange(values.returnType as 'regular' | 'nil');
                        return (
                            <RadioGroupInput
                                name="returnType"
                                options={[
                                    { value: 'regular', label: 'Regular Return' },
                                    { value: 'nil', label: 'Nil Return' },
                                ]}
                                formItemClass="!mb-0"
                            />
                        );
                    }}
                </Formik>
            </Flex>
            {returnType === 'nil' && (
                <Flex
                    gap={8}
                    align="center"
                    className="rounded-lg px-4 py-3 border"
                    style={{ backgroundColor: '#fefce8', borderColor: '#fde047' }}
                >
                    <InfoCircleOutlined style={{ color: '#ca8a04', fontSize: 13, flexShrink: 0 }} />
                    <Typography.Text className="text-xs font-medium" style={{ color: '#92400e' }}>
                        Nil return — no taxable supplies in this period. Steps 2–5 will be skipped.
                    </Typography.Text>
                </Flex>
            )}
            {selectedMonthObj?.status === 'filed' ? (
                <Flex
                    gap={8}
                    align="center"
                    className="rounded-lg px-4 py-3 border"
                    style={{ backgroundColor: '#f0fdf4', borderColor: '#a7f3d0' }}
                >
                    <CheckCircleFilled style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }} />
                    <Typography.Text className="text-xs font-medium" style={{ color: '#15803d' }}>
                        GSTR-1 for {selectedLabel} is already filed. You can file an amendment
                        return.
                    </Typography.Text>
                </Flex>
            ) : (
                <Flex
                    gap={8}
                    align="center"
                    className="rounded-lg px-4 py-3 border"
                    style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
                >
                    <WarningOutlined style={{ color: '#d97706', fontSize: 13 }} />
                    <Typography.Text className="text-xs text-[#92400e]">
                        Filing deadline for {selectedLabel}: <strong>11th of next month</strong>
                    </Typography.Text>
                </Flex>
            )}
            <NavButtons
                step={1}
                onBack={onBack}
                onNext={onNext}
                nextLabel={returnType === 'nil' ? 'Skip to Review' : undefined}
            />
        </Flex>
    );
};

// ─── Step 2 — B2B Invoices ────────────────────────────────────────────────────

const B2BModalTaxDisplay = ({
    type,
    label,
    sellerStateCode,
}: {
    type: 'igst' | 'cgst' | 'sgst';
    label: string;
    sellerStateCode: string;
}) => {
    const { values } = useFormikContext<AddB2BForm>();
    const posCode = INDIAN_STATES.find(s => s.name === values.placeOfSupply)?.code ?? '';
    const isIntra = posCode === sellerStateCode;
    const totalTax = ((Number(values.taxableValue) || 0) * (Number(values.taxRate) || 0)) / 100;
    let val = 0;
    if (type === 'igst') val = isIntra ? 0 : totalTax;
    else if (type === 'cgst') val = isIntra ? totalTax / 2 : 0;
    else val = isIntra ? totalTax / 2 : 0;
    return (
        <Flex
            flex={1}
            vertical
            align="center"
            justify="center"
            gap={2}
            className="rounded-xl py-3 border border-[#e2e8f0]"
            style={{ backgroundColor: '#f8fafc' }}
        >
            <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                {label}
            </Typography.Text>
            <Typography.Text className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                ₹{fmt(val)}
            </Typography.Text>
        </Flex>
    );
};

const B2B_TEMPLATE_HEADERS = [
    'Invoice No',
    'Invoice Date',
    'Receiver GSTIN',
    'Receiver Name',
    'Place of Supply',
    'Taxable Amount',
    'CGST',
    'SGST',
    'IGST',
];
const B2B_TEMPLATE_SAMPLE = [
    'INV-001',
    '2024-07-01',
    '27AABCU9603R1ZX',
    'ABC Pvt Ltd',
    '27',
    '10000',
    '900',
    '900',
    '0',
];

const B2BInvoicesStep = ({
    invoices,
    sellerStateCode,
    onAddB2B,
    onEditB2B,
    onDeleteB2B,
    onUploadCsv,
    isSaving,
    onNext,
    onBack,
}: {
    invoices: SalesInvoiceRow[];
    sellerStateCode: string;
    onAddB2B: (form: AddB2BForm) => Promise<void>;
    onEditB2B: (id: string, form: AddB2BForm) => Promise<void>;
    onDeleteB2B: (id: string) => Promise<void>;
    onUploadCsv: (items: AddSalesInvoiceItem[]) => Promise<void>;
    isSaving: boolean;
    onNext: () => void;
    onBack: () => void;
}) => {
    const [showModal, setShowModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<{ id: string; form: AddB2BForm } | null>(
        null
    );
    const [csvUploadOpen, setCsvUploadOpen] = useState(false);

    const rows: B2BRow[] = invoices.map(inv => {
        const taxable = Number(inv.taxableAmount);
        const igst = Number(inv.igst);
        const cgst = Number(inv.cgst);
        const sgst = Number(inv.sgst);
        const totalTax = igst + cgst + sgst;
        const rate = taxable > 0 ? Math.round((totalTax / taxable) * 100) : 0;
        const pos =
            igst > 0
                ? Number((inv.buyerGstin ?? '').slice(0, 2)) || Number(sellerStateCode)
                : Number(sellerStateCode);
        return {
            id: String(inv.id),
            receiverGstin: inv.buyerGstin ?? '—',
            name: inv.buyerName ?? '—',
            invoiceNo: inv.invoiceNo,
            date: inv.invoiceDate,
            taxable,
            rate,
            igst,
            cgst,
            sgst,
            pos,
            rc: 'N',
        };
    });

    const totalTaxable = rows.reduce((s, r) => s + r.taxable, 0);
    const totalTax = rows.reduce((s, r) => s + r.igst + r.cgst + r.sgst, 0);

    const columns: ColumnsType<B2BRow> = [
        {
            title: 'Receiver GSTIN',
            dataIndex: 'receiverGstin',
            key: 'rg',
            width: 155,
            render: v => (
                <span className="text-xs font-mono" style={{ color: '#475569' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'nm',
            width: 140,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Invoice No',
            dataIndex: 'invoiceNo',
            key: 'in',
            width: 110,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'dt',
            width: 105,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Taxable (₹)',
            dataIndex: 'taxable',
            key: 'tx',
            width: 120,
            render: v => (
                <span className="text-xs font-medium" style={{ color: '#0f172a' }}>
                    ₹ {fmt(v)}
                </span>
            ),
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rt',
            width: 70,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    {v}%
                </span>
            ),
        },
        {
            title: 'IGST (₹)',
            dataIndex: 'igst',
            key: 'ig',
            width: 90,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    ₹ {fmt(v)}
                </span>
            ),
        },
        {
            title: 'CGST (₹)',
            dataIndex: 'cgst',
            key: 'cg',
            width: 90,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    ₹ {fmt(v)}
                </span>
            ),
        },
        {
            title: 'SGST (₹)',
            dataIndex: 'sgst',
            key: 'sg',
            width: 90,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    ₹ {fmt(v)}
                </span>
            ),
        },
        {
            title: 'POS',
            dataIndex: 'pos',
            key: 'ps',
            width: 55,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'RC',
            dataIndex: 'rc',
            key: 'rc',
            width: 45,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'ac',
            width: 80,
            fixed: 'right',
            render: (_, record) => (
                <Flex gap={4} align="center">
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            className="text-[#94a3b8] hover:text-[#475569]"
                            onClick={() => {
                                const inv = invoices.find(i => String(i.id) === String(record.id));
                                if (!inv) return;
                                const invTotalTax =
                                    Number(inv.igst) + Number(inv.cgst) + Number(inv.sgst);
                                const taxable = Number(inv.taxableAmount);
                                const rate =
                                    taxable > 0 ? Math.round((invTotalTax / taxable) * 100) : 18;
                                const posName = inv.placeOfSupply
                                    ? (INDIAN_STATES.find(s => s.code === inv.placeOfSupply)
                                          ?.name ?? inv.placeOfSupply)
                                    : '';
                                setEditingInvoice({
                                    id: String(inv.id),
                                    form: {
                                        receiverGstin: inv.buyerGstin ?? '',
                                        receiverName: inv.buyerName ?? '',
                                        invoiceNo: inv.invoiceNo,
                                        invoiceDate: inv.invoiceDate,
                                        placeOfSupply: posName,
                                        taxRate: rate,
                                        taxableValue: taxable,
                                        reverseCharge: false,
                                    },
                                });
                                setShowModal(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            className="text-[#94a3b8] hover:text-red-500"
                            onClick={() => onDeleteB2B(String(record.id))}
                        />
                    </Tooltip>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Flex vertical gap={20}>
                <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
                    <Flex vertical gap={4}>
                        <Typography.Text className="font-bold text-xl text-[#1e293b]">
                            B2B Invoices
                        </Typography.Text>
                        <Typography.Text className="text-sm text-[#64748b]">
                            Tables 4A, 4B, 6B, 6C — Supplies to registered taxpayers
                        </Typography.Text>
                    </Flex>
                    <Flex gap={8} align="center" wrap="wrap">
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            style={{ borderColor: '#cbd5e1', color: '#475569' }}
                            onClick={() => {
                                const csv = [
                                    B2B_TEMPLATE_HEADERS.join(','),
                                    B2B_TEMPLATE_SAMPLE.join(','),
                                ].join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'b2b_invoice_template.csv';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            Template
                        </Button>
                        <Button
                            size="small"
                            icon={<CloudUploadOutlined />}
                            style={{ borderColor: '#FF3A3A', color: '#FF3A3A' }}
                            onClick={() => setCsvUploadOpen(true)}
                        >
                            Upload
                        </Button>
                        <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setShowModal(true)}
                        >
                            Add
                        </Button>
                    </Flex>
                </Flex>

                <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 bg-white px-4 py-3 border border-[#e2e8f0] rounded-xl">
                    {[
                        { label: 'Invoices', value: String(rows.length) },
                        { label: 'Total Taxable', value: fmtC(totalTaxable) },
                        { label: 'Total Tax', value: fmtC(totalTax) },
                    ].map(s => (
                        <Flex
                            key={s.label}
                            vertical
                            align="center"
                            justify="center"
                            gap={4}
                            className="py-5 rounded-xl bg-[#f8fafc]"
                        >
                            <Typography.Text
                                className="font-bold text-lg"
                                style={{ color: '#1e293b' }}
                            >
                                {s.value}
                            </Typography.Text>
                            <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                                {s.label}
                            </Typography.Text>
                        </Flex>
                    ))}
                </div>

                <Table
                    dataSource={rows}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    locale={{
                        emptyText: (
                            <span className="text-sm text-[#94a3b8] py-6 block text-center">
                                No B2B invoices yet. Click &quot;+ Add Invoice&quot; to add one.
                            </span>
                        ),
                    }}
                />

                <NavButtons step={2} onBack={onBack} onNext={onNext} />
            </Flex>

            <Modal
                open={showModal}
                onCancel={() => {
                    setShowModal(false);
                    setEditingInvoice(null);
                }}
                footer={null}
                title={
                    <Typography.Text className="text-lg font-semibold text-[#1e293b]">
                        {editingInvoice ? 'Edit B2B Invoice' : 'Add B2B Invoice'}
                    </Typography.Text>
                }
                width="min(560px, 95vw)"
                centered
                destroyOnClose
                styles={{
                    content: { borderRadius: 24 },
                    body: { maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', paddingRight: 4 },
                }}
            >
                <Formik
                    initialValues={editingInvoice ? editingInvoice.form : EMPTY_B2B_FORM}
                    validationSchema={b2bFormSchema}
                    onSubmit={async (values, { resetForm }) => {
                        if (editingInvoice) {
                            await onEditB2B(editingInvoice.id, values);
                        } else {
                            await onAddB2B(values);
                        }
                        setShowModal(false);
                        setEditingInvoice(null);
                        resetForm();
                    }}
                >
                    {({ submitForm }) => (
                        <FormikForm>
                            <Form layout="vertical" component={false}>
                                <Flex vertical gap={4} className="pt-4">
                                    <TextInput
                                        name="receiverGstin"
                                        label="Receiver GSTIN"
                                        type="text"
                                        placeholder="e.g. 29ABCDE1234F1Z5"
                                        convertToUppercase
                                        maxLength={15}
                                        isRequired
                                    />
                                    <TextInput
                                        name="receiverName"
                                        label="Receiver Name"
                                        type="text"
                                        placeholder="Enter receiver name"
                                        isRequired
                                    />
                                    <Flex gap={12} align="flex-start" wrap="wrap">
                                        <div style={{ flex: '1 1 140px' }}>
                                            <TextInput
                                                name="invoiceNo"
                                                label="Invoice No"
                                                type="text"
                                                placeholder="Enter Invoice No"
                                                isRequired
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 140px' }}>
                                            <DatePickerInput
                                                name="invoiceDate"
                                                label="Invoice Date"
                                                placeholder="Select Invoice Date"
                                                isRequired
                                            />
                                        </div>
                                    </Flex>
                                    <Flex gap={12} align="flex-start" wrap="wrap">
                                        <div style={{ flex: '1 1 140px' }}>
                                            <SelectInput
                                                name="placeOfSupply"
                                                label="Place of Supply"
                                                placeholder="Select Place of Supply"
                                                showSearch
                                                isRequired
                                                options={PLACE_OF_SUPPLY_OPTIONS}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 140px' }}>
                                            <SelectInput
                                                name="taxRate"
                                                label="Tax Rate %"
                                                placeholder="Rate"
                                                isRequired
                                                options={TAX_RATES.map(r => ({
                                                    value: r,
                                                    label: `${r}%`,
                                                }))}
                                            />
                                        </div>
                                    </Flex>
                                    <TextInput
                                        name="taxableValue"
                                        label="Taxable Value (₹)"
                                        type="text"
                                        placeholder="Enter Taxable Value (₹)"
                                        allowTwoDecimalsOnly
                                        isRequired
                                    />
                                    <Flex gap={12} className="mb-2">
                                        <B2BModalTaxDisplay
                                            type="igst"
                                            label="IGST"
                                            sellerStateCode={sellerStateCode}
                                        />
                                        <B2BModalTaxDisplay
                                            type="cgst"
                                            label="CGST"
                                            sellerStateCode={sellerStateCode}
                                        />
                                        <B2BModalTaxDisplay
                                            type="sgst"
                                            label="SGST"
                                            sellerStateCode={sellerStateCode}
                                        />
                                    </Flex>
                                    <CheckboxInput name="reverseCharge">
                                        Reverse Charge (RCM applicable)
                                    </CheckboxInput>
                                    <Flex gap={12} className="pt-3">
                                        <Button
                                            block
                                            size="large"
                                            onClick={() => {
                                                setShowModal(false);
                                                setEditingInvoice(null);
                                            }}
                                            style={{
                                                height: 48,
                                                borderColor: '#e2e8f0',
                                                color: '#475569',
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="primary"
                                            danger
                                            block
                                            size="large"
                                            loading={isSaving}
                                            onClick={submitForm}
                                            style={{ height: 48 }}
                                        >
                                            Save Invoice
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Form>
                        </FormikForm>
                    )}
                </Formik>
            </Modal>

            <InvoiceCsvUploadModal
                open={csvUploadOpen}
                title="Upload B2B Invoices"
                templateHeaders={B2B_TEMPLATE_HEADERS}
                templateSample={B2B_TEMPLATE_SAMPLE}
                templateFilename="b2b_invoice_template.csv"
                onClose={() => setCsvUploadOpen(false)}
                onImport={onUploadCsv}
            />
        </>
    );
};

// ─── Step 3 — B2C & Others ────────────────────────────────────────────────────

const NilExemptGrid = ({
    values,
    onChange,
    onSave,
    isSaving,
}: {
    values: NilExemptValues;
    onChange: (v: NilExemptValues) => void;
    onSave: () => void;
    isSaving: boolean;
}) => (
    <Formik initialValues={values} enableReinitialize onSubmit={() => {}}>
        {({ values: fValues }) => {
            const changed = JSON.stringify(fValues) !== JSON.stringify(values);
            if (changed) onChange(fValues as NilExemptValues);
            return (
                <>
                    <Flex
                        vertical
                        gap={0}
                        className="border border-[#e2e8f0] rounded-xl overflow-hidden"
                    >
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-[#f8fafc] border-b border-[#e2e8f0]">
                            {['Supply Type', 'Nil Rated (₹)', 'Exempted (₹)', 'Non GST (₹)'].map(
                                (h, i) => (
                                    <div
                                        key={h}
                                        className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${i > 0 ? 'text-right' : ''}`}
                                        style={{ color: '#64748b' }}
                                    >
                                        {h}
                                    </div>
                                )
                            )}
                        </div>
                        {NIL_EXEMPT_ROWS.map((row, idx) => (
                            <div
                                key={row.key}
                                className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center ${idx < NIL_EXEMPT_ROWS.length - 1 ? 'border-b border-[#f1f5f9]' : ''}`}
                            >
                                <div className="px-5 py-4">
                                    <Typography.Text
                                        className="text-sm"
                                        style={{ color: '#1e293b' }}
                                    >
                                        {row.label}
                                    </Typography.Text>
                                </div>
                                {(['nilRated', 'exempted', 'nonGst'] as NilExemptField[]).map(
                                    field => (
                                        <div key={field} className="px-4 py-3">
                                            <TextInput
                                                name={`${row.key}.${field}`}
                                                type="text"
                                                placeholder="0"
                                                size="small"
                                                allowTwoDecimalsOnly
                                                prefix={RUPEE_PREFIX}
                                                formItemClass="!mb-0"
                                                classes="text-right w-full"
                                            />
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </Flex>
                    <Flex justify="flex-end" className="mt-3">
                        <Button
                            type="primary"
                            danger
                            size="small"
                            loading={isSaving}
                            onClick={onSave}
                            style={{ borderRadius: 8, height: 32 }}
                        >
                            Save Nil/Exempt Data
                        </Button>
                    </Flex>
                </>
            );
        }}
    </Formik>
);

interface B2CAddForm {
    invoiceNo: string;
    date: string;
    placeOfSupply: string;
    supplyType: string;
    buyerGstin: string;
    noteType: 'C' | 'D';
    exportType: 'WPAY' | 'WOPAY';
    portCode: string;
    sbNo: string;
    sbDate: string;
    origInvNo: string;
    origInvDate: string;
    taxable: number;
    rate: number;
}

const EMPTY_B2C_FORM: B2CAddForm = {
    invoiceNo: '',
    date: '',
    placeOfSupply: '',
    supplyType: 'INTER',
    buyerGstin: '',
    noteType: 'C',
    exportType: 'WPAY',
    portCode: '',
    sbNo: '',
    sbDate: '',
    origInvNo: '',
    origInvDate: '',
    taxable: 0,
    rate: 18,
};

// const SupplyBadge = ({ sellerCode }: { sellerCode: string }) => {
//     const { values } = useFormikContext<{ placeOfSupply: string }>();
//     if (!values.placeOfSupply) return <span className="text-xs text-[#94a3b8]">— auto —</span>;
//     const code = INDIAN_STATES.find(s => s.name === values.placeOfSupply)?.code;
//     return code === sellerCode
//         ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#ecedfd] text-[#5443b7]">INTRA</span>
//         : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#f6ebff] text-[#900bf5]">INTER</span>;
// };

const B2CLargeAddForm = ({
    onAdd,
    isAdding,
}: {
    onAdd: (form: B2CAddForm) => Promise<boolean>;
    isAdding: boolean;
}) => (
    <Formik
        initialValues={{ invoiceNo: '', date: '', placeOfSupply: '', taxable: '', rate: 18 }}
        validationSchema={b2cLargeSchema}
        onSubmit={async (values, { resetForm }) => {
            const ok = await onAdd({
                ...EMPTY_B2C_FORM,
                invoiceNo: values.invoiceNo,
                date: values.date,
                placeOfSupply: values.placeOfSupply,
                taxable: parseFloat(values.taxable) || 0,
                rate: values.rate,
            });
            if (ok) resetForm();
        }}
    >
        {({ submitForm }) => (
            <FormikForm>
                <div className="bg-[#f8fafc] rounded-[18px] px-6 py-5">
                    <Flex gap={14} align="flex-start" wrap="wrap">
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <TextInput
                                name="invoiceNo"
                                type="text"
                                placeholder="Invoice No."
                                size="large"
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <DatePickerInput
                                name="date"
                                placeholder="Date"
                                size="large"
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <SelectInput
                                name="placeOfSupply"
                                placeholder="State"
                                size="large"
                                options={PLACE_OF_SUPPLY_OPTIONS}
                                showSearch
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <TextInput
                                name="taxable"
                                type="text"
                                placeholder="Taxable Value"
                                size="large"
                                prefix={RUPEE_PREFIX}
                                allowTwoDecimalsOnly
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <SelectInput
                                name="rate"
                                placeholder="Rate"
                                size="large"
                                options={TAX_RATE_OPTIONS}
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <Button
                            loading={isAdding}
                            onClick={submitForm}
                            style={{
                                flex: '1 1 120px',
                                minWidth: 0,
                                height: 40,
                                borderRadius: 8,
                                background: '#ff4f4f',
                                border: 'none',
                                color: '#fff',
                                fontSize: 16,
                                fontWeight: 500,
                            }}
                        >
                            Add
                        </Button>
                    </Flex>
                </div>
            </FormikForm>
        )}
    </Formik>
);

const B2CSmallAddForm = ({
    onAdd,
    isAdding,
    sellerStateCode,
}: {
    onAdd: (form: B2CAddForm) => Promise<boolean>;
    isAdding: boolean;
    sellerStateCode: string;
}) => (
    <Formik
        initialValues={{ placeOfSupply: '', supplyType: '' as string, rate: 18, taxable: '' }}
        validationSchema={b2cSmallSchema}
        onSubmit={async (values, { resetForm }) => {
            const code = INDIAN_STATES.find(s => s.name === values.placeOfSupply)?.code;
            const supplyType =
                (values.supplyType as 'INTRA' | 'INTER') ||
                (code === sellerStateCode ? 'INTRA' : 'INTER');
            const ok = await onAdd({
                ...EMPTY_B2C_FORM,
                placeOfSupply: values.placeOfSupply,
                supplyType,
                taxable: parseFloat(values.taxable) || 0,
                rate: values.rate,
            });
            if (ok) resetForm();
        }}
    >
        {({ submitForm }) => (
            <FormikForm>
                <div className="bg-[#f8fafc] rounded-[18px] px-6 py-5">
                    <Flex gap={14} align="flex-start" wrap="wrap">
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <SelectInput
                                name="placeOfSupply"
                                placeholder="State"
                                size="large"
                                options={PLACE_OF_SUPPLY_OPTIONS}
                                showSearch
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <SelectInput
                                name="supplyType"
                                placeholder="Type"
                                size="large"
                                options={[
                                    { value: 'INTRA', label: 'INTRA' },
                                    { value: 'INTER', label: 'INTER' },
                                ]}
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <SelectInput
                                name="rate"
                                placeholder="Rate"
                                size="large"
                                options={TAX_RATE_OPTIONS}
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <TextInput
                                name="taxable"
                                type="text"
                                placeholder="Taxable Value"
                                size="large"
                                prefix={RUPEE_PREFIX}
                                allowTwoDecimalsOnly
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <Button
                            loading={isAdding}
                            onClick={submitForm}
                            style={{
                                flex: '1 1 120px',
                                minWidth: 0,
                                height: 40,
                                borderRadius: 8,
                                background: '#ff4f4f',
                                border: 'none',
                                color: '#fff',
                                fontSize: 16,
                                fontWeight: 500,
                            }}
                        >
                            Add
                        </Button>
                    </Flex>
                </div>
            </FormikForm>
        )}
    </Formik>
);

const CdnrAddForm = ({
    onAdd,
    isAdding,
}: {
    onAdd: (form: B2CAddForm) => Promise<boolean>;
    isAdding: boolean;
}) => (
    <Formik
        initialValues={{
            buyerGstin: '',
            invoiceNo: '',
            date: '',
            noteType: 'C',
            taxable: '',
            rate: 18,
            placeOfSupply: '',
        }}
        validationSchema={cdnrSchema}
        onSubmit={async (values, { resetForm }) => {
            const ok = await onAdd({
                ...EMPTY_B2C_FORM,
                buyerGstin: values.buyerGstin,
                invoiceNo: values.invoiceNo,
                date: values.date,
                noteType: values.noteType as 'C' | 'D',
                taxable: parseFloat(values.taxable) || 0,
                rate: values.rate,
                placeOfSupply: values.placeOfSupply,
            });
            if (ok) resetForm();
        }}
    >
        {({ submitForm }) => (
            <FormikForm>
                <div className="bg-[#f8fafc] rounded-[18px] px-6 py-5">
                    <Flex vertical gap={16}>
                        <Flex gap={14} wrap="wrap">
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="buyerGstin"
                                    type="text"
                                    placeholder="Receiver GSTIN"
                                    size="large"
                                    convertToUppercase
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="invoiceNo"
                                    type="text"
                                    placeholder="Note No."
                                    size="large"
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <DatePickerInput
                                    name="date"
                                    placeholder="Note Date"
                                    size="large"
                                    isRequired
                                    formItemClass="!mb-0"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="noteType"
                                    placeholder="Type"
                                    size="large"
                                    options={NOTE_TYPE_OPTIONS}
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                        </Flex>
                        <Flex gap={14} wrap="wrap">
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="taxable"
                                    type="text"
                                    placeholder="Taxable Value"
                                    size="large"
                                    prefix={RUPEE_PREFIX}
                                    allowTwoDecimalsOnly
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="rate"
                                    placeholder="%"
                                    size="large"
                                    options={TAX_RATE_OPTIONS}
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="placeOfSupply"
                                    placeholder="State"
                                    size="large"
                                    options={PLACE_OF_SUPPLY_OPTIONS}
                                    showSearch
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <Button
                                loading={isAdding}
                                onClick={submitForm}
                                style={{
                                    flex: '1 1 120px',
                                    minWidth: 0,
                                    height: 40,
                                    borderRadius: 8,
                                    background: '#ff4f4f',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: 16,
                                    fontWeight: 500,
                                }}
                            >
                                Add
                            </Button>
                        </Flex>
                    </Flex>
                </div>
            </FormikForm>
        )}
    </Formik>
);

const CdnurAddForm = ({
    onAdd,
    isAdding,
}: {
    onAdd: (form: B2CAddForm) => Promise<boolean>;
    isAdding: boolean;
}) => (
    <Formik
        initialValues={{
            supplyType: 'B2CL',
            invoiceNo: '',
            date: '',
            noteType: 'C',
            taxable: '',
            rate: 18,
            placeOfSupply: '',
        }}
        validationSchema={cdnurSchema}
        onSubmit={async (values, { resetForm }) => {
            const ok = await onAdd({
                ...EMPTY_B2C_FORM,
                supplyType: values.supplyType,
                invoiceNo: values.invoiceNo,
                date: values.date,
                noteType: values.noteType as 'C' | 'D',
                taxable: parseFloat(values.taxable) || 0,
                rate: values.rate,
                placeOfSupply: values.placeOfSupply,
            });
            if (ok) resetForm();
        }}
    >
        {({ submitForm }) => (
            <FormikForm>
                <div className="bg-[#f8fafc] rounded-[18px] px-6 py-5">
                    <Flex vertical gap={16}>
                        <Flex gap={14} wrap="wrap">
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="supplyType"
                                    placeholder="Supply Type"
                                    size="large"
                                    options={CDNUR_SUPPLY_TYPE_OPTIONS}
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="invoiceNo"
                                    type="text"
                                    placeholder="Note No."
                                    size="large"
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <DatePickerInput
                                    name="date"
                                    placeholder="Date"
                                    size="large"
                                    isRequired
                                    formItemClass="!mb-0"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="noteType"
                                    placeholder="Type"
                                    size="large"
                                    options={NOTE_TYPE_OPTIONS}
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                        </Flex>
                        <Flex gap={14} wrap="wrap">
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="taxable"
                                    type="text"
                                    placeholder="Taxable Value"
                                    size="large"
                                    prefix={RUPEE_PREFIX}
                                    allowTwoDecimalsOnly
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="rate"
                                    placeholder="%"
                                    size="large"
                                    options={TAX_RATE_OPTIONS}
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="placeOfSupply"
                                    placeholder="State"
                                    size="large"
                                    options={PLACE_OF_SUPPLY_OPTIONS}
                                    showSearch
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <Button
                                loading={isAdding}
                                onClick={submitForm}
                                style={{
                                    flex: '1 1 120px',
                                    minWidth: 0,
                                    height: 40,
                                    borderRadius: 8,
                                    background: '#ff4f4f',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: 16,
                                    fontWeight: 500,
                                }}
                            >
                                Add
                            </Button>
                        </Flex>
                    </Flex>
                </div>
            </FormikForm>
        )}
    </Formik>
);

const AdvancesAddForm = ({
    onAdd,
    isAdding,
}: {
    onAdd: (form: B2CAddForm) => Promise<boolean>;
    isAdding: boolean;
}) => (
    <Formik
        initialValues={{ placeOfSupply: '', rate: 18, taxable: '' }}
        validationSchema={advancesSchema}
        onSubmit={async (values, { resetForm }) => {
            const ok = await onAdd({
                ...EMPTY_B2C_FORM,
                placeOfSupply: values.placeOfSupply,
                taxable: parseFloat(values.taxable) || 0,
                rate: values.rate,
            });
            if (ok) resetForm();
        }}
    >
        {({ submitForm }) => (
            <FormikForm>
                <div className="bg-[#f8fafc] rounded-[18px] px-6 py-5">
                    <Flex gap={14} align="flex-start" wrap="wrap">
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <SelectInput
                                name="placeOfSupply"
                                placeholder="State"
                                size="large"
                                options={PLACE_OF_SUPPLY_OPTIONS}
                                showSearch
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <SelectInput
                                name="rate"
                                placeholder="%"
                                size="large"
                                options={TAX_RATE_OPTIONS}
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                            <TextInput
                                name="taxable"
                                type="text"
                                placeholder="Gross Advance"
                                size="large"
                                prefix={RUPEE_PREFIX}
                                allowTwoDecimalsOnly
                                isRequired
                                formItemClass="!mb-0"
                            />
                        </div>
                        <Button
                            loading={isAdding}
                            onClick={submitForm}
                            style={{
                                flex: '1 1 120px',
                                minWidth: 0,
                                height: 40,
                                borderRadius: 8,
                                background: '#ff4f4f',
                                border: 'none',
                                color: '#fff',
                                fontSize: 16,
                                fontWeight: 500,
                            }}
                        >
                            Add
                        </Button>
                    </Flex>
                </div>
            </FormikForm>
        )}
    </Formik>
);

const ExportsAddForm = ({
    onAdd,
    isAdding,
}: {
    onAdd: (form: B2CAddForm) => Promise<boolean>;
    isAdding: boolean;
}) => (
    <Formik
        initialValues={{
            exportType: 'WPAY',
            invoiceNo: '',
            date: '',
            portCode: '',
            sbNo: '',
            sbDate: '',
            taxable: '',
        }}
        validationSchema={exportsSchema}
        onSubmit={async (values, { resetForm }) => {
            const ok = await onAdd({
                ...EMPTY_B2C_FORM,
                exportType: values.exportType as 'WPAY' | 'WOPAY',
                invoiceNo: values.invoiceNo,
                date: values.date,
                portCode: values.portCode,
                sbNo: values.sbNo,
                sbDate: values.sbDate,
                taxable: parseFloat(values.taxable) || 0,
            });
            if (ok) resetForm();
        }}
    >
        {({ submitForm }) => (
            <FormikForm>
                <div className="bg-[#f8fafc] rounded-[18px] px-6 py-5">
                    <Flex vertical gap={16}>
                        <Flex gap={14} wrap="wrap">
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <SelectInput
                                    name="exportType"
                                    placeholder="Type"
                                    size="large"
                                    options={EXPORT_TYPE_OPTIONS}
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="invoiceNo"
                                    type="text"
                                    placeholder="Invoice No."
                                    size="large"
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <DatePickerInput
                                    name="date"
                                    placeholder="Date"
                                    size="large"
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="portCode"
                                    type="text"
                                    placeholder="Port Code"
                                    size="large"
                                    convertToUppercase
                                    formItemClass="!mb-0"
                                />
                            </div>
                        </Flex>
                        <Flex gap={14} align="flex-start" wrap="wrap">
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="sbNo"
                                    type="text"
                                    placeholder="Shipping Bill No."
                                    size="large"
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <DatePickerInput
                                    name="sbDate"
                                    placeholder="Shipping Bill Date"
                                    size="large"
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                <TextInput
                                    name="taxable"
                                    type="text"
                                    placeholder="Taxable Value"
                                    size="large"
                                    prefix={RUPEE_PREFIX}
                                    allowTwoDecimalsOnly
                                    isRequired
                                    formItemClass="!mb-0"
                                />
                            </div>
                            <Button
                                loading={isAdding}
                                onClick={submitForm}
                                style={{
                                    flex: '1 1 120px',
                                    minWidth: 0,
                                    height: 40,
                                    borderRadius: 8,
                                    background: '#ff4f4f',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: 16,
                                    fontWeight: 500,
                                }}
                            >
                                Add
                            </Button>
                        </Flex>
                    </Flex>
                </div>
            </FormikForm>
        )}
    </Formik>
);

const B2C_TAB_TEMPLATES: Record<
    B2CTabKey,
    { headers: string[]; sample: string[]; filename: string }
> = {
    'b2c-large': {
        headers: [
            'Invoice No',
            'Invoice Date',
            'Place of Supply',
            'Taxable Amount',
            'Tax Rate (%)',
        ],
        sample: ['INV-001', '2024-07-01', '27', '10000', '18'],
        filename: 'b2c_large_template.csv',
    },
    'b2c-small': {
        headers: ['Place of Supply', 'Supply Type (INTRA/INTER)', 'Tax Rate (%)', 'Taxable Amount'],
        sample: ['27', 'INTRA', '18', '10000'],
        filename: 'b2c_small_template.csv',
    },
    exports: {
        headers: [
            'Export Type (WPAY/WOPAY)',
            'Invoice No',
            'Invoice Date',
            'Port Code',
            'Shipping Bill No',
            'Shipping Bill Date',
            'Taxable Amount',
        ],
        sample: ['WPAY', 'INV-001', '2024-07-01', 'INMAA1', 'SB001234', '2024-07-10', '10000'],
        filename: 'exports_template.csv',
    },
    cdnr: {
        headers: [
            'Receiver GSTIN',
            'Note No',
            'Note Date',
            'Note Type (C/D)',
            'Taxable Amount',
            'Tax Rate (%)',
            'Place of Supply',
        ],
        sample: ['27AABCU9603R1ZX', 'CN-001', '2024-07-01', 'C', '10000', '18', '27'],
        filename: 'cdnr_template.csv',
    },
    cdnur: {
        headers: [
            'CDNUR Type',
            'Note No',
            'Note Date',
            'Note Type (C/D)',
            'Taxable Amount',
            'Tax Rate (%)',
            'Place of Supply',
        ],
        sample: ['B2CL', 'CN-001', '2024-07-01', 'C', '10000', '18', '27'],
        filename: 'cdnur_template.csv',
    },
    advances: {
        headers: ['Place of Supply', 'Tax Rate (%)', 'Gross Advance'],
        sample: ['27', '18', '10000'],
        filename: 'advances_template.csv',
    },
    'nil-exempt': {
        headers: [],
        sample: [],
        filename: 'nil_exempt_template.csv',
    },
};

const B2COthersStep = ({
    b2cLargeInvoices,
    exportInvoices,
    b2cSmallInvoices,
    cdnrInvoices,
    cdnurInvoices,
    advanceInvoices,
    nilValues,
    onNilChange,
    onAddApiRow,
    isAddingApi,
    onDeleteB2C,
    onSaveNilExempt,
    onUploadCsv,
    sellerStateCode,
    onNext,
    onBack,
}: {
    b2cLargeInvoices: SalesInvoiceRow[];
    exportInvoices: SalesInvoiceRow[];
    b2cSmallInvoices: SalesInvoiceRow[];
    cdnrInvoices: SalesInvoiceRow[];
    cdnurInvoices: SalesInvoiceRow[];
    advanceInvoices: SalesInvoiceRow[];
    nilValues: NilExemptValues;
    onNilChange: (v: NilExemptValues) => void;
    onAddApiRow: (tab: B2CTabKey, form: B2CAddForm) => Promise<boolean>;
    isAddingApi: boolean;
    onDeleteB2C: (id: string) => Promise<void>;
    onSaveNilExempt: () => void;
    onUploadCsv: (items: AddSalesInvoiceItem[]) => Promise<void>;
    sellerStateCode: string;
    onNext: () => void;
    onBack: () => void;
}) => {
    const [activeTab, setActiveTab] = useState<B2CTabKey>('b2c-large');
    const [showAddForm, setShowAddForm] = useState(false);
    const [csvUploadOpen, setCsvUploadOpen] = useState(false);

    const getInvoices = (tab: B2CTabKey): SalesInvoiceRow[] => {
        if (tab === 'b2c-large') return b2cLargeInvoices;
        if (tab === 'exports') return exportInvoices;
        if (tab === 'b2c-small') return b2cSmallInvoices;
        if (tab === 'cdnr') return cdnrInvoices;
        if (tab === 'cdnur') return cdnurInvoices;
        if (tab === 'advances') return advanceInvoices;
        return [];
    };

    const counts: Record<string, number> = {
        'b2c-large': b2cLargeInvoices.length,
        'b2c-small': b2cSmallInvoices.length,
        exports: exportInvoices.length,
        cdnr: cdnrInvoices.length,
        cdnur: cdnurInvoices.length,
        'nil-exempt': NIL_EXEMPT_ROWS.reduce((s, r) => {
            const v = nilValues[r.key];
            return s + (v.nilRated > 0 || v.exempted > 0 || v.nonGst > 0 ? 1 : 0);
        }, 0),
        advances: advanceInvoices.length,
    };

    const actionsCol: ColumnsType<SalesInvoiceRow>[number] = {
        title: 'Actions',
        key: 'ac',
        width: 60,
        fixed: 'right',
        render: (_, record) => (
            <Tooltip title="Delete">
                <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="text-[#94a3b8] hover:text-red-500"
                    onClick={() => onDeleteB2C(String(record.id))}
                />
            </Tooltip>
        ),
    };

    const getColumns = (tab: B2CTabKey): ColumnsType<SalesInvoiceRow> => {
        switch (tab) {
            case 'b2c-large':
                return [
                    {
                        title: 'Invoice No',
                        dataIndex: 'invoiceNo',
                        key: 'in',
                        width: 120,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'Date',
                        dataIndex: 'invoiceDate',
                        key: 'dt',
                        width: 105,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'POS',
                        key: 'ps',
                        width: 80,
                        render: (_, r) => {
                            const v = r.placeOfSupply || r.buyerName;
                            return (
                                <span className="text-xs" style={{ color: '#0f172a' }}>
                                    {INDIAN_STATES.find(s => s.name === v)?.name ??
                                        INDIAN_STATES.find(s => String(s.code) === String(v))
                                            ?.name ??
                                        v ??
                                        '—'}
                                </span>
                            );
                        },
                    },
                    {
                        title: 'Taxable Value (₹)',
                        dataIndex: 'taxableAmount',
                        key: 'tx',
                        width: 130,
                        render: v => (
                            <span className="text-xs font-medium" style={{ color: '#0f172a' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'Rate',
                        key: 'rt',
                        width: 65,
                        render: (_, r) => {
                            const rate = r.taxableAmount
                                ? Math.round((Number(r.igst) / Number(r.taxableAmount)) * 100)
                                : 0;
                            return (
                                <span className="text-xs" style={{ color: '#475569' }}>
                                    {rate}%
                                </span>
                            );
                        },
                    },
                    {
                        title: 'IGST (₹)',
                        dataIndex: 'igst',
                        key: 'ig',
                        width: 110,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    actionsCol,
                ];

            case 'b2c-small':
                return [
                    {
                        title: 'POS',
                        key: 'ps',
                        width: 130,
                        render: (_, r) => {
                            const v = r.placeOfSupply || r.buyerName;
                            return (
                                <span className="text-xs" style={{ color: '#0f172a' }}>
                                    {INDIAN_STATES.find(s => s.name === v)?.name ??
                                        INDIAN_STATES.find(s => String(s.code) === String(v))
                                            ?.name ??
                                        v ??
                                        '—'}
                                </span>
                            );
                        },
                    },
                    {
                        title: 'Type',
                        key: 'tp',
                        width: 90,
                        render: (_, r) => {
                            const isIntra = Number(r.cgst) > 0 || Number(r.sgst) > 0;
                            return isIntra ? (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#ecedfd] text-[#5443b7]">
                                    INTRA
                                </span>
                            ) : (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#f6ebff] text-[#900bf5]">
                                    INTER
                                </span>
                            );
                        },
                    },
                    {
                        title: 'Rate',
                        key: 'rt',
                        width: 65,
                        render: (_, r) => {
                            const tax = Number(r.igst) + Number(r.cgst) + Number(r.sgst);
                            const rate = r.taxableAmount
                                ? Math.round((tax / Number(r.taxableAmount)) * 100)
                                : 0;
                            return <span className="text-xs text-[#475569]">{rate}%</span>;
                        },
                    },
                    {
                        title: 'Taxable Value (₹)',
                        dataIndex: 'taxableAmount',
                        key: 'tx',
                        width: 130,
                        render: v => (
                            <span className="text-xs font-medium" style={{ color: '#0f172a' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'IGST (₹)',
                        dataIndex: 'igst',
                        key: 'ig',
                        width: 100,
                        render: v => (
                            <span className="text-xs text-[#475569]">₹ {fmt(Number(v))}</span>
                        ),
                    },
                    {
                        title: 'CGST (₹)',
                        dataIndex: 'cgst',
                        key: 'cg',
                        width: 100,
                        render: v => (
                            <span className="text-xs text-[#475569]">₹ {fmt(Number(v))}</span>
                        ),
                    },
                    {
                        title: 'SGST (₹)',
                        dataIndex: 'sgst',
                        key: 'sg',
                        width: 100,
                        render: v => (
                            <span className="text-xs text-[#475569]">₹ {fmt(Number(v))}</span>
                        ),
                    },
                    actionsCol,
                ];

            case 'exports':
                return [
                    {
                        title: 'Type',
                        dataIndex: 'buyerName',
                        key: 'tp',
                        width: 120,
                        render: v => {
                            const cls =
                                v === 'WPAY'
                                    ? 'bg-[#ecfdf5] text-[#43b75d]'
                                    : 'bg-[#fffbeb] text-[#f59e0b]';
                            let label: string = v || '—';
                            if (v === 'WPAY') label = 'With Tax';
                            else if (v === 'WOPAY') label = 'Without Tax';
                            return (
                                <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}
                                >
                                    {label}
                                </span>
                            );
                        },
                    },
                    {
                        title: 'Invoice No',
                        dataIndex: 'invoiceNo',
                        key: 'in',
                        width: 130,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'Date',
                        dataIndex: 'invoiceDate',
                        key: 'dt',
                        width: 105,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'Port Code',
                        dataIndex: 'portCode',
                        key: 'pc',
                        width: 110,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                {v || '—'}
                            </span>
                        ),
                    },
                    {
                        title: 'SB No',
                        dataIndex: 'shippingBillNo',
                        key: 'sn',
                        width: 110,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                {v || '—'}
                            </span>
                        ),
                    },
                    {
                        title: 'SB Date',
                        dataIndex: 'shippingBillDate',
                        key: 'sd',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                {v || '—'}
                            </span>
                        ),
                    },
                    {
                        title: 'Taxable (₹)',
                        dataIndex: 'taxableAmount',
                        key: 'tx',
                        width: 120,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    actionsCol,
                ];

            case 'cdnr':
                return [
                    {
                        title: 'Receiver GSTIN',
                        dataIndex: 'buyerGstin',
                        key: 'rg',
                        width: 155,
                        render: v => (
                            <span className="text-xs font-mono" style={{ color: '#475569' }}>
                                {v || '—'}
                            </span>
                        ),
                    },
                    {
                        title: 'Note No',
                        dataIndex: 'invoiceNo',
                        key: 'no',
                        width: 120,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'Date',
                        dataIndex: 'invoiceDate',
                        key: 'nd',
                        width: 105,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'Type',
                        dataIndex: 'buyerName',
                        key: 'ty',
                        width: 100,
                        render: v =>
                            v === 'D' ? (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#fef2f2] text-[#ef4444]">
                                    Debit
                                </span>
                            ) : (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#43b75d]">
                                    Credit
                                </span>
                            ),
                    },
                    {
                        title: 'Taxable (₹)',
                        dataIndex: 'taxableAmount',
                        key: 'tx',
                        width: 115,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'IGST (₹)',
                        dataIndex: 'igst',
                        key: 'ig',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'CGST (₹)',
                        dataIndex: 'cgst',
                        key: 'cg',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'SGST (₹)',
                        dataIndex: 'sgst',
                        key: 'sg',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    actionsCol,
                ];

            case 'cdnur':
                return [
                    {
                        title: 'Supply Type',
                        dataIndex: 'portCode',
                        key: 'st',
                        width: 110,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                {v || '—'}
                            </span>
                        ),
                    },
                    {
                        title: 'Note No',
                        dataIndex: 'invoiceNo',
                        key: 'no',
                        width: 120,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'Date',
                        dataIndex: 'invoiceDate',
                        key: 'nd',
                        width: 105,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                {v}
                            </span>
                        ),
                    },
                    {
                        title: 'Type',
                        dataIndex: 'buyerName',
                        key: 'ty',
                        width: 100,
                        render: v =>
                            v === 'D' ? (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#fef2f2] text-[#ef4444]">
                                    Debit
                                </span>
                            ) : (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#43b75d]">
                                    Credit
                                </span>
                            ),
                    },
                    {
                        title: 'Taxable Value (₹)',
                        dataIndex: 'taxableAmount',
                        key: 'tx',
                        width: 130,
                        render: v => (
                            <span className="text-xs" style={{ color: '#0f172a' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'IGST (₹)',
                        dataIndex: 'igst',
                        key: 'ig',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    actionsCol,
                ];

            case 'advances':
                return [
                    {
                        title: 'POS',
                        key: 'ps',
                        width: 130,
                        render: (_, r) => {
                            const v = r.placeOfSupply || r.buyerName;
                            return (
                                <span className="text-xs" style={{ color: '#0f172a' }}>
                                    {INDIAN_STATES.find(s => s.name === v)?.name ??
                                        INDIAN_STATES.find(s => String(s.code) === String(v))
                                            ?.name ??
                                        v ??
                                        '—'}
                                </span>
                            );
                        },
                    },
                    {
                        title: 'Rate',
                        key: 'rt',
                        width: 70,
                        render: (_, r) => {
                            const tax = Number(r.igst) + Number(r.cgst) + Number(r.sgst);
                            const rate = r.taxableAmount
                                ? Math.round((tax / Number(r.taxableAmount)) * 100)
                                : 0;
                            return (
                                <span className="text-xs" style={{ color: '#475569' }}>
                                    {rate}%
                                </span>
                            );
                        },
                    },
                    {
                        title: 'Gross Advance',
                        dataIndex: 'taxableAmount',
                        key: 'tx',
                        width: 140,
                        render: v => (
                            <span className="text-xs font-medium" style={{ color: '#0f172a' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'IGST (₹)',
                        dataIndex: 'igst',
                        key: 'ig',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'CGST (₹)',
                        dataIndex: 'cgst',
                        key: 'cg',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    {
                        title: 'SGST (₹)',
                        dataIndex: 'sgst',
                        key: 'sg',
                        width: 100,
                        render: v => (
                            <span className="text-xs" style={{ color: '#475569' }}>
                                ₹ {fmt(Number(v))}
                            </span>
                        ),
                    },
                    actionsCol,
                ];

            default:
                return [];
        }
    };

    const withHide =
        (fn: (form: B2CAddForm) => Promise<boolean>) =>
        async (form: B2CAddForm): Promise<boolean> => {
            const ok = await fn(form);
            if (ok) setShowAddForm(false);
            return ok;
        };

    const renderAddForm = () => {
        switch (activeTab) {
            case 'b2c-large':
                return (
                    <B2CLargeAddForm
                        onAdd={withHide(form => onAddApiRow('b2c-large', form))}
                        isAdding={isAddingApi}
                    />
                );
            case 'b2c-small':
                return (
                    <B2CSmallAddForm
                        onAdd={withHide(form => onAddApiRow('b2c-small', form))}
                        isAdding={isAddingApi}
                        sellerStateCode={sellerStateCode}
                    />
                );
            case 'exports':
                return (
                    <ExportsAddForm
                        onAdd={withHide(form => onAddApiRow('exports', form))}
                        isAdding={isAddingApi}
                    />
                );
            case 'cdnr':
                return (
                    <CdnrAddForm
                        onAdd={withHide(form => onAddApiRow('cdnr', form))}
                        isAdding={isAddingApi}
                    />
                );
            case 'cdnur':
                return (
                    <CdnurAddForm
                        onAdd={withHide(form => onAddApiRow('cdnur', form))}
                        isAdding={isAddingApi}
                    />
                );
            case 'advances':
                return (
                    <AdvancesAddForm
                        onAdd={withHide(form => onAddApiRow('advances', form))}
                        isAdding={isAddingApi}
                    />
                );
            default:
                return null;
        }
    };

    const activeRows = getInvoices(activeTab);

    return (
        <>
            <Flex vertical gap={20}>
                <Flex vertical gap={4}>
                    <Typography.Text className="font-bold text-xl text-[#1e293b]">
                        B2C &amp; Other Supplies
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#64748b]">
                        Tables 5, 6A, 7, 8, 9B, 11 — All other outward supply categories
                    </Typography.Text>
                </Flex>
                <SubTabBar
                    tabs={B2C_TABS}
                    active={activeTab}
                    counts={counts}
                    onChange={v => {
                        setActiveTab(v);
                        setShowAddForm(false);
                    }}
                />
                <Typography.Text className="text-xs text-[#64748b]">
                    {B2C_SUBTITLES[activeTab]}
                </Typography.Text>

                {activeTab === 'nil-exempt' ? (
                    <NilExemptGrid
                        values={nilValues}
                        onChange={onNilChange}
                        onSave={onSaveNilExempt}
                        isSaving={isAddingApi}
                    />
                ) : (
                    <>
                        <Flex align="center" justify="flex-end" gap={8}>
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                style={{ borderColor: '#cbd5e1', color: '#475569' }}
                                onClick={() => {
                                    const tpl = B2C_TAB_TEMPLATES[activeTab];
                                    if (!tpl.headers.length) return;
                                    const csv = [tpl.headers.join(','), tpl.sample.join(',')].join(
                                        '\n'
                                    );
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = tpl.filename;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                Template
                            </Button>
                            <Button
                                size="small"
                                icon={<CloudUploadOutlined />}
                                style={{ borderColor: '#FF3A3A', color: '#FF3A3A' }}
                                onClick={() => setCsvUploadOpen(true)}
                            >
                                Upload
                            </Button>
                            <Button
                                type="primary"
                                danger
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => setShowAddForm(p => !p)}
                            >
                                Add
                            </Button>
                        </Flex>
                        {activeRows.length > 0 ? (
                            <Table
                                dataSource={activeRows}
                                columns={getColumns(activeTab)}
                                rowKey="id"
                                pagination={false}
                                size="small"
                                scroll={{ x: 'max-content' }}
                            />
                        ) : (
                            <Flex
                                align="center"
                                justify="center"
                                className="border border-[#e2e8f0] rounded-xl py-6"
                            >
                                <Typography.Text className="text-sm text-[#94a3b8]">
                                    No entries yet
                                </Typography.Text>
                            </Flex>
                        )}
                        {showAddForm && renderAddForm()}
                    </>
                )}
                <NavButtons step={3} onBack={onBack} onNext={onNext} />
            </Flex>

            <InvoiceCsvUploadModal
                open={csvUploadOpen}
                title={`Upload ${B2C_TAB_TEMPLATES[activeTab] ? (B2C_TABS.find(t => t.key === activeTab)?.label ?? '') : ''} Invoices`}
                templateHeaders={B2C_TAB_TEMPLATES[activeTab].headers}
                templateSample={B2C_TAB_TEMPLATES[activeTab].sample}
                templateFilename={B2C_TAB_TEMPLATES[activeTab].filename}
                onClose={() => setCsvUploadOpen(false)}
                onImport={async items => {
                    const typeMap: Record<B2CTabKey, string> = {
                        'b2c-large': 'B2C',
                        'b2c-small': 'B2C_SMALL',
                        exports: 'EXPORT',
                        cdnr: 'CDNR',
                        cdnur: 'CDNUR',
                        advances: 'ADVANCE',
                        'nil-exempt': 'NIL',
                    };
                    const tab = activeTab;
                    const invoiceType = typeMap[tab];
                    const isExport = tab === 'exports';
                    const typedItems = items.map((item, idx) => {
                        const taxRate = item.taxRate ?? 0;
                        const taxable = item.taxableAmount ?? 0;
                        const totalTax = (taxable * taxRate) / 100;
                        const isIntra =
                            tab === 'cdnr' || (tab === 'b2c-small' && item.supplyType === 'INTRA');
                        const calcIgst = !isExport && !isIntra && taxRate > 0 ? totalTax : 0;
                        const calcCgst = !isExport && isIntra && taxRate > 0 ? totalTax / 2 : 0;
                        const calcSgst = !isExport && isIntra && taxRate > 0 ? totalTax / 2 : 0;
                        const igst = item.igst != null ? item.igst : calcIgst;
                        const cgst = item.cgst != null ? item.cgst : calcCgst;
                        const sgst = item.sgst != null ? item.sgst : calcSgst;
                        const { buyerName: rawBuyerName, exportType, noteType } = item;
                        let buyerName = rawBuyerName;
                        if (isExport) buyerName = exportType || rawBuyerName;
                        else if (tab === 'cdnr' || tab === 'cdnur')
                            buyerName = noteType || rawBuyerName;
                        return {
                            invoiceType,
                            invoiceNo: item.invoiceNo || `${invoiceType}-CSV-${Date.now()}-${idx}`,
                            invoiceDate: item.invoiceDate || new Date().toISOString().slice(0, 10),
                            buyerGstin: item.buyerGstin,
                            buyerName,
                            placeOfSupply: item.placeOfSupply,
                            portCode: item.portCode,
                            shippingBillNo: item.shippingBillNo,
                            shippingBillDate: item.shippingBillDate,
                            taxableAmount: taxable,
                            igst,
                            cgst,
                            sgst,
                        };
                    });
                    return onUploadCsv(typedItems);
                }}
            />
        </>
    );
};

// ─── Step 4 — HSN & Documents ─────────────────────────────────────────────────

interface DocAddForm {
    documentType: string;
    serialFrom: string;
    serialTo: string;
    totalIssued: number;
    cancelled: number;
}
const EMPTY_DOC_FORM: DocAddForm = {
    documentType: '',
    serialFrom: '',
    serialTo: '',
    totalIssued: 0,
    cancelled: 0,
};

type HsnUploadRow = {
    hsnCode: string;
    description: string;
    uqc: string;
    qty: string;
    taxable: string;
    rate: number;
};

const parseHsnCsv = (text: string): HsnUploadRow[] => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h =>
        h
            .trim()
            .replace(/^"|"$/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
    );
    return lines
        .slice(1)
        .map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const get = (...keys: string[]) => {
                const found = keys.find(k => headers.indexOf(k) !== -1);
                return found ? (vals[headers.indexOf(found)] ?? '') : '';
            };
            return {
                hsnCode: get('hsncode', 'hsn', 'hsnorsaccode'),
                description: get('description', 'desc'),
                uqc: get('uqc', 'unit'),
                qty: get('quantity', 'qty'),
                taxable: get('taxablevalue', 'taxableamount', 'taxable'),
                rate: parseFloat(get('taxrate', 'rate', 'gstrate')) || 0,
            };
        })
        .filter(r => r.hsnCode);
};

const HsnDocumentsStep = ({
    hsnRows,
    docRows,
    onAddDoc,
    onDeleteDoc,
    onAddHsn,
    onDeleteHsn,
    onUploadHsn,
    onUploadDoc,
    isSavingHsn,
    isSavingDoc,
    onNext,
    onBack,
}: {
    hsnRows: HsnSummaryRow[];
    docRows: DocumentRow[];
    onAddDoc: (form: DocAddForm) => Promise<void>;
    onDeleteDoc: (id: string) => Promise<void>;
    onAddHsn: (values: HsnUploadRow) => Promise<void>;
    onDeleteHsn: (id: string) => Promise<void>;
    onUploadHsn: (rows: HsnUploadRow[]) => Promise<void>;
    onUploadDoc: (rows: DocAddForm[]) => Promise<void>;
    isSavingHsn: boolean;
    isSavingDoc: boolean;
    onNext: () => void;
    onBack: () => void;
}) => {
    const dispatch = useAppDispatch();
    const [showHsnForm, setShowHsnForm] = useState(false);
    const [showDocForm, setShowDocForm] = useState(false);
    const [isUploadingHsn, setIsUploadingHsn] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const isUploadingHsnRef = useRef(false);
    const isUploadingDocRef = useRef(false);
    const hsnUploadRef = useRef<HTMLInputElement>(null);
    const docUploadRef = useRef<HTMLInputElement>(null);

    const handleHsnFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isUploadingHsnRef.current) return;
        isUploadingHsnRef.current = true;
        const file = e.target.files?.[0];
        if (!file) {
            isUploadingHsnRef.current = false;
            return;
        }
        e.target.value = '';
        setIsUploadingHsn(true);
        try {
            const text = await file.text();
            const parsedRows = parseHsnCsv(text);
            if (!parsedRows.length) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description:
                            'No valid HSN rows found. Ensure the file has an HSN Code column.',
                    })
                );
            } else {
                const existingCodes = new Set(hsnRows.map(r => String(r.hsnCode).trim()));
                const seenCodes = new Set<string>();
                const newRows = parsedRows.filter(r => {
                    const code = String(r.hsnCode).trim();
                    if (existingCodes.has(code) || seenCodes.has(code)) return false;
                    seenCodes.add(code);
                    return true;
                });
                const skipped = parsedRows.length - newRows.length;
                if (!newRows.length) {
                    dispatch(
                        showToast({
                            variant: 'error',
                            description:
                                'All HSN codes in this file already exist. No records imported.',
                        })
                    );
                } else {
                    if (skipped > 0)
                        dispatch(
                            showToast({
                                variant: 'warning',
                                description: `${skipped} duplicate HSN code${skipped !== 1 ? 's' : ''} skipped.`,
                            })
                        );
                    await onUploadHsn(newRows);
                }
            }
        } catch {
            /* handled in parent */
        }
        isUploadingHsnRef.current = false;
        setIsUploadingHsn(false);
    };

    const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isUploadingDocRef.current) return;
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        isUploadingDocRef.current = true;
        setIsUploadingDoc(true);
        try {
            const text = await file.text();
            const lines = text.trim().split('\n').filter(Boolean);
            if (lines.length < 2) {
                dispatch(
                    showToast({ variant: 'error', description: 'No valid rows found in file.' })
                );
                return;
            }
            const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const headers = lines[0].split(',').map(h => norm(h.trim().replace(/^"|"$/g, '')));
            const colIdx = (keys: string[]) => headers.findIndex(h => keys.includes(h));
            const typeIdx = colIdx(['documenttype', 'doctype', 'type']);
            const fromIdx = colIdx(['serialfrom', 'from', 'serfrom', 'fromserial']);
            const toIdx = colIdx(['serialto', 'to', 'serto', 'toserial']);
            const issuedIdx = colIdx(['totalissued', 'issued', 'numberissued']);
            const cancelIdx = colIdx(['cancelled', 'cancel', 'canceled']);
            const rows: DocAddForm[] = lines
                .slice(1)
                .map(line => {
                    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    return {
                        documentType: typeIdx >= 0 ? (vals[typeIdx] ?? '') : '',
                        serialFrom: fromIdx >= 0 ? (vals[fromIdx] ?? '') : '',
                        serialTo: toIdx >= 0 ? (vals[toIdx] ?? '') : '',
                        totalIssued: issuedIdx >= 0 ? parseInt(vals[issuedIdx] ?? '0', 10) || 0 : 0,
                        cancelled: cancelIdx >= 0 ? parseInt(vals[cancelIdx] ?? '0', 10) || 0 : 0,
                    };
                })
                .filter(r => r.documentType && r.serialFrom);
            if (!rows.length) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description:
                            'No valid rows found. Ensure "Document Type" and "Serial From" columns exist.',
                    })
                );
                return;
            }
            await onUploadDoc(rows);
        } catch {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Failed to read file. Please check the format.',
                })
            );
        } finally {
            isUploadingDocRef.current = false;
            setIsUploadingDoc(false);
        }
    };

    const allHsnRows = hsnRows.map((r, i) => ({ ...r, _id: String(r.id ?? `a${i}`) }));

    const hsnColumns: ColumnsType<HsnSummaryRow & { _id: string }> = [
        {
            title: 'HSN Code',
            dataIndex: 'hsnCode',
            key: 'hc',
            width: 110,
            render: v => (
                <span className="text-xs font-medium" style={{ color: '#0f172a' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'dc',
            width: 160,
            render: v => <span className="text-xs text-[#475569]">{v || '—'}</span>,
        },
        {
            title: 'UQC',
            dataIndex: 'uqc',
            key: 'uq',
            width: 80,
            render: v => <span className="text-xs text-[#475569]">{v}</span>,
        },
        {
            title: 'Qty',
            dataIndex: 'qty',
            key: 'qt',
            width: 90,
            render: v => <span className="text-xs text-[#475569]">{Number(v).toFixed(2)}</span>,
        },
        {
            title: 'Taxable Value (₹)',
            dataIndex: 'taxableAmount',
            key: 'tx',
            width: 150,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    ₹ {fmt(Number(v))}
                </span>
            ),
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rt',
            width: 70,
            render: v => <span className="text-xs text-[#475569]">{v}%</span>,
        },
        {
            title: 'IGST (₹)',
            dataIndex: 'igst',
            key: 'ig',
            width: 110,
            render: v => <span className="text-xs text-[#475569]">₹ {fmt(Number(v))}</span>,
        },
        {
            title: 'CGST (₹)',
            dataIndex: 'cgst',
            key: 'cg',
            width: 110,
            render: v => <span className="text-xs text-[#475569]">₹ {fmt(Number(v))}</span>,
        },
        {
            title: 'SGST (₹)',
            dataIndex: 'sgst',
            key: 'sg',
            width: 110,
            render: v => <span className="text-xs text-[#475569]">₹ {fmt(Number(v))}</span>,
        },
        {
            title: 'Actions',
            key: 'ac',
            width: 80,
            fixed: 'right',
            render: (_, row) => {
                if (row.id == null) {
                    return (
                        <Tooltip title="HSN entry auto-generated from invoices and cannot be deleted from here.">
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                disabled
                                className="text-[#cbd5e1]"
                            />
                        </Tooltip>
                    );
                }
                return (
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            className="text-[#94a3b8] hover:text-red-500"
                            onClick={() => onDeleteHsn(String(row.id))}
                        />
                    </Tooltip>
                );
            },
        },
    ];

    const docColumns: ColumnsType<DocumentRow> = [
        {
            title: 'Document Type',
            dataIndex: 'documentType',
            key: 'dt',
            width: 160,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Serial From',
            dataIndex: 'serialFrom',
            key: 'sf',
            width: 120,
            render: v => <span className="text-xs text-[#475569]">{v}</span>,
        },
        {
            title: 'Serial To',
            dataIndex: 'serialTo',
            key: 'st',
            width: 120,
            render: v => <span className="text-xs text-[#475569]">{v}</span>,
        },
        {
            title: 'Total Issued',
            dataIndex: 'totalIssued',
            key: 'ti',
            width: 110,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Cancelled',
            dataIndex: 'cancelled',
            key: 'cn',
            width: 100,
            render: v => <span className="text-xs text-[#475569]">{v}</span>,
        },
        {
            title: 'Net Issued',
            dataIndex: 'netIssued',
            key: 'ni',
            width: 100,
            render: v => (
                <span className="text-xs font-medium" style={{ color: '#0f172a' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'ac',
            width: 80,
            fixed: 'right',
            render: (_, row) => (
                <Tooltip title="Delete">
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className="text-[#94a3b8] hover:text-red-500"
                        onClick={() => onDeleteDoc(row.id)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={28}>
            {/* HSN/SAC Summary */}
            <Flex vertical gap={16}>
                <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
                    <Flex vertical gap={4}>
                        <Typography.Text className="font-bold text-xl text-[#1e293b]">
                            HSN/SAC Summary
                        </Typography.Text>
                        <Typography.Text className="text-sm text-[#64748b]">
                            Table 12 — Mandatory for all registered taxpayers
                        </Typography.Text>
                    </Flex>
                    <Flex gap={8} align="center" wrap="wrap">
                        <input
                            ref={hsnUploadRef}
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={handleHsnFileChange}
                        />
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            style={{ borderColor: '#cbd5e1', color: '#475569' }}
                            onClick={() => {
                                const csv = [
                                    'HSN Code,Description,UQC,Quantity,Taxable Value,Tax Rate (%)',
                                    '1001,Rice,BAG,100,10000,5',
                                ].join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'hsn_template.csv';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            Template
                        </Button>
                        <Button
                            size="small"
                            icon={<CloudUploadOutlined />}
                            style={{ borderColor: '#FF3A3A', color: '#FF3A3A' }}
                            loading={isUploadingHsn}
                            disabled={isUploadingHsn}
                            onClick={() => {
                                if (!isUploadingHsnRef.current) hsnUploadRef.current?.click();
                            }}
                        >
                            Upload
                        </Button>
                        <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setShowHsnForm(p => !p)}
                        >
                            Add HSN
                        </Button>
                    </Flex>
                </Flex>
                <InfoBanner text="A 4-digit HSN required for turnover ₹1.5–5 Cr; 6-digit for > ₹5 Cr." />
                {allHsnRows.length > 0 ? (
                    <Table
                        dataSource={allHsnRows}
                        columns={hsnColumns}
                        rowKey="_id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 1070 }}
                    />
                ) : (
                    <Flex
                        align="center"
                        justify="center"
                        className="rounded-xl py-10"
                        style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}
                    >
                        <Typography.Text className="text-sm text-[#94a3b8]">
                            No HSN data yet — add invoices with HSN codes in Steps 2 & 3
                        </Typography.Text>
                    </Flex>
                )}
                {showHsnForm && (
                    <Formik
                        initialValues={{
                            hsnCode: '',
                            description: '',
                            uqc: '',
                            qty: '',
                            taxable: '',
                            rate: 18,
                        }}
                        validationSchema={hsnSchema}
                        onSubmit={async (values, { resetForm }) => {
                            const isDup = hsnRows.some(
                                r => String(r.hsnCode).trim() === String(values.hsnCode).trim()
                            );
                            if (isDup) {
                                dispatch(
                                    showToast({
                                        description: `HSN code ${values.hsnCode} already exists`,
                                        variant: 'error',
                                    })
                                );
                                return;
                            }
                            await onAddHsn(values);
                            resetForm();
                            setShowHsnForm(false);
                        }}
                    >
                        {({ submitForm }) => (
                            <FormikForm>
                                <div
                                    id="hsn-add-form"
                                    className="bg-[#f8fafc] rounded-[18px] px-4 py-4"
                                >
                                    <Flex gap={10} align="flex-start" wrap="wrap">
                                        <div style={{ flex: '1 1 130px', minWidth: '130px' }}>
                                            <TextInput
                                                name="hsnCode"
                                                type="text"
                                                placeholder="HSN/SAC Code"
                                                size="large"
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '2 1 150px', minWidth: '150px' }}>
                                            <TextInput
                                                name="description"
                                                type="text"
                                                placeholder="Description"
                                                size="large"
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 100px', minWidth: '100px' }}>
                                            <SelectInput
                                                name="uqc"
                                                placeholder="UQC"
                                                size="large"
                                                options={UQC_OPTIONS.map(u => ({
                                                    value: u,
                                                    label: u,
                                                }))}
                                                showSearch
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 90px', minWidth: '90px' }}>
                                            <TextInput
                                                name="qty"
                                                type="text"
                                                placeholder="Qty"
                                                size="large"
                                                allowTwoDecimalsOnly
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 130px', minWidth: '130px' }}>
                                            <TextInput
                                                name="taxable"
                                                type="text"
                                                placeholder="Taxable Value"
                                                size="large"
                                                prefix={RUPEE_PREFIX}
                                                allowTwoDecimalsOnly
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 90px', minWidth: '90px' }}>
                                            <SelectInput
                                                name="rate"
                                                placeholder="%"
                                                size="large"
                                                options={TAX_RATE_OPTIONS}
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <Button
                                            loading={isSavingHsn}
                                            onClick={submitForm}
                                            style={{
                                                flex: '1 1 80px',
                                                minWidth: '80px',
                                                height: 40,
                                                borderRadius: 8,
                                                background: '#ff4f4f',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: 16,
                                                fontWeight: 500,
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </Flex>
                                </div>
                            </FormikForm>
                        )}
                    </Formik>
                )}
            </Flex>

            <div className="border-t border-[#f1f5f9]" />

            {/* Documents Issued */}
            <Flex vertical gap={16}>
                <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
                    <Flex vertical gap={4}>
                        <Typography.Text className="font-bold text-xl text-[#1e293b]">
                            Documents Issued
                        </Typography.Text>
                        <Typography.Text className="text-sm text-[#64748b]">
                            Table 13 — Documents issued during the period
                        </Typography.Text>
                    </Flex>
                    <Flex gap={8} wrap="wrap">
                        <input
                            ref={docUploadRef}
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={handleDocFileChange}
                        />
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            style={{ borderColor: '#cbd5e1', color: '#475569' }}
                            onClick={() => {
                                const csv = [
                                    'Document Type,Serial From,Serial To,Total Issued,Cancelled',
                                    'Invoices,INV-001,INV-100,100,2',
                                ].join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'doc_template.csv';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            Template
                        </Button>
                        <Button
                            size="small"
                            icon={<CloudUploadOutlined />}
                            style={{ borderColor: '#FF3A3A', color: '#FF3A3A' }}
                            loading={isUploadingDoc}
                            disabled={isUploadingDoc}
                            onClick={() => {
                                if (!isUploadingDocRef.current) docUploadRef.current?.click();
                            }}
                        >
                            Upload
                        </Button>
                        <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setShowDocForm(p => !p)}
                        >
                            Add
                        </Button>
                    </Flex>
                </Flex>
                <InfoBanner text="A 4-digit HSN required for turnover ₹1.5–5 Cr; 6-digit for > ₹5 Cr." />
                {docRows.length > 0 && (
                    <Table
                        dataSource={docRows}
                        columns={docColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 'max-content' }}
                    />
                )}
                {showDocForm && (
                    <Formik
                        initialValues={EMPTY_DOC_FORM}
                        validationSchema={documentsSchema}
                        onSubmit={async (values, { resetForm }) => {
                            await onAddDoc(values);
                            resetForm();
                            setShowDocForm(false);
                        }}
                    >
                        {({ submitForm }) => (
                            <FormikForm>
                                <div
                                    id="doc-add-form"
                                    className="bg-[#f8fafc] rounded-[18px] px-6 py-5"
                                >
                                    <Flex gap={14} align="flex-start" wrap="wrap">
                                        <div style={{ flex: '2 0 0' }}>
                                            <SelectInput
                                                name="documentType"
                                                placeholder="Document Type"
                                                size="large"
                                                options={DOC_TYPES.map(d => ({
                                                    value: d,
                                                    label: d,
                                                }))}
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                            <TextInput
                                                name="serialFrom"
                                                type="text"
                                                placeholder="Serial From"
                                                size="large"
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                            <TextInput
                                                name="serialTo"
                                                type="text"
                                                placeholder="Serial To"
                                                size="large"
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                            <TextInput
                                                name="totalIssued"
                                                type="text"
                                                placeholder="Total Issued"
                                                size="large"
                                                allowNumbersOnly
                                                isRequired
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                            <TextInput
                                                name="cancelled"
                                                type="text"
                                                placeholder="Cancelled"
                                                size="large"
                                                allowNumbersOnly
                                                formItemClass="!mb-0"
                                            />
                                        </div>
                                        <Button
                                            loading={isSavingDoc}
                                            onClick={submitForm}
                                            style={{
                                                flex: '1 1 120px',
                                                minWidth: 0,
                                                height: 40,
                                                borderRadius: 8,
                                                background: '#ff4f4f',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: 16,
                                                fontWeight: 500,
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </Flex>
                                </div>
                            </FormikForm>
                        )}
                    </Formik>
                )}
            </Flex>

            <NavButtons step={4} onBack={onBack} onNext={onNext} />
        </Flex>
    );
};

// ─── Step 5 — Amendments ──────────────────────────────────────────────────────

interface AmendAddForm {
    origInvNo: string;
    origPeriod: string;
    receiverGstin: string;
    receiverName: string;
    placeOfSupply?: string;
    noteType?: string;
    portCode?: string;
    shippingBillNo?: string;
    shippingBillDate?: string;
    revisedInvNo: string;
    revisedDate: string;
    taxableAmount: number;
    rate: number;
}

const AMEND_TEMPLATES: Record<string, { headers: string; sample: string }> = {
    b2ba: {
        headers:
            'Orig Invoice No,Orig Period (MMYYYY),Receiver GSTIN,Receiver Name,Revised Invoice No,Revised Date (YYYY-MM-DD),Taxable Amount,Tax Rate (%)',
        sample: 'INV-001,062024,27AABCU9603R1ZX,ABC Pvt Ltd,INV-001-R,2024-07-15,10000,18',
    },
    b2cla: {
        headers:
            'Orig Invoice No,Orig Period (MMYYYY),Revised Invoice No,Revised Date (YYYY-MM-DD),Taxable Amount,Tax Rate (%)',
        sample: 'INV-001,062024,INV-001-R,2024-07-15,10000,18',
    },
    b2csa: {
        headers:
            'Orig Invoice No,Orig Period (MMYYYY),Revised Invoice No,Revised Date (YYYY-MM-DD),Taxable Amount,Tax Rate (%)',
        sample: 'INV-001,062024,INV-001-R,2024-07-15,10000,18',
    },
    cdnra: {
        headers:
            'Orig Invoice No,Orig Period (MMYYYY),Receiver GSTIN,Receiver Name,Note Type (C/D),Revised Note No,Revised Date (YYYY-MM-DD),Taxable Amount,Tax Rate (%)',
        sample: 'INV-001,062024,27AABCU9603R1ZX,ABC Pvt Ltd,C,CN-001,2024-07-15,10000,18',
    },
    cdnura: {
        headers:
            'Orig Invoice No,Orig Period (MMYYYY),Note Type (C/D),Revised Note No,Revised Date (YYYY-MM-DD),Taxable Amount,Tax Rate (%)',
        sample: 'INV-001,062024,C,CN-001,2024-07-15,10000,18',
    },
    expa: {
        headers:
            'Orig Invoice No,Orig Period (MMYYYY),Revised Invoice No,Revised Date (YYYY-MM-DD),Taxable Amount,Tax Rate (%)',
        sample: 'INV-001,062024,INV-001-R,2024-07-15,10000,0',
    },
};

const AmendmentsStep = ({
    amendments,
    onAddAmend,
    onDeleteAmend,
    onUploadAmend,
    isSaving,
    initialForm,
    initialTab,
    onNext,
    onBack,
}: {
    amendments: Gstr1Amendments;
    onAddAmend: (amendType: AmendType, form: AmendAddForm) => Promise<void>;
    onDeleteAmend: (id: string) => Promise<void>;
    onUploadAmend: (amendType: AmendType, rows: AmendAddForm[]) => Promise<void>;
    isSaving: boolean;
    initialForm?: Partial<AmendAddForm>;
    initialTab?: string;
    onNext: () => void;
    onBack: () => void;
}) => {
    const dispatch = useAppDispatch();
    const [hasAmendments, setHasAmendments] = useState(!!initialForm);
    const [activeTab, setActiveTab] = useState<AmendTabKey>((initialTab as AmendTabKey) ?? 'b2ba');
    const [showAmendForm, setShowAmendForm] = useState(!!initialForm);
    const [isUploadingAmend, setIsUploadingAmend] = useState(false);
    const isUploadingAmendRef = useRef(false);
    const amendUploadRef = useRef<HTMLInputElement>(null);
    const rows: AmendmentRow[] = amendments[activeTab]?.invoices ?? [];

    const handleAmendFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isUploadingAmendRef.current) return;
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        isUploadingAmendRef.current = true;
        setIsUploadingAmend(true);
        try {
            const text = await file.text();
            const lines = text.trim().split('\n').filter(Boolean);
            if (lines.length < 2) {
                dispatch(
                    showToast({ variant: 'error', description: 'No valid rows found in file.' })
                );
                return;
            }
            const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const headers = lines[0].split(',').map(h => norm(h.trim().replace(/^"|"$/g, '')));
            const colIdx = (keys: string[]) => headers.findIndex(h => keys.includes(h));
            const parseDate = (v: string) => {
                const t = (v ?? '').trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
                const m = t.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
                if (m) return `${m[3]}-${m[2]}-${m[1]}`;
                return t;
            };
            const getVal = (vals: string[], idx: number) =>
                idx >= 0 ? (vals[idx] ?? '').trim() : '';
            const origNoIdx = colIdx([
                'originvoiceno',
                'orignvoiceno',
                'originalinvoiceno',
                'oriinvoiceno',
            ]);
            const origPeriodIdx = colIdx([
                'origperiodmmyyyy',
                'origperiod',
                'originalperiod',
                'period',
            ]);
            const revNoIdx = colIdx([
                'revisedinvoiceno',
                'revisedinvno',
                'revisednoteno',
                'revisednoteno',
            ]);
            const revDateIdx = colIdx(['reviseddateyyyymmdd', 'reviseddate', 'revdate']);
            const taxableIdx = colIdx(['taxableamount', 'taxablevalue', 'taxable']);
            const rateIdx = colIdx(['taxrate', 'taxrate%', 'rate']);
            const gstinIdx = colIdx(['receivergstin', 'gstin', 'buyergstin']);
            const nameIdx = colIdx(['receivername', 'buyername', 'partyname']);
            const posIdx = colIdx(['placeofsupply', 'pos', 'statecode']);
            const noteTypeIdx = colIdx(['notetyped', 'notetype', 'notetyped/c']);
            const portCodeIdx = colIdx(['portcode', 'port']);
            const sbNoIdx = colIdx(['shippingbillno', 'shippingbill', 'sbno']);
            const sbDateIdx = colIdx(['shippingbilldateyyyymmdd', 'shippingbilldate', 'sbdate']);
            const parsed: AmendAddForm[] = lines
                .slice(1)
                .map(line => {
                    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    return {
                        origInvNo: getVal(vals, origNoIdx),
                        origPeriod: getVal(vals, origPeriodIdx),
                        receiverGstin: getVal(vals, gstinIdx),
                        receiverName: getVal(vals, nameIdx),
                        placeOfSupply: getVal(vals, posIdx) || undefined,
                        noteType: getVal(vals, noteTypeIdx) || undefined,
                        portCode: getVal(vals, portCodeIdx) || undefined,
                        shippingBillNo: getVal(vals, sbNoIdx) || undefined,
                        shippingBillDate: parseDate(getVal(vals, sbDateIdx)) || undefined,
                        revisedInvNo: getVal(vals, revNoIdx),
                        revisedDate: parseDate(getVal(vals, revDateIdx)),
                        taxableAmount: parseFloat(getVal(vals, taxableIdx)) || 0,
                        rate: parseFloat(getVal(vals, rateIdx)) || 0,
                    };
                })
                .filter(r => r.origInvNo && r.origPeriod);
            if (!parsed.length) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description:
                            'No valid rows found. Ensure "Orig Invoice No" and "Orig Period (MMYYYY)" columns exist.',
                    })
                );
                return;
            }
            await onUploadAmend(activeTab.toUpperCase() as AmendType, parsed);
        } catch {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Failed to read file. Please check the format.',
                })
            );
        } finally {
            isUploadingAmendRef.current = false;
            setIsUploadingAmend(false);
        }
    };
    const counts = Object.fromEntries(
        AMENDMENT_TABS.map(t => [t.key, amendments[t.key as AmendTabKey]?.count ?? 0])
    ) as Record<string, number>;

    const totalCount = Object.values(amendments).reduce((s, sec) => s + sec.count, 0);

    const hasGstin = activeTab === 'b2ba' || activeTab === 'cdnra';
    const columns: ColumnsType<AmendmentRow> = [
        {
            title: 'Orig Inv No',
            dataIndex: 'origInvNo',
            key: 'oi',
            width: 120,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Orig Period',
            dataIndex: 'origPeriod',
            key: 'op',
            width: 100,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    {v}
                </span>
            ),
        },
        ...(hasGstin
            ? [
                  {
                      title: 'Receiver GSTIN',
                      dataIndex: 'receiverGstin',
                      key: 'rg',
                      width: 155,
                      render: (v: string) => (
                          <span className="text-xs font-mono" style={{ color: '#475569' }}>
                              {v || '—'}
                          </span>
                      ),
                  },
              ]
            : []),
        {
            title: 'Rev Inv No',
            dataIndex: 'revisedInvNo',
            key: 'ri',
            width: 110,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    {v || '—'}
                </span>
            ),
        },
        {
            title: 'Rev Date',
            dataIndex: 'revisedDate',
            key: 'rd',
            width: 100,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    {v || '—'}
                </span>
            ),
        },
        {
            title: 'Taxable',
            dataIndex: 'taxableAmount',
            key: 'tx',
            width: 110,
            render: v => (
                <span className="text-xs" style={{ color: '#0f172a' }}>
                    ₹ {fmt(parseFloat(v))}
                </span>
            ),
        },
        {
            title: 'CGST (₹)',
            dataIndex: 'cgst',
            key: 'cg',
            width: 95,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    ₹ {fmt(parseFloat(v))}
                </span>
            ),
        },
        {
            title: 'SGST (₹)',
            dataIndex: 'sgst',
            key: 'sg',
            width: 95,
            render: v => (
                <span className="text-xs" style={{ color: '#475569' }}>
                    ₹ {fmt(parseFloat(v))}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'ac',
            width: 60,
            fixed: 'right' as const,
            render: (_: unknown, record: AmendmentRow) => (
                <Tooltip title="Delete">
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className="text-[#94a3b8] hover:text-red-500"
                        onClick={() => onDeleteAmend(String(record.id))}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Typography.Text className="font-bold text-xl text-[#1e293b]">
                        Amendments
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#64748b]">
                        Amendments to invoices filed in previous periods (Table 9A, 9C, 10)
                    </Typography.Text>
                </Flex>
                <Flex gap={10} align="center" wrap="wrap">
                    <Typography.Text className="text-sm text-[#475569]">
                        Has amendments
                    </Typography.Text>
                    <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasAmendments || totalCount > 0 ? 'bg-[#22c55e]' : 'bg-[#cbd5e1]'}`}
                        onClick={() => setHasAmendments(p => !p)}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${hasAmendments || totalCount > 0 ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </Flex>
            </Flex>

            {hasAmendments || totalCount > 0 ? (
                <>
                    <SubTabBar
                        tabs={AMENDMENT_TABS}
                        active={activeTab}
                        counts={counts}
                        onChange={v => setActiveTab(v as AmendTabKey)}
                    />

                    {/* Section description + action buttons */}
                    <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
                        <Typography.Text className="text-sm text-[#475569]">
                            {AMEND_SUBTITLES[activeTab]}
                        </Typography.Text>
                        <Flex gap={8} align="center" wrap="wrap">
                            <input
                                ref={amendUploadRef}
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={handleAmendFileChange}
                            />
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                style={{
                                    borderRadius: 8,
                                    borderColor: '#e2e8f0',
                                    color: '#475569',
                                    fontSize: 13,
                                }}
                                onClick={() => {
                                    const t = AMEND_TEMPLATES[activeTab] ?? AMEND_TEMPLATES.b2ba;
                                    const csv = [t.headers, t.sample].join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${activeTab}_amendment_template.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                Template
                            </Button>
                            <Button
                                size="small"
                                icon={<CloudUploadOutlined />}
                                style={{
                                    borderRadius: 8,
                                    borderColor: '#FF3A3A',
                                    color: '#FF3A3A',
                                    fontSize: 13,
                                }}
                                loading={isUploadingAmend}
                                disabled={isUploadingAmend}
                                onClick={() => {
                                    if (!isUploadingAmendRef.current)
                                        amendUploadRef.current?.click();
                                }}
                            >
                                Upload
                            </Button>
                            <Button
                                size="small"
                                icon={<PlusOutlined />}
                                type="primary"
                                danger
                                style={{ borderRadius: 8, fontSize: 13 }}
                                onClick={() => setShowAmendForm(p => !p)}
                            >
                                Add
                            </Button>
                        </Flex>
                    </Flex>

                    {rows.length > 0 ? (
                        <Table
                            dataSource={rows}
                            columns={columns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />
                    ) : (
                        <Flex
                            align="center"
                            justify="center"
                            className="border border-[#e2e8f0] rounded-xl py-6"
                        >
                            <Typography.Text className="text-sm text-[#94a3b8]">
                                No {activeTab.toUpperCase()} amendments yet
                            </Typography.Text>
                        </Flex>
                    )}

                    {/* Inline add form */}
                    {showAmendForm && (
                        <Formik
                            initialValues={{
                                origInvNo: initialForm?.origInvNo ?? '',
                                origPeriod: initialForm?.origPeriod ?? '',
                                receiverGstin: initialForm?.receiverGstin ?? '',
                                receiverName: initialForm?.receiverName ?? '',
                                placeOfSupply: '',
                                noteType: '',
                                portCode: '',
                                shippingBillNo: '',
                                shippingBillDate: '',
                                revisedInvNo: '',
                                revisedDate: '',
                                taxableAmount:
                                    initialForm?.taxableAmount != null
                                        ? String(initialForm.taxableAmount)
                                        : '',
                                rate: 18,
                            }}
                            validationSchema={amendmentSchema}
                            onSubmit={async (values, { resetForm }) => {
                                await onAddAmend(activeTab.toUpperCase() as AmendType, {
                                    origInvNo: values.origInvNo,
                                    origPeriod: values.origPeriod,
                                    receiverGstin: values.receiverGstin,
                                    receiverName: values.receiverName,
                                    placeOfSupply: values.placeOfSupply || undefined,
                                    noteType: values.noteType || undefined,
                                    portCode: values.portCode || undefined,
                                    shippingBillNo: values.shippingBillNo || undefined,
                                    shippingBillDate: values.shippingBillDate || undefined,
                                    revisedInvNo: values.revisedInvNo,
                                    revisedDate: values.revisedDate,
                                    taxableAmount: parseFloat(values.taxableAmount) || 0,
                                    rate: values.rate,
                                });
                                resetForm();
                                setShowAmendForm(false);
                            }}
                        >
                            {({ submitForm }) => (
                                <FormikForm>
                                    <div
                                        id="amend-add-form"
                                        className="bg-[#f8fafc] rounded-[18px] px-6 py-5"
                                    >
                                        <Flex vertical gap={12}>
                                            {/* Row 1 — common fields */}
                                            <Flex gap={14} align="flex-start" wrap="wrap">
                                                <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                                    <TextInput
                                                        name="origInvNo"
                                                        type="text"
                                                        placeholder={
                                                            activeTab === 'cdnra' ||
                                                            activeTab === 'cdnura'
                                                                ? 'Original Note No.'
                                                                : 'Original Invoice No.'
                                                        }
                                                        size="large"
                                                        isRequired
                                                        formItemClass="!mb-0"
                                                    />
                                                </div>
                                                <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                                    <TextInput
                                                        name="origPeriod"
                                                        type="text"
                                                        placeholder="Original Period (MMYYYY)"
                                                        size="large"
                                                        isRequired
                                                        formItemClass="!mb-0"
                                                    />
                                                </div>
                                                {(activeTab === 'b2ba' ||
                                                    activeTab === 'cdnra') && (
                                                    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                                        <TextInput
                                                            name="receiverGstin"
                                                            type="text"
                                                            placeholder="Receiver GSTIN"
                                                            size="large"
                                                            convertToUppercase
                                                            formItemClass="!mb-0"
                                                        />
                                                    </div>
                                                )}
                                                {(activeTab === 'b2ba' ||
                                                    activeTab === 'cdnra') && (
                                                    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                                        <TextInput
                                                            name="receiverName"
                                                            type="text"
                                                            placeholder="Receiver Name"
                                                            size="large"
                                                            formItemClass="!mb-0"
                                                        />
                                                    </div>
                                                )}
                                                {(activeTab === 'cdnra' ||
                                                    activeTab === 'cdnura') && (
                                                    <div style={{ flex: '0 0 140px' }}>
                                                        <SelectInput
                                                            name="noteType"
                                                            placeholder="Note Type"
                                                            size="large"
                                                            options={[
                                                                {
                                                                    value: 'C',
                                                                    label: 'C – Credit Note',
                                                                },
                                                                {
                                                                    value: 'D',
                                                                    label: 'D – Debit Note',
                                                                },
                                                            ]}
                                                            formItemClass="!mb-0"
                                                        />
                                                    </div>
                                                )}
                                            </Flex>
                                            {/* Row 2 — revised + amounts */}
                                            <Flex gap={14} align="flex-start" wrap="wrap">
                                                <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                                    <TextInput
                                                        name="revisedInvNo"
                                                        type="text"
                                                        placeholder={
                                                            activeTab === 'cdnra' ||
                                                            activeTab === 'cdnura'
                                                                ? 'Revised Note No.'
                                                                : 'Revised Invoice No.'
                                                        }
                                                        size="large"
                                                        formItemClass="!mb-0"
                                                    />
                                                </div>
                                                <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                                    <DatePickerInput
                                                        name="revisedDate"
                                                        placeholder="Revised Date"
                                                        size="large"
                                                        formItemClass="!mb-0"
                                                    />
                                                </div>
                                                <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                                                    <TextInput
                                                        name="taxableAmount"
                                                        type="text"
                                                        placeholder="Taxable Value"
                                                        size="large"
                                                        prefix={RUPEE_PREFIX}
                                                        allowTwoDecimalsOnly
                                                        isRequired
                                                        formItemClass="!mb-0"
                                                    />
                                                </div>
                                                <div style={{ flex: '0 0 120px' }}>
                                                    <SelectInput
                                                        name="rate"
                                                        placeholder="Rate"
                                                        size="large"
                                                        options={TAX_RATE_OPTIONS}
                                                        isRequired
                                                        formItemClass="!mb-0"
                                                    />
                                                </div>
                                                <Button
                                                    type="primary"
                                                    danger
                                                    loading={isSaving}
                                                    onClick={submitForm}
                                                    style={{
                                                        height: 40,
                                                        paddingInline: 24,
                                                        borderRadius: 10,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    </div>
                                </FormikForm>
                            )}
                        </Formik>
                    )}
                </>
            ) : (
                <Flex
                    align="center"
                    justify="center"
                    className="border border-[#e2e8f0] rounded-xl py-12"
                >
                    <Typography.Text className="text-sm text-[#94a3b8]">
                        No amendments for this period
                    </Typography.Text>
                </Flex>
            )}

            <NavButtons step={5} onBack={onBack} onNext={onNext} />
        </Flex>
    );
};

// ─── Step 6 — Save & Validate ────────────────────────────────────────────────

type SaveState = 'idle' | 'uploading' | 'done';

const SaveValidateStep = ({
    summary,
    onSaveToPortal,
    referenceId,
    isSavingToPortal,
    isNilReturn,
    onNext,
    onBack,
}: {
    summary: Gstr1Summary;
    onSaveToPortal: () => Promise<string | null>;
    referenceId: string | null;
    isSavingToPortal: boolean;
    isNilReturn: boolean;
    onNext: () => void;
    onBack: () => void;
}) => {
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [completedSteps, setCompletedSteps] = useState(0);

    const rows = [
        { section: 'B2B Invoices', entries: summary.b2b.count, taxable: summary.b2b.taxableAmount },
        { section: 'B2C Large', entries: summary.b2c.count, taxable: summary.b2c.taxableAmount },
        {
            section: 'B2C Small',
            entries: summary.b2cSmall.count,
            taxable: summary.b2cSmall.taxableAmount,
        },
        {
            section: 'Exports',
            entries: summary.export.count,
            taxable: summary.export.taxableAmount,
        },
        { section: 'CDNR', entries: summary.cdnr.count, taxable: summary.cdnr.taxableAmount },
        { section: 'CDNUR', entries: summary.cdnur.count, taxable: summary.cdnur.taxableAmount },
        {
            section: 'Advances (AT)',
            entries: summary.advance.count,
            taxable: summary.advance.taxableAmount,
        },
        {
            section: 'B2B Amendments',
            entries: summary.amendments.b2ba.count,
            taxable: summary.amendments.b2ba.taxableAmount,
        },
    ];

    const stepHeader = (
        <Flex vertical gap={4}>
            <Typography.Text className="font-bold text-xl text-[#1e293b]">
                Save &amp; Validate
            </Typography.Text>
            <Typography.Text className="text-sm text-[#64748b]">
                Upload invoice data to GST portal and check for validation errors
            </Typography.Text>
        </Flex>
    );

    const handleSave = async () => {
        setSaveState('uploading');
        setCompletedSteps(0);
        const ref = await onSaveToPortal();
        if (ref !== null) {
            setCompletedSteps(3);
            setSaveState('done');
        } else {
            setSaveState('idle');
        }
    };

    if (saveState === 'uploading') {
        const steps = [
            'Uploading invoice data to GST portal and checking for validation errors.',
            `Processing & validating... Ref: ${referenceId ?? '...'}`,
            'Polling return status (P/PE/ER)...',
        ];
        return (
            <Flex vertical gap={24}>
                {stepHeader}
                <Flex vertical gap={14}>
                    {steps.map((label, idx) => {
                        const isDone = completedSteps > idx;
                        const isActive = idx === 0 && !isDone;
                        let bgColor = '#f8fafc';
                        if (isDone) bgColor = '#ecfdf5';
                        else if (isActive) bgColor = '#fef2f2';

                        let borderColor = '#e2e8f0';
                        if (isDone) borderColor = '#bbf7d0';
                        else if (isActive) borderColor = '#fecaca';

                        let iconBg = '#f1f5f9';
                        if (isDone) iconBg = '#dcfce7';
                        else if (isActive) iconBg = '#fee2e2';

                        let textColor = '#94a3b8';
                        if (isDone) textColor = '#15803d';
                        else if (isActive) textColor = '#1e293b';

                        let icon: React.ReactNode = (
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#cbd5e1',
                                    display: 'inline-block',
                                }}
                            />
                        );
                        if (isDone)
                            icon = <CheckCircleFilled style={{ fontSize: 16, color: '#22c55e' }} />;
                        else if (isActive)
                            icon = (
                                <LoadingOutlined style={{ fontSize: 14, color: '#ef4444' }} spin />
                            );
                        return (
                            <Flex
                                key={idx}
                                gap={12}
                                align="center"
                                className="rounded-[14px] px-5 py-4 border"
                                style={{ backgroundColor: bgColor, borderColor }}
                            >
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="rounded-full flex-shrink-0"
                                    style={{ width: 32, height: 32, backgroundColor: iconBg }}
                                >
                                    {icon}
                                </Flex>
                                <Typography.Text className="text-sm" style={{ color: textColor }}>
                                    {label}
                                </Typography.Text>
                            </Flex>
                        );
                    })}
                </Flex>
            </Flex>
        );
    }

    if (saveState === 'done') {
        return (
            <Flex vertical gap={20}>
                {stepHeader}
                <Flex
                    gap={12}
                    align="center"
                    className="rounded-[14px] border px-6 py-[14px]"
                    style={{ backgroundColor: '#ecfdf5', borderColor: '#81cf92' }}
                >
                    <CheckCircleFilled style={{ fontSize: 18, color: '#22c55e', flexShrink: 0 }} />
                    <Flex vertical gap={2}>
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#15803d' }}
                        >
                            Data saved &amp; validated successfully
                        </Typography.Text>
                        <Typography.Text className="text-xs" style={{ color: '#15803d' }}>
                            Status: <span className="font-semibold">Processed</span>
                        </Typography.Text>
                    </Flex>
                </Flex>
                <Flex
                    vertical
                    gap={4}
                    className="rounded-[14px] border px-6 py-[14px]"
                    style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
                >
                    <Typography.Text className="text-xs text-[#475569]">
                        Reference ID
                    </Typography.Text>
                    <Typography.Text className="text-sm font-medium text-[#1e293b] font-mono">
                        {referenceId ?? '—'}
                    </Typography.Text>
                </Flex>
                <Flex
                    gap={12}
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    className="border-t border-[#e2e8f0] pt-5"
                >
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                        style={{
                            height: 48,
                            flex: '1 1 120px',
                            borderColor: '#cbd5e1',
                            color: '#475569',
                            fontSize: 15,
                        }}
                    >
                        Back
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        onClick={onNext}
                        style={{ height: 48, flex: '2 1 160px', fontSize: 15, fontWeight: 600 }}
                    >
                        Continue to Review
                    </Button>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={20}>
            {stepHeader}
            {isNilReturn && (
                <Flex
                    gap={10}
                    align="center"
                    className="rounded-xl px-4 py-3 border border-[#a7f3d0]"
                    style={{ backgroundColor: '#ecfdf5' }}
                >
                    <CheckCircleOutlined
                        style={{ color: '#059669', fontSize: 16, flexShrink: 0 }}
                    />
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-sm font-semibold text-[#065f46]">
                            Nil Return
                        </Typography.Text>
                        <Typography.Text className="text-xs text-[#047857]">
                            No outward supplies for this period. A nil return will be filed — no
                            invoice data will be uploaded.
                        </Typography.Text>
                    </Flex>
                </Flex>
            )}
            <Flex vertical gap={8}>
                <Typography.Text className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                    {isNilReturn ? 'Nil return — all sections will be zero' : 'Data to be uploaded'}
                </Typography.Text>
                <Flex
                    vertical
                    gap={0}
                    className="border border-[#e2e8f0] rounded-xl overflow-hidden"
                >
                    <div className="grid grid-cols-3 bg-[#f8fafc] border-b border-[#e2e8f0] px-5 py-3">
                        {['Section', 'Entries', 'Taxable Value'].map(h => (
                            <Typography.Text
                                key={h}
                                className="text-xs font-semibold"
                                style={{ color: '#64748b' }}
                            >
                                {h}
                            </Typography.Text>
                        ))}
                    </div>
                    {rows.map(row => (
                        <div
                            key={row.section}
                            className="grid grid-cols-3 px-5 py-3 border-b border-[#f1f5f9] last:border-b-0 bg-white hover:bg-[#fafafa] transition-colors"
                        >
                            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                                {row.section}
                            </Typography.Text>
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {row.entries}
                            </Typography.Text>
                            <Typography.Text
                                className="text-sm font-medium"
                                style={{ color: '#1e293b' }}
                            >
                                {fmtC(row.taxable)}
                            </Typography.Text>
                        </div>
                    ))}
                </Flex>
            </Flex>
            <Flex
                gap={8}
                align="center"
                className="rounded-lg px-4 py-3 border"
                style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}
            >
                <InfoCircleOutlined style={{ color: '#0ea5e9', fontSize: 13, flexShrink: 0 }} />
                <Typography.Text className="text-xs text-[#0369a1]">
                    Data will be sent securely to the GST portal. A reference ID will be generated
                    for tracking.
                </Typography.Text>
            </Flex>
            <Button
                type="primary"
                danger
                block
                loading={isSavingToPortal}
                style={{ height: 48, fontSize: 15, fontWeight: 600 }}
                onClick={handleSave}
            >
                Save to GST Portal
            </Button>
            <NavButtons step={6} onBack={onBack} onNext={() => {}} />
        </Flex>
    );
};

// ─── Step 7 — Review & Proceed ────────────────────────────────────────────────

const ReviewProceedStep = ({
    summary,
    monthLabel,
    portalSummary,
    onFetchSummary,
    isFetchingSummary,
    onNext,
    onBack,
}: {
    summary: Gstr1Summary;
    monthLabel: string;
    portalSummary: Gstr1PortalSummary | null;
    onFetchSummary: () => Promise<void>;
    isFetchingSummary: boolean;
    onNext: () => void;
    onBack: () => void;
}) => {
    const [proceeded, setProceeded] = useState(false);
     
    useEffect(() => {
        onFetchSummary();
    }, []);
    const b2ba = summary.amendments?.b2ba;

    const rows = [
        {
            section: 'B2B Invoices',
            table: '4A,4B,6B,6C',
            entries: summary.b2b.count,
            taxable: summary.b2b.taxableAmount,
            igst: summary.b2b.igst,
            cgst: summary.b2b.cgst,
            sgst: summary.b2b.sgst,
        },
        {
            section: 'B2C Large',
            table: '5A,5B',
            entries: summary.b2c.count,
            taxable: summary.b2c.taxableAmount,
            igst: summary.b2c.igst,
            cgst: 0,
            sgst: 0,
        },
        {
            section: 'B2C Small',
            table: '6A',
            entries: summary.b2cSmall.count,
            taxable: summary.b2cSmall.taxableAmount,
            igst: summary.b2cSmall.igst,
            cgst: summary.b2cSmall.cgst,
            sgst: summary.b2cSmall.sgst,
        },
        {
            section: 'Exports',
            table: '7A,7B',
            entries: summary.export.count,
            taxable: summary.export.taxableAmount,
            igst: summary.export.igst,
            cgst: 0,
            sgst: 0,
        },
        {
            section: 'CDNR',
            table: '8A,8B,8C',
            entries: summary.cdnr.count,
            taxable: summary.cdnr.taxableAmount,
            igst: summary.cdnr.igst,
            cgst: summary.cdnr.cgst,
            sgst: summary.cdnr.sgst,
        },
        {
            section: 'CDNUR',
            table: '9A',
            entries: summary.cdnur.count,
            taxable: summary.cdnur.taxableAmount,
            igst: summary.cdnur.igst,
            cgst: 0,
            sgst: 0,
        },
        {
            section: 'Advances (AT)',
            table: '10A,10B',
            entries: summary.advance.count,
            taxable: summary.advance.taxableAmount,
            igst: summary.advance.igst,
            cgst: 0,
            sgst: 0,
        },
        {
            section: 'B2B Amendments',
            table: '11A,11B,11C,11D',
            entries: b2ba?.count ?? 0,
            taxable: b2ba?.taxableAmount ?? 0,
            igst: 0,
            cgst: b2ba?.cgst ?? 0,
            sgst: b2ba?.sgst ?? 0,
        },
    ];

    const total = rows.reduce(
        (acc, r) => ({
            taxable: acc.taxable + r.taxable,
            igst: acc.igst + r.igst,
            cgst: acc.cgst + r.cgst,
            sgst: acc.sgst + r.sgst,
        }),
        { taxable: 0, igst: 0, cgst: 0, sgst: 0 }
    );

    return (
        <Flex vertical gap={20}>
            <Flex vertical gap={4}>
                <Typography.Text className="font-bold text-xl text-[#1e293b]">
                    Review &amp; Proceed
                </Typography.Text>
                <Typography.Text className="text-sm text-[#64748b]">
                    Period: {monthLabel} — Verify the summary before filing
                </Typography.Text>
            </Flex>
            <Flex vertical gap={8}>
                <Typography.Text className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                    Data to be uploaded
                </Typography.Text>
                <div className="border border-[#e2e8f0] rounded-xl overflow-x-auto">
                    <table style={{ minWidth: 680, width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                {[
                                    { label: 'Section', w: 150 },
                                    { label: 'Table', w: 100 },
                                    { label: 'Entries', w: 70 },
                                    { label: 'Taxable Value', w: 130 },
                                    { label: 'IGST', w: 90 },
                                    { label: 'CGST', w: 90 },
                                    { label: 'SGST', w: 90 },
                                ].map(h => (
                                    <th
                                        key={h.label}
                                        style={{
                                            width: h.w,
                                            padding: '10px 16px',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <Typography.Text
                                            className="text-xs font-semibold whitespace-nowrap"
                                            style={{ color: '#64748b' }}
                                        >
                                            {h.label}
                                        </Typography.Text>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr
                                    key={row.section}
                                    className="border-b border-[#f1f5f9] bg-white hover:bg-[#fafafa] transition-colors"
                                >
                                    <td style={{ padding: '10px 16px' }}>
                                        <Typography.Text
                                            className="text-sm whitespace-nowrap"
                                            style={{ color: '#1e293b' }}
                                        >
                                            {row.section}
                                        </Typography.Text>
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <Typography.Text
                                            className="text-xs font-mono whitespace-nowrap"
                                            style={{ color: '#64748b' }}
                                        >
                                            {row.table}
                                        </Typography.Text>
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: '#475569' }}
                                        >
                                            {row.entries}
                                        </Typography.Text>
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <Typography.Text
                                            className="text-sm whitespace-nowrap"
                                            style={{ color: '#1e293b' }}
                                        >
                                            {fmtC(row.taxable)}
                                        </Typography.Text>
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <Typography.Text
                                            className="text-sm whitespace-nowrap"
                                            style={{ color: '#475569' }}
                                        >
                                            {fmtC(row.igst)}
                                        </Typography.Text>
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <Typography.Text
                                            className="text-sm whitespace-nowrap"
                                            style={{ color: '#475569' }}
                                        >
                                            {fmtC(row.cgst)}
                                        </Typography.Text>
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <Typography.Text
                                            className="text-sm whitespace-nowrap"
                                            style={{ color: '#475569' }}
                                        >
                                            {fmtC(row.sgst)}
                                        </Typography.Text>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#f8fafc] border-t border-[#e2e8f0]">
                                <td style={{ padding: '10px 16px' }}>
                                    <Typography.Text
                                        className="text-sm font-bold"
                                        style={{ color: '#1e293b' }}
                                    >
                                        TOTAL
                                    </Typography.Text>
                                </td>
                                <td colSpan={2} />
                                <td style={{ padding: '10px 16px' }}>
                                    <Typography.Text
                                        className="text-sm font-bold whitespace-nowrap"
                                        style={{ color: '#1e293b' }}
                                    >
                                        {fmtC(total.taxable)}
                                    </Typography.Text>
                                </td>
                                <td style={{ padding: '10px 16px' }}>
                                    <Typography.Text className="text-sm font-bold whitespace-nowrap text-brandColor">
                                        {fmtC(total.igst)}
                                    </Typography.Text>
                                </td>
                                <td style={{ padding: '10px 16px' }}>
                                    <Typography.Text className="text-sm font-bold whitespace-nowrap text-brandColor">
                                        {fmtC(total.cgst)}
                                    </Typography.Text>
                                </td>
                                <td style={{ padding: '10px 16px' }}>
                                    <Typography.Text className="text-sm font-bold whitespace-nowrap text-brandColor">
                                        {fmtC(total.sgst)}
                                    </Typography.Text>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Flex>
            {proceeded ? (
                <>
                    <Flex
                        gap={8}
                        align="center"
                        className="rounded-lg px-4 py-3 border"
                        style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
                    >
                        <CheckCircleFilled
                            style={{ color: '#22c55e', fontSize: 14, flexShrink: 0 }}
                        />
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#15803d' }}
                        >
                            Ready to File — Proceed API successful
                        </Typography.Text>
                    </Flex>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={onBack}
                            style={{
                                height: 48,
                                flex: '1 1 120px',
                                borderColor: '#cbd5e1',
                                color: '#475569',
                                fontSize: 15,
                            }}
                        >
                            Back
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<ArrowRightOutlined />}
                            iconPosition="end"
                            style={{ height: 48, flex: '2 1 160px', fontSize: 15, fontWeight: 600 }}
                            onClick={onNext}
                        >
                            Continue to EVC &amp; File
                        </Button>
                    </Flex>
                </>
            ) : (
                <>
                    <Button
                        type="primary"
                        danger
                        block
                        loading={isFetchingSummary}
                        style={{ height: 48, fontSize: 15, fontWeight: 600 }}
                        onClick={() => setProceeded(true)}
                    >
                        Proceed to File
                    </Button>
                    <NavButtons step={7} onBack={onBack} onNext={onNext} nextDisabled />
                </>
            )}
        </Flex>
    );
};

// ─── Step 8 — File Return (EVC) ───────────────────────────────────────────────

const FileReturnStep = ({
    monthLabel,
    onBack,
    onGenerateOtp,
    onFileReturn,
    onResetReturn,
    isFiling: isFilingPortal,
    ackNum,
}: {
    monthLabel: string;
    onBack: () => void;
    onGenerateOtp: (pan: string) => Promise<boolean>;
    onFileReturn: (
        pan: string,
        otp: string
    ) => Promise<{ ackNum: string | null; error: string | null }>;
    onResetReturn: () => Promise<{ ok: boolean; refId?: string | null }>;
    isFiling: boolean;
    ackNum: string | null;
}) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [subStep, setSubStep] = useState<'pan' | 'otp' | 'success' | 'reset-success'>('pan');
    const [pan, setPan] = useState('');
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [resendTimer, setResendTimer] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [prevArn, setPrevArn] = useState<string | null>(null);
    const [resetRefId, setResetRefId] = useState<string | null>(null);

    useEffect(() => {
        if (resendTimer <= 0) return undefined;
        const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [resendTimer]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    };

    const otpComplete = otp.every(d => d !== '');

    if (subStep === 'success') {
        return (
            <>
                <Flex vertical gap={28} align="center" className="py-4 w-full">
                    <Flex
                        align="center"
                        justify="center"
                        className="rounded-full flex-shrink-0"
                        style={{ width: 122, height: 122, backgroundColor: '#E8FAF0' }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-full"
                            style={{ width: 91, height: 91, backgroundColor: '#D1F4E0' }}
                        >
                            <CheckOutlined
                                style={{ fontSize: 40, color: '#22c55e', fontWeight: 700 }}
                            />
                        </Flex>
                    </Flex>
                    <Flex vertical gap={6} align="center">
                        <Typography.Text
                            className="font-bold text-center"
                            style={{ fontSize: 32, color: '#0f172a', lineHeight: '40px' }}
                        >
                            GSTR-1 Filed Successfully!
                        </Typography.Text>
                        <Typography.Text
                            className="text-center"
                            style={{ fontSize: 20, color: '#52525b', lineHeight: '28px' }}
                        >
                            Period: {monthLabel}
                        </Typography.Text>
                    </Flex>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        {[
                            { label: 'Acknowledgement Number (ARN)', value: ackNum ?? '—' },
                            {
                                label: 'Filed On',
                                value: new Date().toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                }),
                            },
                        ].map(card => (
                            <Flex
                                key={card.label}
                                vertical
                                gap={4}
                                className="flex-1 rounded-[14px] border px-5 py-4"
                                style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
                            >
                                <Typography.Text className="text-sm text-[#475569]">
                                    {card.label}
                                </Typography.Text>
                                <Typography.Text
                                    className="font-medium"
                                    style={{ fontSize: 16, color: '#1e293b' }}
                                >
                                    {card.value}
                                </Typography.Text>
                            </Flex>
                        ))}
                    </div>
                    <Flex gap={12} wrap="wrap" className="w-full">
                        <Button
                            block
                            style={{
                                height: 48,
                                fontSize: 15,
                                borderColor: '#FF4F4F',
                                color: '#FF4F4F',
                                flex: '1 1 140px',
                            }}
                            onClick={() => navigate(paths.dashboard.taxMore)}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            block
                            style={{
                                height: 48,
                                fontSize: 15,
                                borderColor: '#FF4F4F',
                                color: '#FF4F4F',
                                flex: '1 1 140px',
                            }}
                            onClick={() =>
                                navigate(`${paths.dashboard.taxMore}/${paths.taxMore.ims}`)
                            }
                        >
                            Review IMS
                        </Button>
                        <Button
                            type="primary"
                            danger
                            block
                            icon={<ArrowRightOutlined />}
                            iconPosition="end"
                            style={{ height: 48, fontSize: 15, flex: '1 1 140px' }}
                            onClick={() =>
                                navigate(`${paths.dashboard.taxMore}/${paths.taxMore.fileGstr3b}`)
                            }
                        >
                            File GSTR-3B
                        </Button>
                    </Flex>
                    <Flex vertical gap={8} align="center">
                        <Typography.Text
                            className="text-sm text-center"
                            style={{ color: '#475569' }}
                        >
                            Made an error? You can reset and re-file before GSTR-3B is filed
                        </Typography.Text>
                        <button
                            type="button"
                            className="flex items-center gap-2 text-sm font-medium text-brandColor hover:underline"
                            onClick={() => setShowResetModal(true)}
                        >
                            <ReloadOutlined style={{ fontSize: 13 }} /> Reset Filed Return
                        </button>
                    </Flex>
                </Flex>
                <Modal
                    open={showResetModal}
                    onCancel={() => setShowResetModal(false)}
                    footer={null}
                    width={440}
                    centered
                    title={
                        <Flex align="center" gap={10}>
                            <Flex
                                align="center"
                                justify="center"
                                className="rounded-full flex-shrink-0"
                                style={{ width: 32, height: 32, backgroundColor: '#fee2e2' }}
                            >
                                <ReloadOutlined style={{ fontSize: 14, color: '#ef4444' }} />
                            </Flex>
                            <Typography.Text className="font-semibold text-base text-[#1e293b]">
                                Reset GSTR-1
                            </Typography.Text>
                        </Flex>
                    }
                >
                    <Flex vertical gap={20} className="pt-2">
                        <Typography.Text className="text-sm text-[#475569]">
                            This will reset your filed return and allow you to re-file GSTR-1 for
                            the same period. Are you sure you want to proceed?
                        </Typography.Text>
                        <Flex gap={12} justify="flex-end">
                            <Button
                                style={{ height: 40, borderColor: '#cbd5e1', color: '#475569' }}
                                onClick={() => setShowResetModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                danger
                                style={{ height: 40 }}
                                loading={isResetting}
                                onClick={async () => {
                                    setIsResetting(true);
                                    const savedArn = ackNum;
                                    const result = await onResetReturn();
                                    setIsResetting(false);
                                    if (result.ok) {
                                        setPrevArn(savedArn);
                                        setResetRefId(result.refId ?? null);
                                        setShowResetModal(false);
                                        setOtp(Array(6).fill(''));
                                        setPan('');
                                        setSubStep('reset-success');
                                    }
                                }}
                            >
                                Confirm Reset
                            </Button>
                        </Flex>
                    </Flex>
                </Modal>
            </>
        );
    }

    if (subStep === 'reset-success') {
        return (
            <Flex vertical gap={28} align="center" className="py-4 w-full">
                <Flex
                    align="center"
                    justify="center"
                    className="rounded-full flex-shrink-0"
                    style={{ width: 122, height: 122, backgroundColor: '#fefce8' }}
                >
                    <Flex
                        align="center"
                        justify="center"
                        className="rounded-full"
                        style={{ width: 91, height: 91, backgroundColor: '#fef9c3' }}
                    >
                        <SyncOutlined style={{ fontSize: 40, color: '#ca8a04' }} />
                    </Flex>
                </Flex>
                <Flex vertical gap={6} align="center">
                    <Typography.Text
                        className="font-bold text-center"
                        style={{ fontSize: 32, color: '#0f172a', lineHeight: '40px' }}
                    >
                        GSTR-1 Reset Successful
                    </Typography.Text>
                    <Typography.Text
                        className="text-center"
                        style={{ fontSize: 16, color: '#52525b' }}
                    >
                        Period: {monthLabel} — Return has been un-filed
                    </Typography.Text>
                </Flex>
                <Flex gap={16} className="w-full">
                    {[
                        {
                            label: 'Reset Reference ID',
                            value: resetRefId ?? '—',
                            strikethrough: false,
                        },
                        {
                            label: 'Previous ARN (Invalidated)',
                            value: prevArn ?? '—',
                            strikethrough: true,
                        },
                    ].map(card => (
                        <Flex
                            key={card.label}
                            vertical
                            gap={4}
                            className="flex-1 rounded-[14px] border px-6 py-4"
                            style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}
                        >
                            <Typography.Text className="text-sm text-[#475569]">
                                {card.label}
                            </Typography.Text>
                            <Typography.Text
                                className="font-medium"
                                style={{
                                    fontSize: 16,
                                    color: card.strikethrough ? '#94a3b8' : '#1e293b',
                                    textDecoration: card.strikethrough ? 'line-through' : 'none',
                                }}
                            >
                                {card.value}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
                <Flex
                    className="w-full rounded-xl px-4 py-3"
                    style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                    gap={8}
                    align="center"
                >
                    <InfoCircleOutlined style={{ color: '#3b82f6', fontSize: 15, flexShrink: 0 }} />
                    <Typography.Text className="text-sm" style={{ color: '#1d4ed8' }}>
                        You can now correct your outward supplies and re-file GSTR-1 for{' '}
                        {monthLabel}.
                    </Typography.Text>
                </Flex>
                <Flex gap={16} className="w-full">
                    <Button
                        block
                        style={{
                            height: 56,
                            fontSize: 16,
                            borderColor: '#e2e8f0',
                            color: '#475569',
                        }}
                        onClick={() => navigate(paths.dashboard.taxMore)}
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        type="primary"
                        danger
                        block
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        style={{ height: 56, fontSize: 16 }}
                        onClick={onBack}
                    >
                        Re-file GSTR-1
                    </Button>
                </Flex>
            </Flex>
        );
    }

    if (subStep === 'otp') {
        return (
            <Flex vertical gap={24}>
                <Flex
                    align="center"
                    gap={12}
                    className="rounded-xl px-5 py-4 border border-[#fecaca]"
                    style={{ backgroundColor: '#fff5f5' }}
                >
                    <Flex
                        align="center"
                        justify="center"
                        className="rounded-full flex-shrink-0"
                        style={{ width: 36, height: 36, backgroundColor: '#fee2e2' }}
                    >
                        <FileTextOutlined className="text-brandColor" style={{ fontSize: 16 }} />
                    </Flex>
                    <Flex vertical gap={2}>
                        <Typography.Text className="font-semibold text-base text-[#1e293b]">
                            EVC Verification &amp; File
                        </Typography.Text>
                        <Typography.Text className="text-sm text-[#64748b]">
                            Electronic verification to authorise GSTR-1 filing
                        </Typography.Text>
                    </Flex>
                </Flex>
                <InfoBanner text="OTP sent to registered mobile number linked with your authorized signatory's PAN." />
                <Flex vertical gap={16} align="center">
                    <Typography.Text className="text-sm font-semibold text-[#1e293b]">
                        Enter 6-digit EVC OTP
                    </Typography.Text>
                    <div className="flex justify-center gap-2 sm:gap-3 w-full">
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => {
                                    inputRefs.current[i] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(i, e)}
                                className="text-center text-lg font-semibold border border-[#e2e8f0] rounded-xl outline-none focus:border-brandColor focus:ring-2 focus:ring-[#fecaca] transition-all text-[#1e293b]"
                                style={{
                                    width: 'calc((100% - 5 * 8px) / 6)',
                                    maxWidth: 48,
                                    minWidth: 36,
                                    height: 44,
                                    flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        className="text-sm text-brandColor hover:underline font-medium"
                        disabled={resendTimer > 0}
                        style={{
                            color: resendTimer > 0 ? '#94a3b8' : undefined,
                            cursor: resendTimer > 0 ? 'default' : 'pointer',
                        }}
                        onClick={async () => {
                            setOtp(Array(6).fill(''));
                            const ok = await onGenerateOtp(pan);
                            if (ok) setResendTimer(30);
                        }}
                    >
                        ↺ {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                </Flex>
                <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setSubStep('pan')}
                        style={{
                            height: 48,
                            flex: '1 1 100px',
                            borderColor: '#cbd5e1',
                            color: '#475569',
                            fontSize: 15,
                        }}
                    >
                        Back
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        disabled={!otpComplete}
                        loading={isFilingPortal}
                        style={{ height: 48, flex: '2 1 130px', fontSize: 15, fontWeight: 600 }}
                        onClick={async () => {
                            const { ackNum: arn, error } = await onFileReturn(pan, otp.join(''));
                            if (arn !== null) {
                                setSubStep('success');
                            } else {
                                dispatch(
                                    showToast({
                                        variant: 'error',
                                        description:
                                            error ?? 'Failed to file return. Please try again.',
                                    })
                                );
                            }
                        }}
                    >
                        File GSTR-1
                    </Button>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={24}>
            <Flex
                align="center"
                gap={12}
                className="rounded-xl px-5 py-4 border border-[#fecaca]"
                style={{ backgroundColor: '#fff5f5' }}
            >
                <Flex
                    align="center"
                    justify="center"
                    className="rounded-full flex-shrink-0"
                    style={{ width: 36, height: 36, backgroundColor: '#fee2e2' }}
                >
                    <FileTextOutlined className="text-brandColor" style={{ fontSize: 16 }} />
                </Flex>
                <Flex vertical gap={2}>
                    <Typography.Text className="font-semibold text-base text-[#1e293b]">
                        EVC Verification &amp; File
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#64748b]">
                        Electronic verification to authorise GSTR-1 filing
                    </Typography.Text>
                </Flex>
            </Flex>
            <InfoBanner text="EVC OTP will be sent to the mobile number registered with the authorized signatory's PAN." />
            <Formik
                initialValues={{ pan: '' }}
                validationSchema={panSchema}
                onSubmit={async values => {
                    setPan(values.pan);
                    setIsGeneratingOtp(true);
                    const ok = await onGenerateOtp(values.pan);
                    setIsGeneratingOtp(false);
                    if (ok) {
                        setSubStep('otp');
                        setResendTimer(30);
                    }
                }}
            >
                {({ values, submitForm }) => (
                    <FormikForm style={{ width: '100%' }}>
                        <Form layout="vertical" component={false}>
                            <Flex vertical gap={16} style={{ width: '100%' }}>
                                <TextInput
                                    name="pan"
                                    type="text"
                                    label={
                                        <span className="text-sm font-semibold text-[#1e293b]">
                                            Authorized Signatory PAN{' '}
                                            <span className="text-brandColor">*</span>
                                        </span>
                                    }
                                    placeholder="Enter PAN"
                                    size="large"
                                    maxLength={10}
                                    formItemClass="!mb-0"
                                    allowedInputKeys={v =>
                                        v.toUpperCase().replace(/[^A-Z0-9]/g, '')
                                    }
                                />
                                <Flex vertical gap={8}>
                                    <Typography.Text className="text-sm font-semibold text-[#1e293b]">
                                        Filing period
                                    </Typography.Text>
                                    <Flex
                                        align="center"
                                        gap={8}
                                        className="border border-[#e2e8f0] rounded-xl px-4"
                                        style={{ height: 44 }}
                                    >
                                        <FileTextOutlined
                                            className="text-[#94a3b8]"
                                            style={{ fontSize: 14 }}
                                        />
                                        <Typography.Text className="text-sm text-[#1e293b]">
                                            {monthLabel}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                                <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
                                    <Button
                                        icon={<ArrowLeftOutlined />}
                                        onClick={onBack}
                                        style={{
                                            height: 48,
                                            flex: '1 1 100px',
                                            borderColor: '#cbd5e1',
                                            color: '#475569',
                                            fontSize: 15,
                                        }}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="primary"
                                        danger
                                        icon={<ArrowRightOutlined />}
                                        iconPosition="end"
                                        disabled={values.pan.length !== 10}
                                        loading={isGeneratingOtp}
                                        style={{
                                            height: 48,
                                            flex: '2 1 150px',
                                            fontSize: 15,
                                            fontWeight: 600,
                                        }}
                                        onClick={submitForm}
                                    >
                                        Generate EVC OTP
                                    </Button>
                                </Flex>
                            </Flex>
                        </Form>
                    </FormikForm>
                )}
            </Formik>
        </Flex>
    );
};

// ─── Sidebar stepper ──────────────────────────────────────────────────────────

const NIL_SKIPPED_STEPS = new Set([2, 3, 4, 5]);

const StepSidebar = ({
    currentStep,
    nilReturn,
    onStepClick,
}: {
    currentStep: number;
    nilReturn: boolean;
    onStepClick: (s: number) => void;
}) => (
    <Flex vertical gap={4} style={{ width: 220 }} className="flex-shrink-0">
        {GSTR1_STEPS.map(step => {
            const isNilSkipped = nilReturn && NIL_SKIPPED_STEPS.has(step.id);
            const isCompleted = !isNilSkipped && step.id < currentStep;
            const isActive = step.id === currentStep;
            const isLocked = isNilSkipped || step.id > currentStep;

            let rowBg = 'hover:bg-[#f8fafc]';
            if (isActive) rowBg = 'bg-[#fff5f5]';
            else if (isLocked) rowBg = '';

            let iconCls = 'bg-[#f1f5f9] text-[#94a3b8]';
            if (isCompleted) iconCls = 'bg-[#22c55e] text-white';
            else if (isActive) iconCls = 'bg-brandColor text-white';

            let labelCls = 'text-[#94a3b8]';
            if (isActive) labelCls = 'text-brandColor font-semibold';
            else if (isCompleted) labelCls = 'text-[#1e293b] font-medium';

            return (
                <button
                    key={step.id}
                    type="button"
                    disabled={isLocked}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${rowBg} ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => !isLocked && onStepClick(step.id)}
                >
                    <Flex
                        align="center"
                        justify="center"
                        className={`rounded-full flex-shrink-0 ${iconCls}`}
                        style={{ width: 28, height: 28, fontSize: 12, fontWeight: 600 }}
                    >
                        {isCompleted ? <CheckOutlined style={{ fontSize: 11 }} /> : step.id}
                    </Flex>
                    <Typography.Text className={`text-sm ${labelCls}`}>
                        {step.label}
                    </Typography.Text>
                </button>
            );
        })}
    </Flex>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const EMPTY_AMEND_SECTION = {
    count: 0,
    taxableAmount: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    totalTax: 0,
    invoices: [],
};
const EMPTY_AMENDMENTS: Gstr1Amendments = {
    b2ba: EMPTY_AMEND_SECTION,
    b2cla: EMPTY_AMEND_SECTION,
    b2csa: EMPTY_AMEND_SECTION,
    cdnra: EMPTY_AMEND_SECTION,
    cdnura: EMPTY_AMEND_SECTION,
    expa: EMPTY_AMEND_SECTION,
};

const Gstr1FilingPage = () => {
    const { activeSetup, selectedFinancialYear } = useAppSelector(state => state.reducer.taxMore);
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { setups } = useGstSetup();

    const gstin = activeSetup?.gstin ?? setups[0]?.gstin ?? '';
    const fy = selectedFinancialYear ?? activeSetup?.financialYear ?? '2024-25';

    const { state: navState } = useLocation();
    const amendInvoice = navState?.amendInvoice ?? null;

    const [currentStep, setCurrentStep] = useState(
        amendInvoice || navState?.goToAmendments ? 5 : 1
    );
    const [selectedMonthNum, setSelectedMonthNum] = useState(new Date().getMonth() + 1);
    const [isNilReturn, setIsNilReturn] = useState(false);

    const [isSavingB2B, setIsSavingB2B] = useState(false);
    const [isSavingB2C, setIsSavingB2C] = useState(false);
    const [isSavingAmend, setIsSavingAmend] = useState(false);
    const [isSavingHsn, setIsSavingHsn] = useState(false);
    const isHsnUploadInProgressRef = useRef(false);
    const [isSavingDoc, setIsSavingDoc] = useState(false);
    const [nilExemptValues, setNilExemptValues] = useState<NilExemptValues>(defaultNilExempt);

    const {
        months,
        summary,
        isLoadingMonths,
        refreshSummary,
        referenceId,
        portalSummary,
        ackNum,
        isSavingToPortal,
        isFetchingSummary,
        isFilingPortal,
        saveToPortal,
        fetchPortalSummary,
        fileReturn,
        resetReturn,
    } = useGstr1(gstin, fy, selectedMonthNum);

    useEffect(() => {
        if (!summary.nil?.invoices?.length) return;
        const rebuilt = defaultNilExempt();
        summary.nil.invoices.forEach(inv => {
            const key = inv.invoiceNo.replace('NIL-', '') as NilExemptKey;
            if (rebuilt[key]) {
                rebuilt[key] = {
                    nilRated: Number(inv.taxableAmount),
                    exempted: Number(inv.igst),
                    nonGst: Number(inv.cgst),
                };
            }
        });
        setNilExemptValues(rebuilt);
    }, [summary.nil]);

    const goNext = () => {
        if (currentStep === 1 && isNilReturn) {
            setCurrentStep(6);
            return;
        }
        setCurrentStep(s => Math.min(s + 1, 8));
    };
    const goBack = () => {
        if (isNilReturn && currentStep === 6) {
            setCurrentStep(1);
            return;
        }
        setCurrentStep(s => Math.max(s - 1, 1));
    };

    const fyStart = parseInt(fy.split('-')[0], 10);
    const calYear = selectedMonthNum >= 4 ? fyStart : fyStart + 1;
    const selectedMonthLabel = `${MONTH_LABELS_SHORT[selectedMonthNum - 1]} ${calYear}`;
    const selectedMonthFiled =
        months.some(m => m.month === selectedMonthNum && m.status === 'filed') || !!ackNum;
    const sellerStateCode = gstin.substring(0, 2);

    const FY_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    const firstUnfiledMonthNum =
        FY_MONTH_ORDER.find(m => !months.some(mo => mo.month === m && mo.status === 'filed')) ??
        null;
    const isNextToFile = !selectedMonthFiled && selectedMonthNum === firstUnfiledMonthNum;
    const isOutOfOrder = !selectedMonthFiled && !isNextToFile;

    const deadlineMonthNum = selectedMonthNum === 12 ? 1 : selectedMonthNum + 1;
    const deadlineYear = selectedMonthNum === 12 ? calYear + 1 : calYear;
    const deadlineDate = new Date(deadlineYear, deadlineMonthNum - 1, 11);
    const daysOverdue = Math.floor((Date.now() - deadlineDate.getTime()) / 86400000);
    const deadlineLabel = `11 ${MONTH_LABELS_SHORT[deadlineMonthNum - 1]} ${deadlineYear}`;

    const handleAddB2B = useCallback(
        async (form: AddB2BForm): Promise<void> => {
            setIsSavingB2B(true);
            const posCode = INDIAN_STATES.find(s => s.name === form.placeOfSupply)?.code ?? '';
            const isIntra = posCode === sellerStateCode;
            const totalTax = (form.taxableValue * form.taxRate) / 100;
            const igst = isIntra ? 0 : totalTax;
            const cgst = isIntra ? totalTax / 2 : 0;
            const sgst = isIntra ? totalTax / 2 : 0;
            const resp = await addSalesInvoices({
                userId: id,
                userType: role,
                gstin,
                financialYear: fy,
                month: selectedMonthNum,
                invoices: [
                    {
                        invoiceType: 'B2B',
                        invoiceNo: form.invoiceNo,
                        invoiceDate: form.invoiceDate,
                        buyerGstin: form.receiverGstin || undefined,
                        buyerName: form.receiverName || undefined,
                        taxableAmount: form.taxableValue,
                        igst,
                        cgst,
                        sgst,
                    },
                ],
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Invoice added successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(
                    showToast({
                        description: (resp as any)?.message || 'Failed to add invoice',
                        variant: 'error',
                    })
                );
            }
            setIsSavingB2B(false);
        },
        [id, role, gstin, fy, selectedMonthNum, sellerStateCode, dispatch, refreshSummary]
    );

    const handleAddB2CApiRow = useCallback(
        async (tab: B2CTabKey, form: B2CAddForm): Promise<boolean> => {
            const typeMap: Partial<Record<B2CTabKey, string>> = {
                'b2c-large': 'B2C',
                exports: 'EXPORT',
                'b2c-small': 'B2C_SMALL',
                cdnr: 'CDNR',
                cdnur: 'CDNUR',
                advances: 'ADVANCE',
            };
            const invoiceType = typeMap[tab];
            if (!invoiceType) return false;

            if (tab === 'b2c-small') {
                const supplyType = form.supplyType === 'INTRA' ? 'INTRA' : 'INTER';
                const duplicate = (summary.b2cSmall?.invoices ?? []).some(inv => {
                    const invSupplyType = inv.cgst > 0 ? 'INTRA' : 'INTER';
                    const invRate =
                        inv.taxableAmount > 0
                            ? Math.round((inv.totalTax / inv.taxableAmount) * 100)
                            : 0;
                    return (
                        inv.placeOfSupply === form.placeOfSupply &&
                        invRate === form.rate &&
                        invSupplyType === supplyType
                    );
                });
                if (duplicate) {
                    dispatch(
                        showToast({
                            description: 'Entry already exists for this POS and rate.',
                            variant: 'error',
                        })
                    );
                    return false;
                }
            }

            setIsSavingB2C(true);

            const totalTax = (form.taxable * form.rate) / 100;
            const isExport = tab === 'exports';
            const isIntra = tab === 'cdnr' || (tab === 'b2c-small' && form.supplyType === 'INTRA');
            let igst = 0;
            if (!isExport && !isIntra) igst = totalTax;

            let cgst = 0;
            if (!isExport && isIntra) cgst = totalTax / 2;

            let sgst = 0;
            if (!isExport && isIntra) sgst = totalTax / 2;

            const autoInvNo = `${tab.toUpperCase()}-${Date.now()}`;
            const todayStr = new Date().toISOString().slice(0, 10);

            let buyerName: string | undefined;
            if (isExport) buyerName = form.exportType;
            else if (tab === 'cdnr' || tab === 'cdnur') buyerName = form.noteType;

            const placeOfSupply: string | undefined =
                !isExport && tab !== 'cdnr' && tab !== 'cdnur'
                    ? form.placeOfSupply || undefined
                    : undefined;

            let portCode: string | undefined;
            if (isExport) portCode = form.portCode || undefined;
            else if (tab === 'cdnur') portCode = form.supplyType || undefined;

            const resp = await addSalesInvoices({
                userId: id,
                userType: role,
                gstin,
                financialYear: fy,
                month: selectedMonthNum,
                invoices: [
                    {
                        invoiceType,
                        invoiceNo: form.invoiceNo || autoInvNo,
                        invoiceDate: form.date || todayStr,
                        buyerGstin: isExport ? undefined : form.buyerGstin || undefined,
                        buyerName,
                        placeOfSupply,
                        portCode,
                        shippingBillNo: isExport ? form.sbNo || undefined : undefined,
                        shippingBillDate: isExport ? form.sbDate || undefined : undefined,
                        taxableAmount: form.taxable,
                        igst,
                        cgst,
                        sgst,
                    },
                ],
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Entry added successfully', variant: 'success' })
                );
                await refreshSummary();
                setIsSavingB2C(false);
                return true;
            }
            const errMsg = resp
                ? (resp as any).message || 'Failed to add entry'
                : 'Invoice number already exists. Please use a different invoice number.';
            dispatch(showToast({ description: errMsg, variant: 'error' }));
            setIsSavingB2C(false);
            return false;
        },
        [id, role, gstin, fy, selectedMonthNum, summary, dispatch, refreshSummary]
    );

    const handleSaveNilExempt = useCallback(async () => {
        setIsSavingB2C(true);
        const fyStartYear = parseInt(fy.split('-')[0], 10);
        const nilCalYear = selectedMonthNum >= 4 ? fyStartYear : fyStartYear + 1;
        const invoiceDate = `${nilCalYear}-${String(selectedMonthNum).padStart(2, '0')}-01`;
        const invoices = NIL_EXEMPT_ROWS.map(row => ({
            invoiceType: 'NIL',
            invoiceNo: `NIL-${row.key}`,
            invoiceDate,
            taxableAmount: nilExemptValues[row.key].nilRated,
            igst: nilExemptValues[row.key].exempted,
            cgst: nilExemptValues[row.key].nonGst,
            sgst: 0,
        })).filter(inv => inv.taxableAmount > 0 || inv.igst > 0 || inv.cgst > 0);
        if (!invoices.length) {
            dispatch(
                showToast({
                    description:
                        'All supply values are ₹0. Enter at least one value before saving.',
                    variant: 'error',
                })
            );
            setIsSavingB2C(false);
            return;
        }
        const resp = await addSalesInvoices({
            userId: id,
            userType: role,
            gstin,
            financialYear: fy,
            month: selectedMonthNum,
            invoices,
        });
        if (resp && (resp as any).status) {
            dispatch(showToast({ description: 'Nil/Exempt data saved', variant: 'success' }));
            await refreshSummary();
        } else {
            dispatch(
                showToast({ description: 'Failed to save Nil/Exempt data', variant: 'error' })
            );
        }
        setIsSavingB2C(false);
    }, [id, role, gstin, fy, selectedMonthNum, nilExemptValues, dispatch, refreshSummary]);

    const handleAddAmend = useCallback(
        async (amendType: AmendType, form: AmendAddForm): Promise<void> => {
            setIsSavingAmend(true);
            const igst = (form.taxableAmount * form.rate) / 100;
            const resp = await addAmendments({
                userId: id,
                userType: role,
                gstin,
                financialYear: fy,
                month: selectedMonthNum,
                amendments: [
                    {
                        amendType,
                        origInvNo: form.origInvNo,
                        origPeriod: form.origPeriod,
                        receiverGstin: form.receiverGstin || undefined,
                        receiverName: form.receiverName || undefined,
                        noteType: form.noteType || undefined,
                        revisedInvNo: form.revisedInvNo || undefined,
                        revisedDate: form.revisedDate || undefined,
                        taxableAmount: form.taxableAmount,
                        igst,
                        cgst: 0,
                        sgst: 0,
                    },
                ],
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Amendment added successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(showToast({ description: 'Failed to add amendment', variant: 'error' }));
            }
            setIsSavingAmend(false);
        },
        [id, role, gstin, fy, selectedMonthNum, dispatch, refreshSummary]
    );

    const handleUploadAmend = useCallback(
        async (amendType: AmendType, rows: AmendAddForm[]): Promise<void> => {
            setIsSavingAmend(true);
            const amendments = rows.map(form => {
                const igst = (form.taxableAmount * form.rate) / 100;
                return {
                    amendType,
                    origInvNo: form.origInvNo,
                    origPeriod: form.origPeriod,
                    receiverGstin: form.receiverGstin || undefined,
                    receiverName: form.receiverName || undefined,
                    noteType: form.noteType || undefined,
                    revisedInvNo: form.revisedInvNo || undefined,
                    revisedDate: form.revisedDate || undefined,
                    taxableAmount: form.taxableAmount,
                    igst,
                    cgst: 0,
                    sgst: 0,
                };
            });
            const resp = await addAmendments({
                userId: id,
                userType: role,
                gstin,
                financialYear: fy,
                month: selectedMonthNum,
                amendments,
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({
                        description: 'Amendment(s) added successfully',
                        variant: 'success',
                    })
                );
                await refreshSummary();
            } else {
                const msg = (resp as any)?.message || 'Failed to import amendments.';
                dispatch(showToast({ description: msg, variant: 'error' }));
            }
            setIsSavingAmend(false);
        },
        [id, role, gstin, fy, selectedMonthNum, dispatch, refreshSummary]
    );

    const handleEditB2B = useCallback(
        async (invoiceId: string, form: AddB2BForm): Promise<void> => {
            setIsSavingB2B(true);
            const posCode = INDIAN_STATES.find(s => s.name === form.placeOfSupply)?.code ?? '';
            const isIntra = posCode === sellerStateCode;
            const totalTax = (form.taxableValue * form.taxRate) / 100;
            const igst = isIntra ? 0 : totalTax;
            const cgst = isIntra ? totalTax / 2 : 0;
            const sgst = isIntra ? totalTax / 2 : 0;
            const resp = await updateSalesInvoice({
                userId: id,
                userType: role,
                id: invoiceId,
                invoiceNo: form.invoiceNo,
                invoiceDate: form.invoiceDate,
                buyerGstin: form.receiverGstin || undefined,
                buyerName: form.receiverName || undefined,
                placeOfSupply: posCode || undefined,
                taxableAmount: form.taxableValue,
                igst,
                cgst,
                sgst,
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Invoice updated successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(
                    showToast({
                        description: (resp as any)?.message || 'Failed to update invoice',
                        variant: 'error',
                    })
                );
            }
            setIsSavingB2B(false);
        },
        [id, role, sellerStateCode, dispatch, refreshSummary]
    );

    const handleDeleteB2B = useCallback(
        async (invoiceId: string): Promise<void> => {
            const resp = await deleteSalesInvoice({ userId: id, userType: role, id: invoiceId });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Invoice deleted successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(showToast({ description: 'Failed to delete invoice', variant: 'error' }));
            }
        },
        [id, role, dispatch, refreshSummary]
    );

    const handleDeleteB2C = useCallback(
        async (invoiceId: string): Promise<void> => {
            const resp = await deleteSalesInvoice({ userId: id, userType: role, id: invoiceId });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Entry deleted successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(showToast({ description: 'Failed to delete entry', variant: 'error' }));
            }
        },
        [id, role, dispatch, refreshSummary]
    );

    const handleB2CUploadCsv = useCallback(
        async (items: AddSalesInvoiceItem[]): Promise<void> => {
            const existingB2cSmall = summary.b2cSmall?.invoices ?? [];
            const seenKeys = new Set(
                existingB2cSmall.map(inv => {
                    const supplyType = inv.cgst > 0 ? 'INTRA' : 'INTER';
                    const rate =
                        inv.taxableAmount > 0
                            ? Math.round((inv.totalTax / inv.taxableAmount) * 100)
                            : 0;
                    return `${inv.placeOfSupply}|${rate}|${supplyType}`;
                })
            );
            const duplicates: string[] = [];
            const deduped = items.filter(item => {
                if (item.invoiceType !== 'B2C_SMALL') return true;
                const supplyType = (item.cgst ?? 0) > 0 ? 'INTRA' : 'INTER';
                const taxable = item.taxableAmount ?? 0;
                const rate =
                    taxable > 0
                        ? Math.round(
                              (((item.igst ?? 0) + (item.cgst ?? 0) + (item.sgst ?? 0)) / taxable) *
                                  100
                          )
                        : 0;
                const key = `${item.placeOfSupply}|${rate}|${supplyType}`;
                if (seenKeys.has(key)) {
                    duplicates.push(`POS ${item.placeOfSupply} @ ${rate}%`);
                    return false;
                }
                seenKeys.add(key);
                return true;
            });
            if (duplicates.length) {
                dispatch(
                    showToast({
                        description: `${duplicates.length} duplicate row${duplicates.length > 1 ? 's were' : ' was'} skipped because the same POS and rate already exist.`,
                        variant: 'error',
                    })
                );
            }
            if (!deduped.length) return;
            const resp = await addSalesInvoices({
                userId: id,
                userType: role,
                gstin,
                financialYear: fy,
                month: selectedMonthNum,
                invoices: deduped,
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Invoice added successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                const rawMsg: string = (resp as any)?.message || '';
                const isDup = /duplicate|already exist/i.test(rawMsg);
                throw new Error(
                    isDup
                        ? 'One or more entries already exist. Please remove duplicates and try again.'
                        : rawMsg || 'Import failed. Please try again.'
                );
            }
        },
        [id, role, gstin, fy, selectedMonthNum, summary, dispatch, refreshSummary]
    );

    const handleDeleteAmend = useCallback(
        async (amendId: string): Promise<void> => {
            setIsSavingAmend(true);
            const resp = await deleteAmendment({ userId: id, userType: role, id: amendId });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Amendment deleted successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(
                    showToast({ description: 'Failed to delete amendment', variant: 'error' })
                );
            }
            setIsSavingAmend(false);
        },
        [id, role, dispatch, refreshSummary]
    );

    const handleAddHsn = useCallback(
        async (values: {
            hsnCode: string;
            description: string;
            uqc: string;
            qty: string;
            taxable: string;
            rate: number;
        }): Promise<void> => {
            setIsSavingHsn(true);
            const taxable = parseFloat(values.taxable) || 0;
            const tax = (taxable * values.rate) / 100;
            const resp = await addGstr1HsnManual({
                userId: id,
                userType: role,
                gstin,
                financialYear: fy,
                month: selectedMonthNum,
                hsnCode: values.hsnCode,
                description: values.description,
                uqc: values.uqc || 'OTH',
                qty: parseFloat(values.qty) || 0,
                taxableAmount: taxable,
                rate: values.rate,
                igst: tax,
                cgst: 0,
                sgst: 0,
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'HSN row added successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(showToast({ description: 'Failed to add HSN row', variant: 'error' }));
            }
            setIsSavingHsn(false);
        },
        [id, role, gstin, fy, selectedMonthNum, dispatch, refreshSummary]
    );

    const handleUploadHsn = useCallback(
        async (
            rows: {
                hsnCode: string;
                description: string;
                uqc: string;
                qty: string;
                taxable: string;
                rate: number;
            }[]
        ): Promise<void> => {
            if (isHsnUploadInProgressRef.current) return;
            isHsnUploadInProgressRef.current = true;
            setIsSavingHsn(true);
            let success = 0;
            for (let _i = 0; _i < rows.length; _i += 1) {
                const values = rows[_i];
                const taxable = parseFloat(values.taxable) || 0;
                const tax = (taxable * values.rate) / 100;
                // eslint-disable-next-line no-await-in-loop
                const resp = await addGstr1HsnManual({
                    userId: id,
                    userType: role,
                    gstin,
                    financialYear: fy,
                    month: selectedMonthNum,
                    hsnCode: values.hsnCode,
                    description: values.description,
                    uqc: values.uqc || 'OTH',
                    qty: parseFloat(values.qty) || 0,
                    taxableAmount: taxable,
                    rate: values.rate,
                    igst: tax,
                    cgst: 0,
                    sgst: 0,
                });
                if (resp && (resp as any).status) success += 1;
            }
            if (success > 0) {
                dispatch(
                    showToast({
                        description: `${success} HSN row${success !== 1 ? 's' : ''} imported successfully`,
                        variant: 'success',
                    })
                );
                await refreshSummary();
            } else {
                dispatch(
                    showToast({
                        description: 'Import failed — no rows were saved',
                        variant: 'error',
                    })
                );
            }
            setIsSavingHsn(false);
            isHsnUploadInProgressRef.current = false;
        },
        [id, role, gstin, fy, selectedMonthNum, dispatch, refreshSummary]
    );

    const handleDeleteHsn = useCallback(
        async (hsnId: string): Promise<void> => {
            setIsSavingHsn(true);
            const resp = await deleteGstr1HsnManual({ userId: id, userType: role, id: hsnId });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'HSN row deleted successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(showToast({ description: 'Failed to delete HSN row', variant: 'error' }));
            }
            setIsSavingHsn(false);
        },
        [id, role, dispatch, refreshSummary]
    );

    const handleAddDoc = useCallback(
        async (form: DocAddForm): Promise<void> => {
            const exists = (summary.documents ?? []).some(
                d => d.documentType === form.documentType
            );
            if (exists) {
                dispatch(
                    showToast({ description: 'Document type already exists.', variant: 'error' })
                );
                return;
            }
            setIsSavingDoc(true);
            const resp = await addGstr1Document({
                userId: id,
                userType: role,
                gstin,
                financialYear: fy,
                month: selectedMonthNum,
                documentType: form.documentType,
                serialFrom: form.serialFrom || undefined,
                serialTo: form.serialTo || undefined,
                totalIssued: form.totalIssued,
                cancelled: form.cancelled,
            });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Document added successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(showToast({ description: 'Failed to add document', variant: 'error' }));
            }
            setIsSavingDoc(false);
        },
        [id, role, gstin, fy, selectedMonthNum, summary.documents, dispatch, refreshSummary]
    );

    const handleUploadDoc = useCallback(
        async (rows: DocAddForm[]): Promise<void> => {
            const existingTypes = new Set((summary.documents ?? []).map(d => d.documentType));
            const seenInBatch = new Set<string>();
            let skipped = 0;
            const deduped = rows.filter(r => {
                if (existingTypes.has(r.documentType) || seenInBatch.has(r.documentType)) {
                    skipped += 1;
                    return false;
                }
                seenInBatch.add(r.documentType);
                return true;
            });
            if (skipped > 0) {
                dispatch(
                    showToast({
                        description: `${skipped} document type${skipped > 1 ? 's' : ''} already exist.`,
                        variant: 'error',
                    })
                );
            }
            if (!deduped.length) return;
            setIsSavingDoc(true);
            let success = 0;
            for (let i = 0; i < deduped.length; i += 1) {
                const form = deduped[i];
                // eslint-disable-next-line no-await-in-loop
                const resp = await addGstr1Document({
                    userId: id,
                    userType: role,
                    gstin,
                    financialYear: fy,
                    month: selectedMonthNum,
                    documentType: form.documentType,
                    serialFrom: form.serialFrom || undefined,
                    serialTo: form.serialTo || undefined,
                    totalIssued: form.totalIssued,
                    cancelled: form.cancelled,
                });
                if (resp && (resp as any).status) success += 1;
            }
            if (success > 0) {
                dispatch(
                    showToast({
                        description: `${success} document${success !== 1 ? 's' : ''} imported successfully.`,
                        variant: 'success',
                    })
                );
                await refreshSummary();
            } else {
                dispatch(
                    showToast({ description: 'Failed to import documents.', variant: 'error' })
                );
            }
            setIsSavingDoc(false);
        },
        [id, role, gstin, fy, selectedMonthNum, summary.documents, dispatch, refreshSummary]
    );

    const handleDeleteDoc = useCallback(
        async (docId: string): Promise<void> => {
            setIsSavingDoc(true);
            const resp = await deleteGstr1Document({ userId: id, userType: role, id: docId });
            if (resp && (resp as any).status) {
                dispatch(
                    showToast({ description: 'Document deleted successfully', variant: 'success' })
                );
                await refreshSummary();
            } else {
                dispatch(showToast({ description: 'Failed to delete document', variant: 'error' }));
            }
            setIsSavingDoc(false);
        },
        [id, role, dispatch, refreshSummary]
    );

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <SelectPeriodStep
                        months={months}
                        fy={fy}
                        onFyChange={v => dispatch(setFinancialYear(v))}
                        selectedMonthNum={selectedMonthNum}
                        onMonthChange={setSelectedMonthNum}
                        returnType={isNilReturn ? 'nil' : 'regular'}
                        onReturnTypeChange={v => setIsNilReturn(v === 'nil')}
                        isLoadingMonths={isLoadingMonths}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 2:
                return (
                    <B2BInvoicesStep
                        invoices={summary.b2b.invoices}
                        sellerStateCode={sellerStateCode}
                        onAddB2B={handleAddB2B}
                        onEditB2B={handleEditB2B}
                        onDeleteB2B={handleDeleteB2B}
                        onUploadCsv={async items => {
                            const resp = await addSalesInvoices({
                                userId: id,
                                userType: role,
                                gstin,
                                financialYear: fy,
                                month: selectedMonthNum,
                                invoices: items,
                            });
                            if (resp && (resp as any).status) {
                                dispatch(
                                    showToast({
                                        description: 'Invoice added successfully',
                                        variant: 'success',
                                    })
                                );
                                await refreshSummary();
                            } else {
                                const rawMsg: string = (resp as any)?.message || '';
                                const isDup = /duplicate|already exist/i.test(rawMsg);
                                throw new Error(
                                    isDup
                                        ? 'One or more invoice numbers already exist. Please remove duplicates and try again.'
                                        : rawMsg || 'Import failed. Please try again.'
                                );
                            }
                        }}
                        isSaving={isSavingB2B}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 3:
                return (
                    <B2COthersStep
                        b2cLargeInvoices={summary.b2c.invoices}
                        exportInvoices={summary.export.invoices}
                        b2cSmallInvoices={summary.b2cSmall?.invoices ?? []}
                        cdnrInvoices={summary.cdnr?.invoices ?? []}
                        cdnurInvoices={summary.cdnur?.invoices ?? []}
                        advanceInvoices={summary.advance?.invoices ?? []}
                        nilValues={nilExemptValues}
                        onNilChange={setNilExemptValues}
                        onAddApiRow={handleAddB2CApiRow}
                        isAddingApi={isSavingB2C}
                        onDeleteB2C={handleDeleteB2C}
                        onSaveNilExempt={handleSaveNilExempt}
                        onUploadCsv={handleB2CUploadCsv}
                        sellerStateCode={sellerStateCode}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 4:
                return (
                    <HsnDocumentsStep
                        hsnRows={summary.hsn ?? []}
                        docRows={summary.documents ?? []}
                        onAddDoc={handleAddDoc}
                        onDeleteDoc={handleDeleteDoc}
                        onAddHsn={handleAddHsn}
                        onDeleteHsn={handleDeleteHsn}
                        onUploadHsn={handleUploadHsn}
                        onUploadDoc={handleUploadDoc}
                        isSavingHsn={isSavingHsn}
                        isSavingDoc={isSavingDoc}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 5:
                return (
                    <AmendmentsStep
                        amendments={summary.amendments ?? EMPTY_AMENDMENTS}
                        onAddAmend={handleAddAmend}
                        onDeleteAmend={handleDeleteAmend}
                        onUploadAmend={handleUploadAmend}
                        isSaving={isSavingAmend}
                        initialForm={
                            amendInvoice
                                ? {
                                      origInvNo: amendInvoice.origInvNo,
                                      origPeriod: amendInvoice.origPeriod,
                                      receiverGstin: amendInvoice.receiverGstin,
                                      receiverName: amendInvoice.receiverName,
                                      taxableAmount: amendInvoice.taxableAmount,
                                  }
                                : undefined
                        }
                        initialTab={amendInvoice?.amendTab}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 6:
                return (
                    <SaveValidateStep
                        summary={summary}
                        onSaveToPortal={saveToPortal}
                        referenceId={referenceId}
                        isSavingToPortal={isSavingToPortal}
                        isNilReturn={isNilReturn}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            case 7:
                return (
                    <ReviewProceedStep
                        summary={summary}
                        monthLabel={selectedMonthLabel}
                        portalSummary={portalSummary}
                        onFetchSummary={fetchPortalSummary}
                        isFetchingSummary={isFetchingSummary}
                        onNext={goNext}
                        onBack={goBack}
                    />
                );
            default:
                return (
                    <FileReturnStep
                        monthLabel={selectedMonthLabel}
                        onBack={goBack}
                        onGenerateOtp={async (pan: string) => {
                            const resp = await generateGstrEvcOtp({
                                userId: id,
                                userType: role,
                                gstin,
                                pan,
                            });
                            return !!(resp && (resp as any).status);
                        }}
                        onFileReturn={fileReturn}
                        onResetReturn={resetReturn}
                        isFiling={isFilingPortal}
                        ackNum={ackNum}
                    />
                );
        }
    };

    return (
        <Flex vertical gap={16}>
            {/* Period bar */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 gap-2"
            >
                <Flex gap={8} align="center" wrap="wrap">
                    <Flex gap={6} align="center">
                        <FileTextOutlined className="text-[#475569]" style={{ fontSize: 14 }} />
                        <Typography.Text className="text-sm font-medium text-[#475569]">
                            Period
                        </Typography.Text>
                    </Flex>
                    <Select
                        value={fy}
                        onChange={v => dispatch(setFinancialYear(v))}
                        size="small"
                        variant="borderless"
                        options={FINANCIAL_YEARS.map(f => ({ value: f, label: `FY ${f}` }))}
                        className="font-semibold text-sm"
                        style={{ minWidth: 100 }}
                    />
                    <Select
                        value={selectedMonthNum}
                        onChange={setSelectedMonthNum}
                        size="small"
                        variant="borderless"
                        options={[4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map(m => {
                            const yr = m >= 4 ? fyStart : fyStart + 1;
                            return { value: m, label: `${MONTH_LABELS_SHORT[m - 1]} ${yr}` };
                        })}
                        className="font-semibold text-sm"
                        style={{ minWidth: 100 }}
                    />
                </Flex>
                <Typography.Text className="text-xs text-[#94a3b8] hidden sm:block">
                    Showing data for {selectedMonthLabel}
                </Typography.Text>
            </Flex>

            {/* Step context banner — 3 states: filed, next-to-file (overdue), out-of-order */}
            {selectedMonthFiled && (
                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    className="rounded-[14px] px-4 py-3 border border-[#81cf92] gap-2"
                    style={{ backgroundColor: '#ecfdf5' }}
                >
                    <Flex gap={6} align="center" wrap="wrap">
                        <CheckCircleFilled style={{ fontSize: 14, color: '#43b75d' }} />
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#43b75d' }}
                        >
                            Step {currentStep} of {GSTR1_STEPS.length} —{' '}
                            <span className="font-semibold">
                                {GSTR1_STEPS.find(s => s.id === currentStep)?.label}
                            </span>
                        </Typography.Text>
                        <Typography.Text
                            className="text-sm font-semibold"
                            style={{ color: '#43b75d' }}
                        >
                            Completed ✓
                        </Typography.Text>
                    </Flex>
                    <Typography.Text className="text-xs text-[#94a3b8] hidden sm:block">
                        {selectedMonthLabel}
                    </Typography.Text>
                </Flex>
            )}
            {!selectedMonthFiled && isNextToFile && (
                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    className="rounded-[14px] px-4 py-3 border border-[#fecaca] gap-2"
                    style={{ backgroundColor: '#fff5f5' }}
                >
                    <Flex gap={6} align="center" wrap="wrap">
                        <WarningOutlined style={{ fontSize: 14, color: '#ef4444' }} />
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#dc2626' }}
                        >
                            Step {currentStep} of {GSTR1_STEPS.length} —{' '}
                            <span className="font-semibold">
                                {GSTR1_STEPS.find(s => s.id === currentStep)?.label}
                            </span>
                        </Typography.Text>
                        <Typography.Text
                            className="text-xs hidden sm:block"
                            style={{ color: '#dc2626' }}
                        >
                            Deadline: {deadlineLabel}
                        </Typography.Text>
                        {daysOverdue > 0 && (
                            <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: '#ff4f4f', color: 'white' }}
                            >
                                {daysOverdue}d overdue
                            </span>
                        )}
                    </Flex>
                    <Typography.Text className="text-xs text-[#94a3b8] hidden sm:block">
                        {selectedMonthLabel}
                    </Typography.Text>
                </Flex>
            )}
            {!selectedMonthFiled && isOutOfOrder && (
                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    className="rounded-[14px] px-4 py-3 border border-[#e2e8f0] gap-2"
                    style={{ backgroundColor: '#f8fafc' }}
                >
                    <Flex gap={6} align="center" wrap="wrap">
                        <LockOutlined style={{ fontSize: 14, color: '#94a3b8' }} />
                        <Typography.Text className="text-sm font-medium text-[#64748b]">
                            Step {currentStep} of {GSTR1_STEPS.length} —{' '}
                            <span className="font-semibold">
                                {GSTR1_STEPS.find(s => s.id === currentStep)?.label}
                            </span>
                        </Typography.Text>
                        <Typography.Text className="text-xs text-[#94a3b8] hidden sm:block">
                            Complete the previous step first
                        </Typography.Text>
                    </Flex>
                    <Typography.Text className="text-xs text-[#94a3b8] hidden sm:block">
                        {selectedMonthLabel}
                    </Typography.Text>
                </Flex>
            )}

            {/* Main layout */}
            <Flex gap={16} align="flex-start" className="flex-col sm:flex-row">
                {/* Left: header + stepper */}
                <Flex vertical gap={16} className="flex-shrink-0 w-full sm:w-[220px]">
                    <Flex gap={12} align="center">
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-xl flex-shrink-0"
                            style={{ width: 40, height: 40, backgroundColor: '#fff1f2' }}
                        >
                            <FileTextOutlined
                                className="text-brandColor"
                                style={{ fontSize: 18 }}
                            />
                        </Flex>
                        <Flex vertical gap={2}>
                            <Typography.Text
                                className="font-bold text-base text-[#1e293b]"
                                style={{ lineHeight: '22px' }}
                            >
                                GSTR-1 Filing
                            </Typography.Text>
                            <Typography.Text
                                className="text-xs text-[#64748b]"
                                style={{ lineHeight: '16px' }}
                            >
                                Outward supplies return · {selectedMonthLabel}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <StepSidebar
                        currentStep={currentStep}
                        nilReturn={isNilReturn}
                        onStepClick={setCurrentStep}
                    />
                </Flex>

                {/* Right: content card */}
                <div className="flex-1 min-w-0 w-full bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-6">
                    {renderStep()}
                </div>
            </Flex>
        </Flex>
    );
};

export default Gstr1FilingPage;
