import { Flex, Typography } from 'antd';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS = [
    { label: '7A — Rule 37 (Payment not made within 180 days)' },
    { label: '7B — Rule 39 (ISD distributor reversal)' },
    { label: '7C — Rule 42 (Proportionate reversal — mixed use)' },
    { label: '7D — Rule 43 (Capital goods proportionate reversal)' },
    { label: '7E — Section 17(5) Blocked Credits' },
];

const COLS = ['Reversal Type', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)'];
const GRID = '3fr 1fr 1fr 1fr';

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Component ────────────────────────────────────────────────────────────────

const Table7Reversals = ({ footer }: { footer: React.ReactNode }) => (
    <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
        <div className="px-5 pt-5 pb-3">
            <Typography.Text className="font-medium" style={{ fontSize: 15, color: '#1e293b' }}>
                ITC Reversals
            </Typography.Text>
        </div>

        <div className="mx-4 border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div
                className="grid bg-[#fafbfb] border-b border-[#e2e8f0]"
                style={{ gridTemplateColumns: GRID }}
            >
                {COLS.map(col => (
                    <div
                        key={col}
                        className="px-5 py-3 text-xs font-medium"
                        style={{ color: '#42526d' }}
                    >
                        {col}
                    </div>
                ))}
            </div>

            {ROWS.map((row, i) => (
                <div
                    key={row.label}
                    className={`grid items-center hover:bg-[#fafafa] transition-colors ${i < ROWS.length - 1 ? 'border-b border-[#e2e8f0]' : ''}`}
                    style={{ gridTemplateColumns: GRID, minHeight: 52 }}
                >
                    <div className="px-5 py-3">
                        <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                            {row.label}
                        </Typography.Text>
                    </div>
                    {[0, 0, 0].map((_, j) => (
                        <div key={j} className="px-5 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                                {fmt(0)}
                            </Typography.Text>
                        </div>
                    ))}
                </div>
            ))}
        </div>

        <Flex justify="space-between" wrap="wrap" gap={8} className="px-5 py-5">
            {footer}
        </Flex>
    </div>
);

export default Table7Reversals;
