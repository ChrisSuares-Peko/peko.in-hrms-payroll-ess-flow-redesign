const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge, v2RejectBadge } = require("../emailTemplate/sharedLayout");

const extractNumber = (str) => {
  const parts = str.split(' ')
  for (let part of parts) {
    if (!isNaN(part)) {
      return parseInt(part, 10)
    }
  }
  return null
}
function calculateMonthlyPrice(totalPrice, validityYears) {
  if (validityYears <= 0) {
    return 0
  }
  return totalPrice / (validityYears * 12)
}

function formatNumber(value, decimalPlaces = 2, fallback = '0.00') {
  if (isNaN(value)) {
    return fallback
  }

  const factor = Math.pow(10, decimalPlaces)
  return (Math.floor(value * factor) / factor).toFixed(decimalPlaces)
}

exports.generateSubscriptionSuccessEmail = (name, transactionId, amount, planData, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const price = parseFloat(planData.price);
  const validityYears = extractNumber(planData.validity);
  const monthlyPrice = calculateMonthlyPrice(price, validityYears);
  const formattedPrice = formatNumber(monthlyPrice);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Purchase successful!</title>
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
          .plan-card-padding { padding: 16px !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Purchase successful!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Purchase successful!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We are pleased to inform you that your ${planData.software.name} purchase was successful. Your license key will be sent to your registered Email ID within the next 2 to 3 hours.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="section-heading" style="padding-bottom:16px;padding-top:24px;border-top:1px solid #E5E7EB;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Transaction Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Date &amp; Time:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Transaction ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Type of service:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Softwares</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Amount paid:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">₹ ${amount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#FDF2F2;border-radius:12px;">
                                    <tbody>
                                      <tr>
                                        <td class="plan-card-padding" style="padding:20px 24px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td colspan="2" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:14px;">${planData.software.name}</td>
                                              </tr>
                                              <tr>
                                                <td width="60" valign="top" style="padding-right:16px;">
                                                  <img src="${planData.software.image}" alt="${planData.software.name}" width="48" height="48" style="display:block;border:0;border-radius:8px;">
                                                </td>
                                                <td valign="top">
                                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                                    <tbody>
                                                      <tr>
                                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.5;color:#9CA3AF;padding-bottom:2px;">Current payment plan:</td>
                                                      </tr>
                                                      <tr>
                                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;font-weight:700;color:#000000;padding-bottom:10px;">₹ ${formattedPrice}/monthly</td>
                                                      </tr>
                                                      <tr>
                                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.5;color:#9CA3AF;padding-bottom:2px;">Plan:</td>
                                                      </tr>
                                                      <tr>
                                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.5;font-weight:700;color:#000000;">${planData.name}</td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for choosing ${branding}. We appreciate your trust in us. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>Team ${branding}</div>
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

exports.commonFailedTemplate = (name, serviceName, url, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const retryUrl = url || `${templateDetails?.baseUrl}/payments`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your payment failed</title>
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
      <div aria-label="Your payment failed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2RejectBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#ee221c;">Your payment failed</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We regret to inform you that your ${serviceName} order payment on ${new Date().toLocaleString()} was unsuccessful.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#181818" style="border-radius:12px;">
                                          <a href="${retryUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Try Again</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards<br>Team ${branding}</div>
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

exports.generateSubscriptionSuccessEmailToVendor = (name, planData, orderId, customerName, emailId, contactNo, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const price = parseFloat(planData.price);
  const validityYears = extractNumber(planData.validity);
  const monthlyPrice = calculateMonthlyPrice(price, validityYears);
  const formattedPrice = formatNumber(monthlyPrice);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order placed!</title>
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
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order placed!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order placed!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">Please be informed that an order has been placed for the software mentioned below. We request you to process the order swiftly.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${orderId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Placed on:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Software name:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${planData.software.name}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Current payment plan:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">₹ ${formattedPrice}/monthly</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Customer name:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${customerName}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Email ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${emailId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Contact no:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${contactNo}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>Team ${branding}</div>
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

exports.generateSubscriptionSuccessEmailToInternals = (name, transactionId, amount, planData, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const price = parseFloat(planData.price);
  const validityYears = extractNumber(planData.validity);
  const monthlyPrice = calculateMonthlyPrice(price, validityYears);
  const formattedPrice = formatNumber(monthlyPrice);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order placed for ${planData.software.name}</title>
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
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order placed for ${planData.software.name}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order placed for ${planData.software.name}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">An order has been placed for ${planData.software.name} - ${planData.name}. Please take the necessary steps to process the order.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:20px;font-weight:700;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;">Order Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Placed on:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Software name:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${planData.software.name}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Current payment plan:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">₹ ${formattedPrice}/monthly</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Amount paid:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">₹ ${amount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>Team ${branding}</div>
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

exports.generateSubscriptionSuccessEmailV2 = () => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Purchase Successful</title>

<style>
  body {
    margin:0;
    padding:0;
    background:#ffffff;
    font-family: Arial, Helvetica, sans-serif;
  }

  .container{
    max-width:480px;
    margin:auto;
    padding:30px 20px;
  }

  .logo{
    text-align:center;
    margin-bottom:30px;
  }

  .logo img{
    width:220px;
  }

  .title{
    font-size:28px;
    font-weight:700;
    text-align:center;
    margin-bottom:20px;
  }

  .content{
    font-size:15px;
    line-height:1.6;
    color:#333;
  }

  .box{
    margin-top:25px;
    padding:18px;
    background:#f6f6f6;
    border-radius:6px;
  }

  .footer{
    margin-top:30px;
    font-size:13px;
    color:#777;
    text-align:center;
  }
</style>
</head>

<body>

<div class="container">

  <div class="logo">
    <img src="https://gxphmw.stripocdn.email/content/guids/CABINET_c147c971c4de6ccc5b3a3ac239f9f66ca2825d24ce08ef9cabcd7e89dc78e8bb/images/frame_1597882534_d2c.png">
  </div>

  <div class="title">
    Purchase Successful
  </div>

  <div class="content">
    <p>Hello,</p>

    <p>
      We are pleased to inform you that your software purchase has been completed successfully.
      Your order has been confirmed and is currently being processed.
    </p>

    <p>
      The license details and further instructions will be sent to your registered email address shortly.
      Please keep an eye on your inbox.
    </p>

    <div class="box">
      <strong>Status:</strong> Payment completed successfully.<br/>
      <strong>Order:</strong> Confirmed and processing.
    </div>

    <p style="margin-top:20px;">
      If you have any questions or require assistance, feel free to contact our support team.
    </p>

    <p>
      Thank you for choosing our service.
    </p>
  </div>

  <div class="footer">
    © 2026 All rights reserved
  </div>

</div>

</body>
</html>
`;
};

exports.generateGetAssistanceEmail = ({
  productName,
  customerName,
  customerEmail,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Customer Assistance Request</title>

<style>
  body {
    margin:0;
    padding:0;
    background:#ffffff;
    font-family: Arial, Helvetica, sans-serif;
  }

  .container{
    max-width:480px;
    margin:auto;
    padding:30px 20px;
  }

  .logo{
    text-align:center;
    margin-bottom:30px;
  }

  .logo img{
    width:220px;
  }

  .title{
    font-size:26px;
    font-weight:700;
    text-align:center;
    margin-bottom:20px;
  }

  .content{
    font-size:15px;
    line-height:1.6;
    color:#333;
  }

  .box{
    margin-top:25px;
    padding:18px;
    background:#f6f6f6;
    border-radius:6px;
  }

  .label{
    font-weight:600;
  }

  .footer{
    margin-top:30px;
    font-size:13px;
    color:#777;
    text-align:center;
  }
</style>
</head>

<body>

<div class="container">

  <div class="logo">
    <img src="https://gxphmw.stripocdn.email/content/guids/CABINET_c147c971c4de6ccc5b3a3ac239f9f66ca2825d24ce08ef9cabcd7e89dc78e8bb/images/frame_1597882534_d2c.png">
  </div>

  <div class="title">
    Customer Assistance Request
  </div>

  <div class="content">
    <p>Hello Team,</p>

    <p>
      A customer has requested assistance regarding a product on the Peko platform.
      Please find the request details below.
    </p>

    <div class="box">
      <p><span class="label">Customer Name:</span> ${customerName}</p>
      <p><span class="label">Customer Email:</span> ${customerEmail}</p>
      <p><span class="label">Product:</span> ${productName}</p>
    </div>

    <p style="margin-top:20px;">
      Kindly reach out to the customer and provide the necessary assistance.
    </p>

    <p>
      Thank you.
    </p>
  </div>

  <div class="footer">
    © 2026 All rights reserved
  </div>

</div>

</body>
</html>
`;
};