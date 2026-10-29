import { Divider, Flex, Typography } from 'antd';

import { Gstr9Table5 } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

type RowKey = '5A' | '5B' | '5C' | '5D' | '5E' | '5F' | '5G' | '5H' | '5I' | '5J';

const ROWS: { key: RowKey; label: string }[] = [
    { key: '5A', label: '5A — Zero-Rated (no IGST)' },
    { key: '5B', label: '5B — SEZ (no IGST)' },
    { key: '5C', label: '5C — RCM Supplies' },
    { key: '5D', label: '5D — Exempted' },
    { key: '5E', label: '5E — Nil-Rated' },
    { key: '5F', label: '5F — Non-GST' },
    { key: '5G', label: '5G — Credit Notes' },
    { key: '5H', label: '5H — Debit Notes' },
    { key: '5I', label: '5I — Amendments (+)' },
    { key: '5J', label: '5J — Amendments (-)' },
];

const T5_MAP: Record<RowKey, keyof Gstr9Table5> = {
    '5A': 'zero_rtd',
    '5B': 'sez',
    '5C': 'rchrg',
    '5D': 'exmt',
    '5E': 'nil',
    '5F': 'non_gst',
    '5G': 'cr_nt',
    '5H': 'dr_nt',
    '5I': 'amd_pos',
    '5J': 'amd_neg',
};

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Component ────────────────────────────────────────────────────────────────

const Gstr9FormTable5 = ({
    initialTable5,
    footer,
}: {
    initialTable5?: Gstr9Table5;
    footer: React.ReactNode;
}) => {
    const rows = ROWS.map(r => ({
        label: r.label,
        val: initialTable5?.[T5_MAP[r.key]]?.txval ?? 0,
    }));
    const total = rows.reduce((sum, r) => sum + r.val, 0);

    return (
        <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
            <div className="px-5 pt-5 pb-3 border-b border-[#e2e8f0]">
                <Typography.Text className="font-medium" style={{ fontSize: 15, color: '#1e293b' }}>
                    Non-Taxable Outward Supplies (Taxable Value only)
                </Typography.Text>
            </div>

            {rows.map((row, i) => (
                <Flex
                    key={row.label}
                    align="center"
                    justify="space-between"
                    className={`px-5 hover:bg-[#fafafa] transition-colors ${i < rows.length - 1 ? 'border-b border-[#e2e8f0]' : ''}`}
                    style={{ minHeight: 48 }}
                >
                    <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                        {row.label}
                    </Typography.Text>
                    <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                        {fmt(row.val)}
                    </Typography.Text>
                </Flex>
            ))}

            <Flex
                align="center"
                justify="space-between"
                className="border-t border-[#e2e8f0] px-5 py-4"
            >
                <Typography.Text className="font-medium text-sm" style={{ color: '#1e293b' }}>
                    Total Non-Taxable Turnover
                </Typography.Text>
                <Typography.Text className="font-bold text-sm" style={{ color: '#1e293b' }}>
                    {fmt(total)}
                </Typography.Text>
            </Flex>

            <Divider className="m-0" />

            <Flex justify="space-between" wrap="wrap" gap={8} className="px-5 pb-5 mt-4">
                {footer}
            </Flex>
        </div>
    );
};

export default Gstr9FormTable5;
