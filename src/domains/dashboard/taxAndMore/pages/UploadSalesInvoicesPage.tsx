import { useEffect, useRef, useState } from 'react';

import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    FileTextOutlined,
    PlusOutlined,
    RedoOutlined,
    UploadOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Button, Flex, Modal, Select, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Formik, FormikProps, useFormikContext } from 'formik';
import { useNavigate } from 'react-router-dom';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import OtherImportsModal from '../components/OtherImportsModal';
import SoftwareImportModal from '../components/SoftwareImportModal';
import SyncFromPekoModal from '../components/SyncFromPekoModal';
import useGstSetup from '../hooks/useGstSetup';
import useSalesInvoices from '../hooks/useSalesInvoices';
import { salesInvoiceInlineSchema } from '../schema';
import { setFinancialYear } from '../slice/taxMoreSlice';
import { MonthData, MonthSummaryItem, SalesInvoiceRow } from '../types';
import { INDIAN_STATES, FINANCIAL_YEARS } from '../utils/data';

const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        n
    );

const NEW_ROW_KEY = '__new__';

interface InlineInvoiceForm {
    invoiceNo: string;
    invoiceDate: string;
    buyerName: string;
    buyerGstin: string;
    hsnCode: string;
    placeOfSupply: string;
    invoiceType: string;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
}

const EMPTY_INV_FORM: InlineInvoiceForm = {
    invoiceNo: '',
    invoiceDate: '',
    buyerName: '',
    buyerGstin: '',
    hsnCode: '',
    placeOfSupply: '',
    invoiceType: 'B2B',
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
};

// const INVOICE_TYPE_OPTS = [
//     { value: 'B2B', label: 'B2B' },
//     { value: 'B2C', label: 'B2C' },
//     { value: 'EXPORT', label: 'Export' },
//     { value: 'B2C_SMALL', label: 'B2C Small' },
//     { value: 'CDNR', label: 'CDNR' },
//     { value: 'CDNUR', label: 'CDNUR' },
// ];

const InlineTotalTax = () => {
    const { values } = useFormikContext<InlineInvoiceForm>();
    return (
        <span
            className="text-sm font-medium text-[#1e293b]"
            style={{ whiteSpace: 'nowrap', display: 'inline-block', paddingTop: 8 }}
        >
            ₹{' '}
            {fmt(
                (Number(values.cgst) || 0) + (Number(values.sgst) || 0) + (Number(values.igst) || 0)
            )}
        </span>
    );
};

const InlineCancelButton = ({ onCancel }: { onCancel: () => void }) => (
    <Tooltip title="Cancel">
        <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ color: '#ef4444' }} />}
            onClick={onCancel}
        />
    </Tooltip>
);

const STATE_CODE_MAP: Record<string, string> = Object.fromEntries(
    INDIAN_STATES.map(s => [s.code, s.name])
);
const posFromGstin = (gstin: string) =>
    STATE_CODE_MAP[gstin.substring(0, 2).padStart(2, '0')] || '';

const GstinAutoFillInput = () => {
    const { setFieldValue } = useFormikContext<InlineInvoiceForm>();
    return (
        <TextInput
            name="buyerGstin"
            type="text"
            placeholder="29XXXXX"
            size="small"
            formItemClass="!mb-0"
            convertToUppercase
            maxLength={15}
            handleChange={v => {
                const pos = posFromGstin(v.toUpperCase());
                if (pos) setFieldValue('placeOfSupply', pos);
            }}
        />
    );
};

const fmtL = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${fmt(n)}`;
};

const StatusIcon = ({ status }: { status: MonthData['status'] }) => {
    if (status === 'uploaded') return <CheckOutlined style={{ fontSize: 10, color: '#16a34a' }} />;
    if (status === 'missing') return <WarningOutlined style={{ fontSize: 10, color: '#d97706' }} />;
    return <span className="inline-block w-2 h-2 rounded-full bg-[#cbd5e1]" />;
};

const getPillStyle = (selected: boolean, isMissing: boolean): React.CSSProperties => {
    if (selected) return { height: 64, flex: 1 };
    if (isMissing)
        return { height: 64, flex: 1, backgroundColor: '#FFFBEB', borderColor: '#FDE68A' };
    return { height: 64, flex: 1 };
};

const getPillBorder = (selected: boolean, isMissing: boolean): string => {
    if (selected) return 'border-2 border-brandColor bg-[#fff5f5]';
    if (isMissing) return 'border';
    return 'border border-[#e2e8f0] bg-white hover:border-[#cbd5e1]';
};

const getLabelColor = (selected: boolean, isMissing: boolean): string => {
    if (selected) return 'text-brandColor';
    if (isMissing) return 'text-[#B45309]';
    return 'text-[#1e293b]';
};

const getYearColor = (selected: boolean, isMissing: boolean): string => {
    if (selected) return 'text-brandColor';
    if (isMissing) return 'text-[#FDE68A]';
    return 'text-[#94a3b8]';
};

const MonthPill = ({
    month,
    selected,
    onClick,
}: {
    month: MonthData;
    selected: boolean;
    onClick: () => void;
}) => {
    const isMissing = month.status === 'missing';

    const base =
        'cursor-pointer rounded-xl flex flex-col items-center justify-center gap-1 transition-all';
    const pillStyle = getPillStyle(selected, isMissing);
    const border = getPillBorder(selected, isMissing);
    const labelColor = getLabelColor(selected, isMissing);
    const yearColor = getYearColor(selected, isMissing);

    return (
        <button type="button" className={`${base} ${border}`} style={pillStyle} onClick={onClick}>
            <Typography.Text className={`font-semibold text-xs ${labelColor}`}>
                {month.label}
            </Typography.Text>
            <Typography.Text className={`text-[10px] ${yearColor}`}>{month.year}</Typography.Text>
            <StatusIcon status={month.status} />
        </button>
    );
};

const MONTH_LABELS = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
];

const toMonthKey = (month: number, fy: string): string => {
    const [startYear] = fy.split('-').map(Number);
    const year = month >= 4 ? startYear : startYear + 1;
    return `${MONTH_LABELS[month - 1]}-${year}`;
};

const toMonthData = (item: MonthSummaryItem, fy: string): MonthData => {
    const key = toMonthKey(item.month, fy);
    const [startYear] = fy.split('-').map(Number);
    const year = item.month >= 4 ? startYear : startYear + 1;
    return {
        key,
        label: MONTH_LABELS[item.month - 1],
        year: String(year),
        count: item.invoiceCount,
        status: item.status === 'missing_fields' ? 'missing' : (item.status as MonthData['status']),
    };
};

const FY_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

const buildFyMonths = (fy: string): MonthData[] => {
    const startYear = Number(fy.split('-')[0]);
    return FY_MONTH_ORDER.map(m => ({
        key: toMonthKey(m, fy),
        label: MONTH_LABELS[m - 1],
        year: String(m >= 4 ? startYear : startYear + 1),
        count: 0,
        status: 'not_started' as MonthData['status'],
    }));
};

const UploadSalesInvoicesPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { activeSetup, selectedFinancialYear } = useAppSelector(state => state.reducer.taxMore);
    const [otherImportsOpen, setOtherImportsOpen] = useState(false);
    const [softwareImportOpen, setSoftwareImportOpen] = useState(false);
    const [selectedSoftwareId, setSelectedSoftwareId] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [inlineForm, setInlineForm] = useState<InlineInvoiceForm | null>(null);
    const [monthAttentionMap, setMonthAttentionMap] = useState<Record<string, number>>({});

    const { setups } = useGstSetup();
    const gstin = activeSetup?.gstin ?? setups[0]?.gstin ?? '';
    const fy =
        selectedFinancialYear ??
        activeSetup?.financialYear ??
        setups[0]?.financialYear ??
        '2024-25';

    const defaultMonth = new Date().getMonth() + 1;
    const [selectedMonthKey, setSelectedMonthKey] = useState(() => toMonthKey(defaultMonth, fy));

    const selectedMonthNum = MONTH_LABELS.indexOf(selectedMonthKey.split('-')[0]) + 1;

    const { invoices, monthSummary, isLoading, add, update, remove, sync } = useSalesInvoices(
        gstin,
        fy,
        selectedMonthNum
    );

    const [deletingId, setDeletingId] = useState<string | null>(null);

    type RowEdits = {
        invoiceDate?: string;
        buyerName?: string;
        buyerGstin?: string;
        hsnCode?: string;
        placeOfSupply?: string;
        taxableAmount?: string;
        cgst?: string;
        sgst?: string;
        igst?: string;
    };
    type ActiveCell = { invoiceId: string; field: keyof RowEdits; value: string };
    const [edits, setEdits] = useState<Record<string, RowEdits>>({});
    const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [isSavingEdits, setIsSavingEdits] = useState(false);
    const formikRef = useRef<FormikProps<InlineInvoiceForm>>(null);
    const hasPendingEdits = inlineForm !== null || Object.keys(edits).length > 0;

    const FIELD_VALIDATORS: Partial<Record<keyof RowEdits, (v: string) => string | null>> = {
        taxableAmount: v => {
            if (!v || v.trim() === '') return 'Please enter the taxable amount';
            const num = parseFloat(v);
            if (Number.isNaN(num) || num <= 0) return 'Taxable amount must be greater than 0';
            return null;
        },
        hsnCode: v => {
            if (v && v.length > 8) return 'HSN/SAC code cannot exceed 8 characters';
            return null;
        },
        placeOfSupply: v => {
            if (!v || !v.trim()) return 'Please enter the place of supply';
            if (v !== v.trim()) return 'Place of supply cannot start or end with whitespace';
            if (/\s{2,}/.test(v)) return 'Place of supply cannot contain consecutive whitespaces';
            if (/^\s*$/.test(v)) return 'Place of supply cannot be only whitespace';
            if (v.length < 3) return 'Place of supply must be at least 3 characters';
            if (v.length > 50) return 'Place of supply cannot exceed 50 characters';
            return null;
        },
    };

    const stageEdit = () => {
        if (!activeCell) return;
        const { invoiceId, field, value } = activeCell;
        const validator = FIELD_VALIDATORS[field];
        if (validator) {
            const error = validator(value);
            if (error) {
                setEditError(error);
                return;
            }
        }
        setEditError(null);
        setEdits(prev => ({ ...prev, [invoiceId]: { ...prev[invoiceId], [field]: value } }));
        setActiveCell(null);
    };

    const handleSaveEdits = async () => {
        setIsSavingEdits(true);
        await Promise.all(
            Object.entries(edits).map(async ([invoiceId, data]) => {
                const payload: Record<string, unknown> = {};
                if (data.invoiceDate !== undefined) payload.invoiceDate = data.invoiceDate;
                if (data.buyerName !== undefined) payload.buyerName = data.buyerName;
                if (data.buyerGstin !== undefined) payload.buyerGstin = data.buyerGstin;
                if (data.hsnCode !== undefined) payload.hsnCode = data.hsnCode;
                if (data.placeOfSupply !== undefined) payload.placeOfSupply = data.placeOfSupply;
                if (data.taxableAmount !== undefined)
                    payload.taxableAmount = parseFloat(data.taxableAmount) || 0;
                if (data.cgst !== undefined) payload.cgst = parseFloat(data.cgst) || 0;
                if (data.sgst !== undefined) payload.sgst = parseFloat(data.sgst) || 0;
                if (data.igst !== undefined) payload.igst = parseFloat(data.igst) || 0;
                await update(invoiceId, payload as any);
            })
        );
        setEdits({});
        if (inlineForm !== null && formikRef.current) {
            const keys = Object.keys(formikRef.current.values) as (keyof InlineInvoiceForm)[];
            await formikRef.current.setTouched(
                keys.reduce((acc, k) => ({ ...acc, [k]: true }), {})
            );
            await formikRef.current.submitForm();
        }
        setIsSavingEdits(false);
    };

    const handleSync = () => {
        Modal.confirm({
            title: 'Resync from Peko?',
            content:
                'Resyncing will replace all current invoice data with the latest data from Peko Invoicing.',
            okText: 'Resync',
            cancelText: 'Cancel',
            okButtonProps: { danger: true },
            onOk: async () => {
                setIsSyncing(true);
                await sync();
                setIsSyncing(false);
            },
        });
    };

    const fyMonths: MonthData[] =
        monthSummary.length > 0 ? monthSummary.map(m => toMonthData(m, fy)) : buildFyMonths(fy);

    const selectedMonthData = fyMonths.find(m => m.key === selectedMonthKey);
    const hasInvoices = invoices.length > 0;
    const needsAttention = invoices.filter(
        i => i.status === 'missing_fields' || i.hsnCode == null || i.placeOfSupply == null
    ).length;
    const isCompleted = selectedMonthData?.status === 'uploaded' && needsAttention === 0;

    useEffect(() => {
        if (!isLoading) {
            setMonthAttentionMap(prev => ({ ...prev, [selectedMonthKey]: needsAttention }));
        }
    }, [selectedMonthKey, needsAttention, isLoading]);

    useEffect(() => {
        setEdits({});
        setActiveCell(null);
        setInlineForm(null);
    }, [selectedMonthKey]);

    const fyMonthsDisplay: typeof fyMonths = fyMonths.map(m => {
        const attn = monthAttentionMap[m.key] ?? (m.key === selectedMonthKey ? needsAttention : 0);
        return attn > 0 ? { ...m, status: 'missing' as const } : m;
    });

    const totalTaxable = invoices.reduce((s, i) => s + Number(i.taxableAmount), 0);
    const totalTax = invoices.reduce((s, i) => s + Number(i.totalTax), 0);
    const monthLabel = selectedMonthData
        ? `${selectedMonthData.label} ${selectedMonthData.year}`
        : selectedMonthKey;

    const newRow: SalesInvoiceRow = {
        id: NEW_ROW_KEY as unknown as number,
        corporateUserId: 0,
        gstin,
        financialYear: fy,
        month: selectedMonthNum,
        invoiceType: 'B2B',
        invoiceNo: '',
        invoiceDate: '',
        hsnCode: null,
        placeOfSupply: null,
        buyerGstin: null,
        buyerName: null,
        portCode: null,
        shippingBillNo: null,
        shippingBillDate: null,
        taxableAmount: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        totalTax: 0,
        status: 'uploaded',
    };
    const dataSource: SalesInvoiceRow[] = inlineForm ? [...invoices, newRow] : invoices;

    const isNew = (r: SalesInvoiceRow) => (r.id as unknown as string) === NEW_ROW_KEY;

    const FIELD_MAX_LENGTH: Partial<Record<keyof RowEdits, number>> = {
        buyerName: 100,
        buyerGstin: 15,
        hsnCode: 8,
        placeOfSupply: 50,
        taxableAmount: 10,
        cgst: 10,
        sgst: 10,
        igst: 10,
    };

    const editCell = (
        field: keyof RowEdits,
        r: SalesInvoiceRow,
        value: string | number | null | undefined,
        displayEl: React.ReactNode,
        missingLabel: string,
        inputType = 'text'
    ) => {
        const rowId = String(r.id);

        // Step 1: cell is actively being typed into
        if (activeCell?.invoiceId === rowId && activeCell?.field === field) {
            return (
                <div style={{ position: 'relative' }}>
                    <Flex align="center" gap={4}>
                        <input
                            ref={el => {
                                if (el) el.focus();
                            }}
                            type={inputType}
                            className={`border rounded px-2 py-1 text-sm flex-1 min-w-[70px] focus:outline-none bg-white ${editError ? 'border-red-500 focus:border-red-500' : 'border-[#94a3b8] focus:border-[#ff4f4f]'}`}
                            value={activeCell.value}
                            maxLength={FIELD_MAX_LENGTH[field]}
                            onChange={e => {
                                setEditError(null);
                                setActiveCell(prev =>
                                    prev ? { ...prev, value: e.target.value } : null
                                );
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') stageEdit();
                                if (e.key === 'Escape') {
                                    setEditError(null);
                                    setActiveCell(null);
                                }
                            }}
                        />
                        <Tooltip title="Confirm">
                            <Button
                                type="text"
                                size="small"
                                style={{ padding: '0 4px', height: 22 }}
                                icon={<CheckOutlined style={{ color: '#22c55e', fontSize: 11 }} />}
                                onClick={stageEdit}
                            />
                        </Tooltip>
                    </Flex>
                    {editError && (
                        <div
                            className="text-errorTextRed"
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                zIndex: 10,
                                fontSize: 12,
                                maxWidth: 160,
                                lineHeight: '1.2',
                            }}
                        >
                            {editError}
                        </div>
                    )}
                </div>
            );
        }

        // Step 2: value is staged (confirmed, awaiting bulk save)
        const stagedValue = edits[rowId]?.[field];
        if (stagedValue !== undefined) {
            return (
                <button
                    type="button"
                    className="text-sm text-[#15803d] cursor-pointer hover:bg-[#f0fdf4] rounded px-1 py-0.5 bg-transparent border-0"
                    title="Click to re-edit"
                    onClick={() => {
                        setEditError(null);
                        setActiveCell({ invoiceId: rowId, field, value: stagedValue });
                    }}
                >
                    {stagedValue || '—'}
                </button>
            );
        }

        // Step 3: display mode — missing or has value
        if (value == null || value === '') {
            return (
                <button
                    type="button"
                    className="text-xs font-medium text-[#dc2626] cursor-pointer hover:opacity-70 bg-transparent border-0 p-0"
                    onClick={() => {
                        setEditError(null);
                        setActiveCell({ invoiceId: rowId, field, value: '' });
                    }}
                >
                    + {missingLabel}
                </button>
            );
        }
        return (
            <button
                type="button"
                className="cursor-pointer hover:bg-[#f1f5f9] rounded px-1 py-0.5 bg-transparent border-0"
                title="Click to edit"
                onClick={() => {
                    setEditError(null);
                    setActiveCell({ invoiceId: rowId, field, value: String(value) });
                }}
            >
                {displayEl}
            </button>
        );
    };

    const columns: ColumnsType<SalesInvoiceRow> = [
        {
            title: 'Invoice No.',
            dataIndex: 'invoiceNo',
            key: 'invoiceNo',
            width: 130,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="invoiceNo"
                        type="text"
                        placeholder="INV-001"
                        size="small"
                        isRequired
                        formItemClass="!mb-0"
                    />
                ) : (
                    <span className="text-sm text-[#1e293b]">{v}</span>
                ),
        },
        {
            title: 'Date',
            dataIndex: 'invoiceDate',
            key: 'invoiceDate',
            width: 130,
            render: (v, r) =>
                isNew(r) ? (
                    <DatePickerInput
                        name="invoiceDate"
                        placeholder="Date"
                        size="small"
                        isRequired
                        formItemClass="!mb-0"
                    />
                ) : (
                    editCell(
                        'invoiceDate',
                        r,
                        v,
                        <span className="text-sm text-[#475569]">{v}</span>,
                        'Add Date',
                        'date'
                    )
                ),
        },
        {
            title: 'Party Name',
            dataIndex: 'buyerName',
            key: 'buyerName',
            width: 150,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="buyerName"
                        type="text"
                        placeholder="Buyer name"
                        size="small"
                        isRequired
                        formItemClass="!mb-0"
                    />
                ) : (
                    editCell(
                        'buyerName',
                        r,
                        v,
                        <span className="text-sm text-[#1e293b]">{v}</span>,
                        'Add Party Name'
                    )
                ),
        },
        {
            title: 'GSTIN',
            dataIndex: 'buyerGstin',
            key: 'buyerGstin',
            width: 155,
            render: (v, r) =>
                isNew(r) ? (
                    <GstinAutoFillInput />
                ) : (
                    editCell(
                        'buyerGstin',
                        r,
                        v,
                        <span className="text-sm text-[#475569] font-mono">{v}</span>,
                        'Add GSTIN'
                    )
                ),
        },
        {
            title: 'HSN/SAC',
            dataIndex: 'hsnCode',
            key: 'hsnSac',
            width: 100,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="hsnCode"
                        type="text"
                        placeholder="HSN"
                        size="small"
                        formItemClass="!mb-0"
                    />
                ) : (
                    editCell(
                        'hsnCode',
                        r,
                        v,
                        <span className="text-sm text-[#475569] font-mono">{v}</span>,
                        'Add HSN/SAC'
                    )
                ),
        },
        {
            title: 'Place of Supply',
            dataIndex: 'placeOfSupply',
            key: 'placeOfSupply',
            width: 150,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="placeOfSupply"
                        type="text"
                        placeholder="State"
                        size="small"
                        formItemClass="!mb-0"
                    />
                ) : (
                    editCell(
                        'placeOfSupply',
                        r,
                        STATE_CODE_MAP[v] ?? v,
                        <span className="text-sm text-[#475569]">{STATE_CODE_MAP[v] ?? v}</span>,
                        'Add POS'
                    )
                ),
        },
        {
            title: 'Taxable (₹)',
            dataIndex: 'taxableAmount',
            key: 'taxableAmount',
            width: 150,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="taxableAmount"
                        type="text"
                        placeholder="0"
                        size="small"
                        allowTwoDecimalsOnly
                        isRequired
                        formItemClass="!mb-0"
                        maxLength={10}
                    />
                ) : (
                    editCell(
                        'taxableAmount',
                        r,
                        v,
                        <span className="text-sm text-[#475569] whitespace-nowrap">
                            ₹ {fmt(Number(v))}
                        </span>,
                        'Add Amount'
                    )
                ),
        },
        {
            title: 'CGST (₹)',
            dataIndex: 'cgst',
            key: 'cgst',
            width: 130,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="cgst"
                        type="text"
                        placeholder="0"
                        size="small"
                        allowTwoDecimalsOnly
                        formItemClass="!mb-0"
                        maxLength={10}
                    />
                ) : (
                    editCell(
                        'cgst',
                        r,
                        v,
                        <span className="text-sm text-[#475569] whitespace-nowrap">
                            ₹ {fmt(Number(v))}
                        </span>,
                        'Add CGST'
                    )
                ),
        },
        {
            title: 'SGST (₹)',
            dataIndex: 'sgst',
            key: 'sgst',
            width: 130,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="sgst"
                        type="text"
                        placeholder="0"
                        size="small"
                        allowTwoDecimalsOnly
                        formItemClass="!mb-0"
                        maxLength={10}
                    />
                ) : (
                    editCell(
                        'sgst',
                        r,
                        v,
                        <span className="text-sm text-[#475569] whitespace-nowrap">
                            ₹ {fmt(Number(v))}
                        </span>,
                        'Add SGST'
                    )
                ),
        },
        {
            title: 'IGST (₹)',
            dataIndex: 'igst',
            key: 'igst',
            width: 130,
            render: (v, r) =>
                isNew(r) ? (
                    <TextInput
                        name="igst"
                        type="text"
                        placeholder="0"
                        size="small"
                        allowTwoDecimalsOnly
                        formItemClass="!mb-0"
                        maxLength={10}
                    />
                ) : (
                    editCell(
                        'igst',
                        r,
                        v,
                        <span className="text-sm text-[#475569] whitespace-nowrap">
                            ₹ {fmt(Number(v))}
                        </span>,
                        'Add IGST'
                    )
                ),
        },
        {
            title: 'Total (₹)',
            dataIndex: 'totalTax',
            key: 'totalTax',
            width: 160,
            render: (v, r) =>
                isNew(r) ? (
                    <InlineTotalTax />
                ) : (
                    <span
                        className="text-sm font-medium text-[#1e293b]"
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        ₹{fmt(Number(v))}
                    </span>
                ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            fixed: 'right',
            render: (_, record) =>
                isNew(record) ? (
                    <InlineCancelButton onCancel={() => setInlineForm(null)} />
                ) : (
                    <Flex gap={8} align="center">
                        {record.status === 'uploaded' &&
                        record.hsnCode != null &&
                        record.placeOfSupply != null ? (
                            <Tag
                                icon={<CheckOutlined />}
                                className="cursor-pointer rounded-full border-0 text-[10px] font-semibold px-2 py-0"
                                style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}
                            >
                                Okay
                            </Tag>
                        ) : (
                            <Tag
                                icon={<WarningOutlined />}
                                className="cursor-pointer rounded-full border-0 text-[10px] font-semibold px-2 py-0"
                                style={{ backgroundColor: '#fff1f2', color: '#b91c1c' }}
                            >
                                Fix
                            </Tag>
                        )}
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={deletingId === String(record.id)}
                                className="text-[#94a3b8] hover:text-red-500"
                                onClick={async () => {
                                    const id = String(record.id);
                                    setDeletingId(id);
                                    await remove(id);
                                    setDeletingId(null);
                                }}
                            />
                        </Tooltip>
                    </Flex>
                ),
        },
    ];

    return (
        <Flex vertical gap={0}>
            {/* Period bar */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 mb-3 gap-2"
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
                        className="font-medium text-sm"
                        style={{ minWidth: 100 }}
                    />
                    <Select
                        value={selectedMonthKey}
                        onChange={setSelectedMonthKey}
                        size="small"
                        variant="borderless"
                        options={fyMonths.map(m => ({
                            value: m.key,
                            label: `${m.label} ${m.year}`,
                        }))}
                        className="font-medium text-sm"
                        style={{ minWidth: 100 }}
                    />
                </Flex>
                <Typography.Text className="text-xs text-[#94a3b8] hidden sm:block">
                    Showing data for {monthLabel}
                </Typography.Text>
            </Flex>

            {/* Step indicator */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                className={`rounded-xl px-4 py-3 mb-4 border gap-2 ${isCompleted ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-white border-[#e2e8f0]'}`}
            >
                <Flex gap={6} align="center" wrap="wrap">
                    <FileTextOutlined
                        className={isCompleted ? 'text-[#16a34a]' : 'text-[#475569]'}
                        style={{ fontSize: 14 }}
                    />
                    <Typography.Text
                        className={`text-sm font-medium ${isCompleted ? 'text-[#15803d]' : 'text-[#1e293b]'}`}
                    >
                        Step 1 of 6 — <span className="font-semibold">Upload Sales Invoices</span>
                    </Typography.Text>
                    {isCompleted ? (
                        <Tag
                            icon={<CheckOutlined />}
                            className="rounded-full border-0 text-xs font-semibold"
                            style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
                        >
                            Completed
                        </Tag>
                    ) : (
                        <Tag
                            className="rounded-full border-0 text-xs font-medium"
                            style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                        >
                            No hard deadline
                        </Tag>
                    )}
                </Flex>
                <Typography.Text className="text-xs text-[#94a3b8] hidden sm:block">
                    {monthLabel}
                </Typography.Text>
            </Flex>

            {/* Sales Invoices header */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-4 mb-4 gap-3"
            >
                <Flex vertical gap={2}>
                    <Typography.Text className="font-semibold text-base text-[#1e293b]">
                        Sales Invoices
                    </Typography.Text>
                    <Typography.Text className="text-sm text-[#475569]">
                        FY {fy} · {fyMonths.filter(m => m.status !== 'not_started').length} of 12
                        months have data
                    </Typography.Text>
                </Flex>
                {isCompleted && (
                    <Button
                        type="primary"
                        danger
                        icon={<CheckOutlined />}
                        iconPosition="end"
                        onClick={() =>
                            navigate(`${paths.dashboard.taxMore}/${paths.taxMore.fileGstr1}`)
                        }
                        style={{ height: 40 }}
                    >
                        File GSTR-1
                    </Button>
                )}
            </Flex>

            {/* Month selector */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-4 mb-4">
                <Flex align="center" justify="space-between" wrap="wrap" className="mb-3 gap-2">
                    <Typography.Text className="font-semibold text-sm text-[#1e293b]">
                        Select month — FY {fy}
                    </Typography.Text>
                    <Flex gap={10} align="center" wrap="wrap">
                        <Flex gap={4} align="center">
                            <CheckOutlined style={{ fontSize: 10, color: '#16a34a' }} />
                            <Typography.Text className="text-xs text-[#475569]">
                                Uploaded
                            </Typography.Text>
                        </Flex>
                        <Flex gap={4} align="center">
                            <WarningOutlined style={{ fontSize: 10, color: '#d97706' }} />
                            <Typography.Text className="text-xs text-[#475569]">
                                Missing
                            </Typography.Text>
                        </Flex>
                        <Flex gap={4} align="center">
                            <span className="inline-block w-2 h-2 rounded-full bg-[#cbd5e1]" />
                            <Typography.Text className="text-xs text-[#475569]">
                                Not started
                            </Typography.Text>
                        </Flex>
                    </Flex>
                </Flex>
                <div className="overflow-x-auto -mx-1 px-1 pb-1">
                    <Flex gap={6} style={{ minWidth: 'max-content' }}>
                        {fyMonthsDisplay.map(m => (
                            <MonthPill
                                key={m.key}
                                month={m}
                                selected={m.key === selectedMonthKey}
                                onClick={() => setSelectedMonthKey(m.key)}
                            />
                        ))}
                    </Flex>
                </div>
            </div>

            {/* Content area */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                {/* Section header */}
                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    className="px-4 py-3 border-b border-[#f1f5f9] gap-2"
                >
                    <Flex gap={8} align="center">
                        <FileTextOutlined className="text-[#475569]" style={{ fontSize: 14 }} />
                        <Typography.Text className="font-semibold text-sm text-[#1e293b]">
                            {monthLabel}
                        </Typography.Text>
                        {hasInvoices && (
                            <Typography.Text className="text-xs text-[#94a3b8]">
                                {invoices.length} invoices
                            </Typography.Text>
                        )}
                    </Flex>
                    {hasInvoices && (
                        <Flex gap={8} align="center" wrap="wrap">
                            {hasPendingEdits && (
                                <Button
                                    size="small"
                                    icon={<CheckOutlined />}
                                    loading={isSavingEdits}
                                    style={{
                                        backgroundColor: '#22c55e',
                                        borderColor: '#22c55e',
                                        color: '#fff',
                                    }}
                                    onClick={handleSaveEdits}
                                >
                                    Save edits
                                </Button>
                            )}
                            <Button
                                size="small"
                                icon={<RedoOutlined />}
                                style={{ borderColor: '#FF3A3A', color: '#FF3A3A' }}
                                onClick={handleSync}
                            >
                                Resync Peko
                            </Button>
                            <Button
                                size="small"
                                icon={<UploadOutlined />}
                                style={{ borderColor: '#FF3A3A', color: '#FF3A3A' }}
                                onClick={() => setOtherImportsOpen(true)}
                            >
                                Re-upload
                            </Button>
                        </Flex>
                    )}
                </Flex>

                {!hasInvoices ? (
                    /* Empty state */
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        gap={16}
                        style={{ minHeight: 320 }}
                        className="py-16"
                    >
                        <Flex
                            align="center"
                            justify="center"
                            className="bg-[#f8fafc] rounded-xl"
                            style={{ width: 56, height: 56 }}
                        >
                            <FileTextOutlined style={{ fontSize: 24, color: '#94a3b8' }} />
                        </Flex>
                        <Flex vertical gap={6} align="center">
                            <Typography.Text className="font-semibold text-base text-[#1e293b]">
                                No invoices for {monthLabel}
                            </Typography.Text>
                            <Typography.Text
                                className="text-sm text-[#475569] text-center"
                                style={{ maxWidth: 360 }}
                            >
                                Import your sales invoices to start the GSTR-1 filing process for
                                this month.
                            </Typography.Text>
                        </Flex>
                        <Flex gap={10} align="center">
                            <Button
                                type="primary"
                                danger
                                icon={<RedoOutlined />}
                                style={{ height: 40 }}
                                onClick={handleSync}
                            >
                                Sync from Peko
                            </Button>
                            <Button
                                icon={<UploadOutlined />}
                                style={{ height: 40, borderColor: '#cbd5e1', color: '#475569' }}
                                onClick={() => setOtherImportsOpen(true)}
                            >
                                Other imports
                            </Button>
                        </Flex>
                        <Typography.Text className="text-xs text-[#94a3b8]">
                            Supports TallyPrime · Zoho Books · Busy · Vyapar · Marg ERP · CSV
                            template
                        </Typography.Text>
                    </Flex>
                ) : (
                    /* Invoice list */
                    <Formik
                        innerRef={formikRef}
                        initialValues={inlineForm ?? EMPTY_INV_FORM}
                        validationSchema={salesInvoiceInlineSchema}
                        enableReinitialize
                        onSubmit={async (values, { resetForm, setFieldError }) => {
                            const trimmedNo = values.invoiceNo.trim();
                            const isDuplicate = invoices.some(
                                inv =>
                                    (inv.id as unknown as string) !== NEW_ROW_KEY &&
                                    inv.invoiceNo === trimmedNo
                            );
                            if (isDuplicate) {
                                setInlineForm({ ...values });
                                dispatch(
                                    showToast({
                                        description:
                                            'Invoice number already exists. Please use a different invoice number.',
                                        variant: 'error',
                                    })
                                );
                                return;
                            }
                            const ok = await add({
                                month: selectedMonthNum,
                                invoices: [
                                    {
                                        invoiceType: values.invoiceType || 'B2B',
                                        invoiceNo: values.invoiceNo,
                                        invoiceDate: values.invoiceDate,
                                        hsnCode: values.hsnCode || undefined,
                                        placeOfSupply: values.placeOfSupply || undefined,
                                        buyerGstin: values.buyerGstin || undefined,
                                        buyerName: values.buyerName || undefined,
                                        taxableAmount:
                                            parseFloat(String(values.taxableAmount)) || 0,
                                        cgst: parseFloat(String(values.cgst)) || 0,
                                        sgst: parseFloat(String(values.sgst)) || 0,
                                        igst: parseFloat(String(values.igst)) || 0,
                                    },
                                ],
                            });
                            if (!ok) setInlineForm({ ...values });
                            if (ok) {
                                resetForm();
                                setInlineForm(null);
                            }
                        }}
                    >
                        <Flex vertical>
                            {/* Stats row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[#f1f5f9] px-4 py-3 bg-white">
                                {[
                                    {
                                        label: 'Total Invoices',
                                        value: String(invoices.length),
                                        warn: false,
                                    },
                                    {
                                        label: 'Taxable value',
                                        value: fmtL(totalTaxable),
                                        warn: false,
                                    },
                                    { label: 'Total tax', value: fmtL(totalTax), warn: false },
                                    {
                                        label: 'Needs attention',
                                        value: String(needsAttention),
                                        warn: needsAttention > 0,
                                    },
                                ].map(stat => (
                                    <Flex
                                        key={stat.label}
                                        vertical
                                        align="center"
                                        justify="center"
                                        gap={4}
                                        className="py-5 rounded-xl"
                                        style={
                                            stat.warn
                                                ? {
                                                      backgroundColor: '#FFFBEB',
                                                      border: '1px solid #FDE68A',
                                                  }
                                                : { backgroundColor: '#f8fafc' }
                                        }
                                    >
                                        <Typography.Text
                                            className="font-bold text-xl"
                                            style={{ color: stat.warn ? '#B45309' : '#1e293b' }}
                                        >
                                            {stat.value}
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-xs"
                                            style={{ color: stat.warn ? '#B45309' : '#475569' }}
                                        >
                                            {stat.label}
                                        </Typography.Text>
                                    </Flex>
                                ))}
                            </div>

                            {/* Attention warning */}
                            {needsAttention > 0 && (
                                <Flex
                                    gap={8}
                                    align="flex-start"
                                    className="mx-3 sm:mx-6 my-4 rounded-lg px-4 py-3 border"
                                    style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
                                >
                                    <ExclamationCircleOutlined
                                        style={{
                                            color: '#D97706',
                                            fontSize: 14,
                                            marginTop: 2,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Flex vertical gap={2}>
                                        <Typography.Text
                                            className="text-sm font-medium"
                                            style={{ color: '#92400E' }}
                                        >
                                            {needsAttention} invoice{needsAttention > 1 ? 's' : ''}{' '}
                                            need your attention
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-xs"
                                            style={{ color: '#B45309' }}
                                        >
                                            Fields highlighted in red are required for GSTR-1
                                            filing. Click any cell to fill in.
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            )}

                            {/* Table */}
                            <div className="px-0">
                                <Table
                                    dataSource={dataSource}
                                    columns={columns}
                                    rowKey="id"
                                    loading={isLoading}
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 'max-content' }}
                                    className="invoice-table"
                                    rowClassName={r => {
                                        if (isNew(r)) return 'bg-[#f0fdf4] [&>td]:!align-top';
                                        if (r.status === 'missing_fields') return 'bg-[#fff9f9]';
                                        return '';
                                    }}
                                    summary={pageData => {
                                        const existing = pageData.filter(r => !isNew(r));
                                        const tTaxable = existing.reduce(
                                            (s, r) => s + Number(r.taxableAmount),
                                            0
                                        );
                                        const tTax = existing.reduce(
                                            (s, r) => s + Number(r.totalTax),
                                            0
                                        );
                                        return (
                                            <Table.Summary.Row className="bg-[#f8fafc]">
                                                <Table.Summary.Cell index={0} colSpan={6}>
                                                    <Typography.Text className="font-semibold text-sm text-[#1e293b]">
                                                        {existing.length} invoices total
                                                    </Typography.Text>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={6} align="right">
                                                    <Typography.Text
                                                        className="font-semibold text-sm text-[#1e293b]"
                                                        style={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        ₹{fmt(tTaxable)}
                                                    </Typography.Text>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={7} colSpan={3} />
                                                <Table.Summary.Cell index={10} align="right">
                                                    <Typography.Text
                                                        className="font-semibold text-sm text-brandColor"
                                                        style={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        Tax: ₹{fmt(tTax)}
                                                    </Typography.Text>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={11} />
                                            </Table.Summary.Row>
                                        );
                                    }}
                                />
                            </div>

                            {/* Add row */}
                            <button
                                type="button"
                                disabled={!!inlineForm}
                                className={`w-full text-center py-3 border-t border-[#f1f5f9] text-sm font-medium transition-colors ${inlineForm ? 'text-[#94a3b8] cursor-not-allowed' : 'text-brandColor hover:bg-[#fff5f5] cursor-pointer'}`}
                                onClick={() => setInlineForm({ ...EMPTY_INV_FORM })}
                            >
                                <PlusOutlined className="mr-1" style={{ fontSize: 12 }} />
                                Add invoice row
                            </button>
                        </Flex>
                    </Formik>
                )}
            </div>

            <OtherImportsModal
                open={otherImportsOpen}
                onClose={() => setOtherImportsOpen(false)}
                onSelect={softwareId => {
                    setSelectedSoftwareId(softwareId);
                    setOtherImportsOpen(false);
                    setSoftwareImportOpen(true);
                }}
            />

            <SoftwareImportModal
                open={softwareImportOpen}
                softwareId={selectedSoftwareId}
                onClose={() => setSoftwareImportOpen(false)}
                onImport={async items => {
                    const ok = await add({ month: selectedMonthNum, invoices: items });
                    return !!ok;
                }}
            />

            <SyncFromPekoModal open={isSyncing} monthLabel={monthLabel} />
        </Flex>
    );
};

export default UploadSalesInvoicesPage;
