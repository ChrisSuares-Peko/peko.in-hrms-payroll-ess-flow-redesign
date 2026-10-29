/* eslint-disable no-inner-declarations */
const { socialIconCells, v2Header, v2Footer, websiteLabel } = require('../../emailTemplate/sharedLayout');

function getMonthName(monthNumber) {
  const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
  ];

  return monthNames[monthNumber - 1]; // monthNumber is 1-based, so subtract 1
}

// hrManagerName comes from salaryData.officialDocuments (set on the row itself in
// findOneSalary) rather than a separate corporateData param - reliable regardless of
// which of the 3 call paths (route-triggered vs cron-triggered) built the salaryData.
exports.paySlipEmailTemplate = (salaryData) => {
  const monthName = getMonthName(salaryData?.month);
  const employeeName = salaryData?.employee?.personalInformation?.fullName || 'Employee';
  const logo = salaryData?.companyInfo?.logo;
  const website = salaryData?.companyInfo?.website;
  const companyName = salaryData?.companyInfo?.companyName;
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding: companyName || 'Peko' });
  const footer = v2Footer({ socials: socialIconCells(undefined, { size: 24, padding: '0 16px' }) });

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
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Payroll Slip for ${monthName}, ${salaryData?.year} - ${employeeName}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${employeeName},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Attached to this email is your payroll slip for the month of ${monthName}, ${salaryData?.year}. We appreciate your dedication and hard work.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you have any queries or notice any discrepancies, please reach out to the HR department.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br />${salaryData?.officialDocuments?.hrManagerName || 'HR Team'},<br />${companyName || ''}</div>
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
          <img src="${params?.companyInfo?.logo}" style="width: 150px; background-color: inherit;" />
        </div>

        <div class="details-right">
          <h1 class="payslipTitle ">PAYSLIP</h1>
          <h1 class="payslipText">Salary Month: ${getMonthYear(params, false)}</h1>


        </div>
      </div>

      <div class="sub-details pl-3 ">
        <h1 class="addressTitle ">${params?.companyInfo?.companyName}</h1>
        <h1 class="addressText ">${params?.companyInfo?.address}</h1>
        <h1 class="addressText ">${params?.companyInfo?.email}, ${params?.companyInfo?.website || ''}</h1>

      </div>

      <div class="person-details pt-4 pl-3">
        <h1 class="addressTitle">${params?.employee?.fullName}</h1>
        <h1 class="addressText ">Designation: ${params?.employee?.employeeInformation?.designation}</h1>
        <h1 class="addressText ">Employee ID: ${params?.employee?.employeeInformation?.employeeId}</h1>
      </div>

      <div class="salary-details d-flex justify-content-between pt-4">
        <div class="sub-salary-details col-6 pb-2 pt-3">
          <h1 class="subTitle">Earnings</h1>

          <!-- Add a table for earnings -->
          <table class="table table-bordered pt-3">

            <tbody>
              <tr>
                <td>Basic Salary</td> <td>INR ${salaryInformation?.basicPay}</td>
              </tr>
              <tr>
                <td>House Rent Allowance</td><td>INR ${salaryInformation?.homeAllowances}</td>
              </tr>
              <tr>
                <td>Transportation Allowance</td> <td>INR ${salaryInformation?.travelAllowances}</td>
              </tr>
              <tr>
              <td>Medical Allowance</td> <td>INR ${salaryInformation?.medicalAllowances}</td>
               </tr>
              <tr>
              <td>Other Allowance</td> <td>INR ${((salaryInformation?.otherAllowances) || 0) + ((salaryInformation?.other) || 0)}</td>
               </tr>
              <tr>
                <td>Expense Reimbursement</td> <td>INR ${params?.totalReimbursement}</td>
              </tr>
              <tr>
               <td>Incentives And Bonus</td> <td>INR 0</td>
              </tr>
              <tr>
                <td>Over Time</td> <td>INR 0</td>
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
                  <td>INR ${params?.leaveDeduction}</td>
                </tr>
                <tr>
                  <td style="background-color: #EDEDED;">Total Pay</td>
                  <td style="background-color: #EDEDED;">INR  ${params?.totalPayable}</td>
                </tr>
              </tbody>
            </table>




          </div>
          <h1 class="net p-1 ms-2">NET SALARY: INR totalPayable, (${convertToWords(params?.totalPayable || 0)} Dirham Only)</h1>
          <div class="sub-body d-flex justify-content-end mr-5 align-items-center">


            <div class="company-seal mr-2 ">
              <img
                src="${params?.officialDocuments?.companyOfficialStamp}"
                style="width: 150px; background-color: inherit;" />
            </div>
            <div class="company-sign ml-2">
              <h1 class="addressTitle pt-3">Verified By HR Manager</h1>
              <img
                src="${params?.officialDocuments?.hrManagerSignature}"
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
  const { salaryInformation } = params
  // console.log({ params, salaryInformation })
  const { totalBonus = 0, totalIncentive = 0, totalOvertime = 0 } = params
  let totalIncentivesAndBonus = totalBonus + totalIncentive + totalOvertime
  //calculate the salary payable after deducting the leave
  let { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = salaryInformation
  let monthlySalary = (basicPay || 0) + (travelAllowances || 0) + (homeAllowances || 0) + (medicalAllowances || 0) + (otherAllowances || 0) + (other || 0);
  let grossSalary = monthlySalary + totalIncentivesAndBonus
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
      line-height: 1.5rem;
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

    .net {
      color: #000;
      font-size: 1rem;
      font-style: normal;
      font-weight: 700;
      line-height: 1.69313rem;
      /* 169.315% */
      letter-spacing: 0.0055rem;
    }

    .redText {
      color: #FF3A3A;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.00263rem;
    }

    .tableText {
      font-size: .9rem;
      font-weight: 500;
      letter-spacing: 0.00213rem;
    }

    .tableValue {
      font-size: .9rem;
      font-weight: 600;
      letter-spacing: 0.00213rem;
    }
  </style>
</head>

<body>
  <div class="container py-2">
    <div class="main-body p-4" style="border: 1px solid;">
      <div class="heading d-flex justify-content-center align-self-center">
        <h1 class="mainTitle">PAYSLIP FOR THE MONTH OF ${getMonthYear(params, true)}</h1>
      </div>

      <div class="main-details d-flex justify-content-between align-items-center pt-3 mt-5 pb-4">
        <div class="details-left pl-3 ">
          <img height="150" width="150" style="object-fit: cover;"
            src="${params?.companyInfo?.logo}"
            style="width: 150px; background-color: inherit;" />
        </div>

        <div class="details-right">
          <h1 class="payslipTitle ">PAYSLIP</h1>
          <h1 class="payslipText">Salary Month: ${getMonthYear(params, false)}</h1>


        </div>
      </div>

      <div class="d-flex justify-content-between">
        <div class="sub-details pl-3 ">
          <h1 class="addressTitle ">${params?.companyInfo?.companyName}</h1>
          <h1 class="addressText ">${params?.companyInfo?.address}</h1>
          <h1 class="addressText ">${params?.companyInfo?.email}, ${params?.companyInfo?.website || ''}</h1>
        </div>
        <div class="sub-details pl-3 ">
          <div class="sub-details pl-3 ">
            <h1 class="addressTitle ">Remarks</h1>
          </div>
        </div>
      </div>

      <div class="person-details pt-4 pl-3 ">
        <h1 class="addressTitle">${params?.employee?.fullName}</h1>
        <h1 class="addressText ">Designation: ${params?.employee?.employeeInformation?.designation}</h1>
        <h1 class="addressText ">Employee ID: ${params?.employee?.employeeInformation?.employeeId}</h1>
      </div>

      <div class="row mt-5">
        <div class="col-6">
          <h5 class="subTitle">Employee Attendance</h5>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Working Days:</div>
            <div class="tableValue">${params?.salaryCycleDays}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Leave Allowed:</div>
            <div class="tableValue"></div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Leave Taken:</div>
            <div class="tableValue">${params?.leaveCount}</div>
          </div>
        </div>
        <div class="col-6">
          <h5 class="subTitle">Salary Transfered To</h5>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Bank Name:${params?.employee?.bankDetails?.bankName}</div>
            <div class="tableValue"></div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">IBAN Number:${params?.employee?.bankDetails?.ibanNumber}</div>
            <div class="tableValue"></div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">
            Account Type: ${params?.employee?.bankDetails?.accountType ? params.employee.bankDetails.accountType : "N/A"}
            </div>
            <div class="tableValue"></div>
          </div>
        </div>
      </div>

      <div class="row mt-5">
        <div class="col-6">
          <h5 class="subTitle">Earnings</h5>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Basic Salary:</div>
            <div class="tableValue">INR ${salaryInformation?.basicPay}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">House Rent Allowance:</div>
            <div class="tableValue">INR ${salaryInformation?.homeAllowances}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Transportation Allowance:</div>
            <div class="tableValue">INR ${salaryInformation?.travelAllowances}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Medical Allowance:</div>
            <div class="tableValue">INR ${salaryInformation?.medicalAllowances}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Other Allowance:</div>
            <div class="tableValue">INR ${((salaryInformation?.otherAllowances) || 0) + ((salaryInformation?.other) || 0)}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Incentives And Bonus:</div>
            <div class="tableValue">INR ${parseInt(totalIncentivesAndBonus)}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
          <div class="tableValue">Gross Salary:</div>
          <div class="tableValue">INR ${parseInt(grossSalary)}</div>
        </div>
        
        </div>
        <div class="col-6">
          <h5 class="subTitle">Deductions</h5>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Salary Advance:</div>
            <div class="tableValue">INR 0</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Leave without pay:</div>
            <div class="tableValue">INR ${parseInt(params?.leaveDeduction)}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Loan Deduction:</div>
            <div class="tableValue">INR 0</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Other Deduction:</div>
            <div class="tableValue">INR  ${parseInt(params?.totalOtherDeduction)}</div>
          </div>
          
          <div class="d-flex justify-content-between border p-2">
            <div class="tableText">Total Deduction:</div>
            <div class="tableValue">INR ${parseInt(params?.leaveDeduction) + parseInt(params?.totalOtherDeduction)}</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
            <div class="tableValue"></div>
            <div class="tableValue text-light">-</div>
          </div>
          <div class="d-flex justify-content-between border p-2">
          <div class="tableValue">Total Pay:</div>
          <div class="tableValue">INR ${parseInt(params?.totalPayable)}</div>
        </div>
        </div>
      </div>



      <div class="d-flex my-5 align-items-center" style="background-color: #FFF5F5;height: 3rem;      ">
        <h6 class="redText">NET SALARY: INR ${params?.totalPayable || 0} (${convertToWords(params?.totalPayable || 0)} Dirham Only)</h6>
      </div>

      <div class="d-flex align-items-center justify-content-between pe-5">
        <div>
          <h6>Acknowledged by employee</h6>
          <h6>Sign</h6>
          <h6>${params?.readablePayingDate || ''}</h6>
        </div>
        <div class="sub-body d-flex justify-content-end mr-5 align-items-center">

          <div class="company-seal mr-2 ">
            <img
              src="${params?.officialDocuments?.companyOfficialStamp}"
              style="width: 150px; background-color: inherit;" />
          </div>
          <div class="company-sign ml-2">
            <img class="m-3"
              src="${params?.officialDocuments?.hrManagerSignature}"
              style="width: 100px; background-color: inherit; " />
            <h6>Verified By</h6>
            <h1 class="addressTitle "> HR Manager:${params?.officialDocuments?.hrManagerName}</h1>

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
    return `${monthName} ${year}`;
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