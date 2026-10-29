import { Divider, Flex, Typography } from 'antd';

import { Gstr9Table9 } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS: { key: keyof Gstr9Table9; label: string }[] = [
    { key: 'iamt', label: 'Integrated Tax (IGST)' },
    { key: 'camt', label: 'Central Tax (CGST)' },
    { key: 'samt', label: 'State/UT Tax (SGST)' },
    { key: 'csamt', label: 'CESS' },
    { key: 'intr', label: 'Interest' },
    { key: 'fee', label: 'Late Fee' },
];

const COLS = [
    'Tax Head',
    'Tax Payable (₹)',
    'Paid via ITC (₹)',
    'Paid via Cash (₹)',
    'Shortfall (₹)',
];
const GRID = '2fr 1fr 1fr 1fr 1fr';

const fmt = (n: number) =>
    `₹ ${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const shortfall = (row: Gstr9Table9[keyof Gstr9Table9]) => {
    if (!row) return 0;
    const itc =
        (row.tax_paid_itc_iamt ?? 0) + (row.tax_paid_itc_camt ?? 0) + (row.tax_paid_itc_samt ?? 0);
    return (row.txpyble ?? 0) - itc - (row.txpaid_cash ?? 0);
};

// ─── Component ────────────────────────────────────────────────────────────────

const Table9TaxPayment = ({
    table9,
    footer,
}: {
    table9?: Gstr9Table9;
    footer: React.ReactNode;
}) => (
    <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
        <div className="px-5 pt-5 pb-3">
            <Typography.Text className="font-semibold" style={{ fontSize: 16, color: '#1e293b' }}>
                Tax Payment Summary (from GSTR-3B filings)
            </Typography.Text>
        </div>

        <div className="mx-4 mb-4 border border-[#eaecf0] rounded-xl overflow-hidden overflow-x-auto">
            <div
                className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                style={{ gridTemplateColumns: GRID, minWidth: 640 }}
            >
                {COLS.map(col => (
                    <div
                        key={col}
                        className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                        style={{ color: '#42526d' }}
                    >
                        {col}
                    </div>
                ))}
            </div>

            {ROWS.map(({ key, label }) => {
                const row = table9?.[key];
                const itcPaid =
                    (row?.tax_paid_itc_iamt ?? 0) +
                    (row?.tax_paid_itc_camt ?? 0) +
                    (row?.tax_paid_itc_samt ?? 0);
                const sf = shortfall(row);
                return (
                    <div
                        key={key}
                        className="grid items-center border-b border-[#eaecf0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
                        style={{ gridTemplateColumns: GRID, minHeight: 52, minWidth: 640 }}
                    >
                        <div className="px-4 py-3">
                            <Typography.Text
                                className="text-sm font-medium"
                                style={{ color: '#1e293b' }}
                            >
                                {label}
                            </Typography.Text>
                        </div>
                        <div className="px-4 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {fmt(row?.txpyble ?? 0)}
                            </Typography.Text>
                        </div>
                        <div className="px-4 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {fmt(itcPaid)}
                            </Typography.Text>
                        </div>
                        <div className="px-4 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {fmt(row?.txpaid_cash ?? 0)}
                            </Typography.Text>
                        </div>
                        <div className="px-4 py-3">
                            <Typography.Text
                                className="text-sm font-medium"
                                style={{ color: sf > 0 ? '#ef4444' : '#16a34a' }}
                            >
                                {sf > 0 ? '-' : ''}
                                {fmt(sf)}
                            </Typography.Text>
                        </div>
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

export default Table9TaxPayment;
