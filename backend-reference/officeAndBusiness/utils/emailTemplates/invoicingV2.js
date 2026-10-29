const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');

// This flow has no per-partner white-labeling today — every invoice email renders
// with this one fixed identity. If white-labeling is ever added, only this object
// needs to become a real fetchPartnerDetails() call; admin templates never change,
// since they only ever see ${headerHtml} / ${footerHtml}.
const DEFAULT_PARTNER_DETAILS = {
  website: 'https://in.peko.one',
  logo: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09',
  branding: 'Peko',
  socials: {
    twitter: 'https://x.com/PekoIndia',
    instagram: 'https://www.instagram.com/peko.india',
    linkedIn: 'https://www.linkedin.com/company/pekoindia/',
  },
};
exports.DEFAULT_PARTNER_DETAILS = DEFAULT_PARTNER_DETAILS;

// key: INVOICE_GENERATED (service: INVOICING) — v2 layout; header/footer come from the
// corporate's partner (DEFAULT_PARTNER_DETAILS when there is no partner context).
exports.generateInvoiceEmailTemplate = ({ customerName, invoiceNumber, invoiceDate, dueDate, amountDue, corporateName, corporateEmail, corporatePhone, invoiceType, currency, docLabel = 'Invoice' }, partnerDetails = DEFAULT_PARTNER_DETAILS) => {
  const currencySymbol = invoiceType === 'DOMESTIC' ? '₹' : (currency || '₹');
  const contactLine = invoiceContactLine(corporateEmail, corporatePhone);
  const bodyRows = [
    v2Row(v2Heading(`Your ${docLabel} from ${corporateName}`), 24),
    v2Row(v2Text(`Dear ${customerName},`), 20),
    v2Row(v2Text(`We hope this message finds you well. Please find your ${docLabel} details below:`), 24),
    v2Row(v2DetailTable(
      v2DetailRow(`${docLabel} Number:`, invoiceNumber) +
      v2DetailRow(`${docLabel} Date:`, invoiceDate) +
      v2DetailRow('Due Date:', dueDate) +
      v2DetailRow('Amount Due:', `${currencySymbol} ${amountDue}`, true)
    ), 28),
    v2Row(v2Text(`For your convenience, the ${docLabel} is attached as a PDF. You can review the details and make payments accordingly.`), 20),
    v2Row(v2Text(`If you have any questions or concerns regarding this ${docLabel}, please do not hesitate to contact us at ${contactLine}.`), 32),
    v2Row(v2Text(`Best regards,<br>${corporateName}`), 0),
  ].join('\n');
  return v2Shell({ title: `${docLabel} from ${corporateName}`, bodyRows, partnerDetails });
};

// "email or phone" contact text, pre-rendered so the admin template needs one placeholder.
const invoiceContactLine = (corporateEmail, corporatePhone) =>
  `${corporateEmail || 'support@peko.one'}${corporatePhone ? ' or ' + corporatePhone : ''}`;

// Admin-managed template resolution — asks emailTemplateResolver to prefer a
// published admin template over the local fallback above. The call site awaits
// this instead of calling generateInvoiceEmailTemplate directly, and builds the
// subject/attachment logic itself — this helper never sends.
exports.resolveInvoiceEmailTemplate = (args, fallbackSubject, logTraceId, partnerId = null, partnerDetails = DEFAULT_PARTNER_DETAILS) => {
  const partner = normalisePartner(partnerDetails);
  const { customerName, invoiceNumber, invoiceDate, dueDate, amountDue, corporateName, corporateEmail, corporatePhone, invoiceType, currency, docLabel = 'Invoice' } = args;
  const currencySymbol = invoiceType === 'DOMESTIC' ? '₹' : (currency || '₹');
  const variables = {
    customerName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    amountDue: `${currencySymbol} ${amountDue}`,
    corporateName,
    corporateEmail: corporateEmail || 'support@peko.one',
    corporatePhone: corporatePhone || '-',
    contactLine: invoiceContactLine(corporateEmail, corporatePhone),
    docLabel,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.INVOICE_GENERATED,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject,
    fallback: () => exports.generateInvoiceEmailTemplate(args, partnerDetails),
    partnerId,
    logTraceId,
  });
};

// Shared v2 shell: header + white card + footer. `title` is the <title>/aria label,
// `bodyRows` is the pre-built <tr>…</tr> content of the card.
const v2Shell = ({ title, bodyRows, partnerDetails }) => {
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
                            <tbody>
${bodyRows}
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

const V2_FONT = `font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;`;
const v2Row = (inner, paddingBottom = 24) => `                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  ${inner}
                                </td>
                              </tr>`;
const v2Heading = (text) => `<div class="peko-heading" style="${V2_FONT}font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>`;
const v2Text = (text) => `<div style="${V2_FONT}font-size:16px;line-height:1.6;text-align:left;color:#000000;">${text}</div>`;
const v2DetailRow = (label, value, last = false) => `<tr>
                                        <td class="order-label" width="200" valign="top" style="${V2_FONT}font-size:15px;font-weight:700;color:#000000;${last ? '' : 'padding-bottom:12px;'}">${label}</td>
                                        <td class="order-value" valign="top" style="${V2_FONT}font-size:15px;color:#000000;${last ? '' : 'padding-bottom:12px;'}">${value}</td>
                                      </tr>`;
const v2DetailTable = (rows) => `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody>${rows}</tbody></table>`;

const recurringEndLabel = (endCondition) => !endCondition || endCondition.type === 'FOREVER'
  ? 'Forever'
  : endCondition.type === 'AFTER'
    ? `After ${endCondition.runs} run(s)`
    : `On ${endCondition.date}`;

// key: RECURRING_SCHEDULE_CREATED (service: INVOICING)
exports.generateRecurringScheduleCreatedEmail = ({ startDate, frequency, endCondition }, partnerDetails) => {
  const { branding } = normalisePartner(partnerDetails);
  const bodyRows = [
    v2Row(v2SuccessBadge()),
    v2Row(v2Heading('Recurring Invoice Schedule Created')),
    v2Row(v2Text('Your recurring invoice schedule has been set up successfully.'), 28),
    v2Row(v2DetailTable(
      v2DetailRow('Start Date:', startDate)
      + v2DetailRow('Frequency:', frequency)
      + v2DetailRow('End Condition:', recurringEndLabel(endCondition))
      + v2DetailRow('Status:', 'ACTIVE', true)
    ), 28),
    v2Row(v2Text(`You can manage this schedule from your ${branding} dashboard under <strong>Invoicing &rarr; Recurring</strong>.`), 20),
    v2Row(v2Text(`Best regards,<br />The ${branding} Team`), 0),
  ].join('\n');
  return v2Shell({ title: 'Recurring Invoice Schedule Created', bodyRows, partnerDetails });
};

exports.resolveRecurringScheduleCreatedEmail = ({ startDate, frequency, endCondition }, partnerDetails, { fallbackSubject, partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    startDate: startDate || '-',
    frequency: frequency || '-',
    endCondition: recurringEndLabel(endCondition),
    status: 'ACTIVE',
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.RECURRING_SCHEDULE_CREATED,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject,
    fallback: () => exports.generateRecurringScheduleCreatedEmail({ startDate, frequency, endCondition }, partnerDetails),
    partnerId,
    logTraceId,
  });
};

// User-authored reminder body → one paragraph per line, pre-rendered as a single HTML blob.
const reminderBodyHtml = (body) => String(body ?? '').split('\n')
  .map((line) => `<p style="margin:0 0 12px;${V2_FONT}font-size:16px;line-height:1.6;color:#000000;">${line || '&nbsp;'}</p>`)
  .join('');

// key: INVOICE_GUIDELINE_REMINDER (service: INVOICING)
exports.emailTempleteInvoiceRemainder = (body, partnerData) => {
  const bodyRows = [
    v2Row(v2Heading('Invoice payment is due')),
    v2Row(reminderBodyHtml(body), 0),
  ].join('\n');
  return v2Shell({ title: 'Invoice Reminder', bodyRows, partnerDetails: partnerData });
};

exports.resolveInvoiceReminderEmail = (body, partnerData, { fallbackSubject, partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerData);
  const variables = {
    body: reminderBodyHtml(body),
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.INVOICE_GUIDELINE_REMINDER,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject,
    fallback: () => exports.emailTempleteInvoiceRemainder(body, partnerData),
    partnerId,
    logTraceId,
  });
};
