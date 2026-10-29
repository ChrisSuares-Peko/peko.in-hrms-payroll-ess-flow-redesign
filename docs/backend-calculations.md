# Backend payroll calculations (reference for the Payroll / ESS prototype)

<!-- PROTOTYPE-SETUP: reference for demo numbers; DEMO_EMPLOYEE figures (src/prototype/demoEmployee.ts) must follow these formulas. -->

Source: `backend-reference/` (read-only copy of Peko's Node.js backend). All paths below are relative to the repo root. Line numbers refer to the files as they are in this repo.

The live payroll engine is **`processEmpSalary`** in `backend-reference/payroll/src/services/salary.js:1264-1834` (engine version 4, `services/salary.js:1099-1105`). The older `processSalary` (`services/salary.js:135-285`) and the copy in `backend-reference/scheduler/services/salary.js:124` use a legacy flat `salaryInformation` model (basicPay + allowances, gross ÷ cycle days). They are not the current calculation and are not documented further. `backend-reference/users` and `backend-reference/sharedServices` contain no payroll math. The scheduler only has legacy copies and the increment cron.

Abbreviations: `S = backend-reference/payroll/src`.

---

## 0. Payroll period, days basis, rounding conventions

| Item | Rule | Source |
|---|---|---|
| Salary cycle | `salaryCycleDay` from Organization Settings (default **1**). If the day is < 15, the cycle runs from day *d* of month M to day *d−1* of month M+1. With day 1, Oct 2026 = **1 Oct 00:00Z to 31 Oct 23:59:59.999Z**. If the previous month was already processed, the cycle starts the day after its `salaryCycleEnd`. | `S/services/salary.js:832-877`, `S/models/use-cases/salary.js:968-981`, `S/models/entities/organizationSettings.js:97-101` |
| Cycle days | `getDaysDifference(cycleStart, cycleEnd)` = `round(|end−start| / 1 day)` → 31 for Oct. | `S/utils/dateUtils.js:70-81` |
| Per-day divisor | `ACTUALDAYS` (the default when `calculateSalaryBasedOn` is unset) uses calendar cycle days. `COMPANYWORKINGDAYS` with `selectWorkingDays` set counts only the selected weekdays in the cycle. Holidays are never excluded. | `S/utils/dateUtils.js:200-206`, `S/utils/dateUtils.js:138-155`, `S/models/entities/organizationSettings.js:84-88` |
| Money rounding | Earnings are kept to the paisa (`round(x×100)/100`). PF is rounded to the rupee. ESI is rounded **up** (`Math.ceil`). TDS is rounded to the rupee. **Net pay is rounded once, to the nearest rupee.** | `S/models/use-cases/salaryComponent.js:32`, `:1665`; `S/models/use-cases/ctcCalculator.js:140-141`; `S/services/salary.js:1197`, `:1676-1688` |
| Financial year | `fyStart = month ≥ 4 ? year : year−1`, giving `fy = "YYYY-YY"` (Oct 2026 → `"2026-27"`). | `S/services/salary.js:1296-1301` |

---

## 1. CTC breakdown and gross salary

### 1.1 Default component setup (seeded per org)
`S/utils/defaultSalaryComponents.js:1-41`:

| Component | Type | Rule |
|---|---|---|
| Basic Salary | PERCENTAGE, basis `GROSS_SALARY` | **50% of Gross** |
| House Rent Allowance | PERCENTAGE, basis `BASIC_SALARY` | **50% of Basic** |
| Other Allowance | BALANCING | Gross − every other part-of-gross earning |

No deduction components are seeded (`S/utils/defaultSalaryComponents.js:104-108`). PF is upserted lazily as the global deduction `"Provident Fund (PF)"`, PERCENTAGE 12, ACTIVE (`S/models/use-cases/complianceSettings.js:20-65`). Dearness Allowance, Conveyance and Medical are not seeded. Basic can also be configured as "% of CTC" or FIXED (`S/models/use-cases/reviseSalary.js:62-70`).

### 1.2 CTC → Gross solve (`solveEarningsForCtc`)
`S/models/use-cases/reviseSalary.js:90-292`. The same solver is used by Revise Salary, the CTC tab (`S/models/use-cases/ctcCalculator.js:336-338`), bulk upload (`S/models/use-cases/bulkEmployeeCtc.js:85-94`) and the payroll run (`S/models/use-cases/salaryComponent.js:1170-1207`).

```
monthlyCTC = annualCTC / 12                      (committed SalaryStructureVersion.annualCTC)
gross₀ = monthlyCTC
repeat ≤ 20 times (stop when |Δ| < 0.01):        reviseSalary.js:160-198
    basic       = 50% × gross                    (Basic rule)
    employerPF  = calculateEmployerPfContribution(basic).total      (EPS+ER-EPF+EDLI+Admin; 0 if EPF off)
    nonGross    = Σ earnings flagged isPartOfGross=false
    employerESI = ceil(gross × 3.25%) if ESI not disabled and 0 < gross ≤ ceiling (21,000 / 25,000) else 0
    gross       = monthlyCTC − employerPF − nonGross − employerESI
HRA = 50% × basic; other FIXED/% earnings resolved
Balancing (Other Allowance) = gross − Σ part-of-gross earnings  (floored at 0 for display; negative → revision rejected)
every amount rounded to the paisa                                 reviseSalary.js:220-281
```

**Cost to company** = `gross + employerPf.total + employerESI + nonGrossTotal` (`S/models/use-cases/ctcCalculator.js:447`). LWF employer share is paid on top and is not part of CTC (`:443-446`). The headline Annual CTC is the committed `annualCTC` (`:504`).

### 1.3 Gross used in a payroll month
`S/models/use-cases/salaryComponent.js:1069-1262` resolves the month's earnings:
- If a later revision has superseded this month's version, the frozen snapshot is used (`:1165-1169`).
- Otherwise, if a committed CTC exists, the current definitions are re-solved against it under that month's EPF setting (`:1170-1207`).
- Otherwise the CTC is reconstructed and back-filled through `getEmployeeCtcBreakdown` (`:1208-1254`).

Gross = Σ `calculatedAmount` of earnings where `isPartOfGross !== false` (`S/models/use-cases/salaryComponent.js:1260-1262`, again in `S/services/salary.js:1441-1444`).

### 1.4 Net salary (total payable)
`S/services/salary.js:1677-1688`:

```
totalPayable = round(
    grossSalary                       (paid gross: after LOP / part-month proration)
  − leaveDeduction                    (unpaid leave-application days, §7.2)
  − deductionAmount                   (Σ deduction components incl. PF, PT, etc. + LWF + arrears-PF top-up + ESI employee)
  − tdsAmount                         (round(monthly TDS))
  − totalOneTimeDeduction             (Add Deduction recoveries, §11)
  + bonus + incentives + overtime + reimbursements + arrears )
```

`deductionAmount` is defined at `S/services/salary.js:1173-1176`. The "Gross Income" figure used for the 50% recovery cap is `grossSalary + bonus + incentives + overtime`. It excludes reimbursements and arrears (`S/services/salary.js:1658`).

---

## 2. Provident Fund (EPF / EPS / VPF)

All PF math lives in `S/services/calculateEmployerPf.js`. The frontend mirror is `src/domains/dashboard/Payroll/utils/ctcCalculator/calculateEmployerPf.ts`.

| Item | Rule | Source |
|---|---|---|
| Wage ceiling | **₹15,000 up to Aug 2026. Sep 2026 is split by day: 1–16 Sep at ₹15,000, 17–30 Sep at ₹25,000 (blended ₹19,667). ₹25,000 from Oct 2026.** The ceiling is chosen by payroll month/year, not today's date. | `calculateEmployerPf.js:1-64` |
| PF policy | `pfWagesPolicy`: `CAPPED_15000` (the default) or `FULL_BASIC`. Legacy text is parsed if the field is absent. | `S/models/entities/complianceSettings.js:29-33`, `calculateEmployerPf.js:126-132` |
| PF wage | `CAPPED`: `min(Basic, ceiling)` (day-weighted in Sep 2026). `FULL_BASIC`: Basic. **PF base is Basic only. DA, HRA and allowances are not included.** | `calculateEmployerPf.js:66-69` |
| Employee PF | Deduction component 12% of **Basic**, capped by `capPfAmount` at `round(ceiling × 12%)`: ₹1,800, then ₹2,360 for Sep 2026, then **₹3,000 from Oct 2026**. No cap under `FULL_BASIC`. A PF row auto-frozen to FIXED re-heals to `cap(0.12 × Basic)`. | `S/models/use-cases/salaryComponent.js:752-787`, `:1516-1526`, `:1553`; `calculateEmployerPf.js:71-81` |
| Employer breakup | `employeeEpf = round(pfWage×12%)`; `ERshare = round(pfWage×12%)`; `EPS = round(pfWage×8.33%)`; `ER-EPF = ERshare − EPS`; `EDLI = round(pfWage×0.5%)`; `Admin = round(pfWage×0.5%)`; `employerTotal = EPS+ER-EPF+EDLI+Admin` (this is what CTC nets out). Note: EPS is 8.33% of the same pfWage. There is no separate ₹15,000 EPS cap. | `calculateEmployerPf.js:14-18`, `:88-119` |
| In payroll | The employer breakup is computed on the **paid** Basic for the month (`adjustedBasic`). | `S/services/salary.js:1602-1605` |
| EPF applicability | Org switch `epf.isApplicable` (default ON), resolved per month from `applicabilityHistory`. EPF is mandatory at ≥ 20 employees and is auto-switched back on. When off, the PF deduction is dropped and employer PF leaves the CTC, so the whole CTC goes to earnings. The per-employee toggle `otherConfigurations.enableEPF` (default true) makes the employee's PF row INACTIVE. | `calculateEmployerPf.js:158-169`; `S/models/use-cases/complianceSettings.js:116-118`, `:254-272`; `S/models/use-cases/salaryComponent.js:1122-1127`; `S/models/entities/employee.js:209-218` |
| Arrears PF top-up | `max(0, pfWage(Basic+arrearsBasic) − pfWage(Basic)) × 12%`, only if PF is deducted this month. | `S/services/salary.js:1513-1527` |
| "PF in earnings" | Display only. Adds an employee-PF line to earnings and reduces Balancing by the same amount. Money is unchanged. | `S/services/salary.js:1629-1641`, `S/models/entities/complianceSettings.js:64-70` |
| VPF | `calculateTax` accepts `pfOptedVoluntary` (₹/year, added to 80C PF), but **the payroll run never passes it, and no VPF deduction or employee field exists**. VPF can only exist as a custom deduction component that someone configures. | `S/services/salary.js:1866-1867`, `:1903-1905`, `:1548-1566` |
| Legacy constant | `PF_MONTHLY_CAP = 1800` is exported but unused by calculations. | `S/models/use-cases/salaryComponent.js:30-33` |

---

## 3. ESI

`S/models/use-cases/ctcCalculator.js:26-29`, `:63-73`, `:98-146`. Frontend mirror: `src/domains/dashboard/Payroll/utils/ctcCalculator/calculateCtcBreakdown.ts:17-18`, `:246`.

```
ceiling   = 21,000  (25,000 if employee.isDiffrentlyAbled)
eligible  = enableESI !== false AND ( 0 < fullMonthGross ≤ ceiling  OR  covered since a date inside the current
            contribution period Apr–Sep / Oct–Mar )      ← continuation after a mid-period raise
employee  = ceil(paidGross × 0.75%)
employer  = ceil(paidGross × 3.25%)
```

- Eligibility uses the **full-month** gross. The contribution is on the **paid** gross after LOP or part-month (`S/services/salary.js:1593-1595`).
- The ESI wage base is the component gross only. **Overtime, bonus, incentives and arrears are not included.**
- ESI is never a deduction component. It is added into `deductionAmount` explicitly (`S/services/salary.js:1153-1158`, `:1173-1176`).
- Employer ESI is netted inside the CTC while gross ≤ ceiling. If coverage continues above the ceiling, the employer bears it on top of the CTC (`S/models/use-cases/reviseSalary.js:172-192`, `:543-548`).
- The rates are hard-coded. `complianceSettings.esi.employeeContribution` / `employerContribution` / `deductionCycle` are stored but **never read** by any calculation (`S/models/entities/complianceSettings.js:85-106`).

---

## 4. Professional Tax (state slabs): **not implemented in the backend**

- `complianceSettings.professionalTax.incomeSlabs[]` exists in the schema (`S/models/entities/complianceSettings.js:108-134`), but **nothing downstream reads it**. The validator's own comment says so (`S/utils/complianceSettings.js:155-173`). There is no state slab table anywhere in the backend.
- PT is an ordinary **deduction component named `"Professional Tax"`** whose amount HR configures, usually FIXED ₹/month. It is opt-in per employee: `otherConfigurations.professionalTax` defaults to false (`S/models/entities/employee.js:224`). The employee row is created **INACTIVE** (`S/models/use-cases/bulkEmployeeCtc.js:130-140`, `S/controller/employee.js:369-372`), and the toggle syncs the row's status (`S/controller/employee.js:2359-2378`).
- With LOP or a part month, PT stays at the full configured amount and is not prorated (`S/models/use-cases/salaryComponent.js:1661-1663`).
- PT is **not** deducted in TDS. `calculateTax` has no PT input, which is correct under the new regime. Form 16B has a `professionalTax` field that defaults to 0 (`S/models/entities/form16B.js:19`).
- Month-specific amounts (for example Karnataka's ₹300 in February) are not modelled. A FIXED component is the same every month.

LWF is related. It is per-employee and opt-in (`laborWelfareFund` default false, `S/models/entities/employee.js:226-244`). Amounts are FLAT or % of gross per employee, with no org default (`S/services/lwfCalc.js:3-9`). It fires only in the state's months: **Karnataka = December only** (`S/utils/lwfStateSchedule.js:4-14`, `:26-30`; `S/services/lwfCalc.js:17-85`; applied at `S/services/salary.js:1581-1582`).

---

## 5. TDS (income tax)

`calculateTax` is at `S/services/salary.js:1844-2206`. It is called from `S/services/salary.js:1536-1566`.

**Regime used by the payroll run.** The **org-level** `complianceSettings.tds.taxRegime` (default "New Tax Regime"; `S/models/entities/complianceSettings.js:154-158`) is read at `S/services/salary.js:1291-1294`. The employee's own `employeeInformation.taxRegime` / `otherConfigurations.tdsRegime` is **not** used by the engine. It only decides whether a manual TDS override is allowed (`S/models/use-cases/tdsOverride.js:15-29`).

**Old regime.** The note in the code says "the platform doesn't compute old-regime TDS yet". HR enters a monthly figure (`TdsOverride`), and that figure replaces the engine output for that month and for later months until the next entry (`S/services/salary.js:1568-1573`; `S/models/use-cases/tdsOverride.js:40-71`). The engine still computes old-regime numbers into `taxInformation`, as documented below.

```
Inputs per month (full-month figures when LOP / part month applies):     salary.js:1536-1566
  basic, hra, DA, otherAllowances = gross − basic − hra − DA
  one-offs this cycle: bonus, overtime, incentives, arrears, minus lossOfPay (= fullGross − paidGross)
  employeePfMonthly (actual PF deducted), employeePfOneOff (arrears PF top-up + paid−full PF delta)

grossAnnual    = 12 × (basic + DA + hra + otherAllowances) + (bonus + OT + incentives + arrears − lossOfPay)   :1885-1891
OLD only: HRA exemption = max(0, min(annualHRA, annualRent − 10%(Basic+DA), 40%/50%(Basic+DA)))           :2034-2048
          (rentPaid is always 0 from payroll → exemption 0; isMetro false)
standardDeduction = 75,000 if NEW and FY start ≥ 2025, else 50,000                                         :2052-2055
OLD only: 80C = min(employeePF annual (+VPF), 150,000); 80GG only if receivesHRA=false (never from payroll) :2062-2081
taxable = max(0, grossAnnual − HRAex − stdDed − 80C − 80GG)
slab tax:                                                                                                  :1930-1968
  OLD:            0–2.5L 0% | 2.5–5L 5% | 5–10L 20% | >10L 30%
  NEW FY 2024-25: 0–3L 0 | 3–7L 5 | 7–10L 10 | 10–12L 15 | 12–15L 20 | >15L 30
  NEW any other FY (2025-26, 2026-27, …): 0–4L 0 | 4–8L 5 | 8–12L 10 | 12–16L 15 | 16–20L 20 | 20–24L 25 | >24L 30
87A rebate: OLD taxable ≤ 5L → min(tax, 12,500); NEW taxable ≤ 12L (≤ 7L for FY 2024-25) → full tax           :2094-2105
marginal relief above the rebate limit: tax ≤ taxable − limit                                              :2107-2118
surcharge on post-rebate tax: >50L 10%, >1Cr 15%, >2Cr 25%, >5Cr 37% old / 25% new, with marginal relief   :1977-2022, :2120-2126
cess = 4% × (tax + surcharge)                                                                              :2128-2129
monthly TDS = round(totalTax / 12)                                                                         :2154, :2199
```

- **Projection.** Every month, the TDS is the projected annual tax ÷ 12. One-offs enter the annual projection once and are not annualised. There is **no** true-up for TDS already deducted and **no** division by the months remaining. A mid-year joiner or revision therefore gets the same ÷ 12 (`S/services/salary.js:2145-2154`).
- **Declarations are not used.** `IncomeDeclarationForm` (`S/models/entities/incomeDeclarationForm.js`) is never read by the tax engine. The payroll run passes no `rentPaid`, 80C/80D or LTA.
- **FY 2026-27.** There is no dedicated table. FY 2026-27 uses the FY 2025-26 new-regime slabs, the ₹75,000 standard deduction and the ₹12L rebate (`S/services/salary.js:1956-1968`).
- The per-employee `otherConfigurations.tds` toggle is shown in the UI (`S/controller/employee.js:2455`) but is **not checked** by the payroll run. TDS is computed for everyone.
- The Statutory tab shows the standard deduction as 50,000 for old and 75,000 for new (`S/controller/employee.js:2430-2431`).

---

## 6. Loss of Pay (LOP)

The LOP sheet stores one row per employee per month: `days` (half-day steps), `amount`, `isAmountOverridden` (`S/models/entities/lossOfPay.js:26-42`). Sheet maths: `perDayRate = round₂(grossBeforeLop / daysInMonth)`, `amount = round₂(perDayRate × days)`, and days ≤ eligible days (`S/services/lossOfPay.js:42-74`, `:158-173`).

Payroll application (`applyPaidDays`, `S/models/use-cases/salaryComponent.js:1599-1687`; called with `daysInMonth = perDayDivisor` from `S/services/salary.js:1377-1387`):

```
lopAmount  = overridden ? HR amount : round₂(fullGross × days / perDayDivisor), clamped to [0, eligibleGross]
paidShare  = eligibleShare − lopAmount / fullGross
each earning = round₂(fullAmount × paidShare)            (no per-component rounding beyond paise)
PF         = round( cap(12% × round₂(Basic × paidShare)) )   (ceiling not reduced)
GROSS_SALARY-% deductions recomputed on the paid gross; PT unchanged; FIXED company deductions unchanged by LOP
```

LOP is not a deduction line. It reduces the earnings, so PF, ESI and TDS follow (TDS through `lossOfPay` as a negative one-off). The days basis follows Payroll Settings: calendar days by default, working days if configured. LOP on an APPROVED-but-unpaid month triggers a recompute (`S/services/salary.js:1276-1281`, `S/services/lossOfPay.js:202-220`).

---

## 7. Pro-rata (joiners and leavers) and unpaid leave

### 7.1 Part month
`resolvePartMonthDays` (`S/utils/dateUtils.js:220-251`):

```
paidFrom = max(cycleStart, DOJ(IST date), payrollStartsFrom); paidTo = min(cycleEnd, lastWorkingDay)
daysInMonth = calendar cycle days (or working days in cycle if COMPANYWORKINGDAYS)
eligibleDays = inclusive count paidFrom..paidTo (same basis); unpaidDays = daysInMonth − eligibleDays
eligibleShare = eligibleDays / daysInMonth
```

`applyPaidDays` (`S/models/use-cases/salaryComponent.js:1622-1687`):
- Every earning is scaled by `eligibleShare` (combined with LOP when both apply).
- PF is recomputed on the paid Basic (`round`).
- FIXED/BALANCING deductions are prorated by `eligibleShare`.
- **PT is not prorated.**
- ESI eligibility uses the full-month gross.
- TDS uses the full month plus a negative one-off equal to the unpaid gross. The engine therefore projects eleven full months plus this reduced one, even for a mid-year joiner, which over-states the annual income.

Edge cases:
- An employee who is SUSPENDED/RESIGNED with a last working day before cycle start is skipped (`S/services/salary.js:1338-1341`).
- A record whose earnings are already prorated is marked `payDays.isEarningsProrated` (`S/services/salary.js:1715-1726`).

### 7.2 Unpaid leave applications (separate from the LOP sheet)
`fetchLeavesByEmployeeAndCorporateUser` (`S/models/use-cases/leaveApplication.js:29-110`). For each leave type, it counts days in the cycle that exceed the type's `maximumNumberOfLeaves` once days taken earlier are included:

```
leaveCount += max(0, prior + taken − max) − max(0, prior − max)
leaveDeduction = (fullGross / perDayDivisor) × leaveCount
```

The result is subtracted from net as `leaveDeduction` (`S/services/salary.js:1449-1470`, `:1677-1688`). It does **not** reduce PF, ESI or TDS. An over-limit leave plus an LOP-sheet entry for the same day would deduct twice. Nothing deduplicates them.

---

## 8. Overtime

- Request lifecycle: an approved record or an HR-created record is paid. A record with status `requestedByEmployee` is excluded (`S/models/use-cases/overTime.js:271-293`).
- Approval requires an OT rate (multiplier) from HR. There is no default (`S/controller/overTime.js:376-416`).
- Formula (`S/services/overtime.js:4-92`):

```
hourlyRate   = ( BasicComponent.amountPercentage / (employeeInformation.workingDays × employeeInformation.workingHours) ).toFixed(2)
overtimePay  = ( extraHours × hourlyRate × overTimeRate ).toFixed(2)        → stored as overTimeAmount
```

`workingDays` is per month (1–31; frontend `src/domains/dashboard/Payroll/schema/bulkUploadSchema.ts:68-70`). `workingHours` is derived from the time schedule (`src/domains/dashboard/Payroll/components/employeeDetails/forms/EmployeeInformationsDrawer.tsx:284-288`).

**Bug:** the formula reads the Basic component's raw `amountPercentage`. With the default Basic (PERCENTAGE "50% of Gross"), that value is **50**, not rupees. Revise Salary and bulk upload keep Basic as PERCENTAGE (`S/models/use-cases/reviseSalary.js:609-618`; `S/models/use-cases/bulkEmployeeCtc.js:106-119`). The rate is only correct when Basic is stored FIXED.

Payroll treatment:
- OT is summed for UNPAID records whose `overTimeDate` falls in the cycle.
- It is added to net and to "Gross Income".
- In TDS it is a one-off.
- It is **not** in the PF or ESI base (`S/services/salary.js:1491-1495`, `:1556`, `:1658`).

---

## 9. Leave accrual and leave encashment

**Accrual** (`S/models/use-cases/leaveBalance.js:11-108`; `S/utils/leavePolicy.js:2-13`):

| accrualType | Opening/available balance |
|---|---|
| FIXED | `maximumNumberOfLeaves` |
| MONTHLY / ACCRUAL | `min(monthsElapsedInFY × accrualRate, maximumAccrual ∥ maximumNumberOfLeaves)` (FY from 1 Apr; e.g. Oct = 7 months) |
| DAILY | `min(daysElapsedInCalendarYear × rate, max)` |
| YEARLY | `min(accrualRate, max)` |

Carry-over: only when the job runs on **1 April** and `leaveBalanceCarryover = 'ALLOWED'`. Then `carryOverBalance = unused` and `availableLeave += unused`. There is no cap (`S/models/use-cases/leaveBalance.js:89-101`).

The balance is computed only when a record is created or updated. There is no periodic accrual cron in `payroll/` or `scheduler/`.

Seeded leave types (`S/utils/defaultLeaveComponents.js:1-53`):

| Leave type | Accrual | Days | Carry-over | Restriction |
|---|---|---|---|---|
| Annual Leave | FIXED | 30 | allowed | — |
| Sick Leave | FIXED | 15 | not allowed | — |
| Maternity Leave | FIXED | 90 | not allowed | female |
| Paternity Leave | FIXED | 7 | not allowed | male |
| Casual Leave | MONTHLY | 1/month, max 12 | not allowed | — |

**Encashment: not implemented.** The only trace is a `Bonus.type` value `LEAVE_ENCASHMENT` (`S/models/entities/bonus.js:26-32`; frontend label `src/domains/dashboard/Payroll/components/modals/BonusAndIncentiveModal.tsx:28`). HR types the amount, and no days × rate formula exists in the backend or the frontend. The amount is paid like any bonus (§10).

---

## 10. Bonus, incentives, one-time payments, reimbursements

| Item | How it reaches payroll | Taxed? | PF/ESI base? | Source |
|---|---|---|---|---|
| Bonus (types BONUS / JOINING_REFERRAL_BONUS / COMMISSION / LEAVE_ENCASHMENT / SPOT_AWARD) | Σ `bonusAmount` where `bonusDate` is in the cycle and status UNPAID. Added to net and to "Gross Income". | Yes, as a one-off | No | `S/models/use-cases/bonus.js:145-165`; `S/services/salary.js:1479-1483` |
| Bonus % helper | `bonusAmount = basic × % / 100`. Reads `basicSalaryComponent.amount`, a field that does not exist on components, so the result is always 0. | — | — | `S/controller/bonus.js:202-268` |
| Incentives | Σ `amount` where `incentiveDate` is in the **calendar month** (not the cycle). The UNPAID filter is commented out. | Yes, as a one-off | No | `S/models/use-cases/incentives.js:129-160` |
| Reimbursements | Σ `totalPay` where `expenseDate` is in the cycle, `transferMethod = 'SALARY'`, status UNPAID/APPROVED, and the request is not `requestedByEmployee`. Added to net only. | **No** | No | `S/models/use-cases/reimbursement.js:7-35`; `S/services/salary.js:1497-1501`, `:1686` |
| One-time payment | A direct bank payout through Decentro (`OneTimePayment`). It sits **outside the payroll calculation**: not in gross, TDS or net. | No | No | `S/models/entities/oneTimePayment.js:10-32`; `S/controller/oneTimePayment.js:130-215` |

---

## 11. Deductions, recoveries, arrears, increments, gratuity

- **Recurring deduction components.** These are FIXED (₹/month, or ÷ 12 if YEARLY) or PERCENTAGE of Basic, or of "gross minus the non-gross-based deductions" when `salaryDeductionType = GROSS_SALARY`, computed in two passes (`S/models/use-cases/salaryComponent.js:1487-1597`).
- **One-time recoveries (Add Deduction).** Applied after PF, ESI, PT, LWF and TDS:

  ```
  room = floor(50% × monthGross − (deductionAmount + TDS))
  ```

  Recoveries are applied oldest first, and the rest carries forward (`S/utils/oneTimeDeductionTypes.js:15-34`; `S/services/salary.js:1646-1674`). The legacy `checkDeductionAmount` caps total deductions at basicPay, an old field (`S/utils/deductionAmount.js:5-48`).
- **Salary revision and arrears.** A revision commits a new `SalaryStructureVersion` and re-solves §1.2 (`S/models/use-cases/reviseSalary.js:411-600`). For each already-paid covered month:

  ```
  differential      = round(newGross − oldGross)
  basicDifferential = round(newBasic − oldBasic)
  ```

  Old gross is taken as basicPay + hra + da + other. The sum is paid in the next unprocessed month (`S/models/use-cases/reviseSalary.js:670-725`, `:1011-1024`). Arrears add to net, enter TDS as a one-off, and attract the PF top-up (§2). They do not affect ESI.
- **Increments (legacy module).** `adjustedBasic = componentBasic + Σ Increment.amount` (status `reflected`, effectiveDate in [DOJ, end of month]), scaled by paidShare under proration. Only Basic moves. HRA and Balancing are not re-derived (`S/services/increment.js:79-118`; `S/services/salary.js:1405-1431`). The amount is `basic × %` or flat (`S/controller/increment.js:140-199`). The cron sets status to `reflected` (`backend-reference/scheduler/services/increment.js`).
- **Gratuity (calculator only, not in payroll or CTC).**

  ```
  dailyWage = basic / 30
  gratuity  = min(dailyWage × 21 × min(5, yrs) + dailyWage × 30 × max(0, yrs − 5), basic × 24)
  ```

  `yrs = int(days / 365.25)` (`S/services/calculateGratuity.js:1-9`; `S/services/calculateExperience.js:1-11`; `S/controller/gratuity.js:5-30`). This is a **UAE-style** formula (the log line says "Dh"). It is **not** the Indian 15/26 × years formula.

---

## 12. What the frontend computes itself

- `src/domains/dashboard/Payroll/utils/ctcCalculator/calculateCtcBreakdown.ts` and `calculateEmployerPf.ts` are a client-side copy of §1.2, §2 and §3 for live previews (CTC Calculator, Revise Salary, New Hire). The constants are identical.
- `src/domains/dashboard/Payroll/components/modals/LossOfPayModal.tsx:27-29`, `:80` recomputes `amount = round₂(perDayRate × days)` (half-day steps) while HR types. The backend recomputes on save.
- Nothing in `src/domains/employee` (ESS) computes pay. It displays backend figures.

---

## Worked example: DEMO_EMPLOYEE

### Assumptions (backend defaults unless stated)

**From the brief**
- Annual CTC ₹9,60,000, committed as a `SalaryStructureVersion` → monthlyCTC ₹80,000.
- Joined 2024-04-15.
- Work state Karnataka.
- 1 LOP day in Oct 2026, entered on the LOP sheet (no over-limit leave applications, so `leaveCount = 0`).
- 4 OT hours approved.
- One approved reimbursement of ₹2,450 with `transferMethod = SALARY`.
- No bonus, incentive, arrears, increment or declarations.

**Org defaults**
- Seeded components: Basic 50% of Gross, HRA 50% of Basic, Other Allowance = Balancing (`S/utils/defaultSalaryComponents.js:1-41`).
- PF row 12% (`S/models/use-cases/complianceSettings.js:41-48`).
- `pfWagesPolicy = CAPPED_15000` (default). EPF applicable. ESI not disabled.
- Payroll cycle day 1, `ACTUALDAYS` → Oct 2026 = 31 days.

**Regime.** Org default "New Tax Regime". FY `"2026-27"` → the engine applies its FY 2025-26+ new-regime table (§5).

**Assumptions not provided by the backend** (each one changes a number below)
- **PT:** HR has switched PT on and configured a FIXED ₹200/month "Professional Tax" component. This is the Karnataka rate for gross ≥ ₹25,000. With the backend default (PT inactive), PT = ₹0 and net is ₹200 higher.
- **LWF:** off (default). It would only fire in December for Karnataka anyway.
- **Overtime:** `workingDays = 26`, `workingHours = 8`, OT rate 1.5 (the example in the UI tooltip), and Basic stored as a FIXED ₹38,375. With the default PERCENTAGE Basic, the backend would compute ₹1.44 (see the §8 bug).

### Step 1: CTC → earnings (full month, Oct 2026; ceiling ₹25,000 from Oct 2026)

| Step | Calculation | Result |
|---|---|---|
| Iteration 0 | gross = 80,000 → basic = 40,000 → pfWage = min(40,000, 25,000) = 25,000 → employer total = 3,000 + 125 + 125 = 3,250 → gross = 80,000 − 3,250 | 76,750 |
| Iteration 1 | basic = 38,375 → pfWage = 25,000 → employer total 3,250 → gross 76,750 (converged) | **Gross 76,750.00** |
| Basic | 50% × 76,750 | **38,375.00** |
| HRA | 50% × 38,375 | **19,187.50** |
| Other Allowance | 76,750 − 38,375 − 19,187.50 | **19,187.50** |
| Employee PF (full month) | cap(12% × 38,375 = 4,605) = min(4,605, round(25,000 × 12%) = 3,000) | **3,000** |
| Employer EPS | round(25,000 × 8.33%) = round(2,082.5) | **2,083** |
| Employer EPF | round(25,000 × 12%) − 2,083 | **917** |
| EDLI / Admin | round(25,000 × 0.5%) each | **125 / 125** |
| Employer PF total | 2,083 + 917 + 125 + 125 | **3,250** |
| ESI | full gross 76,750 > 21,000 → not eligible | **0 / 0** |
| CTC check | 76,750 + 3,250 + 0 | **80,000** ✓ |

### Step 2: LOP, 1 day (divisor 31)

| Step | Calculation | Result |
|---|---|---|
| LOP amount | round₂(76,750 × 1 / 31 = 2,475.806…) | **2,475.81** |
| paidShare | 1 − 2,475.81 / 76,750 | 0.96774189 |
| Paid Basic | round₂(38,375 × paidShare) | **37,137.10** |
| Paid HRA | round₂(19,187.50 × paidShare) | **18,568.55** |
| Paid Other Allowance | round₂(19,187.50 × paidShare) | **18,568.55** |
| Paid gross | 37,137.10 + 18,568.55 + 18,568.55 | **74,274.20** |
| Employee PF | round(cap(12% × 37,137.10 = 4,456.45) at 3,000) | **3,000** |
| Employer PF | pfWage = min(37,137.10, 25,000) = 25,000 → unchanged | **3,250** (2,083 / 917 / 125 / 125) |
| PT | Not prorated | **200** |
| ESI | Not eligible | **0** |
| Unpaid-leave deduction | leaveCount = 0 | **0** |

### Step 3: Variable pay

| Item | Calculation | Result |
|---|---|---|
| Overtime hourly rate | (38,375 / (26 × 8)).toFixed(2) = 184.4951… | 184.50 |
| Overtime pay | (4 × 184.50 × 1.5).toFixed(2) | **1,107.00** |
| Reimbursement | Approved claim, not taxed | **2,450.00** |
| Bonus / incentive / arrears | None | **0** |

### Step 4: TDS (new regime, FY 2026-27)

| Step | Calculation | Result |
|---|---|---|
| Recurring annual | 12 × 76,750 | 9,21,000.00 |
| One-offs | OT 1,107.00 − LOP (76,750 − 74,274.20 = 2,475.80) | −1,368.80 |
| Gross annual | 9,21,000 − 1,368.80 | 9,19,631.20 |
| Standard deduction | New regime, FY start ≥ 2025 | 75,000 |
| Taxable income | 9,19,631.20 − 75,000 | 8,44,631.20 |
| Slab tax | 0 (0–4L) + 20,000 (4–8L @ 5%) + 4,463.12 (8L–8,44,631.20 @ 10%) | 24,463.12 |
| 87A rebate | Taxable ≤ 12L → full | −24,463.12 |
| Tax after rebate / surcharge / cess | — | 0 / 0 / 0 |
| **Monthly TDS** | — | **0** |

### Step 5: Net pay

| Step | Calculation | Result |
|---|---|---|
| Total deductions | PF 3,000 + PT 200 + ESI 0 + LWF 0 + arrears-PF top-up 0 | 3,200 |
| TDS | — | 0 |
| One-time recovery | None. The 50% cap room would be floor(0.5 × 75,381.20 − 3,200) = 34,490. | 0 |
| Gross Income (for the cap) | 74,274.20 + 1,107 | 75,381.20 |
| **Net payable** | round(74,274.20 − 0 − 3,200 − 0 − 0 + 0 + 0 + 1,107 + 2,450 + 0) = round(74,631.20) | **₹74,631** |
| Net if PT is left at the backend default (off) | — | ₹74,831 |
| Payslip pay days | daysInMonth 31, eligible 31, LOP 1 | paid 30 |

### Annual figures (FY 2026-27, a regular month × 12, no LOP / OT / reimbursement)

| Item | Annual (₹) |
|---|---|
| CTC | 9,60,000 |
| Gross | 9,21,000 (Basic 4,60,500 · HRA 2,30,250 · Other Allowance 2,30,250) |
| Employer PF total | 39,000 (EPS 24,996 · ER-EPF 11,004 · EDLI 1,500 · Admin 1,500) |
| Employee PF | 36,000 |
| PT | 2,400 as the backend computes it (FIXED ₹200 × 12). The Karnataka statute is ₹2,500 (₹300 in February), which the backend cannot express automatically. |
| Taxable (new regime) | 9,21,000 − 75,000 = 8,46,000 |
| Slab tax | 20,000 + 4,600 = 24,600 |
| 87A rebate | 24,600 |
| Total tax / TDS | 0 |
| ESI | 0 |
| Regular monthly net | 76,750 − 3,000 − 200 = 73,550 |
| Annual net | 8,82,600 |

Note: these annual figures are computed on the ₹25,000 ceiling. The backend applies ₹15,000 to Apr–Aug 2026 and a blend to Sep 2026 (§2). The actual FY 2026-27 payslips for Apr–Sep would therefore differ: Apr–Aug have employer total ₹1,950 and gross ₹78,050 from the re-solve. Only Oct 2026 onward matches this table.

### Pro-rata example: joiner on 2026-10-15 (same ₹9.6L CTC, Oct 2026, no LOP)

| Step | Calculation | Result |
|---|---|---|
| Eligible days | 15–31 Oct inclusive | 17 |
| eligibleShare | 17 / 31 | 0.548387 |
| Basic | round₂(38,375 × 17/31) | **21,044.35** |
| HRA | round₂(19,187.50 × 17/31) | **10,522.18** |
| Other Allowance | round₂(19,187.50 × 17/31) | **10,522.18** |
| Paid gross | — | **42,088.71** |
| Employee PF | round(min(12% × 21,044.35 = 2,525.32, 3,000)) | **2,525** |
| Employer PF | pfWage 21,044.35 → EPS round(1,752.99) = 1,753 · ER-EPF 2,525 − 1,753 = 772 · EDLI 105 · Admin 105 | **2,735** |
| ESI | Full gross 76,750 → not eligible | **0** |
| PT | Not prorated | **200** |
| TDS | Annual 9,21,000 − 34,661.29 = 8,86,338.71 → taxable 8,11,338.71 ≤ 12L | **0** |
| **Net** | round(42,088.71 − 2,525 − 200) | **₹39,364** (₹39,564 with PT off) |

### Leave encashment: 5 days (no backend formula; illustrative only)

The backend only accepts an HR-typed `Bonus` of type `LEAVE_ENCASHMENT` (§9). For demo data, use the backend's own per-day convention (LOP sheet: `round₂(gross / daysInMonth)`, `S/services/lossOfPay.js:51-55`):

| Step | Calculation | Result |
|---|---|---|
| Per-day rate | round₂(76,750 / 31) | 2,475.81 |
| Encashment | round₂(2,475.81 × 5) | **₹12,379.05** |

Alternative convention, not in the code: Basic ÷ 30 × 5 = ₹6,395.83.

If paid in Oct 2026 as a bonus:
- It is added to net and to Gross Income.
- It enters TDS as a one-off: taxable 9,19,631.20 + 12,379.05 − 75,000 = 8,57,010.25 ≤ 12L, so TDS stays 0.
- It is not in the PF/ESI base.
- Oct net would become round(74,631.20 + 12,379.05) = ₹87,010.

### Monthly figures the frontend demo data must use (DEMO_EMPLOYEE, Oct 2026)

| Field | Value (₹) |
|---|---|
| Monthly CTC | 80,000.00 |
| Days in month / LOP days / paid days | 31 / 1 / 30 |
| Basic: full / paid | 38,375.00 / 37,137.10 |
| HRA: full / paid | 19,187.50 / 18,568.55 |
| Other Allowance: full / paid | 19,187.50 / 18,568.55 |
| Gross: full (before LOP) / paid | 76,750.00 / 74,274.20 |
| LOP amount (per-day rate) | 2,475.81 (2,475.81) |
| Overtime (4 h × 184.50 × 1.5) | 1,107.00 |
| Gross Income (paid gross + OT) | 75,381.20 |
| Reimbursement | 2,450.00 |
| Employee PF | 3,000 |
| ESI (employee / employer) | 0 / 0 |
| Professional Tax (configured) | 200 |
| LWF | 0 |
| TDS (new regime) | 0 |
| Total deductions | 3,200 |
| **Net pay** | **74,631** |
| Employer PF: EPS / ER-EPF / EDLI / Admin / total | 2,083 / 917 / 125 / 125 / 3,250 |
| Regular month without LOP/OT/reimbursement: gross / net | 76,750.00 / 73,550 |
| Joiner 15 Oct 2026: paid gross / PF / net | 42,088.71 / 2,525 / 39,364 |
| Leave encashment, 5 days (illustrative) | 12,379.05 |

---

## Not implemented in the backend (summary)

- **Professional Tax state slabs.** The schema field is unused. PT is a manually configured deduction component and is off by default.
- **TDS for the old regime.** It is entered manually by HR (`TdsOverride`).
- **Per-employee regime selection in the engine.** The engine uses the org regime.
- **The `tds` on/off toggle.** It is ignored by the engine.
- **Investment/HRA declarations feeding TDS.** `IncomeDeclarationForm` is not read. `rentPaid`, 80C, 80D and LTA are never passed.
- **A TDS true-up across the FY.** The engine uses a flat annual ÷ 12 with no months-remaining logic.
- **A dedicated FY 2026-27 slab table.** It reuses FY 2025-26.
- **VPF.** There is no field and no deduction. `calculateTax` accepts a parameter, but payroll never passes it.
- **Leave encashment formula.** Encashment is an HR-typed bonus amount.
- **Periodic leave accrual job.** Accrual is computed only when a balance is created. Carry-over happens only if the code runs on 1 April.
- **ESI on overtime/bonus.** These are excluded from the ESI wage base. ESI rates in Compliance Settings are unused (they are hard-coded).
- **A separate EPS ₹15,000 cap.** EPS is 8.33% of the same PF wage.
- **Indian gratuity (15/26).** The calculator uses a UAE-style formula and is not part of CTC or payroll.
- **One-time payments in payroll.** They are a separate bank payout.
- **Correct overtime and bonus-% bases.**
  - Overtime uses Basic's raw `amountPercentage`, which is 50 for a percentage Basic.
  - The bonus-% helper reads a non-existent `amount` field.
