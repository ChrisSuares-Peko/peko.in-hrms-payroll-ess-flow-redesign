'use strict';

exports.purchaseOrderTemplate = ({ po, corporate }) => {
  const CURRENCY_SYMBOLS = { INR: '₹', AED: 'AED', USD: '$', EUR: '€', GBP: '£' };
  const currencySymbol = CURRENCY_SYMBOLS[po.currency] || po.currency;
  const fmt = (val) => parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Text fields are user- or vendor-entered (the vendor sets its own name via the public RFQ link).
  // Escape them so they can only render as text in the PDF, the same as they do in the app.
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const companyAddress = [corporate.city, corporate.state, corporate.country].filter(Boolean).join(', ');

  const lineItemsRows = (po.lineItems || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${esc(item.description)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${fmt(item.qty)} ${esc(item.unit || '')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${esc(currencySymbol)} ${fmt(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${esc(currencySymbol)} ${fmt(item.total)}</td>
    </tr>
  `).join('');

  const eSignBanner = po.eSignStatus === 'Completed' ? `
    <div style="margin-top:24px;padding:14px 18px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;display:flex;align-items:center;gap:10px;">
      <span style="color:#059669;font-size:18px;">&#10003;</span>
      <div>
        <div style="font-weight:600;color:#065f46;">Electronically Signed</div>
        <div style="font-size:12px;color:#047857;">All parties have signed this document</div>
      </div>
    </div>
  ` : '';

  const logoHtml = corporate.logo
    ? `<img src="${esc(corporate.logo)}" style="height:48px;object-fit:contain;" alt="Logo" />`
    : `<div style="font-size:22px;font-weight:700;color:#1f2937;">${esc(corporate.name || corporate.companyName || '')}</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 14px; color: #1f2937; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .po-meta { text-align: right; }
    .po-meta h2 { font-size: 20px; font-weight: 700; color: #111827; }
    .po-meta p { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #f9fafb; padding: 16px; border-radius: 8px; }
    .info-item label { font-size: 11px; color: #6b7280; display: block; margin-bottom: 3px; }
    .info-item span { font-size: 13px; font-weight: 500; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; }
    th:last-child, th:nth-child(3) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .total-row { background: #fff; }
    .total-row td { padding: 12px; text-align: right; font-weight: 700; font-size: 15px; color: #dc2626; border-top: 2px solid #e5e7eb; }
    .total-row td:first-child { text-align: left; color: #111827; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .address-box { background: #f9fafb; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #374151; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logoHtml}
      ${corporate.companyName ? `<div style="font-size:13px;font-weight:600;color:#111827;">${esc(corporate.companyName)}</div>` : ''}
      ${companyAddress ? `<div style="font-size:12px;color:#6b7280;">${esc(companyAddress)}</div>` : ''}
      ${corporate.trnNo ? `<div style="font-size:12px;color:#6b7280;">TRN: ${esc(corporate.trnNo)}</div>` : ''}
    </div>
    <div class="po-meta">
      <h2>Purchase Order</h2>
      <p>${esc(po.refNumber)}</p>
      ${po.deliveryDate ? `<p>Delivery Date: ${new Date(po.deliveryDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Vendor</div>
    <div class="address-box">
      <strong>${esc(po.vendor?.businessName || '')}</strong><br/>
      ${po.vendor?.contactPerson ? `${esc(po.vendor.contactPerson)}<br/>` : ''}
      ${po.vendor?.email ? `${esc(po.vendor.email)}<br/>` : ''}
      ${po.vendor?.phone ? `${esc(po.vendor.phone)}` : ''}
    </div>
  </div>

  <div class="info-grid section">
    <div class="info-item">
      <label>Total Amount</label>
      <span>${esc(currencySymbol)} ${fmt(po.totalAmount)}</span>
    </div>
    <div class="info-item">
      <label>Payment Terms</label>
      <span>${esc(po.paymentTerms || '-')}</span>
    </div>
    <div class="info-item">
      <label>Status</label>
      <span>${esc(po.status)}</span>
    </div>
  </div>

  ${po.deliveryAddress ? `
  <div class="section">
    <div class="section-title">Delivery Address</div>
    <div class="address-box">${esc(po.deliveryAddress)}</div>
  </div>` : ''}

  ${po.notesToVendor ? `
  <div class="section">
    <div class="section-title">Notes to Vendor</div>
    <div class="address-box">${esc(po.notesToVendor)}</div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Line Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsRows}
        <tr class="total-row">
          <td>Total</td>
          <td colspan="3" style="white-space:nowrap;">${esc(currencySymbol)} ${fmt(po.totalAmount)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${eSignBanner}
</body>
</html>`;
};
