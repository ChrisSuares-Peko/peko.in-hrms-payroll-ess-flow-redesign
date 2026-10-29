const { formatNumberWithLocalString, formatIndiaEmailDateTime } = require('../formatter');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const { socialIconCells, websiteLabel, v2Header, v2Footer, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const formatRupees = (value) => `₹ ${formatNumberWithLocalString(value)}`;

const detailRow = (label, value) => `
                              <tr>
                                <td class="order-label" style="font-family:${FONT};font-size:15px;font-weight:700;line-height:1.6;color:#000000;padding:8px 0;border-bottom:1px solid #E5E7EB;width:45%;vertical-align:top;">${label}</td>
                                <td class="order-value" style="font-family:${FONT};font-size:15px;line-height:1.6;color:#000000;padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right;vertical-align:top;word-break:break-word;">${value}</td>
                              </tr>`;

// key: WORKS_PURCHASE_SUCCESS (service: WORKS)
exports.worksPurchaseEmail = (name, amount, planData, transactionId, partnerDetails) => {
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || partnerDetails?.baseUrl || 'https://in.peko.one';
  const logo = partnerDetails?.logo;
  const { socials } = normalisePartner(partnerDetails);
  const workName = planData?.work?.name || '-';
  const planName = planData?.name || '-';
  const planLabel = `${workName} - ${planName}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Works purchased successfully</title>
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
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; border-bottom:0 !important; padding-top:2px !important; padding-bottom:2px !important; }
        }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Works purchased successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${v2Header({ website, websiteLabel: websiteLabel(website), logo, branding })}
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
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Works purchased successfully</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are delighted to inform you that your recent payment of ${formatRupees(amount)} for your ${planLabel} plan has been successfully processed. Your plan ${planLabel} is now active. Below, please find the transaction details.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:20px;font-weight:700;line-height:1.4;text-align:left;color:#000000;">Transaction Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>${detailRow('Order placed on', formatIndiaEmailDateTime())}${detailRow('Transaction ID', transactionId)}${detailRow('Amount paid', formatRupees(amount))}${detailRow('Work', workName)}${detailRow('Plan', planName)}${detailRow('Plan price', formatRupees(planData?.price))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best Regards,<br>Team ${branding}</div>
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

${v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding })}

      </div>
    </body>
  </html>`;
};

// Admin-managed template resolution; falls back to worksPurchaseEmail above.
exports.resolveWorksPurchaseEmail = (name, amount, planData, transactionId, partnerDetails, { fallbackSubject, partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name: name || 'Customer',
    amount: formatRupees(amount),
    transactionId: transactionId || '-',
    orderDate: formatIndiaEmailDateTime(),
    workName: planData?.work?.name || '-',
    planName: planData?.name || '-',
    planPrice: formatRupees(planData?.price),
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.WORKS_PURCHASE_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.WORKS,
    variables,
    fallbackSubject,
    fallback: () => exports.worksPurchaseEmail(name, amount, planData, transactionId, partnerDetails),
    partnerId,
    logTraceId,
  });
};
