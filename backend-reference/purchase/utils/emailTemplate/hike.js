const { formatNumberWithLocalString } = require('../formatter');
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge } = require('../emailTemplate/sharedLayout');

exports.generateHikePurchaseSuccessEmail = (
  name,
  transactionId,
  amount,
  surcharge,
  selectedHikes,
  templateDetails
) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  const itemRows = (selectedHikes || []).map((hike) => `
                                <tr>
                                  <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 0;border-bottom:1px solid #E5E7EB;">${hike.hikeName}</td>
                                  <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 0;border-bottom:1px solid #E5E7EB;">${hike.quantity}</td>
                                  <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 0;border-bottom:1px solid #E5E7EB;">₹ ${formatNumberWithLocalString(hike.totalPrice)}</td>
                                </tr>`).join('');

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order placed successfully</title>
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
      <div aria-label="Order placed successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order placed successfully</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We are pleased to inform you that your hike order has been placed successfully. To view your order, please visit the Hike section on ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:16px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Placed on:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${new Date().toLocaleString()}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <thead>
                                      <tr>
                                        <th align="left" style="padding:8px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Hike</th>
                                        <th align="center" style="padding:8px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Qty</th>
                                        <th align="right" style="padding:8px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>${itemRows}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#555555;padding:4px 0;">Subtotal (${(selectedHikes || []).length} ${(selectedHikes || []).length > 1 ? 'items' : 'item'}):</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#555555;padding:4px 0;">₹ ${formatNumberWithLocalString(amount)}</td>
                                      </tr>
                                      <tr>
                                        <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#555555;padding:4px 0;">Platform Fee:</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#555555;padding:4px 0;">₹ ${formatNumberWithLocalString(surcharge)}</td>
                                      </tr>
                                      <tr>
                                        <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:10px 0 0;border-top:1px solid #E5E7EB;">Order Total:</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:10px 0 0;border-top:1px solid #E5E7EB;">₹ ${formatNumberWithLocalString(Number(amount) + Number(surcharge))}</td>
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
