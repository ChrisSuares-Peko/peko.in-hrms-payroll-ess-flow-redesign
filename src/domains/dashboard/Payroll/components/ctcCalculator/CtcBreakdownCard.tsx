import React from 'react';

import { CloseOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Flex, Popover, Tag, Tooltip, Typography } from 'antd';

import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import {
    calculateEmployerPfContribution,
    resolvePfWageCeiling,
} from '../../utils/ctcCalculator/calculateEmployerPf';
import {
    CtcBreakdown,
    CtcDeductionComponent,
    CtcEarningComponent,
    CtcEmployerPf,
    CtcLwf,
} from '../../utils/ctcCalculator/types';

const { Text } = Typography;

const TEXT_DARK = '#181D27';
const TEXT_MUTED = '#535862';
const VALUE_MUTED = '#94A3B8';
const BORDER = '#E2E8F0';
const SECTION_BG = '#F8FAFC';
const ACCENT = '#FF4F4F';

const fmt = (amount: number) =>
    `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))} / month`;

const isBasicSalary = (earning: CtcEarningComponent) => earning.componentName === 'Basic Salary';

// Rates/ceilings for these are fixed by statute, never a per-employee choice — see
// isProvidentFundDeduction in the backend's models/use-cases/salaryComponent.js.
export const isStatutoryDeductionName = (deductionName: string) =>
    deductionName === 'Provident Fund (PF)' || deductionName === 'Professional Tax';

// Display-only relabel for the Deductions section's row — the underlying deductionName
// stays "Provident Fund (PF)" everywhere else in this file (badge logic, locking, the
// onRemove guard, isStatutoryDeductionName) since that's the exact-match identifier the
// calculation engine relies on. Only what the employee sees changes.
const displayDeductionName = (deductionName: string) =>
    deductionName === 'Provident Fund (PF)' ? "PF Employee's Contribution" : deductionName;

const earningBadge = (earning: CtcEarningComponent) => {
    if (earning.calculationType === 'FIXED') return 'Fixed';
    if (earning.calculationType === 'BALANCING') return 'Balancing';
    const pct = earning.amountPercentage ?? 0;
    if (earning.calculationBasis === 'CTC') return `${pct}% of CTC`;
    return earning.calculationBasis === 'GROSS_SALARY'
        ? `${pct}% of Gross`
        : `${pct}% of Basic Salary`;
};

const isBenefitOutsideGross = (earning: CtcEarningComponent) => earning.isPartOfGross === false;

const lockedRowBadgeText = (badge?: string) => {
    if (!badge) return 'Statutory';
    return `Statutory — ${badge}`;
};

const deductionBadge = (deduction: CtcDeductionComponent, pfWage: number, basicSalary: number) => {
    if (deduction.calculationType === 'FIXED') return 'Fixed';
    const pct = deduction.amountPercentage ?? 0;
    if (deduction.deductionName === 'Provident Fund (PF)') {
        // pfWage is only actually capped when the org's ceiling brought it below Basic —
        // under an uncapped ("of full Basic Salary") policy pfWage always equals Basic, no cap applies.
        return pfWage < basicSalary
            ? `${pct}% of Basic, capped at ₹${formatNumberWithLocalStringWithoutDecimalPoint(pfWage * 0.12)}`
            : `${pct}% of Basic`;
    }
    return deduction.salaryDeductionType === 'GROSS_SALARY'
        ? `${pct}% of Gross`
        : `${pct}% of Basic Salary`;
};

// Plain "₹X" with no "/ month" suffix — for use inside the breakup popover rows, where the
// period is already established by the row this popover hangs off of.
const fmtPlain = (amount: number) =>
    `₹${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

const PopoverRow = ({
    label,
    value,
    strong,
}: {
    label: string;
    value: number;
    strong?: boolean;
}) => (
    <Flex justify="space-between" gap={16} style={{ marginTop: 4 }}>
        <Text
            className="text-xs"
            style={{ color: strong ? TEXT_DARK : TEXT_MUTED }}
            strong={strong}
        >
            {label}
        </Text>
        <Text
            className="text-xs"
            style={{ color: TEXT_DARK, whiteSpace: 'nowrap' }}
            strong={strong}
        >
            {fmtPlain(value)}
        </Text>
    </Flex>
);

// Hover content for the Employer's PF row's info icon — the account-wise split (EPS,
// Employer EPF, EDLI, Admin) behind the single lump badge/value shown on the row itself.
const EmployerPfBreakupPopover = ({ employerPf }: { employerPf: CtcEmployerPf }) => {
    const capped = employerPf.pfWage >= employerPf.ceiling;
    return (
        <div style={{ maxWidth: 300 }}>
            <Text strong className="text-sm">
                {`Employer's PF — how the ${fmtPlain(employerPf.employerTotal)} splits`}
            </Text>
            <PopoverRow
                label={
                    capped
                        ? `PF wages (Basic capped at ${fmtPlain(employerPf.ceiling)})`
                        : 'PF wages (full Basic Salary)'
                }
                value={employerPf.pfWage}
            />
            <PopoverRow
                label={`EPS — 8.33% of ${fmtPlain(employerPf.pfWage)}`}
                value={employerPf.employerEps}
            />
            <PopoverRow label="Employer EPF — 12% less EPS" value={employerPf.employerEpf} />
            <PopoverRow
                label={`EDLI — 0.5% of ${fmtPlain(employerPf.pfWage)}`}
                value={employerPf.edli}
            />
            <PopoverRow label="Admin charges — 0.5% of PF wages" value={employerPf.adminCharges} />
            <Divider style={{ margin: '6px 0' }} />
            <PopoverRow label="Employer total (12% + 1%)" value={employerPf.employerTotal} strong />
            <Text
                className="text-xs"
                style={{ color: VALUE_MUTED, marginTop: 8, display: 'block' }}
            >
                {capped
                    ? `Pension and insurance are always calculated on a maximum of ${fmtPlain(employerPf.ceiling)}. The company pays this amount; it is not deducted from the employee.`
                    : 'The company pays this amount on the employee’s full Basic Salary; it is not deducted from the employee.'}
            </Text>
        </div>
    );
};

const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

// "with the June & December payrolls only" -> "June & December payrolls only (Maharashtra)"
const lwfScheduleBadge = (lwf: CtcLwf) => {
    if (!lwf.scheduleLabel) return undefined;
    const trimmed = lwf.scheduleLabel.replace(/^with the /, '').replace(/^with /, '');
    return lwf.workState ? `${trimmed} (${lwf.workState})` : trimmed;
};

// "the June & December payrolls" / "the December payroll" — used in the not-firing footnote.
const lwfScheduleWindowPhrase = (schedule: string | null) => {
    if (schedule === 'JUNE_DECEMBER') return 'the June & December payrolls';
    if (schedule === 'DECEMBER_ONLY') return 'the December payroll';
    return 'the scheduled payroll';
};

const lwfValueLabel = (lwf: CtcLwf) => {
    if (lwf.fires !== false || lwf.nextFireMonth == null || lwf.nextFireYear == null)
        return undefined;
    return `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(lwf.employeeAmount))} · in ${
        MONTH_NAMES[lwf.nextFireMonth - 1]
    } ${lwf.nextFireYear}`;
};

const lwfFootnote = (lwf: CtcLwf) => {
    if (lwf.fires !== false || lwf.nextFireMonth == null || lwf.nextFireYear == null)
        return undefined;
    return `Not deducted this month — comes out of ${lwfScheduleWindowPhrase(lwf.schedule)} (next: ${
        MONTH_NAMES[lwf.nextFireMonth - 1]
    } ${lwf.nextFireYear}).`;
};

const Badge = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
    <Tag
        style={{
            background: SECTION_BG,
            borderColor: BORDER,
            color: muted ? VALUE_MUTED : TEXT_MUTED,
            marginInlineEnd: 0,
            fontSize: 12,
            lineHeight: '16px',
            padding: '2px 8px',
            borderRadius: 6,
        }}
    >
        {children}
    </Tag>
);

export const ActionSlot = ({
    onClick,
    icon,
    ariaLabel,
    testId,
}: {
    onClick?: () => void;
    icon: React.ReactNode;
    ariaLabel: string;
    testId?: string;
}) =>
    onClick ? (
        <Button
            aria-label={ariaLabel}
            data-testid={testId}
            type="text"
            size="small"
            icon={icon}
            onClick={onClick}
            className="rounded-full flex items-center justify-center transition-all duration-150 ease-in-out text-[#94A3B8] hover:!text-[#FF4F4F] hover:!bg-[#FFF2F2] opacity-0 group-hover:opacity-100 focus-visible:!opacity-100"
            style={{ width: 24, height: 24, minWidth: 24, padding: 0 }}
        />
    ) : (
        <span aria-hidden className="inline-block" style={{ width: 24, height: 24 }} />
    );

interface RowProps {
    label: string;
    badge?: string;
    value: number;
    // Overrides the default "₹ X / month" rendering — used by the LWF row to show
    // "₹ X · in Dec 2026" in a month it doesn't fire.
    valueLabel?: string;
    editable?: boolean;
    locked?: boolean;
    // Greys out the whole row — used for a statutory row that's configured but doesn't
    // fire this month (e.g. LWF outside its June/December or December-only window), so
    // it visually reads as "not part of this month" without disappearing entirely.
    muted?: boolean;
    // Extra line rendered under the row itself (e.g. "Not deducted this month — comes
    // out of the June & December payrolls (next: Dec 2026).").
    footnote?: React.ReactNode;
    // Info icon right after the label — hover reveals a breakdown (e.g. the Employer PF
    // row's EPS/Employer-EPF/EDLI/Admin split) without cluttering the list with extra rows.
    infoPopover?: React.ReactNode;
    onEdit?: () => void;
    onRemove?: () => void;
}

const Row = ({
    label,
    badge,
    value,
    valueLabel,
    editable,
    locked,
    muted,
    footnote,
    infoPopover,
    onEdit,
    onRemove,
}: RowProps) => (
    <div className="py-3 px-4 group transition-colors duration-150 ease-in-out hover:bg-[#F8FAFC]">
        <Flex vertical gap={4}>
            <Flex justify="space-between" align="center" gap={10}>
                <Flex wrap align="center" gap={10} className="min-w-0">
                    <Text className="text-sm" style={{ color: muted ? VALUE_MUTED : TEXT_DARK }}>
                        {label}
                    </Text>
                    {infoPopover && (
                        <Popover content={infoPopover} trigger="hover" placement="bottomLeft">
                            <InfoCircleOutlined
                                aria-label={`${label} — breakup`}
                                style={{ fontSize: 13, color: TEXT_MUTED, cursor: 'help' }}
                            />
                        </Popover>
                    )}
                    {(badge || locked) && (
                        <Badge muted={muted}>{locked ? lockedRowBadgeText(badge) : badge}</Badge>
                    )}
                </Flex>
                <Flex align="center" gap={8} style={{ flexShrink: 0 }}>
                    <Text
                        className="text-sm"
                        style={{
                            color: muted ? VALUE_MUTED : TEXT_DARK,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {valueLabel ?? fmt(value)}
                    </Text>
                    {editable && !locked && (
                        <Flex align="center" justify="end" gap={8} style={{ width: 56 }}>
                            <ActionSlot
                                onClick={onEdit}
                                ariaLabel={`Edit ${label}`}
                                icon={<EditOutlined style={{ fontSize: 12 }} />}
                            />
                            <ActionSlot
                                onClick={onRemove}
                                ariaLabel={`Remove ${label}`}
                                icon={<CloseOutlined style={{ fontSize: 11 }} />}
                            />
                        </Flex>
                    )}
                    {editable && locked && (
                        <span
                            aria-hidden
                            className="inline-block"
                            style={{ width: 56, height: 24 }}
                        />
                    )}
                </Flex>
            </Flex>
            {footnote && (
                <Text className="text-xs mt-1" style={{ color: VALUE_MUTED }}>
                    {footnote}
                </Text>
            )}
        </Flex>
    </div>
);

const FooterBar = ({
    label,
    value,
    editable,
}: {
    label: string;
    value: number;
    editable?: boolean;
}) => (
    <Flex
        justify="space-between"
        align="center"
        className="py-3 px-4"
        style={{ background: SECTION_BG, borderTop: `1px solid ${BORDER}` }}
    >
        <Text className="text-sm font-semibold" style={{ color: TEXT_DARK }}>
            {label}
        </Text>
        <Flex align="center" gap={8}>
            <Text className="text-sm font-semibold" style={{ color: TEXT_DARK }}>
                {fmt(value)}
            </Text>
            {editable && (
                <span aria-hidden className="inline-block" style={{ width: 56, height: 24 }} />
            )}
        </Flex>
    </Flex>
);

const SectionHeader = ({ title, onAdd }: { title: string; onAdd?: () => void }) => (
    <Flex
        justify="space-between"
        align="center"
        className="px-4"
        style={{
            background: SECTION_BG,
            borderBottom: `1px solid ${BORDER}`,
            paddingTop: 8,
            paddingBottom: 8,
            minHeight: 44,
        }}
    >
        <Text className="font-medium text-sm" style={{ color: TEXT_DARK }}>
            {title}
        </Text>
        {onAdd && (
            <Button
                type="link"
                className="px-0 h-auto text-sm font-medium"
                style={{ color: ACCENT }}
                onClick={onAdd}
            >
                + Add Component
            </Button>
        )}
    </Flex>
);

interface SectionProps {
    title?: string;
    onAdd?: () => void;
    footer?: { label: string; value: number };
    editable?: boolean;
    children: React.ReactNode;
}

const Section = ({ title, onAdd, footer, editable, children }: SectionProps) => (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
        {title && <SectionHeader title={title} onAdd={onAdd} />}
        <div className="divide-y divide-[#F1F5F9]">{children}</div>
        {footer && <FooterBar label={footer.label} value={footer.value} editable={editable} />}
    </div>
);

export interface CtcBreakdownCardProps {
    breakdown: CtcBreakdown;
    editable?: boolean;
    // When true, PF/PT/ESI rows render locked ("Statutory") with no edit/remove
    // controls, regardless of `editable` — used by the Salary Structure tab, where these
    // are computed by rule or set via the Statutory Components tab, never edited here.
    // Defaults to false so the Dashboard Calculator / Add Employee flows (which build an
    // idealized structure from scratch) are unaffected.
    lockStatutoryDeductions?: boolean;
    // Hides the trailing statutory-deductions/gratuity disclaimer note — used by the
    // Salary Structure tab and the Revise Salary preview that follows it (which has its
    // own "What changes" summary and doesn't need the disclaimer repeated). Defaults to
    // false so other consumers (Dashboard Calculator, Add Employee/New Hire) are unaffected.
    hideNote?: boolean;
    onAddEarning?: () => void;
    onEditEarning?: (earning: CtcEarningComponent) => void;
    onRemoveEarning?: (earning: CtcEarningComponent) => void;
    onAddDeduction?: () => void;
    onEditDeduction?: (deduction: CtcDeductionComponent) => void;
    onRemoveDeduction?: (deduction: CtcDeductionComponent) => void;
    // Old Tax Regime employees only (Salary Structure tab): an HR-entered Income Tax (TDS)
    // row in Deductions. When it has an amount, it counts toward Total Deductions and the
    // take-home becomes "after income tax". Omitted everywhere else — no row, no change.
    incomeTax?: {
        amount: number;
        badge: string;
        footnote?: React.ReactNode;
        onEdit?: () => void;
    };
}

const CtcBreakdownCard = ({
    breakdown,
    editable = false,
    lockStatutoryDeductions = false,
    hideNote = false,
    onAddEarning,
    onEditEarning,
    onRemoveEarning,
    onAddDeduction,
    onEditDeduction,
    onRemoveDeduction,
    incomeTax,
}: CtcBreakdownCardProps) => {
    const incomeTaxAmount = incomeTax?.amount || 0;
    const totalDeductions = breakdown.totalDeductions + incomeTaxAmount;
    const netTakeHome = breakdown.netTakeHome - incomeTaxAmount;
    // Compares against the breakdown's own `ceiling` (₹15,000 through August 2026, ₹25,000
    // from September 2026 onward) rather than a hardcoded figure, so this reads correctly
    // for whichever period this breakdown was resolved for.
    const pfCapped = breakdown.employerPf.pfWage >= breakdown.employerPf.ceiling;
    // The cap is the employer's total at the wage ceiling (₹3,250 at ₹25,000) — not this
    // breakdown's own total, which is ₹0 before a CTC is entered.
    const pfCeiling = breakdown.employerPf.ceiling || resolvePfWageCeiling();
    const employerPfCap = calculateEmployerPfContribution(pfCeiling, 'CAPPED_15000').employerTotal;
    const employerPfBadge = pfCapped
        ? `12% + 1% admin/EDLI, capped at ₹${formatNumberWithLocalStringWithoutDecimalPoint(employerPfCap)}`
        : '12% + 1% admin/EDLI of Basic Salary';

    // A Balancing component that has nothing left to absorb (₹0) is just noise in the
    // breakdown, so it's hidden here. Display-only — it stays in `breakdown.earnings`
    // since the edit modals and HowThisWorksPanel still look it up from there.
    const grossEarnings = breakdown.earnings.filter(
        earning =>
            !isBenefitOutsideGross(earning) &&
            !(earning.calculationType === 'BALANCING' && Math.round(earning.calculatedAmount) <= 0)
    );
    const benefitEarnings = breakdown.earnings.filter(isBenefitOutsideGross);

    const earningRow = (earning: CtcEarningComponent) =>
        // Display-only echo of the employee's PF deduction (Compliance Settings > EPF >
        // "Show PF Employee's Contribution in Earnings") — locked, never editable.
        earning.isPfEarningsLine ? (
            <Row
                key={earning.id}
                label={earning.componentName}
                badge={`12% of PF wages — taken out of ${
                    breakdown.earnings.find(e => e.calculationType === 'BALANCING')
                        ?.componentName || 'Special Allowance'
                }, also in Deductions`}
                value={earning.calculatedAmount}
                editable={editable}
                locked
            />
        ) : (
            <Row
                key={earning.id}
                label={earning.componentName}
                badge={earningBadge(earning)}
                value={earning.calculatedAmount}
                editable={editable}
                // Special Allowance is the computed remainder — there's nothing to edit
                // directly on it (see EditEarningComponentModal for everything else).
                onEdit={
                    earning.calculationType !== 'BALANCING'
                        ? () => onEditEarning?.(earning)
                        : undefined
                }
                onRemove={
                    !isBasicSalary(earning) && earning.calculationType !== 'BALANCING'
                        ? () => onRemoveEarning?.(earning)
                        : undefined
                }
            />
        );

    const earningRows = grossEarnings.map(earningRow);
    const benefitRows = benefitEarnings.map(earningRow);

    // Single row, same as before — the EPS/Employer-EPF/EDLI/Admin account-wise split lives
    // in the info-icon popover instead of four separate rows. Not shown at all while EPF is
    // switched off for the establishment (Compliance Settings > EPF).
    const pfEmployerRow =
        breakdown.epfApplicable === false ? null : (
            <Row
                label="PF Employer's Contribution"
                badge={employerPfBadge}
                value={breakdown.employerPf.employerTotal}
                editable={editable}
                locked={lockStatutoryDeductions}
                infoPopover={<EmployerPfBreakupPopover employerPf={breakdown.employerPf} />}
            />
        );
    // While an employee is only still covered because of contribution-period continuation
    // (gross rose above the ceiling mid-period), the badge calls that out instead of the
    // normal percentage rule — otherwise reopening this tab weeks after the revision gives
    // no indication they're in a locked continuation window.
    const esiCoverageBadge = (basePercent: string) =>
        breakdown.esi?.continuingAboveCeiling &&
        breakdown.esi.coverageUntilMonth != null &&
        breakdown.esi.coverageUntilYear != null
            ? `${basePercent} — covered until ${MONTH_NAMES[breakdown.esi.coverageUntilMonth - 1]} ${breakdown.esi.coverageUntilYear}`
            : basePercent;
    const esiEmployerRow = breakdown.esi?.eligible ? (
        <Row
            label="ESI Employer's Contribution"
            badge={esiCoverageBadge('3.25% of Gross')}
            value={breakdown.esi.employerContribution}
            editable={editable}
            locked={lockStatutoryDeductions}
        />
    ) : null;
    const esiEmployeeRow = breakdown.esi?.eligible ? (
        <Row
            label="ESI Employee's Contribution"
            badge={esiCoverageBadge('0.75% of Gross')}
            value={breakdown.esi.employeeContribution}
            editable={editable}
            locked={lockStatutoryDeductions}
        />
    ) : null;

    // Shown once configured (per the Dev Notes), even in months it doesn't actually fire —
    // the schedule badge and footnote communicate that via the CONFIGURED amount (e.g. "₹20
    // · in Dec 2026"), rather than the row disappearing or zeroing out. breakdown.totalDeductions
    // already only counts this when breakdown.lwf.fires is true, computed on the backend.
    // But a toggle that's ON with literally nothing configured yet (both shares still ₹0 —
    // not "not due this month", genuinely nothing to deduct ever) has nothing worth showing.
    const lwfHasAnyAmount =
        (breakdown.lwf?.employeeAmount || 0) > 0 || (breakdown.lwf?.employerAmount || 0) > 0;
    const lwfRow =
        breakdown.lwf?.configured && lwfHasAnyAmount ? (
            <Row
                label="Labour Welfare Fund"
                badge={lwfScheduleBadge(breakdown.lwf)}
                value={breakdown.lwf.employeeAmount}
                valueLabel={lwfValueLabel(breakdown.lwf)}
                editable={editable}
                locked={lockStatutoryDeductions}
                muted={breakdown.lwf.fires === false}
                footnote={lwfFootnote(breakdown.lwf)}
            />
        ) : null;

    const benefitsSection = benefitRows.length > 0 && (
        <Section
            title="Benefits (outside Gross)"
            onAdd={editable ? onAddEarning : undefined}
            editable={editable}
        >
            {benefitRows}
        </Section>
    );

    return (
        <Flex vertical gap={24} className="w-full">
            {breakdown.warnings.length > 0 && (
                <Flex vertical gap={8}>
                    {breakdown.warnings.map(warning => (
                        <Alert key={warning} type="warning" showIcon message={warning} />
                    ))}
                </Flex>
            )}
            {editable ? (
                <>
                    <Section
                        title="Earnings"
                        onAdd={onAddEarning}
                        footer={{ label: 'Gross Income', value: breakdown.grossSalary }}
                        editable
                    >
                        {earningRows}
                    </Section>

                    {benefitsSection}

                    <Section editable>
                        {pfEmployerRow}
                        {esiEmployerRow}
                    </Section>

                    <FooterBar
                        label="Cost to Company (CTC)"
                        value={breakdown.costToCompany}
                        editable
                    />
                </>
            ) : (
                <div
                    style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}
                >
                    <SectionHeader title="Earnings" />
                    <div className="divide-y divide-[#F1F5F9]">{earningRows}</div>
                    <FooterBar label="Gross Income" value={breakdown.grossSalary} />
                    {benefitRows.length > 0 && (
                        <>
                            <SectionHeader title="Benefits (outside Gross)" />
                            <div className="divide-y divide-[#F1F5F9]">{benefitRows}</div>
                        </>
                    )}
                    <div
                        className="divide-y divide-[#F1F5F9]"
                        style={{ borderTop: `1px solid ${BORDER}` }}
                    >
                        {pfEmployerRow}
                        {esiEmployerRow}
                    </div>
                    <FooterBar label="Cost to Company (CTC)" value={breakdown.costToCompany} />
                </div>
            )}

            <Section
                title="Deductions"
                onAdd={editable ? onAddDeduction : undefined}
                footer={{ label: 'Total Deductions', value: totalDeductions }}
                editable={editable}
            >
                {breakdown.deductions
                    // Professional Tax toggled on with nothing actually configured for this
                    // employee's state yet resolves to ₹0 — nothing to show until an admin
                    // sets a real amount, rather than a permanent, meaningless ₹0 row.
                    .filter(
                        deduction =>
                            deduction.deductionName !== 'Professional Tax' ||
                            deduction.calculatedAmount > 0
                    )
                    .map(deduction => {
                        const locked =
                            lockStatutoryDeductions &&
                            isStatutoryDeductionName(deduction.deductionName);
                        return (
                            <Row
                                key={deduction.id}
                                label={displayDeductionName(deduction.deductionName)}
                                badge={deductionBadge(
                                    deduction,
                                    breakdown.employerPf.pfWage,
                                    breakdown.basicSalary
                                )}
                                value={deduction.calculatedAmount}
                                editable={editable}
                                locked={locked}
                                onEdit={locked ? undefined : () => onEditDeduction?.(deduction)}
                                onRemove={
                                    deduction.deductionName !== 'Provident Fund (PF)' && !locked
                                        ? () => onRemoveDeduction?.(deduction)
                                        : undefined
                                }
                            />
                        );
                    })}
                {esiEmployeeRow}
                {lwfRow}
                {incomeTax && (
                    <Row
                        label="Income Tax (TDS)"
                        badge={incomeTax.badge}
                        value={incomeTax.amount}
                        editable={editable}
                        footnote={incomeTax.footnote}
                        onEdit={incomeTax.onEdit}
                    />
                )}
            </Section>

            <Flex
                justify="space-between"
                align="center"
                className="px-4 py-4"
                style={{ background: '#FFF2F2', border: '1px solid #FFD9D9', borderRadius: 12 }}
            >
                <Flex align="center" gap={6}>
                    <Text className="font-semibold" style={{ fontSize: 18, color: TEXT_DARK }}>
                        {incomeTaxAmount > 0 ? 'Net Take-Home (after income tax)' : 'Net Take-Home (before income tax)'}
                    </Text>
                    <Tooltip title="Net Take-Home = Gross Income - Total Deductions">
                        <InfoCircleOutlined style={{ fontSize: 14, color: TEXT_MUTED }} />
                    </Tooltip>
                </Flex>
                <Text className="font-semibold" style={{ fontSize: 20, color: ACCENT }}>
                    {fmt(netTakeHome)}
                </Text>
            </Flex>

            {!hideNote && (
                <div>
                    <Divider style={{ borderColor: BORDER, marginTop: 0, marginBottom: 16 }} />
                    <Flex vertical gap={4}>
                        <Text className="text-xs font-semibold" style={{ color: TEXT_MUTED }}>
                            Note:
                        </Text>
                        <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                            1. Applicable statutory deductions, including but not limited to
                            Provident Fund (PF) employee contributions, Tax Deducted at Source
                            (TDS), Professional Tax (PT), and any other deductions required under
                            applicable laws, will be made from the gross salary.
                        </Text>
                        <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                            2. Gratuity is not included in the CTC and shall be payable over and
                            above the CTC, in accordance with the Payment of Gratuity Act, 1972.
                        </Text>
                    </Flex>
                </div>
            )}
        </Flex>
    );
};

export default CtcBreakdownCard;
