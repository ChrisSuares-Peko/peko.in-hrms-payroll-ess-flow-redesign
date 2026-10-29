import { StatutoryInfoContent } from './StatutoryInfoModal';

export const EPF_INFO: StatutoryInfoContent = {
    title: 'What is EPF?',
    sections: [
        {
            heading: 'In simple words',
            bullets: [
                'A compulsory saving for retirement. A small part of the salary goes into the employee’s PF account every month, and the company adds its own share on top — so the savings grow from both sides.',
                'The UAN is the employee’s lifelong PF account number. It stays the same even when they change jobs.',
            ],
        },
        {
            heading: 'The rules',
            bullets: [
                'Employee: 12% of PF wages, deducted from salary every month.',
                'Company: split across four accounts, not one lump sum — 8.33% of PF wages to the EPS/Pension fund, the remaining balance of the 12% to the Employer EPF account, plus 0.5% for EDLI (insurance) and 0.5% for EPFO admin charges. Nothing extra is deducted from the employee for any of this.',
                'PF wages = Basic salary, capped at the statutory ceiling (your company setting) — ₹15,000 a month up to 16 September 2026, ₹25,000 a month from 17 September 2026 onward (September 2026 itself is split by days). So the employee deduction never crosses 12% of that ceiling.',
                'The money is deposited with EPFO every month against each employee’s UAN.',
                'The toggle on this card is only for rare exemptions — switched off, nothing is deducted and no savings build up.',
            ],
        },
        {
            heading: 'A sample calculation',
            bullets: [
                'From October 2026 (₹25,000 ceiling; September 2026 is split — 1–16 Sep on ₹15,000, 17–30 Sep on ₹25,000) — Basic salary ₹40,000: PF wages are capped at ₹25,000, so ₹3,000 is deducted from the employee, and the company adds ₹2,083 (EPS) + ₹917 (Employer EPF) + ₹125 (EDLI) + ₹125 (Admin) = ₹3,250. Basic salary ₹12,000 (below the cap): simply 12% = ₹1,440.',
                'Through August 2026 (₹15,000 ceiling) — the same Basic salary ₹40,000 case: PF wages capped at ₹15,000, ₹1,800 deducted from the employee, company adds ₹1,250 (EPS) + ₹550 (Employer EPF) + ₹75 (EDLI) + ₹75 (Admin) = ₹1,950.',
            ],
        },
    ],
};

export const ESI_INFO: StatutoryInfoContent = {
    title: 'What is ESI?',
    sections: [
        {
            heading: 'In simple words',
            bullets: [
                'A government health-insurance scheme for lower-wage employees. For a small monthly contribution, the employee and their family get medical care at ESIC hospitals, plus cash support during sickness or maternity.',
                'The ESI (IP) number is the employee’s lifelong insurance number — it follows them across jobs.',
            ],
        },
        {
            heading: 'The rules',
            bullets: [
                'Who is covered: employees earning up to ₹21,000 gross a month (₹25,000 for differently-abled employees).',
                'Contribution: 0.75% of gross from the employee, 3.25% from the company.',
                'Coverage runs in fixed half-year windows (April–September and October–March). A raise above ₹21,000 in the middle of a window does not stop the deduction — it continues till the window ends, and stops from the next one.',
                'Everything is automatic — coverage starts and stops based on gross salary. Nothing to add by hand.',
            ],
        },
        {
            heading: 'A sample calculation',
            bullets: [
                'Gross salary ₹18,000 — covered: ₹135 is deducted from salary and the company pays ₹585.',
                'Gross salary ₹35,000 — above ₹21,000, not covered: nothing is deducted.',
            ],
        },
    ],
};

export const TDS_INFO: StatutoryInfoContent = {
    title: 'What is Income Tax (TDS)?',
    sections: [
        {
            heading: 'In simple words',
            bullets: [
                'Income tax on salary, deducted a little every month instead of one big payment at year end. The company deposits it with the government against the employee’s PAN.',
            ],
        },
        {
            heading: 'The rules',
            bullets: [
                'Tax is worked out on the full year’s salary and spread across 12 months.',
                'The employee picks a tax regime: New (default, lower rates, few exemptions) or Old (higher rates, but PF, PT and other deductions reduce taxable income).',
                'A standard deduction comes off first — ₹75,000 a year in the New regime, ₹50,000 in the Old.',
                'On the New regime, taxable income up to ₹12 lakh pays NO tax (the Section 87A rebate) — so nothing is deducted for those salaries.',
                'One-time payments like bonus or arrears are taxed in the month they are paid.',
            ],
        },
        {
            heading: 'A sample calculation',
            bullets: [
                'Annual salary ₹12,00,000 on the New regime: taxable ₹11,25,000 after the standard deduction — under ₹12 lakh, so the rebate makes the tax nil and nothing is deducted.',
                'Annual salary ₹16,00,000: taxable ₹15,25,000 → tax with 4% cess ≈ ₹1,13,100 for the year ≈ ₹9,425 deducted each month.',
            ],
        },
    ],
};

export const PROFESSIONAL_TAX_INFO: StatutoryInfoContent = {
    title: 'What is Professional Tax?',
    sections: [
        {
            heading: 'In simple words',
            bullets: [
                'A small tax on employment charged by the state government. The company deducts it from salary and deposits it with the state. It is the smallest deduction on a payslip — capped at ₹2,500 a year.',
            ],
        },
        {
            heading: 'The rules',
            bullets: [
                'Each state sets its own amounts, and a few states charge none at all.',
                'It is set per employee: the amount is added while creating the employee, and can be changed or switched off on this card anytime.',
                'For employees on the Old tax regime, whatever is paid as PT reduces their taxable income.',
            ],
        },
        {
            heading: 'A sample calculation',
            bullets: [
                'A Maharashtra employee earning above ₹10,000 gross: ₹200 is deducted every month — ₹2,400 a year.',
                'An exempt employee (for example, some states exempt women below a wage level, and states like Delhi charge no PT): the toggle stays off and nothing is deducted.',
            ],
        },
    ],
};

export const LWF_INFO: StatutoryInfoContent = {
    title: 'What is the Labour Welfare Fund?',
    sections: [
        {
            heading: 'In simple words',
            bullets: [
                'A tiny contribution to the state’s welfare fund — a few rupees to a few hundred rupees a year — that pays for housing, healthcare and education programmes for workers. The employee and the company both chip in; the company’s share is paid on top, never from salary.',
            ],
        },
        {
            heading: 'The rules',
            bullets: [
                'LWF follows the state where the employee WORKS — never their home state. Only some states have an LWF law.',
                'Each state fixes the amounts and the schedule: monthly, June & December, or December only. It runs on the calendar year, which is why annual states deduct in December — not March.',
                'The amount and schedule for this employee are set with Update Amount on this card. Picking a state fills in its official numbers.',
                'The toggle is for exemptions — some states exempt managers and supervisors.',
            ],
        },
        {
            heading: 'A sample calculation',
            bullets: [
                'Working in Maharashtra: ₹25 comes out of the June and December salaries, and the company pays ₹75 alongside each time — ₹50 + ₹150 for the year.',
                'Working in Rajasthan: the state has no LWF law, so nothing is deducted.',
            ],
        },
    ],
};
