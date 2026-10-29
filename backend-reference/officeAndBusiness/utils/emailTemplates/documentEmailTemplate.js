const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const { v2Header, v2Footer, socialIconCells, websiteLabel, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { DEFAULT_PARTNER_DETAILS } = require('./invoicingV2');

// Used for Invoice and Sales Order emails (PDF attached, no action buttons)
exports.documentEmailTemplate = ({ docNumber, docLabel, customerName, totalAmount, currency, invoiceDate, dueDate, companyName }) => {
  const formattedAmount = Number(totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currencySymbol = currency || '₹';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${docLabel} from ${companyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background-color:#1a73e8;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${docLabel} from ${companyName}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#333333;font-size:15px;">Dear <strong>${customerName}</strong>,</p>
              <p style="margin:0 0 24px;color:#555555;font-size:14px;line-height:1.6;">
                Please find your ${docLabel.toLowerCase()} attached to this email.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="6" cellspacing="0">
                      <tr>
                        <td style="color:#888888;font-size:13px;width:50%;">${docLabel} Number</td>
                        <td style="color:#222222;font-size:13px;font-weight:600;">${docNumber}</td>
                      </tr>
                      <tr>
                        <td style="color:#888888;font-size:13px;">Date</td>
                        <td style="color:#222222;font-size:13px;font-weight:600;">${invoiceDate}</td>
                      </tr>
                      <tr>
                        <td style="color:#888888;font-size:13px;">Due Date</td>
                        <td style="color:#222222;font-size:13px;font-weight:600;">${dueDate || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="color:#888888;font-size:13px;">Total Amount</td>
                        <td style="color:#1a73e8;font-size:15px;font-weight:700;">${currencySymbol} ${formattedAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#888888;font-size:12px;">For any queries, please contact ${companyName} directly.</p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8f9fa;padding:20px 32px;border-top:1px solid #e8eaed;">
              <p style="margin:0;color:#aaaaaa;font-size:12px;text-align:center;">
                This email was sent by ${companyName} via <a href="https://peko.one" style="color:#1a73e8;text-decoration:none;">Peko</a>. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Used for Quotation emails (PDF attached + Accept/Reject action buttons)
// key: QUOTATION_SHARE (service: INVOICING)
exports.quotationEmailTemplate = ({ quotationNumber, customerName, totalAmount, currency, invoiceDate, dueDate, companyName, acceptUrl, rejectUrl }, partnerDetails = DEFAULT_PARTNER_DETAILS) => {
  const formattedAmount = Number(totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currencySymbol = currency || '₹';
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });
  const rowLabel = `font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;`;
  const rowValue = `font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Quotation from ${companyName}</title>
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
      <div aria-label="Quotation from ${companyName}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Quotation from ${companyName}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${customerName},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Please find below the quotation details. Kindly review and accept or reject at your earliest convenience.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}">Quotation Number:</td>
                                        <td class="order-value" valign="top" style="${rowValue}">${quotationNumber}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}">Quotation Date:</td>
                                        <td class="order-value" valign="top" style="${rowValue}">${invoiceDate}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}">Valid Until:</td>
                                        <td class="order-value" valign="top" style="${rowValue}">${dueDate || 'N/A'}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="${rowLabel}padding-bottom:0;">Total Amount:</td>
                                        <td class="order-value" valign="top" style="${rowValue}padding-bottom:0;font-weight:700;">${currencySymbol} ${formattedAmount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.6;text-align:left;color:#000000;">Your Response:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td style="padding-right:12px;">
                                          <a href="${acceptUrl}" target="_blank" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:16px 32px;border-radius:10px;">Accept Quotation</a>
                                        </td>
                                        <td>
                                          <a href="${rejectUrl}" target="_blank" style="display:inline-block;background-color:#ffffff;color:#000000;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:15px 31px;border:1px solid #000000;border-radius:10px;">Reject Quotation</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;text-align:left;color:#4B5563;">If the buttons above don't work, copy and paste one of these links into your browser:<br />Accept: <a href="${acceptUrl}" style="color:#000000;">${acceptUrl}</a><br />Reject: <a href="${rejectUrl}" style="color:#000000;">${rejectUrl}</a></div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">For any queries, please contact ${companyName} directly.<br /><br />Best regards,<br />${companyName}</div>
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

// Resolves QUOTATION_SHARE against the admin template store; local template above is the fallback.
exports.resolveQuotationEmailTemplate = (args, fallbackSubject, logTraceId, partnerId = null, partnerDetails = DEFAULT_PARTNER_DETAILS) => {
  const { quotationNumber, customerName, totalAmount, currency, invoiceDate, dueDate, companyName, acceptUrl, rejectUrl } = args;
  const formattedAmount = Number(totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const partner = normalisePartner(partnerDetails);
  const variables = {
    quotationNumber,
    customerName,
    quotationDate: invoiceDate || '-',
    validUntil: dueDate || 'N/A',
    totalAmount: `${currency || '₹'} ${formattedAmount}`,
    companyName,
    acceptUrl,
    rejectUrl,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.QUOTATION_SHARE,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject,
    fallback: () => exports.quotationEmailTemplate(args, partnerDetails),
    partnerId,
    logTraceId,
  });
};
