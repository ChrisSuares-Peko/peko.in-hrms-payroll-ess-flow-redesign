'use strict';

const TYPE_FULL_NAME = {
  RFQ: 'Request for Quotation',
  RFI: 'Request for Information',
  RFP: 'Request for Proposal',
};

const NODE_ENV        = process.env.NODE_ENV;
const PRODUCTION_URL  = process.env.FRONTEND_PRODUCTION_URL;
const STAGING_URL     = process.env.FRONTEND_STAGING_URL;

function getPortalBaseUrl() {
  if (NODE_ENV === 'production') return PRODUCTION_URL;
  if (NODE_ENV === 'staging')    return STAGING_URL;
  return 'http://localhost:5173';
}

function buildVendorLink(token) {
  const base = getPortalBaseUrl();
  return token
    ? `${base}/procure/proposals/submit/${token}`
    : `${base}/procure/proposals/submit`;
}

const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require("./sharedLayout");

const FONT = "helvetica, 'helvetica neue', arial, verdana, sans-serif";

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatAmount(val) {
  return parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Standard v2 head block shared by every 680px-card template below.
function v2HeadStyles(title) {
  return `  <head>
      <title>${title}</title>
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
      <!--[if mso]>
      <noscript>
      <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml>
      </noscript>
      <![endif]-->
      <!--[if lte mso 11]>
      <style type="text/css">
        .mj-outlook-group-fix { width:100% !important; }
      </style>
      <![endif]-->

      <style type="text/css">
        @media only screen and (min-width:480px) {
          .mj-column-per-100 { width:100% !important; max-width: 100%; }
        }
      </style>
      <style media="screen and (min-width:480px)">
        .moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }
      </style>

      <style type="text/css">
        @media only screen and (max-width:479px) {
          table.mj-full-width-mobile { width: 100% !important; }
          td.mj-full-width-mobile { width: auto !important; }
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
          .detail-label, .detail-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
        }
      </style>

      <style type="text/css">
        .header-link { color: #000000; text-decoration: none; }
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
        .footer-text { font-size: 13px; color: #4B5563; }
        .footer-copyright { font-size: 12px; color: #4B5563; }
        .footer-download { font-size: 14px; color: #4B5563; }
      </style>
    </head>`;
}
exports.rfqInviteTemplate = ({ rfq, vendor, invite, initiator = {} }) => {
  const branding = initiator?.branding || 'Peko';
  const website = initiator?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = initiator?.logo;
  const socials = socialIconCells(initiator?.socials, { size: 24, padding: '0 16px' });

  const rfqType        = rfq.type || 'RFQ';
  const typeFullName   = TYPE_FULL_NAME[rfqType] || rfqType;
  const deadlineDate   = formatDate(rfq.submissionDeadline);
  const rawVendorName  = vendor.contactPerson || vendor.businessName || '';
  const vendorName     = rawVendorName.includes('@') ? 'Partner' : rawVendorName;
  const vendorLink     = buildVendorLink(invite && invite.vendorToken);

  const initiatorName        = initiator.name        || 'Procurement Team';
  const initiatorDesignation = initiator.designation || '';
  const buyerCompany         = initiator.companyName  || initiatorName;

  const lineItemsRows = (rfq.lineItems || []).map((item) => `
                                      <tr>
                                        <td style="padding:8px 0;border-bottom:1px solid #E5E7EB;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;">${item.description}</td>
                                        <td align="center" style="padding:8px 0;border-bottom:1px solid #E5E7EB;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;">${parseInt(item.qty, 10)}</td>
                                        <td align="right" style="padding:8px 0;border-bottom:1px solid #E5E7EB;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;">${item.unit || ''}</td>
                                      </tr>`).join('');

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
${v2HeadStyles(`${rfqType}: ${rfq.refNumber} - ${rfq.title}`)}
    <body style="word-spacing:normal;background-color:#F9FAFB;">

      <div
         aria-label="New ${typeFullName} Invitation" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr"
      >

${v2Header({ website, websiteLabel, logo, branding })}
      <!-- ===== MAIN CARD ===== -->
      <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->

      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;"
        >
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:640px;" ><![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>

                              <!-- Heading -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">New ${typeFullName} Invitation</div>
                                </td>
                              </tr>

                              <!-- Greeting -->
                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${vendorName},</div>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;"><strong>${buyerCompany}</strong> invites you to submit a <strong>${typeFullName}</strong> in response to the below request. Please find the complete details, line items, and terms below.</div>
                                </td>
                              </tr>

                              <!-- RFQ Summary -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#F9FAFB;border-radius:12px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:20px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Reference:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${rfq.refNumber}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Type:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${typeFullName}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;${rfq.submissionDeadline ? 'padding-bottom:12px;' : ''}">Title:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;${rfq.submissionDeadline ? 'padding-bottom:12px;' : ''}">${rfq.title}</td>
                                              </tr>
                                              ${rfq.submissionDeadline ? `
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Response Deadline:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#DC2626;">${deadlineDate}</td>
                                              </tr>` : ''}
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              ${lineItemsRows ? `
                              <!-- Required Items -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">Required Items</div>
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td style="padding:8px 0;border-bottom:2px solid #E5E7EB;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#000000;">Item Name</td>
                                        <td align="center" style="padding:8px 0;border-bottom:2px solid #E5E7EB;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#000000;">Qty</td>
                                        <td align="right" style="padding:8px 0;border-bottom:2px solid #E5E7EB;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#000000;">Unit</td>
                                      </tr>
                                      ${lineItemsRows}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>` : ''}

                              ${rfq.termsAndConditions ? `
                              <!-- Terms & Conditions -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">Terms &amp; Conditions</div>
                                  <div style="background-color:#F9FAFB;border-radius:8px;padding:14px 16px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">${rfq.termsAndConditions.replace(/\r?\n/g, '<br>')}</div>
                                </td>
                              </tr>` : ''}

                              ${rfq.buyerNotes ? `
                              <!-- Buyer Notes -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">Buyer Notes</div>
                                  <div style="background-color:#FFFBEB;border-left:3px solid #F59E0B;border-radius:4px;padding:12px 16px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">${rfq.buyerNotes.replace(/\r?\n/g, '<br>')}</div>
                                </td>
                              </tr>` : ''}

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Use your secure submission link below - no login required:</div>
                                </td>
                              </tr>

                              <!-- CTA button -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${rfq.submissionDeadline ? '16px' : '32px'};word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#181818" style="border-radius:12px;">
                                          <a href="${vendorLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">View ${rfqType} &amp; Submit Proposal</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              ${rfq.submissionDeadline ? `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;text-align:left;color:#6B7280;">This link is unique to your organisation and expires on <strong style="color:#000000;">${deadlineDate}</strong>. Please do not share it with third parties.</div>
                                </td>
                              </tr>` : ''}

                              <!-- Sign off -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">We look forward to receiving your proposal.<br><br>Warm regards,<br><strong>${initiatorName}</strong><br>${initiatorDesignation ? `${initiatorDesignation}<br>` : ''}${buyerCompany !== initiatorName ? `${buyerCompany}<br>` : ''}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;border-top:1px solid #E5E7EB;padding-top:12px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;text-align:left;color:#9CA3AF;">This is a system generated email. Please do not reply.</div>
                                </td>
                              </tr>

                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table><![endif]-->
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

exports.buildSubject = (rfq) => {
  const type     = rfq.type || 'RFQ';
  const deadline = rfq.submissionDeadline
    ? new Date(rfq.submissionDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : null;

  return deadline
    ? `[${type}] ${rfq.refNumber} - ${rfq.title} | Response Required by ${deadline}`
    : `[${type}] ${rfq.refNumber} - ${rfq.title}`;
};

exports.buildProposalReceivedSubject = ({ rfq, vendorName }) => {
  return `Proposal Received: ${rfq.refNumber} - ${rfq.title} | ${vendorName}`;
};

exports.proposalReceivedTemplate = ({ rfq, proposal, vendor, corporate }) => {
  const branding = corporate?.branding || 'Peko';
  const website = corporate?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = corporate?.logo;
  const socials = socialIconCells(corporate?.socials, { size: 24, padding: '0 16px' });

  const corporateName   = corporate.companyName || 'Team';
  const vendorCompany   = vendor ? (vendor.businessName || vendor.email) : (proposal.externalEmail || '-');
  const vendorContact   = vendor ? (vendor.contactPerson || '-') : '-';
  const vendorEmail     = vendor ? (vendor.email || proposal.externalEmail || '-') : (proposal.externalEmail || '-');
  const submittedAt     = proposal.submittedAt
    ? new Date(proposal.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'
    : '-';
  const quotedAmount    = proposal.totalAmount != null
    ? `₹ ${parseFloat(proposal.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '-';
  const paymentTerms    = proposal.paymentTerms || '-';
  const deliveryTerms   = proposal.deliveryTerms || '-';
  const quoteValidity   = proposal.validUntil ? formatDate(proposal.validUntil) : '-';
  const base            = getPortalBaseUrl();
  const reviewLink      = `${base}/procure/proposals/${proposal.id}?rfqId=${rfq.id}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
${v2HeadStyles(`Proposal Received: ${rfq.refNumber}`)}
    <body style="word-spacing:normal;background-color:#F9FAFB;">

      <div
         aria-label="Proposal Received" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr"
      >

${v2Header({ website, websiteLabel, logo, branding })}
      <!-- ===== MAIN CARD ===== -->
      <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->

      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;"
        >
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:640px;" ><![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>

                              <!-- Heading -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Proposal Received</div>
                                </td>
                              </tr>

                              <!-- Greeting -->
                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${corporateName},</div>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;"><strong>${vendorCompany}</strong> has submitted a proposal for the request below.</div>
                                </td>
                              </tr>

                              <!-- RFQ Summary -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#f9fafb;border-radius:8px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:16px 20px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Reference:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${rfq.refNumber}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Title:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${rfq.title}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Submitted:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${submittedAt}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Proposal Summary -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">Proposal Summary</div>
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#f9fafb;border-radius:8px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:16px 20px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Quoted amount:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${quotedAmount}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Payment terms:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${paymentTerms}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Delivery:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${deliveryTerms}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Validity:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${quoteValidity}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Review the proposal in the Peko platform:</div>
                                </td>
                              </tr>

                              <!-- CTA button -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#FF3A3A" style="border-radius:53px;">
                                          <a href="${reviewLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:53px;">Review Proposal</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Vendor contact -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;text-align:left;color:#374151;">For any clarifications, you may reach <strong>${vendorContact}</strong> directly at <a href="mailto:${vendorEmail}" style="color:#000000;text-decoration:underline;">${vendorEmail}</a>.</div>
                                </td>
                              </tr>

                              <!-- Sign off -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Warm regards,<br>Team ${branding}</div>
                                </td>
                              </tr>

                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table><![endif]-->
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

exports.buildProposalUpdatedSubject = ({ rfq, vendorName }) => {
  return `Updated Proposal: ${rfq.refNumber} - ${rfq.title} | ${vendorName}`;
};

exports.proposalUpdatedTemplate = ({ rfq, proposal, vendor, corporate, previousAmount, previousPaymentTerms }) => {
  const branding = corporate?.branding || 'Peko';
  const website = corporate?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = corporate?.logo;
  const socials = socialIconCells(corporate?.socials, { size: 24, padding: '0 16px' });

  const corporateName  = corporate.companyName || 'Team';
  const vendorCompany  = vendor ? (vendor.businessName || vendor.email) : (proposal.externalEmail || '-');
  const vendorContact  = vendor ? (vendor.contactPerson || '-') : '-';
  const vendorEmail    = vendor ? (vendor.email || proposal.externalEmail || '-') : (proposal.externalEmail || '-');
  const submittedAt    = proposal.submittedAt
    ? new Date(proposal.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'
    : '-';

  const prevAmt    = previousAmount != null ? parseFloat(previousAmount) : null;
  const newAmt     = proposal.totalAmount   != null ? parseFloat(proposal.totalAmount) : null;

  const fmtAmt = (v) => v != null
    ? `₹ ${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '-';

  let deltaHtml = '';
  if (prevAmt != null && newAmt != null && prevAmt !== 0) {
    const pct       = ((newAmt - prevAmt) / prevAmt * 100).toFixed(1);
    const direction = newAmt > prevAmt ? 'increase' : newAmt < prevAmt ? 'decrease' : 'no change';
    const color     = newAmt > prevAmt ? '#dc2626' : newAmt < prevAmt ? '#16a34a' : '#6b7280';
    deltaHtml = `<span style="font-family:${FONT};font-size:12px;color:${color};font-weight:bold">(${Math.abs(pct)}% ${direction})</span>`;
  }

  const prevPayment = previousPaymentTerms || '-';
  const newPayment  = proposal.paymentTerms || '-';
  const base        = getPortalBaseUrl();
  const reviewLink  = `${base}/procure/proposals/${proposal.id}?rfqId=${rfq.id}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
${v2HeadStyles(`Updated Proposal: ${rfq.refNumber}`)}
    <body style="word-spacing:normal;background-color:#F9FAFB;">

      <div
         aria-label="Updated Proposal" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr"
      >

${v2Header({ website, websiteLabel, logo, branding })}
      <!-- ===== MAIN CARD ===== -->
      <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->

      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;"
        >
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:640px;" ><![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>

                              <!-- Heading -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Updated Proposal</div>
                                </td>
                              </tr>

                              <!-- Greeting -->
                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${corporateName},</div>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;"><strong>${vendorCompany}</strong> has submitted a revised proposal for the request below.</div>
                                </td>
                              </tr>

                              <!-- RFQ Summary -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#f9fafb;border-radius:8px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:16px 20px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Reference:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${rfq.refNumber}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Title:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${rfq.title}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Submitted:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${submittedAt}</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- What Changed -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">What Changed</div>
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#f9fafb;border-radius:8px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:16px 20px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Previous quote:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6b7280;text-decoration:line-through;padding-bottom:10px;">${fmtAmt(prevAmt)}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Updated quote:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;font-weight:700;padding-bottom:10px;">${fmtAmt(newAmt)}${deltaHtml ? `&nbsp;${deltaHtml}` : ''}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Payment terms:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;"><span style="color:#6b7280;text-decoration:line-through;">${prevPayment}</span> &rarr; <strong>${newPayment}</strong></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Review the updated proposal in the Peko platform:</div>
                                </td>
                              </tr>

                              <!-- CTA button -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#FF3A3A" style="border-radius:53px;">
                                          <a href="${reviewLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:53px;">Review Updated Proposal</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Vendor contact -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;text-align:left;color:#374151;">For any clarifications, you may reach <strong>${vendorContact}</strong> directly at <a href="mailto:${vendorEmail}" style="color:#000000;text-decoration:underline;">${vendorEmail}</a>.</div>
                                </td>
                              </tr>

                              <!-- Sign off -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Warm regards,<br>Team ${branding}</div>
                                </td>
                              </tr>

                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table><![endif]-->
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

exports.buildPoAcknowledgedSubject = ({ po, vendorName }) => {
  return `PO Acknowledged: ${po.refNumber} | ${vendorName}`;
};

exports.poAcknowledgedTemplate = ({ po, vendor, corporate, invoice = {} }) => {
  const branding = corporate?.branding || 'Peko';
  const website = corporate?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = corporate?.logo;
  const socials = socialIconCells(corporate?.socials, { size: 24, padding: '0 16px' });

  const corporateName  = corporate.companyName || 'Team';
  const vendorCompany  = vendor ? (vendor.businessName || vendor.email) : '-';
  const vendorEmail    = vendor ? (vendor.email || '-') : '-';
  const acknowledgedAt = po.acknowledgedAt
    ? new Date(po.acknowledgedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'
    : '-';
  const base       = getPortalBaseUrl();
  const reviewLink = `${base}/procure/purchase-orders/${po.id}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
${v2HeadStyles(`PO Acknowledged: ${po.refNumber}`)}
    <body style="word-spacing:normal;background-color:#F9FAFB;">

      <div
         aria-label="PO Acknowledged" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr"
      >

${v2Header({ website, websiteLabel, logo, branding })}
      <!-- ===== MAIN CARD ===== -->
      <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->

      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;"
        >
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:640px;" ><![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>

                              <!-- Heading -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Purchase Order Acknowledged</div>
                                </td>
                              </tr>

                              <!-- Greeting -->
                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${corporateName},</div>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;"><strong>${vendorCompany}</strong> has acknowledged your Purchase Order and submitted their invoice details.</div>
                                </td>
                              </tr>

                              <!-- PO Summary -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:10px;">Purchase Order Details</div>
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#f9fafb;border-radius:8px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:16px 20px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">PO Reference:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${po.refNumber}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Vendor:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${vendorCompany}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Vendor Email:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${vendorEmail}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;${(invoice.invoiceNumber || (invoice.invoiceAmount != null && invoice.invoiceAmount !== '')) ? 'padding-bottom:10px;' : ''}">Acknowledged At:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;${(invoice.invoiceNumber || (invoice.invoiceAmount != null && invoice.invoiceAmount !== '')) ? 'padding-bottom:10px;' : ''}">${acknowledgedAt}</td>
                                              </tr>
                                              ${invoice.invoiceNumber ? `
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;${(invoice.invoiceAmount != null && invoice.invoiceAmount !== '') ? 'padding-bottom:10px;' : ''}">Invoice Number:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;font-weight:700;${(invoice.invoiceAmount != null && invoice.invoiceAmount !== '') ? 'padding-bottom:10px;' : ''}">${invoice.invoiceNumber}</td>
                                              </tr>` : ''}
                                              ${invoice.invoiceAmount != null && invoice.invoiceAmount !== '' ? `
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Invoice Amount:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;font-weight:700;">₹ ${formatAmount(invoice.invoiceAmount)}</td>
                                              </tr>` : ''}
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Review the purchase order in the Peko platform:</div>
                                </td>
                              </tr>

                              <!-- CTA button -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#FF3A3A" style="border-radius:53px;">
                                          <a href="${reviewLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:53px;">View Purchase Order</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Sign off -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Warm regards,<br>Team ${branding}</div>
                                </td>
                              </tr>

                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table><![endif]-->
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

exports.buildReminderSubject = (rfq) => {
  const daysRemaining = rfq.submissionDeadline
    ? Math.max(0, Math.ceil((new Date(rfq.submissionDeadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return daysRemaining !== null
    ? `Reminder: ${rfq.refNumber} - ${rfq.title} | Submission Closes in ${daysRemaining} Day(s)`
    : `Reminder: ${rfq.refNumber} - ${rfq.title}`;
};

exports.rfqReminderTemplate = ({ rfq, vendor, invite, initiator = {} }) => {
  const branding = initiator?.branding || 'Peko';
  const website = initiator?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = initiator?.logo;
  const socials = socialIconCells(initiator?.socials, { size: 24, padding: '0 16px' });

  const deadlineDate = rfq.submissionDeadline
    ? new Date(rfq.submissionDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '-';
  const deadlineTime = rfq.submissionDeadline
    ? new Date(rfq.submissionDeadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
    : '';
  const rawVendorName = vendor.contactPerson || vendor.businessName || '';
  const vendorName    = rawVendorName.includes('@') ? 'Partner' : rawVendorName;
  const vendorCompany = vendor.businessName  || vendor.email || '';
  const vendorLink    = buildVendorLink(invite && invite.vendorToken);

  const initiatorName        = initiator.name        || 'Procurement Team';
  const initiatorDesignation = initiator.designation || '';
  const buyerCompany         = initiator.companyName  || initiatorName;
  const buyerEmail           = initiator.email       || 'reach@peko.one';
  const buyerPhone           = initiator.phone       || '';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
${v2HeadStyles(`Reminder: ${rfq.refNumber} - ${rfq.title}`)}
    <body style="word-spacing:normal;background-color:#F9FAFB;">

      <div
         aria-label="RFQ Reminder" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr"
      >

${v2Header({ website, websiteLabel, logo, branding })}
      <!-- ===== MAIN CARD ===== -->
      <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->

      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;"
        >
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:640px;" ><![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>

                              <!-- Heading -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Submission Reminder</div>
                                </td>
                              </tr>

                              <!-- Greeting -->
                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${vendorName},</div>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">This is a friendly reminder that we have not yet received your proposal for the request below.</div>
                                </td>
                              </tr>

                              <!-- RFQ Details -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#f9fafb;border-radius:8px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:16px 20px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:10px;">Reference:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:10px;">${rfq.refNumber}</td>
                                              </tr>
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;${rfq.submissionDeadline ? 'padding-bottom:10px;' : ''}">Title:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;${rfq.submissionDeadline ? 'padding-bottom:10px;' : ''}">${rfq.title}</td>
                                              </tr>
                                              ${rfq.submissionDeadline ? `
                                              <tr>
                                                <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Deadline:</td>
                                                <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#DC2626;">${deadlineDate}${deadlineTime ? ' at ' + deadlineTime : ''}</td>
                                              </tr>` : ''}
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Body copy -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you intend to participate, please submit your proposal before the deadline using your secure link:</div>
                                </td>
                              </tr>

                              <!-- CTA button -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#181818" style="border-radius:12px;">
                                          <a href="${vendorLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Submit Now</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.5;text-align:left;color:#6B7280;">No login required - this link is unique to your organisation.</div>
                                </td>
                              </tr>

                              <!-- Disregard notice -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-style:italic;line-height:1.7;text-align:left;color:#6B7280;">If you have already submitted your proposal, please disregard this reminder.</div>
                                </td>
                              </tr>

                              <!-- Contact info -->
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#374151;padding-bottom:8px;">For any queries, please contact us at:</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6B7280;">Email: <a href="mailto:${buyerEmail}" style="font-size:14px;color:#000000;text-decoration:underline;">${buyerEmail}</a></div>
                                  ${buyerPhone ? `<div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6B7280;padding-top:4px;">Phone: <span style="font-size:14px;color:#374151;">${buyerPhone}</span></div>` : ''}
                                </td>
                              </tr>

                              <!-- Sign off -->
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Warm regards,<br><strong>${initiatorName}</strong><br>${initiatorDesignation ? `${initiatorDesignation}<br>` : ''}${buyerCompany !== initiatorName ? `${buyerCompany}<br>` : ''}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;border-top:1px solid #E5E7EB;padding-top:12px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;text-align:left;color:#9CA3AF;">This email is intended solely for <strong>${vendorCompany}</strong>. This is a system generated email. Please do not reply.</div>
                                </td>
                              </tr>

                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table><![endif]-->
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
