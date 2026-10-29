import { useState } from 'react';

import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    DownOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Spin, Typography } from 'antd';

import buildingsIcon from '../../assets/icons/buildings.svg';
import moneyIcon from '../../assets/icons/money.svg';
import receiptIcon from '../../assets/icons/receipt.svg';
import walletIcon from '../../assets/icons/wallet.svg';
import {
    Gstr9DraftData,
    Gstr9Section8AData,
    Gstr9Section8ADocument,
    Gstr9Section8ASupplier,
} from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'eligible' | 'ineligible';

interface GroupedSupplier {
    stin: string;
    type: 'B2B' | 'B2BA';
    periods: string[];
    documents: Gstr9Section8ADocument[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatRtnPrd = (rtnPrd: string) => {
    if (!rtnPrd || rtnPrd.length < 6) return rtnPrd;
    const mm = parseInt(rtnPrd.slice(0, 2), 10);
    return `${MONTHS[mm - 1] ?? rtnPrd.slice(0, 2)} ${rtnPrd.slice(2)}`;
};

const fmt = (n: number) =>
    `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtShort = (n: number) => {
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
    return `₹${n.toFixed(2)}`;
};

const groupByStinType = (
    entries: Gstr9Section8ASupplier[],
    type: 'B2B' | 'B2BA'
): GroupedSupplier[] => {
    const map = new Map<string, GroupedSupplier>();
    entries.forEach(s => {
        const key = s.stin ?? '';
        if (!map.has(key)) {
            map.set(key, { stin: key, type, periods: [], documents: [] });
        }
        const g = map.get(key)!;
        if (s.rtnPrd) g.periods.push(s.rtnPrd);
        g.documents.push(...(s.documents ?? []));
    });
    return [...map.values()];
};

const buildSuppliers = (formData: Gstr9Section8AData['formData']): GroupedSupplier[] => [
    ...groupByStinType(formData?.b2b ?? [], 'B2B'),
    ...groupByStinType(formData?.b2ba ?? [], 'B2BA'),
];

const filterDocs = (docs: Gstr9Section8ADocument[], filter: FilterKey) => {
    if (filter === 'eligible') return docs.filter(d => d.iseligible === 'Y');
    if (filter === 'ineligible') return docs.filter(d => d.iseligible !== 'Y');
    return docs;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'eligible', label: 'Eligible' },
    { key: 'ineligible', label: 'Ineligible' },
];

const INV_COLS = [
    'Invoice No',
    'Date',
    'Taxable Val (₹)',
    'IGST (₹)',
    'CGST (₹)',
    'SGST (₹)',
    'CESS (₹)',
    'ITC Eligible?',
    'Reason',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const InvoiceTable = ({ docs }: { docs: Gstr9Section8ADocument[] }) => (
    <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: 780 }}>
            <thead>
                <tr className="bg-white border-b border-[#e2e8f0]">
                    {INV_COLS.map(c => (
                        <th
                            key={c}
                            className="px-4 py-4 text-left text-xs font-medium whitespace-nowrap"
                            style={{ color: '#42526d' }}
                        >
                            {c}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {docs.map((d, i) => (
                    <tr
                        key={`${d.inum ?? ''}-${i}`}
                        className="border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#fafafa]"
                    >
                        <td className="px-4 py-4 text-xs font-medium" style={{ color: '#1e293b' }}>
                            {d.inum ?? '—'}
                        </td>
                        <td
                            className="px-4 py-4 text-xs whitespace-nowrap"
                            style={{ color: '#475569' }}
                        >
                            {d.idt ?? '—'}
                        </td>
                        <td className="px-4 py-4 text-xs" style={{ color: '#475569' }}>
                            {fmt(d.txval ?? 0)}
                        </td>
                        <td className="px-4 py-4 text-xs" style={{ color: '#475569' }}>
                            {fmt(d.iamt ?? 0)}
                        </td>
                        <td className="px-4 py-4 text-xs" style={{ color: '#475569' }}>
                            {fmt(d.camt ?? 0)}
                        </td>
                        <td className="px-4 py-4 text-xs" style={{ color: '#475569' }}>
                            {fmt(d.samt ?? 0)}
                        </td>
                        <td className="px-4 py-4 text-xs" style={{ color: '#475569' }}>
                            {fmt(d.csamt ?? 0)}
                        </td>
                        <td
                            className="px-4 py-4 text-xs font-medium"
                            style={{ color: d.iseligible === 'Y' ? '#16a34a' : '#ea580c' }}
                        >
                            {d.iseligible === 'Y' ? 'Eligible' : 'Ineligible'}
                        </td>
                        <td className="px-4 py-4 text-xs" style={{ color: '#94a3b8' }}>
                            {d.reason || '—'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const SupplierRow = ({
    supplier,
    open,
    onToggle,
    filter,
}: {
    supplier: GroupedSupplier;
    open: boolean;
    onToggle: () => void;
    filter: FilterKey;
}) => {
    const visibleDocs = filterDocs(supplier.documents, filter);
    const periodLabel = supplier.periods.map(formatRtnPrd).join(', ');
    return (
        <div className="overflow-hidden">
            <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafafa] transition-colors"
                onClick={onToggle}
            >
                <Flex gap={10} align="center">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: '#fff' }}
                    >
                        <img src={buildingsIcon} alt="" style={{ width: 16, height: 16 }} />
                    </div>
                    <div className="text-left">
                        <Typography.Text
                            className="font-medium text-sm block mb-1"
                            style={{ color: '#1e293b' }}
                        >
                            {supplier.stin}
                        </Typography.Text>
                        <Typography.Text
                            className="text-xs block mt-1"
                            style={{ color: '#94a3b8' }}
                        >
                            {supplier.periods.length > 1 ? 'Periods: ' : 'Period: '}
                            <strong style={{ color: '#475569' }}>{periodLabel}</strong>
                        </Typography.Text>
                    </div>
                </Flex>
                <Flex gap={8} align="center">
                    <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                        {visibleDocs.length} Invoice{visibleDocs.length !== 1 ? 's' : ''}
                    </Typography.Text>
                    <DownOutlined
                        rotate={open ? 180 : 0}
                        style={{ fontSize: 12, color: '#94a3b8', transition: 'transform 0.2s' }}
                    />
                </Flex>
            </button>
            {open &&
                (visibleDocs.length > 0 ? (
                    <InvoiceTable docs={visibleDocs} />
                ) : (
                    <div className="px-5 py-4 text-center">
                        <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                            No invoices match this filter
                        </Typography.Text>
                    </div>
                ))}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Section8AStep = ({
    section8aData,
    draftData,
    onBack,
    onNext,
}: {
    section8aData: Gstr9Section8AData | null;
    draftData: Gstr9DraftData | null;
    onBack: () => void;
    onNext: () => void;
}) => {
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const [filter, setFilter] = useState<FilterKey>('all');

    const formData = section8aData?.formData;
    const suppliers = buildSuppliers(formData);

    const allDocs = suppliers.flatMap(s => s.documents);
    const totalDocs = allDocs.length;
    const totalTxval = allDocs.reduce((sum, d) => sum + (d.txval ?? 0), 0);
    const totalTax = allDocs.reduce(
        (sum, d) => sum + (d.iamt ?? 0) + (d.camt ?? 0) + (d.samt ?? 0) + (d.csamt ?? 0),
        0
    );

    const SUMMARIES = [
        {
            value: String(totalDocs),
            label: 'Total Invoices (Table 8A)',
            icon: receiptIcon,
            bg: '#FDF6F0',
        },
        {
            value: fmtShort(totalTxval),
            label: 'Total Taxable Value (Table 8A)',
            icon: walletIcon,
            bg: '#ECF0FC',
        },
        { value: fmtShort(totalTax), label: 'Total Due Amount', icon: moneyIcon, bg: '#EBF6F1' },
    ];

    const itc2b = draftData?.formData?.table8?.itc_2b;
    const itc3b = draftData?.formData?.table6?.itc_3b;
    const diffIgst = (itc2b?.iamt ?? 0) - (itc3b?.iamt ?? 0);
    const diffCgst = (itc2b?.camt ?? 0) - (itc3b?.camt ?? 0);
    const diffSgst = (itc2b?.samt ?? 0) - (itc3b?.samt ?? 0);
    const hasDiff = diffIgst !== 0 || diffCgst !== 0 || diffSgst !== 0;

    const diffParts = [
        diffIgst !== 0 && `IGST ${diffIgst < 0 ? '-' : ''}${fmtShort(Math.abs(diffIgst))}`,
        diffCgst !== 0 && `CGST ${diffCgst < 0 ? '-' : ''}${fmtShort(Math.abs(diffCgst))}`,
        diffSgst !== 0 && `SGST ${diffSgst < 0 ? '-' : ''}${fmtShort(Math.abs(diffSgst))}`,
    ]
        .filter(Boolean)
        .join(' · ');

    if (!section8aData) {
        return (
            <div
                className="border border-[#e2e8f0] rounded-[14px] bg-white flex items-center justify-center"
                style={{ minHeight: 300 }}
            >
                <Flex vertical align="center" gap={12}>
                    <Spin size="large" />
                    <Typography.Text style={{ color: '#64748b' }}>
                        Loading Section 8A data…
                    </Typography.Text>
                </Flex>
            </div>
        );
    }

    return (
        <div className=" -mt-2 overflow-hidden bg-white">
            {/* Metric cards */}
            <Row gutter={[12, 12]} className="px-5 pt-5 pb-4">
                {SUMMARIES.map(s => (
                    <Col key={s.label} xs={24} sm={8}>
                        <Flex
                            vertical
                            gap={8}
                            className="w-full rounded-xl p-4"
                            style={{ background: s.bg }}
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: '#fff' }}
                            >
                                <img src={s.icon} alt="" style={{ width: 18, height: 18 }} />
                            </div>
                            <Typography.Text
                                className="font-bold text-xl block"
                                style={{ color: '#1e293b' }}
                            >
                                {s.value}
                            </Typography.Text>
                            <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                                {s.label}
                            </Typography.Text>
                        </Flex>
                    </Col>
                ))}
            </Row>

            {/* Diff warning */}
            {hasDiff && (
                <Flex
                    gap={10}
                    align="flex-start"
                    className="mx-5 mt-2 mb-3 border rounded-xl px-4 py-3"
                    style={{ borderColor: '#EF4444', backgroundColor: '#fff5f5' }}
                >
                    <WarningFilled
                        style={{ color: '#EF4444', fontSize: 14, marginTop: 2, flexShrink: 0 }}
                    />
                    <div>
                        <Typography.Text
                            className="text-sm font-medium block"
                            style={{ color: '#EF4444' }}
                        >
                            Table 8 — differenceABC: {diffParts}
                        </Typography.Text>
                        <Typography.Text className="text-xs" style={{ color: '#EF4444' }}>
                            Your GSTR-3B ITC claim exceeds GSTR-2B auto-populated values (itc_tot
                            &gt; itc_2b). Excess ITC may need reversal per Rule 42/43.
                        </Typography.Text>
                    </div>
                </Flex>
            )}

            {/* Supplier section — bordered card */}
            <div className="mx-5 mt-5 mb-4 border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
                {/* Heading + filter */}
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={8}
                    className="mt-1 px-4 py-3"
                >
                    <Typography.Text className="font-medium text-base" style={{ color: '#1e293b' }}>
                        Taxable Outward Supplies (as per GSTN auto-calculation) &nbsp;
                        <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                            ({formData?.fy ?? '—'})
                        </span>
                    </Typography.Text>
                    <Flex gap={4}>
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                type="button"
                                className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{
                                    background: filter === f.key ? '#ff4f4f' : 'transparent',
                                    color: filter === f.key ? '#fff' : '#64748b',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </Flex>
                </Flex>

                {/* Supplier accordion — inner card */}
                <div
                    className="mx-4 my-4 border border-[#e2e8f0] rounded-xl overflow-hidden p-2"
                    style={{ backgroundColor: '#F8FAFC' }}
                >
                    {suppliers.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <Typography.Text style={{ color: '#94a3b8' }}>
                                No supplier data available
                            </Typography.Text>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#e2e8f0]">
                            {suppliers.map((s, i) => (
                                <SupplierRow
                                    key={`${s.type}-${s.stin}`}
                                    supplier={s}
                                    open={openIdx === i}
                                    onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                                    filter={filter}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <Divider className="m-0" />
                <Flex justify="space-between" wrap="wrap" gap={8} className="px-4 py-4">
                    <Button icon={<ArrowLeftOutlined />} style={{ height: 40 }} onClick={onBack}>
                        Back
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        style={{ height: 40 }}
                        onClick={onNext}
                    >
                        Edit GSTR-9 Form
                    </Button>
                </Flex>
            </div>
        </div>
    );
};

export default Section8AStep;
