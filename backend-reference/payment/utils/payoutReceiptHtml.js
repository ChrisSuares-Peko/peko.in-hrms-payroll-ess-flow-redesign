"use strict";

const { escapeHtml } = require("./htmlEscape");

const buildPayoutReceiptHtml = ({ receiptNo, date, transactionId, referenceId, transferType, beneficiaryName, bankName, accountNumber, ifscCode, amount, status, companyName }) => {
  const formattedAmount = parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayStatus = status === "COMPLETED" ? "SUCCESS" : status === "FAILED" ? "FAILED" : "PENDING";
  const displayReference = referenceId ? escapeHtml(referenceId.toLowerCase().replace(/_/g, "-")) : "—";
  const displayTransferType = transferType ? escapeHtml(`${transferType} (IMPS/NEFT/RTGS/UPI)`) : "—";
  // F-PAY-19: escape user fields before interpolation.
  receiptNo = escapeHtml(receiptNo);
  date = escapeHtml(date);
  transactionId = escapeHtml(transactionId);
  beneficiaryName = escapeHtml(beneficiaryName);
  bankName = escapeHtml(bankName);
  accountNumber = escapeHtml(accountNumber);
  ifscCode = escapeHtml(ifscCode);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #fff;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #111;
      padding: 40px 48px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .logo { font-size: 26px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
    .logo sup { font-size: 8px; font-weight: 400; vertical-align: super; color: #555; }
    .receipt-meta { text-align: right; font-size: 12px; }
    .receipt-meta .receipt-no { font-weight: 700; font-size: 13px; margin-bottom: 4px; }

    .outer-box {
      border-radius: 4px;
      overflow: hidden;
    }

    .section { padding: 16px 20px; border-bottom: 1px solid #e0e0e0; }
    .section:last-child { border-bottom: none; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #111;
      margin-bottom: 14px;
    }

    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 24px;
    }
    .field { display: flex; flex-direction: column; gap: 3px; }
    .field-label { font-size: 11px; color: #777; }
    .field-value { font-size: 13px; font-weight: 600; color: #111; }

    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 13px;
      color: #333;
      margin-bottom: 10px;
    }
    .amount-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F3F8FF;
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 15px;
      font-weight: 700;
      color: #111;
    }

    .declaration { padding: 14px 20px; }
    .declaration-title { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
    .declaration p { font-size: 11px; color: #888; line-height: 1.6; }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 2px dashed #bbb;
    }
    .footer .company { font-size: 12px; }
    .footer .company strong { display: block; font-size: 13px; font-weight: 700; margin-bottom: 2px; }
    .sign-area { text-align: center; }
    .stamp {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px solid #4a90d9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #4a90d9;
      font-weight: 700;
      text-align: center;
      margin-bottom: 4px;
    }
    .sign-line { border-top: 1px solid #555; margin-bottom: 3px; width: 80px; }
    .sign-text { font-size: 10px; color: #333; }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">Peko<sup>®</sup></div>
    <div class="receipt-meta">
      <div class="receipt-no">Receipt No: ${receiptNo}</div>
      <div>Date: ${date}</div>
    </div>
  </div>

  <div class="outer-box">

    <div class="section">
      <div class="section-title">PAYOUT DETAILS</div>
      <div class="field-grid">
        <div class="field">
          <span class="field-label">Reference ID</span>
          <span class="field-value">${transactionId || "—"}</span>
        </div>
        <div class="field">
          <span class="field-label">Transaction ID</span>
          <span class="field-value">${displayReference}</span>
        </div>
        <div class="field">
          <span class="field-label">Payout Status</span>
          <span class="field-value">${displayStatus}</span>
        </div>
        <div class="field">
          <span class="field-label">Transfer Mode</span>
          <span class="field-value">${displayTransferType}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">BENEFICIARY DETAILS</div>
      <div class="field-grid">
        <div class="field">
          <span class="field-label">Beneficiary Name</span>
          <span class="field-value">${beneficiaryName || "—"}</span>
        </div>
        <div class="field">
          <span class="field-label">Bank Name</span>
          <span class="field-value">${bankName || "—"}</span>
        </div>
        <div class="field">
          <span class="field-label">Account Number</span>
          <span class="field-value">${accountNumber || "—"}</span>
        </div>
        <div class="field">
          <span class="field-label">IFSC Code</span>
          <span class="field-value">${ifscCode || "—"}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">AMOUNT DETAILS</div>
      <div class="amount-row">
        <span>Payout Amount</span>
        <span>₹${formattedAmount}</span>
      </div>
      <div class="amount-total-row">
        <span>Payout Amount</span>
        <span>₹${formattedAmount}</span>
      </div>
    </div>

    <div class="declaration">
      <div class="declaration-title">DECLARATION</div>
      <p>This is a system-generated payout receipt for transactions processed via Decentro. No physical signature is required.</p>
    </div>

  </div>

  <div class="footer">
    <div class="company">
      <strong>FOR ${escapeHtml((companyName || "PEKO PAYMENTS").toUpperCase())}</strong>
      <span>Authorized Signatory</span>
    </div>
    <div class="sign-area">
      <div class="stamp">PEKO<br/>VERIFIED</div>
      <div class="sign-line"></div>
      <div class="sign-text">Verified by<br/>HR Manager</div>
    </div>
  </div>

</body>
</html>`;
};

module.exports = { buildPayoutReceiptHtml };
