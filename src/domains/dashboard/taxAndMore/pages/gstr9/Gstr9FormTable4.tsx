import { Divider, Flex, Typography } from 'antd';

import { Gstr9Table4 } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

type RowKey = '4A' | '4B' | '4C' | '4D' | '4E' | '4F' | '4G' | '4H' | '4I' | '4J' | '4K';

const ROWS: { key: RowKey; label: string }[] = [
    { key: '4A', label: '4A — B2B Taxable Outward' },
    { key: '4B', label: '4B — B2C Taxable Outward' },
    { key: '4C', label: '4C — Exports (with IGST)' },
    { key: '4D', label: '4D — SEZ Supplies (with IGST)' },
    { key: '4E', label: '4E — Deemed Exports' },
    { key: '4F', label: '4F — Advance Tax' },
    { key: '4G', label: '4G — Reverse Charge Outward' },
    { key: '4H', label: '4H — Credit Notes (net)' },
    { key: '4I', label: '4I — Debit Notes' },
    { key: '4J', label: '4J — Amendments (Positive)' },
    { key: '4K', label: '4K — Amendments (Negative)' },
];

const T4_MAP: Record<RowKey, keyof Gstr9Table4> = {
    '4A': 'b2b',
    '4B': 'b2c',
    '4C': 'exp',
    '4D': 'sez',
    '4E': 'deemed',
    '4F': 'at',
    '4G': 'rchrg',
    '4H': 'cr_nt',
    '4I': 'dr_nt',
    '4J': 'amd_pos',
    '4K': 'amd_neg',
};

const HEADERS = ['Section', 'Taxable Value (₹)', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)'];
const GRID = '2.5fr 1fr 1fr 1fr 1fr';

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Component ────────────────────────────────────────────────────────────────

const Gstr9FormTable4 = ({
    initialTable4,
    footer,
}: {
    initialTable4?: Gstr9Table4;
    footer: React.ReactNode;
}) => {
    const rows = ROWS.map(r => {
        const e = initialTable4?.[T4_MAP[r.key]];
        return {
            label: r.label,
            txval: e?.txval ?? 0,
            igst: e?.iamt ?? 0,
            cgst: e?.camt ?? 0,
            sgst: e?.samt ?? 0,
        };
    });

    const totals = [
        { label: 'Taxable', val: rows.reduce((s, r) => s + r.txval, 0) },
        { label: 'IGST', val: rows.reduce((s, r) => s + r.igst, 0) },
        { label: 'CGST', val: rows.reduce((s, r) => s + r.cgst, 0) },
        { label: 'SGST', val: rows.reduce((s, r) => s + r.sgst, 0) },
    ];

    return (
        <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
            <div className="px-5 pt-5 pb-3">
                <Typography.Text
                    className="font-semibold"
                    style={{ fontSize: 16, color: '#1e293b' }}
                >
                    Taxable Outward Supplies
                </Typography.Text>
            </div>

            <div className="overflow-x-auto">
                <div
                    className="grid bg-[#fafbfb] border-t border-b border-[#e2e8f0]"
                    style={{ gridTemplateColumns: GRID, minWidth: 680 }}
                >
                    {HEADERS.map(h => (
                        <div
                            key={h}
                            className="px-5 py-3 text-sm font-semibold"
                            style={{ color: '#42526d' }}
                        >
                            {h}
                        </div>
                    ))}
                </div>

                {rows.map(row => (
                    <div
                        key={row.label}
                        className="grid items-center border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
                        style={{ gridTemplateColumns: GRID, minHeight: 52, minWidth: 680 }}
                    >
                        <div className="px-5 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                                {row.label}
                            </Typography.Text>
                        </div>
                        {[row.txval, row.igst, row.cgst, row.sgst].map((val, i) => (
                            <div key={i} className="px-5 py-3">
                                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                    {fmt(val)}
                                </Typography.Text>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="border-t border-[#e2e8f0] px-5 py-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {totals.map(({ label, val }) => (
                        <div
                            key={label}
                            className="border border-[#e2e8f0] rounded-xl px-4 py-3 flex flex-col items-center gap-1"
                            style={{ backgroundColor: '#f8fafc' }}
                        >
                            <Typography.Text
                                className="text-xs font-medium uppercase"
                                style={{ color: '#94a3b8' }}
                            >
                                {label}
                            </Typography.Text>
                            <Typography.Text
                                className="font-bold text-sm"
                                style={{ color: '#1e293b' }}
                            >
                                {fmt(val)}
                            </Typography.Text>
                        </div>
                    ))}
                </div>
            </div>

            <Divider className="m-0" />

            <Flex justify="space-between" wrap="wrap" gap={8} className="px-5 pb-5 mt-4">
                {footer}
            </Flex>
        </div>
    );
};

export default Gstr9FormTable4;
