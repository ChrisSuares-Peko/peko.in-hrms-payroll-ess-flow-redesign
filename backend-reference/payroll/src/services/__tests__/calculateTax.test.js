const { calculateTax } = require('../salary');

describe('calculateTax — New Tax Regime, FY 2025-26 slabs', () => {
    it('matches the corrected FY 2025-26 slabs for the reported ₹1,15,000/month case (expected ₹6,565/month TDS)', async () => {
        const result = await calculateTax({
            fy: '2025-26',
            regime: 'new',
            basicSalary: 57500,
            hra: 28750,
            conveyanceAllowance: 1500,
            medicalAllowance: 1250,
            otherAllowances: 1000 + 25000, // mobile/internet + other allowances
        });

        expect(result.grossAnnual).toBe(1380000);
        expect(result.standardDeduction).toBe(75000);
        expect(result.taxableIncome).toBe(1305000);
        expect(result.slabBreakdown).toEqual([
            { from: 0, to: 400000, rate: 0, taxableAmount: 400000, tax: 0 },
            { from: 400000, to: 800000, rate: 5, taxableAmount: 400000, tax: 20000 },
            { from: 800000, to: 1200000, rate: 10, taxableAmount: 400000, tax: 40000 },
            { from: 1200000, to: 1600000, rate: 15, taxableAmount: 105000, tax: 15750 },
        ]);
        expect(result.taxBeforeRebate).toBe(75750);
        expect(result.rebate).toBe(0);
        expect(result.marginalRelief).toBe(0);
        expect(result.tax).toBe(75750);
        expect(result.cess).toBeCloseTo(3030, 5);
        expect(result.totalTax).toBeCloseTo(78780, 5);
        expect(result.tdsPerMonth).toBeCloseTo(6565, 1);
    });

    it('applies the full Section 87A rebate up to the ₹12L threshold for FY 2025-26', async () => {
        // Annual gross exactly at the new-regime rebate ceiling after standard deduction.
        const result = await calculateTax({
            fy: '2025-26',
            regime: 'new',
            basicSalary: 106250, // *12 = 1,275,000; -75,000 std deduction = 1,200,000 taxable
        });

        expect(result.taxableIncome).toBe(1200000);
        expect(result.rebate).toBe(result.taxBeforeRebate);
        expect(result.marginalRelief).toBe(0);
        expect(result.tax).toBe(0);
        expect(result.totalTax).toBe(0);
    });

    it('applies Section 87A marginal relief just above the ₹12L threshold for FY 2025-26', async () => {
        // *12 = 1,275,600; -75,000 std deduction = 1,200,600 taxable — ₹600 over the rebate line.
        const result = await calculateTax({
            fy: '2025-26',
            regime: 'new',
            basicSalary: 106300,
        });

        expect(result.taxableIncome).toBe(1200600);
        expect(result.taxBeforeRebate).toBe(60090);
        expect(result.rebate).toBe(0);
        // Tax is capped at the ₹600 by which income crosses ₹12,00,000, not the full slab tax.
        expect(result.marginalRelief).toBe(59490);
        expect(result.tax).toBe(600);
        expect(result.cess).toBeCloseTo(24, 5);
        expect(result.totalTax).toBeCloseTo(624, 5);
    });

    it('scales marginal relief further above the ₹12L threshold for FY 2025-26', async () => {
        // *12 = 1,296,000; -75,000 std deduction = 1,221,000 taxable — ₹21,000 over the line.
        const result = await calculateTax({
            fy: '2025-26',
            regime: 'new',
            basicSalary: 108000,
        });

        expect(result.taxableIncome).toBe(1221000);
        expect(result.taxBeforeRebate).toBe(63150);
        expect(result.rebate).toBe(0);
        expect(result.marginalRelief).toBe(42150);
        expect(result.tax).toBe(21000);
        expect(result.cess).toBeCloseTo(840, 5);
        expect(result.totalTax).toBeCloseTo(21840, 5);
        expect(result.tdsPerMonth).toBeCloseTo(1820, 1);
    });

    it('taxes the top slab (above ₹24L) at 30%, progressively through every bracket', async () => {
        const result = await calculateTax({
            fy: '2025-26',
            regime: 'new',
            basicSalary: 250000, // *12 = 3,000,000; -75,000 = 2,925,000 taxable
        });

        expect(result.taxableIncome).toBe(2925000);
        const topSlab = result.slabBreakdown[result.slabBreakdown.length - 1];
        expect(topSlab).toEqual({ from: 2400000, to: null, rate: 30, taxableAmount: 525000, tax: 157500 });
        // 0 + 20000 + 40000 + 60000 + 80000 + 100000 + 157500
        expect(result.taxBeforeRebate).toBe(457500);
    });

    it('leaves the Old Tax Regime slabs and rebate threshold unchanged', async () => {
        const result = await calculateTax({
            fy: '2025-26',
            regime: 'old',
            basicSalary: 41667, // *12 = 500,004
        });

        expect(result.slabBreakdown[0]).toMatchObject({ from: 0, to: 250000, rate: 0 });
        expect(result.slabBreakdown[1]).toMatchObject({ from: 250000, to: 500000, rate: 5 });
    });
});

describe('calculateTax — projected annual income (recurring + taxable one-offs combined), monthly TDS = annual tax ÷ 12', () => {
    it('taxable income below ₹12L owes no tax', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 105550 }); // *12 - 75,000 = 1,191,600
        expect(result.taxableIncome).toBe(1191600);
        expect(result.rebate).toBe(result.taxBeforeRebate);
        expect(result.marginalRelief).toBe(0);
        expect(result.totalTax).toBe(0);
        expect(result.tdsPerMonth).toBe(0);
    });

    it('taxable income sufficiently above the marginal-relief range owes the full slab tax, with no relief benefit', async () => {
        // *12 - 75,000 = 1,400,000 — well past the point where slab tax itself drops below
        // the ₹12L excess, so MIN(slabTax, excess) just returns the slab tax unchanged.
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 1475000 / 12 });
        expect(result.taxableIncome).toBe(1400000);
        expect(result.taxBeforeRebate).toBe(90000);
        expect(result.marginalRelief).toBe(0);
        expect(result.tax).toBe(90000);
        expect(result.cess).toBeCloseTo(3600, 0);
        expect(result.totalTax).toBeCloseTo(93600, 0);
        expect(result.tdsPerMonth).toBe(7800); // 93,600 / 12 exactly
    });

    it('taxable arrears are folded into ONE projected annual income, not taxed separately — matches the ₹12,20,767 worked example', async () => {
        // Regular annual gross ₹12,86,600 + taxable arrears ₹9,167 = ₹12,95,767 projected
        // annual gross; − ₹75,000 standard deduction = ₹12,20,767 taxable income.
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 1286600 / 12, arrears: 9167 });

        expect(result.grossAnnual).toBe(1295767);
        expect(result.taxableIncome).toBe(1220767);
        expect(result.taxBeforeRebate).toBeCloseTo(63115, 0);
        expect(result.rebate).toBe(0);
        expect(result.marginalRelief).toBeCloseTo(42348, 0);
        expect(result.tax).toBe(20767);
        expect(result.cess).toBeCloseTo(831, 0);
        expect(result.totalTax).toBeCloseTo(21598, 0);
        // The whole point of this fix: monthly TDS is the complete annual tax ÷ 12 — not a
        // normal monthly figure plus a separately-added incremental tax from the arrears.
        expect(result.tdsPerMonth).toBe(1800); // ≈ 21,598 / 12 ≈ 1,799.83, rounds to 1,800
    });

    it('taxable bonus is folded into the same projected annual income as arrears would be', async () => {
        // Recurring alone (₹1,05,550 × 12 − 75,000 = ₹11,91,600) owes nothing; the ₹9,167
        // bonus this cycle pushes projected annual income to ₹12,00,767, just past ₹12L.
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 105550, bonus: 9167 });
        expect(result.taxableIncome).toBe(1200767);
        expect(result.rebate).toBe(0);
        expect(result.marginalRelief).toBeGreaterThan(0);
        expect(result.tax).toBe(767); // capped at the ₹767 excess over ₹12,00,000
        expect(result.totalTax).toBeCloseTo(798, 0);
    });

    it('taxable incentives are folded into the same projected annual income as arrears/bonus would be', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 105550, incentives: 9167 });
        expect(result.taxableIncome).toBe(1200767);
        expect(result.tax).toBe(767);
        expect(result.totalTax).toBeCloseTo(798, 0);
    });

    it('arrears + bonus + incentives together are summed into the SAME single projected annual income, not taxed individually', async () => {
        const result = await calculateTax({
            fy: '2025-26',
            regime: 'new',
            basicSalary: 105550,
            arrears: 3000,
            bonus: 3000,
            incentives: 3167, // sums to the same 9,167 as the single-source tests above
        });
        expect(result.taxableIncome).toBe(1200767);
        expect(result.tax).toBe(767);
        expect(result.totalTax).toBeCloseTo(798, 0);
    });

    it('additional taxable earnings crossing the ₹12L line trigger marginal relief that recurring pay alone would not', async () => {
        const recurringOnly = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 105550 });
        const withArrears = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 105550, arrears: 9167 });

        expect(recurringOnly.taxableIncome).toBeLessThan(1200000);
        expect(recurringOnly.totalTax).toBe(0);
        expect(withArrears.taxableIncome).toBeGreaterThan(1200000);
        expect(withArrears.marginalRelief).toBeGreaterThan(0);
        expect(withArrears.totalTax).toBeGreaterThan(0);
    });

    it('never deducts employee PF from taxable income under the New Regime, however large — take-home is still reduced separately', async () => {
        const withoutPf = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 90000 });
        const withHighPf = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 90000, pf: 12, pfOptedVoluntary: 500000 });

        expect(withoutPf.deduction80C).toBe(0);
        expect(withHighPf.deduction80C).toBe(0);
        expect(withHighPf.taxableIncome).toBe(withoutPf.taxableIncome);
        // PF still correctly reduces annual take-home (a separate deduction, not a tax exemption).
        expect(withHighPf.employeePF).toBeGreaterThan(withoutPf.employeePF);
        expect(withHighPf.annualTakeHome).toBeLessThan(withoutPf.annualTakeHome);
    });

    it('monthly TDS is always exactly the complete projected annual tax ÷ 12, with or without one-off earnings', async () => {
        const noOneOff = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 108000 });
        const withOneOff = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 1286600 / 12, arrears: 9167 });

        expect(noOneOff.tdsPerMonth).toBeCloseTo(noOneOff.totalTax / 12, 0);
        expect(withOneOff.tdsPerMonth).toBeCloseTo(withOneOff.totalTax / 12, 0);
    });
});

// Every case below hits an EXACT whole-rupee taxable income by combining a round monthly
// basicSalary (annualized ×12) with `arrears` (added as-is, never annualized) to make up
// the remainder — avoids the floating-point drift a non-round basicSalary×12 would
// introduce, so every assertion below can compare exact integers, not toBeCloseTo.
describe('calculateTax — surcharge with marginal relief (₹50L / ₹1Cr / ₹2Cr / ₹5Cr boundaries)', () => {
    it('is nil below ₹50L, leaving totalTax exactly what it was before surcharge existed', async () => {
        // ₹30L taxable — basicSalary 250000×12 + arrears 75000 = 3,075,000 gross; −75,000 = 3,000,000.
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 250000, arrears: 75000 });

        expect(result.taxableIncome).toBe(3000000);
        expect(result.taxBeforeRebate).toBe(480000);
        expect(result.tax).toBe(480000);
        expect(result.surcharge).toBe(0);
        expect(result.cess).toBe(19200);
        expect(result.totalTax).toBe(499200);
    });

    it('is nil exactly AT ₹50L — the threshold itself still belongs to the 0% band', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 400000, arrears: 275000 });

        expect(result.taxableIncome).toBe(5000000);
        expect(result.tax).toBe(1080000);
        expect(result.surcharge).toBe(0);
        expect(result.totalTax).toBe(1123200); // 1,080,000 + 0 + 4% cess (43,200)
    });

    it('₹50,50,000 — marginal relief caps the 10% surcharge (worked example)', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 400000, arrears: 325000 });

        expect(result.taxableIncome).toBe(5050000);
        expect(result.tax).toBe(1095000);
        expect(result.surcharge).toBe(35000); // normal 10% would be 109,500 — relief caps it here
        expect(result.cess).toBe(45200);
        expect(result.totalTax).toBe(1175200);
        expect(result.tdsPerMonth).toBeCloseTo(97933, 0);
    });

    it('₹60L — full 10% surcharge applies, no marginal relief needed (worked example)', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 500000, arrears: 75000 });

        expect(result.taxableIncome).toBe(6000000);
        expect(result.tax).toBe(1380000);
        expect(result.surcharge).toBe(138000); // exactly 10% of 1,380,000 — untouched by relief
        expect(result.cess).toBe(60720);
        expect(result.totalTax).toBe(1578720);
        expect(result.tdsPerMonth).toBeCloseTo(131560, 0);
    });

    it('is still 10% exactly AT ₹1 crore — only STRICTLY above it steps up to 15%', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 800000, arrears: 475000 });

        expect(result.taxableIncome).toBe(10000000);
        expect(result.tax).toBe(2580000);
        expect(result.surcharge).toBe(258000); // 10%, not 15%
        expect(result.totalTax).toBe(2951520);
    });

    it('₹1,01,00,000 — marginal relief caps the 15% surcharge just past ₹1Cr (worked example)', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 800000, arrears: 575000 });

        expect(result.taxableIncome).toBe(10100000);
        expect(result.tax).toBe(2610000);
        expect(result.surcharge).toBe(328000); // normal 15% would be 391,500 — relief caps it here
        expect(result.cess).toBe(117520);
        expect(result.totalTax).toBe(3055520);
        expect(result.tdsPerMonth).toBeCloseTo(254627, 0);
    });

    it('₹1,02,00,000 — comfortably past the relief band, full 15% surcharge stands', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 800000, arrears: 675000 });

        expect(result.taxableIncome).toBe(10200000);
        expect(result.tax).toBe(2640000);
        expect(result.surcharge).toBe(396000); // exactly 15% — no relief left to apply
        expect(result.totalTax).toBe(3157440);
    });

    it('is still 15% exactly AT ₹2 crore — only STRICTLY above it steps up to 25%', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 1600000, arrears: 875000 });

        expect(result.taxableIncome).toBe(20000000);
        expect(result.tax).toBe(5580000);
        expect(result.surcharge).toBe(837000); // 15%, not 25%
        expect(result.totalTax).toBe(6673680);
    });

    it('is still 25% exactly AT ₹5 crore — the New-regime cap and the Old-regime step-up both wait until strictly above it', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 4000000, arrears: 2075000 });

        expect(result.taxableIncome).toBe(50000000);
        expect(result.tax).toBe(14580000);
        expect(result.surcharge).toBe(3645000); // 25%, not yet 37% (that's Old regime only, strictly above)
        expect(result.totalTax).toBe(18954000);
    });

    it('New regime never exceeds a 25% surcharge, even far above ₹5 crore', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 5000000, arrears: 75000 });

        expect(result.taxableIncome).toBe(60000000);
        expect(result.tax).toBe(17580000);
        expect(result.surcharge).toBe(4395000); // exactly 25%, not 37%
        expect(result.totalTax).toBe(22854000);
    });

    it('Old regime applies the same 10% surcharge above ₹50L, away from any relief boundary', async () => {
        // pf: 0 — zeroes the Old-regime 80C deduction so taxableIncome = grossAnnual − 50,000 exactly.
        const result = await calculateTax({
            fy: '2025-26', regime: 'old', basicSalary: 650000, arrears: 250000, pf: 0,
        });

        expect(result.taxableIncome).toBe(8000000);
        expect(result.tax).toBe(2212500);
        expect(result.surcharge).toBe(221250); // exactly 10%
        expect(result.totalTax).toBe(2531100);
    });

    it('Old regime marginal relief also applies just above ₹50L, reducing surcharge below the flat 10%', async () => {
        // ₹51L — close enough to ₹50L that Old regime's steep 30% top slab (from just ₹10L)
        // pushes tax+normalSurcharge past the relief cap, same mechanism as the ₹50,50,000
        // New-regime case above, just against Old regime's own (much lower) tax-at-threshold.
        const result = await calculateTax({
            fy: '2025-26', regime: 'old', basicSalary: 400000, arrears: 350000, pf: 0,
        });

        expect(result.taxableIncome).toBe(5100000);
        expect(result.tax).toBe(1342500);
        expect(result.surcharge).toBe(70000); // normal 10% would be 134,250 — relief caps it here
        expect(result.totalTax).toBe(1469000);
    });

    it('never lets surcharge go negative, across every boundary in both regimes', async () => {
        // A defensive property check for the Math.max(0, cap − tax) floor — sweeps incomes
        // from ₹30L up to ₹8Cr (crossing all four boundaries) for both regimes, rather than
        // relying on one hand-picked figure to happen to exercise it.
        const regimes = ['old', 'new'];
        const basicSalaries = [300000, 420000, 425000, 500000, 833000, 840000, 850000, 1670000, 1680000, 4170000, 4180000, 6000000];

        for (const regime of regimes) {
            for (const basicSalary of basicSalaries) {
                // eslint-disable-next-line no-await-in-loop
                const result = await calculateTax({ fy: '2025-26', regime, basicSalary, pf: 0 });
                expect(result.surcharge).toBeGreaterThanOrEqual(0);
            }
        }
    });

    it('Section 87A and surcharge apply independently — no 87A rebate/relief left at ₹60L, yet surcharge still activates', async () => {
        const result = await calculateTax({ fy: '2025-26', regime: 'new', basicSalary: 500000, arrears: 75000 });

        expect(result.rebate).toBe(0);
        expect(result.marginalRelief).toBe(0); // Section 87A's OWN relief, not surcharge's
        expect(result.tax).toBe(result.taxBeforeRebate); // untouched by 87A at this income
        expect(result.surcharge).toBeGreaterThan(0); // surcharge still applies on top
        expect(result.surcharge).toBe(138000);
    });
});

describe('calculateTax — 80C credited on the PF actually deducted', () => {
    // Dev Notes sample employee — Basic ₹48,100, gross ₹96,200; PF capped at ₹3,000/month.
    const base = { fy: '2026-27', basicSalary: 48100, hra: 24050, otherAllowances: 24050 };

    it('omitting employeePfMonthly keeps the old 12%-of-Basic assumption exactly', async () => {
        const before = await calculateTax({ ...base, regime: 'old' });
        expect(before.deduction80C).toBe(Math.min(48100 * 12 * 0.12, 150000));
    });

    it('old regime — capped PF (₹3,000/month) gives ₹36,000 of 80C, not 12% of full Basic', async () => {
        const result = await calculateTax({ ...base, regime: 'old', employeePfMonthly: 3000 });
        expect(result.deduction80C).toBe(36000);
    });

    it('old regime — no PF deducted (EPF off, or employee opted out) gives no PF 80C credit', async () => {
        const result = await calculateTax({ ...base, regime: 'old', employeePfMonthly: 0 });
        expect(result.deduction80C).toBe(0);
    });

    it('counts an arrears PF top-up once, not x12', async () => {
        const result = await calculateTax({ ...base, regime: 'old', employeePfMonthly: 3000, employeePfOneOff: 500 });
        expect(result.deduction80C).toBe(36500);
    });

    it('new regime — tax is identical whatever PF is passed (no 80C there)', async () => {
        const assumed = await calculateTax({ ...base, regime: 'new' });
        const actual = await calculateTax({ ...base, regime: 'new', employeePfMonthly: 0 });
        expect(actual.totalTax).toBe(assumed.totalTax);
        expect(actual.tdsPerMonth).toBe(assumed.tdsPerMonth);
    });
});
