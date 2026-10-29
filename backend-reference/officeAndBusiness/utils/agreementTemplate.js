exports.agreementTemplate = (data, biller) => {
  const {
    agreementNumber, prefix, title, contractType,
    currency, paymentTerms, billingFrequency, contractValue,
    startDate, endDate, description, specialTerms,
    invoiceCustomerV2: customer,
  } = data;

  const displayAgreementNumber = prefix ? `${prefix}${agreementNumber}` : agreementNumber;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ') : '';

  const fmt = (val) =>
    parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';

  const billerAddress = [biller?.address, biller?.city, biller?.state, biller?.pincode].filter(Boolean).join(', ');
  const clientAddress = [
    customer?.primaryAddress,
    customer?.primaryCity,
    customer?.primaryState,
    customer?.primaryPincode,
    customer?.primaryCountry,
  ].filter(Boolean).join(', ');

  // Render description: lines starting with "- " or "• " become list items
  const renderDescription = (text) => {
    if (!text) return '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const isBullet = (l) => l.startsWith('- ') || l.startsWith('• ');
    let html = '';
    let inList = false;
    for (const line of lines) {
      if (isBullet(line)) {
        if (!inList) { html += '<ul style="margin: 6px 0 6px 20px; padding: 0;">'; inList = true; }
        html += `<li style="margin-bottom: 4px;">${line.replace(/^[-•]\s*/, '')}</li>`;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p style="margin: 0 0 6px 0;">${line}</p>`;
      }
    }
    if (inList) html += '</ul>';
    return html;
  };

  const headingLabel = title || (contractType ? `${contractType} AGREEMENT` : 'SERVICE AGREEMENT');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headingLabel}</title>
  <style>
    @page { margin: 1.5rem 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      color: #333;
      font-size: 12px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
    }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
<div style="padding: 36px 48px;">

  <!-- TITLE -->
  <div style="text-align: center; margin-bottom: 8px;">
    <div style="font-size: 20px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">${headingLabel}</div>
    <div style="margin-top: 6px; color: #444;">Agreement No: ${displayAgreementNumber}</div>
    <div style="color: #444;">Date: ${formatDate(startDate)}</div>
  </div>

  <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />

  <!-- PARTIES -->
  <div style="font-weight: 700; font-size: 12px; margin-bottom: 12px; letter-spacing: 1px;">PARTIES TO THIS AGREEMENT:</div>
  <table style="width: 100%; margin-bottom: 28px;">
    <tr>
      <!-- SERVICE PROVIDER -->
      <td style="width: 48%; vertical-align: top; border: 1px solid #ccc; padding: 14px 16px;">
        <div style="font-size: 10px; color: #888; letter-spacing: 1px; margin-bottom: 6px;">SERVICE PROVIDER</div>
        <div style="font-weight: 700; margin-bottom: 4px;">${biller?.name || ''}</div>
        ${billerAddress ? `<div style="color: #555;">${billerAddress}</div>` : ''}
        ${biller?.email ? `<div style="color: #555;">Email: ${biller.email}</div>` : ''}
        ${biller?.gstNumber ? `<div style="color: #555;">GST: ${biller.gstNumber}</div>` : ''}
      </td>
      <td style="width: 4%;"></td>
      <!-- CLIENT -->
      <td style="width: 48%; vertical-align: top; border: 1px solid #ccc; padding: 14px 16px;">
        <div style="font-size: 10px; color: #888; letter-spacing: 1px; margin-bottom: 6px;">CLIENT</div>
        <div style="font-weight: 700; margin-bottom: 4px;">${customer?.name || ''}</div>
        ${clientAddress ? `<div style="color: #555;">${clientAddress}</div>` : ''}
        ${customer?.name ? `<div style="color: #555;">Contact: ${customer.name}</div>` : ''}
        ${customer?.email ? `<div style="color: #555;">Email: ${customer.email}</div>` : ''}
      </td>
    </tr>
  </table>

  <!-- SECTION 1: SCOPE OF SERVICES -->
  ${description ? `
  <div style="margin-bottom: 20px;">
    <div style="font-weight: 700; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px;">1. SCOPE OF SERVICES</div>
    <div style="color: #444;; line-height: 1.7;">${renderDescription(description)}</div>
  </div>` : ''}

  <!-- SECTION 2: PAYMENT TERMS -->
  <div style="margin-bottom: 20px;">
    <div style="font-weight: 700; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px;">2. PAYMENT TERMS</div>
    <div style="color: #444;; line-height: 1.7;">
      ${contractValue && parseFloat(contractValue) > 0 ? `<p style="margin: 0 0 4px 0;">Total Contract Value: ${currencySymbol}${fmt(contractValue)}</p>` : ''}
      ${paymentTerms ? `<p style="margin: 0 0 4px 0;">Payment Terms: ${paymentTerms}</p>` : ''}
      ${billingFrequency ? `<p style="margin: 0 0 4px 0;">Billing Frequency: ${billingFrequency}</p>` : ''}
      <p style="margin: 4px 0 0 0;">Invoices shall be raised ${billingFrequency ? billingFrequency.toLowerCase() : 'periodically'} and payment shall be made within the agreed payment terms. Late payments shall attract interest at 1.5% per month.</p>
    </div>
  </div>

  <!-- SECTION 3: AGREEMENT TERM -->
  <div style="margin-bottom: 20px;">
    <div style="font-weight: 700; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px;">3. AGREEMENT TERM</div>
    <div style="color: #444;; line-height: 1.7;">
      <p style="margin: 0;">This Agreement shall commence on <strong>${formatDate(startDate)}</strong>${endDate ? ` and shall remain in effect until <strong>${formatDate(endDate)}</strong>` : ''}, unless earlier terminated in accordance with the terms hereof.</p>
    </div>
  </div>

  <!-- SECTION 4: CONFIDENTIALITY -->
  <div style="margin-bottom: 20px;">
    <div style="font-weight: 700; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px;">4. CONFIDENTIALITY</div>
    <div style="color: #444; line-height: 1.7;">
      Both parties agree to maintain strict confidentiality of all proprietary, technical, financial, and business information shared during the course of this Agreement. This obligation shall survive the termination of this Agreement for a period of three (3) years.
    </div>
  </div>

  <!-- SECTION 5: TERMINATION -->
  <div style="margin-bottom: 20px;">
    <div style="font-weight: 700; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px;">5. TERMINATION</div>
    <div style="color: #444; line-height: 1.7;">
      Either party may terminate this Agreement by providing thirty (30) days written notice to the other party. In the event of material breach, the non-breaching party may terminate immediately upon written notice.
    </div>
  </div>

  <!-- SECTION 6: GOVERNING LAW -->
  <div style="margin-bottom: 28px;">
    <div style="font-weight: 700; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px;">6. GOVERNING LAW</div>
    <div style="color: #444; line-height: 1.7;">
      This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in ${biller?.city || 'Mumbai'}, ${biller?.state || 'Maharashtra'}.
    </div>
  </div>

  ${specialTerms ? `
  <!-- SPECIAL TERMS -->
  <div style="margin-bottom: 28px;">
    <div style="font-weight: 700; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px;">7. SPECIAL TERMS &amp; CONDITIONS</div>
    <div style="color: #444; line-height: 1.7;">${renderDescription(specialTerms)}</div>
  </div>` : ''}

  <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 20px;" />

  <!-- SIGNATURES -->
  <div style="text-align: center; font-weight: 700; font-size: 13px; letter-spacing: 2px; margin-bottom: 24px;">SIGNATURES</div>
  <table style="width: 100%;">
    <tr>
      <!-- Service Provider Signature -->
      <td style="width: 45%; vertical-align: top;">
        <div style="font-size: 10px; color: #888; letter-spacing: 1px; margin-bottom: 16px;">SERVICE PROVIDER</div>
        <div style="color: #7B5EA7; font-style: italic; font-size: 14px; border-bottom: 1px solid #333; display: inline-block; white-space: nowrap; height: 36px; line-height: 36px; margin-bottom: 4px; padding-right: 16px;">Authorized Signatory</div>
        <div style="margin-top: 8px; color: #555;">Name: ${biller?.name || ''}</div>
        <div style="margin-top: 6px; color: #555;">Title: <span style="border-bottom: 1px solid #999; display: inline-block; min-width: 120px;">&nbsp;</span></div>
        <div style="margin-top: 6px; color: #555;">Date: ${formatDate(startDate)}</div>
      </td>
      <td style="width: 10%;"></td>
      <!-- Client Signature -->
      <td style="width: 45%; vertical-align: top;">
        <div style="font-size: 10px; color: #888; letter-spacing: 1px; margin-bottom: 16px;">CLIENT</div>
        <div style="color: #3a7d44; font-style: italic; font-size: 14px; border-bottom: 1px solid #333; width: 160px; height: 36px; line-height: 36px; margin-bottom: 4px;">${customer?.name || ''}</div>
        <div style="margin-top: 8px; color: #555;">Name: ${customer?.name || ''}</div>
        <div style="margin-top: 6px; color: #555;">Title: <span style="border-bottom: 1px solid #999; display: inline-block; min-width: 120px;">&nbsp;</span></div>
        <div style="margin-top: 6px; color: #555;">Date: ${formatDate(startDate)}</div>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div style="margin-top: 36px; text-align: right; font-size: 11px; color: #999;">
    Agreement created using
    <img src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09"
      style="display: inline-block; height: 14px; vertical-align: middle; margin-left: 4px;" alt="Peko" />
  </div>

</div>
</body>
</html>
`;
};
