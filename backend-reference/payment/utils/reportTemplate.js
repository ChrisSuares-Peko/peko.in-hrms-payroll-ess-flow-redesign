const { escapeHtml } = require("./htmlEscape");

/**
 * Generates an HTML string for a Peko payout receipt PDF.
 *
 * @param {Object} params
 * @param {string} params.receiptNo          - e.g. "RCP/2026/04/001247"
 * @param {string} params.date               - e.g. "April 16, 2026"
 * @param {string} params.referenceId        - e.g. "REF-DEC-2026-456789"
 * @param {string} params.transactionId      - e.g. "TXN-987654321ABCD"
 * @param {string} params.payoutStatus       - e.g. "SUCCESS"
 * @param {string} params.transferMode       - e.g. "IMPS (IMPS/NEFT/RTGS/UPI)"
 * @param {string} params.beneficiaryName    - e.g. "RAJESH KUMAR SHARMA"
 * @param {string} params.bankName           - e.g. "HDFC BANK LIMITED"
 * @param {string} params.accountNumber      - e.g. "50100123456789"
 * @param {string} params.ifscCode           - e.g. "HDFC0001234"
 * @param {number|string} params.payoutAmount - e.g. 45250.00
 * @param {string} params.companyName        - e.g. "TECHPAY SOLUTIONS PVT. LTD."
 * @returns {string} HTML string ready to be fed to Puppeteer page.setContent()
 */
exports.payoutReceiptTemplate = (params) => {
  let {
    receiptNo,
    date,
    referenceId,
    transactionId,
    payoutStatus,
    transferMode,
    beneficiaryName,
    bankName,
    accountNumber,
    ifscCode,
    payoutAmount,
    companyName,
  } = params || {};
  const formattedAmount = Number(payoutAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // F-PAY-19: escape user fields before interpolation.
  receiptNo = escapeHtml(receiptNo);
  date = escapeHtml(date);
  referenceId = escapeHtml(referenceId);
  transactionId = escapeHtml(transactionId);
  payoutStatus = escapeHtml(payoutStatus);
  transferMode = escapeHtml(transferMode);
  beneficiaryName = escapeHtml(beneficiaryName);
  bankName = escapeHtml(bankName);
  accountNumber = escapeHtml(accountNumber);
  ifscCode = escapeHtml(ifscCode);
  companyName = escapeHtml(companyName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payout Receipt</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #fff;
      padding: 40px 48px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .receipt-meta {
      text-align: right;
      line-height: 1.7;
    }
    .receipt-meta .label { color: #6b7280; font-size: 12px; }
    .receipt-meta .value { font-weight: 600; }

    /* ── Section ── */
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      margin-bottom: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 32px;
    }
    .field-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }
    .field-value {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }
    .field-value.status-success { color: #16a34a; }

    /* ── Amount table ── */
    .amount-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    .amount-table td {
      padding: 10px 14px;
      font-size: 13px;
      border: 1px solid #e5e7eb;
      color: #374151;
    }
    .amount-table tr:last-child td {
      background: #f9fafb;
      font-weight: 700;
      font-size: 15px;
      color: #111827;
    }
    .amount-table td:last-child { text-align: right; }

    /* ── Declaration ── */
    .declaration {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 14px 18px;
      font-size: 11.5px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 36px;
    }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-company {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
    }
    .footer-role {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    .footer-sig {
      text-align: right;
    }
    .sig-box {
      display: inline-block;
      width: 110px;
      height: 48px;
      border: 1px dashed #d1d5db;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .footer-sig .sig-label {
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="logo">Peko</div>
    <div class="receipt-meta">
      <div><span class="label">Receipt No: </span><span class="value">${receiptNo || '—'}</span></div>
      <div><span class="label">Date: </span><span class="value">${date || '—'}</span></div>
    </div>
  </div>

  <!-- Payout Details -->
  <div class="section">
    <div class="section-title">Payout Details</div>
    <div class="grid">
      <div>
        <div class="field-label">Reference ID</div>
        <div class="field-value">${referenceId || '—'}</div>
      </div>
      <div>
        <div class="field-label">Transaction ID</div>
        <div class="field-value">${transactionId || '—'}</div>
      </div>
      <div>
        <div class="field-label">Payout Status</div>
        <div class="field-value status-success">${payoutStatus || '—'}</div>
      </div>
      <div>
        <div class="field-label">Transfer Mode</div>
        <div class="field-value">${transferMode || '—'}</div>
      </div>
    </div>
  </div>

  <!-- Beneficiary Details -->
  <div class="section">
    <div class="section-title">Beneficiary Details</div>
    <div class="grid">
      <div>
        <div class="field-label">Beneficiary Name</div>
        <div class="field-value">${beneficiaryName || '—'}</div>
      </div>
      <div>
        <div class="field-label">Bank Name</div>
        <div class="field-value">${bankName || '—'}</div>
      </div>
      <div>
        <div class="field-label">Account Number</div>
        <div class="field-value">${accountNumber || '—'}</div>
      </div>
      <div>
        <div class="field-label">IFSC Code</div>
        <div class="field-value">${ifscCode || '—'}</div>
      </div>
    </div>
  </div>

  <!-- Amount Details -->
  <div class="section">
    <div class="section-title">Amount Details</div>
    <table class="amount-table">
      <tbody>
        <tr>
          <td>Payout Amount</td>
          <td>₹${formattedAmount}</td>
        </tr>
        <tr>
          <td>Payout Amount</td>
          <td>₹${formattedAmount}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Declaration -->
  <div class="declaration">
    <strong>Declaration</strong><br />
    This is a system-generated payout receipt for transactions processed via Decentro.
    No physical signature is required.
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <div class="footer-company">FOR ${companyName || 'TECHPAY SOLUTIONS PVT. LTD.'}</div>
      <div class="footer-role">Authorized Signatory</div>
    </div>
    <div class="footer-sig">
      <div class="sig-box"></div>
      <div class="sig-label">HR Manager</div>
    </div>
  </div>

</body>
</html>`;
};

exports.reportPdfTemplate=(data,templateDetails)=>{
    if (data.length === 0) {
        return '<p>No data available.</p>';
    }

    // Get the keys from the first transaction object to use as headers
    const headers = Object.keys(data[0]);

    // Generate header HTML
    const headerHtml = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('');

    // Generate rows HTML
    const rowsHtml = data.map(transaction => {
        const rowHtml = headers.map(header => `<td>${escapeHtml(transaction[header])}</td>`).join('');
        return `<tr>${rowHtml}</tr>`;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${templateDetails?.title??'Report'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                h1 {
                    text-align: center;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table, th, td {
                    border: 1px solid black;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h1>${templateDetails?.title??'Report'}</h1>
            <table>
                <thead>
                    <tr>
                        ${headerHtml}
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `;
}
