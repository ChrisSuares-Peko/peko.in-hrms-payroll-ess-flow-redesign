import { useCallback, useEffect, useRef, useState } from 'react';

import '../assets/styles/taxAndMore.css';

import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CalendarOutlined,
    CheckCircleFilled,
    CheckOutlined,
    DownloadOutlined,
    FileDoneOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    SaveOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { Badge, Button, Flex, Switch, Typography } from 'antd';
import type { FormikProps } from 'formik';
import { Formik, Form as FormikForm, useFormikContext } from 'formik';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import useGstr3b from '../hooks/useGstr3b';
import useGstSetup from '../hooks/useGstSetup';
import { panSchema } from '../schema';
import { FINANCIAL_YEARS, MONTH_LABELS, MONTH_LABELS_SHORT } from '../utils/data';

// ─── Types ───────────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type FetchSubState = 'idle' | 'fetching' | 'loaded';
type SaveSubState = 'idle' | 'saving' | 'saved';
type OtpSubState = 'idle' | 'sent';

const STEPS: { id: StepId; label: string }[] = [
    { id: 1, label: 'Select Period' },
    { id: 2, label: 'Fetch Portal Data' },
    { id: 3, label: 'Fill GSTR-3B Form' },
    { id: 4, label: 'Save & Validate' },
    { id: 5, label: 'Ledger Balances' },
    { id: 6, label: 'Offset Liability' },
    { id: 7, label: 'EVC & File' },
    { id: 8, label: 'Confirmation' },
];

const FY_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatFiledAt = (d?: string | null) => (d ? new Date(d).toLocaleString('en-IN') : '—');

// ─── Shared components ───────────────────────────────────────────────────────

const SectionCard = ({ children }: { children: React.ReactNode }) => (
    <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
        {children}
    </div>
);

const AccordionRow = ({
    num,
    label,
    badge,
    badgeGreen,
    children,
    open,
    onToggle,
}: {
    num: string;
    label: string;
    badge?: string;
    badgeGreen?: boolean;
    children?: React.ReactNode;
    open?: boolean;
    onToggle?: () => void;
}) => (
    <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden">
        <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#fafafa] transition-colors"
            onClick={onToggle}
        >
            <Flex gap={10} align="center">
                <Badge
                    count={num}
                    style={{ backgroundColor: '#ff4f4f', fontWeight: 700, fontSize: 11 }}
                />
                <Typography.Text className="font-medium" style={{ fontSize: 15, color: '#1e293b' }}>
                    {label}
                </Typography.Text>
                {badge && (
                    <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={
                            badgeGreen
                                ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                                : { backgroundColor: '#fef2f2', color: '#ff4f4f' }
                        }
                    >
                        {badge}
                    </span>
                )}
            </Flex>
            <span style={{ color: '#94a3b8', fontSize: 18 }}>{open ? '∧' : '∨'}</span>
        </button>
        {open && children && <div className="border-t border-[#e2e8f0] bg-white">{children}</div>}
    </div>
);

const TableHeader = ({ cols, minWidth = 480 }: { cols: string[]; minWidth?: number }) => (
    <div
        className="grid px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]"
        style={{
            gridTemplateColumns: `2fr ${cols
                .slice(1)
                .map(() => '1fr')
                .join(' ')}`,
            minWidth,
        }}
    >
        {cols.map(c => (
            <Typography.Text
                key={c}
                className="text-xs font-semibold whitespace-nowrap"
                style={{ color: '#475569' }}
            >
                {c}
            </Typography.Text>
        ))}
    </div>
);

const getTableCellColor = (highlight: boolean | undefined, isFirst: boolean) => {
    if (highlight) return '#43b75d';
    if (isFirst) return '#1e293b';
    return '#475569';
};

const TableRow = ({ cells, highlight }: { cells: string[]; highlight?: boolean }) => (
    <div
        className="grid px-4 py-3 border-b border-[#e2e8f0] last:border-b-0"
        style={{
            gridTemplateColumns: `2fr ${cells
                .slice(1)
                .map(() => '1fr')
                .join(' ')}`,
            backgroundColor: highlight ? '#ecfdf5' : 'white',
            minWidth: 480,
        }}
    >
        {cells.map((c, i) => (
            <Typography.Text
                key={i}
                className={`text-sm ${highlight ? 'font-semibold' : ''}`}
                style={{ color: getTableCellColor(highlight, i === 0) }}
            >
                {c}
            </Typography.Text>
        ))}
    </div>
);

const NavBtn = ({
    children,
    onClick,
    primary,
    disabled,
    loading,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    primary?: boolean;
    disabled?: boolean;
    loading?: boolean;
}) => (
    <Button
        type={primary ? 'primary' : 'default'}
        danger={primary}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        style={{ height: 40, fontSize: 14, fontWeight: 500 }}
    >
        {children}
    </Button>
);

// Convert filing.formData arrays → Formik-friendly object shape
const toFormikValues = (fd: any) => ({
    sup_details: fd?.sup_details ?? {
        osup_det: {},
        osup_zero: {},
        osup_nil_exmp: {},
        isup_rev: {},
        osup_nongst: {},
    },
    eco_dtls: fd?.eco_dtls ?? { eco_sup: {}, eco_reg_sup: {} },
    itc_elg: {
        itc_avl: Object.fromEntries(
            (fd?.itc_elg?.itc_avl ?? []).map((e: any) => [
                e.ty,
                { iamt: e.iamt ?? 0, camt: e.camt ?? 0, samt: e.samt ?? 0 },
            ])
        ),
        itc_rev: Object.fromEntries(
            (fd?.itc_elg?.itc_rev ?? []).map((e: any) => [
                e.ty,
                { iamt: e.iamt ?? 0, camt: e.camt ?? 0, samt: e.samt ?? 0 },
            ])
        ),
        itc_inelg: Object.fromEntries(
            (fd?.itc_elg?.itc_inelg ?? []).map((e: any) => [
                e.ty,
                { iamt: e.iamt ?? 0, camt: e.camt ?? 0, samt: e.samt ?? 0 },
            ])
        ),
        itc_net: fd?.itc_elg?.itc_net ?? {},
    },
    inward_sup: {
        isup_details: Object.fromEntries(
            (fd?.inward_sup?.isup_details ?? []).map((e: any) => [
                e.ty,
                { inter: e.inter ?? 0, intra: e.intra ?? 0 },
            ])
        ),
    },
    inter_sup: fd?.inter_sup ?? {},
    intr_ltfee: fd?.intr_ltfee ?? { intr_details: {}, ltfee_details: {} },
});

// Convert back from Formik values → formData structure for saving
const fromFormikValues = (values: any, originalFd: any) => {
    const sumEntries = (obj: Record<string, any>, field: string) =>
        Object.values(obj ?? {}).reduce((acc, v: any) => acc + (Number(v?.[field]) || 0), 0);
    const avl = values.itc_elg?.itc_avl ?? {};
    const rev = values.itc_elg?.itc_rev ?? {};
    const itc_net = {
        iamt: Math.max(0, sumEntries(avl, 'iamt') - sumEntries(rev, 'iamt')),
        camt: Math.max(0, sumEntries(avl, 'camt') - sumEntries(rev, 'camt')),
        samt: Math.max(0, sumEntries(avl, 'samt') - sumEntries(rev, 'samt')),
        csamt: originalFd?.itc_elg?.itc_net?.csamt ?? 0,
    };
    return {
        ...originalFd,
        sup_details: values.sup_details,
        eco_dtls: values.eco_dtls,
        itc_elg: {
            ...originalFd?.itc_elg,
            itc_avl: Object.entries(values.itc_elg?.itc_avl ?? {}).map(([ty, v]: any) => ({
                ty,
                ...v,
                csamt: 0,
            })),
            itc_rev: Object.entries(values.itc_elg?.itc_rev ?? {}).map(([ty, v]: any) => ({
                ty,
                ...v,
                csamt: 0,
            })),
            itc_inelg: Object.entries(values.itc_elg?.itc_inelg ?? {}).map(([ty, v]: any) => ({
                ty,
                ...v,
                csamt: 0,
            })),
            itc_net,
        },
        inward_sup: {
            isup_details: Object.entries(values.inward_sup?.isup_details ?? {}).map(
                ([ty, v]: any) => ({ ty, ...v })
            ),
        },
        inter_sup: values.inter_sup,
        intr_ltfee: values.intr_ltfee,
    };
};

// Derive optimal ITC cross-head routing from the auto-liability API response
const computeRoutingFromAutoLiability = (autoLiability: any) => {
    const liabitc = autoLiability?.liabitc ?? {};
    const itcAvl = liabitc?.elgitc?.itc4a5?.det?.itcavl ?? {};
    const supTotal = liabitc?.sup_details?.osup_3_1a?.subtotal ?? {};
    const rcTotal = liabitc?.sup_details?.isup_3_1d?.subtotal ?? {};

    const igstItc = Number(itcAvl.igst ?? 0);
    const cgstItc = Number(itcAvl.cgst ?? 0);
    const sgstItc = Number(itcAvl.sgst ?? 0);
    const cessItc = Number(itcAvl.cess ?? 0);

    const igstLiab = Number(supTotal.iamt ?? 0) + Number(rcTotal.iamt ?? 0);
    const cgstLiab = Number(supTotal.camt ?? 0) + Number(rcTotal.camt ?? 0);
    const sgstLiab = Number(supTotal.samt ?? 0) + Number(rcTotal.samt ?? 0);
    const cessLiab = Number(supTotal.csamt ?? 0) + Number(rcTotal.csamt ?? 0);

    // Pay own-head liabilities first
    const cgst_cgst = Math.min(cgstItc, cgstLiab);
    const sgst_sgst = Math.min(sgstItc, sgstLiab);
    const cess_cess = Math.min(cessItc, cessLiab);

    // Remaining ITC after own-head payment available for cross-head
    const remainCgst = cgstItc - cgst_cgst;
    const remainSgst = sgstItc - sgst_sgst;

    // IGST ITC → IGST liability first
    const igst_igst = Math.min(igstItc, igstLiab);
    let remainIgstLiab = igstLiab - igst_igst;

    // Remaining CGST / SGST ITC → remaining IGST liability (cross-head)
    const igst_cgst = Math.min(remainCgst, remainIgstLiab);
    remainIgstLiab -= igst_cgst;
    const igst_sgst = Math.min(remainSgst, remainIgstLiab);

    const r = (n: number) => (n > 0 ? String(parseFloat(n.toFixed(2))) : '');
    return {
        igst_igst: r(igst_igst),
        igst_cgst: r(igst_cgst),
        igst_sgst: r(igst_sgst),
        cgst_cgst: r(cgst_cgst),
        sgst_sgst: r(sgst_sgst),
        cess_cess: r(cess_cess),
    };
};

// Watches Formik changes and syncs back to hook state
const FormWatcher = ({ onUpdate }: { onUpdate: (v: any) => void }) => {
    const { values } = useFormikContext<any>();
    useEffect(() => {
        onUpdate(values);
    }, [values, onUpdate]);
    return null;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Gstr3bFilingPage = () => {
    const navigate = useNavigate();
    const { activeSetup, selectedFinancialYear } = useAppSelector(state => state.reducer.taxMore);
    const { setups } = useGstSetup();
    const gstin = activeSetup?.gstin ?? setups[0]?.gstin ?? '';
    const fy =
        selectedFinancialYear ??
        activeSetup?.financialYear ??
        setups[0]?.financialYear ??
        '2024-25';

    const [step, setStep] = useState<StepId>(1);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [selectedFY, setSelectedFY] = useState(fy);
    const [selectedMonthNum, setSelectedMonthNum] = useState(new Date().getMonth() + 1);
    const [nilReturn, setNilReturn] = useState(false);
    const [fetchSubState, setFetchSubState] = useState<FetchSubState>('idle');
    const [saveSubState, setSaveSubState] = useState<SaveSubState>('idle');
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [otpState, setOtpState] = useState<OtpSubState>('idle');
    const [pan, setPan] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const formikRef = useRef<FormikProps<any>>(null);
    const routingFormikRef = useRef<FormikProps<any>>(null);
    const filingFormDataRef = useRef<any>(null);

    useEffect(() => {
        if (resendTimer <= 0) return undefined;
        const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [resendTimer]);

    const {
        months: gstr3bMonths,
        isLoadingMonths,
        fetchMonths,
        filing,
        isFetchingDetails,
        detailsError,
        isSaving,
        isValidating,
        isFetchingLedgers,
        ledgers,
        isOffsetting,
        isFetchingAutoLiability,
        isFiling,
        isDownloading,
        ackNum,
        filedAt,
        fetchDetails,
        loadFilingFromDb,
        saveToPortal,
        validate,
        fetchLedgers,
        submitOffset,
        fetchAutoLiability,
        generateEvcOtp,
        fileReturn,
        updateFormData,
        downloadPdf,
    } = useGstr3b(gstin, selectedFY, selectedMonthNum);

    useEffect(() => {
        loadFilingFromDb();
    }, [loadFilingFromDb]);

    const [routingValues, setRoutingValues] = useState({
        igst_igst: '',
        igst_cgst: '',
        igst_sgst: '',
        cgst_cgst: '',
        sgst_sgst: '',
        cess_cess: '',
    });

    // Keep a ref to filing.formData so the FormWatcher callback stays stable
    // (avoids a re-render loop when enableReinitialize + updateFormData interact)
    filingFormDataRef.current = filing?.formData ?? null;
    const handleFormSync = useCallback(
        (values: any) => {
            if (!filingFormDataRef.current) return;
            updateFormData(fromFormikValues(values, filingFormDataRef.current));
        },
        [updateFormData]
    );

    const complete = (s: StepId) => setCompletedSteps(prev => new Set([...prev, s]));
    const goTo = (s: StepId) => setStep(s);
    const next = (current: StepId) => {
        complete(current);
        goTo((current + 1) as StepId);
    };

    const fyStart = parseInt(selectedFY.split('-')[0], 10);
    const calYear = selectedMonthNum >= 4 ? fyStart : fyStart + 1;
    const selectedMonthLabel = `${MONTH_LABELS_SHORT[selectedMonthNum - 1]} ${calYear}-${selectedFY.split('-')[1]}`;

    const handleOtpChange = useCallback(
        (idx: number, val: string) => {
            if (!/^\d?$/.test(val)) return;
            const updatedOtp = [...otp];
            updatedOtp[idx] = val;
            setOtp(updatedOtp);
            if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
        },
        [otp]
    );

    const monthStyle = (status: string, isSelected: boolean) => {
        if (isSelected)
            return {
                bg: '#ff4f4f',
                border: '#ff4f4f',
                labelColor: '#fff',
                yearColor: '#ffe4e4',
                statusColor: '#fff',
            };
        if (status === 'filed')
            return {
                bg: '#f0fdf4',
                border: '#bbf7d0',
                labelColor: '#16a34a',
                yearColor: '#166534',
                statusColor: '#22c55e',
            };
        return {
            bg: '#fffbeb',
            border: '#fde68a',
            labelColor: '#92400e',
            yearColor: '#78350f',
            statusColor: '#f59e0b',
        };
    };

    const isGstr3bFiled = filing?.status === 'filed';

    const handleFetchNow = useCallback(async () => {
        setFetchSubState('fetching');
        const ok = await fetchDetails();
        setFetchSubState(ok ? 'loaded' : 'idle');
    }, [fetchDetails]);

    const handleSaveReturn = useCallback(async () => {
        // Sync Formik form values → hook state before saving
        if (formikRef.current?.values && filing?.formData) {
            const updatedFd = fromFormikValues(formikRef.current.values, filing.formData);
            updateFormData(updatedFd);
        }
        setSaveSubState('saving');
        const ok = await saveToPortal();
        if (ok) {
            const ok2 = await validate();
            setSaveSubState(ok2 ? 'saved' : 'idle');
        } else {
            setSaveSubState('idle');
        }
    }, [saveToPortal, validate, filing, updateFormData]);

    const handleFetchLedgers = useCallback(async () => {
        await fetchLedgers();
    }, [fetchLedgers]);

    // Auto-fetch ledgers when entering step 5
    useEffect(() => {
        if (step === 5) handleFetchLedgers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Auto-fetch auto-liability when entering step 6
    useEffect(() => {
        if (step === 6) {
            fetchAutoLiability().then(autoLiability => {
                const vals = computeRoutingFromAutoLiability(autoLiability);
                routingFormikRef.current?.setValues(vals);
                setRoutingValues(vals);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    return (
        <Flex vertical gap={0} style={{ minHeight: '100vh' }}>
            {/* Period bar */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                gap={8}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-4 sm:px-6 py-[14px] mb-4"
            >
                <Flex gap={8} align="center" wrap="wrap">
                    <CalendarOutlined style={{ fontSize: 16, color: '#475569' }} />
                    <Typography.Text
                        className="text-xs font-medium whitespace-nowrap"
                        style={{ color: '#475569' }}
                    >
                        Period
                    </Typography.Text>
                    <span
                        className="text-xs font-medium px-3 py-1 rounded-lg border border-[#cbd5e1] whitespace-nowrap"
                        style={{ color: '#475569' }}
                    >
                        FY {selectedFY}
                    </span>
                    <span
                        className="text-xs font-medium px-3 py-1 rounded-lg border border-[#cbd5e1] whitespace-nowrap"
                        style={{ color: '#475569' }}
                    >
                        {selectedMonthLabel}
                    </span>
                </Flex>
                <Typography.Text
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: '#475569' }}
                >
                    Showing data for {selectedMonthLabel}
                </Typography.Text>
            </Flex>

            {/* Step banner */}
            {isGstr3bFiled ? (
                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    gap={8}
                    className="border border-[#81cf92] rounded-[14px] px-4 sm:px-6 py-3 mb-4"
                    style={{ backgroundColor: '#ecfdf5' }}
                >
                    <Flex gap={6} align="center" wrap="wrap">
                        <CalendarOutlined style={{ fontSize: 14, color: '#43b75d' }} />
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#43b75d' }}
                        >
                            Step 5 of 6 — File GSTR-3B
                        </Typography.Text>
                        <Typography.Text className="text-[11px]" style={{ color: '#43b75d' }}>
                            Completed ✓
                        </Typography.Text>
                    </Flex>
                    <button
                        type="button"
                        className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                        onClick={() =>
                            navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstLedger}`)
                        }
                    >
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#475569' }}
                        >
                            Next: Ledger
                        </Typography.Text>
                        <ArrowRightOutlined style={{ fontSize: 11, color: '#475569' }} />
                    </button>
                </Flex>
            ) : (
                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    gap={8}
                    className="border border-[#e2e8f0] rounded-[14px] px-4 sm:px-6 py-3 mb-4"
                    style={{ backgroundColor: '#f8fafc' }}
                >
                    <Flex gap={6} align="center">
                        <InfoCircleOutlined style={{ fontSize: 14, color: '#94a3b8' }} />
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#64748b' }}
                        >
                            Step 5 of 6 — File GSTR-3B
                        </Typography.Text>
                    </Flex>
                    <Typography.Text
                        className="text-xs hidden sm:block"
                        style={{ color: '#94a3b8' }}
                    >
                        Complete the previous step first
                    </Typography.Text>
                </Flex>
            )}

            {/* Main layout */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Sidebar steps */}
                <div className="w-full sm:w-[200px] sm:flex-shrink-0 bg-white border border-[#e2e8f0] rounded-[14px] py-3 px-3">
                    <div className="flex sm:flex-col overflow-x-auto gap-1 sm:gap-0">
                        {STEPS.map(s => {
                            const isDone = completedSteps.has(s.id);
                            const isActive = step === s.id;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    className="flex-shrink-0 sm:w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors"
                                    style={{
                                        backgroundColor: isActive ? '#fef2f2' : 'transparent',
                                    }}
                                    onClick={() => setStep(s.id as StepId)}
                                >
                                    {isDone ? (
                                        <CheckCircleFilled
                                            style={{
                                                color: '#43b75d',
                                                fontSize: 20,
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{
                                                backgroundColor: isActive ? '#ff4f4f' : '#f1f5f9',
                                                color: isActive ? '#fff' : '#64748b',
                                            }}
                                        >
                                            {s.id}
                                        </span>
                                    )}
                                    <Typography.Text
                                        className="text-sm"
                                        style={{
                                            color: (() => {
                                                if (isActive) return '#ff4f4f';
                                                if (isDone) return '#1e293b';
                                                return '#64748b';
                                            })(),
                                            fontWeight: isActive ? 500 : 400,
                                        }}
                                    >
                                        {s.label}
                                    </Typography.Text>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 min-w-0 w-full">
                    {/* ── Step 1: Select Period ── */}
                    {step === 1 && (
                        <Flex vertical gap={16}>
                            <div>
                                <Typography.Text
                                    className="font-semibold block"
                                    style={{ fontSize: 20, color: '#1e293b' }}
                                >
                                    Select Return Period
                                </Typography.Text>
                                <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                                    Choose the FY and month, then declare if this is a Nil return.
                                </Typography.Text>
                            </div>

                            {/* FY selector */}
                            <div>
                                <Typography.Text
                                    className="text-sm font-medium block mb-3"
                                    style={{ color: '#475569' }}
                                >
                                    Financial Year
                                </Typography.Text>
                                <Flex gap={8}>
                                    {FINANCIAL_YEARS.map(fyOpt => (
                                        <button
                                            key={fyOpt}
                                            type="button"
                                            className="px-5 py-2 rounded-lg border text-sm font-medium transition-colors"
                                            style={{
                                                backgroundColor:
                                                    selectedFY === fyOpt ? '#ff4f4f' : 'white',
                                                borderColor:
                                                    selectedFY === fyOpt ? '#ff4f4f' : '#e2e8f0',
                                                color: selectedFY === fyOpt ? '#fff' : '#475569',
                                            }}
                                            onClick={() => setSelectedFY(fyOpt)}
                                        >
                                            {fyOpt}
                                        </button>
                                    ))}
                                </Flex>
                            </div>

                            {/* Month grid */}
                            <div>
                                <Typography.Text
                                    className="text-sm font-medium block mb-3"
                                    style={{ color: '#475569' }}
                                >
                                    Month
                                </Typography.Text>
                                {isLoadingMonths ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {FY_MONTH_ORDER.map(mNum => (
                                            <div
                                                key={mNum}
                                                className="rounded-lg border border-[#e2e8f0] px-4 py-4 animate-pulse"
                                                style={{ backgroundColor: '#f1f5f9' }}
                                            >
                                                <div
                                                    className="h-4 rounded mb-2"
                                                    style={{
                                                        backgroundColor: '#e2e8f0',
                                                        width: '60%',
                                                    }}
                                                />
                                                <div
                                                    className="h-3 rounded mb-1"
                                                    style={{
                                                        backgroundColor: '#e2e8f0',
                                                        width: '40%',
                                                    }}
                                                />
                                                <div
                                                    className="h-3 rounded"
                                                    style={{
                                                        backgroundColor: '#e2e8f0',
                                                        width: '50%',
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {FY_MONTH_ORDER.map(mNum => {
                                            const fyStartYear = parseInt(
                                                selectedFY.split('-')[0],
                                                10
                                            );
                                            const mCalYear =
                                                mNum >= 4 ? fyStartYear : fyStartYear + 1;
                                            const gstr1Month = gstr3bMonths.find(
                                                m => m.month === mNum
                                            );
                                            const status = gstr1Month?.status ?? 'not_started';
                                            const isSelected = mNum === selectedMonthNum;
                                            const s = monthStyle(status, isSelected);
                                            return (
                                                <button
                                                    key={mNum}
                                                    type="button"
                                                    className="rounded-lg px-4 py-4 text-left border transition-colors"
                                                    style={{
                                                        backgroundColor: s.bg,
                                                        borderColor: s.border,
                                                    }}
                                                    onClick={() => setSelectedMonthNum(mNum)}
                                                >
                                                    <Typography.Text
                                                        className="text-sm font-bold block"
                                                        style={{ color: s.labelColor }}
                                                    >
                                                        {MONTH_LABELS[mNum - 1]}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-xs block"
                                                        style={{ color: s.yearColor }}
                                                    >
                                                        {mCalYear}
                                                    </Typography.Text>
                                                    {isSelected && (
                                                        <Typography.Text
                                                            className="text-xs block font-medium"
                                                            style={{ color: '#fff' }}
                                                        >
                                                            Selected
                                                        </Typography.Text>
                                                    )}
                                                    {!isSelected && (
                                                        <Typography.Text
                                                            className="text-xs block"
                                                            style={{ color: s.statusColor }}
                                                        >
                                                            {status === 'filed'
                                                                ? 'Filed'
                                                                : 'Pending'}
                                                        </Typography.Text>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Selected period info */}
                            <div
                                className="border border-[#e2e8f0] rounded-[14px] overflow-hidden flex flex-col gap-[18px] p-5"
                                style={{ backgroundColor: '#f8fafc' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: '#fef2f2' }}
                                    >
                                        <CalendarOutlined
                                            style={{
                                                fontSize: 18,
                                                color: nilReturn ? '#ff4f4f' : '#ff4f4f',
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Typography.Text
                                            className="font-semibold block"
                                            style={{ color: '#1e293b' }}
                                        >
                                            {selectedMonthLabel}
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-xs"
                                            style={{ color: '#64748b' }}
                                        >
                                            Due: 20th of next month
                                        </Typography.Text>
                                    </div>
                                </div>
                                <div
                                    className="flex items-center gap-3 px-4 py-3 rounded-[14px] border border-[#fcd34d]"
                                    style={{ backgroundColor: '#fffbeb' }}
                                >
                                    <Switch
                                        checked={nilReturn}
                                        onChange={setNilReturn}
                                        style={{
                                            backgroundColor: nilReturn ? '#ff4f4f' : '#d1d5db',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div>
                                        <Typography.Text
                                            className="font-medium block"
                                            style={{ color: '#f59e0b' }}
                                        >
                                            Nil Return
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-xs"
                                            style={{ color: '#f59e0b', opacity: 0.7 }}
                                        >
                                            No outward/inward supplies, no liability, no ITC. Skip
                                            form fill.
                                        </Typography.Text>
                                    </div>
                                </div>
                            </div>

                            {isGstr3bFiled && (
                                <div
                                    className="flex items-start gap-3 px-5 py-4 rounded-[14px] border border-[#bbf7d0]"
                                    style={{ backgroundColor: '#f0fdf4' }}
                                >
                                    <CheckCircleFilled
                                        style={{ color: '#22c55e', fontSize: 20, marginTop: 2 }}
                                    />
                                    <div>
                                        <Typography.Text
                                            className="font-semibold block"
                                            style={{ color: '#15803d' }}
                                        >
                                            Already filed for {selectedMonthLabel}
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: '#166534' }}
                                        >
                                            {[
                                                filing?.ackNum && `ARN: ${filing.ackNum}`,
                                                filing?.filedAt && `Filed: ${filing.filedAt}`,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </Typography.Text>
                                    </div>
                                </div>
                            )}

                            <Flex justify="flex-end">
                                <NavBtn
                                    primary
                                    disabled={isGstr3bFiled}
                                    onClick={() => {
                                        if (nilReturn) {
                                            complete(1);
                                            complete(2);
                                            complete(3);
                                            complete(4);
                                            complete(5);
                                            complete(6);
                                            goTo(7);
                                        } else next(1);
                                    }}
                                >
                                    {nilReturn ? 'Skip to EVC & File' : 'Fetch Portal Data'}{' '}
                                    <ArrowRightOutlined />
                                </NavBtn>
                            </Flex>
                        </Flex>
                    )}

                    {/* ── Step 2: Fetch Portal Data ── */}
                    {step === 2 && (
                        <Flex vertical gap={16}>
                            <div>
                                <Typography.Text
                                    className="font-semibold block"
                                    style={{ fontSize: 20, color: '#1e293b' }}
                                >
                                    Fetch Portal Data — {selectedMonthLabel}
                                </Typography.Text>
                                <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                                    Pull GSTR-3B details and auto-liability from GST portal API.
                                </Typography.Text>
                            </div>

                            <SectionCard>
                                {fetchSubState === 'idle' && !detailsError && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <ReloadOutlined
                                            style={{ fontSize: 36, color: '#94a3b8' }}
                                        />
                                        <div className="text-center">
                                            <Typography.Text
                                                className="font-semibold block"
                                                style={{ fontSize: 16, color: '#1e293b' }}
                                            >
                                                {filing
                                                    ? 'Re-fetch portal data'
                                                    : 'Ready to fetch portal data'}
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#64748b' }}
                                            >
                                                Will call 2 API endpoints to retrieve filed data and
                                                auto-calculated liability.
                                            </Typography.Text>
                                        </div>
                                        <Button
                                            type="primary"
                                            danger
                                            style={{ height: 40 }}
                                            loading={isFetchingDetails}
                                            onClick={handleFetchNow}
                                        >
                                            {filing ? 'Re-fetch Now' : 'Fetch Now'}
                                        </Button>
                                    </div>
                                )}

                                {detailsError && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <div
                                            className="w-14 h-14 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: '#fef2f2' }}
                                        >
                                            <ReloadOutlined
                                                style={{ color: '#ff4f4f', fontSize: 22 }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <Typography.Text
                                                className="font-semibold block mb-1"
                                                style={{ fontSize: 16, color: '#1e293b' }}
                                            >
                                                {detailsError.includes('Connect')
                                                    ? 'GST Portal Not Connected'
                                                    : 'Unable to Fetch Portal Data'}
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#64748b' }}
                                            >
                                                {detailsError}
                                            </Typography.Text>
                                        </div>
                                        <Flex gap={10}>
                                            {detailsError.includes('Connect') && (
                                                <Button
                                                    type="primary"
                                                    danger
                                                    style={{ height: 40 }}
                                                    onClick={() => window.history.back()}
                                                >
                                                    Connect GST Portal
                                                </Button>
                                            )}
                                            <Button
                                                style={{ height: 40 }}
                                                loading={isFetchingDetails}
                                                onClick={handleFetchNow}
                                            >
                                                Retry
                                            </Button>
                                        </Flex>
                                    </div>
                                )}

                                {fetchSubState === 'fetching' && (
                                    <div className="px-6 py-6 flex flex-col gap-3">
                                        {[
                                            'Fetching GSTR-3B data',
                                            'Fetching auto-liability calc',
                                            'Portal data loaded',
                                        ].map((label, i) => (
                                            <Flex key={label} gap={10} align="center">
                                                {!isFetchingDetails && i === 0 ? (
                                                    <CheckCircleFilled
                                                        style={{ color: '#43b75d', fontSize: 16 }}
                                                    />
                                                ) : (
                                                    <LoadingOutlined
                                                        spin
                                                        style={{ color: '#ff4f4f', fontSize: 16 }}
                                                    />
                                                )}
                                                <Typography.Text
                                                    className="text-sm"
                                                    style={{ color: '#94a3b8' }}
                                                >
                                                    {label}
                                                </Typography.Text>
                                            </Flex>
                                        ))}
                                    </div>
                                )}

                                {fetchSubState === 'loaded' && filing && (
                                    <div className="px-6 py-5 flex flex-col gap-5">
                                        {/* Info row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                {
                                                    label: 'GSTR-1 Filed On',
                                                    value:
                                                        (filing.autoLiability as any)?.r1fildt ??
                                                        '—',
                                                },
                                                {
                                                    label: 'GSTR-2B Generated',
                                                    value:
                                                        (filing.autoLiability as any)?.r3bgendt ??
                                                        '—',
                                                },
                                                {
                                                    label: 'GSTIN',
                                                    value: filing.formData?.gstin ?? gstin,
                                                },
                                            ].map(({ label, value }) => (
                                                <div
                                                    key={label}
                                                    className="border border-[#e2e8f0] rounded-lg px-4 py-3"
                                                >
                                                    <Typography.Text
                                                        className="text-xs block mb-1"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm font-semibold"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        {value}
                                                    </Typography.Text>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Outward Supply Summary */}
                                        <div>
                                            <Typography.Text
                                                className="font-semibold block mb-2"
                                                style={{ color: '#1e293b' }}
                                            >
                                                Outward Supply Summary{' '}
                                                <span className="text-xs font-normal text-[#94a3b8]">
                                                    (auto-populated)
                                                </span>
                                            </Typography.Text>
                                            <div className="border border-[#e2e8f0] rounded-lg overflow-x-auto">
                                                <TableHeader
                                                    cols={[
                                                        'Section',
                                                        'Taxable Value',
                                                        'IGST (₹)',
                                                        'CGST+SGST',
                                                    ]}
                                                />
                                                {[
                                                    [
                                                        '3.1(a) Taxable',
                                                        filing.formData?.sup_details?.osup_det,
                                                    ],
                                                    [
                                                        '3.1(b) Zero-Rated',
                                                        filing.formData?.sup_details?.osup_zero,
                                                    ],
                                                    [
                                                        '3.1(c) Nil/Exempt',
                                                        filing.formData?.sup_details?.osup_nil_exmp,
                                                    ],
                                                    [
                                                        '3.1(d) Rev. Charge',
                                                        filing.formData?.sup_details?.isup_rev,
                                                    ],
                                                    [
                                                        '3.1(e) Non-GST',
                                                        filing.formData?.sup_details?.osup_nongst,
                                                    ],
                                                ].map(([label, sec]) => (
                                                    <TableRow
                                                        key={label as string}
                                                        cells={[
                                                            label as string,
                                                            fmt((sec as any)?.txval ?? 0),
                                                            fmt((sec as any)?.iamt ?? 0),
                                                            fmt(
                                                                ((sec as any)?.camt ?? 0) +
                                                                    ((sec as any)?.samt ?? 0)
                                                            ),
                                                        ]}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* ITC Available */}
                                        <div>
                                            <Typography.Text
                                                className="font-semibold block mb-2"
                                                style={{ color: '#1e293b' }}
                                            >
                                                ITC Available — Section 4(A)
                                            </Typography.Text>
                                            <div className="border border-[#e2e8f0] rounded-lg overflow-x-auto">
                                                {(() => {
                                                    const avl =
                                                        filing.formData?.itc_elg?.itc_avl ?? [];
                                                    const net = filing.formData?.itc_elg?.itc_net;
                                                    const isrc = avl.find(
                                                        (e: any) => e.ty === 'ISRC'
                                                    );
                                                    const oth = avl.find(
                                                        (e: any) => e.ty === 'OTH'
                                                    );
                                                    return [
                                                        {
                                                            label: 'Inward Supplies — Reverse Charge',
                                                            vals: [
                                                                `CGST ${fmt((isrc as any)?.camt ?? 0)}`,
                                                                `SGST ${fmt((isrc as any)?.samt ?? 0)}`,
                                                            ],
                                                            highlight: false,
                                                        },
                                                        {
                                                            label: 'All Other ITC',
                                                            vals: [
                                                                `IGST ${fmt((oth as any)?.iamt ?? 0)}`,
                                                                `CGST ${fmt((oth as any)?.camt ?? 0)}`,
                                                                `SGST ${fmt((oth as any)?.samt ?? 0)}`,
                                                            ],
                                                            highlight: false,
                                                        },
                                                        {
                                                            label: 'Net ITC',
                                                            vals: [
                                                                `IGST ${fmt((net as any)?.iamt ?? 0)}`,
                                                                `CGST ${fmt((net as any)?.camt ?? 0)}`,
                                                                `SGST ${fmt((net as any)?.samt ?? 0)}`,
                                                            ],
                                                            highlight: true,
                                                        },
                                                    ].map(row => (
                                                        <div
                                                            key={row.label}
                                                            className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] last:border-0"
                                                            style={{
                                                                backgroundColor: row.highlight
                                                                    ? '#ecfdf5'
                                                                    : 'white',
                                                                minWidth: 420,
                                                            }}
                                                        >
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{
                                                                    color: row.highlight
                                                                        ? '#43b75d'
                                                                        : '#1e293b',
                                                                    fontWeight: row.highlight
                                                                        ? 600
                                                                        : 400,
                                                                }}
                                                            >
                                                                {row.label}
                                                            </Typography.Text>
                                                            <Flex
                                                                gap={16}
                                                                style={{
                                                                    flexShrink: 0,
                                                                    marginLeft: 12,
                                                                }}
                                                            >
                                                                {row.vals.map(v => (
                                                                    <Typography.Text
                                                                        key={v}
                                                                        className="text-sm font-medium whitespace-nowrap"
                                                                        style={{
                                                                            color: row.highlight
                                                                                ? '#43b75d'
                                                                                : '#475569',
                                                                        }}
                                                                    >
                                                                        {v}
                                                                    </Typography.Text>
                                                                ))}
                                                            </Flex>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </SectionCard>

                            <Flex justify="space-between">
                                <NavBtn onClick={() => goTo(1)}>
                                    <ArrowLeftOutlined /> Back
                                </NavBtn>
                                <NavBtn
                                    primary
                                    disabled={fetchSubState !== 'loaded' && !filing}
                                    onClick={() => next(2)}
                                >
                                    Fill Form <ArrowRightOutlined />
                                </NavBtn>
                            </Flex>
                        </Flex>
                    )}

                    {/* ── Step 3: Fill GSTR-3B Form ── */}
                    {step === 3 && (
                        <Flex vertical gap={16}>
                            <div>
                                <Typography.Text
                                    className="font-semibold block"
                                    style={{ fontSize: 20, color: '#1e293b' }}
                                >
                                    Fill GSTR-3B — {selectedMonthLabel}
                                </Typography.Text>
                                <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                                    Review and edit all sections. Values pre-filled from portal.
                                </Typography.Text>
                            </div>

                            <Formik
                                innerRef={formikRef}
                                initialValues={toFormikValues(filing?.formData)}
                                enableReinitialize
                                onSubmit={() => {}}
                            >
                                <FormikForm>
                                    <FormWatcher onUpdate={handleFormSync} />
                                    <Flex vertical gap={10}>
                                        {(() => {
                                            const supFields = (prefix: string) =>
                                                ['txval', 'iamt', 'camt', 'samt', 'csamt'].map(
                                                    f => (
                                                        <div key={f} className="px-1">
                                                            <TextInput
                                                                name={`${prefix}.${f}`}
                                                                type="number"
                                                                allowTwoDecimalsOnly
                                                                formItemClass="!mb-0"
                                                                placeholder="Enter"
                                                            />
                                                        </div>
                                                    )
                                                );
                                            const itcFields = (prefix: string) =>
                                                ['iamt', 'camt', 'samt'].map(f => (
                                                    <div key={f} className="px-1">
                                                        <TextInput
                                                            name={`${prefix}.${f}`}
                                                            type="number"
                                                            allowTwoDecimalsOnly
                                                            formItemClass="!mb-0"
                                                            placeholder="Enter"
                                                        />
                                                    </div>
                                                ));
                                            const supRow = (label: string, prefix: string) => (
                                                <div
                                                    className="grid px-4 py-2 border-b border-[#e2e8f0] last:border-0 items-center"
                                                    style={{
                                                        gridTemplateColumns:
                                                            '2fr 1fr 1fr 1fr 1fr 1fr',
                                                        minWidth: 560,
                                                    }}
                                                >
                                                    <Typography.Text
                                                        className="text-xs"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    {supFields(prefix)}
                                                </div>
                                            );
                                            const itcRow = (label: string, prefix: string) => (
                                                <div
                                                    className="grid px-4 py-2 border-b border-[#e2e8f0] last:border-0 items-center"
                                                    style={{
                                                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                                        minWidth: 420,
                                                    }}
                                                >
                                                    <Typography.Text
                                                        className="text-xs"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    {itcFields(prefix)}
                                                </div>
                                            );
                                            return [
                                                {
                                                    num: '3.1',
                                                    label: 'Details of Outward & Inward Supplies (Reverse Charge)',
                                                    content: (
                                                        <div className="overflow-x-auto">
                                                            <TableHeader
                                                                cols={[
                                                                    'Section / Supply Type',
                                                                    'Taxable Value (₹)',
                                                                    'IGST (₹)',
                                                                    'CGST (₹)',
                                                                    'SGST/UTGST (₹)',
                                                                    'Cess (₹)',
                                                                ]}
                                                                minWidth={560}
                                                            />
                                                            {supRow(
                                                                '(i) Outward Taxable Supplies (other than zero rated, nil & exempted)',
                                                                'sup_details.osup_det'
                                                            )}
                                                            {supRow(
                                                                '(ii) Outward Taxable Supplies — Zero Rated (Exports / SEZ)',
                                                                'sup_details.osup_zero'
                                                            )}
                                                            {supRow(
                                                                '(iii) Other Outward Supplies (Nil Rated, Exempted)',
                                                                'sup_details.osup_nil_exmp'
                                                            )}
                                                            {supRow(
                                                                '(iv) Inward Supplies Liable to Reverse Charge',
                                                                'sup_details.isup_rev'
                                                            )}
                                                            {supRow(
                                                                '(v) Non-GST Outward Supplies',
                                                                'sup_details.osup_nongst'
                                                            )}
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    num: '3.1.1',
                                                    label: 'Supplies Made Through E-Commerce Operators',
                                                    badge: 'If Applicable',
                                                    badgeGreen: (() => {
                                                        const ed =
                                                            formikRef.current?.values?.eco_dtls;
                                                        if (!ed) return false;
                                                        return [
                                                            'txval',
                                                            'iamt',
                                                            'camt',
                                                            'samt',
                                                            'csamt',
                                                        ].some(
                                                            f =>
                                                                (Number((ed.eco_sup as any)?.[f]) ||
                                                                    0) > 0 ||
                                                                (Number(
                                                                    (ed.eco_reg_sup as any)?.[f]
                                                                ) || 0) > 0
                                                        );
                                                    })(),
                                                    content: (
                                                        <div className="overflow-x-auto">
                                                            <TableHeader
                                                                cols={[
                                                                    'Section / Supply Type',
                                                                    'Taxable Value (₹)',
                                                                    'IGST (₹)',
                                                                    'CGST (₹)',
                                                                    'SGST/UTGST (₹)',
                                                                    'Cess (₹)',
                                                                ]}
                                                                minWidth={560}
                                                            />
                                                            {supRow(
                                                                'Net Taxable Supplies via E-Commerce (eco_sup)',
                                                                'eco_dtls.eco_sup'
                                                            )}
                                                            {supRow(
                                                                'Taxable Value — Registered Suppliers (eco_reg_sup)',
                                                                'eco_dtls.eco_reg_sup'
                                                            )}
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    num: '3.2',
                                                    label: 'Inter-State Supplies to Unregistered / Composition / UIN',
                                                    content: (
                                                        <div className="overflow-x-auto">
                                                            <TableHeader
                                                                cols={[
                                                                    'Type',
                                                                    'Place of Supply (State Code)',
                                                                    'Taxable Value (₹)',
                                                                    'IGST Amount (₹)',
                                                                ]}
                                                                minWidth={520}
                                                            />
                                                            {[
                                                                {
                                                                    label: 'Unregistered Persons',
                                                                    prefix: 'inter_sup.unreg_details[0]',
                                                                },
                                                                {
                                                                    label: 'Composition Taxable Persons',
                                                                    prefix: 'inter_sup.comp_details[0]',
                                                                },
                                                            ].map(({ label, prefix }) => (
                                                                <div
                                                                    key={label}
                                                                    className="grid px-4 py-2 border-b border-[#e2e8f0] last:border-0 items-center"
                                                                    style={{
                                                                        gridTemplateColumns:
                                                                            '2fr 1fr 1fr 1fr',
                                                                        minWidth: 520,
                                                                    }}
                                                                >
                                                                    <Typography.Text
                                                                        className="text-xs"
                                                                        style={{ color: '#475569' }}
                                                                    >
                                                                        {label}
                                                                    </Typography.Text>
                                                                    <div className="px-1">
                                                                        <TextInput
                                                                            name={`${prefix}.pos`}
                                                                            type="text"
                                                                            formItemClass="!mb-0"
                                                                            placeholder="Enter"
                                                                        />
                                                                    </div>
                                                                    <div className="px-1">
                                                                        <TextInput
                                                                            name={`${prefix}.txval`}
                                                                            type="number"
                                                                            allowTwoDecimalsOnly
                                                                            formItemClass="!mb-0"
                                                                            placeholder="Enter"
                                                                        />
                                                                    </div>
                                                                    <div className="px-1">
                                                                        <TextInput
                                                                            name={`${prefix}.iamt`}
                                                                            type="number"
                                                                            allowTwoDecimalsOnly
                                                                            formItemClass="!mb-0"
                                                                            placeholder="Enter"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    num: '4',
                                                    label: 'Eligible ITC (Input Tax Credit)',
                                                    content: (
                                                        <div className="flex flex-col gap-4 px-0 py-2">
                                                            <div>
                                                                <Typography.Text
                                                                    className="text-xs font-semibold block px-4 mb-1"
                                                                    style={{ color: '#475569' }}
                                                                >
                                                                    4(A) ITC AVAILABLE — (IMPG /
                                                                    IMPS / ISRC / ISD / OTH)
                                                                </Typography.Text>
                                                                <div className="border-t border-[#e2e8f0] overflow-x-auto">
                                                                    <TableHeader
                                                                        cols={[
                                                                            'ITC Type',
                                                                            'IGST (₹)',
                                                                            'CGST (₹)',
                                                                            'SGST/UTGST (₹)',
                                                                        ]}
                                                                        minWidth={420}
                                                                    />
                                                                    {itcRow(
                                                                        'Import of Goods (IMPG)',
                                                                        'itc_elg.itc_avl.IMPG'
                                                                    )}
                                                                    {itcRow(
                                                                        'Import of Services (IMPS)',
                                                                        'itc_elg.itc_avl.IMPS'
                                                                    )}
                                                                    {itcRow(
                                                                        'Inward Supplies — Reverse Charge (ISRC)',
                                                                        'itc_elg.itc_avl.ISRC'
                                                                    )}
                                                                    {itcRow(
                                                                        'Input Service Distributor (ISD)',
                                                                        'itc_elg.itc_avl.ISD'
                                                                    )}
                                                                    {itcRow(
                                                                        'All Other ITC (OTH)',
                                                                        'itc_elg.itc_avl.OTH'
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Typography.Text
                                                                    className="text-xs font-semibold block px-4 mb-1"
                                                                    style={{ color: '#475569' }}
                                                                >
                                                                    4(B) ITC REVERSED
                                                                </Typography.Text>
                                                                <div className="border-t border-[#e2e8f0] overflow-x-auto">
                                                                    <TableHeader
                                                                        cols={[
                                                                            'ITC Type',
                                                                            'IGST (₹)',
                                                                            'CGST (₹)',
                                                                            'SGST/UTGST (₹)',
                                                                        ]}
                                                                        minWidth={420}
                                                                    />
                                                                    {itcRow(
                                                                        'As per Rule 42 & 43 (Proportionate Reversal) (RUL)',
                                                                        'itc_elg.itc_rev.RUL'
                                                                    )}
                                                                    {itcRow(
                                                                        'Other Reversals (OTH)',
                                                                        'itc_elg.itc_rev.OTH'
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Typography.Text
                                                                    className="text-xs font-semibold block px-4 mb-1"
                                                                    style={{ color: '#475569' }}
                                                                >
                                                                    4(C) ITC INELIGIBLE
                                                                </Typography.Text>
                                                                <div className="border-t border-[#e2e8f0] overflow-x-auto">
                                                                    <TableHeader
                                                                        cols={[
                                                                            'ITC Type',
                                                                            'IGST (₹)',
                                                                            'CGST (₹)',
                                                                            'SGST/UTGST (₹)',
                                                                        ]}
                                                                        minWidth={420}
                                                                    />
                                                                    {itcRow(
                                                                        'Ineligible as per Rule 41 & 44 (RUL)',
                                                                        'itc_elg.itc_inelg.RUL'
                                                                    )}
                                                                    {itcRow(
                                                                        'Other Ineligible ITC (OTH)',
                                                                        'itc_elg.itc_inelg.OTH'
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div
                                                                className="rounded-xl border border-[#bbf7d0] overflow-hidden"
                                                                style={{
                                                                    backgroundColor: '#ecfdf5',
                                                                }}
                                                            >
                                                                <div className="px-4 py-3 border-b border-[#bbf7d0]">
                                                                    <Typography.Text
                                                                        className="text-sm font-semibold"
                                                                        style={{ color: '#15803d' }}
                                                                    >
                                                                        Net Eligible ITC = Available
                                                                        — Reversed
                                                                    </Typography.Text>
                                                                </div>
                                                                <div className="grid grid-cols-3">
                                                                    {[
                                                                        [
                                                                            'IGST',
                                                                            filing?.formData
                                                                                ?.itc_elg?.itc_net
                                                                                ?.iamt,
                                                                        ],
                                                                        [
                                                                            'CGST',
                                                                            filing?.formData
                                                                                ?.itc_elg?.itc_net
                                                                                ?.camt,
                                                                        ],
                                                                        [
                                                                            'SGST/UTGST',
                                                                            filing?.formData
                                                                                ?.itc_elg?.itc_net
                                                                                ?.samt,
                                                                        ],
                                                                    ].map(([label, val], i) => (
                                                                        <div
                                                                            key={label as string}
                                                                            className={`px-4 py-3 ${i < 2 ? 'border-r border-[#bbf7d0]' : ''}`}
                                                                        >
                                                                            <Typography.Text
                                                                                className="text-xs block mb-1"
                                                                                style={{
                                                                                    color: '#4ade80',
                                                                                }}
                                                                            >
                                                                                {label}
                                                                            </Typography.Text>
                                                                            <Typography.Text
                                                                                className="text-base font-bold block"
                                                                                style={{
                                                                                    color: '#15803d',
                                                                                }}
                                                                            >
                                                                                {fmt(
                                                                                    Number(val ?? 0)
                                                                                )}
                                                                            </Typography.Text>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    num: '5',
                                                    label: 'Values of Exempt, Nil Rated and Non-GST Inward Supplies',
                                                    content: (
                                                        <div className="overflow-x-auto">
                                                            <TableHeader
                                                                cols={[
                                                                    '',
                                                                    'Inter-State Supply Value (₹)',
                                                                    'Intra-State Supply Value (₹)',
                                                                ]}
                                                                minWidth={380}
                                                            />
                                                            {[
                                                                {
                                                                    label: 'Inward Supplies from Registered Suppliers (GST)',
                                                                    ty: 'GST',
                                                                },
                                                                {
                                                                    label: 'Inward Supplies from Unregistered / Non-GST Suppliers (Non-GST)',
                                                                    ty: 'NONGST',
                                                                },
                                                            ].map(({ label, ty }) => (
                                                                <div
                                                                    key={ty}
                                                                    className="grid px-4 py-2 border-b border-[#e2e8f0] last:border-0 items-center"
                                                                    style={{
                                                                        gridTemplateColumns:
                                                                            '2fr 1fr 1fr',
                                                                        minWidth: 380,
                                                                    }}
                                                                >
                                                                    <Typography.Text
                                                                        className="text-xs"
                                                                        style={{ color: '#475569' }}
                                                                    >
                                                                        {label}
                                                                    </Typography.Text>
                                                                    <div className="px-1">
                                                                        <TextInput
                                                                            name={`inward_sup.isup_details.${ty}.inter`}
                                                                            type="number"
                                                                            allowTwoDecimalsOnly
                                                                            formItemClass="!mb-0"
                                                                            placeholder="Enter"
                                                                        />
                                                                    </div>
                                                                    <div className="px-1">
                                                                        <TextInput
                                                                            name={`inward_sup.isup_details.${ty}.intra`}
                                                                            type="number"
                                                                            allowTwoDecimalsOnly
                                                                            formItemClass="!mb-0"
                                                                            placeholder="Enter"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    num: '5.1',
                                                    label: 'Interest & Late Fee',
                                                    content: (
                                                        <div className="px-4 py-4 flex flex-col gap-4">
                                                            <div>
                                                                <Typography.Text
                                                                    className="text-xs font-semibold block mb-2"
                                                                    style={{ color: '#475569' }}
                                                                >
                                                                    Interest Details
                                                                </Typography.Text>
                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                    {[
                                                                        {
                                                                            label: 'IGST Interest',
                                                                            field: 'iamt',
                                                                        },
                                                                        {
                                                                            label: 'CGST Interest',
                                                                            field: 'camt',
                                                                        },
                                                                        {
                                                                            label: 'SGST Interest',
                                                                            field: 'samt',
                                                                        },
                                                                        {
                                                                            label: 'Cess Interest',
                                                                            field: 'csamt',
                                                                        },
                                                                    ].map(({ label, field }) => (
                                                                        <div key={label}>
                                                                            <Typography.Text
                                                                                className="text-xs block mb-1"
                                                                                style={{
                                                                                    color: '#64748b',
                                                                                }}
                                                                            >
                                                                                {label}
                                                                            </Typography.Text>
                                                                            <TextInput
                                                                                name={`intr_ltfee.intr_details.${field}`}
                                                                                type="number"
                                                                                allowTwoDecimalsOnly
                                                                                formItemClass="!mb-0"
                                                                                placeholder="Enter"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Typography.Text
                                                                    className="text-xs font-semibold block mb-2"
                                                                    style={{ color: '#475569' }}
                                                                >
                                                                    Late Fee
                                                                </Typography.Text>
                                                                <div
                                                                    className="grid gap-3"
                                                                    style={{
                                                                        gridTemplateColumns:
                                                                            'repeat(2, 1fr)',
                                                                    }}
                                                                >
                                                                    {[
                                                                        {
                                                                            label: 'CGST Late Fee',
                                                                            field: 'camt',
                                                                        },
                                                                        {
                                                                            label: 'SGST Late Fee',
                                                                            field: 'samt',
                                                                        },
                                                                    ].map(({ label, field }) => (
                                                                        <div key={label}>
                                                                            <Typography.Text
                                                                                className="text-xs block mb-1"
                                                                                style={{
                                                                                    color: '#64748b',
                                                                                }}
                                                                            >
                                                                                {label}
                                                                            </Typography.Text>
                                                                            <TextInput
                                                                                name={`intr_ltfee.ltfee_details.${field}`}
                                                                                type="number"
                                                                                allowTwoDecimalsOnly
                                                                                formItemClass="!mb-0"
                                                                                placeholder="Enter"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div
                                                                    className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2"
                                                                    style={{
                                                                        background: '#fefce8',
                                                                        border: '1px solid #fde047',
                                                                    }}
                                                                >
                                                                    <InfoCircleOutlined
                                                                        style={{
                                                                            color: '#ca8a04',
                                                                            fontSize: 14,
                                                                            marginTop: 1,
                                                                        }}
                                                                    />
                                                                    <Typography.Text
                                                                        className="text-xs"
                                                                        style={{ color: '#92400e' }}
                                                                    >
                                                                        Late fee: ₹50/day
                                                                        (CGST+SGST) for regular
                                                                        ₹50/day for nil return, up
                                                                        to ₹10,000 max.
                                                                    </Typography.Text>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                },
                                            ]; // end of sections array
                                        })().map(section => (
                                            <AccordionRow
                                                key={section.num}
                                                num={section.num}
                                                label={section.label}
                                                badge={section.badge}
                                                badgeGreen={(section as any).badgeGreen}
                                                open={openSection === section.num}
                                                onToggle={() =>
                                                    setOpenSection(
                                                        openSection === section.num
                                                            ? null
                                                            : section.num
                                                    )
                                                }
                                            >
                                                {section.content}
                                            </AccordionRow>
                                        ))}
                                    </Flex>

                                    <Flex justify="space-between">
                                        <NavBtn onClick={() => goTo(2)}>
                                            <ArrowLeftOutlined /> Back
                                        </NavBtn>
                                        <NavBtn primary onClick={() => next(3)}>
                                            Save & Validate <ArrowRightOutlined />
                                        </NavBtn>
                                    </Flex>
                                </FormikForm>
                            </Formik>
                        </Flex>
                    )}

                    {/* ── Step 4: Save & Validate ── */}
                    {step === 4 && (
                        <Flex vertical gap={16}>
                            <Typography.Text
                                className="font-semibold block"
                                style={{ fontSize: 20, color: '#1e293b' }}
                            >
                                Save & Validate
                            </Typography.Text>

                            <SectionCard>
                                {saveSubState === 'idle' && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <SaveOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                                        <div className="text-center">
                                            <Typography.Text
                                                className="font-semibold block"
                                                style={{ fontSize: 16, color: '#1e293b' }}
                                            >
                                                Ready to save GSTR-3B to portal
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#64748b' }}
                                            >
                                                Uploads all sections as JSON to GST portal, then
                                                validates before proceeding.
                                            </Typography.Text>
                                        </div>
                                        <Button
                                            type="primary"
                                            danger
                                            style={{ height: 40 }}
                                            loading={isSaving || isValidating}
                                            onClick={handleSaveReturn}
                                        >
                                            Save Return
                                        </Button>
                                    </div>
                                )}
                                {saveSubState === 'saving' && (
                                    <div className="px-6 py-6 flex flex-col gap-3">
                                        {[
                                            { label: 'Uploading GSTR-3B JSON', active: isSaving },
                                            { label: 'Polling status...', active: isValidating },
                                            { label: 'Processing complete...', active: false },
                                            {
                                                label: 'Saved & validated — No errors',
                                                active: false,
                                            },
                                        ].map((item, i) => (
                                            <Flex key={item.label} gap={10} align="center">
                                                {(() => {
                                                    if (item.active)
                                                        return (
                                                            <LoadingOutlined
                                                                spin
                                                                style={{
                                                                    color: '#ff4f4f',
                                                                    fontSize: 16,
                                                                }}
                                                            />
                                                        );
                                                    if (i === 0)
                                                        return (
                                                            <CheckCircleFilled
                                                                style={{
                                                                    color: '#43b75d',
                                                                    fontSize: 16,
                                                                }}
                                                            />
                                                        );
                                                    return (
                                                        <LoadingOutlined
                                                            spin
                                                            style={{
                                                                color: '#94a3b8',
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                    );
                                                })()}
                                                <Typography.Text
                                                    className="text-sm"
                                                    style={{
                                                        color: item.active ? '#1e293b' : '#94a3b8',
                                                    }}
                                                >
                                                    {item.label}
                                                </Typography.Text>
                                            </Flex>
                                        ))}
                                    </div>
                                )}
                                {saveSubState === 'saved' && (
                                    <div className="px-6 py-6 flex flex-col gap-3">
                                        {[
                                            'Uploading GSTR-3B JSON',
                                            'Polling status...',
                                            'Processing complete...',
                                            'Saved & validated — No errors',
                                        ].map(label => (
                                            <Flex key={label} gap={10} align="center">
                                                <CheckCircleFilled
                                                    style={{ color: '#43b75d', fontSize: 16 }}
                                                />
                                                <Typography.Text
                                                    className="text-sm"
                                                    style={{ color: '#43b75d' }}
                                                >
                                                    {label}
                                                </Typography.Text>
                                            </Flex>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>

                            <Flex justify="space-between">
                                <NavBtn onClick={() => goTo(3)}>
                                    <ArrowLeftOutlined /> Back
                                </NavBtn>
                                <NavBtn
                                    primary
                                    disabled={saveSubState !== 'saved'}
                                    onClick={() => next(4)}
                                >
                                    Check Balances <ArrowRightOutlined />
                                </NavBtn>
                            </Flex>
                        </Flex>
                    )}

                    {/* ── Step 5: Ledger Balances ── */}
                    {step === 5 && (
                        <Flex vertical gap={16}>
                            <Typography.Text
                                className="font-semibold block"
                                style={{ fontSize: 20, color: '#1e293b' }}
                            >
                                Ledger Balances
                            </Typography.Text>

                            {isFetchingLedgers && (
                                <div className="flex items-center justify-center py-8">
                                    <LoadingOutlined
                                        spin
                                        style={{ color: '#ff4f4f', fontSize: 24 }}
                                    />
                                </div>
                            )}
                            {!isFetchingLedgers && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(['IGST', 'CGST', 'SGST', 'Cess'] as const).map(head => {
                                        // Cash ledger: data.cashLedger.data.{igst/cgst/sgst/cess}
                                        const cashData = (ledgers?.cashLedger as any)?.data ?? {};
                                        const cashKey = head.toLowerCase();
                                        const cash = cashData?.[cashKey] ?? {};

                                        // ITC ledger: data.itcLedger.data.itcLdgDtls.cl_bal.{igst/cgst/sgst/cess}TaxBal
                                        const itcClBal =
                                            (ledgers?.itcLedger as any)?.data?.itcLdgDtls?.cl_bal ??
                                            {};
                                        const itcAvail = Number(
                                            itcClBal?.[`${cashKey}TaxBal`] ?? 0
                                        );

                                        // Liability ledger: data.liabilityLedger.data.cl_bal.{igst/cgst/sgst/cess}bal.tx
                                        const liabClBal =
                                            (ledgers?.liabilityLedger as any)?.data?.cl_bal ?? {};
                                        const liabTx = Number(
                                            liabClBal?.[`${cashKey}bal`]?.tx ?? 0
                                        );
                                        const liability = liabTx > 0 ? liabTx : null;
                                        // cash.tax / cash.fee / cash.interest from cash ledger
                                        const cashTotal =
                                            Number(cash.tax ?? 0) +
                                            Number(cash.fee ?? 0) +
                                            Number(cash.interest ?? 0);
                                        const itcNet = itcAvail;
                                        const isShortfall =
                                            liability !== null && cashTotal + itcNet < liability;
                                        let statusLabel: string | null = null;
                                        if (liability !== null)
                                            statusLabel = isShortfall ? 'Shortfall' : 'Sufficient';
                                        const statusColor = isShortfall ? '#ef4444' : '#43b75d';
                                        let cardBg = '#f0fdf4';
                                        if (isShortfall) cardBg = '#fff5f5';
                                        else if (liability === null) cardBg = '#fff';
                                        let borderColor = '#bbf7d0';
                                        if (isShortfall) borderColor = '#fca5a5';
                                        else if (liability === null) borderColor = '#e2e8f0';
                                        return (
                                            <div
                                                key={head}
                                                className="border rounded-[14px] overflow-hidden"
                                                style={{ borderColor, backgroundColor: cardBg }}
                                            >
                                                <Flex
                                                    justify="space-between"
                                                    align="center"
                                                    className="px-5 py-4"
                                                >
                                                    <Typography.Text
                                                        className="font-semibold"
                                                        style={{ fontSize: 18, color: '#1e293b' }}
                                                    >
                                                        {head}
                                                    </Typography.Text>
                                                    {statusLabel && (
                                                        <span
                                                            className="text-xs font-semibold px-2 py-1 rounded-full"
                                                            style={{
                                                                backgroundColor: isShortfall
                                                                    ? '#fef2f2'
                                                                    : '#ecfdf5',
                                                                color: statusColor,
                                                            }}
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                    )}
                                                </Flex>
                                                {isShortfall && liability !== null && (
                                                    <div className="px-5 pb-2">
                                                        <Typography.Text
                                                            className="text-xs"
                                                            style={{ color: '#ef4444' }}
                                                        >
                                                            Shortfall:{' '}
                                                            {fmt(liability - cashTotal - itcNet)} —
                                                            top up cash ledger via challan
                                                        </Typography.Text>
                                                    </div>
                                                )}
                                                <div className="mx-4 mb-3 border border-[#e2e8f0] rounded-lg overflow-hidden bg-white">
                                                    <div className="px-4 py-2 border-b border-[#e2e8f0] bg-[#f8fafc]">
                                                        <Typography.Text
                                                            className="text-xs font-semibold"
                                                            style={{ color: '#475569' }}
                                                        >
                                                            Cash Ledger
                                                        </Typography.Text>
                                                    </div>
                                                    {[
                                                        ['Tax', fmt(Number(cash.tax ?? 0))],
                                                        ...(Number(cash.fee ?? 0) > 0
                                                            ? [['Fee', fmt(Number(cash.fee))]]
                                                            : []),
                                                        ...(Number(cash.interest ?? 0) > 0
                                                            ? [
                                                                  [
                                                                      'Interest',
                                                                      fmt(Number(cash.interest)),
                                                                  ],
                                                              ]
                                                            : []),
                                                        ['Total Cash', fmt(cashTotal)],
                                                    ].map(([label, val]) => (
                                                        <Flex
                                                            key={label}
                                                            justify="space-between"
                                                            className="px-4 py-2 border-b border-[#f1f5f9] last:border-0"
                                                        >
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{ color: '#475569' }}
                                                            >
                                                                {label}
                                                            </Typography.Text>
                                                            <Typography.Text
                                                                className="text-sm font-medium"
                                                                style={{ color: '#1e293b' }}
                                                            >
                                                                {val}
                                                            </Typography.Text>
                                                        </Flex>
                                                    ))}
                                                </div>
                                                <div className="mx-4 mb-3 border border-[#e2e8f0] rounded-lg overflow-hidden bg-white">
                                                    <div className="px-4 py-2 border-b border-[#e2e8f0] bg-[#f8fafc]">
                                                        <Typography.Text
                                                            className="text-xs font-semibold"
                                                            style={{ color: '#475569' }}
                                                        >
                                                            ITC Ledger
                                                        </Typography.Text>
                                                    </div>
                                                    {[
                                                        ['Available', fmt(itcAvail)],
                                                        ['Net Available', fmt(itcNet)],
                                                    ].map(([label, val]) => (
                                                        <Flex
                                                            key={label}
                                                            justify="space-between"
                                                            className="px-4 py-2 border-b border-[#f1f5f9] last:border-0"
                                                        >
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{ color: '#475569' }}
                                                            >
                                                                {label}
                                                            </Typography.Text>
                                                            <Typography.Text
                                                                className="text-sm font-medium"
                                                                style={{ color: '#1e293b' }}
                                                            >
                                                                {val}
                                                            </Typography.Text>
                                                        </Flex>
                                                    ))}
                                                </div>
                                                {liability !== null && (
                                                    <Flex
                                                        justify="space-between"
                                                        className="px-5 py-3"
                                                    >
                                                        <Typography.Text
                                                            className="font-semibold"
                                                            style={{ color: statusColor }}
                                                        >
                                                            Liability
                                                        </Typography.Text>
                                                        <Typography.Text
                                                            className="font-semibold"
                                                            style={{ color: statusColor }}
                                                        >
                                                            {fmt(liability)}
                                                        </Typography.Text>
                                                    </Flex>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                                <FileDoneOutlined style={{ color: '#475569' }} />
                                <Typography.Text className="text-xs" style={{ color: '#475569' }}>
                                    ITC cross-head rules: IGST credit → IGST then CGST then SGST.
                                    CGST credit → CGST and IGST only. SGST credit → SGST and IGST
                                    only. Cess → Cess only.
                                </Typography.Text>
                            </div>

                            <Flex justify="space-between">
                                <NavBtn onClick={() => goTo(4)}>
                                    <ArrowLeftOutlined /> Back
                                </NavBtn>
                                <NavBtn
                                    primary
                                    disabled={isFetchingLedgers}
                                    onClick={() => next(5)}
                                >
                                    Proceed to Offset <ArrowRightOutlined />
                                </NavBtn>
                            </Flex>
                        </Flex>
                    )}

                    {/* ── Step 6: Offset Liability ── */}
                    {step === 6 && (
                        <Flex vertical gap={16}>
                            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                                <Typography.Text
                                    className="font-semibold block"
                                    style={{ fontSize: 20, color: '#1e293b' }}
                                >
                                    Fill GSTR-3B — {selectedMonthLabel}
                                </Typography.Text>
                                <Button
                                    icon={<ThunderboltOutlined />}
                                    loading={isFetchingAutoLiability}
                                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f' }}
                                    onClick={async () => {
                                        const autoLiability = await fetchAutoLiability();
                                        const vals = computeRoutingFromAutoLiability(autoLiability);
                                        routingFormikRef.current?.setValues(vals);
                                        setRoutingValues(vals);
                                    }}
                                >
                                    Auto Optimize
                                </Button>
                            </Flex>

                            <AccordionRow
                                num="⇄"
                                label="ITC Cross-Head Routing"
                                open={openSection === 'routing'}
                                onToggle={() =>
                                    setOpenSection(openSection === 'routing' ? null : 'routing')
                                }
                            >
                                <Formik
                                    innerRef={routingFormikRef}
                                    initialValues={routingValues}
                                    onSubmit={() => {}}
                                >
                                    <FormikForm>
                                        <FormWatcher onUpdate={v => setRoutingValues(v)} />
                                        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {(
                                                [
                                                    [
                                                        'Pay IGST liability using IGST credit',
                                                        'igst_igst',
                                                    ],
                                                    [
                                                        'Pay IGST liability using CGST credit (cross-head)',
                                                        'igst_cgst',
                                                    ],
                                                    [
                                                        'Pay IGST liability using SGST credit (cross-head)',
                                                        'igst_sgst',
                                                    ],
                                                    [
                                                        'Pay CGST liability using CGST credit',
                                                        'cgst_cgst',
                                                    ],
                                                    [
                                                        'Pay SGST liability using SGST credit',
                                                        'sgst_sgst',
                                                    ],
                                                    [
                                                        'Pay Cess liability using Cess credit',
                                                        'cess_cess',
                                                    ],
                                                ] as [string, keyof typeof routingValues][]
                                            ).map(([label, key]) => (
                                                <div key={key}>
                                                    <Typography.Text
                                                        className="text-xs block mb-1"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    <TextInput
                                                        name={key}
                                                        type="number"
                                                        placeholder="Enter"
                                                        size="large"
                                                        allowTwoDecimalsOnly
                                                        inputMode="decimal"
                                                        formItemClass="!mb-0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </FormikForm>
                                </Formik>
                            </AccordionRow>

                            {(() => {
                                const fd = filing?.formData;
                                const osup = fd?.sup_details?.osup_det;
                                const isupRev = fd?.sup_details?.isup_rev;
                                const intr = fd?.intr_ltfee?.intr_details;
                                const ltfee = fd?.intr_ltfee?.ltfee_details;
                                const rv = routingValues;

                                const regularRows = [
                                    {
                                        head: 'IGST',
                                        liability:
                                            (Number(osup?.iamt) || 0) +
                                            (Number(intr?.iamt) || 0) +
                                            (Number(ltfee?.iamt) || 0),
                                        itc:
                                            (Number(rv.igst_igst) || 0) +
                                            (Number(rv.igst_cgst) || 0) +
                                            (Number(rv.igst_sgst) || 0),
                                    },
                                    {
                                        head: 'CGST',
                                        liability:
                                            (Number(osup?.camt) || 0) +
                                            (Number(intr?.camt) || 0) +
                                            (Number(ltfee?.camt) || 0),
                                        itc: Number(rv.cgst_cgst) || 0,
                                    },
                                    {
                                        head: 'SGST',
                                        liability:
                                            (Number(osup?.samt) || 0) +
                                            (Number(intr?.samt) || 0) +
                                            (Number(ltfee?.samt) || 0),
                                        itc: Number(rv.sgst_sgst) || 0,
                                    },
                                    {
                                        head: 'Cess',
                                        liability:
                                            (Number(osup?.csamt) || 0) +
                                            (Number(intr?.csamt) || 0) +
                                            (Number(ltfee?.csamt) || 0),
                                        itc: Number(rv.cess_cess) || 0,
                                    },
                                ].filter(r => r.liability > 0);

                                const rcLiab =
                                    (Number(isupRev?.iamt) || 0) +
                                    (Number(isupRev?.camt) || 0) +
                                    (Number(isupRev?.samt) || 0) +
                                    (Number(isupRev?.csamt) || 0);

                                const totalLiab =
                                    regularRows.reduce((s, r) => s + r.liability, 0) + rcLiab;
                                const netITC = Object.values(routingValues).reduce(
                                    (s, v) => s + (Number(v) || 0),
                                    0
                                );
                                const cashNeeded = Math.max(0, totalLiab - netITC);

                                return (
                                    <>
                                        <div>
                                            <Typography.Text
                                                className="font-semibold block mb-3"
                                                style={{ color: '#1e293b' }}
                                            >
                                                Other than Reverse Charge — nettaxpay + pdcash
                                            </Typography.Text>
                                            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                                                <TableHeader
                                                    cols={[
                                                        'Tax Head',
                                                        'Net Liability (₹)',
                                                        'ITC Utilised (₹)',
                                                        'Cash Payment (₹)',
                                                        'Status',
                                                    ]}
                                                />
                                                {regularRows.map((r, i) => {
                                                    const cash = Math.max(0, r.liability - r.itc);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="grid px-4 py-3 border-b border-[#e2e8f0] last:border-0"
                                                            style={{
                                                                gridTemplateColumns:
                                                                    '2fr 1fr 1fr 1fr 1fr',
                                                            }}
                                                        >
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{ color: '#1e293b' }}
                                                            >
                                                                {r.head}
                                                            </Typography.Text>
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{ color: '#475569' }}
                                                            >
                                                                {fmt(r.liability)}
                                                            </Typography.Text>
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{ color: '#475569' }}
                                                            >
                                                                {fmt(r.itc)}
                                                            </Typography.Text>
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{ color: '#475569' }}
                                                            >
                                                                {fmt(cash)}
                                                            </Typography.Text>
                                                            <Typography.Text
                                                                className="text-sm"
                                                                style={{
                                                                    color:
                                                                        cash === 0
                                                                            ? '#43b75d'
                                                                            : '#f59e0b',
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {cash === 0 ? 'Settled' : 'Pending'}
                                                            </Typography.Text>
                                                        </div>
                                                    );
                                                })}
                                                {regularRows.length === 0 && (
                                                    <div className="px-4 py-3">
                                                        <Typography.Text
                                                            className="text-sm"
                                                            style={{ color: '#94a3b8' }}
                                                        >
                                                            No liability data available
                                                        </Typography.Text>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Typography.Text
                                                className="font-semibold block mb-3"
                                                style={{ color: '#1e293b' }}
                                            >
                                                Reverse Charge &amp; Supplies u/s 9(5) — Cash Only
                                            </Typography.Text>
                                            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                                                <div
                                                    className="grid px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]"
                                                    style={{ gridTemplateColumns: '2fr 1fr 1fr' }}
                                                >
                                                    {[
                                                        'Tax Head',
                                                        'Net Liability (₹)',
                                                        'Cash Payment (₹)',
                                                    ].map(h => (
                                                        <Typography.Text
                                                            key={h}
                                                            className="text-xs font-semibold"
                                                            style={{ color: '#475569' }}
                                                        >
                                                            {h}
                                                        </Typography.Text>
                                                    ))}
                                                </div>
                                                {rcLiab > 0 && (
                                                    <div
                                                        className="grid px-4 py-3 border-b border-[#e2e8f0] last:border-0"
                                                        style={{
                                                            gridTemplateColumns: '2fr 1fr 1fr',
                                                        }}
                                                    >
                                                        <Typography.Text
                                                            className="text-sm"
                                                            style={{ color: '#1e293b' }}
                                                        >
                                                            Reverse Charge
                                                        </Typography.Text>
                                                        <Typography.Text
                                                            className="text-sm"
                                                            style={{ color: '#475569' }}
                                                        >
                                                            {fmt(rcLiab)}
                                                        </Typography.Text>
                                                        <Typography.Text
                                                            className="text-sm"
                                                            style={{ color: '#475569' }}
                                                        >
                                                            {fmt(rcLiab)}
                                                        </Typography.Text>
                                                    </div>
                                                )}
                                                {rcLiab === 0 && (
                                                    <div className="px-4 py-3">
                                                        <Typography.Text
                                                            className="text-sm"
                                                            style={{ color: '#94a3b8' }}
                                                        >
                                                            No reverse charge liability
                                                        </Typography.Text>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Summary bar */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#e2e8f0] rounded-[14px] overflow-hidden">
                                            {[
                                                { label: 'Total Liability', value: fmt(totalLiab) },
                                                { label: 'Total ITC Used', value: fmt(netITC) },
                                                {
                                                    label: 'Total Cash Used',
                                                    value: fmt(cashNeeded),
                                                },
                                            ].map(({ label, value }) => (
                                                <div
                                                    key={label}
                                                    className="flex flex-col items-center py-4 border-r border-[#e2e8f0] last:border-0"
                                                >
                                                    <Typography.Text
                                                        className="text-xs"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="font-semibold"
                                                        style={{ fontSize: 16, color: '#1e293b' }}
                                                    >
                                                        {value}
                                                    </Typography.Text>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}

                            <Flex justify="space-between">
                                <NavBtn onClick={() => goTo(5)}>
                                    <ArrowLeftOutlined /> Back
                                </NavBtn>
                                <NavBtn
                                    primary
                                    loading={isOffsetting}
                                    onClick={async () => {
                                        const liabitc =
                                            (filing?.autoLiability as any)?.liabitc ?? {};
                                        const ok = await submitOffset(liabitc);
                                        if (ok) next(6);
                                    }}
                                >
                                    Submit Offset <ArrowRightOutlined />
                                </NavBtn>
                            </Flex>
                        </Flex>
                    )}

                    {/* ── Step 7: EVC & File ── */}
                    {step === 7 && (
                        <Flex vertical gap={16}>
                            <Flex align="center" gap={10}>
                                <Typography.Text
                                    className="font-semibold block"
                                    style={{ fontSize: 20, color: '#1e293b' }}
                                >
                                    EVC &amp; File GSTR-3B
                                </Typography.Text>
                                {nilReturn && (
                                    <span
                                        className="text-xs font-semibold px-3 py-1 rounded-full"
                                        style={{ backgroundColor: '#fef2f2', color: '#ff4f4f' }}
                                    >
                                        Nil Return
                                    </span>
                                )}
                            </Flex>

                            {/* Filing summary */}
                            <SectionCard>
                                <div
                                    className="px-5 py-4 border-b border-[#e2e8f0]"
                                    style={{ backgroundColor: '#f8fafc' }}
                                >
                                    <Typography.Text
                                        className="font-semibold text-lg"
                                        style={{ color: '#1e293b' }}
                                    >
                                        Filing Summary
                                    </Typography.Text>
                                </div>
                                <div style={{ backgroundColor: '#f8fafc' }}>
                                    {nilReturn ? (
                                        <>
                                            {[
                                                {
                                                    label: 'Return',
                                                    value: 'GSTR-3B (Nil)',
                                                    valueColor: '#1e293b',
                                                },
                                                {
                                                    label: 'Period',
                                                    value: selectedMonthLabel,
                                                    valueColor: '#1e293b',
                                                },
                                                {
                                                    label: 'Total Liability',
                                                    value: '₹0.00',
                                                    valueColor: '#64748b',
                                                },
                                                {
                                                    label: 'ITC Utilised',
                                                    value: '₹0.00',
                                                    valueColor: '#64748b',
                                                },
                                                {
                                                    label: 'Cash Payment',
                                                    value: '₹0.00',
                                                    valueColor: '#64748b',
                                                },
                                            ].map(({ label, value, valueColor }) => (
                                                <Flex
                                                    key={label}
                                                    justify="space-between"
                                                    className="px-5 py-3 border-b border-[#f1f5f9] last:border-0"
                                                >
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm font-semibold"
                                                        style={{ color: valueColor }}
                                                    >
                                                        {value}
                                                    </Typography.Text>
                                                </Flex>
                                            ))}
                                            <div
                                                className="px-5 py-3 flex items-center gap-2"
                                                style={{ backgroundColor: '#fffbeb' }}
                                            >
                                                <InfoCircleOutlined
                                                    style={{ color: '#f59e0b', fontSize: 14 }}
                                                />
                                                <Typography.Text
                                                    className="text-xs"
                                                    style={{ color: '#92400e' }}
                                                >
                                                    No outward/inward supplies, no tax liability, no
                                                    ITC for this period.
                                                </Typography.Text>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {[
                                                {
                                                    label: 'Return',
                                                    value: 'GSTR-3B',
                                                    valueColor: '#1e293b',
                                                },
                                                {
                                                    label: 'Period',
                                                    value: selectedMonthLabel,
                                                    valueColor: '#1e293b',
                                                },
                                                {
                                                    label: 'Total Liability',
                                                    value: fmt(
                                                        (() => {
                                                            const fd2 = filing?.formData;
                                                            const o = fd2?.sup_details?.osup_det;
                                                            const rc = fd2?.sup_details?.isup_rev;
                                                            const it =
                                                                fd2?.intr_ltfee?.intr_details;
                                                            const lf =
                                                                fd2?.intr_ltfee?.ltfee_details;
                                                            return (
                                                                (Number(o?.iamt) || 0) +
                                                                (Number(o?.camt) || 0) +
                                                                (Number(o?.samt) || 0) +
                                                                (Number(o?.csamt) || 0) +
                                                                (Number(rc?.iamt) || 0) +
                                                                (Number(rc?.camt) || 0) +
                                                                (Number(rc?.samt) || 0) +
                                                                (Number(rc?.csamt) || 0) +
                                                                (Number(it?.iamt) || 0) +
                                                                (Number(it?.camt) || 0) +
                                                                (Number(it?.samt) || 0) +
                                                                (Number(it?.csamt) || 0) +
                                                                (Number(lf?.iamt) || 0) +
                                                                (Number(lf?.camt) || 0) +
                                                                (Number(lf?.samt) || 0) +
                                                                (Number(lf?.csamt) || 0)
                                                            );
                                                        })()
                                                    ),
                                                    valueColor: '#ef4444',
                                                },
                                                {
                                                    label: 'ITC Utilised',
                                                    value: fmt(
                                                        Object.values(routingValues).reduce(
                                                            (s, v) => s + (Number(v) || 0),
                                                            0
                                                        )
                                                    ),
                                                    valueColor: '#43b75d',
                                                },
                                                {
                                                    label: 'Cash Payment',
                                                    value: fmt(
                                                        Math.max(
                                                            0,
                                                            (() => {
                                                                const fd2 = filing?.formData;
                                                                const o =
                                                                    fd2?.sup_details?.osup_det;
                                                                const rc =
                                                                    fd2?.sup_details?.isup_rev;
                                                                const it =
                                                                    fd2?.intr_ltfee?.intr_details;
                                                                const lf =
                                                                    fd2?.intr_ltfee?.ltfee_details;
                                                                return (
                                                                    (Number(o?.iamt) || 0) +
                                                                    (Number(o?.camt) || 0) +
                                                                    (Number(o?.samt) || 0) +
                                                                    (Number(o?.csamt) || 0) +
                                                                    (Number(rc?.iamt) || 0) +
                                                                    (Number(rc?.camt) || 0) +
                                                                    (Number(rc?.samt) || 0) +
                                                                    (Number(rc?.csamt) || 0) +
                                                                    (Number(it?.iamt) || 0) +
                                                                    (Number(it?.camt) || 0) +
                                                                    (Number(it?.samt) || 0) +
                                                                    (Number(it?.csamt) || 0) +
                                                                    (Number(lf?.iamt) || 0) +
                                                                    (Number(lf?.camt) || 0) +
                                                                    (Number(lf?.samt) || 0) +
                                                                    (Number(lf?.csamt) || 0)
                                                                );
                                                            })() -
                                                                Object.values(routingValues).reduce(
                                                                    (s, v) => s + (Number(v) || 0),
                                                                    0
                                                                )
                                                        )
                                                    ),
                                                    valueColor: '#f59e0b',
                                                },
                                            ].map(({ label, value, valueColor }) => (
                                                <Flex
                                                    key={label}
                                                    justify="space-between"
                                                    className="px-5 py-3 border-b border-[#f1f5f9] last:border-0"
                                                >
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm font-semibold"
                                                        style={{ color: valueColor }}
                                                    >
                                                        {value}
                                                    </Typography.Text>
                                                </Flex>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </SectionCard>

                            {/* EVC */}
                            <SectionCard>
                                <div className="px-5 py-4">
                                    <Flex gap={10} align="center" className="mb-4">
                                        <div
                                            className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: '#fef2f2' }}
                                        >
                                            <SafetyCertificateOutlined
                                                style={{ color: '#ff4f4f', fontSize: 18 }}
                                            />
                                        </div>
                                        <div>
                                            <Typography.Text
                                                className="font-semibold block"
                                                style={{ color: '#1e293b' }}
                                            >
                                                EVC — Electronic Verification Code
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-xs"
                                                style={{ color: '#64748b' }}
                                            >
                                                OTP sent to mobile registered with GST portal
                                            </Typography.Text>
                                        </div>
                                    </Flex>

                                    <Formik
                                        initialValues={{ pan: '' }}
                                        validationSchema={panSchema}
                                        onSubmit={async values => {
                                            setPan(values.pan);
                                            const ok = await generateEvcOtp(values.pan);
                                            if (ok) {
                                                setOtpState('sent');
                                                setResendTimer(30);
                                            }
                                        }}
                                    >
                                        {({ handleSubmit, isSubmitting, values }) => (
                                            <FormikForm onSubmit={handleSubmit}>
                                                <Typography.Text
                                                    className="text-base font-medium block mb-2"
                                                    style={{ color: '#1e293b' }}
                                                >
                                                    Authorised Signatory PAN
                                                </Typography.Text>
                                                <Flex gap={12} wrap="wrap" align="flex-start">
                                                    <Flex
                                                        style={{ flex: '1 1 160px', minWidth: 0 }}
                                                    >
                                                        <TextInput
                                                            name="pan"
                                                            type="text"
                                                            placeholder="Enter PAN"
                                                            maxLength={10}
                                                            isDisabled={otpState === 'sent'}
                                                            formItemClass="!mb-0 w-full"
                                                            allowedInputKeys={v =>
                                                                v
                                                                    .toUpperCase()
                                                                    .replace(/[^A-Z0-9]/g, '')
                                                            }
                                                        />
                                                    </Flex>
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        style={{
                                                            height: 40,
                                                            flex: '1 1 120px',
                                                            fontSize: 16,
                                                        }}
                                                        disabled={
                                                            otpState === 'sent' ||
                                                            !panSchema.isValidSync({
                                                                pan: values.pan,
                                                            })
                                                        }
                                                        loading={isSubmitting}
                                                        onClick={() => handleSubmit()}
                                                    >
                                                        {otpState === 'sent' ? 'Sent' : 'Send OTP'}
                                                    </Button>
                                                </Flex>
                                            </FormikForm>
                                        )}
                                    </Formik>

                                    {otpState === 'sent' && (
                                        <div className="mt-5">
                                            <Typography.Text
                                                className="text-sm font-medium block mb-3 text-center"
                                                style={{ color: '#1e293b' }}
                                            >
                                                Enter 6-digit EVC OTP
                                            </Typography.Text>
                                            <div className="flex justify-center gap-2 sm:gap-3 mb-3">
                                                {otp.map((digit, idx) => (
                                                    <input
                                                        key={idx}
                                                        ref={el => {
                                                            otpRefs.current[idx] = el;
                                                        }}
                                                        type="text"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={e =>
                                                            handleOtpChange(idx, e.target.value)
                                                        }
                                                        className="border border-[#e2e8f0] rounded-lg text-center text-base font-semibold outline-none focus:border-[#ff4f4f]"
                                                        style={{
                                                            color: '#1e293b',
                                                            width: 'calc((100% - 5 * 8px) / 6)',
                                                            maxWidth: 48,
                                                            minWidth: 36,
                                                            height: 44,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <Flex justify="center" className="mb-4">
                                                <button
                                                    type="button"
                                                    disabled={resendTimer > 0}
                                                    className="flex items-center gap-1 text-sm"
                                                    style={{
                                                        color:
                                                            resendTimer > 0 ? '#94a3b8' : '#ff4f4f',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor:
                                                            resendTimer > 0 ? 'default' : 'pointer',
                                                    }}
                                                    onClick={async () => {
                                                        const ok = await generateEvcOtp(pan);
                                                        if (ok) setResendTimer(30);
                                                    }}
                                                >
                                                    <ReloadOutlined style={{ fontSize: 13 }} />
                                                    {resendTimer > 0
                                                        ? `Resend OTP in ${resendTimer}s`
                                                        : 'Resend OTP'}
                                                </button>
                                            </Flex>
                                            <Button
                                                type="primary"
                                                danger
                                                block
                                                loading={isFiling}
                                                disabled={otp.some(d => !d)}
                                                style={{
                                                    height: 48,
                                                    fontSize: 16,
                                                    fontWeight: 600,
                                                }}
                                                icon={<ArrowRightOutlined />}
                                                iconPosition="end"
                                                onClick={async () => {
                                                    const ok = await fileReturn(
                                                        pan,
                                                        otp.join(''),
                                                        nilReturn
                                                    );
                                                    if (ok) {
                                                        fetchMonths();
                                                        next(7);
                                                    }
                                                }}
                                            >
                                                File GSTR-3B
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>

                            <div className="border-t border-[#e2e8f0] pt-3">
                                <Button
                                    icon={<ArrowLeftOutlined />}
                                    style={{
                                        height: 48,
                                        width: 152,
                                        borderColor: '#cbd5e1',
                                        color: '#475569',
                                        fontSize: 16,
                                    }}
                                    onClick={() => goTo(nilReturn ? 1 : 6)}
                                >
                                    Back
                                </Button>
                            </div>
                        </Flex>
                    )}

                    {/* ── Step 8: Confirmation ── */}
                    {step === 8 && (
                        <Flex vertical gap={16} className="max-w-4xl mx-auto w-full">
                            <div className="flex flex-col items-center py-8 gap-3">
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: '#ecfdf5' }}
                                >
                                    <CheckOutlined style={{ fontSize: 28, color: '#43b75d' }} />
                                </div>
                                <Typography.Text
                                    className="font-bold"
                                    style={{ fontSize: 22, color: '#1e293b' }}
                                >
                                    GSTR-3B Filed Successfully!
                                </Typography.Text>
                                <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                                    Accepted by GST portal. ARN generated.
                                </Typography.Text>
                            </div>

                            <SectionCard>
                                {[
                                    {
                                        label: 'Acknowledgement Reference Number (ARN)',
                                        value: ackNum ?? filing?.ackNum ?? 'Pending',
                                    },
                                    { label: 'Period', value: selectedMonthLabel },
                                    {
                                        label: 'Filed',
                                        value: formatFiledAt(filedAt ?? filing?.filedAt),
                                    },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 px-5 py-3 border-b border-[#f1f5f9] last:border-0"
                                    >
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: '#64748b' }}
                                        >
                                            {label}
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-sm font-semibold"
                                            style={{ color: '#1e293b' }}
                                        >
                                            {value}
                                        </Typography.Text>
                                    </div>
                                ))}
                            </SectionCard>

                            <div>
                                <Typography.Text
                                    className="font-semibold block mb-3"
                                    style={{ color: '#1e293b' }}
                                >
                                    Tax Payment Summary
                                </Typography.Text>
                                <div className="border border-[#e2e8f0] rounded-[14px] overflow-x-auto">
                                    <div
                                        className="grid px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]"
                                        style={{
                                            gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr',
                                            minWidth: 560,
                                        }}
                                    >
                                        {[
                                            'Transaction Type',
                                            'Liability Category',
                                            'IGST (₹)',
                                            'CGST (₹)',
                                            'SGST/UTGST (₹)',
                                            'Cash Paid (₹)',
                                        ].map(h => (
                                            <Typography.Text
                                                key={h}
                                                className="text-xs font-semibold whitespace-nowrap"
                                                style={{ color: '#475569' }}
                                            >
                                                {h}
                                            </Typography.Text>
                                        ))}
                                    </div>
                                    {(() => {
                                        const txPmt = (filing?.formData as any)?.tx_pmt ?? {};
                                        const txPy: any[] = txPmt?.tx_py ?? [];
                                        const netITC =
                                            Number(filing?.formData?.itc_elg?.itc_net?.iamt ?? 0) +
                                            Number(filing?.formData?.itc_elg?.itc_net?.camt ?? 0) +
                                            Number(filing?.formData?.itc_elg?.itc_net?.samt ?? 0);
                                        if (txPy.length === 0)
                                            return (
                                                <div className="px-4 py-3">
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#94a3b8' }}
                                                    >
                                                        Tax payment details will appear after
                                                        filing.
                                                    </Typography.Text>
                                                </div>
                                            );
                                        return txPy
                                            .map((r: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="grid px-4 py-3 border-b border-[#e2e8f0]"
                                                    style={{
                                                        gridTemplateColumns:
                                                            '1fr 2fr 1fr 1fr 1fr 1fr',
                                                        minWidth: 560,
                                                    }}
                                                >
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        {r.trans_typ}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        {r.tran_desc}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        {fmt(r.igst?.tx ?? 0)}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        {fmt(r.cgst?.tx ?? 0)}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        {fmt(r.sgst?.tx ?? 0)}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        —
                                                    </Typography.Text>
                                                </div>
                                            ))
                                            .concat([
                                                <div
                                                    key="total"
                                                    className="grid px-4 py-3 border-b border-[#e2e8f0]"
                                                    style={{
                                                        gridTemplateColumns:
                                                            '1fr 2fr 1fr 1fr 1fr 1fr',
                                                        backgroundColor: '#f8fafc',
                                                        minWidth: 560,
                                                    }}
                                                >
                                                    <Typography.Text
                                                        className="text-sm font-bold"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        Total
                                                    </Typography.Text>
                                                    <div />
                                                    <Typography.Text
                                                        className="text-sm font-bold"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        {fmt(
                                                            txPy.reduce(
                                                                (s: number, r: any) =>
                                                                    s + (r?.igst?.tx ?? 0),
                                                                0
                                                            )
                                                        )}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm font-bold"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        {fmt(
                                                            txPy.reduce(
                                                                (s: number, r: any) =>
                                                                    s + (r?.cgst?.tx ?? 0),
                                                                0
                                                            )
                                                        )}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm font-bold"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        {fmt(
                                                            txPy.reduce(
                                                                (s: number, r: any) =>
                                                                    s + (r?.sgst?.tx ?? 0),
                                                                0
                                                            )
                                                        )}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-sm font-bold"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        —
                                                    </Typography.Text>
                                                </div>,
                                                <div
                                                    key="itc"
                                                    className="grid px-4 py-3"
                                                    style={{
                                                        gridTemplateColumns:
                                                            '1fr 2fr 1fr 1fr 1fr 1fr',
                                                        backgroundColor: '#ecfdf5',
                                                        minWidth: 560,
                                                    }}
                                                >
                                                    <Typography.Text
                                                        className="text-sm font-semibold"
                                                        style={{ color: '#43b75d' }}
                                                    >
                                                        ITC Utilised (pditc total)
                                                    </Typography.Text>
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <div key={i} />
                                                    ))}
                                                    <Typography.Text
                                                        className="text-sm font-semibold"
                                                        style={{ color: '#43b75d' }}
                                                    >
                                                        {fmt(netITC)}
                                                    </Typography.Text>
                                                </div>,
                                            ]);
                                    })()}
                                </div>
                            </div>

                            <Flex gap={12} justify="center" wrap="wrap">
                                <Button
                                    icon={<DownloadOutlined />}
                                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f', height: 40 }}
                                    loading={isDownloading}
                                    onClick={downloadPdf}
                                >
                                    Download PDF
                                </Button>
                                <Button
                                    icon={<FileDoneOutlined />}
                                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f', height: 40 }}
                                    onClick={() =>
                                        navigate(
                                            `${paths.dashboard.taxMore}/${paths.taxMore.gstLedger}`
                                        )
                                    }
                                >
                                    View Ledger
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    icon={<CalendarOutlined />}
                                    style={{ height: 40 }}
                                    onClick={() => {
                                        setStep(1);
                                        setCompletedSteps(new Set());
                                        setFetchSubState('idle');
                                        setSaveSubState('idle');
                                        setOtpState('idle');
                                        setOtp(['', '', '', '', '', '']);
                                        setPan('');
                                    }}
                                >
                                    File Another Period
                                </Button>
                            </Flex>
                        </Flex>
                    )}
                </div>
            </div>
        </Flex>
    );
};

export default Gstr3bFilingPage;
