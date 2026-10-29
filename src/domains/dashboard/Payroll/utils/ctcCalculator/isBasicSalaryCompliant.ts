// Basic Salary must be at least 50% of Gross to comply with the Labour Codes. Comparing
// raw rupee amounts with a strict `<` is unreliable: Basic is very often a value that was
// itself rounded to the nearest paisa when persisted (e.g. exactly 50% of a ₹1,07,916.67
// Gross is ₹53,958.335, which can only ever be STORED as ₹53,958.33 or ₹53,958.34), so a
// strict less-than comparison against a freshly recomputed Gross can flag a genuinely-50%
// Basic as non-compliant purely from that paisa-level rounding. Mirrors the backend's
// identical helper (payroll's mergeComponents.js) so every surface agrees.
//
// Two independent safeguards, either of which is enough to avoid the false positive:
//  1. `basicPercentOfGrossRule` — when Basic's own rule is known to be "X% of Gross" with
//     X >= 50, it can never be non-compliant, whatever the resolved rupee amounts say.
//     Pass this whenever the caller has it (a live PERCENTAGE/GROSS_SALARY rule, or a
//     percentage the user is directly entering); omit it (undefined) otherwise.
//  2. Otherwise (a FIXED Basic, or no rule available), compare on the PERCENTAGE rounded
//     to one decimal place rather than the raw rupee amounts — absorbs any paisa-level
//     rounding while still catching a genuinely low Basic (e.g. ₹40,000 on a ₹1,00,000
//     Gross rounds to 40.0%, still well under the 50.0% floor).
export const isBasicSalaryCompliant = (
    basicSalary: number,
    grossSalary: number,
    basicPercentOfGrossRule?: number
): boolean => {
    if (!(grossSalary > 0)) return true;
    if ((basicPercentOfGrossRule || 0) >= 50) return true;

    const percentOfGross = Math.round((basicSalary / grossSalary) * 1000) / 10;
    return percentOfGross >= 50;
};
