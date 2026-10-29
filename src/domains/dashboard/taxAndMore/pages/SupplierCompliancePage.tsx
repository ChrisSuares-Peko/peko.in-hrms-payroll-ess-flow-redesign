import { useState } from 'react';

import {
    AlertOutlined,
    CheckCircleFilled,
    ExportOutlined,
    PlusOutlined,
    SearchOutlined,
    TeamOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Button, Flex, Select, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/hooks';
import { showToast } from '@src/slices/apiSlice';

const fmt = (n: number) => n.toLocaleString('en-IN');

const getScoreColors = (score: number) => {
    if (score >= 90) return { text: '#16a34a', bar: '#22c55e' };
    if (score >= 70) return { text: '#f59e0b', bar: '#f59e0b' };
    return { text: '#ef4444', bar: '#ef4444' };
};

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthStatus = 'filed' | 'late' | 'missed' | 'pending';
type Category = 'Manufacturer' | 'Service Provider' | 'Works Contract';
type ComplianceFilter = 'all' | 'compliant' | 'at-risk' | 'non-compliant' | 'inactive';

interface Supplier {
    id: string;
    name: string;
    gstin: string;
    category: Category;
    gstr1: MonthStatus[];
    gstr3b: MonthStatus[];
    filingScore: number;
    itcAtRisk: number | null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_GREEN: MonthStatus[] = Array(12).fill('filed');
const MOSTLY_GREEN = (redAt: number[]): MonthStatus[] =>
    Array(12)
        .fill('filed')
        .map((_, i) => (redAt.includes(i) ? 'late' : 'filed'));
const LOW_SCORE = (pattern: MonthStatus[]): MonthStatus[] => pattern;

const SUPPLIERS: Supplier[] = [
    {
        id: 's1',
        name: 'Tata Motors Ltd',
        gstin: '27AAACT2727Q1ZV',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's2',
        name: 'Reliance Industries Ltd',
        gstin: '27AAACR5055K1Z5',
        category: 'Manufacturer',
        gstr1: MOSTLY_GREEN([4, 9]),
        gstr3b: MOSTLY_GREEN([4, 9]),
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's3',
        name: 'Infosys Ltd',
        gstin: '29AABCI1234D1ZX',
        category: 'Service Provider',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's4',
        name: 'Wipro Ltd',
        gstin: '29AAACW0112J1ZL',
        category: 'Service Provider',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's5',
        name: 'HCL Technologies',
        gstin: '09AAACH5104E1ZS',
        category: 'Service Provider',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's6',
        name: 'Mahindra & Mahindra',
        gstin: '27AABCM2965P1ZN',
        category: 'Manufacturer',
        gstr1: MOSTLY_GREEN([3, 8]),
        gstr3b: MOSTLY_GREEN([3, 8]),
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's7',
        name: 'Bajaj Auto Ltd',
        gstin: '27AABCB0407Q1ZE',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's8',
        name: 'Godrej Industries',
        gstin: '27AABCG0569P1ZK',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's9',
        name: 'Larsen & Toubro Ltd',
        gstin: '27AAACL1122A1Z5',
        category: 'Works Contract',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's10',
        name: 'Asian Paints Ltd',
        gstin: '27AAACA1047C1ZR',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's11',
        name: 'Pidilite Industries',
        gstin: '27AAACP0440F1ZS',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's12',
        name: 'Titan Company Ltd',
        gstin: '33AAACT4250C1ZU',
        category: 'Manufacturer',
        gstr1: MOSTLY_GREEN([6, 11]),
        gstr3b: MOSTLY_GREEN([6, 11]),
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's13',
        name: 'Havells India Ltd',
        gstin: '09AAACH8765E1ZT',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's14',
        name: 'Voltas Ltd',
        gstin: '27AAACV0375R1ZS',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's15',
        name: 'Blue Star Ltd',
        gstin: '27AABCB0781L1Z5',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's16',
        name: 'Minda Industries',
        gstin: '06AABCM1234L1ZS',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's17',
        name: 'Sundaram Fasteners',
        gstin: '33AADCS3981S1Z5',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's18',
        name: 'Motherson Sumi System',
        gstin: '09AABCM5678P1ZS',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's19',
        name: 'Amara Raja Batteries',
        gstin: '28AABCA1234B1ZK',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's20',
        name: 'Exide Industries Ltd',
        gstin: '19AAACE1234F1ZP',
        category: 'Manufacturer',
        gstr1: ALL_GREEN,
        gstr3b: ALL_GREEN,
        filingScore: 100,
        itcAtRisk: null,
    },
    {
        id: 's21',
        name: 'Shree Cement Ltd',
        gstin: '08AABCS1429B1ZL',
        category: 'Manufacturer',
        gstr1: LOW_SCORE([
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'late',
            'missed',
            'filed',
            'filed',
        ]),
        gstr3b: LOW_SCORE([
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'late',
            'missed',
            'filed',
            'filed',
        ]),
        filingScore: 83,
        itcAtRisk: 45230,
    },
    {
        id: 's22',
        name: 'ACC Ltd',
        gstin: '27AABCA0440H1ZS',
        category: 'Manufacturer',
        gstr1: LOW_SCORE([
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'missed',
            'late',
            'missed',
            'filed',
            'filed',
            'filed',
            'late',
        ]),
        gstr3b: LOW_SCORE([
            'filed',
            'filed',
            'filed',
            'filed',
            'filed',
            'missed',
            'late',
            'missed',
            'filed',
            'filed',
            'filed',
            'late',
        ]),
        filingScore: 75,
        itcAtRisk: 123450,
    },
    {
        id: 's23',
        name: 'UltraTech Cement Ltd',
        gstin: '27AABCU1234C1ZN',
        category: 'Manufacturer',
        gstr1: LOW_SCORE([
            'filed',
            'missed',
            'missed',
            'filed',
            'filed',
            'missed',
            'missed',
            'late',
            'filed',
            'missed',
            'filed',
            'missed',
        ]),
        gstr3b: LOW_SCORE([
            'filed',
            'missed',
            'missed',
            'filed',
            'filed',
            'missed',
            'missed',
            'late',
            'filed',
            'missed',
            'filed',
            'missed',
        ]),
        filingScore: 60,
        itcAtRisk: 287650,
    },
    {
        id: 's24',
        name: 'Jaiprakash Power Ventures',
        gstin: '27AABCJ5678P1ZS',
        category: 'Manufacturer',
        gstr1: Array(12).fill('pending'),
        gstr3b: Array(12).fill('pending'),
        filingScore: 0,
        itcAtRisk: null,
    },
];

const CATEGORY_COLORS: Record<Category, { bg: string; color: string }> = {
    Manufacturer: { bg: '#eff6ff', color: '#3b82f6' },
    'Service Provider': { bg: '#f0fdf4', color: '#16a34a' },
    'Works Contract': { bg: '#fdf4ff', color: '#9333ea' },
};

const MONTH_COLORS: Record<MonthStatus, string> = {
    filed: '#22c55e',
    late: '#f59e0b',
    missed: '#ef4444',
    pending: '#e2e8f0',
};

const COMPLIANCE_FILTERS: { key: ComplianceFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'compliant', label: 'Compliant' },
    { key: 'at-risk', label: 'At Risk' },
    { key: 'non-compliant', label: 'Non-compliant' },
    { key: 'inactive', label: 'Inactive' },
];

const getComplianceCategory = (s: Supplier): ComplianceFilter => {
    if (s.filingScore === 0) return 'inactive';
    if (s.filingScore >= 90) return 'compliant';
    if (s.filingScore >= 70) return 'at-risk';
    return 'non-compliant';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FilingHeatmap = ({ months }: { months: MonthStatus[] }) => (
    <div className="flex gap-[3px]">
        {months.map((status, i) => (
            <div
                key={i}
                style={{
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    backgroundColor: MONTH_COLORS[status],
                    flexShrink: 0,
                }}
            />
        ))}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const SupplierCompliancePage = () => {
    const dispatch = useAppDispatch();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<ComplianceFilter>('all');

    const totalSuppliers = SUPPLIERS.length;
    const fullyCompliant = SUPPLIERS.filter(s => s.filingScore >= 90).length;
    const missedLast = SUPPLIERS.filter(
        s => s.gstr3b[s.gstr3b.length - 1] === 'missed' || s.gstr3b[s.gstr3b.length - 1] === 'late'
    ).length;
    const inactiveGstin = SUPPLIERS.filter(s => s.filingScore === 0).length;

    const filtered = SUPPLIERS.filter(s => {
        const matchSearch =
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.gstin.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || getComplianceCategory(s) === filter;
        return matchSearch && matchFilter;
    });

    return (
        <Flex vertical gap={16}>
            {/* Page header */}
            <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
                <Flex vertical gap={4} style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <Typography.Text
                        className="font-bold"
                        style={{ fontSize: 22, color: '#1e293b' }}
                    >
                        Supplier Compliance Monitor
                    </Typography.Text>
                    <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                        Track GST filing for all your suppliers to protect your ITC claims
                    </Typography.Text>
                </Flex>
                <Flex gap={10} wrap="wrap">
                    <Button
                        icon={<ExportOutlined />}
                        style={{ borderColor: '#e2e8f0', color: '#475569', height: 40 }}
                        onClick={() =>
                            dispatch(
                                showToast({
                                    description: 'Export CSV feature coming soon',
                                    variant: 'info',
                                })
                            )
                        }
                    >
                        Export CSV
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        style={{ height: 40, fontWeight: 500 }}
                        onClick={() =>
                            dispatch(
                                showToast({
                                    description: 'Add Supplier feature coming soon',
                                    variant: 'info',
                                })
                            )
                        }
                    >
                        Add Supplier
                    </Button>
                </Flex>
            </Flex>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        icon: <TeamOutlined style={{ fontSize: 16, color: '#475569' }} />,
                        iconBg: '#f1f5f9',
                        value: totalSuppliers,
                        label: 'Total Suppliers',
                        sub: null,
                        subColor: '',
                    },
                    {
                        icon: <CheckCircleFilled style={{ fontSize: 16, color: '#16a34a' }} />,
                        iconBg: '#f0fdf4',
                        value: fullyCompliant,
                        label: 'Fully Compliant',
                        sub: `${Math.round((fullyCompliant / totalSuppliers) * 100)}% rate`,
                        subColor: '#16a34a',
                    },
                    {
                        icon: <WarningFilled style={{ fontSize: 16, color: '#f59e0b' }} />,
                        iconBg: '#fffbeb',
                        value: missedLast,
                        label: 'Missed Return',
                        sub: 'ITC at risk',
                        subColor: '#f59e0b',
                    },
                    {
                        icon: <AlertOutlined style={{ fontSize: 16, color: '#ef4444' }} />,
                        iconBg: '#fef2f2',
                        value: inactiveGstin,
                        label: 'Inactive GSTIN',
                        sub: 'verify first',
                        subColor: '#ef4444',
                    },
                ].map(({ icon, iconBg, value, label, sub, subColor }) => (
                    <div
                        key={label}
                        className="bg-white border border-[#e2e8f0] rounded-[14px] px-3 py-3 sm:px-5 sm:py-4"
                    >
                        <div className="flex flex-col gap-2">
                            <div
                                className="flex items-center justify-center rounded-full self-start"
                                style={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: iconBg,
                                    flexShrink: 0,
                                }}
                            >
                                {icon}
                            </div>
                            <Typography.Text
                                className="font-bold"
                                style={{ fontSize: 22, color: '#1e293b', lineHeight: '28px' }}
                            >
                                {value}
                            </Typography.Text>
                            <Typography.Text
                                className="text-xs leading-tight"
                                style={{ color: '#64748b' }}
                            >
                                {label}
                            </Typography.Text>
                            {sub && (
                                <Typography.Text
                                    className="text-[10px]"
                                    style={{ color: subColor }}
                                >
                                    {sub}
                                </Typography.Text>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters bar */}
            <Flex align="center" gap={12} justify="space-between" wrap="wrap">
                <Flex gap={10} align="center" wrap="wrap">
                    {/* FY */}
                    <Select
                        defaultValue="2024-25"
                        options={[
                            { label: 'FY 2024-25', value: '2024-25' },
                            { label: 'FY 2023-24', value: '2023-24' },
                        ]}
                        style={{ width: 120 }}
                        getPopupContainer={() => document.body}
                    />
                    {/* Return type */}
                    <Select
                        defaultValue="all"
                        options={[
                            { label: 'All Returns', value: 'all' },
                            { label: 'GSTR-1', value: 'gstr1' },
                            { label: 'GSTR-3B', value: 'gstr3b' },
                        ]}
                        style={{ width: 140 }}
                        getPopupContainer={() => document.body}
                    />

                    {/* Compliance filter pills */}
                    <div
                        className="flex items-center border border-[#e2e8f0] rounded-lg px-2 gap-1 bg-white"
                        style={{ height: 36 }}
                    >
                        {COMPLIANCE_FILTERS.map(f => (
                            <button
                                key={f.key}
                                type="button"
                                className="px-3 rounded-md text-sm font-normal transition-colors whitespace-nowrap"
                                style={{
                                    height: 28,
                                    backgroundColor: filter === f.key ? '#fef2f2' : 'transparent',
                                    color: filter === f.key ? '#ff4f4f' : '#475569',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </Flex>

                {/* Search */}
                <div
                    className="flex items-center gap-2 border border-[#e2e8f0] rounded-lg px-3 bg-white w-full sm:w-[260px]"
                    style={{ height: 36 }}
                >
                    <SearchOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
                    <input
                        type="text"
                        placeholder="Search by name or GSTIN"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 outline-none border-none text-sm bg-transparent"
                        style={{ color: '#1e293b' }}
                    />
                </div>
            </Flex>

            {/* Table */}
            <div className="border border-[#e2e8f0] rounded-[14px] bg-white overflow-x-auto">
                {/* Header */}
                <div
                    className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                    style={{
                        gridTemplateColumns: '2.5fr 1.3fr 2.2fr 2.2fr 1.2fr 1.2fr 1fr',
                        minWidth: 960,
                    }}
                >
                    {[
                        'Supplier',
                        'Category',
                        'GSTR-1 Status (last 12 mo.)',
                        'GSTR-3B Status (last 12 mo.)',
                        'Filing Score',
                        'ITC at Risk',
                        'Action',
                    ].map((h, i) => (
                        <div
                            key={i}
                            className="px-4 py-3 text-xs font-semibold whitespace-nowrap"
                            style={{ color: '#42526d' }}
                        >
                            {h}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {filtered.map(row => (
                    <div
                        key={row.id}
                        className="grid items-center border-b border-[#eaecf0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
                        style={{
                            gridTemplateColumns: '2.5fr 1.3fr 2.2fr 2.2fr 1.2fr 1.2fr 1fr',
                            minHeight: 58,
                            minWidth: 960,
                        }}
                    >
                        {/* Supplier name + GSTIN */}
                        <div className="px-4 py-3">
                            <Typography.Text
                                className="block text-sm font-medium whitespace-nowrap"
                                style={{ color: '#1e293b' }}
                            >
                                {row.name}
                            </Typography.Text>
                            <Typography.Text
                                className="text-xs font-mono whitespace-nowrap"
                                style={{ color: '#94a3b8' }}
                            >
                                {row.gstin}
                            </Typography.Text>
                        </div>

                        {/* Category badge */}
                        <div className="px-4 py-3">
                            <span
                                style={{
                                    backgroundColor: CATEGORY_COLORS[row.category].bg,
                                    color: CATEGORY_COLORS[row.category].color,
                                    borderRadius: 60,
                                    padding: '2px 10px',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {row.category}
                            </span>
                        </div>

                        {/* GSTR-1 heatmap */}
                        <div className="px-4 py-3">
                            <FilingHeatmap months={row.gstr1} />
                        </div>

                        {/* GSTR-3B heatmap */}
                        <div className="px-4 py-3">
                            <FilingHeatmap months={row.gstr3b} />
                        </div>

                        {/* Filing score */}
                        <div className="px-4 py-3">
                            <Flex vertical gap={4}>
                                <Typography.Text
                                    className="text-xs font-medium"
                                    style={{ color: getScoreColors(row.filingScore).text }}
                                >
                                    {row.filingScore}%
                                </Typography.Text>
                                <div
                                    className="rounded-full overflow-hidden"
                                    style={{ height: 5, width: 80, backgroundColor: '#f1f5f9' }}
                                >
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${row.filingScore}%`,
                                            backgroundColor: getScoreColors(row.filingScore).bar,
                                        }}
                                    />
                                </div>
                            </Flex>
                        </div>

                        {/* ITC at Risk */}
                        <div className="px-4 py-3">
                            {row.itcAtRisk !== null ? (
                                <Typography.Text
                                    className="text-sm font-medium whitespace-nowrap"
                                    style={{ color: '#ef4444' }}
                                >
                                    ₹{fmt(row.itcAtRisk)}
                                </Typography.Text>
                            ) : (
                                <Typography.Text style={{ color: '#cbd5e1' }}>—</Typography.Text>
                            )}
                        </div>

                        {/* Action */}
                        <div className="px-4 py-3">
                            <button
                                type="button"
                                className="text-sm font-medium whitespace-nowrap"
                                style={{
                                    color: '#ff4f4f',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                ))}

                {/* Footer */}
                <Flex
                    align="center"
                    justify="space-between"
                    className="px-4 py-3 border-t border-[#eaecf0] bg-[#fafbfb]"
                >
                    <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                        Showing {filtered.length} of {totalSuppliers} suppliers
                    </Typography.Text>
                    <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
                        Last synced: Today, 10:32 AM
                    </Typography.Text>
                </Flex>
            </div>
        </Flex>
    );
};

export default SupplierCompliancePage;
