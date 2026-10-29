import { Divider, Flex, Typography } from 'antd';

import { Gstr9Table5 } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

type T5Key = keyof Gstr9Table5;

const TABLE5_ROWS: { key: T5Key; label: string }[] = [
    { key: 'zero_rtd', label: '5A — Zero-Rated Supplies without IGST payment' },
    { key: 'sez', label: '5B — Supplies to SEZ without IGST payment' },
    { key: 'rchrg', label: '5C — Supplies on which recipient pays RCM tax' },
    { key: 'exmt', label: '5D — Exempted Supplies' },
    { key: 'nil', label: '5E — Nil-Rated Supplies' },
    { key: 'non_gst', label: '5F — Non-GST Outward Supplies' },
    { key: 'cr_nt', label: '5G — Credit Notes on non-taxable supplies' },
    { key: 'dr_nt', label: '5H — Debit Notes on non-taxable supplies' },
    { key: 'amd_pos', label: '5I — Amendments (Positive)' },
    { key: 'amd_neg', label: '5J — Amendments (Negative)' },
];

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Component ────────────────────────────────────────────────────────────────

const Table5NonTaxable = ({
    table5,
    footer,
}: {
    table5?: Gstr9Table5;
    footer: React.ReactNode;
}) => (
    <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
        <div className="px-5 pt-5 pb-3">
            <Typography.Text className="font-semibold" style={{ fontSize: 16, color: '#1e293b' }}>
                Non-Taxable Outward Supplies (Turnover only, no tax)
            </Typography.Text>
        </div>

        <div className="mx-4 mb-4 border border-[#eaecf0] rounded-xl overflow-hidden">
            {TABLE5_ROWS.map(row => {
                const txval = table5?.[row.key]?.txval;
                return (
                    <div
                        key={row.key}
                        className="flex items-center justify-between border-b border-[#eaecf0] last:border-b-0 hover:bg-[#fafafa] transition-colors px-5"
                        style={{ minHeight: 52 }}
                    >
                        <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                            {row.label}
                        </Typography.Text>
                        {txval !== undefined && (
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {fmt(txval)}
                            </Typography.Text>
                        )}
                    </div>
                );
            })}
        </div>

        <Divider className="m-0" />
        <Flex justify="space-between" wrap="wrap" gap={8} className="px-5 py-4">
            {footer}
        </Flex>
    </div>
);

export default Table5NonTaxable;
