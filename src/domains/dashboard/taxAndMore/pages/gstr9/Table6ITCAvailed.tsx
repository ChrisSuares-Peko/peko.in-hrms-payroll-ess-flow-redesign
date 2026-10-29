import { WarningOutlined } from '@ant-design/icons';
import { Divider, Flex, Typography } from 'antd';

import { Gstr9Table6, Gstr9Table8 } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Typography.Text className="font-medium text-sm block mb-3" style={{ color: '#1e293b' }}>
        {children}
    </Typography.Text>
);

const TaxCell = ({
    label,
    amount,
    color = '#1e293b',
}: {
    label: string;
    amount: number;
    color?: string;
}) => (
    <Flex vertical gap={2} align="center">
        <Typography.Text className="text-sm font-medium uppercase" style={{ color: '#94a3b8' }}>
            {label}
        </Typography.Text>
        <Typography.Text className="font-medium text-sm" style={{ color }}>
            {amount < 0 ? '-' : ''}
            {fmt(amount)}
        </Typography.Text>
    </Flex>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Table6ITCAvailed = ({
    table6,
    table8,
    footer,
}: {
    table6?: Gstr9Table6;
    table8?: Gstr9Table8;
    footer: React.ReactNode;
}) => {
    const itc3b = table6?.itc_3b;
    const itc2b = table8?.itc_2b;
    const isd = table6?.isd;
    const tran1 = table6?.tran1;
    const tran2 = table6?.tran2;

    const diffIgst = (itc2b?.iamt ?? 0) - (itc3b?.iamt ?? 0);
    const diffCgst = (itc2b?.camt ?? 0) - (itc3b?.camt ?? 0);
    const diffSgst = (itc2b?.samt ?? 0) - (itc3b?.samt ?? 0);
    const hasDiff = diffIgst !== 0 || diffCgst !== 0 || diffSgst !== 0;

    const TOTAL_ITC_CARDS = [
        { label: 'IGST', amount: itc3b?.iamt ?? 0 },
        { label: 'CGST', amount: itc3b?.camt ?? 0 },
        { label: 'SGST', amount: itc3b?.samt ?? 0 },
        { label: 'CESS', amount: itc3b?.csamt ?? 0 },
    ];

    const READ_ONLY_ROWS = [
        {
            label: 'ISD (Input Service Distributor)',
            igst: isd?.iamt ?? 0,
            cgst: isd?.camt ?? 0,
            sgst: isd?.samt ?? 0,
        },
        {
            label: 'ITC from TRAN-1',
            igst: tran1?.iamt ?? 0,
            cgst: tran1?.camt ?? 0,
            sgst: tran1?.samt ?? 0,
        },
        {
            label: 'ITC from TRAN-2',
            igst: tran2?.iamt ?? 0,
            cgst: tran2?.camt ?? 0,
            sgst: tran2?.samt ?? 0,
        },
    ];

    const COMPARISON_ROWS = [
        {
            label: 'GSTN auto-populated (itc_2b)',
            igst: itc2b?.iamt ?? 0,
            cgst: itc2b?.camt ?? 0,
            sgst: itc2b?.samt ?? 0,
            negative: false,
        },
        {
            label: 'Claimed in GSTR-3B (itc_tot)',
            igst: itc3b?.iamt ?? 0,
            cgst: itc3b?.camt ?? 0,
            sgst: itc3b?.samt ?? 0,
            negative: false,
        },
        {
            label: 'DifferenceABC',
            igst: diffIgst,
            cgst: diffCgst,
            sgst: diffSgst,
            negative: hasDiff,
        },
    ];

    return (
        <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
            <div className="px-5 pt-5 pb-4">
                <Typography.Text className="font-medium" style={{ fontSize: 16, color: '#1e293b' }}>
                    ITC Availed (from GSTR-3B filings)
                </Typography.Text>
            </div>

            <Flex vertical gap={20} className="px-5 pb-5">
                {/* 6B — Total ITC */}
                <div>
                    <SectionLabel>6B — Total ITC as per GSTR-3B</SectionLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                        {TOTAL_ITC_CARDS.map(({ label, amount }) => (
                            <div
                                key={label}
                                className="border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center justify-center"
                                style={{ backgroundColor: '#f8fafc' }}
                            >
                                <TaxCell label={label} amount={amount} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6A — Capital Goods & Input Services — commented out, not returned by API
                <div>
                    <SectionLabel>6A — Break-up by Supply Type <span className="font-normal text-xs" style={{ color: '#94a3b8' }}>(fill manually)</span></SectionLabel>
                    <div className="border border-[#eaecf0] rounded-xl overflow-hidden mt-2">
                        {['Capital Goods', 'Input Services'].map((rowLabel, i) => (
                            <div
                                key={rowLabel}
                                className={`flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-[#fafafa] transition-colors ${i === 0 ? 'border-b border-[#eaecf0]' : ''}`}
                            >
                                <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
                                    {rowLabel}
                                </Typography.Text>
                                <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>Not in portal response — fill in GSTR-9 form</Typography.Text>
                            </div>
                        ))}
                    </div>
                </div>
                */}

                {/* 6C/6D — ISD, TRAN-1, TRAN-2 */}
                <div>
                    <SectionLabel>6C / 6D — ISD &amp; Transitional ITC</SectionLabel>
                    <div className="border border-[#eaecf0] mt-2 rounded-xl overflow-hidden">
                        {READ_ONLY_ROWS.map((row, i) => (
                            <div
                                key={row.label}
                                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-[#fafafa] transition-colors ${i < READ_ONLY_ROWS.length - 1 ? 'border-b border-[#eaecf0]' : ''}`}
                            >
                                <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                                    {row.label}
                                </Typography.Text>
                                <Flex gap={24} wrap="wrap">
                                    <TaxCell label="IGST" amount={row.igst} />
                                    <TaxCell label="CGST" amount={row.cgst} />
                                    <TaxCell label="SGST" amount={row.sgst} />
                                </Flex>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GSTR-2B comparison */}
                <div>
                    <SectionLabel>
                        ITC from GSTR-2B – Table 8 comparison{' '}
                        <span className="font-normal text-xs" style={{ color: '#94a3b8' }}>
                            (differenceABC = itc_2b – itc_3b)
                        </span>
                    </SectionLabel>
                    <div>
                        {COMPARISON_ROWS.map((row, i) => {
                            const color = row.negative ? '#ef4444' : '#475569';
                            return (
                                <div
                                    key={row.label}
                                    className={`grid items-center py-3 ${i === 1 ? 'border-b border-[#eaecf0]' : ''}`}
                                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}
                                >
                                    <Typography.Text
                                        className={`text-sm${i === 2 ? ' font-medium' : ''}`}
                                        style={{ color: '#1e293b' }}
                                    >
                                        {row.label}
                                    </Typography.Text>
                                    {[
                                        { label: 'IGST', val: row.igst },
                                        { label: 'CGST', val: row.cgst },
                                        { label: 'SGST', val: row.sgst },
                                    ].map(({ label, val }) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-start gap-1"
                                        >
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                {label}
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-sm font-medium"
                                                style={{ color }}
                                            >
                                                {val < 0 ? '-' : ''}
                                                {fmt(val)}
                                            </Typography.Text>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {hasDiff && (
                        <Flex
                            gap={8}
                            align="center"
                            className="mt-3 border rounded-xl px-4 py-3"
                            style={{ borderColor: '#EF4444', backgroundColor: '#fff5f5' }}
                        >
                            <WarningOutlined
                                style={{ color: '#EF4444', fontSize: 14, flexShrink: 0 }}
                            />
                            <Typography.Text className="text-sm" style={{ color: '#EF4444' }}>
                                Excess ITC claimed vs GSTR-2B — reversal may be required under Rule
                                42/43
                            </Typography.Text>
                        </Flex>
                    )}
                </div>
            </Flex>

            <Divider className="m-0" />
            <Flex justify="space-between" wrap="wrap" gap={8} className="px-5 py-4">
                {footer}
            </Flex>
        </div>
    );
};

export default Table6ITCAvailed;
