const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { DEFAULT_PARTNER_DETAILS } = require('./invoicingV2');

exports.paymentReceiptPdfTemplate = ({ receiptNo, paymentDate, amount, currency, invoice, payment, billerName, cu }) => `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><style>
body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:600px;margin:0 auto;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;}
.receipt-title{font-size:11px;font-weight:600;color:#6b7280;letter-spacing:2px;text-transform:uppercase;}
.receipt-no{font-size:24px;font-weight:700;color:#111;}
.issued{font-size:11px;color:#9ca3af;margin-top:4px;}
.paid-stamp{border:2.5px solid #22c55e;border-radius:4px;padding:4px 12px;transform:rotate(6deg);display:inline-block;}
.paid-text{font-size:13px;font-weight:700;color:#22c55e;letter-spacing:2px;}
hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:16px;}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px;}
.label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.value{font-size:13px;font-weight:600;color:#111;}
.value-sm{font-size:12px;color:#6b7280;}
.amount-box{background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:16px;}
.amount-label{font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;}
.amount-value{font-size:28px;font-weight:700;color:#16a34a;margin-top:4px;}
.alloc-row{display:flex;justify-content:space-between;align-items:center;padding:0 4px;}
.alloc-inv{font-size:13px;font-weight:500;color:#111;}
.alloc-sub{font-size:11px;color:#6b7280;}
.alloc-amt{font-size:13px;font-weight:600;color:#111;}
</style></head>
<body>
<div class="header">
  <div>
    <div class="receipt-title">Payment Receipt</div>
    <div class="receipt-no">${receiptNo}</div>
    <div class="issued">Issued ${paymentDate}</div>
  </div>
  <div class="paid-stamp"><span class="paid-text">PAID</span></div>
</div>
<hr/>
<div class="grid2">
  <div>
    <div class="label">Received From</div>
    <div class="value">${invoice.name || ''}</div>
    ${invoice.email ? `<div class="value-sm">${invoice.email}</div>` : ''}
    ${invoice.phoneNumber ? `<div class="value-sm">${invoice.phoneNumber}</div>` : ''}
  </div>
  <div>
    <div class="label">Received By</div>
    <div class="value">${billerName}</div>
    ${cu.gstNumber ? `<div class="value-sm">GST: ${cu.gstNumber}</div>` : ''}
  </div>
</div>
<hr/>
<div class="grid4">
  <div><div class="label">Payment Date</div><div class="value">${paymentDate}</div></div>
  <div><div class="label">Method</div><div class="value">${payment.paymentMethod}</div></div>
  <div><div class="label">Reference</div><div class="value">${payment.referenceId || '—'}</div></div>
  <div><div class="label">Currency</div><div class="value">${currency}</div></div>
</div>
<hr/>
<div class="amount-box">
  <div class="amount-label">Amount Received</div>
  <div class="amount-value">₹${amount}</div>
</div>
<div style="margin-bottom:8px;font-size:13px;font-weight:600;color:#374151;">Allocated to</div>
<div class="alloc-row">
  <div>
    <div class="alloc-inv">${invoice.invoiceNumber}</div>
    <div class="alloc-sub">${invoice.name || ''} — ${paymentDate}</div>
  </div>
  <div class="alloc-amt">₹${amount}</div>
</div>
</body>
</html>`;

// key: PAYMENT_RECEIPT (service: INVOICING)
exports.paymentReceiptEmailTemplate = ({ receiptNo, paymentDate, amount, invoiceNumber, customerName, billerName }, partnerDetails = DEFAULT_PARTNER_DETAILS) => {
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });
  const rowLabel = `font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;`;
  const rowValue = `font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Payment Receipt — ${receiptNo}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
        }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Payment Receipt ${receiptNo}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Payment Receipt — ${receiptNo}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${customerName},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Your payment of <strong>₹${amount}</strong> for invoice <strong>${invoiceNumber}</strong> has been received on ${paymentDate}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}">Receipt Number:</td>
                                        <td class="order-value" valign="top" style="${rowValue}">${receiptNo}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}">Invoice Number:</td>
                                        <td class="order-value" valign="top" style="${rowValue}">${invoiceNumber}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}">Payment Date:</td>
                                        <td class="order-value" valign="top" style="${rowValue}">${paymentDate}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}padding-bottom:0;">Amount Received:</td>
                                        <td class="order-value" valign="top" style="${rowValue}padding-bottom:0;font-weight:700;">₹${amount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for your payment.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Regards,<br /><strong>${billerName}</strong></div>
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

// Resolves PAYMENT_RECEIPT against the admin template store; local template above is the fallback.
exports.resolvePaymentReceiptEmailTemplate = (args, fallbackSubject, logTraceId, partnerId = null, partnerDetails = DEFAULT_PARTNER_DETAILS) => {
  const { receiptNo, paymentDate, amount, invoiceNumber, customerName, billerName } = args;
  const partner = normalisePartner(partnerDetails);
  const variables = {
    receiptNo,
    paymentDate,
    amount: `₹${amount}`,
    invoiceNumber,
    customerName,
    billerName,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.PAYMENT_RECEIPT,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject,
    fallback: () => exports.paymentReceiptEmailTemplate(args, partnerDetails),
    partnerId,
    logTraceId,
  });
};
