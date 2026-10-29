'use strict';

const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('./sharedLayout');

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatAmount(val, currency) {
  const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[String(currency || 'INR').toUpperCase()] || '₹';
  const num = parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sym}${num}`;
}

// The cancel reason is free text typed by the buyer.
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

exports.buildPoCancelledSubject = ({ po, corporate }) => {
  const buyerName = corporate?.companyName || corporate?.name || '';
  return `Purchase Order Cancelled: ${po.refNumber}${buyerName ? ` | ${buyerName}` : ''}`;
};

exports.poCancelledTemplate = ({ po, corporate, initiator = {} }) => {
  const website      = corporate?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const socials      = socialIconCells(corporate?.socials, { size: 24, padding: '0 16px' });

  const vendorName    = po.vendor?.contactPerson || po.vendor?.businessName || 'Vendor';
  const vendorCompany = po.vendor?.businessName || 'your organisation';
  const buyerName     = corporate?.companyName || corporate?.name || '';
  const buyerEmail    = initiator.email || 'reach@peko.one';
  const buyerPhone    = initiator.phone || '';

  const rows = [
    ['PO Number', po.refNumber],
    ['Title', po.title || '-'],
    ['Order Value', formatAmount(po.totalAmount, po.currency)],
    ['Cancelled On', formatDate(po.cancelledAt)],
    ['Reason', escapeHtml(po.cancelReason) || '-'],
  ].map(([label, value]) => `<tr><td style="padding:6px 0;font-family:${FONT};font-size:12px;color:#6B7280;vertical-align:top;">${label}</td><td align="right" style="padding:6px 0 6px 16px;font-family:${FONT};font-size:13px;font-weight:700;color:#111827;">${value}</td></tr>`).join('');

  return `<!doctype html>
  <html lang="en" dir="ltr">
    <head>
      <title>Purchase Order Cancelled: ${po.refNumber}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        @media only screen and (max-width:479px) { .peko-card { padding: 24px 16px !important; } }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${v2Header({ website, websiteLabel, logo: corporate?.logo, branding: corporate?.branding || 'Peko' })}
      <div style="background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
          <tbody><tr><td style="padding:0 20px;">
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
              <tbody><tr><td class="peko-card" style="background-color:#ffffff;border-radius:16px;padding:48px;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                  <tbody>
                    <tr><td style="padding-bottom:24px;font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;color:#000000;">Purchase Order Cancelled</td></tr>
                    <tr><td style="padding-bottom:20px;font-family:${FONT};font-size:16px;line-height:1.6;color:#000000;">
                      Dear <strong>${vendorName}</strong>,
                      <div style="padding-top:8px;"><strong>${buyerName}</strong> has cancelled the purchase order below. Please do not deliver or invoice against it.</div>
                    </td></tr>
                    <tr><td style="padding-bottom:20px;">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#F9FAFB;border-radius:8px;padding:14px 20px;">
                        <tbody>${rows}</tbody>
                      </table>
                    </td></tr>
                    <tr><td style="padding-bottom:20px;font-family:${FONT};font-size:13px;color:#374151;">For any queries, please contact us at: <a href="mailto:${buyerEmail}" style="color:#000000;">${buyerEmail}</a>${buyerPhone ? ` &nbsp;|&nbsp; ${buyerPhone}` : ''}</td></tr>
                    <tr><td style="font-family:${FONT};font-size:11px;color:#9CA3AF;padding-top:12px;border-top:1px solid #E5E7EB;">This email is intended solely for <strong>${vendorCompany}</strong>.<br>This is a system generated email. Do not reply.</td></tr>
                  </tbody>
                </table>
              </td></tr></tbody>
            </table>
          </td></tr></tbody>
        </table>
      </div>
${v2Footer({ socials })}
      </div>
    </body>
  </html>`;
};
