import { useState } from 'react';

import { CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Select, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import cashIconActive from '../assets/icons/cash ledger red.svg';
import cashIconDefault from '../assets/icons/cash ledger.svg';
import balanceIconActive from '../assets/icons/dollar-circle red.svg';
import balanceIconDefault from '../assets/icons/dollar-circle.svg';
import itcIconActive from '../assets/icons/itc ledger red.svg';
import itcIconDefault from '../assets/icons/itc ledger.svg';
import ConnectGstModal from '../components/ConnectGstModal';
import BalanceSnapshotTab from '../components/ledger/BalanceSnapshotTab';
import CashLedgerTab from '../components/ledger/CashLedgerTab';
import ItcLedgerTab from '../components/ledger/ItcLedgerTab';
import useCashItcBalance from '../hooks/useCashItcBalance';
import useCashLedger from '../hooks/useCashLedger';
import useExportCashLedger from '../hooks/useExportCashLedger';
import useExportItcLedger from '../hooks/useExportItcLedger';
import useItcLedger from '../hooks/useItcLedger';
import useReturnLiability from '../hooks/useReturnLiability';
import { FINANCIAL_YEARS } from '../utils/data';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const buildFyMonths = (fy: string) => {
    const startYear = parseInt(fy.split('-')[0], 10);
    return [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map(m => ({
        value: m,
        label: `${MONTH_LABELS_SHORT[m - 1]} ${m >= 4 ? startYear : startYear + 1}`,
    }));
};

const MONTH_LABEL: Record<number, string> = {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December',
};

type LedgerTab = 'balance' | 'cash' | 'itc';

const TABS: { key: LedgerTab; label: string; iconDefault: string; iconActive: string }[] = [
    {
        key: 'balance',
        label: 'Balance Snapshot',
        iconDefault: balanceIconDefault,
        iconActive: balanceIconActive,
    },
    { key: 'cash', label: 'Cash Ledger', iconDefault: cashIconDefault, iconActive: cashIconActive },
    { key: 'itc', label: 'ITC Ledger', iconDefault: itcIconDefault, iconActive: itcIconActive },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const GstLedgerPage = () => {
    const { activeSetup, selectedFinancialYear } = useAppSelector(state => state.reducer.taxMore);
    const gstin = activeSetup?.gstin ?? '';
    const financialYear = selectedFinancialYear ?? activeSetup?.financialYear ?? '';

    const [activeTab, setActiveTab] = useState<LedgerTab>('balance');
    const [selectedFY, setSelectedFY] = useState<string>(financialYear || FINANCIAL_YEARS[0]);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
    const [snapshotMonth, setSnapshotMonth] = useState<number | undefined>(undefined);

    const fyStart = selectedFY ? parseInt(selectedFY.split('-')[0], 10) : new Date().getFullYear();

    const monthDefaultFrom = (m: number) => {
        const yr = m >= 4 ? fyStart : fyStart + 1;
        return `01/${String(m).padStart(2, '0')}/${yr}`;
    };
    const monthDefaultTo = (m: number) => {
        const yr = m >= 4 ? fyStart : fyStart + 1;
        return `${new Date(yr, m, 0).getDate()}/${String(m).padStart(2, '0')}/${yr}`;
    };

    // ── Cash filters ──────────────────────────────────────────────────────────
    const [cashFrom, setCashFrom] = useState<string | undefined>(
        selectedMonth ? monthDefaultFrom(selectedMonth) : undefined
    );
    const [cashTo, setCashTo] = useState<string | undefined>(
        selectedMonth ? monthDefaultTo(selectedMonth) : undefined
    );

    // ── ITC filters ───────────────────────────────────────────────────────────
    const [itcFrom, setItcFrom] = useState<string | undefined>(
        selectedMonth ? monthDefaultFrom(selectedMonth) : undefined
    );
    const [itcTo, setItcTo] = useState<string | undefined>(
        selectedMonth ? monthDefaultTo(selectedMonth) : undefined
    );
    const [itcTaxHead, setItcTaxHead] = useState<string | undefined>(undefined);

    const handleSnapshotMonthChange = (month: number) => {
        setSnapshotMonth(month);
        setSelectedMonth(month);
        setCashFrom(monthDefaultFrom(month));
        setCashTo(monthDefaultTo(month));
        setItcFrom(monthDefaultFrom(month));
        setItcTo(monthDefaultTo(month));
    };

    const handleFYChange = (fy: string) => setSelectedFY(fy);

    // ── Hooks ─────────────────────────────────────────────────────────────────
    const ledgerParams =
        gstin && selectedFY && snapshotMonth
            ? { gstin, financialYear: selectedFY, month: snapshotMonth }
            : null;

    const cashLedgerParams =
        gstin && selectedFY && selectedMonth
            ? {
                  gstin,
                  financialYear: selectedFY,
                  month: selectedMonth,
                  ...(cashFrom ? { from: cashFrom } : {}),
                  ...(cashTo ? { to: cashTo } : {}),
              }
            : null;

    const itcLedgerParams =
        gstin && selectedFY && selectedMonth
            ? {
                  gstin,
                  financialYear: selectedFY,
                  month: selectedMonth,
                  ...(itcFrom ? { from: itcFrom } : {}),
                  ...(itcTo ? { to: itcTo } : {}),
                  ...(itcTaxHead ? { taxHead: itcTaxHead } : {}),
              }
            : null;

    const {
        data: balanceData,
        isLoading: balanceLoading,
        requiresAuth,
        resetAuth,
    } = useCashItcBalance(ledgerParams);
    const { data: liabilityData, isLoading: liabilityLoading } = useReturnLiability(ledgerParams);
    const {
        transactions: cashRows,
        credits,
        debits,
        isLoading: cashLoading,
    } = useCashLedger(cashLedgerParams);
    const {
        transactions: itcRows,
        credits: itcCredits,
        debits: itcDebits,
        isLoading: itcLoading,
    } = useItcLedger(itcLedgerParams);
    const { exportCsv, isExporting } = useExportCashLedger();
    const { exportCsv: exportItcCsv, isExporting: itcExporting } = useExportItcLedger();

    // ── Derived ───────────────────────────────────────────────────────────────
    const balanceRows = [
        {
            head: 'IGST',
            cash: balanceData?.cashBalance.igst ?? 0,
            itc: balanceData?.itcBalance.igst ?? 0,
        },
        {
            head: 'SGST',
            cash: balanceData?.cashBalance.sgst ?? 0,
            itc: balanceData?.itcBalance.sgst ?? 0,
        },
        {
            head: 'CGST',
            cash: balanceData?.cashBalance.cgst ?? 0,
            itc: balanceData?.itcBalance.cgst ?? 0,
        },
        {
            head: 'Cess',
            cash: balanceData?.cashBalance.cess ?? 0,
            itc: balanceData?.itcBalance.cess ?? 0,
        },
    ];
    const balanceTotal = {
        cash: balanceData?.cashBalance.total ?? 0,
        itc: balanceData?.itcBalance.total ?? 0,
    };
    const chartData = [
        {
            name: 'IGST',
            available: balanceData?.availableBalance.igst ?? 0,
            liability: liabilityData?.closingBalance.igst ?? 0,
        },
        {
            name: 'CGST',
            available: balanceData?.availableBalance.cgst ?? 0,
            liability: liabilityData?.closingBalance.cgst ?? 0,
        },
        {
            name: 'SGST',
            available: balanceData?.availableBalance.sgst ?? 0,
            liability: liabilityData?.closingBalance.sgst ?? 0,
        },
        {
            name: 'Cess',
            available: balanceData?.availableBalance.cess ?? 0,
            liability: liabilityData?.closingBalance.cess ?? 0,
        },
    ];
    const hasShortfall = chartData.some(d => d.liability > 0 && d.available < d.liability);
    const selectedMonthLabel = selectedMonth ? MONTH_LABEL[selectedMonth] : 'Nov 2024';
    const fyMonths = buildFyMonths(selectedFY);

    return (
        <Flex vertical gap={16}>
            {requiresAuth && (
                <ConnectGstModal
                    prefillGstin={gstin}
                    open={requiresAuth}
                    onClose={resetAuth}
                    onConnected={resetAuth}
                />
            )}

            {/* Period bar */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                gap={8}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-4 sm:px-6 py-[14px]"
            >
                <Flex gap={10} align="center" wrap="wrap">
                    <CalendarOutlined style={{ fontSize: 16, color: '#475569' }} />
                    <Typography.Text className="text-xs font-medium" style={{ color: '#475569' }}>
                        Period
                    </Typography.Text>
                    <Select
                        value={selectedFY}
                        options={FINANCIAL_YEARS.map(fy => ({ label: `FY ${fy}`, value: fy }))}
                        style={{ width: 110 }}
                        size="small"
                        getPopupContainer={() => document.body}
                        onChange={handleFYChange}
                    />
                    <Select
                        value={selectedMonth}
                        placeholder="Month"
                        options={fyMonths}
                        style={{ width: 100 }}
                        size="small"
                        getPopupContainer={() => document.body}
                        onChange={handleSnapshotMonthChange}
                    />
                </Flex>
                <Typography.Text
                    className="hidden sm:block text-xs font-medium"
                    style={{ color: '#475569' }}
                >
                    Showing data for {selectedMonthLabel}
                </Typography.Text>
            </Flex>

            {/* Step banner */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                gap={8}
                className="border border-[#81cf92] rounded-[14px] px-4 sm:px-6 py-3"
                style={{ backgroundColor: '#ecfdf5' }}
            >
                <Flex gap={6} align="center">
                    <CheckCircleOutlined style={{ fontSize: 14, color: '#43b75d' }} />
                    <Typography.Text className="text-xs font-medium" style={{ color: '#43b75d' }}>
                        Step 6 of 6 — Check Ledger
                    </Typography.Text>
                    <Typography.Text className="text-[11px]" style={{ color: '#43b75d' }}>
                        Completed ✓
                    </Typography.Text>
                </Flex>
                <Typography.Text
                    className="hidden sm:block text-xs font-medium"
                    style={{ color: '#475569' }}
                >
                    {selectedMonthLabel}
                </Typography.Text>
            </Flex>

            {/* Page header */}
            <Flex align="center" justify="space-between" className="py-1">
                <Flex vertical gap={2}>
                    <Typography.Text
                        className="font-semibold"
                        style={{ fontSize: 20, color: '#1f2937' }}
                    >
                        GST Ledger Dashboard
                    </Typography.Text>
                    <Typography.Text className="text-sm" style={{ color: '#6b7280' }}>
                        Review supplier invoices before filing GSTR-3B
                    </Typography.Text>
                </Flex>
                {/* <Button icon={<CheckCircleOutlined />} style={{ height: 44, fontSize: 15, fontWeight: 500, borderColor: '#e2e8f0', color: '#475569' }}>
                    Mark as Reviewed
                </Button> */}
            </Flex>

            {/* Tab bar */}
            <div className="flex border-b border-[#e2e8f0] gap-1">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className="flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
                        style={{
                            color: activeTab === tab.key ? '#ff4f4f' : '#475569',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `2px solid ${activeTab === tab.key ? '#ff4f4f' : 'transparent'}`,
                            marginBottom: -1,
                        }}
                    >
                        <img
                            src={activeTab === tab.key ? tab.iconActive : tab.iconDefault}
                            alt=""
                            style={{ width: 16, height: 16 }}
                        />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'balance' && (
                <BalanceSnapshotTab
                    selectedFY={selectedFY}
                    snapshotMonth={snapshotMonth}
                    selectedMonthLabel={selectedMonthLabel}
                    isLoading={balanceLoading || liabilityLoading}
                    hasShortfall={hasShortfall}
                    balanceRows={balanceRows}
                    balanceTotal={balanceTotal}
                    chartData={chartData}
                    fyMonths={fyMonths}
                    liabilityTransactions={liabilityData?.transactions}
                    onFYChange={handleFYChange}
                    onMonthChange={handleSnapshotMonthChange}
                />
            )}

            {activeTab === 'cash' && (
                <CashLedgerTab
                    from={cashFrom}
                    to={cashTo}
                    fyStart={fyStart}
                    isExporting={isExporting}
                    credits={credits}
                    debits={debits}
                    rows={cashRows}
                    isLoading={cashLoading}
                    liabilityTransactions={liabilityData?.transactions}
                    onFromChange={v => {
                        setCashFrom(v);
                        if (!v) setCashTo(undefined);
                    }}
                    onToChange={v => {
                        setCashTo(v);
                        if (!v) setCashFrom(undefined);
                    }}
                    onExport={() =>
                        selectedMonth &&
                        exportCsv({
                            gstin,
                            financialYear: selectedFY,
                            month: selectedMonth,
                            ...(cashFrom ? { from: cashFrom } : {}),
                            ...(cashTo ? { to: cashTo } : {}),
                        })
                    }
                />
            )}

            {activeTab === 'itc' && (
                <ItcLedgerTab
                    from={itcFrom}
                    to={itcTo}
                    taxHead={itcTaxHead}
                    fyStart={fyStart}
                    isExporting={itcExporting}
                    credits={itcCredits}
                    debits={itcDebits}
                    rows={itcRows}
                    isLoading={itcLoading}
                    liabilityTransactions={liabilityData?.transactions}
                    onFromChange={v => {
                        setItcFrom(v);
                        if (!v) setItcTo(undefined);
                    }}
                    onToChange={v => {
                        setItcTo(v);
                        if (!v) setItcFrom(undefined);
                    }}
                    onTaxHeadChange={setItcTaxHead}
                    onExport={() =>
                        selectedMonth &&
                        exportItcCsv({
                            gstin,
                            financialYear: selectedFY,
                            month: selectedMonth,
                            ...(itcFrom ? { from: itcFrom } : {}),
                            ...(itcTo ? { to: itcTo } : {}),
                            ...(itcTaxHead ? { taxHead: itcTaxHead } : {}),
                        })
                    }
                />
            )}
        </Flex>
    );
};

export default GstLedgerPage;
