const { socialIconCells, websiteLabel, v2Header, v2Footer, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { formatIndiaEmailDateTime } = require('../formatter');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const pekoPartnerLogos = require('../../public/partnerLogos');

// Admin notice goes to Peko admins, never white-labelled — default Peko identity.
const PEKO_PARTNER_DETAILS = pekoPartnerLogos[0];

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

const textRow = (html, paddingBottom = 24) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>
                                </td>
                              </tr>`;

const headingRow = (text) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>
                                </td>
                              </tr>`;

const badgeRow = () => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>`;

const detailRow = (label, value, last = false) => `
                                      <tr>
                                        <td class="order-label" width="200" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:#000000;${last ? '' : 'padding-bottom:12px;'}">${label}</td>
                                        <td class="order-value" valign="top" style="font-family:${FONT};font-size:15px;color:#000000;${last ? '' : 'padding-bottom:12px;'}">${value}</td>
                                      </tr>`;

const detailsTable = (rowsHtml) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:20px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Transaction Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>${rowsHtml}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>`;

const supportRow = (branding) => textRow(`Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.`, 32);

const signOffRow = (branding) => textRow(`Best Regards,<br />Team ${branding}`, 0);

// v2 page shell: header, 680px #F9FAFB page, white 16px-radius card, footer.
const v2Page = ({ title, partnerDetails, bodyRowsHtml }) => {
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
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
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
        }
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
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>${bodyRowsHtml}
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

// Admin notice for the Shopify Integration add-on. Manual activation steps still to be
// confirmed by product/ops; no admin-template key yet.
exports.emailForShopifyIntegrationActivated = (corporateName) => {
  return v2Page({
    title: 'Shopify Integration add-on purchased',
    partnerDetails: PEKO_PARTNER_DETAILS,
    bodyRowsHtml: [
      headingRow('Shopify Integration add-on purchased'),
      textRow('Dear Admin,', 20),
      textRow(`We are pleased to inform you that ${corporateName} has successfully purchased the Shopify Integration add-on for their WhatsApp for Business account.`),
      textRow(`Please coordinate with the team to activate the Shopify Integration for ${corporateName}'s account.`, 32),
      signOffRow('Peko'),
    ].join(''),
  });
};

const rupee = (value) => (Number.isFinite(Number(value)) ? `₹ ${Number(value).toFixed(2)}` : '-');

// key: WABA_PROFILE_UPDATED (service: WHATSAPP)
exports.emailForWabaUpdated = (body, name, PlanActivatedOn, partnerDetails) => {
  const { branding } = normalisePartner(partnerDetails);
  return v2Page({
    title: 'WhatsApp Business Account profile updated',
    partnerDetails,
    bodyRowsHtml: [
      badgeRow(),
      headingRow('WhatsApp Business Account profile updated'),
      textRow(`Dear ${name},`, 20),
      textRow('We are pleased to inform you that your WhatsApp Business Account profile has been updated successfully.'),
      supportRow(branding),
      signOffRow(branding),
    ].join(''),
  });
};

// key: BOT_BUILDER_ADDON_ADMIN_NOTICE (service: WHATSAPP)
exports.emailForBotActivated = (corporateName) => {
  return v2Page({
    title: 'Bot Builder add-on purchased',
    partnerDetails: PEKO_PARTNER_DETAILS,
    bodyRowsHtml: [
      headingRow('Bot Builder add-on purchased'),
      textRow('Dear Admin,', 20),
      textRow(`We are pleased to inform you that ${corporateName} has successfully purchased the Bot Builder add-on for their WhatsApp for Business account.`),
      textRow(`To activate the add-on for ${corporateName}, please follow the steps below:`, 16),
      textRow('1. Log in to the Partner Dashboard of AiSensy - <a href="https://www.partner.aisensy.com/login" style="color:#000000;text-decoration:underline;">https://www.partner.aisensy.com/login</a>', 12),
      textRow('2. Navigate to <strong>Projects</strong> &gt; <strong>ADDONS MANAGEMENT</strong>.', 12),
      textRow('3. Locate the <strong>Flow Builder</strong> and toggle it to "Enable".', 32),
      signOffRow('Peko'),
    ].join(''),
  });
};

// key: SHOPIFY_INTEGRATION_ADDON_ADMIN_NOTICE (service: WHATSAPP)
exports.emailForShopifyIntegrationActivated = (corporateName) => {
  return v2Page({
    title: 'Shopify Integration add-on purchased',
    partnerDetails: PEKO_PARTNER_DETAILS,
    bodyRowsHtml: [
      headingRow('Shopify Integration add-on purchased'),
      textRow('Dear Admin,', 20),
      textRow(`We are pleased to inform you that ${corporateName} has successfully purchased the Shopify Integration add-on for their WhatsApp for Business account.`),
      textRow(`To activate the add-on for ${corporateName}, please follow the steps below:`, 16),
      textRow('1. Log in to the Partner Dashboard of AiSensy - <a href="https://www.partner.aisensy.com/login" style="color:#000000;text-decoration:underline;">https://www.partner.aisensy.com/login</a>', 12),
      textRow('2. Navigate to <strong>Projects</strong> &gt; <strong>ADDONS MANAGEMENT</strong>.', 12),
      textRow('3. Locate the <strong>Shopify Integration</strong> and toggle it to "Enable".', 32),
      signOffRow('Peko'),
    ].join(''),
  });
};

// key: WHATSAPP_PAYMENT_SUCCESS (service: WHATSAPP)
exports.whatsappForBusiness = (name, transactionId, serviceName, amount, surcharge, partnerDetails) => {
  const { branding } = normalisePartner(partnerDetails);
  return v2Page({
    title: 'WCC purchase successful',
    partnerDetails,
    bodyRowsHtml: [
      badgeRow(),
      headingRow('WCC purchase successful'),
      textRow(`Dear ${name},`, 20),
      textRow('We are pleased to inform you that your WhatsApp Conversation Credits purchase was successful. Take advantage of the credits to enhance your customer engagement and grow your business.', 28),
      detailsTable([
        detailRow('Transaction ID:', transactionId),
        detailRow('Date & Time:', formatIndiaEmailDateTime()),
        detailRow('Service:', serviceName),
        detailRow('Amount paid:', `₹ ${amount}`, true),
      ].join('')),
      supportRow(branding),
      signOffRow(branding),
    ].join(''),
  });
};

// ---------------------------------------------------------------------------
// Admin-managed template resolution. Call sites await these and send the
// returned { subject, html, sender } themselves — resolve* helpers never send.
// ---------------------------------------------------------------------------

exports.resolveWhatsappForBusiness = (name, transactionId, serviceName, amount, surcharge, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name,
    transactionId,
    serviceName,
    amount: `₹ ${amount}`,
    surcharge: rupee(surcharge),
    dateTime: formatIndiaEmailDateTime(),
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.WHATSAPP_PAYMENT_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.WHATSAPP,
    variables,
    fallbackSubject: 'Payment Successful',
    fallback: () => exports.whatsappForBusiness(name, transactionId, serviceName, amount, surcharge, partnerDetails),
    partnerId,
    logTraceId,
  });
};

exports.resolveEmailForWabaUpdated = (body, name, PlanActivatedOn, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name,
    planActivatedOn: PlanActivatedOn || '-',
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.WABA_PROFILE_UPDATED,
    service: EMAIL_TEMPLATE_SERVICES.WHATSAPP,
    variables,
    fallbackSubject: 'WhatsApp Business Account profile updated',
    fallback: () => exports.emailForWabaUpdated(body, name, PlanActivatedOn, partnerDetails),
    partnerId,
    logTraceId,
  });
};

exports.resolveEmailForBotActivated = (corporateName, { logTraceId = null } = {}) => {
  const partner = normalisePartner(PEKO_PARTNER_DETAILS);
  const variables = {
    corporateName,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.BOT_BUILDER_ADDON_ADMIN_NOTICE,
    service: EMAIL_TEMPLATE_SERVICES.WHATSAPP,
    variables,
    fallbackSubject: `Bot Builder add-on purchased by ${corporateName}`,
    fallback: () => exports.emailForBotActivated(corporateName),
    partnerId: null,
    logTraceId,
  });
};

exports.resolveEmailForShopifyIntegrationActivated = (corporateName, { logTraceId = null } = {}) => {
  const partner = normalisePartner(PEKO_PARTNER_DETAILS);
  const variables = {
    corporateName,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.SHOPIFY_INTEGRATION_ADDON_ADMIN_NOTICE,
    service: EMAIL_TEMPLATE_SERVICES.WHATSAPP,
    variables,
    fallbackSubject: `Shopify Integration add-on purchased by ${corporateName}`,
    fallback: () => exports.emailForShopifyIntegrationActivated(corporateName),
    partnerId: null,
    logTraceId,
  });
};
