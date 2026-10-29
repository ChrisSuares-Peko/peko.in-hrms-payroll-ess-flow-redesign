/* eslint-disable no-irregular-whitespace */
const { socialIconCells, v2Header, v2Footer, websiteLabel, v2SuccessBadge, v2RejectBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');

const getServiceUrl = () => {
    if (process.env.NODE_ENV === 'staging') {
        return process.env.FRONTEND_STAGING_URL || 'https://uatin.pekoapp.com';
    }
    return process.env.FRONTEND_PRODUCTION_URL || 'https://in.peko.one';
};

const FONT = `'Segoe UI','Helvetica Neue',Arial,sans-serif`;

const STATUS_CONFIG = {
    pending:      { label: 'Pending',      color: '#d97706' },
    approved:     { label: 'Approved',     color: '#16a34a' },
    rejected:     { label: 'Rejected',     color: '#dc2626' },
    reopened:     { label: 'Reopened',     color: '#d97706' },
    under_review: { label: 'Under Review', color: '#d97706' },
};
const statusMeta = (status) => STATUS_CONFIG[status] || { label: status, color: '#4B5563' };

const STATUS_MESSAGES = {
    approved:     (title, type) => `Your <strong>${title}</strong> (${type}) compliance application has been <strong>approved</strong>. No further action is required at this time.`,
    rejected:     (title, type) => `Your <strong>${title}</strong> (${type}) compliance application has been <strong>rejected</strong>. Please review the remarks below and re-submit with the required corrections.`,
    reopened:     (title, type) => `Your <strong>${title}</strong> (${type}) compliance application has been <strong>reopened</strong>. Please review any remarks below and re-submit updated documents or information.`,
    under_review: (title, type) => `Your <strong>${title}</strong> (${type}) compliance application is currently <strong>under review</strong> by our team. We will notify you once a decision has been made.`,
};
const statusMessage = (status, title, type) => (STATUS_MESSAGES[status]
    ? STATUS_MESSAGES[status](title, type)
    : `Your <strong>${title}</strong> (${type}) compliance application status has been updated to <strong>${statusMeta(status).label}</strong>.`);

const formatRemarks = (remarks) => {
    if (!remarks) return '';
    try { return String(remarks).replace(/\n/g, '<br>'); } catch (e) { return ''; }
};

const detailRow = (label, value, valueStyle = '') => `
                                              <tr>
                                                <td align="left" style="font-family:${FONT};font-size:14px;color:#4B5563;padding:8px 0;width:40%;vertical-align:top;">${label}</td>
                                                <td align="left" style="font-family:${FONT};font-size:15px;font-weight:600;color:#000000;padding:8px 0;vertical-align:top;${valueStyle}">${value}</td>
                                              </tr>`;

const detailsBox = (rowsHtml) => `
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;border:1px solid #E5E7EB;border-radius:12px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:16px 24px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td colspan="2" align="left" style="font-family:${FONT};font-size:14px;font-weight:700;color:#000000;padding-bottom:8px;">APPLICATION DETAILS</td>
                                              </tr>${rowsHtml}
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>`;

const paragraph = (html, paddingBottom = 24) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>
                                </td>
                              </tr>`;

// Shared v2 shell for every compliance email; only the card body differs.
const buildComplianceEmail = ({ pageTitle, heading, badgeHtml, name, introHtml, rowsHtml, noteHtml, ctaLabel, ctaUrl, partnerDetails }) => {
    const branding = partnerDetails?.branding || 'Peko';
    const website = partnerDetails?.website || partnerDetails?.baseUrl || 'https://in.peko.one';
    const logo = partnerDetails?.logo;
    const { socials } = normalisePartner(partnerDetails);
    const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
    const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });

    const badgeRow = badgeHtml ? `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${badgeHtml}
                                </td>
                              </tr>` : '';

    return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${pageTitle}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 26px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${pageTitle}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                            <tbody>${badgeRow}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${heading}</div>
                                </td>
                              </tr>${paragraph(`Dear ${name},`, 20)}${paragraph(introHtml, 28)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">${detailsBox(rowsHtml)}
                                </td>
                              </tr>${paragraph(noteHtml, 24)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <a href="${ctaUrl}" target="_blank" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:16px 32px;border-radius:10px;">${ctaLabel}</a>
                                </td>
                              </tr>${paragraph(`Thank you for choosing ${branding}. If you have any queries, reach us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.`, 16)}
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

${footer}

      </div>
    </body>
  </html>`;
};

// key: COMPLIANCE_APPLICATION_RECEIVED (service: COMPLIANCE)
exports.complianceApplicationCreatedEmail = (name, complianceId, complianceType, title, partnerDetails) => {
    const { label, color } = statusMeta('pending');
    return buildComplianceEmail({
        pageTitle: 'Compliance Application Received',
        heading: 'Application Received',
        name,
        introHtml: `We have successfully received your compliance application for <strong>${title}</strong> (${complianceType}). Please proceed to upload the required documents to begin the filing process.`,
        rowsHtml: detailRow('Application ID', complianceId)
            + detailRow('Compliance Type', complianceType)
            + detailRow('Status', label, `color:${color};`),
        noteHtml: 'Please log in to your account and upload the required documents to proceed with your compliance filing.',
        ctaLabel: 'Upload Documents',
        ctaUrl: `${getServiceUrl()}/compliance`,
        partnerDetails,
    });
};

// key: COMPLIANCE_DOCUMENTS_SUBMITTED (service: COMPLIANCE)
exports.complianceDocumentsSubmittedEmail = (name, complianceId, complianceType, title, partnerDetails) => {
    const { label, color } = statusMeta('under_review');
    return buildComplianceEmail({
        pageTitle: 'Compliance Documents Submitted',
        heading: 'Documents Received',
        name,
        introHtml: `We have successfully received your documents for the <strong>${title}</strong> (${complianceType}) compliance filing. Your application is now under review by our team.`,
        rowsHtml: detailRow('Application ID', complianceId)
            + detailRow('Compliance Type', complianceType)
            + detailRow('Status', label, `color:${color};`),
        noteHtml: 'You will be notified once there is an update on your application. No further action is required at this time.',
        ctaLabel: 'View Application',
        ctaUrl: `${getServiceUrl()}/compliance`,
        partnerDetails,
    });
};

// key: COMPLIANCE_STATUS_UPDATE (service: COMPLIANCE)
exports.complianceStatusUpdateEmail = (name, complianceId, complianceType, title, adminStatus, remarks, partnerDetails) => {
    const { label, color } = statusMeta(adminStatus);
    const remarksHtml = formatRemarks(remarks);
    const badgeHtml = adminStatus === 'approved' ? v2SuccessBadge() : adminStatus === 'rejected' ? v2RejectBadge() : '';
    return buildComplianceEmail({
        pageTitle: 'Compliance Application - Status Update',
        heading: 'Compliance Application - Status Update',
        badgeHtml,
        name,
        introHtml: statusMessage(adminStatus, title, complianceType),
        rowsHtml: detailRow('Application ID', complianceId)
            + detailRow('Compliance Type', complianceType)
            + detailRow('Status', label, `color:${color};`)
            + (remarksHtml ? detailRow('Remarks', remarksHtml, 'font-weight:400;') : ''),
        noteHtml: 'You can review the latest status of your application at any time from the Compliance section of your account.',
        ctaLabel: 'View Application',
        ctaUrl: `${getServiceUrl()}/compliance`,
        partnerDetails,
    });
};

// ---------------------------------------------------------------------------
// Admin-managed template resolution
// ---------------------------------------------------------------------------
const baseVariables = ({ name, complianceId, complianceType, title, partner }) => ({
    name,
    complianceId,
    complianceType,
    title,
    actionUrl: `${getServiceUrl()}/compliance`,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
});

exports.resolveComplianceApplicationCreatedEmail = ({ name, complianceId, complianceType, title, partnerDetails, partnerId = null, logTraceId = null, fallbackSubject }) => {
    const partner = normalisePartner(partnerDetails);
    return resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.COMPLIANCE_APPLICATION_RECEIVED,
        service: EMAIL_TEMPLATE_SERVICES.COMPLIANCE,
        variables: {
            ...baseVariables({ name, complianceId, complianceType, title, partner }),
            status: 'pending',
            statusLabel: statusMeta('pending').label,
        },
        fallbackSubject: fallbackSubject || `Compliance Application Received - ${complianceType}`,
        fallback: () => exports.complianceApplicationCreatedEmail(name, complianceId, complianceType, title, partnerDetails),
        partnerId,
        logTraceId,
    });
};

exports.resolveComplianceDocumentsSubmittedEmail = ({ name, complianceId, complianceType, title, partnerDetails, partnerId = null, logTraceId = null, fallbackSubject }) => {
    const partner = normalisePartner(partnerDetails);
    return resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.COMPLIANCE_DOCUMENTS_SUBMITTED,
        service: EMAIL_TEMPLATE_SERVICES.COMPLIANCE,
        variables: {
            ...baseVariables({ name, complianceId, complianceType, title, partner }),
            status: 'under_review',
            statusLabel: statusMeta('under_review').label,
        },
        fallbackSubject: fallbackSubject || `Compliance Documents Submitted - ${complianceType}`,
        fallback: () => exports.complianceDocumentsSubmittedEmail(name, complianceId, complianceType, title, partnerDetails),
        partnerId,
        logTraceId,
    });
};

exports.resolveComplianceStatusUpdateEmail = ({ name, complianceId, complianceType, title, status, remarks, partnerDetails, partnerId = null, logTraceId = null, fallbackSubject }) => {
    const partner = normalisePartner(partnerDetails);
    return resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.COMPLIANCE_STATUS_UPDATE,
        service: EMAIL_TEMPLATE_SERVICES.COMPLIANCE,
        variables: {
            ...baseVariables({ name, complianceId, complianceType, title, partner }),
            status,
            statusLabel: statusMeta(status).label,
            statusMessageHtml: statusMessage(status, title, complianceType),
            remarks: formatRemarks(remarks) || '-',
        },
        fallbackSubject: fallbackSubject || `Compliance Application Update - ${complianceType}`,
        fallback: () => exports.complianceStatusUpdateEmail(name, complianceId, complianceType, title, status, remarks, partnerDetails),
        partnerId,
        logTraceId,
    });
};
