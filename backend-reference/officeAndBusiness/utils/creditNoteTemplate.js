const REASON_LABELS = {
    GOODS_RETURNED: 'Goods Returned',
    OVERCHARGE: 'Overcharge',
    SERVICE_CANCELLED: 'Service Cancelled',
    DISCOUNT: 'Discount',
    OTHER: 'Other',
};

exports.creditNoteTemplate = (data) => {
    const {
        invoiceNumber, prefix, invoiceDate, dueDate, taxType,
        name, email, phoneNumber, address, gstNumber, cashSale,
        items, subtotal, tax, discount, shippingCost, totalAmount,
        biller,
        creditNoteDetails,
        linkedInvoiceDate, linkedInvoiceDueDate,
    } = data;

    const cnNumber = prefix ? `${prefix}${invoiceNumber}` : invoiceNumber;
    const linkedRef = creditNoteDetails
        ? `${creditNoteDetails.linkedInvoicePrefix || ''}${creditNoteDetails.linkedInvoiceNumber || ''}`
        : '';
    const reason = creditNoteDetails?.reason || '';
    const additionalDetails = creditNoteDetails?.additionalDetails || '';
    const reasonLabel = REASON_LABELS[reason] || reason;

    const isInterState = taxType === 'Inter-State';
    const taxLabel = isInterState ? 'IGST' : 'CGST + SGST';

    const fmt = (val) =>
        parseFloat(val || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const itemsList = Array.isArray(items) ? items : [];

    const itemRows = itemsList.map((item) => {
        const taxRate = parseFloat(item.taxRate) || 0;
        const displayTaxRate = isInterState
            ? `${taxRate}%`
            : `${(taxRate / 2).toFixed(1)}%`;
        return `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${item.name || '-'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280;">${item.hsn || '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${fmt(item.unitPrice)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${parseFloat(item.discount || 0)}%</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${displayTaxRate}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${fmt(item.netAmount)}</td>
      </tr>`;
    }).join('');

    const discountRow =
        parseFloat(discount || 0) > 0
            ? `<tr>
          <td style="padding: 4px 0; color: #6b7280;">Discount</td>
          <td style="padding: 4px 0; text-align: right;">-₹${fmt(discount)}</td>
        </tr>`
            : '';

    const shippingRow =
        parseFloat(shippingCost || 0) > 0
            ? `<tr>
          <td style="padding: 4px 0; color: #6b7280;">Shipping</td>
          <td style="padding: 4px 0; text-align: right;">₹${fmt(shippingCost)}</td>
        </tr>`
            : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Credit Note ${cnNumber}</title>
  <style>
    @page { margin: 1rem 0; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
<div style="padding: 32px 40px;">

  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
    <div>
      ${biller?.logo ? `<img src="${biller.logo}" alt="logo" style="max-height: 48px; margin-bottom: 8px; display: block;" />` : ''}
      <div style="font-size: 22px; font-weight: 700;">Credit Note</div>
      <div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
        ${linkedRef ? `<span style="background: #fef3c7; color: #92400e; border-radius: 4px; padding: 2px 8px; font-size: 11px; display: inline-block;">Reference: ${linkedRef}</span>` : ''}
        ${reasonLabel ? `<span style="background: #ecfdf5; color: #065f46; border-radius: 4px; padding: 2px 8px; font-size: 11px; display: inline-block;">${reasonLabel}</span>` : ''}
      </div>
      ${additionalDetails ? `<div style="margin-top: 4px; font-size: 11px; color: #6b7280;">${additionalDetails}</div>` : ''}
    </div>
    <div style="text-align: right; font-size: 12px; line-height: 1.8;">
      <div style="font-weight: 700; font-size: 15px;">${cnNumber}</div>
      ${invoiceDate ? `<div style="color: #6b7280;">Issue Date: ${invoiceDate}</div>` : ''}
      ${dueDate ? `<div style="color: #6b7280;">Due: ${dueDate}</div>` : ''}
    </div>
  </div>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;" />

  <!-- FROM / BILLED TO / DETAILS -->
  <table style="margin-bottom: 20px;">
    <tr>
      <td style="width: 33%; vertical-align: top;">
        <div style="font-size: 10px; color: #9ca3af; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px;">FROM</div>
        <div style="font-weight: 700;">${biller?.name || ''}</div>
        ${biller?.phoneNumber ? `<div style="color: #374151;">${biller.phoneNumber}</div>` : ''}
        ${biller?.email ? `<div style="color: #374151;">${biller.email}</div>` : ''}
        ${biller?.gstNumber ? `<div style="color: #374151; font-size: 11px;">GSTIN: ${biller.gstNumber}</div>` : ''}
      </td>
      <td style="width: 34%; vertical-align: top;">
        <div style="font-size: 10px; color: #9ca3af; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px;">BILLED TO</div>
        <div style="font-weight: 700;">${name || (cashSale ? 'Cash Sale' : '')}</div>
        ${address ? `<div style="color: #374151;">${address}</div>` : ''}
        ${phoneNumber ? `<div style="color: #374151;">${phoneNumber}</div>` : ''}
        ${email ? `<div style="color: #374151;">${email}</div>` : ''}
        ${gstNumber ? `<div style="color: #374151; font-size: 11px;">GSTIN: ${gstNumber}</div>` : ''}
      </td>
      <td style="width: 33%; vertical-align: top; text-align: right;">
        <div style="font-size: 10px; color: #9ca3af; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px;">DETAILS</div>
        ${linkedInvoiceDate ? `<div><span style="color: #6b7280;">Invoice Date </span><strong>${linkedInvoiceDate}</strong></div>` : ''}
        ${linkedInvoiceDueDate ? `<div><span style="color: #6b7280;">Due Date </span><strong>${linkedInvoiceDueDate}</strong></div>` : ''}
      </td>
    </tr>
  </table>

  <!-- Items Table -->
  <table style="margin-bottom: 16px;">
    <thead>
      <tr style="background: #1f2937; color: #fff;">
        <th style="padding: 8px 10px; text-align: left; font-size: 12px;">Description</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 12px;">HSN</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 12px;">Qty</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 12px;">Price</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 12px;">Disc %</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 12px;">Tax Rate %</th>
        <th style="padding: 8px 10px; text-align: right; font-size: 12px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display: flex; justify-content: flex-end;">
    <table style="width: 280px;">
      <tr>
        <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Subtotal</td>
        <td style="padding: 4px 0; text-align: right; font-size: 13px;">₹${fmt(subtotal)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">${taxLabel}</td>
        <td style="padding: 4px 0; text-align: right; font-size: 13px;">₹${fmt(tax)}</td>
      </tr>
      ${shippingRow}
      <tr>
        <td colspan="2" style="padding: 4px 0;"><hr style="border: none; border-top: 1px solid #e5e7eb;" /></td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 0;">
          <div style="background: #fff5f5; border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #dc2626; font-weight: 700;">Credit Total</span>
            <span style="color: #dc2626; font-weight: 700;">₹${fmt(totalAmount)}</span>
          </div>
          <div style="padding: 6px 10px; display: flex; justify-content: space-between;">
            <span style="color: #dc2626;">Amount due</span>
            <span style="color: #dc2626; font-weight: 600;">₹${fmt(totalAmount)}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
    <div style="font-size: 10px; color: #9ca3af; margin-bottom: 8px;">
      This credit note is issued in accordance with applicable GST regulations.
      Reference the original invoice number for your records.
    </div>
    <div style="text-align: right; font-size: 11px; color: #374151; font-weight: 600;">
      Credit Note created using <strong>Peko</strong>
    </div>
  </div>

</div>
</body>
</html>`;
};
