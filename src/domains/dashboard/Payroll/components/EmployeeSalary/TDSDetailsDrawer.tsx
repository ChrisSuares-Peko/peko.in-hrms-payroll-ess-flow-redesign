import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Popover, Row, Skeleton, Space, Typography } from 'antd';
import dayjs from 'dayjs';

import DrawerModal from '@components/atomic/DrawerModal';
import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import { SalaryProfileTdsDetails } from '../../types/salaryProfileTypes/employeeSalaryTable';

const { Title, Text } = Typography;

const fmt = (amount: number) => `₹${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount || 0))}`;

// "400000 -> 4L", "969000 -> 9.7L" — matches how the tax engine's own slab labels read
// elsewhere (e.g. "up to ₹12L").
const formatLakh = (amount: number) => {
    if (amount < 100000) return fmt(amount);
    const lakh = Math.round((amount / 100000) * 10) / 10;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
};

// Old regime has no marginal-relief messaging in this drawer — its rebate is a flat
// ₹12,500 cap, not the "capped at income over the threshold" mechanic new regime has.
const rebateRowLabel = (taxRegime: string, marginalRelief: number) => {
    if (taxRegime === 'Old Tax Regime') return 'Less: Section 87A rebate';
    if (marginalRelief > 0) return 'Less: Section 87A marginal relief';
    return 'Less: Section 87A rebate / marginal relief';
};

const rebateInfoStyle: React.CSSProperties = { padding: 16, borderRadius: 16, width: 380 };

const MUTED = '#94A3B8';
const BODY = '#535862';

// One lettered input of a tooltip's worked calculation — "A  Tax on the slabs … ₹10,87,500".
// The letters let the explanatory lines below refer back to each figure ("lower of A and B").
const LetterRow = ({ letter, label, value }: { letter: string; label: React.ReactNode; value: number }) => (
    <DetailRow
        label={
            <>
                <span style={{ color: MUTED, marginRight: 8 }}>{letter}</span>
                <span style={{ color: BODY }}>{label}</span>
            </>
        }
        value={<span style={{ color: BODY }}>{fmt(value)}</span>}
    />
);

// A subtotal built from the lettered rows ("A + B", "Tax = lower of A and B") — bold and
// indented under the letters so it reads as the result of the rows above it.
const ResultRow = ({ label, value }: { label: React.ReactNode; value: number }) => (
    <DetailRow label={<span style={{ paddingLeft: 20 }}>{label}</span>} value={fmt(value)} strong />
);

const TooltipNote = ({ children }: { children: React.ReactNode }) => (
    <Text className="text-xs" style={{ color: BODY }}>
        {children}
    </Text>
);

const TooltipFootnote = ({ children }: { children: React.ReactNode }) => (
    <Text className="text-xs" style={{ color: MUTED }}>
        {children}
    </Text>
);

// Explains whichever of the three mutually-exclusive 87A outcomes actually applied this
// month — matches rebateRowLabel's own branching so the icon's explanation always agrees
// with the label/value it sits beside. Laid out as a worked calculation (A, B, lower of the
// two) so the rebate can be checked by hand from the figures shown.
const RebateTooltipContent = ({ details }: { details: SalaryProfileTdsDetails }) => {
    if (details.taxRegime === 'Old Tax Regime') {
        return (
            <TooltipNote>
                Under the Old Tax Regime, Section 87A gives a rebate on tax — capped at ₹12,500 — when taxable
                income is within the regime&apos;s exemption threshold.
            </TooltipNote>
        );
    }

    // rebateLimit comes straight from the tax engine (services/salary.js) — the actual
    // FY/regime-specific threshold (₹5L old regime; ₹7L or ₹12L new regime depending on
    // FY), not a frontend guess, so this stays correct for a historical/already-paid month
    // too, not just the current one.
    const { rebateLimit } = details;
    const limitLabel = formatLakh(rebateLimit);
    const footnote = (
        <TooltipFootnote>
            No tax is payable up to {limitLabel} of taxable income. Just above it, the tax cannot be more than the
            amount by which income exceeds {limitLabel}.
        </TooltipFootnote>
    );

    // Taxable income within the limit — the whole slab tax is rebated.
    if (details.totalRebate > 0 && details.marginalRelief <= 0) {
        return (
            <Space direction="vertical" size={6} className="w-full">
                <Text strong>Section 87A — no tax payable</Text>
                <LetterRow letter="A" label="Tax on the slabs, before any rebate" value={details.taxBeforeRebate} />
                <TooltipNote>
                    Taxable income of {fmt(details.taxableIncome)} is within the {limitLabel} limit, so the whole of A
                    is rebated.
                </TooltipNote>
                <Divider className="my-1" />
                <DetailRow label="Rebate = A" value={fmt(details.totalRebate)} strong />
                {footnote}
            </Space>
        );
    }

    // Above the limit — tax is capped at the income above it (A vs B). With marginal relief
    // the cap bites (B below A) and the difference is rebated; otherwise A is already below B.
    const incomeAboveLimit = Math.max(0, details.taxableIncome - rebateLimit);
    const taxAfterCap = Math.min(details.taxBeforeRebate, incomeAboveLimit);
    const reliefApplies = details.marginalRelief > 0;

    return (
        <Space direction="vertical" size={6} className="w-full">
            <Text strong>{reliefApplies ? 'Section 87A — marginal relief' : 'Section 87A — no rebate'}</Text>
            <LetterRow letter="A" label="Tax on the slabs, before any rebate" value={details.taxBeforeRebate} />
            <LetterRow letter="B" label={`Income above the ${limitLabel} limit`} value={incomeAboveLimit} />
            <TooltipNote>
                Tax can never be more than the income above the limit, so tax = the lower of A and B.
            </TooltipNote>
            <ResultRow label="Tax = lower of A and B" value={taxAfterCap} />
            <Divider className="my-1" />
            {reliefApplies ? (
                <DetailRow label="B is below A, so marginal relief = A − B" value={fmt(details.totalRebate)} strong />
            ) : (
                <DetailRow label="A is already below B, so no rebate" value={fmt(0)} strong />
            )}
            {footnote}
        </Space>
    );
};

const RebateInfoIcon = ({ details }: { details: SalaryProfileTdsDetails }) => (
    <Popover
        content={<RebateTooltipContent details={details} />}
        trigger="hover"
        placement="left"
        overlayInnerStyle={rebateInfoStyle}
    >
        <InfoCircleOutlined
            data-testid="rebate-info"
            aria-label="Section 87A rebate — how it is worked out"
            style={{ fontSize: 13, color: '#535862', cursor: 'help' }}
        />
    </Popover>
);

// "5000000 -> ₹50L", "10000000 -> ₹1 Crore" — the four surcharge boundaries are the only
// values this ever sees, so a plain lakh/crore split (unlike formatLakh's rounding) is
// exact and reads the way the surcharge row's own label already does ("above ₹50L").
const formatThreshold = (amount: number) =>
    amount >= 10000000 ? `₹${amount / 10000000} Crore` : formatLakh(amount);

// Explains whichever of the three mutually-exclusive surcharge outcomes actually applied
// this month — no surcharge below ₹50L, a flat rate away from any boundary, or a rate
// capped down by marginal relief right after crossing one. surchargeRate/Threshold/
// BeforeRelief all come straight from the tax engine (services/salary.js), same reasoning
// as rebateLimit above — never re-derived from slab tables on the frontend.
const SurchargeTooltipContent = ({ details }: { details: SalaryProfileTdsDetails }) => {
    const { surchargeRate, surchargeThreshold, surchargeBeforeRelief, surcharge } = details;
    const taxAfterRebate = details.taxBeforeRebate - details.totalRebate;

    // Gated on `surcharge` itself, not `surchargeRate` — `surcharge` has existed since this
    // feature first shipped, so it's always a real number; the rate/threshold/before-relief
    // fields were added afterwards and can be missing on a record computed just before that
    // (or a stale API response), even though `surcharge` itself is already correct.
    if (!surcharge) {
        // The first surcharge band always starts at ₹50L (both regimes), so this is the
        // one boundary worth comparing against when nothing is charged.
        const surchargeStartsAbove = 5000000;
        const shortBy = surchargeStartsAbove - details.taxableIncome;
        return (
            <Space direction="vertical" size={6} className="w-full">
                <Text strong>Surcharge — not applicable</Text>
                <LetterRow letter="A" label="Taxable income for the year" value={details.taxableIncome} />
                <LetterRow letter="B" label="Surcharge starts above" value={surchargeStartsAbove} />
                <TooltipNote>
                    {shortBy > 0
                        ? `A is ${fmt(shortBy)} short of B, so there is nothing to charge.`
                        : 'A is not above B, so there is nothing to charge.'}
                </TooltipNote>
                <Divider className="my-1" />
                <DetailRow label="Surcharge" value={fmt(0)} strong />
                <TooltipFootnote>
                    Surcharge is an extra charge on the tax, not on income. It starts only once taxable income crosses
                    ₹50L.
                </TooltipFootnote>
            </Space>
        );
    }

    // A non-zero surcharge with no valid rate/threshold to explain it with — show the
    // amount plainly rather than risk NaN/undefined from missing fields.
    if (!Number.isFinite(surchargeRate) || surchargeRate <= 0 || !Number.isFinite(surchargeThreshold)) {
        return (
            <Space direction="vertical" size={6} className="w-full">
                <Text strong>Surcharge</Text>
                <LetterRow letter="A" label="Tax after the Section 87A rebate" value={taxAfterRebate} />
                <Divider className="my-1" />
                <DetailRow label="Surcharge" value={fmt(surcharge)} strong />
                <TooltipFootnote>
                    Applies once taxable income exceeds ₹50L, at 10–37% of tax depending on how far above.
                </TooltipFootnote>
            </Space>
        );
    }

    const ratePercent = Math.round(surchargeRate * 100);
    const thresholdLabel = formatThreshold(surchargeThreshold);
    const normalSurcharge = Number.isFinite(surchargeBeforeRelief) ? surchargeBeforeRelief : surcharge;
    const reliefApplied = normalSurcharge > surcharge;
    const header = (
        <>
            <Text strong>
                Surcharge — {ratePercent}% band (above {thresholdLabel})
            </Text>
            <TooltipNote>
                Taxable income {fmt(details.taxableIncome)} crosses {thresholdLabel}, so the rate is {ratePercent}% of
                the tax.
            </TooltipNote>
            <LetterRow letter="A" label="Tax after the Section 87A rebate" value={taxAfterRebate} />
            <LetterRow letter="B" label={`Surcharge = ${ratePercent}% of A`} value={normalSurcharge} />
            <ResultRow label="A + B" value={taxAfterRebate + normalSurcharge} />
        </>
    );

    if (reliefApplied) {
        // The engine caps tax + surcharge at (tax at exactly the threshold) + (income above
        // it), and sets surcharge = that cap − A. So the tax at the threshold (C) is exactly
        // recoverable from the engine's own figures: C = surcharge + A − D — no slab maths
        // re-done on the frontend. For a band above ₹50L, C includes the lower band's own
        // surcharge, which is what "tax at exactly ₹1 Crore" means for the cap.
        const incomeAboveThreshold = Math.max(0, details.taxableIncome - surchargeThreshold);
        const taxAtThreshold = surcharge + taxAfterRebate - incomeAboveThreshold;
        const cap = taxAtThreshold + incomeAboveThreshold;
        return (
            <Space direction="vertical" size={6} className="w-full">
                {header}
                <Text strong className="mt-1">
                    Marginal relief cap for the {thresholdLabel} band
                </Text>
                <LetterRow letter="C" label={`Tax at exactly ${thresholdLabel}`} value={taxAtThreshold} />
                <LetterRow letter="D" label={`Income earned above ${thresholdLabel}`} value={incomeAboveThreshold} />
                <ResultRow label="C + D" value={cap} />
                <TooltipNote>A + B is more than C + D, so the surcharge is trimmed to fit the cap.</TooltipNote>
                <Divider className="my-1" />
                <DetailRow label="Surcharge = (C + D) − A" value={fmt(surcharge)} strong />
                <TooltipFootnote>
                    Marginal relief saved {fmt(normalSurcharge - surcharge)}. Crossing {thresholdLabel} must never cost
                    more in extra tax than the extra income earned.
                </TooltipFootnote>
            </Space>
        );
    }

    return (
        <Space direction="vertical" size={6} className="w-full">
            {header}
            <Divider className="my-1" />
            <DetailRow label="Surcharge = B" value={fmt(surcharge)} strong />
            <TooltipFootnote>
                Income is far enough above {thresholdLabel} that the full {ratePercent}% applies — marginal relief only
                trims the surcharge just after crossing a band.
            </TooltipFootnote>
        </Space>
    );
};

const SurchargeInfoIcon = ({ details }: { details: SalaryProfileTdsDetails }) => (
    <Popover
        content={<SurchargeTooltipContent details={details} />}
        trigger="hover"
        placement="left"
        overlayInnerStyle={rebateInfoStyle}
    >
        <InfoCircleOutlined
            data-testid="surcharge-info"
            aria-label="Surcharge — how it is worked out and whether marginal relief applies"
            style={{ fontSize: 13, color: '#535862', cursor: 'help' }}
        />
    </Popover>
);

interface DetailRowProps {
    label: React.ReactNode;
    value: React.ReactNode;
    strong?: boolean;
    muted?: boolean;
    // For a label too long to sit beside its value without an ugly mid-wrap (e.g. one
    // naming a full date range) — label takes the full row, value sits right-aligned below.
    stacked?: boolean;
}

const DetailRow = ({ label, value, strong, muted, stacked }: DetailRowProps) => {
    const textStyle = muted ? { color: '#94A3B8' } : undefined;

    if (stacked) {
        return (
            <div style={{ width: '100%' }}>
                <Text style={textStyle} strong={strong}>
                    {label}
                </Text>
                <div style={{ width: '100%', textAlign: 'right' }}>
                    <Text style={textStyle} strong={strong}>
                        {value}
                    </Text>
                </div>
            </div>
        );
    }

    return (
        // columnGap keeps a long label (e.g. "Rebate = ₹60,750 − ₹5,000") from running
        // straight into its amount.
        <Row justify="space-between" wrap={false} style={{ columnGap: 16 }}>
            <Col flex="auto" style={{ minWidth: 0 }}>
                <Text style={textStyle} strong={strong}>
                    {label}
                </Text>
            </Col>
            <Col>
                <Text style={{ whiteSpace: 'nowrap', ...textStyle }} strong={strong}>
                    {value}
                </Text>
            </Col>
        </Row>
    );
};

const StepCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card size="small" bordered className="rounded-2xl">
        <Space direction="vertical" className="w-full" size={8}>
            <Text strong>{title}</Text>
            {children}
        </Space>
    </Card>
);

interface TDSDetailsDrawerProps {
    open: boolean;
    onClose: () => void;
    details: SalaryProfileTdsDetails | null;
    loading?: boolean;
}

const TDSDetailsDrawer = ({ open, onClose, details, loading }: TDSDetailsDrawerProps) => {
    // fy reads "2026-27" — the engine always projects across the full Apr–Mar year (no
    // DOJ-based mid-year proration exists yet, despite that being the eventual intent), so
    // "12 months" reflects what's actually computed today, not an aspirational window.
    const fyStartYear = details?.fy ? parseInt(details.fy.slice(0, 4), 10) : null;
    const projectionPeriod = fyStartYear
        ? `Apr ${fyStartYear} – Mar ${fyStartYear + 1}`
        : '';

    return (
        <DrawerModal
            open={open}
            handleCancel={onClose}
            modalTitle="TDS Details"
            closeIcon
        >
            {loading || !details ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <Space direction="vertical" className="w-full" size={20}>
                    <Space direction="vertical" className="w-full" size={12}>
                        <Title level={5}>Employee Details</Title>
                        <DetailRow label="Name" value={details.employeeName} />
                        <DetailRow label="Email" value={details.employeeEmail} />
                        <DetailRow label="Tax Regime" value={details.taxRegime} />
                        <DetailRow label="TDS Frequency" value={details.tdsFrequency} />
                        {details.dateOfJoin ? (
                            <DetailRow label="Date of Joining" value={dayjs(details.dateOfJoin).format('D MMM YYYY')} />
                        ) : null}
                        {projectionPeriod ? (
                            <DetailRow label="TDS calculated for" value={`${projectionPeriod} (12 months)`} strong />
                        ) : null}
                    </Space>

                    <StepCard title="Step 1 — This month's earnings">
                        <DetailRow label="Monthly salary (from the salary structure)" value={fmt(details.monthlySalary)} />
                        <DetailRow label="Gross paid this month" value={fmt(details.grossThisMonth)} strong />
                    </StepCard>

                    <StepCard title="Step 2 — Yearly exemptions">
                        <DetailRow label="Standard deduction" value={fmt(details.standardDeduction)} />
                        <DetailRow
                            label={`Total exemptions (${fmt(details.exemptions / 12)} per month)`}
                            value={fmt(details.exemptions)}
                            strong
                        />
                    </StepCard>

                    <StepCard title="Step 3 — Taxable income">
                        {/* Period intentionally omitted here (unlike Step 4/5's totals) — it's
                            already stated once, right above, in "TDS calculated for", and
                            repeating it made this label too long to fit beside its value
                            without wrapping mid-sentence.
                            NOTE: shows monthlySalary × 12 literally, per explicit request — for a
                            month with a one-time payment (arrears/bonus/etc.) folded into
                            monthlySalary, this will overstate the true annual figure and will not
                            match "Annual taxable income" below, which is correctly derived from
                            the real grossAnnual regardless. */}
                        <DetailRow
                            label={`Salary for the year: ${fmt(details.monthlySalary)} × 12 months`}
                            // Rounded to the rupee — ₹1,06,666.67 × 12 is ₹12,80,000.04, and the
                            // engine's taxable income below is already whole rupees, so an
                            // unrounded figure here made the subtraction look off by paise.
                            value={fmt(Math.round(details.monthlySalary * 12))}
                        />
                        <DetailRow label="Less: yearly exemptions" value={`− ${fmt(details.exemptions)}`} />
                        <DetailRow label="Annual taxable income" value={fmt(details.taxableIncome)} strong />
                    </StepCard>

                    <StepCard title="Step 4 — Tax on that income (slab by slab)">
                        <Card size="small" bordered className="rounded-xl bg-[#F8FAFC]">
                            <Space direction="vertical" className="w-full" size={6}>
                                {details.slabBreakdown.map(slab => (
                                    <DetailRow
                                        key={`${slab.from}-${slab.to}-${slab.rate}`}
                                        label={
                                            slab.to != null
                                                ? `${formatLakh(slab.from)}–${formatLakh(slab.to)} @${slab.rate}%`
                                                : `Above ${formatLakh(slab.from)} @${slab.rate}%`
                                        }
                                        value={`= ${fmt(slab.tax)}`}
                                    />
                                ))}
                            </Space>
                        </Card>
                        <DetailRow label="Total slab tax" value={`= ${fmt(details.taxBeforeRebate)}`} strong />
                        <DetailRow
                            label={
                                <Space size={4}>
                                    <span>{rebateRowLabel(details.taxRegime, details.marginalRelief)}</span>
                                    <RebateInfoIcon details={details} />
                                </Space>
                            }
                            value={`− ${fmt(details.totalRebate)}`}
                            muted={details.totalRebate === 0}
                        />
                        <DetailRow
                            label={
                                <Space size={4}>
                                    <span>Add: Surcharge (taxable income above ₹50L)</span>
                                    <SurchargeInfoIcon details={details} />
                                </Space>
                            }
                            value={`+ ${fmt(details.surcharge)}`}
                            muted={details.surcharge === 0}
                        />
                        <DetailRow
                            label={`Add: Health & Education Cess — 4% of ${fmt(details.taxBeforeRebate - details.totalRebate + details.surcharge)}`}
                            value={`+ ${fmt(details.cess)}`}
                        />
                        <DetailRow
                            label={projectionPeriod ? `Total Tax Payable (${projectionPeriod})` : 'Total Tax Payable'}
                            value={fmt(details.totalTax)}
                            strong
                        />
                    </StepCard>

                    <StepCard title="Step 5 — This month's TDS">
                        {/* No special case for a month with a one-off (arrears/bonus/etc.) — it's
                            already folded into the complete projected annual income Step 3/4
                            worked from, so the annual tax above already reflects it, and this is
                            always simply that annual tax spread evenly across the year. */}
                        <DetailRow
                            label={
                                projectionPeriod
                                    ? `Tax on salary ${fmt(details.totalTax)} ÷ 12 months (${projectionPeriod})`
                                    : `Tax on salary ${fmt(details.totalTax)} ÷ 12 months`
                            }
                            value={fmt(details.tdsMonthly)}
                        />
                        <DetailRow label="Monthly TDS Deduction" value={fmt(details.tdsMonthly)} strong />
                    </StepCard>
                </Space>
            )}
        </DrawerModal>
    );
};

export default TDSDetailsDrawer;
