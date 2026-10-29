exports.invoicingV2Template = (data) => {
  const {
    invoiceNumber, prefix, invoiceDate, dueDate, invoiceType, taxType, currency, documentType,
    name, email, phoneNumber, address, city, state, pincode, country, gstNumber, cashSale,
    items: rawItems,
    termsAndConditions, notes, biller
  } = data;

  // For a foreign-currency invoice, the stored totals are INR-equivalent (for internal
  // stats) — always show the as-entered figures to the customer, never the converted
  // numbers or the rate itself.
  const subtotal    = data.originalSubtotal    ?? data.subtotal;
  const tax         = data.originalTax         ?? data.tax;
  const discount    = data.originalDiscount    ?? data.discount;
  const shippingCost = data.shippingCost;
  const totalAmount = data.originalTotalAmount ?? data.totalAmount;
  const amountPaid  = data.originalAmountPaid  ?? data.amountPaid;
  const amountDue   = data.originalAmountDue   ?? data.amountDue;
  const items = (rawItems || []).map(item => ({
    ...item,
    unitPrice: item.originalUnitPrice ?? item.unitPrice,
    netAmount: item.originalNetAmount ?? item.netAmount,
  }));

  const headingMap = {
    INVOICE: 'Invoice',
    SALES_ORDER: 'Sales Order',
    QUOTATION: 'Quotation',
  };
  const heading = headingMap[documentType] || 'Invoice';

  const dateLabelMap = {
    INVOICE: 'Invoice Date',
    SALES_ORDER: 'Order Date',
    QUOTATION: 'Quotation Date',
  };
  const dateLabel = dateLabelMap[documentType] || 'Invoice Date';

  const displayInvoiceNumber = prefix ? `${prefix}${invoiceNumber}` : invoiceNumber;

  const currencySymbol = invoiceType === 'DOMESTIC' ? '₹' : (currency || '');

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const fmt = (val) => parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const halfTax = parseFloat(tax || 0) / 2;
  // International invoices carry no GST — show no tax line at all, not even a generic "Tax" row.
  const taxRows = invoiceType === 'INTERNATIONAL'
    ? ''
    : taxType === 'Inter-State'
      ? `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">IGST</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">₹ ${fmt(tax)}</td>
        </tr>`
      : `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">CGST</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">₹ ${fmt(halfTax)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">SGST</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">₹ ${fmt(halfTax)}</td>
        </tr>`;

  const discountPct = parseFloat(subtotal || 0) > 0
    ? Math.round(parseFloat(discount || 0) / parseFloat(subtotal) * 100)
    : 0;

  const billerAddress = [biller?.address, biller?.city, biller?.state, biller?.pincode].filter(Boolean).join(', ');
  const buyerAddress = [address, city, state, pincode, country].filter(Boolean).join(', ');

  const itemsList = Array.isArray(items) ? items : [];
  const hasItemDiscount = itemsList.some(item => parseFloat(item.discount || 0) > 0);

  const taxRateLabelMap = { EXPORT_0: '0% Export', EXEMPTED: 'Exempted' };
  const taxRateLabel = (rate) => taxRateLabelMap[rate] || (rate ? `${rate}%` : '0%');

  const itemRows = itemsList.map((item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; font-weight: 700;">${item.name || '-'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; color: #555;">${item.hsn || '-'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; vertical-align: top;">${item.quantity || 0}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; vertical-align: top;">${item.unit || '-'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top;">${currencySymbol} ${fmt(item.unitPrice)}</td>
      ${hasItemDiscount ? `<td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; vertical-align: top;">${item.discount || 0}</td>` : ''}
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; vertical-align: top;">${taxRateLabel(item.taxRate)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; vertical-align: top;">${currencySymbol} ${fmt(item.netAmount)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <style>
    @page { margin: 1.5rem 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 13px; line-height: 1.5; -webkit-print-color-adjust: exact; }
    table { border-collapse: collapse; width: 100%; }
    img { display: block; }
  </style>
</head>
<body>
<div style="padding: 30px 40px;">

  <!-- HEADER: logo + Invoice title -->
  <table style="width: 100%; margin-bottom: 20px;">
    <tr>
      <td style="vertical-align: middle;">
        ${biller && biller.logo ? `<img src="${biller.logo}" style="height: 48px;" />` : ''}
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <span style="font-size: 36px; font-weight: 700; color: #222;">${heading}</span>
      </td>
    </tr>
  </table>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin-bottom: 20px;" />

  <!-- FROM / BILLED TO / INVOICE META -->
  <table style="width: 100%; margin-bottom: 24px;">
    <tr>
      <td style="width: 33%; vertical-align: top;">
        <div style="font-weight: 700; color: #666; margin-bottom: 6px;">From</div>
        <div style="font-weight: 700; margin-bottom: 2px;">${biller?.name || ''}</div>
        ${billerAddress ? `<div style="color: #555;">${billerAddress}</div>` : ''}
        ${biller?.phoneNumber ? `<div style="color: #555;">${biller.phoneNumber}</div>` : ''}
        ${biller?.email ? `<div style="color: #555;">${biller.email}</div>` : ''}
        ${biller?.gstNumber ? `<div style="color: #555;">GST: ${biller.gstNumber}</div>` : ''}
      </td>
      <td style="width: 33%; vertical-align: top;">
        <div style="font-weight: 700; color: #666; margin-bottom: 6px;">Billed To</div>
        <div style="font-weight: 700; margin-bottom: 2px;">${name || (cashSale ? 'Cash Sale' : '')}</div>
        ${buyerAddress ? `<div style="color: #555;">${buyerAddress}</div>` : ''}
        ${phoneNumber ? `<div style="color: #555;">${invoiceType === 'DOMESTIC' ? '+91 ' : ''}${phoneNumber}</div>` : ''}
        ${email ? `<div style="color: #555;">${email}</div>` : ''}
        ${gstNumber ? `<div style="color: #555;">GSTIN: ${gstNumber}</div>` : ''}
      </td>
      <td style="width: 34%; vertical-align: top; text-align: right;">
        <div style="font-weight: 700; color: #555; margin-bottom: 8px;">#${displayInvoiceNumber}</div>
        <table style="margin-left: auto; border-collapse: collapse;">
          <tr>
            <td style="color: #666; padding: 2px 12px 2px 0; white-space: nowrap;">${dateLabel}</td>
            <td style="font-weight: 600; padding: 2px 0; white-space: nowrap;">${formatDate(invoiceDate)}</td>
          </tr>
          ${dueDate ? `<tr>
            <td style="color: #666; padding: 2px 12px 2px 0; white-space: nowrap;">Due Date</td>
            <td style="font-weight: 600; padding: 2px 0; white-space: nowrap;">${formatDate(dueDate)}</td>
          </tr>` : ''}
        </table>
      </td>
    </tr>
  </table>

  <!-- ITEMS TABLE -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
    <thead>
      <tr style="background-color: #2d2d2d;">
        <th style="color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px;">Name</th>
        <th style="color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px;">HSN</th>
        <th style="color: #fff; padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px;">Quantity</th>
        <th style="color: #fff; padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px;">Unit</th>
        <th style="color: #fff; padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px;">Unit Price (${currencySymbol})</th>
        ${hasItemDiscount ? `<th style="color: #fff; padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px;">Discount (%)</th>` : ''}
        <th style="color: #fff; padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px;">Tax Rate (%)</th>
        <th style="color: #fff; padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px;">Net Amount (${currencySymbol})</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- TOTALS + TERMS -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 0;">
    <tr>
      <td style="width: 55%; vertical-align: top; padding-right: 24px; padding-top: 24px;">
        ${(biller?.bankName || biller?.accountNumber) ? `
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 700; margin-bottom: 4px;">Bank Details</div>
          <div style="color: #555; font-size: 12px;">
            ${biller?.accountHolderName ? `<div>Holder: ${biller.accountHolderName}</div>` : ''}
            ${biller?.bankName ? `<div>Bank: ${biller.bankName}</div>` : ''}
            ${biller?.accountNumber ? `<div>Account: ${biller.accountNumber}</div>` : ''}
            ${biller?.ifscCode ? `<div>IFSC: ${biller.ifscCode}</div>` : ''}
          </div>
        </div>` : ''}
        ${termsAndConditions ? `
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 700; margin-bottom: 4px;">Terms &amp; Conditions</div>
          <div style="color: #555; font-size: 12px; white-space: pre-line;">${termsAndConditions}</div>
        </div>` : ''}
        ${notes ? `
        <div>
          <div style="font-weight: 700; margin-bottom: 4px;">Notes</div>
          <div style="color: #555; font-size: 12px; white-space: pre-line;">${notes}</div>
        </div>` : ''}
      </td>
      <td style="width: 45%; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">Subtotal</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${currencySymbol} ${fmt(subtotal)}</td>
          </tr>
          ${taxRows}
          ${parseFloat(discount || 0) > 0 ? `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">Discount${discountPct > 0 ? ` (${discountPct}%)` : ''}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${currencySymbol} ${fmt(discount)}</td>
          </tr>` : ''}
          ${parseFloat(shippingCost || 0) > 0 ? `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">Shipping</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${currencySymbol} ${fmt(shippingCost)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">Total</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${currencySymbol} ${fmt(totalAmount)}</td>
          </tr>
          ${parseFloat(amountPaid || 0) > 0 ? `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #555;">Amount Paid</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${currencySymbol} ${fmt(amountPaid)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 10px 12px; background: #f7f7f7; font-weight: 700;">Amount Due</td>
            <td style="padding: 10px 12px; background: #f7f7f7; font-weight: 700; text-align: right;">${currencySymbol} ${fmt(amountDue)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- SIGNATURE -->
  <table style="width: 100%; margin-top: 32px;">
    <tr>
      <td style="width: 55%;"></td>
      <td style="width: 45%; text-align: center;">
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px 24px; background: #fafafa;">
          <div style="color: #999; font-size: 12px; margin-bottom: 12px;">From ${biller?.name || ''}</div>
          ${biller?.signatureUrl ? `<img src="${biller.signatureUrl}" style="height: 48px; margin: 0 auto 12px auto;" />` : `<div style="height: 48px; margin-bottom: 12px;"></div>`}
          <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 10px;" />
          <div style="font-weight: 700; font-size: 12px;">Authorised Signatory</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div style="margin-top: 30px; text-align: right; font-size: 11px; color: #999;">
    Invoice created using
    <img src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09"
      style="display: inline-block; height: 14px; vertical-align: middle; margin-left: 4px;" alt="Peko" />
  </div>

</div>
</body>
</html>
`;
};