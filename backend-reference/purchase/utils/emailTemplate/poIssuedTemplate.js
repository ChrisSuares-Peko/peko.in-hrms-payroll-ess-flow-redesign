'use strict';

const { customLog } = require('../loggerHelper');

const NODE_ENV       = process.env.NODE_ENV;
const PRODUCTION_URL = process.env.FRONTEND_PRODUCTION_URL;
const STAGING_URL    = process.env.FRONTEND_STAGING_URL;

const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('./sharedLayout');

function getPortalBaseUrl() {
  if (NODE_ENV === 'production') return PRODUCTION_URL;
  if (NODE_ENV === 'staging')    return STAGING_URL;
  return 'http://localhost:5173';
}

function buildAcknowledgeLink(token) {
  const base = getPortalBaseUrl();
  if (!token) {
    customLog(null, 'error', { message: '[PO Mail] buildAcknowledgeLink called with no token — link will be incomplete' });
    return `${base}/procure/po/acknowledge`;
  }
  const link = `${base}/procure/po/acknowledge/${token}`;
  customLog(null, 'info', { message: '[PO Mail] buildAcknowledgeLink', env: process.env.NODE_ENV, base });
  return link;
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatAmount(val, currency) {
  const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[String(currency || 'INR').toUpperCase()] || '₹';
  const num  = parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sym}${num}`;
}

/**
 * Generates the subject line for the PO issued email.
 * Format: Purchase Order Issued: {PO_NUMBER} - {RFQ_TITLE} | {BUYER_COMPANY_NAME}
 */
exports.buildPoIssuedSubject = ({ po, rfq, corporate }) => {
  const poNumber   = po.refNumber;
  const rfqTitle   = rfq ? rfq.title : (po.title || po.refNumber);
  const buyerName  = corporate.name || corporate.companyName || '';
  return `Purchase Order Issued: ${poNumber} - ${rfqTitle} | ${buyerName}`;
};

/**
 * Generates the HTML body for the PO issued email.
 * Expects:
 *   po         – full PurchaseOrder with lineItems and vendor
 *   rfq        – optional linked RFQ { refNumber, title }
 *   corporate  – buyer's corporate user record
 *   initiator  – { name, designation, email, phone }
 *   token      – unique token for the acknowledgement link
 */
exports.poIssuedTemplate = ({ po, rfq, corporate, initiator = {}, token }) => {
  const branding = corporate?.branding || 'Peko';
  const website = corporate?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = corporate?.logo;
  const socials = socialIconCells(corporate?.socials, { size: 24, padding: '0 16px' });

  const vendorName      = po.vendor?.contactPerson || po.vendor?.businessName || 'Vendor';
  const vendorCompany   = po.vendor?.businessName  || 'your organisation';
  const buyerName       = corporate.companyName || corporate.name || '';
  const initiatorName   = initiator.name           || 'Procurement Team';
  const initiatorDesig  = (initiator.designation && initiator.designation !== 'CORPORATE') ? initiator.designation : '';
  const buyerEmail      = initiator.email          || 'reach@peko.one';
  const buyerPhone      = initiator.phone          || '';

  const poNumber        = po.refNumber;
  const poDate          = formatDate(po.sentAt || po.createdAt);
  const rfqTitle        = rfq ? rfq.title : (po.title || '-');
  const orderValue      = formatAmount(po.totalAmount, po.currency);
  const paymentTerms    = po.paymentTerms    || '-';
  const deliveryBy      = formatDate(po.deliveryDate);
  const deliveryTo      = po.deliveryAddress || '-';
  const acknowledgeLink = buildAcknowledgeLink(token);

  const lineItemRows = (po.lineItems || []).map((item) => `
                                <tr>
                                  <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;padding:10px 12px;border-bottom:1px solid #E5E7EB;">${item.description}</td>
                                  <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;padding:10px 12px;border-bottom:1px solid #E5E7EB;">${parseFloat(item.qty || 0)}${item.unit ? ' ' + item.unit : ''}</td>
                                  <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;padding:10px 12px;border-bottom:1px solid #E5E7EB;">${formatAmount(item.unitPrice, po.currency)}</td>
                                  <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#111827;padding:10px 12px;border-bottom:1px solid #E5E7EB;">${formatAmount(item.total, po.currency)}</td>
                                </tr>`).join('');

  const summaryRows = [
    ['Order Value', orderValue],
    ['Payment Terms', paymentTerms],
    ['Delivery By', deliveryBy],
    ['Delivery To', deliveryTo],
  ].map(([label, value]) => `<tr><td style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;">${label}</td><td align="right" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#111827;">${value}</td></tr>`).join('');

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Purchase Order Issued: ${poNumber} | ${buyerName}</title>
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--<![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Purchase Order Issued: ${poNumber}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${v2Header({ website, websiteLabel, logo, branding })}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Purchase Order Issued</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear <strong>${vendorName}</strong>,</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We are pleased to confirm that <strong>${buyerName}</strong> has issued a Purchase Order against your accepted proposal. The PO is attached to this email for your records.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#F9FAFB;border-radius:8px;padding:14px 20px;">
                                    <tbody>
                                      <tr><td style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;">PO Number</td><td align="right" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#111827;">${poNumber}</td></tr>
                                      <tr><td style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;">PO Date</td><td align="right" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#111827;">${poDate}</td></tr>
                                      <tr><td style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;">Title</td><td align="right" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#111827;">${rfqTitle}</td></tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #E5E7EB;padding-bottom:6px;margin-bottom:10px;">Order Summary</div>
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#F9FAFB;border-radius:8px;padding:14px 20px;">
                                    <tbody>${summaryRows}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              ${lineItemRows ? `<tr>
                                <td align="left" style="padding-bottom:20px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">Items Ordered</div>
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <thead>
                                      <tr style="background-color:#F3F4F6;">
                                        <th align="left" style="padding:10px 12px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#374151;">Description</th>
                                        <th align="center" style="padding:10px 12px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#374151;">Qty</th>
                                        <th align="right" style="padding:10px 12px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#374151;">Unit Price</th>
                                        <th align="right" style="padding:10px 12px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#374151;">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>${lineItemRows}
                                    </tbody>
                                    <tfoot>
                                      <tr style="background-color:#F9FAFB;">
                                        <td colspan="3" align="right" style="padding:12px 16px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;border-top:2px solid #E5E7EB;">Order Total</td>
                                        <td align="right" style="padding:12px 16px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;border-top:2px solid #E5E7EB;">${orderValue}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </td>
                              </tr>` : ''}
                              <tr>
                                <td align="left" style="padding-bottom:6px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">Next Steps</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;">Please acknowledge receipt of this Purchase Order and confirm the delivery schedule using your secure link below:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding-bottom:12px;">
                                  <a href="${acknowledgeLink}" target="_blank" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:53px;padding:15px 40px;">Acknowledge Purchase Order</a>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding-bottom:20px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;">No login required - this link is unique to your organisation. Do not share it with third parties.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#FFFBEB;border-left:4px solid #F59E0B;border-radius:4px;">
                                    <tbody><tr><td style="padding:12px 16px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;line-height:1.6;">Kindly quote the PO Number <strong>${poNumber}</strong> on all invoices, delivery challans, and correspondence relating to this order.</td></tr></tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;">For any queries, please contact us at: <a href="mailto:${buyerEmail}" style="color:#000000;">${buyerEmail}</a>${buyerPhone ? ` &nbsp;|&nbsp; ${buyerPhone}` : ''}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Warm regards,<br><strong>${initiatorName}</strong>${initiatorDesig ? `<br><span style="font-size:13px;color:#6B7280;">${initiatorDesig}</span>` : ''}</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9CA3AF;padding-top:12px;margin-top:16px;border-top:1px solid #E5E7EB;">This email is intended solely for <strong>${vendorCompany}</strong>.<br>This is a system generated email. Do not reply.</div>
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
${v2Footer({ socials, branding })}
      </div>
    </body>
  </html>`;
};
