const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge } = require('../emailTemplate/sharedLayout');
const { formatNumberWithLocalString } = require('../formatter');

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getNextDay(dateString) {
  let endDate = new Date(dateString);

  // endDate.setDate(endDate.getDate() + 1);

  let nextDay = endDate.toISOString().split('T')[0];

  return nextDay;
}

// Shared <head> boilerplate for the v2 680px-card templates in this file.
const V2_HEAD_STYLE = `
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
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
        .footer-text { font-size: 13px; color: #4B5563; }
        .footer-copyright { font-size: 12px; color: #4B5563; }
        .footer-download { font-size: 14px; color: #4B5563; }
      </style>`;

// Renders one label/value row of a Transaction/Subscription Details table used across the v2 emails in this file.
const detailRow = (label, value, isLast = false) => `
                                      <tr>
                                        <td class="detail-label" width="220" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;${isLast ? '' : 'padding-bottom:12px;'}">${label}</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;${isLast ? '' : 'padding-bottom:12px;'}">${value}</td>
                                      </tr>`;

// key: SUBSCRIPTION_INDIVIDUAL_SUCCESS (service: SUBSCRIPTION)
// v2 design matches AE's own migrated version (Peko-AE/gateway/utils/emailTemplates/subscription.js,
// subscriptionIndividualSuccessEmail), with AE's AED currency localized to IN's real ₹.
exports.subscriptionIndividualSuccessEmail = (name, transactionId, subscription, packageDetails, templateDetails, url) => {
  const nextDayDate = subscription?.subscriptionEndDate
    ? getNextDay(subscription.subscriptionEndDate)
    : 'N/A';

  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${packageDetails?.packageName} purchase successful</title>${V2_HEAD_STYLE}
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${packageDetails?.packageName} purchase successful" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${packageDetails?.packageName} purchase successful</div>
                                </td>
                              </tr>

                              ${templateDetails?.signUpImage ? `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <img src="${templateDetails.signUpImage}" alt="" width="100%" style="display:block;width:100%;height:auto;border-radius:12px;">
                                </td>
                              </tr>
                              ` : ''}

                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are pleased to inform you that you have successfully purchased ${packageDetails?.packageName} service. Your subscription is active now.</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>${detailRow('Service:', packageDetails?.packageName)}${detailRow('Duration:', subscription?.billingType ? capitalizeFirstLetter(subscription.billingType) : '')}${detailRow('Amount paid:', `₹ ${formatNumberWithLocalString(subscription?.subscriptionAmountPaid)}`)}${detailRow('Transaction ID:', transactionId)}${detailRow('Next billing date:', nextDayDate, true)}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              ${url ? `
                              <tr>
                                <td align="center" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <a href="${url}" target="_blank" rel="noopener" style="background-color:#235254;color:#ffffff;padding:15px 45px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${packageDetails?.packageName}</a>
                                </td>
                              </tr>
                              ` : ''}

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for choosing ${branding}. We appreciate your trust in us.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you require any assistance or have queries, please feel free to contact us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br>Team ${branding}</div>
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

// key: SUBSCRIPTION_STORAGE_PURCHASE_SUCCESS (service: SUBSCRIPTION)
// v2 design matches AE's own migrated version (Peko-AE/gateway/utils/emailTemplates/subscription.js,
// storagePurchaseSuccess). IN's product name for this addon is "Peko Cloud" (kept as-is, not AE's "Hub").
exports.storagePurchaseSuccess = (quantity, name, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Peko Cloud - Additional storage purchased successfully</title>${V2_HEAD_STYLE}
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Peko Cloud - Additional storage purchased successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Peko Cloud - Additional storage purchased successfully</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are pleased to inform you that you have successfully purchased ${quantity} GB of additional storage in Peko Cloud.</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for choosing ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br>Team ${branding}</div>
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
}

exports.subscriptionFailedEmail = (name, transactionId, amount, planData) => {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    style="padding: 0; margin: 0">
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>Subscription Succesful</title>
  
      <link
        href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i"
        rel="stylesheet" />
     
      <style type="text/css">
        #outlook a {
          padding: 0;
        }
  
        .ExternalClass {
          width: 100%;
        }
  
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%;
        }
  
        .es-button {
          mso-style-priority: 100 !important;
          text-decoration: none !important;
          transition: all 100ms ease-in;
        }
  
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }
  
        .es-button:hover {
          background: #555555 !important;
          border-color: #555555 !important;
        }
  
        .es-desk-hidden {
          display: none;
          float: left;
          overflow: hidden;
          width: 0;
          max-height: 0;
          line-height: 0;
          mso-hide: all;
        }
  
        @media only screen and (max-width: 600px) {
          .customForMobile {
            text-align-last: start;
          }
  
          p,
          ul li,
          ol li,
          a {
            line-height: 150% !important;
          }
  
          h1,
          h2,
          h3,
          h1 a,
          h2 a,
          h3 a {
            line-height: 120% !important;
          }
  
          h1 {
            font-size: 30px !important;
            text-align: center;
          }
  
          h2 {
            font-size: 26px !important;
            text-align: left;
          }
  
          h3 {
            font-size: 20px !important;
            text-align: left;
          }
  
          h1 a {
            text-align: center;
          }
  
          .es-header-body h1 a,
          .es-content-body h1 a,
          .es-footer-body h1 a {
            font-size: 30px !important;
          }
  
          h2 a {
            text-align: left;
          }
  
          .es-header-body h2 a,
          .es-content-body h2 a,
          .es-footer-body h2 a {
            font-size: 20px !important;
          }
  
          h3 a {
            text-align: left;
          }
  
          .es-header-body h3 a,
          .es-content-body h3 a,
          .es-footer-body h3 a {
            font-size: 20px !important;
          }
  
          .es-menu td a {
            font-size: 16px !important;
          }
  
          .es-header-body p,
          .es-header-body ul li,
          .es-header-body ol li,
          .es-header-body a {
            font-size: 16px !important;
          }
  
          .es-content-body p,
          .es-content-body ul li,
          .es-content-body ol li,
          .es-content-body a {
            font-size: 17px !important;
          }
  
          .es-footer-body p,
          .es-footer-body ul li,
          .es-footer-body ol li,
          .es-footer-body a {
            font-size: 17px !important;
          }
  
          .es-infoblock p,
          .es-infoblock ul li,
          .es-infoblock ol li,
          .es-infoblock a {
            font-size: 12px !important;
          }
  
          *[class="gmail-fix"] {
            display: none !important;
          }
  
          .es-m-txt-c,
          .es-m-txt-c h1,
          .es-m-txt-c h2,
          .es-m-txt-c h3 {
            text-align: center !important;
          }
  
          .es-m-txt-r,
          .es-m-txt-r h1,
          .es-m-txt-r h2,
          .es-m-txt-r h3 {
            text-align: right !important;
          }
  
          .es-m-txt-l,
          .es-m-txt-l h1,
          .es-m-txt-l h2,
          .es-m-txt-l h3 {
            text-align: left !important;
          }
  
          .es-m-txt-r img,
          .es-m-txt-c img,
          .es-m-txt-l img {
            display: inline !important;
          }
  
          .es-button-border {
            display: inline-block !important;
          }
  
          a.es-button,
          button.es-button {
            font-size: 14px !important;
            display: inline-block !important;
            padding: 15px 25px 15px 25px !important;
          }
  
          .es-btn-fw {
            border-width: 10px 0px !important;
            text-align: center !important;
          }
  
          .es-adaptive table,
          .es-btn-fw,
          .es-btn-fw-brdr,
          .es-left,
          .es-right {
            width: 100% !important;
          }
  
          .es-content table,
          .es-header table,
          .es-footer table,
          .es-content,
          .es-footer,
          .es-header {
            width: 100% !important;
            max-width: 600px !important;
          }
  
          .es-adapt-td {
            display: block !important;
            width: 100% !important;
          }
  
          .adapt-img {
            width: 100% !important;
            height: auto !important;
          }
  
          .es-m-p0 {
            padding: 0px !important;
          }
  
          .es-m-p0r {
            padding-right: 0px !important;
          }
  
          .es-m-p0l {
            padding-left: 0px !important;
          }
  
          .es-m-p0t {
            padding-top: 0px !important;
          }
  
          .es-m-p0b {
            padding-bottom: 0 !important;
          }
  
          .es-m-p20b {
            padding-bottom: 20px !important;
          }
  
          .es-mobile-hidden,
          .es-hidden {
            display: none !important;
          }
  
          tr.es-desk-hidden,
          td.es-desk-hidden,
          table.es-desk-hidden {
            width: auto !important;
            overflow: visible !important;
            float: none !important;
            max-height: inherit !important;
            line-height: inherit !important;
          }
  
          tr.es-desk-hidden {
            display: table-row !important;
          }
  
          table.es-desk-hidden {
            display: table !important;
          }
  
          td.es-desk-menu-hidden {
            display: table-cell !important;
          }
  
          .es-menu td {
            width: 1% !important;
          }
  
          table.es-table-not-adapt,
          .esd-block-html table {
            width: auto !important;
          }
  
          table.es-social {
            display: inline-block !important;
          }
  
          table.es-social td {
            display: inline-block !important;
          }
  
          .es-desk-hidden {
            display: table-row !important;
            width: auto !important;
            overflow: visible !important;
            max-height: inherit !important;
          }
        }
      </style>
    </head>
  
    <body
      style="
        font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif;
        width: 100%;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        padding: 0;
        margin: 0;
      ">
      <div class="es-wrapper-color" style="background-color: #f1f1f1">
        <table
          class="es-wrapper"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            border-collapse: collapse;
            border-spacing: 0px;
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            background-repeat: repeat;
            background-position: center top;
            background-color: #f1f1f1;
          ">
          <tr style="border-collapse: collapse">
            <td valign="top" style="padding: 0; margin: 0">
              <table
                class="es-content"
                cellspacing="0"
                cellpadding="0"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      class="es-content-body"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #333333;
                        width: 600px;
                      "
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#333333"
                      align="center">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#020101"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-left: 20px;
                            padding-right: 35px;
                            background-color: #020101;
                            border-radius: 5px;
                          ">
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 545px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 30px;
                                          color: #fef7f7;
                                          font-size: 20px;
                                        ">
                                        <br />
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                class="es-content"
                cellspacing="0"
                cellpadding="0"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      class="es-content-body"
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#ffffff"
                      align="center"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      ">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#ffffff"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 10px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #ffffff;
                          ">
                          <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 520px">
                                <table
                                  width="100%"
                                  cellspacing="0"
                                  cellpadding="0"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      class="es-m-txt-c"
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-bottom: 15px;
                                        padding-top: 20px;
                                      ">
                                      <h2
                                        style="
                                          margin: 0;
                                          line-height: 26px;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          font-size: 22px;
                                          font-style: normal;
                                          font-weight: bold;
                                          color: #0a9f43;
                                        ">
                                        Subscription is Purchased
                                      </h2>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-bottom: 10px;
                                      ">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        <br />
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Hi ${name},
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        <br />We are delighted to inform you that
                                        your recent payment of ${amount} for your
                                        ${planData.software.name} -
                                        ${planData.name} subscription has been
                                        successfully processed. Your subscription
                                        ${planData.software.name} -
                                        ${planData.name} is now active.
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        <br />
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Wishing you a rewarding and enjoyable
                                        experience with our service. If you have
                                        any questions or need assistance, please
                                        don't hesitate to contact us at
                                        reach@peko.one
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        <br />
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Best Regards,
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Peko
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        <br />
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#ffffff"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      ">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#efefef"
                          style="
                            margin: 0;
                            padding-top: 10px;
                            padding-bottom: 10px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #efefef;
                          ">
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 27px;
                                          color: #333333;
                                          font-size: 18px;
                                        ">
                                        <strong>Transaction Details</strong>
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                class="customForMobile"
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#ffffff"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      ">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 15px;
                            padding-left: 40px;
                            padding-right: 40px;
                          ">
                          <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-left"
                            align="left"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: left;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                class="es-m-p20b"
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="right"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Date &amp; Time
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-right"
                            align="right"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: right;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 5px;
                            padding-left: 40px;
                            padding-right: 40px;
                          ">
                          <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-left"
                            align="left"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: left;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                class="es-m-p20b"
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="right"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Transaction ID:
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-right"
                            align="right"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: right;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        ${transactionId}
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 5px;
                            padding-left: 40px;
                            padding-right: 40px;
                          ">
                          <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-left"
                            align="left"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: left;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                class="es-m-p20b"
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="right"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Service :
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-right"
                            align="right"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: right;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Subscriptions
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            margin: 0;
                            padding-top: 5px;
                            padding-bottom: 30px;
                            padding-left: 40px;
                            padding-right: 40px;
                          ">
                          <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-left"
                            align="left"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: left;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                class="es-m-p20b"
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="right"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Amount Paid
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-right"
                            align="right"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: right;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        ₹ ${amount}
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#ffffff"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      ">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            margin: 0;
                            padding-top: 5px;
                            padding-bottom: 15px;
                            padding-left: 40px;
                            padding-right: 40px;
                          ">
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 27px;
                                          color: #464646;
                                          font-size: 18px;
                                        ">
                                        <strong>${planData.software.name}</strong>
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-content"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      bgcolor="#ffffff"
                      class="es-content-body"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                        display: flex;
                      ">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            margin: 0;
                            padding-top: 5px;
                            padding-bottom: 15px;
                            padding-left: 40px;
                            padding-right: 40px;
                          ">
                          <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-left"
                            align="left"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: left;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                class="es-m-p20b"
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      ">
                                      <img
                                        class="adapt-img"
                                        src="${planData.software.image}"
                                        alt
                                        style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        "
                                        height="111"
                                        width="110" />
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            class="es-right"
                            align="right"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                              float: right;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                align="left"
                                style="padding: 0; margin: 0; width: 250px">
                                <table
                                  cellpadding="0"
                                  cellspacing="0"
                                  width="100%"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Current payment plan:
                                        <strong
                                          >₹ ${parseInt(planData.price /
    planData.validity)}/mo</strong
                                        >
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                        ">
                                        Licences: <strong>1 Licence</strong>
                                        <br />
                                        Licence Key:
                                        <strong
                                          >Your serial key will be emailed to the
                                          registered email id in 2-3 hours</strong
                                        >
                                        <!-- <br>Billing Cycle:
                                      <strong>Yearly</strong> -->
                                        <br />Company : <strong>${name}</strong>
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #555555;
                                          font-size: 15px;
                                          display: none;
                                        ">
                                        <br />
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <!--[if mso]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                cellpadding="0"
                cellspacing="0"
                class="es-footer"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                  background-color: transparent;
                  background-repeat: repeat;
                  background-position: center top;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      class="es-footer-body"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      "
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#ffffff"
                      align="center">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#ffffff"
                          style="
                            padding: 40px;
                            margin: 0;
                            background-color: #ffffff;
                          ">
                          <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 520px">
                                <table
                                  width="100%"
                                  cellspacing="0"
                                  cellpadding="0"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      ">
                                      <a
                                        target="_blank"
                                        href="https://peko.one/in"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #666666;
                                          font-size: 12px;
                                        "
                                        ><img
                                          class="adapt-img"
                                          src="https://gxphmw.stripocdn.email/content/guids/CABINET_0c3e226962d6092460427f83432b00f1cae42a8ee3ec2ec8583c8c3df0e80e40/images/peko.png"
                                          alt
                                          style="
                                            display: block;
                                            border: 0;
                                            outline: none;
                                            text-decoration: none;
                                            -ms-interpolation-mode: bicubic;
                                          "
                                          width="110"
                                          height="35"
                                      /></a>
                                    </td>
                                  </tr>
  
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-top: 10px;
                                        padding-bottom: 10px;
                                      ">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 18px;
                                          color: #666666;
                                          font-size: 12px;
                                        ">
                                        This email was sent to you from company
                                        email address
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-bottom: 10px;
                                      ">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 18px;
                                          color: #666666;
                                          font-size: 12px;
                                        ">
                                        <a
                                          href="https://peko.one/in/privacy-policy/"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "
                                          >Privacy Policy</a
                                        >&nbsp;|&nbsp;<a
                                          href="https://peko.one/in/cookie-policy/"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "
                                          >Cookie Policy</a
                                        >&nbsp;|&nbsp;&nbsp;<a
                                          href="https://peko.one/in/platform-agreement"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "
                                          >Terms of Use</a
                                        >&nbsp;|&nbsp;&nbsp;<a
                                          href="https://peko.one/in/refund-policy"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "
                                          >Refund & Cancellation Policy</a
                                        ><a
                                          target="_blank"
                                          class="unsubscribe"
                                          href=""
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "></a>
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 18px;
                                          color: #666666;
                                          font-size: 12px;
                                        ">
                                        © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All
                                        Rights Reserved
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table
                class="es-content"
                cellspacing="0"
                cellpadding="0"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                ">
                <tr style="border-collapse: collapse">
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      class="es-content-body"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #292828;
                        width: 600px;
                      "
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#292828"
                      align="center">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#0c0c0c"
                          style="
                            margin: 0;
                            padding-top: 15px;
                            padding-bottom: 20px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #0c0c0c;
                          ">
                          <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            ">
                            <tr style="border-collapse: collapse">
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 520px">
                                <table
                                  width="100%"
                                  cellspacing="0"
                                  cellpadding="0"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  ">
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0">
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #ffffff;
                                          font-size: 15px;
                                        ">
                                        <a
                                          href="https://peko.one/in"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: none;
                                            color: #ffffff;
                                            font-size: 15px;
                                          "
                                          target="_blank"
                                          >www.peko.one</a
                                        >
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 23px;
                                          color: #ffffff;
                                          font-size: 15px;
                                        ">
                                        <br />
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0; font-size: 0">
                                      <table
                                        class="es-table-not-adapt es-social"
                                        cellspacing="0"
                                        cellpadding="0"
                                        role="presentation"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        ">
                                        <tr style="border-collapse: collapse">
                                          <td
                                            valign="top"
                                            align="center"
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              padding-right: 10px;
                                            ">
                                            <a
                                              target="_blank"
                                              href="https://x.com/PekoIndia"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #26a4d3;
                                                font-size: 15px;
                                              "
                                              ><img
                                                title="Twitter"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                                alt="Tw"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
                                          </td>
                                          <td
                                            valign="top"
                                            align="center"
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              padding-right: 10px;
                                            ">
                                            <a
                                              target="_blank"
                                              href="https://www.instagram.com/peko.india"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #26a4d3;
                                                font-size: 15px;
                                              "
                                              ><img
                                                title="Instagram"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                                alt="Inst"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
                                          </td>
                                          <td
                                            valign="top"
                                            align="center"
                                            style="padding: 0; margin: 0">
                                            <a
                                              target="_blank"
                                              href="https://www.linkedin.com/company/pekoindia/"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #26a4d3;
                                                font-size: 15px;
                                              "
                                              ><img
                                                title="Linkedin"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                                alt="In"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
    `;
};

// key: SUBSCRIPTION_PEKO_PLUS_SUCCESS (service: SUBSCRIPTION)
// v2 design matches AE's own migrated version (Peko-AE/gateway/utils/emailTemplates/subscription.js,
// subscriptionPekoPlusSuccessEmail), with AE's AED currency localized to IN's real Rupee. IN's own
// packageName parameterization (defaults 'Peko+') is kept in place of AE's hardcoded Peko+ strings.
exports.subscriptionPekoPlusSuccessEmail = (name, transactionId, subscription, templateDetails, packageName) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  const featureRow = (title, description) => `
                                      <tr>
                                        <td style="padding-top:16px;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:4px;">${title}</div>
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;color:#000000;">${description}</div>
                                        </td>
                                      </tr>`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${packageName} Plan purchase successful</title>${V2_HEAD_STYLE}
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${packageName} Plan purchase successful" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${packageName} Plan purchase successful</div>
                                </td>
                              </tr>

                              ${templateDetails?.signUpImage ? `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <img src="${templateDetails.signUpImage}" alt="" width="100%" style="display:block;width:100%;height:auto;border-radius:12px;">
                                </td>
                              </tr>
                              ` : ''}

                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are pleased to inform you that your ${packageName} Plan purchase was successful. Your subscription is active now.</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="section-heading" style="font-size:0px;padding-bottom:16px;padding-top:24px;border-top:1px solid #E5E7EB;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Subscription details</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>${detailRow('Package:', packageName)}${detailRow('Duration:', subscription?.billingType ? capitalizeFirstLetter(subscription.billingType) : '')}${detailRow('Amount paid:', `₹ ${formatNumberWithLocalString(subscription?.subscriptionAmountPaid)}`)}${detailRow('Transaction ID:', transactionId)}${detailRow('Next billing date:', subscription?.subscriptionEndDate ? getNextDay(subscription.subscriptionEndDate) : '', true)}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:8px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#000000;">${packageName} Plan includes:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">3 premium services in addition to 12 standard services you are already using under the Basic Plan.</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:8px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#000000;">Explore Premium Services</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>${featureRow('"Payroll"', 'Streamline payroll process, enable centralized employee management, and save time and effort.')}${featureRow('"Invoicing"', 'Create, upload, and track invoices with ease. Use payment links and get paid faster.')}${featureRow('"Hub"', 'Store files securely, collaborate in real-time, boost efficiency and productivity.')}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.8;text-align:left;color:#000000;">
                                    &bull; Get cashback on select transactions<br>
                                    &bull; Exclusive offers on major online brands<br>
                                    &bull; Dedicated CRM<br>
                                    &bull; Early access to new features
                                  </div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Bring all your business operations under one single platform, boost efficiency, and reduce operational costs.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for choosing ${branding}. We appreciate your trust in us.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best Regards,<br>Team ${branding}</div>
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
