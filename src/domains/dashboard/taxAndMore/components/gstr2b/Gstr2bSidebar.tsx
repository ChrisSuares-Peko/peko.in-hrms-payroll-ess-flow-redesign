import { DownloadOutlined, WarningOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import type { Gstr2bItcSummary } from '../../types';
import { fmt } from '../../utils/gstr2bConstants';
import type { Gstr2bRow } from '../../utils/gstr2bTypes';

interface Props {
    itcSummary: Gstr2bItcSummary | null;
    b2bRows: Gstr2bRow[];
    hasData: boolean;
    onDownloadReport: () => void;
}

const n = (v: number | null | undefined) => v ?? 0;

const Gstr2bSidebar = ({ itcSummary, b2bRows, hasData, onDownloadReport }: Props) => {
    const nonrev = itcSummary?.itcavl?.nonrevsup;
    const b2bItc = n(nonrev?.b2b?.igst) + n(nonrev?.b2b?.cgst) + n(nonrev?.b2b?.sgst);
    const impgItc = n(nonrev?.impg?.igst);
    const isdItc = n(nonrev?.isd?.igst) + n(nonrev?.isd?.cgst) + n(nonrev?.isd?.sgst);
    const cdnAdj = n(nonrev?.cdn?.igst);
    const tdsCred = n(nonrev?.tds?.cgst) + n(nonrev?.tds?.sgst);
    const totalItc = b2bItc + impgItc + isdItc - cdnAdj + tdsCred;

    const matchedItc = b2bRows.filter(r => r.status === 'Matched').reduce((s, r) => s + r.itc, 0);
    const unmatchedItc = b2bRows.filter(r => r.status !== 'Matched').reduce((s, r) => s + r.itc, 0);
    const ineligibleRows = b2bRows.filter(r => r.itcAvailable === false);
    const ineligibleCount = ineligibleRows.length;
    const ineligibleAmount = ineligibleRows.reduce((s, r) => s + r.itc, 0);
    const matchedPct = totalItc > 0 ? (matchedItc / totalItc) * 100 : 0;
    const unmatchedPct = totalItc > 0 ? (unmatchedItc / totalItc) * 100 : 0;

    const dash = '–';
    const v = (val: number) => (hasData ? `₹${fmt(val)}` : dash);

    const breakdown = [
        { label: 'B2B ITC', value: v(b2bItc), color: '#1e293b' },
        { label: 'IMPG ITC', value: v(impgItc), color: '#1e293b' },
        { label: 'ISD ITC', value: v(isdItc), color: '#1e293b' },
        {
            label: 'CDN Adj.',
            value: hasData ? `${cdnAdj < 0 ? '-' : ''}₹${fmt(Math.abs(cdnAdj))}` : dash,
            color: cdnAdj !== 0 ? '#ef4444' : '#1e293b',
        },
        { label: 'TDS Cred.', value: v(tdsCred), color: '#1e293b' },
    ];

    return (
        <Flex
            vertical
            gap={12}
            justify="space-between"
            style={{ flex: '1 1 300px', minWidth: 0, maxWidth: '100%' }}
        >
            <Flex
                vertical
                gap={12}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-5 py-4"
            >
                <Flex gap={6} align="center">
                    <Typography.Text
                        className="font-semibold"
                        style={{ fontSize: 15, color: '#1e293b' }}
                    >
                        ITC Summary
                    </Typography.Text>
                    <Typography.Text className="text-xs" style={{ color: '#475569' }}>
                        (All periods)
                    </Typography.Text>
                </Flex>

                <Flex vertical gap={2}>
                    <Typography.Text style={{ fontSize: 13, color: '#475569' }}>
                        Total GSTR-2B ITC
                    </Typography.Text>
                    <Typography.Text
                        className="font-bold"
                        style={{ fontSize: 24, color: '#1e293b', lineHeight: '32px' }}
                    >
                        {hasData ? `₹${fmt(totalItc)}` : dash}
                    </Typography.Text>
                </Flex>

                <Flex vertical gap={5}>
                    <Flex align="center" justify="space-between">
                        <Typography.Text
                            className="font-medium"
                            style={{ fontSize: 13, color: '#43b75d' }}
                        >
                            Matched
                        </Typography.Text>
                        <Typography.Text
                            className="font-medium"
                            style={{ fontSize: 13, color: '#43b75d' }}
                        >
                            {v(matchedItc)}
                        </Typography.Text>
                    </Flex>
                    <div
                        className="rounded-full overflow-hidden"
                        style={{ height: 7, backgroundColor: '#ecfdf5' }}
                    >
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${matchedPct.toFixed(1)}%`,
                                backgroundColor: '#43b75d',
                            }}
                        />
                    </div>
                    <Typography.Text className="text-xs" style={{ color: '#43b75d' }}>
                        {hasData ? `${matchedPct.toFixed(1)}% of total` : dash}
                    </Typography.Text>
                </Flex>

                <Flex vertical gap={3}>
                    <Flex align="center" justify="space-between">
                        <Typography.Text
                            className="font-medium"
                            style={{ fontSize: 13, color: '#f59e0b' }}
                        >
                            Unmatched / At Risk
                        </Typography.Text>
                        <Typography.Text
                            className="font-medium"
                            style={{ fontSize: 13, color: '#f59e0b' }}
                        >
                            {v(unmatchedItc)}
                        </Typography.Text>
                    </Flex>
                    <Typography.Text className="text-xs" style={{ color: '#f59e0b' }}>
                        {hasData ? `${unmatchedPct.toFixed(1)}% of total` : dash}
                    </Typography.Text>
                </Flex>

                <div className="border-t border-[#e2e8f0]" />

                <Flex vertical gap={10}>
                    {breakdown.map(row => (
                        <Flex key={row.label} align="center" justify="space-between">
                            <Typography.Text style={{ fontSize: 13, color: '#475569' }}>
                                {row.label}
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 13, color: row.color }}>
                                {row.value}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            </Flex>

            <button
                type="button"
                disabled={!hasData}
                onClick={onDownloadReport}
                className="flex items-center justify-center gap-3 border border-[#cbd5e1] rounded-lg w-full font-medium transition-colors hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: 36, fontSize: 13, color: '#475569', backgroundColor: 'white' }}
            >
                <DownloadOutlined style={{ fontSize: 16 }} />
                Download Reconciliation Report
            </button>

            {hasData && ineligibleCount > 0 && (
                <Flex
                    gap={8}
                    align="center"
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
                >
                    <WarningOutlined style={{ fontSize: 14, color: '#f59e0b', flexShrink: 0 }} />
                    <Flex vertical gap={0}>
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#92400e' }}
                        >
                            {ineligibleCount} ineligible invoice{ineligibleCount !== 1 ? 's' : ''}
                        </Typography.Text>
                        <Typography.Text className="text-[11px]" style={{ color: '#b45309' }}>
                            ₹{fmt(ineligibleAmount)} ITC blocked
                        </Typography.Text>
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
};

export default Gstr2bSidebar;
