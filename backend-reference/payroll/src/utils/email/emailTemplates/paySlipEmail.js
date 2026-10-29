/* eslint-disable no-inner-declarations */
const { escapeHtml, safeImageSrc } = require("../../escapeHtml");
const { socialIconCells, v2Header, v2Footer, websiteLabel, PEKO_SOCIAL_LINKS } = require('../sharedLayout');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.paySlipEmailTemplate = (salaryData) => {
  const monthName = MONTH_NAMES[(salaryData?.month || 1) - 1];
  const employeeName = escapeHtml(salaryData?.employee?.personalInformation?.fullName || 'Employee');
  const logo = safeImageSrc(salaryData?.companyInfo?.logo);
  const website = escapeHtml(salaryData?.companyInfo?.website);
  const companyName = escapeHtml(salaryData?.companyInfo?.companyName);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding: companyName || 'Peko' });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }) });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Payroll Slip</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Payroll Slip" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Payroll Slip for ${monthName}, ${escapeHtml(salaryData?.year)} - ${employeeName}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${escapeHtml(employeeName)},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Attached to this email is your payroll slip for the month of ${monthName}, ${escapeHtml(salaryData?.year)}. We appreciate your dedication and hard work.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Attached to this email is your payroll slip for the month of ${monthName}, ${escapeHtml(salaryData?.year)}. We appreciate your dedication and hard work.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you have any queries or notice any discrepancies, please reach out to the HR department.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br />${escapeHtml(salaryData?.officialDocuments?.hrManagerName || 'HR Team')},<br />${escapeHtml(companyName || '')}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

${footer}

      </div>
    </body>
  </html>`;
};

//Not used anywhere
exports.payslipHtml = (params) => {
  const { salaryInformation } = params
  return `
    <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>PaySlip</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
  <link
    href="https://fonts.googleapis.com/css?family=Inter:300,300i,400,400i,500,500i,600,600i,700,700i&amp;display=swap"
    rel="stylesheet">

  <style type="text/css">
    .page-body {
      background-color: #fff !important;
    }

    body,
    body *:not(i):not(.fa):not(.icon):not(a) {
      font-family: 'Inter', sans-serif !important;
    }

    .mainTitle {
      color: #000;
      font-size: 1.5rem;
      font-style: normal;
      font-weight: 700;
      line-height: 1.69313rem;
      /* 112.877% */
      letter-spacing: 0.0055rem;
    }

    .payslipTitle {
      color: #000;
      font-size: 1.5625rem;
      font-style: normal;
      font-weight: 700;
      line-height: 1.33975rem;
      letter-spacing: 0.00438rem;
    }

    .payslipText {
      color: #000;
      font-size: 1rem;
      font-style: normal;
      font-weight: 400;
      line-height: 1.33975rem;
      /* 133.976% */
      letter-spacing: 0.00438rem;
    }

    .addressTitle {
      color: #000;
      font-size: 0.9375rem;
      font-style: normal;
      font-weight: 600;
      line-height: 1.33975rem;
      /* 142.908% */
      letter-spacing: 0.00438rem;
      text-transform: uppercase;
    }

    .addressText {
      color: #000;
      font-size: 0.9375rem;
      font-style: normal;
      font-weight: 400;
      line-height: .6rem;
      letter-spacing: 0.0055rem;
    }

    .company-sign {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .subTitle {
      color: #000;
      font-size: 1.125rem;
      font-style: normal;
      font-weight: 700;
      line-height: 1.69313rem;
      /* 150.502% */
      letter-spacing: 0.0055rem;
    }

    td {
      color: #000;
      font-size: 0.9375rem;
      font-style: normal;
      font-weight: 600;
      line-height: 1.69313rem;
      /* 180.603% */
      letter-spacing: 0.0055rem;
    }
    .net{
      color: #000;
font-size: 1rem;
font-style: normal;
font-weight: 700;
line-height: 1.69313rem; /* 169.315% */
letter-spacing: 0.0055rem;
    }
  </style>
</head>

<body>
  <div class="container py-2">
    <div class="main-body p-4" style="border: 1px solid;">
      <div class="heading d-flex justify-content-center align-self-center">
        <h1 class="mainTitle">PAYSLIP FOR THE MONTH OF ${getMonthYear(params, true)}</h1>
      </div>

      <div class="main-details d-flex justify-content-between pt-3 pb-4">
        <div class="details-left pl-3 ">
          <img src="${safeImageSrc(params?.companyInfo?.logo)}" style="width: 150px; background-color: inherit;" />
        </div>

        <div class="details-right">
          <h1 class="payslipTitle ">PAYSLIP</h1>
          <h1 class="payslipText">Salary Month: ${getMonthYear(params, false)}</h1>


        </div>
      </div>

      <div class="sub-details pl-3 ">
        <h1 class="addressTitle ">${escapeHtml(params?.companyInfo?.companyName)}</h1>
        <h1 class="addressText ">${escapeHtml(params?.companyInfo?.address)}</h1>
        <h1 class="addressText ">${escapeHtml(params?.companyInfo?.email)}, ${escapeHtml(params?.companyInfo?.website || '')}</h1>

      </div>

      <div class="person-details pt-4 pl-3">
        <h1 class="addressTitle">${escapeHtml(params?.employee?.fullName)}</h1>
        <h1 class="addressText ">Designation: ${escapeHtml(params?.employee?.employeeInformation?.designation)}</h1>
        <h1 class="addressText ">Employee ID: ${escapeHtml(params?.employee?.employeeInformation?.employeeId)}</h1>
      </div>

      <div class="salary-details d-flex justify-content-between pt-4">
        <div class="sub-salary-details col-6 pb-2 pt-3">
          <h1 class="subTitle">Earnings</h1>

          <!-- Add a table for earnings -->
          <table class="table table-bordered pt-3">

            <tbody>
              <tr>
                <td>Basic Salary</td> <td>₹ ${escapeHtml(salaryInformation?.basicPay)}</td>
              </tr>
              <tr>
                <td>House Rent Allowance</td><td>₹ ${escapeHtml(salaryInformation?.homeAllowances)}</td>
              </tr>
              <tr>
                <td>Transportation Allowance</td> <td>₹ ${escapeHtml(salaryInformation?.travelAllowances)}</td>
              </tr>
              <tr>
              <td>Medical Allowance</td> <td>₹ ${escapeHtml(salaryInformation?.medicalAllowances)}</td>
               </tr>
              <tr>
              <td>Other Allowance</td> <td>₹ ${escapeHtml(((salaryInformation?.otherAllowances) || 0) + ((salaryInformation?.other) || 0))}</td>
               </tr>
              <tr>
                <td>Expense Reimbursement</td> <td>₹ ${escapeHtml(params?.totalReimbursement)}</td>
              </tr>
              <tr>
               <td>Incentives And Bonus</td> <td>₹ 0</td>
              </tr>
              <tr>
                <td>Over Time</td> <td>₹ 0</td>
              </tr>

            </tbody>
          </table>
        </div>


        <div class="deductions col-6 pb-2 pt-3" style="margin-left: 0px;">
          <div class="details-body text-start">
            <h1 class="subTitle">Deductions</h1>
            <table class="table table-bordered pt-3">

              <tbody>
                <tr>
                  <td>Deductions</td>
                  <td>₹ ${escapeHtml(params?.leaveDeduction)}</td>
                </tr>
                <tr>
                  <td style="background-color: #EDEDED;">Total Pay</td>
                  <td style="background-color: #EDEDED;">₹  ${escapeHtml(params?.totalPayable)}</td>
                </tr>
              </tbody>
            </table>




          </div>
          <h1 class="net p-1 ms-2">NET SALARY: ₹ totalPayable, (${escapeHtml(convertToWords(params?.totalPayable || 0))} Rupees Only)</h1>
          <div class="sub-body d-flex justify-content-end mr-5 align-items-center">


            <div class="company-seal mr-2 ">
              <img
                src="${safeImageSrc(params?.officialDocuments?.companyOfficialStamp)}"
                style="width: 150px; background-color: inherit;" />
            </div>
            <div class="company-sign ml-2">
              <h1 class="addressTitle pt-3">Verified By HR Manager</h1>
              <img
                src="${safeImageSrc(params?.officialDocuments?.hrManagerSignature)}"
                style="width: 100px; background-color: inherit; " />

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>

</body>

</html>
    `
}

exports.payslipHtmlAE = (params) => {
  const {
    employee,
    companyInfo,
    organizationSettings,
    salaryComponents = [],
    deductionComponents = [],
    grossSalary = 0,
    netSalary = 0,
    month,
    year,
    leaveDetails={},
    payDays = null,
  } = params;
  console.log("company infoo",organizationSettings)
  console.log("salary compsss",salaryComponents)
  const leaveCount = leaveDetails.leaveCount || 0
  // "29 (LOP 2)" — Loss of Pay is shown here as unpaid days, never under Deductions.
  // Records generated before pay days were stored have none, so the field is left out.
  const formatDays = (value) => (Number.isInteger(value) ? String(value) : Number(value).toFixed(1));
  const paidDaysText = payDays && payDays.paidDays != null
    ? `${formatDays(payDays.paidDays)}${payDays.lopDays > 0 ? ` (LOP ${formatDays(payDays.lopDays)})` : ''}`
    : null;
  /* =========================
     EARNINGS (salaryComponents)
  ========================== */
  const earningRows = salaryComponents
    .filter(c => c?.componentName)
    .map(c => `
      <div class="table-row">
        <span>${escapeHtml(c.componentName)}</span>
        <span>₹${Number(c.calculatedAmount || 0).toFixed(2)}</span>
      </div>
    `)
    .join("");

  /* =========================
     DEDUCTIONS (deductionName)
  ========================== */
  let deductions = [];

  if (Array.isArray(deductionComponents) && deductionComponents.length > 0) {
    deductions = deductionComponents
      .filter(d => d?.deductionName)
      .map(d => ({
        name: d.deductionName,
        // One-time recoveries carry HR's note, printed next to the deduction.
        note: d.note || '',
        amount: Number(d.calculatedAmount || 0)
      }));
  } else {
    // fallback if no deductions
    deductions = [{ name: "Provident Fund (PF)", amount: 0 }];
  }

  const deductionRows = deductions
    .map(d => `
      <div class="table-row">
        <span>${escapeHtml(d.name)}${d.note ? ` <span style="color:#64748b;font-size:11px;">(${escapeHtml(d.note)})</span>` : ''}</span>
        <span>₹${d.amount.toFixed(2)}</span>
      </div>
    `)
    .join("");

  const totalDeductions = deductions.reduce(
    (sum, d) => sum + d.amount,
    0
  );

  /* =========================
     NET SALARY IN WORDS
  ========================== */
  const [rupees, paise] = Number(netSalary).toFixed(2).split(".");
  const netSalaryWords =
    `Rupees ${convertToWords(Number(rupees))}` +
    (Number(paise) ? ` and ${convertToWords(Number(paise))} Rupees` : "") +
    " only";

  /* =========================
     FULL HTML (UNCHANGED UI)
  ========================== */
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Payslip - ${getMonthYear({ month, year }, true)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

<style>
body {
  font-family: "Inter", sans-serif;
  margin: 0;
  background: #f3f3f3;
  padding: 40px;
}
.payslip-container {
  background: #ffffff;
  max-width: 800px;
  margin: auto;
  padding: 40px;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
}
.header {
  display: table;
  width: 100%;
}
.header > div {
  display: table-cell;
  vertical-align: top;
}
.company-info {
  text-align: right;
  font-size: 14px;
}
.center-title {
  text-align: center;
  font-weight: 600;
  font-size: 19px;
  margin: 40px 0 20px;
}
.employee-name {
  font-weight: 600;
  font-size: 17px;
}
.employee-id {
  font-size: 12px;
  color: #5b5b5b;
}

.details-box {
  background: #f7f7f7;
  border-radius: 12px;
  padding: 20px;
  margin: 18px 0 12px;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-left,
.details-right {
  vertical-align: top;
  padding-bottom: 0;
}

.details-left {
  padding-right: 24px;
}

.details-right {
  padding-left: 24px;
}

  .employee-section,
  .info-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .employee-section > div,
  .info-column > div {
    margin-bottom: 2px;
  }

.field-label {
  font-size: 9px;
  font-weight: 200;
  color: #6c757d;
  letter-spacing: 0.05em;
}

.field-value {
  font-size: 12px;
  font-weight: 300;
  color: #2b2b2b;
}

.info-item .field-value {
  font-size: 14px;
}

  .info-column .field-value {
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.01em;
  }
  .info-column .net-pay-tag {
    display: inline-block;
    background: #fff1ef;
    color: #FF3A3A;
    border-radius: 12px;
    padding: 4px 10px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .table-header-row {
    display: table;
    width: 100%;
    background: #FAFBFB;
    font-weight: 700;
    margin-top: 30px;
    padding: 10px 0;
  }
  .table-header-row > div {
    display: table-cell;
    width: 50%;
  }
  .table-section {
    display: table;
    width: 100%;
  }
  .table {
    display: table-cell;
    width: 50%;
    vertical-align: top;
  }
  .table-row {
    display: table;
    width: 100%;
    padding: 4px 0;
  }
  .table-row span {
    display: table-cell;
    width: 50%;
    color: #5B5B5B;
    white-space: nowrap;
  }
  .earnings-box .table-row span,
  .deductions-box .table-row span {
    font-size: 13px;
    font-weight: 500;
  }
  .earnings-box .total-row span,
  .deductions-box .total-row span {
    font-weight: 700;
  }
  .earnings-deductions-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 16px 0;
    margin-top: 30px;
    table-layout: fixed;
  }
  .earnings-deductions-table td {
    vertical-align: top;
    width: 50%;
    padding: 0;
  }
  .earnings-box,
  .deductions-box {
    width: 100%;
    box-sizing: border-box;
    border-radius: 10px;
    padding: 16px;
  }
  .earnings-box .table-row,
  .deductions-box .table-row {
    border-bottom: 1px dashed rgba(0, 0, 0, 0.25);
    padding-bottom: 4px;
    margin-bottom: 4px;
  }
  .earnings-box .table-row:last-child,
  .deductions-box .table-row:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  .earnings-box {
    background: #F1FFF6;
  }
  .deductions-box {
    background: #FFF7F6;
  }
  .box-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 10px;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.25);
    padding-bottom: 4px;
  }
.summary-inline {
  display: table;
  width: 100%;
  font-weight: 700;
  margin-top: 20px;
}
.summary-inline > div {
  display: table-cell;
  width: 50%;
}
  .highlight {
    background: #FFF7F6;
    padding: 16px;
    margin-top: 30px;
    text-align: center;
    display: flex;
    border-radius: 12px;
    flex-direction: column;
    gap: 4px;
  }
  .highlight-title {
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.05em;
    
  }
  .highlight-amount {
    font-size: 22px;
    font-weight: 700;
  }
  .highlight-words {
    font-size: 12px;
    color: #4a4a4a;
    font-weight: 500;
  }
.signature-section {
  display: table;
  width: 100%;
  margin-top: 50px;
}
.signature-section > div {
  display: table-cell;
}
.footer-note {
  font-size: 10px;
  text-align: center;
  color: #777;
  margin-top: 30px;
}
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
</style>
</head>

<body>
<div class="payslip-container">

<div class="header">

  <div class="company-info">
    <strong>${escapeHtml(organizationSettings?.companyProfile?.companyName)}</strong><br />
    ${escapeHtml(organizationSettings?.companyProfile?.city)},${escapeHtml(organizationSettings?.companyProfile?.state)}
  </div>
</div>

<hr style="border:none;border-top:1px solid #eaeaea;margin:30px 0 20px" />

<div class="center-title">
  Payslip for the month of ${getMonthYear({ month, year }, true)}
</div>

<hr style="border:0; border-top:3px solid #FF3A3A; width:60%; margin:6px auto;" />

<div class="details-box">
  <table class="details-table">
    <tr>
      <td class="details-left">
        <div class="employee-section">
          <div>
            <div class="field-label">Employee Name</div>
            <div class="field-value" style="font-weight: 700; font-size: 15px;">${escapeHtml(employee?.personalInformation?.fullName)}</div>
          </div>

          <div style="height: 6px;"></div>

          <div>
            <div class="field-label">Employee ID</div>
            <div class="field-value">${escapeHtml(employee?.employeeInformation?.employeeId)}</div>
          </div>

          <div style="height: 6px;"></div>

          <div>
            <div class="field-label">Designation</div>
            <div class="field-value">${escapeHtml(employee?.employeeInformation?.designation)}</div>
          </div>

          <div style="height: 6px;"></div>

          <div>
            <div class="field-label">Date of Joining</div>
            <div class="field-value">
              ${new Date(employee?.employeeInformation?.dateOfJoin).toLocaleDateString()}
            </div>
          </div>
        </div>
      </td>
      <td class="details-right">
        <div class="info-column">
          <div class="info-item">
            <div class="field-label">Bank Account</div>
            <div class="field-value">${escapeHtml(employee?.bankDetails?.accountNumber || "N/A")}</div>
          </div>

          <div style="height: 6px;"></div>

          <div class="info-item">
            <div class="field-label">Leaves Taken</div>
            <div class="field-value">${escapeHtml(leaveCount)}</div>
          </div>
${paidDaysText ? `
          <div style="height: 6px;"></div>

          <div class="info-item">
            <div class="field-label">Paid Days</div>
            <div class="field-value">${paidDaysText}</div>
          </div>
` : ''}
          <div style="height: 6px;"></div>

          <div class="info-item">
            <div class="field-label">Employee Net Pay</div>
            <div class="field-value">
              <span class="net-pay-tag">₹ ${Number(netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</div>
<table class="earnings-deductions-table">
  <tr>
    <td>
      <div class="earnings-box">
        <div class="box-title">Earnings</div>
        ${earningRows}
        <div class="table-row total-row">
          <span>Gross Earnings</span>
          <span>₹ ${grossSalary.toFixed(2)}</span>
        </div>
      </div>
    </td>
      <td>
        <div class="deductions-box">
          <div class="box-title">Deductions</div>
          ${deductionRows}
          <div class="table-row total-row">
            <span>Total Deductions</span>
            <span>₹ ${totalDeductions.toFixed(2)}</span>
          </div>
        </div>
      </td>
  </tr>
</table>


  <div class="highlight">
    <div class="highlight-title" style="margin: 6px 0;">Total Net Payable</div>
    <div class="highlight-amount" style="margin: 6px 0;">₹ ${Number(netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    <div class="highlight-words" style="margin: 6px 0;">(${netSalaryWords})</div>
    <div style="font-size:12px;margin: 6px 0;">
      Total Net Payable = (Gross Earnings - Total Deductions)
    </div>
  </div>
<hr style="border:none;border-top:1px solid #eaeaea;margin:30px 0 20px" />
<div class="signature-section">
  <div>Acknowledged by ${escapeHtml(employee?.personalInformation?.fullName)}<br />Sign</div>
  <div style="text-align:right">
    ${safeImageSrc(companyInfo?.officialDocuments?.companyOfficialStamp)
      ? `<img src="${safeImageSrc(companyInfo.officialDocuments.companyOfficialStamp)}" height="70" />`
      : ""}
    <div style="font-size:12px">
      Verified by<br /><strong>HR Manager</strong>
    </div>
  </div>
</div>


<div class="footer-note">
  This is an electronically generated Payslip, hence does not require a signature
</div>

</div>
</body>
</html>`;
};

function getMonthYear(params, upperCase) {
  try {
    const { year, month } = params
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let monthName = months[month - 1]; // Adjust month index
    if (upperCase) {
      monthName = monthName.toUpperCase()
    }
    return `${escapeHtml(monthName)} ${escapeHtml(year)}`;
  } catch (error) {
    return ``
  }
}

function convertToWords(number) {
  try {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertLessThanOneThousand(n) {
      if (n === 0) return '';
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 11];
      const digit = n % 10;
      if (n < 100) return tens[Math.floor(n / 10)] + (digit ? `-${units[digit]}` : '');
      return `${units[Math.floor(n / 100)]} Hundred${digit ? ` and ${convertLessThanOneThousand(n % 100)}` : ''}`;
    }

    if (number === 0) return 'Zero';
    const segments = ['Billion', 'Million', 'Thousand', ''];
    return segments
      .map((segment, index) => {
        const segmentValue = Math.floor(number / Math.pow(1000, 3 - index)) % 1000;
        if (segmentValue === 10 && index === 3) {
          return 'Ten';
        } else if (segmentValue === 10 && index === 2) {
          return 'Ten Thousand';
        } else if (segmentValue === 10 && index === 1) {
          return 'Ten Million';
        } else if (segmentValue === 10 && index === 0) {
          return 'Ten Billion';
        } else {
          return segmentValue ? `${convertLessThanOneThousand(segmentValue)} ${segment}` : '';
        }
      })
      .filter(Boolean)
      .join(' ');
  } catch (error) {
    return number
  }
}
