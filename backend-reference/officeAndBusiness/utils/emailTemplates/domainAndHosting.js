const { formatNumberWithLocalString, formatIndiaEmailDateTime } = require('../formatter');
const { socialIconCells, v2Header, v2Footer, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS } = require('../emailTemplateKeys');

const FONT = `'Segoe UI','Helvetica Neue',Arial,sans-serif`;

const detailRow = (label, value, last = false) => `
                                      <tr>
                                        <td width="180" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:#000000;${last ? '' : 'padding-bottom:12px;'}">${label}</td>
                                        <td valign="top" style="font-family:${FONT};font-size:15px;color:#000000;${last ? '' : 'padding-bottom:12px;'}">${value}</td>
                                      </tr>`;

const textRow = (content, paddingBottom = 16) => `
                              <tr>
                                <td align="left" style="font-size:0px;${paddingBottom ? `padding-bottom:${paddingBottom}px;` : ''}word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${content}</div>
                                </td>
                              </tr>`;

// Page + 680px card chrome shared by the three Domain & Hosting emails.
const v2Page = ({ title, header, footer, bodyRows }) => `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${title}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${title}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>${bodyRows}
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

const headingRow = (text) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>
                                </td>
                              </tr>`;

const badgeRow = (badge) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${badge}
                                </td>
                              </tr>`;

const sectionRow = (text) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:20px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>
                                </td>
                              </tr>`;

const detailsTableRow = (rowsHtml) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>${rowsHtml}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>`;

const itemLabel = (itemType) => (itemType ? String(itemType).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Item');

// Provisioned items as detail rows, pre-rendered so the admin template gets one ${itemsHtml}.
const buildProvisionedItemsHtml = (provisionResults) => {
  const items = (Array.isArray(provisionResults) ? provisionResults : [])
    .map((r) => ({ label: `${itemLabel(r?.itemType)}:`, value: r?.domainName || r?.productName || '-' }));
  if (!items.length) return detailRow('Items:', '-', true);
  return items.map((item, i) => detailRow(item.label, item.value, i === items.length - 1)).join('');
};
exports.buildProvisionedItemsHtml = buildProvisionedItemsHtml;

// key: DOMAIN_HOSTING_PURCHASE_SUCCESS (service: DOMAIN_HOSTING)
exports.domainHostingSuccessTemplate = (name, corporateTxnId, totalAmount, provisionResults, partnerDetails) => {
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });

  const bodyRows = badgeRow(v2SuccessBadge())
    + headingRow('Domain &amp; Hosting Purchase Successful')
    + textRow(`Dear ${name},`, 20)
    + textRow('Your Domain &amp; Hosting purchase was successful. Please find the transaction details below.', 24)
    + sectionRow('Transaction Details')
    + detailsTableRow(
      detailRow('Date:', formatIndiaEmailDateTime())
      + detailRow('Transaction ID:', corporateTxnId)
      + detailRow('Amount paid:', `&#8377; ${formatNumberWithLocalString(totalAmount)}`)
      + buildProvisionedItemsHtml(provisionResults)
    )
    + textRow(`Thank you for choosing ${branding}. We appreciate your trust in us.`)
    + textRow('If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.')
    + textRow(`Best Regards,<br>Team ${branding}`, 0);

  return v2Page({ title: 'Domain &amp; Hosting Purchase Successful', header, footer, bodyRows });
};

// key: DOMAIN_HOSTING_PURCHASE_SUCCESS (service: DOMAIN_HOSTING)
exports.resolveDomainHostingSuccessEmail = (name, corporateTxnId, totalAmount, provisionResults, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name: name || 'Customer',
    transactionId: corporateTxnId || '-',
    amount: `₹ ${formatNumberWithLocalString(totalAmount)}`,
    purchasedOn: formatIndiaEmailDateTime(),
    itemsHtml: buildProvisionedItemsHtml(provisionResults),
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.DOMAIN_HOSTING_PURCHASE_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.DOMAIN_HOSTING,
    variables,
    fallbackSubject: 'Domain & Hosting Purchase Successful',
    fallback: () => exports.domainHostingSuccessTemplate(name, corporateTxnId, totalAmount, provisionResults, partnerDetails),
    partnerId,
    logTraceId,
  });
};

// Refund detail rows (service type always present, provider only when given) as one ${refundDetailsHtml}.
const buildRefundDetailsHtml = (params) => {
  const rows = [
    ['Transaction ID:', params?.transactionId || 'N/A'],
    ['Refund amount:', `&#8377; ${formatNumberWithLocalString(params?.amount || 0)}`],
    ['Service Type:', params?.typeOfService || 'Domain &amp; Hosting'],
  ];
  if (params?.serviceProvider) rows.push(['Service Provider:', params.serviceProvider]);
  return rows.map(([label, value], i) => detailRow(label, value, i === rows.length - 1)).join('');
};

// key: DOMAIN_HOSTING_REFUND_INITIATED (service: DOMAIN_HOSTING)
exports.domainHostingRefundInitiatedEmail = (params, partnerDetails) => {
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });
  const amount = formatNumberWithLocalString(params?.amount || 0);
  const transactionId = params?.transactionId || 'N/A';

  const bodyRows = headingRow('Refund Initiated')
    + textRow(`Dear ${params?.name || 'Customer'},`, 20)
    + textRow(`We are pleased to inform you that your refund request for &#8377; ${amount} for Transaction ID: ${transactionId} has been successfully initiated.`, 24)
    + sectionRow('Refund Details')
    + detailsTableRow(buildRefundDetailsHtml(params))
    + textRow('Your refund is currently being processed and will be credited to your original payment method within 7 to 10 business days. You will receive a confirmation email once the refund has been completed.')
    + textRow('Thank you for your patience and understanding.')
    + textRow(`Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.`)
    + textRow(`Best Regards,<br>Team ${branding}`, 0);

  return v2Page({ title: 'Refund Initiated', header, footer, bodyRows });
};

// key: DOMAIN_HOSTING_REFUND_INITIATED (service: DOMAIN_HOSTING)
exports.resolveDomainHostingRefundInitiatedEmail = (params, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name: params?.name || 'Customer',
    amount: `₹ ${formatNumberWithLocalString(params?.amount || 0)}`,
    transactionId: params?.transactionId || 'N/A',
    serviceType: params?.typeOfService || 'Domain & Hosting',
    refundDetailsHtml: buildRefundDetailsHtml(params),
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.DOMAIN_HOSTING_REFUND_INITIATED,
    service: EMAIL_TEMPLATE_SERVICES.DOMAIN_HOSTING,
    variables,
    fallbackSubject: 'Refund Initiated',
    fallback: () => exports.domainHostingRefundInitiatedEmail(params, partnerDetails),
    partnerId,
    logTraceId,
  });
};
