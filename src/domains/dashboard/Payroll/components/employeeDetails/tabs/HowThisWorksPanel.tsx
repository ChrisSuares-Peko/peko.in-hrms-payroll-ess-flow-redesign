import React from 'react';

import { Tabs, Typography } from 'antd';

import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import { CtcBreakdown } from '../../../utils/ctcCalculator/types';

const { Text } = Typography;

const fmtRupees = (amount: number) => `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

const Bullet = ({ lead, children }: { lead: string; children: React.ReactNode }) => (
    <Text className="text-sm mb-2" style={{ color: '#374151', display: 'block' }}>
        <Text strong className="text-sm">
            {lead}
        </Text>{' '}
        {children}
    </Text>
);

const ExampleBox = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px' }}>{children}</div>
);

interface HowThisWorksPanelProps {
    employeeName: string;
    breakdown: CtcBreakdown;
}

// A 10-percentage-point illustrative cut to a %-of-Basic allowance (e.g. HRA 50% -> 40%)
// — chosen specifically because it never touches Basic itself, so PF/Gross/CTC genuinely
// stay unchanged in the example. An earlier version illustrated a Basic increase instead,
// which silently moved PF too and made the "Gross stays the same" claim confusing.
const EXAMPLE_PERCENTAGE_POINT_DROP = 10;

const HowThisWorksPanel = ({ employeeName, breakdown }: HowThisWorksPanelProps) => {
    // The Balancing component's name is org/employee-configurable (e.g. "Other
    // Allowances" instead of the default "Special Allowance") — read it from the actual
    // structure rather than hardcoding a label that may not match what's really there.
    const balancingEarning = breakdown.earnings.find(e => e.calculationType === 'BALANCING');
    const balancingName = balancingEarning?.componentName || 'Special Allowance';

    const basicLinkedEarnings = breakdown.earnings.filter(
        e => e.calculationBasis === 'BASIC_SALARY' && e.calculationType === 'PERCENTAGE'
    );
    const hraEarning = basicLinkedEarnings.find(e => e.componentName === 'House Rent Allowance');
    // Prefers HRA (the near-universal %-of-Basic component) for the example, falling back
    // to any other %-of-Basic earning this employee has if HRA isn't configured that way,
    // so the panel never has to fabricate numbers for an unusual structure.
    const exampleComponent = hraEarning || basicLinkedEarnings[0];
    const exampleCurrentPct = exampleComponent?.amountPercentage || 0;
    const exampleNewPct = Math.max(0, exampleCurrentPct - EXAMPLE_PERCENTAGE_POINT_DROP);
    const exampleNewAmount = (exampleNewPct / 100) * breakdown.basicSalary;
    const exampleDropAmount = exampleComponent ? exampleComponent.calculatedAmount - exampleNewAmount : 0;

    const raiseMonthlyCTC = breakdown.monthlyCTC * 1.1;
    const raiseGross = raiseMonthlyCTC - breakdown.employerPf.total;
    const raiseBasic = breakdown.grossSalary > 0 ? (breakdown.basicSalary / breakdown.grossSalary) * raiseGross : 0;

    const items = [
        {
            key: '1',
            label: 'Changing the split',
            children: (
                <div>
                    <Bullet lead="The CTC is fixed.">
                        It&apos;s what was agreed with {employeeName}. Edits here change how it&apos;s split — not
                        how much they earn.
                    </Bullet>
                    <Bullet lead="Increase or decrease HRA or any allowance">
                        → {balancingName} moves by the same amount in the opposite direction. Nothing is added or
                        lost.
                    </Bullet>
                    <Bullet lead="Changing Basic also moves PF">
                        (12% employee + 13% employer on Basic up to the statutory PF wage ceiling — ₹15,000 up to 16 September 2026, ₹25,000 from 17 September 2026) — the edit preview shows the effect
                        before you save.
                    </Bullet>
                    <Bullet lead="Add your own allowance">
                        (e.g. Conveyance) with + Add Component — its amount also moves out of {balancingName}.
                    </Bullet>
                    <Bullet lead="Company-paid benefits">
                        (e.g. group medical insurance): untick &quot;Part of Gross Salary&quot; when adding — the
                        component sits below Gross with the employer contributions, counts in CTC, and is never paid
                        in monthly salary.
                    </Bullet>
                    {exampleComponent && (
                        <ExampleBox>
                            <Text className="text-sm font-semibold block mb-1">
                                Example — set {exampleComponent.componentName} to {exampleNewPct}% of Basic instead
                                of {exampleCurrentPct}%:
                            </Text>
                            <Text className="text-sm block" style={{ color: '#374151' }}>
                                {exampleComponent.componentName} drops {fmtRupees(exampleDropAmount)} (
                                {fmtRupees(exampleComponent.calculatedAmount)} → {fmtRupees(exampleNewAmount)}).{' '}
                                {balancingName} rises by the same {fmtRupees(exampleDropAmount)} to absorb it.
                            </Text>
                            <Text className="text-sm font-semibold block mt-1">
                                Gross, PF, CTC and take-home all stay unchanged.
                            </Text>
                        </ExampleBox>
                    )}
                </div>
            ),
        },
        {
            key: '2',
            label: 'Giving a raise',
            children: (
                <div>
                    <Bullet lead="Only Revise Salary changes the CTC.">
                        Enter the new annual package and the effective month — the same engine that priced the hire
                        rebuilds the whole structure.
                    </Bullet>
                    <Bullet lead="Basic, HRA and allowances re-derive">
                        from the new Gross, and {balancingName} absorbs the remainder. Custom components and
                        benefits carry over.
                    </Bullet>
                    <Bullet lead="Backdated raise?">
                        Only months already recorded as Paid earn arrears — the differential for those months is
                        totalled into one Arrears line, paid with the next unprocessed salary run and taxed only on
                        the incremental amount. Unrecorded months simply pay the new salary directly.
                    </Bullet>
                    <Bullet lead="Every revision is stamped into Revision History">
                        (old → new, %, effective month, reason, where arrears were paid). Undo works on the latest
                        revision until a payroll that used it is recorded.
                    </Bullet>
                    <ExampleBox>
                        <Text className="text-sm font-semibold block mb-1">
                            Example — a 10% raise, {fmtRupees(breakdown.annualCTC)} → {fmtRupees(breakdown.annualCTC * 1.1)}:
                        </Text>
                        <Text className="text-sm block" style={{ color: '#374151' }}>
                            Monthly CTC becomes {fmtRupees(raiseMonthlyCTC)}, employer PF stays{' '}
                            {fmtRupees(breakdown.employerPf.total)}, so Gross becomes {fmtRupees(raiseGross)} — Basic
                            re-solves to {fmtRupees(raiseBasic)}, and HRA/allowances/{balancingName} re-derive from
                            it the same way they would for a fresh joiner.
                        </Text>
                    </ExampleBox>
                </div>
            ),
        },
        {
            key: '3',
            label: 'Deductions',
            children: (
                <div>
                    <Bullet lead="Net take-home">
                        = Gross − the Deductions section (employee PF, Professional Tax, company deductions) — income
                        tax reduces it further at payout.
                    </Bullet>
                    <Bullet lead="Statutory rows are locked here.">
                        PF Employee&apos;s Contribution and Professional Tax are computed by rule or set on the
                        Statutory Components tab — not editable from this breakdown.
                    </Bullet>
                    <Bullet lead="Scheduled items">
                        like Labour Welfare Fund show on every month&apos;s breakdown but only actually count toward
                        the total in their deduction month(s) — greyed out with a note otherwise.
                    </Bullet>
                </div>
            ),
        },
    ];

    return (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24 }}>
            <Text className="text-xl font-semibold" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
                How This Works
            </Text>
            <Tabs items={items} />
        </div>
    );
};

export default HowThisWorksPanel;
