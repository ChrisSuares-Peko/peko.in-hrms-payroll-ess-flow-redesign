const { escapeHtml } = require('../../escapeHtml');

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SUCCESS_STATUSES = ['SUCCESS', 'PAID', 'success', 'paid'];

exports.salaryHistoryReportHtml = ({ reportData, companyInfo, month, year }) => {
  const monthName = MONTH_NAMES[Number(month) - 1] || month;
  const { summary, rows } = reportData;

  const tableRows = rows.map(r => {
    const status = (r.paymentStatus || '').toLowerCase();
    return `
      <tr>
        <td>${escapeHtml(r.empId)}</td>
        <td><div class="name">${escapeHtml(r.name)}</div><div class="email">${escapeHtml(r.email)}</div></td>
        <td>${escapeHtml(r.accountDetail)}</td>
        <td><span class="badge">${escapeHtml(r.transType)}</span></td>
        <td>&#8377;${Number(r.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>&#8377;${Number(r.deduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>&#8377;${Number(r.netPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td><span class="status ${escapeHtml(status)}">${escapeHtml(r.paymentStatus)}</span></td>
      </tr>`;
  }).join('');

  const otpRows = rows.flatMap(r =>
    (r.oneTimePayments || [])
      .filter(p => SUCCESS_STATUSES.includes(p.paymentStatus))
      .map(p => `
        <tr>
          <td>${escapeHtml(r.empId)}</td>
          <td><div class="name">${escapeHtml(r.name)}</div><div class="email">${escapeHtml(r.email)}</div></td>
          <td>&#8377;${Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td>${escapeHtml(p.remark || '-')}</td>
          <td>${escapeHtml(p.referenceId || '-')}</td>
          <td><span class="status paid">${escapeHtml(p.paymentStatus)}</span></td>
        </tr>`)
  ).join('');

  const otpSection = otpRows ? `
  <hr/>
  <h2 style="font-size:15px;margin:20px 0 10px;">One-Time Payments (Successful)</h2>
  <table>
    <thead>
      <tr>
        <th>Emp ID</th>
        <th>Employee Name &amp; Email</th>
        <th>Amount</th>
        <th>Remark</th>
        <th>Reference ID</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${otpRows}</tbody>
  </table>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; padding: 24px; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .company-name { font-size: 18px; font-weight: bold; color: #111; }
    .company-address { font-size: 12px; color: #777; margin-top: 2px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .generated { font-size: 11px; color: #999; }
    .summary { margin-bottom: 24px; margin-top: 16px; }
    .summary-row { display: table; width: 100%; table-layout: fixed; border-spacing: 12px 0; margin-bottom: 12px; }
    .card { display: table-cell; width: 50%; background: #f8f8f8; border: 1px solid #e8e8e8; border-radius: 8px; padding: 14px 18px; box-sizing: border-box; }
    .card .amount { font-size: 18px; font-weight: bold; color: #111; }
    .card .label { font-size: 11px; color: #888; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f0f0f0; }
    th { padding: 9px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 9px 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafafa; }
    .name { font-weight: 600; font-size: 12px; }
    .email { font-size: 10px; color: #888; }
    .badge { background: #ede9fe; color: #5b21b6; border-radius: 12px; padding: 2px 8px; font-size: 11px; }
    .status { border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.approved { background: #dbeafe; color: #1e40af; }
    .status.pending { background: #fef9c3; color: #854d0e; }
    .status.failed, .status.faild { background: #fee2e2; color: #991b1b; }
    .status.upcoming { background: #e0f2fe; color: #0369a1; }
    .footer { margin-top: 20px; font-size: 10px; color: #bbb; text-align: right; }
    hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${escapeHtml(companyInfo.companyName || '')}</div>
      <div class="company-address">${escapeHtml(companyInfo.address || '')}</div>
    </div>
    <div style="text-align:right">
      <h1>${escapeHtml(monthName)} ${escapeHtml(year)} &mdash; Salary Report</h1>
      <div class="generated">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>
  <hr/>
  <div class="summary">
    <div class="summary-row">
      <div class="card">
        <div class="amount">&#8377;${Number(summary.totalProcessed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div class="label">Total Processed</div>
      </div>
      <div class="card">
        <div class="amount">${escapeHtml(summary.totalEmployees)}</div>
        <div class="label">Total Employees</div>
      </div>
    </div>
    <div class="summary-row">
      <div class="card">
        <div class="amount">${escapeHtml(summary.totalPaid)}</div>
        <div class="label">Successfully Paid</div>
      </div>
      <div class="card">
        <div class="amount">${escapeHtml(summary.totalEmployees - summary.totalPaid)}</div>
        <div class="label">Pending Confirmation</div>
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Emp ID</th>
        <th>Employee Name &amp; Email</th>
        <th>Account Detail</th>
        <th>Trans. Type</th>
        <th>Gross Salary</th>
        <th>Deduction</th>
        <th>Net Payable Salary</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  ${otpSection}
  <div class="footer">${escapeHtml(companyInfo.companyName || '')} &bull; ${escapeHtml(monthName)} ${escapeHtml(year)} Payroll Report</div>
</body>
</html>`;
};
