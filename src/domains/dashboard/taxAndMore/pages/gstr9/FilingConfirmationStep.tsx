import { CheckCircleFilled, DownloadOutlined, WarningFilled } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Typography } from 'antd';

import { FilingConfirmationData } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// "032024" → "Apr 2023 – Mar 2024"  |  "2023-24" fallback → "Apr 2023 – Mar 2024"
const getFYCoverage = (retPeriod: string, financialYear?: string): string => {
    if (retPeriod && retPeriod.length >= 6) {
        const year = parseInt(retPeriod.slice(2), 10);
        return `Apr ${year - 1} – Mar ${year}`;
    }
    if (financialYear) {
        const parts = financialYear.split('-');
        if (parts.length === 2) {
            const startYear = parseInt(parts[0], 10);
            return `Apr ${startYear} – Mar ${startYear + 1}`;
        }
    }
    return '—';
};

const formatDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return iso;
    }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoPill = ({ label, value }: { label: string; value: string }) => (
    <div
        className="border border-[#e2e8f0] rounded-xl px-6 h-16 flex flex-col justify-center gap-1"
        style={{ background: '#F8FAFC' }}
    >
        <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
            {label}
        </Typography.Text>
        <Typography.Text className="font-semibold" style={{ fontSize: 15, color: '#1e293b' }}>
            {value}
        </Typography.Text>
    </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-3">
        <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
            {label}
        </Typography.Text>
        <Typography.Text
            className="text-sm font-medium text-right"
            style={{ color: '#1e293b', maxWidth: '55%' }}
        >
            {value}
        </Typography.Text>
    </div>
);

const GSTR9C_BADGES = [
    { label: 'Mandatory: turnover > ₹5 Cr' },
    { label: 'Self-certified since FY 2020-21' },
    { label: 'No CA signature required' },
];

const GSTR9C_COVERS = [
    'Table 5: Reconciliation of gross turnover (GSTR-9 vs books)',
    // 'Table 7: Reconciliation of tax payable with audited P&L',
    // 'Table 12-16: Reconciliation of ITC as declared in GSTR-9 vs books',
];

// ─── Component ────────────────────────────────────────────────────────────────

const FilingConfirmationStep = ({
    data,
    isDownloading,
    onDownload,
    onDashboard,
}: {
    data: FilingConfirmationData | null;
    isDownloading: boolean;
    onDownload: () => void;
    onDashboard: () => void;
}) => {
    const fyCoverage = getFYCoverage(data?.retPeriod ?? '', data?.financialYear);
    const filedOnStr = data?.filedAt ? formatDate(data.filedAt) : '—';
    const isCrThreshold = (data?.aggTurnover ?? 0) > 5_00_00_000;

    const arnInfo = [
        { label: 'Acknowledgement Number (ARN)', value: data?.arn ?? '—' },
        { label: 'FY Coverage', value: fyCoverage },
        { label: 'Filed On', value: filedOnStr },
    ];

    const summaryCards = [
        { value: fmt(data?.aggTurnover ?? 0), label: 'Aggregate Turnover' },
        { value: fmt(data?.igstPayable ?? 0), label: 'Total IGST Payable' },
        { value: fmt(data?.igstItcAvailed ?? 0), label: 'ITC Availed (IGST)' },
        { value: fmt(data?.igstCashPaid ?? 0), label: 'Cash Paid (IGST)' },
    ];

    const filingDetails = [
        { label: 'GSTIN', value: data?.gstin ?? '—' },
        { label: 'Legal Name', value: data?.legalName || '—' },
        { label: 'Financial Year', value: `FY ${data?.financialYear ?? '—'}` },
        { label: 'Filing Period', value: fyCoverage },
        { label: 'Aggregate Annual Turnover', value: fmt(data?.aggTurnover ?? 0) },
        { label: 'Return Type', value: 'Annual Return' },
    ];

    return (
        <div className="border border-[#e2e8f0] rounded-[14px] bg-white overflow-hidden mt-2">
            <div className="px-4 sm:px-10 pt-6 sm:pt-8 pb-6">
                <Flex vertical gap={20}>
                    {/* Success header */}
                    <Flex vertical align="center" gap={8}>
                        <div
                            className="flex items-center justify-center rounded-full"
                            style={{ width: 56, height: 56, background: '#dcfce7' }}
                        >
                            <CheckCircleFilled style={{ fontSize: 28, color: '#16a34a' }} />
                        </div>
                        <Typography.Text
                            className="font-bold text-center"
                            style={{ fontSize: 20, color: '#1e293b' }}
                        >
                            GSTR-9 Filed Successfully!
                        </Typography.Text>
                        <Typography.Text
                            className="text-sm text-center"
                            style={{ color: '#64748b' }}
                        >
                            Annual Return for FY {data?.financialYear ?? '—'} submitted to GSTN
                        </Typography.Text>
                    </Flex>

                    {/* ARN / FY Coverage / Filed On pills */}
                    <Row gutter={[12, 12]}>
                        {arnInfo.map(info => (
                            <Col key={info.label} xs={24} sm={8}>
                                <InfoPill {...info} />
                            </Col>
                        ))}
                    </Row>

                    {/* Summary cards */}
                    <div className="mt-5">
                        <Typography.Text
                            className="font-semibold text-sm block mb-3"
                            style={{ color: '#1e293b' }}
                        >
                            Annual Return Filing Summary
                        </Typography.Text>
                        <Row className="mt-3" gutter={[12, 12]}>
                            {summaryCards.map(card => (
                                <Col key={card.label} xs={12} sm={6}>
                                    <div
                                        className="border border-[#e2e8f0] rounded-xl px-5 py-4"
                                        style={{ background: '#F8FAFC' }}
                                    >
                                        <Typography.Text
                                            className="font-bold block mb-1"
                                            style={{ fontSize: 16, color: '#1e293b' }}
                                        >
                                            {card.value}
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-xs"
                                            style={{ color: '#64748b' }}
                                        >
                                            {card.label}
                                        </Typography.Text>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>

                    {/* Filing details */}
                    <div className="border mt-3 border-[#e2e8f0] rounded-xl px-5 py-1">
                        {filingDetails.map(row => (
                            <DetailRow key={row.label} {...row} />
                        ))}
                    </div>

                    {/* GSTR-9C advisory */}
                    <div
                        className="border border-[#F59E0B] rounded-xl overflow-hidden"
                        style={{ background: '#fffbeb' }}
                    >
                        <div className="px-6 py-5">
                            {/* Heading */}
                            <Flex gap={8} align="center" className="mb-3">
                                <WarningFilled
                                    style={{ color: '#F59E0B', fontSize: 16, flexShrink: 0 }}
                                />
                                <Typography.Text
                                    className="font-bold text-sm"
                                    style={{ color: '#F59E0B' }}
                                >
                                    GSTR-9C — Reconciliation Statement
                                </Typography.Text>
                            </Flex>

                            {/* Description */}
                            <Typography.Text
                                className="text-sm block mb-1"
                                style={{ color: '#F59E0B' }}
                            >
                                If your aggregate annual turnover exceeds ₹5 Crore, you are also
                                required to file GSTR-9C — a self-certified reconciliation statement
                                that reconciles the figures in GSTR-9 with your audited financial
                                statements.
                            </Typography.Text>
                            <Typography.Text
                                className="text-sm block mb-4"
                                style={{ color: '#F59E0B' }}
                            >
                                <strong>Deadline:</strong> 31 December — same as GSTR-9. Typically
                                filed together with GSTR-9 or immediately after.
                            </Typography.Text>

                            {/* Badges */}
                            <Flex gap={8} wrap="wrap" className="mb-4 mt-2">
                                {GSTR9C_BADGES.map(b => (
                                    <span
                                        key={b.label}
                                        className="px-4 py-2 rounded-full text-sm font-medium"
                                        style={{ background: '#FEF3C7', color: '#F59E0B' }}
                                    >
                                        {b.label}
                                    </span>
                                ))}
                            </Flex>

                            {/* Covers box */}
                            <div
                                className="rounded-xl px-4 py-4 mb-4"
                                style={{ background: '#ffffff' }}
                            >
                                <Typography.Text
                                    className="font-semibold text-sm block mb-2"
                                    style={{ color: '#F59E0B' }}
                                >
                                    GSTR-9C covers:
                                </Typography.Text>
                                <Flex vertical gap={4}>
                                    {GSTR9C_COVERS.map(c => (
                                        <Typography.Text
                                            key={c}
                                            className="text-sm block"
                                            style={{ color: '#F59E0B', paddingLeft: 8 }}
                                        >
                                            {c}
                                        </Typography.Text>
                                    ))}
                                </Flex>
                            </div>

                            {/* Turnover note */}
                            <Typography.Text className="text-sm" style={{ color: '#F59E0B' }}>
                                Your aggregate turnover for FY {data?.financialYear ?? '—'}:{' '}
                                <strong>{fmt(data?.aggTurnover ?? 0)}</strong> — GSTR-9C is{' '}
                                <strong>{isCrThreshold ? 'mandatory' : 'not mandatory'}</strong> (
                                {isCrThreshold ? 'above' : 'below'} ₹5 Cr threshold).
                            </Typography.Text>
                        </div>
                    </div>
                </Flex>
            </div>

            {/* Footer */}
            <Divider className="m-0" />
            <Flex justify="space-between" wrap="wrap" gap={8} className="px-6 py-4">
                <Button
                    icon={<DownloadOutlined />}
                    loading={isDownloading}
                    onClick={onDownload}
                    style={{ height: 40 }}
                >
                    Download Annual Return PDF
                </Button>
                <Button type="primary" danger style={{ height: 40 }} onClick={onDashboard}>
                    Return to Dashboard
                </Button>
            </Flex>
        </div>
    );
};

export default FilingConfirmationStep;
