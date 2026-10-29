import { Divider, Flex, Typography } from 'antd';

import { Gstr9Table6 } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const GRID4 = '2.5fr 1fr 1fr 1fr';
const HEADERS4 = ['ITC Type', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="px-5 pt-4 pb-2">
        <Typography.Text className="font-medium text-sm" style={{ color: '#1e293b' }}>
            {children}
        </Typography.Text>
    </div>
);

// igst / cess accept null when the field is absent from the API response (renders as "—")
const ReadRow4 = ({
    label,
    igst,
    cgst,
    sgst,
}: {
    label: string;
    igst: number | null;
    cgst: number;
    sgst: number;
}) => (
    <div
        className="grid items-center hover:bg-[#fafafa] transition-colors"
        style={{ gridTemplateColumns: GRID4, minHeight: 52, minWidth: 520 }}
    >
        <div className="px-5 py-3">
            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                {label}
            </Typography.Text>
        </div>
        <div className="px-5 py-3">
            <Typography.Text
                className="text-sm"
                style={{ color: igst !== null ? '#475569' : '#94a3b8' }}
            >
                {igst !== null ? fmt(igst) : '—'}
            </Typography.Text>
        </div>
        <div className="px-5 py-3">
            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                {fmt(cgst)}
            </Typography.Text>
        </div>
        <div className="px-5 py-3">
            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                {fmt(sgst)}
            </Typography.Text>
        </div>
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Gstr9FormTable6 = ({
    initialTable6,
    footer,
}: {
    initialTable6?: Gstr9Table6;
    footer: React.ReactNode;
}) => {
    const itc3b = initialTable6?.itc_3b;
    const isd = initialTable6?.isd;
    const tran1 = initialTable6?.tran1;
    const tran2 = initialTable6?.tran2;

    return (
        <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
            <div className="px-5 pt-5 pb-2">
                <Typography.Text className="font-medium" style={{ fontSize: 15, color: '#1e293b' }}>
                    ITC Availed
                </Typography.Text>
            </div>

            {/* 6A — Capital Goods / Input Services — not in auto-calc response (only in Details API)
            <SectionTitle>6A — Non-Reverse Charge Supplies</SectionTitle>
            <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: GRID3, minWidth: 560 }}>
                    {['ITC Type', 'IGST (₹)', 'CGST (₹)', 'SGST (₹)'].map(h => (
                        <div key={h} className="px-5 py-3 text-xs font-medium" style={{ color: '#1e293b' }}>{h}</div>
                    ))}
                </div>
                <ReadRow3 label="Capital Goods"  igst={0} cgst={0} sgst={0} />
                <ReadRow3 label="Input Services" igst={0} cgst={0} sgst={0} />
            </div>
            <Divider className="m-0" />
            */}

            {/* 6B — itc_3b: iamt ✅ camt ✅ samt ✅ csamt ✅ */}
            <SectionTitle>6B — Total ITC from GSTR-3B (auto-calculated)</SectionTitle>
            <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: GRID4, minWidth: 520 }}>
                    {HEADERS4.map(h => (
                        <div
                            key={h}
                            className="px-5 py-3 text-xs font-medium"
                            style={{ color: '#1e293b' }}
                        >
                            {h}
                        </div>
                    ))}
                </div>
                <ReadRow4
                    label="6B — ITC as per GSTR-3B"
                    igst={itc3b?.iamt ?? 0}
                    cgst={itc3b?.camt ?? 0}
                    sgst={itc3b?.samt ?? 0}
                />
            </div>

            <Divider className="m-0" />

            {/* 6C/6D — isd: all 4 ✅  tran1/tran2: only camt+samt ✅, iamt/csamt not in API */}
            <SectionTitle>6C/6D — ISD Credits + TRAN-1 / TRAN-2</SectionTitle>
            <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: GRID4, minWidth: 520 }}>
                    {HEADERS4.map(h => (
                        <div
                            key={h}
                            className="px-5 py-3 text-xs font-medium"
                            style={{ color: '#1e293b' }}
                        >
                            {h}
                        </div>
                    ))}
                </div>
                <ReadRow4
                    label="6C — Input Service Distributor (ISD)"
                    igst={isd?.iamt ?? 0}
                    cgst={isd?.camt ?? 0}
                    sgst={isd?.samt ?? 0}
                />
                {/* tran1: API returns only camt + samt */}
                <ReadRow4
                    label="6G — Credit carried forward from TRAN-1"
                    igst={null}
                    cgst={tran1?.camt ?? 0}
                    sgst={tran1?.samt ?? 0}
                />
                <ReadRow4
                    label="6H — Credit carried forward from TRAN-2"
                    igst={null}
                    cgst={tran2?.camt ?? 0}
                    sgst={tran2?.samt ?? 0}
                />
            </div>

            <Divider className="m-0" />

            <Flex justify="space-between" wrap="wrap" gap={8} className="px-5 pb-5 mt-4">
                {footer}
            </Flex>
        </div>
    );
};

export default Gstr9FormTable6;
