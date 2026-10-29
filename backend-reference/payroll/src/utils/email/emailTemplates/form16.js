/* eslint-disable no-inner-declarations */
const { escapeHtml, safeImageSrc } = require("../../escapeHtml");


exports.form16AHtml = (existingForm16A,watermarkImg) => {
  const {
    employeeDetails = {},
    employerDetails = {},
    quarterSummary = [],
    bookAdjustments = [],
    challans = []
  } = existingForm16A;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "-";

  const formatAmount = (amt) =>
    amt ? Number(amt).toLocaleString("en-IN") : "0";

  const totalPaid = quarterSummary.reduce(
    (a, b) => a + (b.amountPaidCredited || 0),
    0
  );

  const totalDeducted = quarterSummary.reduce(
    (a, b) => a + (b.taxDeducted || 0),
    0
  );

  const totalDeposited = quarterSummary.reduce(
    (a, b) => a + (b.taxDeposited || 0),
    0
  );

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>

body{
  font-family: Arial, Helvetica, sans-serif;
  font-size:9px;
  margin:0;
  padding:0;
  background:#ffffff;
}

.watermark{
  position:fixed;
  top:50%;
  left:0;
  right:0;
  margin:auto;
  width:900px;
  transform:translateY(-50%);
  z-index:0;
}

.watermark img{
  width:100%;
  height:auto;
  opacity:0.03;
}

.content{
  position:relative;
  z-index:1;
  padding:12px;
}

table{
  width:100%;
  border-collapse:collapse;
}

.content-table td,
.content-table th{
  border:1px solid #000;
  padding:4px;
  vertical-align:top;
}

.center{text-align:center;}
.bold{font-weight:bold;}

</style>
</head>

<body>

<div class="watermark">
  <img src="${safeImageSrc(watermarkImg)}" />
</div>

<div class="content">

<!-- HEADER -->

<table>
<tr>
<td width="75%" style="padding:10px;">
  <img src="https://www.tdscpc.gov.in/images/tds-logo.png" style="height:60px;">
</td>
<td width="25%" style="padding:10px; text-align:right;">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png"
       style="height:70px;"><br>
  <div style="font-size:10px;">
    Government of India<br>
    Income Tax Department
  </div>
</td>
</tr>
</table>

<!-- TITLE -->

<table class="content-table">
<tr><td class="center bold" style="font-size:16px;">FORM NO. 16</td></tr>
<tr><td class="center">[See rule 31(1)(a)]</td></tr>
<tr><td class="center bold" style="font-size:14px;">PART A</td></tr>
<tr>
<td class="center">
Certificate under Section 203 of the Income-tax Act, 1961 for tax deducted at source on salary paid
</td>
</tr>
</table>

<!-- CERTIFICATE -->

<table class="content-table">
<tr>
<td width="60%"><b>Certificate No:</b> ${escapeHtml(employerDetails.certificateNumber || "-")}</td>
<td width="40%" class="center">
<b>Last updated on</b> ${formatDate(new Date())}
</td>
</tr>
</table>

<!-- EMPLOYER / EMPLOYEE -->

<table class="content-table">
<tr class="bold center">
<td width="50%">Employer</td>
<td width="50%">Employee</td>
</tr>
<tr>
<td>
${escapeHtml(employerDetails.name || "")}<br>
${escapeHtml(employerDetails.address || "")}
</td>
<td>
${escapeHtml(employeeDetails.name || "")}<br>
${escapeHtml(employeeDetails.address || "")}
</td>
</tr>
</table>

<!-- PAN / TAN -->

<table class="content-table">
<tr class="bold center">
<td>PAN (Employer)</td>
<td>TAN</td>
<td>PAN (Employee)</td>
<td>Employee Ref No</td>
</tr>
<tr class="center">
<td>${escapeHtml(employerDetails.pan || "-")}</td>
<td>${escapeHtml(employerDetails.tan || "-")}</td>
<td>${escapeHtml(employeeDetails.pan || "-")}</td>
<td>${escapeHtml(employeeDetails.employeeRefNo || "-")}</td>
</tr>
</table>

<!-- SUMMARY -->

<table class="content-table">
<tr class="bold center">
<td colspan="5">
Summary of amount paid/credited and tax deducted at source
</td>
</tr>

<tr class="bold center">
<th>Quarter</th>
<th>Receipt No</th>
<th>Amount Paid</th>
<th>Tax Deducted</th>
<th>Tax Deposited</th>
</tr>

${quarterSummary.map(q => `
<tr class="center">
<td>${escapeHtml(q.quarter || "-")}</td>
<td>${escapeHtml(q.receiptNumber || "-")}</td>
<td>${formatAmount(q.amountPaidCredited)}</td>
<td>${formatAmount(q.taxDeducted)}</td>
<td>${formatAmount(q.taxDeposited)}</td>
</tr>
`).join("")}

<tr class="bold center">
<td colspan="2">Total</td>
<td>${formatAmount(totalPaid)}</td>
<td>${formatAmount(totalDeducted)}</td>
<td>${formatAmount(totalDeposited)}</td>
</tr>
</table>

<br>

<!-- BOOK ADJUSTMENT -->

<table class="content-table">
<tr class="bold center">
<td colspan="6">
I. Details of Tax Deposited through Book Adjustment
</td>
</tr>
<tr class="bold center">
<th>Sl</th>
<th>Tax</th>
<th>Receipt No 24G</th>
<th>DDO Serial</th>
<th>Date</th>
<th>Status</th>
</tr>

${bookAdjustments.map(b => `
<tr class="center">
<td>${escapeHtml(b.serialNo || "-")}</td>
<td>${formatAmount(b.taxDeposited)}</td>
<td>${escapeHtml(b.receiptNumber24G || "-")}</td>
<td>${escapeHtml(b.ddoSerialNo24G || "-")}</td>
<td>${formatDate(b.transferVoucherDate)}</td>
<td>${escapeHtml(b.form24GMatchingStatus || "-")}</td>
</tr>
`).join("")}

</table>

<br>

<!-- CHALLAN -->

<table class="content-table">
<tr class="bold center">
<td colspan="6">
II. Details of Tax Deposited through Challan
</td>
</tr>
<tr class="bold center">
<th>Sl</th>
<th>Tax</th>
<th>BSR</th>
<th>Date</th>
<th>Challan No</th>
<th>Status</th>
</tr>

${challans.map(c => `
<tr class="center">
<td>${escapeHtml(c.serialNo || "-")}</td>
<td>${formatAmount(c.taxDeposited)}</td>
<td>${escapeHtml(c.bsrCode || "-")}</td>
<td>${formatDate(c.taxDepositedDate)}</td>
<td>${escapeHtml(c.challanSerialNo || "-")}</td>
<td>${escapeHtml(c.oltasMatchingStatus || "-")}</td>
</tr>
`).join("")}

</table>

<br>

<!-- VERIFICATION -->

<table class="content-table">
<tr>
<td class="center bold" colspan="2" style="font-size:12px;">
Verification
</td>
</tr>

<tr>
<td colspan="2">
I, ${escapeHtml(employerDetails.authorisedPersonName || "XXXXXXXX")},
working in the capacity of AUTHORISED SIGNATORY
do hereby certify that a sum of Rs. ${formatAmount(totalDeposited)}
has been deducted and deposited to the credit of the Central Government. I further certify that the information given
above is true, complete and correct and is based on the books of account, documents, TDS statements, TDS deposited and other available records.
</td>
</tr>

<tr>
<td width="50%">
<b>Place:</b> ${escapeHtml(employerDetails.place || "-")}
</td>
<td width="50%">
<b>(Signature of person responsible for deduction of Tax)</b>
</td>
</tr>

<tr>
<td>
<b>Date:</b> ${formatDate(new Date())}
</td>
<td>
<b>Full Name:</b> ${escapeHtml(employerDetails.authorisedPersonName || "-")}
</td>
</tr>

<tr>
<td colspan="2">
<b>Designation:</b> AUTHORISED SIGNATORY
</td>
</tr>
</table>

<br>

<!-- NOTES -->

<div style="font-size:9px;">
<b>Notes:</b>
<ol>
<li>Part B (Annexure) of the certificate in Form No.16 shall be issued by the employer.</li>
<li>If an assessee is employed under one employer during the year, Part 'A' of the certificate in Form No.16 issued for the quarter ending on 31st March of the financial year shall contain the details
of tax deducted and deposited for all the quarters of the financial year.</li>
<li>If an assessee is employed under more than one employer during the year, each of the employers shall issue Part A of the certificate in Form No.16 pertaining to the period for which such
assessee was employed with each of the employers. Part B (Annexure) of the certificate in Form No. 16 may be issued by each of the employers or the last employer at the option of the assessee</li>
<li>To update PAN details in Income Tax Department database, apply for 'PAN change request' through NSDL or UTITSL</li>
</ol>
</div>

<br>

<!-- LEGEND -->

<table class="content-table">
<tr class="bold center">
<td colspan="3">Legend used in Form 16 - Status of matching with OLTAS</td>
</tr>

<tr class="bold center">
<td>U</td>
<td>Unmatched</td>
<td>Deductors have not deposited taxes or have furnished incorrect particulars of tax payment. Final credit will be reflected only when payment
details in bank match with details of deposit in TDS / TCS statement
</td>
</tr>

<tr class="bold center">
<td>P</td>
<td>Provisional</td>
<td>Provisional tax credit is effected only for TDS / TCS Statements filed by Government deductors."P" status will be changed to Final (F) on
verification of payment details submitted by Pay and Accounts Officer (PAO)</td>
</tr>

<tr class="bold center">
<td>F</td>
<td>Final</td>
<td>In case of non-government deductors, payment details of TDS / TCS deposited in bank by deductor have matched with the payment details
mentioned in the TDS / TCS statement filed by the deductors. In case of government deductors, details of TDS / TCS booked in Government
account have been verified by Pay & Accounts Officer (PAO)
</td>
</tr>

<tr class="bold center">
<td>O</td>
<td>Overbooked</td>
<td>Payment details of TDS / TCS deposited in bank by deductor have matched with details mentioned in the TDS / TCS statement but the
amount is over claimed in the statement. Final (F) credit will be reflected only when deductor reduces claimed amount in the statement or
makes new payment for excess amount claimed in the statement</td>
</tr>

</table>

</div>
</body>
</html>
`;
};

// part B
exports.form16BHtml = (data,watermarkImg) => {
  const {
    employeeDetails = {},
    employerDetails = {},
    assessmentYear = "-",
    salaryIncome = {},
    deductions16 = {},
    otherIncome = {},
    chapterVia = [],
    taxComputation = {},
    verification = {},
  } = data;

  // ── helpers ──────────────────────────────────────────────────────────────
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "-";

  const fmt = (amt) =>
    amt !== undefined && amt !== null && amt !== ""
      ? Number(amt).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  // ── salary income ─────────────────────────────────────────────────────────
  const grossSalary        = Number(salaryIncome.grossSalary      || 0);
  const perquisites        = Number(salaryIncome.perquisitesValue  || 0);
  const profitsInLieu      = Number(salaryIncome.profitsInLieu    || 0);
  const salaryTotal        = Number(salaryIncome.total            || 0);

  // ── section 16 deductions ─────────────────────────────────────────────────
  const stdDeduction       = Number(deductions16.standardDeduction     || 0);
  const entertainAllowance = Number(deductions16.entertainmentAllowance || 0);
  const professionalTax    = Number(deductions16.professionalTax       || 0);
  const totalSec16         = Number(deductions16.total                 || 0);

  // ── income chargeable under salaries ─────────────────────────────────────
  const incomeChargeableSalary = salaryTotal - totalSec16;

  // ── other income ──────────────────────────────────────────────────────────
  const totalOtherIncome   = Number(otherIncome.total || 0);

  // ── gross total income ───────────────────────────────────────────────────
  const grossTotalIncome   = incomeChargeableSalary + totalOtherIncome;

  // ── chapter VI-A: map array by section name ───────────────────────────────
  const viaMap = {};
  chapterVia.forEach((item) => {
    viaMap[item.section] = Number(item.amount || 0);
  });

  const via80C      = viaMap["80C"]       || 0;
  const via80CCC    = viaMap["80CCC"]     || 0;
  const via80CCD1   = viaMap["80CCD(1)"]  || 0;
  const via80CCD1B  = viaMap["80CCD(1B)"] || 0;
  const via80CCD2   = viaMap["80CCD(2)"]  || 0;
  const via80D      = viaMap["80D"]       || 0;
  const via80E      = viaMap["80E"]       || 0;
  const via80G      = viaMap["80G"]       || 0;
  const via80TTA    = viaMap["80TTA"]     || 0;

  const totalSec80C_CCC_CCD1 = via80C + via80CCC + via80CCD1;
  const totalVIA = chapterVia.reduce((s, i) => s + Number(i.amount || 0), 0);

  // ── tax computation ───────────────────────────────────────────────────────
  const totalTaxableIncome = grossTotalIncome - totalVIA;
  const incomeTax          = Number(taxComputation.incomeTax         || 0);
  const surcharge          = Number(taxComputation.surcharge         || 0);
  const cess               = Number(taxComputation.cess              || 0);
  const totalTaxLiability  = Number(taxComputation.totalTaxLiability || 0);

  // ── verification ─────────────────────────────────────────────────────────
  const declarantName = verification.declarantName       || "-";
  const fatherName    = verification.fatherOrSpouseName  || "-";
  const capacity      = verification.capacity            || "-";
  const verPlace      = verification.place               || "-";
  const verDate       = verification.date                || new Date();
  const fullName      = verification.fullName            || declarantName;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9px;
  margin: 0;
  padding: 0;
  background: #ffffff;
}

/* wkhtmltopdf watermark fix:
   flexbox and transform are unreliable.
   Use fixed positioning with explicit top/left values
   and negative margins to truly center the image. */
.watermark {
  position: fixed;
  top: 40%;
  left: 50%;
  z-index: 0;
  pointer-events: none;
}

.watermark img {
  position: relative;
  width: 800px;
  height: auto;
  opacity: 0.04;
  margin-top: -400px;
  margin-left: -400px;
  display: block;
}

.content {
  position: relative;
  z-index: 1;
  padding: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

.ct td,
.ct th {
  border: 1px solid #000;
  padding: 4px 6px;
  vertical-align: top;
}

.center { text-align: center; }
.right  { text-align: right;  }
.bold   { font-weight: bold;  }

</style>
</head>
<body>

<div class="watermark">
  <img src='${safeImageSrc(watermarkImg)}' />
</div>

<div class="content">

<!-- HEADER -->
<table>
<tr>
  <td width="75%" style="padding:10px;">
    <img src="https://www.tdscpc.gov.in/images/tds-logo.png" style="height:60px;">
  </td>
  <td width="25%" style="padding:10px; text-align:right;">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png"
         style="height:70px;"><br>
    <div style="font-size:10px;">
      Government of India<br>
      Income Tax Department
    </div>
  </td>
</tr>
</table>

<!-- TITLE -->
<table class="ct">
  <tr><td class="center bold" style="font-size:16px;">FORM NO. 16</td></tr>
  <tr><td class="center">[See rule 31(1)(a)]</td></tr>
  <tr><td class="center bold" style="font-size:14px;">PART B</td></tr>
  <tr>
    <td class="center">
      Certificate under Section 203 of the Income-tax Act, 1961 for tax deducted at source on salary
    </td>
  </tr>
</table>

<!-- CERT NO / LAST UPDATED -->
<table class="ct">
  <tr>
    <td width="50%"><b>Certificate No.</b>&nbsp;&nbsp;${escapeHtml(employerDetails.certificateNumber || "-")}</td>
    <td width="50%" class="right">
      <b>Last updated on</b>&nbsp;&nbsp;${formatDate(employerDetails.updatedDate)}
    </td>
  </tr>
</table>

<!-- EMPLOYER / EMPLOYEE -->
<table class="ct">
  <tr>
    <td width="50%" class="center bold">Name and address of the Employer</td>
    <td width="50%" class="center bold">Name and address of the Employee</td>
  </tr>
  <tr>
    <td>${escapeHtml(employerDetails.name || "")}<br>${escapeHtml(employerDetails.address || "")}</td>
    <td>${escapeHtml(employeeDetails.name || "")}<br>${escapeHtml(employeeDetails.address || "")}</td>
  </tr>
</table>

<!-- PAN / TAN -->
<table class="ct">
  <tr class="bold center">
    <td>PAN of the Deductor</td>
    <td>TAN of the Deductor</td>
    <td>PAN of the Employee</td>
  </tr>
  <tr class="center">
    <td>${escapeHtml(employerDetails.pan || "-")}</td>
    <td>${escapeHtml(employeeDetails.tan || "-")}</td>
    <td>${escapeHtml(employeeDetails.pan || "-")}</td>
  </tr>
</table>

<!-- CIT / AY / PERIOD -->
<table class="ct">
  <tr class="bold center">
    <td width="40%">CIT (TDS)</td>
    <td width="25%">Assessment Year</td>
    <td width="17%">Period with the Employer<br>From</td>
    <td width="18%">Period with the Employer<br>To</td>
  </tr>
  <tr>
    <td style="font-size:8px;">${escapeHtml(employerDetails.citAddress || "-")}</td>
    <td class="center">${escapeHtml(assessmentYear)}</td>
    <td class="center">${formatDate(employerDetails.periodStart)}</td>
    <td class="center">${formatDate(employerDetails.periodEnd)}</td>
  </tr>
</table>

<br>

<!-- SALARY DETAILS -->
<table class="ct">

  <tr>
    <td colspan="4" class="bold">Details of Salary Paid and any other income and tax deducted</td>
  </tr>

  <!-- proportional invisible row -->
  <tr style="height:0;">
    <td width="5%"  style="border:none; padding:0;"></td>
    <td width="60%" style="border:none; padding:0;"></td>
    <td width="15%" style="border:none; padding:0;"></td>
    <td width="20%" style="border:none; padding:0;"></td>
  </tr>

  <tr class="bold center">
    <td colspan="2">&nbsp;</td>
    <td>Rs.</td>
    <td>Rs.</td>
  </tr>

  <!-- 1. Gross Salary -->
  <tr>
    <td class="bold">1.</td>
    <td class="bold" colspan="3">Gross Salary</td>
  </tr>
  <tr>
    <td>(a)</td>
    <td>Salary as per provisions contained in section 17(1)</td>
    <td class="right">${fmt(grossSalary)}</td>
    <td></td>
  </tr>
  <tr>
    <td>(b)</td>
    <td>Value of perquisites under section 17(2) (as per Form No. 12BA, wherever applicable)</td>
    <td class="right">${fmt(perquisites)}</td>
    <td></td>
  </tr>
  <tr>
    <td>(c)</td>
    <td>Profits in lieu of salary under section 17(3) (as per Form No. 12BA, wherever applicable)</td>
    <td class="right">${fmt(profitsInLieu)}</td>
    <td></td>
  </tr>
  <tr>
    <td>(d)</td>
    <td class="bold">Total</td>
    <td></td>
    <td class="right bold">${fmt(salaryTotal)}</td>
  </tr>
  <tr>
    <td>(e)</td>
    <td>Reported total amount of salary received from other employer(s)</td>
    <td></td>
    <td class="right">0.00</td>
  </tr>

  <!-- 2. Section 10 -->
  <tr>
    <td class="bold">2.</td>
    <td class="bold" colspan="3">Less: Allowances to the extent exempt under section 10</td>
  </tr>
  <tr>
    <td>(a)</td>
    <td>Travel concession or assistance under section 10(5)</td>
    <td class="right">0.00</td><td></td>
  </tr>
  <tr>
    <td>(b)</td>
    <td>Death-cum-retirement gratuity under section 10(10)</td>
    <td class="right">0.00</td><td></td>
  </tr>
  <tr>
    <td>(c)</td>
    <td>Commuted value of pension under section 10(10A)</td>
    <td class="right">0.00</td><td></td>
  </tr>
  <tr>
    <td>(d)</td>
    <td>Cash equivalent of leave salary encashment under section 10(10AA)</td>
    <td class="right">0.00</td><td></td>
  </tr>
  <tr>
    <td>(e)</td>
    <td>House rent allowance under section 10(13A)</td>
    <td class="right">0.00</td><td></td>
  </tr>
  <tr>
    <td>(f)</td>
    <td>
      Amount of any other exemption under section 10<br>
      <span style="font-style:italic; font-size:8px;">
        [Note: Break-up to be prepared by employer and issued to the employee, where applicable,
        before furnishing of Part B to the employee]
      </span>
    </td>
    <td></td><td></td>
  </tr>
  <tr>
    <td>(g)</td>
    <td>Total amount of any other exemption under section 10</td>
    <td class="right">0.00</td><td></td>
  </tr>
  <tr>
    <td>(h)</td>
    <td>Total amount of exemption claimed under section 10 [2(a)+2(b)+2(c)+2(d)+2(e)+2(g)]</td>
    <td></td>
    <td class="right">0.00</td>
  </tr>

  <!-- 3. Net salary from current employer -->
  <tr>
    <td class="bold">3.</td>
    <td class="bold">Total amount of salary received from current employer [1(d)-2(h)]</td>
    <td></td>
    <td class="right bold">${fmt(salaryTotal)}</td>
  </tr>

  <!-- 4. Section 16 -->
  <tr>
    <td class="bold">4.</td>
    <td class="bold" colspan="3">Less: Deductions under section 16</td>
  </tr>
  <tr>
    <td>(a)</td>
    <td>Standard deduction under section 16(ia)</td>
    <td class="right">${fmt(stdDeduction)}</td><td></td>
  </tr>
  <tr>
    <td>(b)</td>
    <td>Entertainment allowance under section 16(ii)</td>
    <td class="right">${fmt(entertainAllowance)}</td><td></td>
  </tr>
  <tr>
    <td>(c)</td>
    <td>Tax on employment under section 16(iii)</td>
    <td class="right">${fmt(professionalTax)}</td><td></td>
  </tr>

  <!-- 5. Total Sec 16 -->
  <tr>
    <td class="bold">5.</td>
    <td class="bold">Total amount of deductions under section 16 [4(a)+4(b)+4(c)]</td>
    <td></td>
    <td class="right bold">${fmt(totalSec16)}</td>
  </tr>

  <!-- 6. Income chargeable salaries -->
  <tr>
    <td class="bold">6.</td>
    <td class="bold">Income chargeable under the head "Salaries" [(3+1(e)-5]</td>
    <td></td>
    <td class="right bold">${fmt(incomeChargeableSalary)}</td>
  </tr>

  <!-- 7. Other income -->
  <tr>
    <td class="bold">7.</td>
    <td class="bold" colspan="3">
      Add: Any other income reported by the employee under as per section 192 (2B)
    </td>
  </tr>
  <tr>
    <td>(a)</td>
    <td>Income (or admissible loss) from house property reported by employee offered for TDS</td>
    <td class="right">0.00</td><td></td>
  </tr>
  <tr>
    <td>(b)</td>
    <td>Income under the head Other Sources offered for TDS</td>
    <td class="right">${fmt(totalOtherIncome)}</td><td></td>
  </tr>

  <!-- 8. Total other income -->
  <tr>
    <td class="bold">8.</td>
    <td class="bold">Total amount of other income reported by the employee [7(a)+7(b)]</td>
    <td></td>
    <td class="right bold">${fmt(totalOtherIncome)}</td>
  </tr>

  <!-- 9. Gross total income -->
  <tr>
    <td class="bold">9.</td>
    <td class="bold">Gross total income (6+8)</td>
    <td></td>
    <td class="right bold">${fmt(grossTotalIncome)}</td>
  </tr>

  <!-- 10. Chapter VI-A -->
  <tr>
    <td class="bold">10.</td>
    <td class="bold">Deductions under Chapter VI-A</td>
    <td class="center bold">Gross Amount</td>
    <td class="center bold">Deductible Amount</td>
  </tr>
  <tr>
    <td>(a)</td>
    <td>Deduction in respect of life insurance premia, contributions to provident fund etc. under section 80C</td>
    <td class="right">${fmt(via80C)}</td>
    <td class="right">${fmt(via80C)}</td>
  </tr>
  <tr>
    <td>(b)</td>
    <td>Deduction in respect of contribution to certain pension funds under section 80CCC</td>
    <td class="right">${fmt(via80CCC)}</td>
    <td class="right">${fmt(via80CCC)}</td>
  </tr>
  <tr>
    <td>(c)</td>
    <td>Deduction in respect of contribution by taxpayer to pension scheme under section 80CCD (1)</td>
    <td class="right">${fmt(via80CCD1)}</td>
    <td class="right">${fmt(via80CCD1)}</td>
  </tr>
  <tr>
    <td>(d)</td>
    <td>Total deduction under section 80C, 80CCC and 80CCD(1)</td>
    <td class="right">${fmt(totalSec80C_CCC_CCD1)}</td>
    <td class="right">${fmt(totalSec80C_CCC_CCD1)}</td>
  </tr>
  <tr>
    <td>(e)</td>
    <td>Deductions in respect of amount paid/deposited to notified pension scheme under section 80CCD (1B)</td>
    <td class="right">${fmt(via80CCD1B)}</td>
    <td class="right">${fmt(via80CCD1B)}</td>
  </tr>
  <tr>
    <td>(f)</td>
    <td>Deduction in respect of contribution by Employer to pension scheme under section 80CCD (2)</td>
    <td class="right">${fmt(via80CCD2)}</td>
    <td class="right">${fmt(via80CCD2)}</td>
  </tr>
  <tr>
    <td>(g)</td>
    <td>Deduction in respect of health insurance premia under section 80D</td>
    <td class="right">${fmt(via80D)}</td>
    <td class="right">${fmt(via80D)}</td>
  </tr>
  <tr>
    <td>(h)</td>
    <td>Deduction in respect of interest on loan taken for higher education under section 80E</td>
    <td class="right">${fmt(via80E)}</td>
    <td class="right">${fmt(via80E)}</td>
  </tr>

  <!-- 80G / 80TTA: 3-column amounts -->
  <tr>
    <td colspan="2"></td>
    <td class="center bold">Gross Amount</td>
    <td class="center bold" style="font-size:8px;">Qualifying Amount &nbsp;&nbsp; Deductible Amount</td>
  </tr>
  <tr>
    <td>(i)</td>
    <td>Total Deduction in respect of donations to certain funds, charitable institutions, etc. under section 80G</td>
    <td class="right">${fmt(via80G)}</td>
    <td class="right">${fmt(via80G)} &nbsp;&nbsp;&nbsp; ${fmt(via80G)}</td>
  </tr>
  <tr>
    <td>(j)</td>
    <td>Deduction in respect of interest on deposits in savings account under section 80TTA</td>
    <td class="right">${fmt(via80TTA)}</td>
    <td class="right">${fmt(via80TTA)} &nbsp;&nbsp;&nbsp; ${fmt(via80TTA)}</td>
  </tr>
  <tr>
    <td>(k)</td>
    <td>
      Amount Deductible under any other provision (s) of Chapter VI-A<br>
      <span style="font-style:italic; font-size:8px;">
        [Note: Break-up to be prepared by employer and issued to the employee, where applicable,
        before furnishing of Part B to the employee]
      </span>
    </td>
    <td></td><td></td>
  </tr>
  <tr>
    <td>(l)</td>
    <td>Total of amount deductible under any other provision(s) of Chapter VI-A</td>
    <td class="right">0.00</td>
    <td class="right">0.00 &nbsp;&nbsp;&nbsp; 0.00</td>
  </tr>

  <!-- 11. Aggregate VI-A -->
  <tr>
    <td class="bold">11.</td>
    <td class="bold">
      Aggregate of deductible amount under Chapter VI-A
      [10(d)+10(e)+10(f)+10(g)+10(h)+10(i)+10(j)+10(l)]
    </td>
    <td></td>
    <td class="right bold">${fmt(totalVIA)}</td>
  </tr>

  <!-- 12. Total taxable income -->
  <tr>
    <td class="bold">12.</td>
    <td class="bold">Total taxable income (9-11)</td>
    <td></td>
    <td class="right bold">${fmt(totalTaxableIncome)}</td>
  </tr>

  <!-- 13. Tax on total income -->
  <tr>
    <td class="bold">13.</td>
    <td class="bold">Tax on total income</td>
    <td></td>
    <td class="right bold">${fmt(incomeTax)}</td>
  </tr>

  <!-- 14. Rebate 87A -->
  <tr>
    <td class="bold">14.</td>
    <td class="bold">Rebate under section 87A, if applicable</td>
    <td></td>
    <td class="right bold">0.00</td>
  </tr>

  <!-- 15. Surcharge -->
  <tr>
    <td class="bold">15.</td>
    <td class="bold">Surcharge, wherever applicable</td>
    <td></td>
    <td class="right bold">${fmt(surcharge)}</td>
  </tr>

  <!-- 16. Cess -->
  <tr>
    <td class="bold">16.</td>
    <td class="bold">Health and education cess</td>
    <td></td>
    <td class="right bold">${fmt(cess)}</td>
  </tr>

  <!-- 17. Tax payable -->
  <tr>
    <td class="bold">17.</td>
    <td class="bold">Tax payable (13+15+16-14)</td>
    <td></td>
    <td class="right bold">${fmt(totalTaxLiability)}</td>
  </tr>

  <!-- 18. Relief sec 89 -->
  <tr>
    <td class="bold">18.</td>
    <td class="bold">Less: Relief under section 89 (attach details)</td>
    <td></td>
    <td class="right bold">0.00</td>
  </tr>

  <!-- 19. Net tax payable -->
  <tr>
    <td class="bold">19.</td>
    <td class="bold">Net tax payable (17-18)</td>
    <td></td>
    <td class="right bold">${fmt(totalTaxLiability)}</td>
  </tr>

</table>

<br>

<!-- VERIFICATION -->
<table class="ct">
  <tr>
    <td class="center bold" colspan="2" style="font-size:12px;">Verification</td>
  </tr>
  <tr>
    <td colspan="2">
      I, <u><b>${escapeHtml(declarantName)}</b></u>, son/daughter of <u><b>${escapeHtml(fatherName)}</b></u>.
      Working in the capacity of <u><b>${escapeHtml(capacity)}</b></u> (Designation)
      do hereby certify that the information given above is true, complete and correct and is based
      on the books of account, documents, TDS statements, and other available records.
    </td>
  </tr>
  <tr>
    <td width="50%"><b>Place</b>&nbsp;&nbsp;&nbsp;&nbsp;${escapeHtml(verPlace)}</td>
    <td width="50%">(Signature of person responsible for deduction of tax)</td>
  </tr>
  <tr>
    <td><b>Date</b>&nbsp;&nbsp;&nbsp;&nbsp;${formatDate(verDate)}</td>
    <td><b>Full Name:</b>&nbsp;${escapeHtml(fullName)}</td>
  </tr>
</table>

</div>
</body>
</html>
`;
};
