const { ecommerce } = require("../servicesGeneric.json");
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge, v2RejectBadge } = require('./sharedLayout');

exports.generatePaymentSuccessEmail = (name, transactionId, amount, address, products, surcharge, templateDetails) => {
  let productsArray = JSON.parse(products);

  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const officeSuppliesUrl = `${templateDetails?.baseUrl}/office-supplies`;

  const shipping = (Number(amount) >= 100 ? 0 : 15).toFixed(2);
  const platformFee = Number(surcharge || 0).toFixed(2);
  const orderTotal = (Number(amount) + Number(surcharge || 0)).toFixed(2);
  // No real ETA source for this catalog (unlike the ONDC office-supplies flow, which
  // gets its own per-seller estimate from the network) — a fixed +4 days placeholder.
  const expectedDelivery = new Date(new Date().setDate(new Date().getDate() + 4)).toLocaleDateString();

  const productRows = (productsArray || [])
    .map(
      (product) => `
                    <tr>
                      <td valign="middle" style="padding:10px 8px;border-bottom:1px solid #E5E7EB;">${product.productImage
          ? `<img src="${product.productImage}" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #E5E7EB;">`
          : `<div style="width:48px;height:48px;border-radius:8px;background-color:#F3F4F6;"></div>`
        }</td>
                      <td valign="middle" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${product.productName}</td>
                      <td valign="middle" align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${product.productQuantity}</td>
                      <td valign="middle" align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">₹ ${product.totalPrice}</td>
                    </tr>`
    )
    .join('');

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order placed successfully!</title>
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
          .product-table td { font-size: 13px !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order placed successfully!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order placed successfully!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:28px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We are pleased to inform you that your office supplies order has been placed successfully. To view your order status or make any changes, please visit the Office Supplies section on ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#ff4f4f" style="border-radius:12px;">
                                          <a href="${officeSuppliesUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Visit Office Supplies</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:16px;padding-top:24px;border-top:1px solid #E5E7EB;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;color:#000000;">Order Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Placed on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Delivery Address:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${address?.address || 'Not provided'}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Phone Number:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${address?.phoneNumber || 'Not provided'}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Expected Delivery:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${expectedDelivery}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="product-table" style="border-collapse:collapse;">
                                    <thead>
                                      <tr style="background-color:#F3F4F6;">
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Item</td>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Name</td>
                                        <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Qty</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Price</td>
                                      </tr>
                                    </thead>
                                    <tbody>${productRows}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">Shipping</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">₹ ${shipping}</td>
                                      </tr>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">Platform Fee</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">₹ ${platformFee}</td>
                                      </tr>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">Order Total</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">₹ ${orderTotal}</td>
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
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We regret to inform you that your ${serviceName} payment on ${new Date().toLocaleString()} was unsuccessful. If any amount was deducted from your account, please be assured that the refund will be processed within 7 to 10 business days.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:28px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We appreciate your understanding and patience.</div>
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
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
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
};

exports.orderCancelConfirmationTemplet = (name, orderId, date, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order Cancellation Request Confirmation</title>
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
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
        }
      </style>
      <style type="text/css">
        .header-link { color: #000000; text-decoration: none; }
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order Cancellation Request Confirmation" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order Cancellation Request Confirmation</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="greeting" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your request for order cancellation has been successfully submitted. Our team is currently reviewing the details of your order to determine its eligibility for cancellation. We strive to ensure a seamless experience for our customers, and we appreciate your patience in this process — any payment processed will be refunded in accordance with our refund policy.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${orderId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Placed on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${date}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for choosing ${branding} for your office supply needs. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Regards,<br>Team ${branding}</div>
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

exports.emailOrderCancelRejectedTemplate = (name, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order already shipped!</title>
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
      <div aria-label="Order already shipped!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order already shipped!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We cannot cancel your order because it has already been shipped. We apologize for any inconvenience this may cause.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Please be assured that any changes to the order including cancellation are possible, provided we receive the request in time.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
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

exports.emailOrderCancelTemplate = (name, orderId, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order cancelled</title>
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
      <div aria-label="Order cancelled" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order cancelled</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your office supplies order (${orderId}) has been cancelled as per your request. We understand that circumstances may change. Kindly note that we have initiated the refund process. You will receive a full refund of the payment within 7 to 10 business days.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
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

exports.orderStatusChangeTemplate = (productList, orderId, status, name, date, trackExist, trackLink, surcharge, templateDetails) => {
	let products = ''
	let subTotal = 0
	let shippingFee = ecommerce.shipping_charge // INR 15 base shipping charge
	let grandTotal = 0
	let statusHead = status.charAt(0) + status.slice(1).toLowerCase()
	let statusBody = status.toLowerCase()
	//trackExist
	//trackLink
	//date of order format //
	const dateString = new Date(date)

	const options = {
		month: 'numeric',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: true,
	}

	let orderDate = new Intl.DateTimeFormat('en-US', options).format(dateString)

	// date of delivery format //
	const currentDate = new Date(date)
	let futureDate = new Date(currentDate)
	futureDate.setDate(currentDate.getDate() + 5)

	let deliveryDate = futureDate.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	productList.forEach((data) => {
		subTotal += data.totalPrice
		let html = `
	<tr style="border-collapse:collapse">
			 <td align="left"
					 style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
					 <table cellpadding="0" cellspacing="0" width="100%" role="none"
							 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
							 <tr style="border-collapse:collapse">
									 <td align="center" valign="top"
											 style="padding:0;Margin:0;width:520px">
											 <table cellpadding="0" cellspacing="0" width="100%"
													 role="presentation"
													 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
													 <tr style="border-collapse:collapse">
															 <td align="center"
																	 style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-left:20px;font-size:0px">
																	 <table border="0" width="100%" height="100%"
																			 cellpadding="0" cellspacing="0"
																			 role="presentation"
																			 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																			 <tr style="border-collapse:collapse">
																					 <td
																							 style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px">
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
	 <tr style="border-collapse:collapse">
			 <td align="left"
					 style="padding:0;Margin:0;padding-top:5px;padding-right:10px;padding-left:40px">
					 <!--[if mso]><table style="width:550px" cellpadding="0" cellspacing="0"><tr><td style="width:178px" valign="top"><![endif]-->
					 <table class="es-left" cellspacing="0" cellpadding="0" align="left"
							 role="none"
							 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
							 <tr style="border-collapse:collapse">
									 <td class="es-m-p0r es-m-p20b" valign="top" align="center"
											 style="padding:0;Margin:0;width:178px">
											 <table width="100%" cellspacing="0" cellpadding="0"
													 role="presentation"
													 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
													 <tr style="border-collapse:collapse">
															 <td align="center"
																	 style="padding:0;Margin:0;font-size:0px"><img
																			 class="adapt-img"
																			 src="https://gxphmw.stripocdn.email/content/guids/CABINET_3bc0d9cc18b9b18b63edf6189718f5917757df89bee0d2956eec37b2f6f0184d/images/5285281154_newproducticonhdpngdownload_Pvf.png"
																			 alt
																			 style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
																			 width="100" height="105"></td>
													 </tr>
											 </table>
									 </td>
							 </tr>
					 </table>
					 <table cellspacing="0" cellpadding="0" align="right" role="none"
							 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
							 <tr style="border-collapse:collapse">
									 <td align="left" style="padding:0;Margin:0;width:352px">
											 <table width="100%" cellspacing="0" cellpadding="0"
													 role="presentation"
													 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
													 <tr style="border-collapse:collapse">
															 <td align="left"
																	 style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px">
																	 <table
																			 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%"
																			 class="cke_show_border" cellspacing="1"
																			 cellpadding="1" border="0" role="presentation">
																			 <tr style="border-collapse:collapse">
																					 <td style="padding:0;Margin:0">
																							 <p
																									 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																									 <strong
																											 class="p_name">${data.productName}</strong>
																							 </p>
																					 </td>
																					 <td style="padding:0;Margin:0;text-align:center"
																							 width="15%">
																							 <p class="p_quantity"
																									 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																									 ${data.productQuantity}</p>
																					 </td>
																					 <td style="padding:0;Margin:0;text-align:center"
																							 width="30%">
																							 <p class="p_price"
																									 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																									 INR ${data.totalPrice}</p>
																					 </td>
																			 </tr>
																	 </table>
															 </td>
													 </tr>
													 <tr style="border-collapse:collapse">
															 <td align="left" style="padding:0;Margin:0">
																	 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#999999;font-size:15px"
																			 class="p_option">INR ${parseInt(parseFloat(data.totalPrice) / parseInt(data.productQuantity))}</p>
															 </td>
													 </tr>
											 </table>
									 </td>
							 </tr>
					 </table> <!--[if mso]></td></tr></table><![endif]-->
			 </td>
	 </tr>
	`
		products += html
	})

	const convenienceFee = surcharge ? parseFloat(surcharge) : 0
	if (subTotal >= ecommerce.max_ship_applicable_amount) {
		shippingFee = 0
		grandTotal = convenienceFee + subTotal
	} else {
		grandTotal = convenienceFee + subTotal + shippingFee
	}

	return `

<!DOCTYPE html
 PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"
 style="padding:0;Margin:0">

<head>
 <meta charset="UTF-8">
 <meta content="width=device-width, initial-scale=1" name="viewport">
 <meta name="x-apple-disable-message-reformatting">
 <meta http-equiv="X-UA-Compatible" content="IE=edge">
 <meta content="telephone=no" name="format-detection">
 <title>Order ${statusHead}</title>
 <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]-->
 <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml>
<![endif]--> <!--[if !mso]><!-- -->
 <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"> <!--<![endif]-->
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

		 @media only screen and (max-width:600px) {

				 p,
				 ul li,
				 ol li,
				 a {
						 line-height: 150% !important
				 }

				 h1,
				 h2,
				 h3,
				 h1 a,
				 h2 a,
				 h3 a {
						 line-height: 120% !important
				 }

				 h1 {
						 font-size: 30px !important;
						 text-align: center
				 }

				 h2 {
						 font-size: 26px !important;
						 text-align: left
				 }

				 h3 {
						 font-size: 20px !important;
						 text-align: left
				 }

				 h1 a {
						 text-align: center
				 }

				 .es-header-body h1 a,
				 .es-content-body h1 a,
				 .es-footer-body h1 a {
						 font-size: 30px !important
				 }

				 h2 a {
						 text-align: left
				 }

				 .es-header-body h2 a,
				 .es-content-body h2 a,
				 .es-footer-body h2 a {
						 font-size: 20px !important
				 }

				 h3 a {
						 text-align: left
				 }

				 .es-header-body h3 a,
				 .es-content-body h3 a,
				 .es-footer-body h3 a {
						 font-size: 20px !important
				 }

				 .es-menu td a {
						 font-size: 16px !important
				 }

				 .es-header-body p,
				 .es-header-body ul li,
				 .es-header-body ol li,
				 .es-header-body a {
						 font-size: 16px !important
				 }

				 .es-content-body p,
				 .es-content-body ul li,
				 .es-content-body ol li,
				 .es-content-body a {
						 font-size: 17px !important
				 }

				 .es-footer-body p,
				 .es-footer-body ul li,
				 .es-footer-body ol li,
				 .es-footer-body a {
						 font-size: 17px !important
				 }

				 .es-infoblock p,
				 .es-infoblock ul li,
				 .es-infoblock ol li,
				 .es-infoblock a {
						 font-size: 12px !important
				 }

				 *[class="gmail-fix"] {
						 display: none !important
				 }

				 .es-m-txt-c,
				 .es-m-txt-c h1,
				 .es-m-txt-c h2,
				 .es-m-txt-c h3 {
						 text-align: center !important
				 }

				 .es-m-txt-r,
				 .es-m-txt-r h1,
				 .es-m-txt-r h2,
				 .es-m-txt-r h3 {
						 text-align: right !important
				 }

				 .es-m-txt-l,
				 .es-m-txt-l h1,
				 .es-m-txt-l h2,
				 .es-m-txt-l h3 {
						 text-align: left !important
				 }

				 .es-m-txt-r img,
				 .es-m-txt-c img,
				 .es-m-txt-l img {
						 display: inline !important
				 }

				 .es-button-border {
						 display: inline-block !important
				 }

				 a.es-button,
				 button.es-button {
						 font-size: 14px !important;
						 display: inline-block !important;
						 padding: 15px 25px 15px 25px !important
				 }

				 .es-btn-fw {
						 border-width: 10px 0px !important;
						 text-align: center !important
				 }

				 .es-adaptive table,
				 .es-btn-fw,
				 .es-btn-fw-brdr,
				 .es-left,
				 .es-right {
						 width: 100% !important
				 }

				 .es-content table,
				 .es-header table,
				 .es-footer table,
				 .es-content,
				 .es-footer,
				 .es-header {
						 width: 100% !important;
						 max-width: 600px !important
				 }

				 .es-adapt-td {
						 display: block !important;
						 width: 100% !important
				 }

				 .adapt-img {
						 width: 100% !important;
						 height: auto !important
				 }

				 .es-m-p0 {
						 padding: 0 !important
				 }

				 .es-m-p0r {
						 padding-right: 0 !important
				 }

				 .es-m-p0l {
						 padding-left: 0 !important
				 }

				 .es-m-p0t {
						 padding-top: 0 !important
				 }

				 .es-m-p0b {
						 padding-bottom: 0 !important
				 }

				 .es-m-p20b {
						 padding-bottom: 20px !important
				 }

				 .es-mobile-hidden,
				 .es-hidden {
						 display: none !important
				 }

				 tr.es-desk-hidden,
				 td.es-desk-hidden,
				 table.es-desk-hidden {
						 width: auto !important;
						 overflow: visible !important;
						 float: none !important;
						 max-height: inherit !important;
						 line-height: inherit !important
				 }

				 tr.es-desk-hidden {
						 display: table-row !important
				 }

				 table.es-desk-hidden {
						 display: table !important
				 }

				 td.es-desk-menu-hidden {
						 display: table-cell !important
				 }

				 .es-menu td {
						 width: 1% !important
				 }

				 table.es-table-not-adapt,
				 .esd-block-html table {
						 width: auto !important
				 }

				 table.es-social {
						 display: inline-block !important
				 }

				 table.es-social td {
						 display: inline-block !important
				 }

				 .es-desk-hidden {
						 display: table-row !important;
						 width: auto !important;
						 overflow: visible !important;
						 max-height: inherit !important
				 }

				 .es-m-p5 {
						 padding: 5px !important
				 }

				 .es-m-p5t {
						 padding-top: 5px !important
				 }

				 .es-m-p5b {
						 padding-bottom: 5px !important
				 }

				 .es-m-p5r {
						 padding-right: 5px !important
				 }

				 .es-m-p5l {
						 padding-left: 5px !important
				 }

				 .es-m-p10 {
						 padding: 10px !important
				 }

				 .es-m-p10t {
						 padding-top: 10px !important
				 }

				 .es-m-p10b {
						 padding-bottom: 10px !important
				 }

				 .es-m-p10r {
						 padding-right: 10px !important
				 }

				 .es-m-p10l {
						 padding-left: 10px !important
				 }

				 .es-m-p15 {
						 padding: 15px !important
				 }

				 .es-m-p15t {
						 padding-top: 15px !important
				 }

				 .es-m-p15b {
						 padding-bottom: 15px !important
				 }

				 .es-m-p15r {
						 padding-right: 15px !important
				 }

				 .es-m-p15l {
						 padding-left: 15px !important
				 }

				 .es-m-p20 {
						 padding: 20px !important
				 }

				 .es-m-p20t {
						 padding-top: 20px !important
				 }

				 .es-m-p20r {
						 padding-right: 20px !important
				 }

				 .es-m-p20l {
						 padding-left: 20px !important
				 }

				 .es-m-p25 {
						 padding: 25px !important
				 }

				 .es-m-p25t {
						 padding-top: 25px !important
				 }

				 .es-m-p25b {
						 padding-bottom: 25px !important
				 }

				 .es-m-p25r {
						 padding-right: 25px !important
				 }

				 .es-m-p25l {
						 padding-left: 25px !important
				 }

				 .es-m-p30 {
						 padding: 30px !important
				 }

				 .es-m-p30t {
						 padding-top: 30px !important
				 }

				 .es-m-p30b {
						 padding-bottom: 30px !important
				 }

				 .es-m-p30r {
						 padding-right: 30px !important
				 }

				 .es-m-p30l {
						 padding-left: 30px !important
				 }

				 .es-m-p35 {
						 padding: 35px !important
				 }

				 .es-m-p35t {
						 padding-top: 35px !important
				 }

				 .es-m-p35b {
						 padding-bottom: 35px !important
				 }

				 .es-m-p35r {
						 padding-right: 35px !important
				 }

				 .es-m-p35l {
						 padding-left: 35px !important
				 }

				 .es-m-p40 {
						 padding: 40px !important
				 }

				 .es-m-p40t {
						 padding-top: 40px !important
				 }

				 .es-m-p40b {
						 padding-bottom: 40px !important
				 }

				 .es-m-p40r {
						 padding-right: 40px !important
				 }

				 .es-m-p40l {
						 padding-left: 40px !important
				 }
		 }

		 @media screen and (max-width:384px) {
				 .mail-message-content {
						 width: 414px !important
				 }
		 }
 </style>
</head>

<body
 style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
 <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FEFCFC">
		 <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#fefcfc"></v:fill> </v:background><![endif]-->
		 <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
				 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FEFCFC">
				 <tr style="border-collapse:collapse">
						 <td valign="top" style="padding:0;Margin:0">
								 <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
										 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
										 <tr style="border-collapse:collapse">
												 <td align="center" style="padding:0;Margin:0">
														 <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0"
																 cellspacing="0" role="none"
																 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
																				 <table cellpadding="0" cellspacing="0" width="100%" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td align="center" valign="top"
																										 style="padding:0;Margin:0;width:520px">
																										 <table cellpadding="0" cellspacing="0" width="100%"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="left" class="es-m-txt-c"
																																 style="padding:0;Margin:0">
																																 <h1
																																		 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#060606;text-align:left">
																																		 Order ${statusHead}</h1>
																														 </td>
																												 </tr>
																												 <tr style="border-collapse:collapse">
																														 <td align="left" class="es-m-txt-c"
																																 style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#060606;font-size:16px">
																																		 Dear ${name},</p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#060606;font-size:16px">
																																		 <br>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#060606;font-size:16px">
																																		 We are pleased to inform you that your order
																																		 ${orderId} has been
																																		 ${statusBody}.

																																 </p>
																																 ${trackExist
			? `<div style="border-collapse: collapse">
																																		 <p
																																				 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#060606;font-size:16px">

																																				 To track your order, please visit the Office
																																				 Supplies section on ${templateDetails.branding}. <br><br>

																																		 </p>
																																		 <div align="center" valign="top"
																																				 style="padding: 0; margin: 0; width: 520px">
																																				 <table cellpadding="0" cellspacing="0"
																																						 width="100%" role="presentation" style="
																																						 mso-table-lspace: 0pt;
																																						 mso-table-rspace: 0pt;
																																						 border-collapse: collapse;
																																						 border-spacing: 0px;
																																						 ">
																																						 <tr style="border-collapse: collapse">
																																								 <td align="center"
																																										 style="padding: 0; margin: 0">
																																										 <span
																																												 class="msohide es-button-border"
																																												 style="
																																										 border-style: solid;
																																										 border-color: #26a4d3;
																																										 background: #010101;
																																										 border-width: 0px;
																																										 display: inline-block;
																																										 border-radius: 50px;
																																										 width: auto;
																																										 mso-hide: all;
																																								 "><a href="${trackLink}"
																																														 class="es-button"
																																														 target="_blank" style="
																																										 mso-style-priority: 100 !important;
																																										 text-decoration: none;
																																										 transition: all 100ms ease-in;
																																										 -webkit-text-size-adjust: none;
																																										 -ms-text-size-adjust: none;
																																										 mso-line-height-rule: exactly;
																																										 color: #ffffff;
																																										 font-size: 14px;
																																										 display: inline-block;
																																										 background: #010101;
																																										 border-radius: 50px;
																																										 font-family: arial, 'helvetica neue',
																																												 helvetica, sans-serif;
																																										 font-weight: bold;
																																										 font-style: normal;
																																										 line-height: 17px;
																																										 width: auto;
																																										 text-align: center;
																																										 padding: 15px 30px 15px 30px;
																																										 mso-padding-alt: 0;
																																										 mso-border-alt: 10px solid #010101;
																																										 ">Track your order</a>
																																										 </span>
																																								 </td>
																																						 </tr>
																																				 </table>
																																		 </div>
																																 </div>`
			: ''
		}
																														 </td>
																												 </tr>
																										 </table>
																								 </td>
																						 </tr>
																				 </table>
																		 </td>
																 </tr>
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="Margin:0;padding-top:15px;padding-bottom:15px;padding-left:40px;padding-right:40px">
																				 <table cellpadding="0" cellspacing="0" width="100%" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td align="center" valign="top"
																										 style="padding:0;Margin:0;width:520px">
																										 <table class="es-left" cellspacing="0" cellpadding="0"
																												 align="left" role="none"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
																												 <tr style="border-collapse:collapse">
																														 <td align="left" class="es-m-txt-c"
																																 style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <strong>ORDER DETAILS</strong>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <br>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <strong>Order ID:</strong>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 ${orderId}</p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <br>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <strong>Placed on:</strong>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 ${orderDate}</p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <br>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <strong>Estimated delivery date:</strong>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 ${deliveryDate}</p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
																																		 <br>
																																 </p>
																														 </td>
																												 </tr>
																										 </table>
																								 </td>
																						 </tr>
																				 </table>
																		 </td>
																 </tr>
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px;background-position:center center">
																				 <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:158px" valign="top"><![endif]-->
																				 <table class="es-left" cellspacing="0" cellpadding="0" align="left"
																						 role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
																						 <tr style="border-collapse:collapse">
																								 <td class="es-m-p0r es-m-p20b" valign="top" align="center"
																										 style="padding:0;Margin:0;width:158px">
																										 <table width="100%" cellspacing="0" cellpadding="0"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr class="es-mobile-hidden"
																														 style="border-collapse:collapse">
																														 <td align="left" style="padding:0;Margin:0">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#191818;font-size:15px">
																																		 <strong>ITEM</strong>
																																 </p>
																														 </td>
																												 </tr>
																										 </table>
																								 </td>
																						 </tr>
																				 </table>
																				 <!--[if mso]></td><td style="width:20px"></td><td style="width:342px" valign="top"><![endif]-->
																				 <table cellspacing="0" cellpadding="0" align="right" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td align="left" style="padding:0;Margin:0;width:342px">
																										 <table width="100%" cellspacing="0" cellpadding="0"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="left" style="padding:0;Margin:0">
																																 <table
																																		 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%"
																																		 class="cke_show_border" cellspacing="1"
																																		 cellpadding="1" border="0" role="presentation">
																																		 <tr style="border-collapse:collapse">
																																				 <td
																																						 style="padding:0;Margin:0;font-size:13px">
																																						 <p
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
																																								 <strong>&nbsp; &nbsp;
																																										 &nbsp;NAME</strong>
																																						 </p>
																																				 </td>
																																				 <td style="padding:0;Margin:0;text-align:center;font-size:13px;line-height:15px"
																																						 width="15%">
																																						 <p
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
																																								 <strong>&nbsp;
																																										 &nbsp;&nbsp;QTY</strong>
																																						 </p>
																																				 </td>
																																				 <td style="padding:0;Margin:0;text-align:center;font-size:13px;line-height:15px"
																																						 width="30%">
																																						 <p
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
																																								 <strong>&nbsp; &nbsp; &nbsp; &nbsp;
																																										 &nbsp;PRICE</strong>
																																						 </p>
																																				 </td>
																																		 </tr>
																																 </table>
																														 </td>
																												 </tr>
																										 </table>
																								 </td>
																						 </tr>
																				 </table> <!--[if mso]></td></tr></table><![endif]-->
																		 </td>
																 </tr>
																 ${products}
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
																				 <table cellpadding="0" cellspacing="0" width="100%" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td align="center" valign="top"
																										 style="padding:0;Margin:0;width:520px">
																										 <table cellpadding="0" cellspacing="0" width="100%"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="center"
																																 style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px;font-size:0px">
																																 <table border="0" width="100%" height="100%"
																																		 cellpadding="0" cellspacing="0"
																																		 role="presentation"
																																		 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																																		 <tr style="border-collapse:collapse">
																																				 <td
																																						 style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px">
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
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
																				 <table width="100%" cellspacing="0" cellpadding="0" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td valign="top" align="center"
																										 style="padding:0;Margin:0;width:520px">
																										 <table width="100%" cellspacing="0" cellpadding="0"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="right" class="es-m-txt-c"
																																 style="padding:0;Margin:0">
																																 <table
																																		 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px"
																																		 class="cke_show_border" cellspacing="1"
																																		 cellpadding="1" border="0" align="right"
																																		 role="presentation">
																																		 <tr style="border-collapse:collapse">
																																				 <td
																																						 style="padding:0;Margin:0;text-align:right;line-height:23px">
																																						 <p
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																																								 Subtotal (${productList.length}
																																								 items):
																																						 </p>
																																				 </td>
																																				 <td
																																						 style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px">
																																						 <p class="p_subtotal"
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																																								 INR ${subTotal}</p>
																																				 </td>
																																		 </tr>
																																		 <tr style="border-collapse:collapse">
																																				 <td
																																						 style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px">
																																						 <p
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#555555;font-size:18px">
																																								 <strong>Shipping:</strong>
																																						 </p>
																																				 </td>
																																				 <td
																																						 style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px;color:#008000">
																																						 <p
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																																								 <strong class="p_rate_shipping">
																																										 ${shippingFee === 0 ? 'FREE' : `INR ${shippingFee.toFixed(2)}`}
																																								 </strong>
																																						 </p>
																																				 </td>
																																		 </tr>
																																		 <tr style="border-collapse:collapse">
																																				 <td
																																						 style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px">
																																						 <p
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																																								 Platform Fee:</p>
																																				 </td>
																																				 <td
																																						 style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px">
																																						 <p class="p_tax"
																																								 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
																																								 INR ${surcharge}</p>
																																				 </td>
																																		 </tr>
																																 </table>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#38761d;font-size:15px">
																																		 <br>
																																 </p>
																														 </td>
																												 </tr>
																										 </table>
																								 </td>
																						 </tr>
																				 </table>
																		 </td>
																 </tr>
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
																				 <table cellpadding="0" cellspacing="0" width="100%" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td align="center" valign="top"
																										 style="padding:0;Margin:0;width:520px">
																										 <table cellpadding="0" cellspacing="0" width="100%"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="center"
																																 style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px;font-size:0px">
																																 <table border="0" width="100%" height="100%"
																																		 cellpadding="0" cellspacing="0"
																																		 role="presentation"
																																		 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																																		 <tr style="border-collapse:collapse">
																																				 <td
																																						 style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px">
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
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px;background-position:center top">
																				 <table cellpadding="0" cellspacing="0" width="100%" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td align="center" valign="top"
																										 style="padding:0;Margin:0;width:520px">
																										 <table cellpadding="0" cellspacing="0" width="100%"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="right" class="es-m-txt-r"
																																 style="padding:0;Margin:0;padding-left:20px">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:33px;color:#414040;font-size:22px">
																																		 <strong>Order Total: INR <span
																																						 class="p_order_total">${grandTotal}</span></strong>
																																 </p>
																														 </td>
																												 </tr>
																										 </table>
																								 </td>
																						 </tr>
																				 </table>
																		 </td>
																 </tr>
																 <tr style="border-collapse:collapse">
																		 <td align="left"
																				 style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
																				 <table cellpadding="0" cellspacing="0" width="100%" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td align="center" valign="top"
																										 style="padding:0;Margin:0;width:520px">
																										 <table cellpadding="0" cellspacing="0" width="100%"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="left" class="es-m-txt-c"
																																 style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#060606;font-size:16px">
																																		 Thank you for using ${templateDetails.branding}.
																																		 <br>
																																		 If you have any queries or need further
																																		 assistance, please reach out to us
																																		 at <a
																																				 href="mailto:reach@peko.one">reach@peko.one</a>.
																																		 We assure you of our best
																																		 services at all times.<br><br>
																																		 Best Regards,<br>
																																		 Team ${templateDetails.branding}<br>

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
								 <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none"
										 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
										 <tr style="border-collapse:collapse">
												 <td align="center" style="padding:0;Margin:0">
														 <table class="es-footer-body"
																 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px"
																 cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
																 <tr style="border-collapse:collapse">
																		 <td align="left" bgcolor="#ffffff"
																				 style="padding:40px;Margin:0;background-color:#ffffff;border-radius:5px">
																				 <table width="100%" cellspacing="0" cellpadding="0" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td valign="top" align="center"
																										 style="padding:0;Margin:0;width:520px">
																										 <table width="100%" cellspacing="0" cellpadding="0"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="center"
																																 style="padding:0;Margin:0;font-size:0px"><a
																																		 target="_blank" href="https://peko.one/in"
																																		 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
																																				 class="adapt-img"
																																				 src=${templateDetails.logo}
																																				 alt
																																				 style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
																																				 height="35"></a> </td>
																												 </tr>
																												 <tr style="border-collapse:collapse">
																														 <td align="center"
																																 style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
																																		 This email was sent to you from company email
																																		 address</p>
																														 </td>
																												 </tr>
																												 <tr style="border-collapse:collapse">
																														 <td align="center"
																																 style="padding:0;Margin:0;padding-bottom:10px">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
																																		 <a href="https://peko.one/in/privacy-policy/"
																																				 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy
																																				 Policy</a>&nbsp;|&nbsp;<a
																																				 href="https://peko.one/in/cookie-policy/"
																																				 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
																																				 Policy</a>&nbsp;|&nbsp;&nbsp;<a
																																				 href="https://peko.one/in/platform-agreement"
																																				 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
																																				 of Use</a>&nbsp;|&nbsp;&nbsp;<a
																																				 href="https://peko.one/in/refund-policy/"
																																				 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund
																																				 & Cancellation Policy</a><a target="_blank"
																																				 class="unsubscribe" href=""
																																				 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a>
																																 </p>
																														 </td>
																												 </tr>
																												 <tr style="border-collapse:collapse">
																														 <td align="center" style="padding:0;Margin:0">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
																																		 © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights
																																		 Reserved</p>
																														 </td>
																												 </tr>
																										 </table>
																								 </td>
																						 </tr>
																				 </table>
																		 </td>
																 </tr>
																 <tr style="border-collapse:collapse">
																		 <td align="left" bgcolor="#0c0c0c"
																				 style="Margin:0;padding-top:5px;padding-bottom:25px;padding-left:40px;padding-right:40px;background-color:#0c0c0c">
																				 <table width="100%" cellspacing="0" cellpadding="0" role="none"
																						 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																						 <tr style="border-collapse:collapse">
																								 <td valign="top" align="center"
																										 style="padding:0;Margin:0;width:520px">
																										 <table width="100%" cellspacing="0" cellpadding="0"
																												 role="presentation"
																												 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																												 <tr style="border-collapse:collapse">
																														 <td align="center" style="padding:0;Margin:0">
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
																																		 <br>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
																																		 <a href="https://peko.one/in"
																																				 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:12px"
																																				 target="_blank">www.peko.one</a>
																																 </p>
																																 <p
																																		 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
																																		 <br>
																																 </p>
																														 </td>
																												 </tr>
																												 <tr style="border-collapse:collapse">
																														 <td align="center"
																																 style="padding:0;Margin:0;font-size:0">
																																 <table class="es-table-not-adapt es-social"
																																		 cellspacing="0" cellpadding="0"
																																		 role="presentation"
																																		 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
																																		 <tr style="border-collapse:collapse">
																																				 <td valign="top" align="center"
																																						 style="padding:0;Margin:0;padding-right:10px">
																																						 <a target="_blank"
																																								 href="https://x.com/PekoIndia"
																																								 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
																																										 title="Twitter"
																																										 src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
																																										 alt="Tw" width="24" height="24"
																																										 style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
																																				 </td>
																																				 <td valign="top" align="center"
																																						 style="padding:0;Margin:0;padding-right:10px">
																																						 <a target="_blank"
																																								 href="https://www.instagram.com/peko.india"
																																								 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
																																										 title="Instagram"
																																										 src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
																																										 alt="Inst" width="24"
																																										 height="24"
																																										 style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
																																				 </td>
																																				 <td valign="top" align="center"
																																						 style="padding:0;Margin:0">
																																						 <a target="_blank"
																																								 href="https://www.linkedin.com/company/pekoindia/"
																																								 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
																																										 title="Linkedin"
																																										 src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
																																										 alt="In" width="24" height="24"
																																										 style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
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

`
}

exports.emailOrderReturnRejectedTemplate = (params, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const plural = params?.quantity > 1 ? 's' : '';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Returned item${plural} not accepted</title>
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
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
          .product-table td { font-size: 13px !important; }
        }
      </style>
      <style type="text/css">
        .header-link { color: #000000; text-decoration: none; }
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Returned item${plural} not accepted" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Returned item${plural} not accepted</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="greeting" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${params?.name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We regret to inform you that we are unable to accept your returned item${plural} because they do not meet our return policy guidelines. We apologize for any inconvenience this may cause.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We adhere to strict quality standards and return policies to ensure the best experience for all our customers.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;">Order Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.orderId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Placed on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${params?.placedOn}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="product-table" style="border-collapse:collapse;">
                                    <thead>
                                      <tr style="background-color:#F3F4F6;">
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Item</td>
                                        <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Qty</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Price</td>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td valign="middle" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${params?.productName}</td>
                                        <td valign="middle" align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${params?.quantity}</td>
                                        <td valign="middle" align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">₹ ${params?.totalPrice}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">Subtotal</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">₹ ${params?.totalPrice}</td>
                                      </tr>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">Shipping</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">₹ ${params?.shipping}</td>
                                      </tr>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">Order Total</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">₹ ${params?.grandTotal}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
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

exports.emailOrderReturnCompletedTemplate = (params, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const plural = params?.quantity > 1 ? 's' : '';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Returned item${plural} accepted</title>
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
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
          .product-table td { font-size: 12px !important; padding: 8px 6px !important; }
        }
      </style>
      <style type="text/css">
        .header-link { color: #000000; text-decoration: none; }
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Returned item${plural} accepted" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Returned item${plural} accepted</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="greeting" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${params?.name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We are pleased to inform you that your returned item${plural} have been inspected and accepted. We have initiated the refund process.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your refund of ₹ ${params?.grandTotal} for the returned item${plural} will be credited to the original payment method within 7 to 10 business days. Kindly note that the exact timeframe for the refund to reflect in your account may vary based on your financial institution's processing procedures.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We appreciate your understanding and patience.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;">Order Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.orderId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Placed on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.placedOn}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Pick Up Address:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.address}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Mobile number:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.mobile}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Remarks:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${params?.remarks}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="product-table" style="border-collapse:collapse;">
                                    <thead>
                                      <tr style="background-color:#F3F4F6;">
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Item</td>
                                        <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Unit Price</td>
                                        <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Qty</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Total</td>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td valign="middle" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${params?.productName}</td>
                                        <td valign="middle" align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">₹ ${params?.unitPrice}</td>
                                        <td valign="middle" align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${params?.quantity}</td>
                                        <td valign="middle" align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">₹ ${params?.totalPrice}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">Shipping &amp; handling</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">₹ ${(params?.shipping ?? 0).toFixed ? params.shipping.toFixed(2) : params?.shipping}</td>
                                      </tr>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">Order Total</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">₹ ${params?.grandTotal}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
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

exports.emailOrderReturnInitiatedTemplate = (params, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Return request is in process</title>
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
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
          .detail-label, .detail-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
          .product-table td { font-size: 12px !important; padding: 8px 6px !important; }
        }
      </style>
      <style type="text/css">
        .header-link { color: #000000; text-decoration: none; }
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Return request is in process" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" valign="middle" bgcolor="#FFF1D6" style="width:64px;height:64px;border-radius:50%;background-color:#FFF1D6;">
                                          <img alt="In process" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTUiIHN0cm9rZT0iI0Y1QTYyMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xNiA4VjE2TDIyIDIwIiBzdHJva2U9IiNGNUE2MjMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==" width="32" height="32" style="display:inline-block;vertical-align:middle;" />
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Return request is in process</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="greeting" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${params?.name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your return request has been received and is currently being processed.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your satisfaction is important to us and our team is diligently working on your request. We will update you on this shortly.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;">Order Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.orderId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Placed on:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.placedOn}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Pickup address:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.address}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Estimated pickup date:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.returnPickUpDate}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Mobile number:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${params?.mobile}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Remarks:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${params?.remarks}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" class="product-table" style="border-collapse:collapse;">
                                    <thead>
                                      <tr style="background-color:#F3F4F6;">
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Item</td>
                                        <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Unit Price</td>
                                        <td align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Qty</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;padding:10px 8px;border-bottom:1px solid #E5E7EB;">Total</td>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td valign="middle" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${params?.productName}</td>
                                        <td valign="middle" align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">₹ ${params?.unitPrice}</td>
                                        <td valign="middle" align="center" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${params?.quantity}</td>
                                        <td valign="middle" align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">₹ ${params?.totalPrice}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">Shipping</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding:4px 0;">₹ ${(params?.shipping ?? 0).toFixed ? params.shipping.toFixed(2) : params?.shipping}</td>
                                      </tr>
                                      <tr>
                                        <td style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">Order Total</td>
                                        <td align="right" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding:12px 0 0 0;border-top:1px solid #E5E7EB;">₹ ${params?.grandTotal}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
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

exports.emailOrderReturnIntiated = (name, orderId, date, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order return request received</title>
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
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
        }
      </style>
      <style type="text/css">
        .header-link { color: #000000; text-decoration: none; }
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order return request received" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order return request received</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="greeting" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your request for order return has been successfully submitted. Our team is currently reviewing the details of your order to determine its eligibility for return. We strive to ensure a seamless experience for our customers, and we appreciate your patience in this process — any payment processed will be refunded in accordance with our refund policy.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">Order ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:12px;">${orderId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Placed on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${date}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for choosing ${branding} for your office supply needs.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Regards,<br>Team ${branding}</div>
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

// ===========================================================================
// ONDC office-supplies order emails (sent from confirmOndcOrder) — matches
// Figma node 2421-31698: a transaction-summary card (Date / Transaction ID /
// Payment Mode / Delivering to / GST invoice / Order IDs) with the Peko header
// + footer. Confirmed = green state; the failed variant reuses the same shell
// in a red state (no separate Figma node).
// ===========================================================================

const _issueReason = (group) => {
    switch (group?.reason) {
        case "error":
            return group?.error?.message || "the seller reported an error";
        case "timeout":
            return "the seller didn't respond in time";
        case "confirm_failed":
            return "we couldn't reach the seller";
        case "session_expired":
            return "the checkout session expired — please try again";
        default:
            return "the order could not be confirmed";
    }
};

// The shared ONDC chrome moved to ./ondcShell.js — the 15 Office Supplies spec
// templates (./officeSuppliesNotifications.js) build on the same helpers, and a
// 9,500-line file is the wrong home for them. Aliased to the old private names so
// the four ONDC templates below are unchanged.
// These three ONDC templates are NOT in the spec document (order-failed,
// invoice-ready, return-raised are events it doesn't cover), but the buyer sees
// them in the same inbox as the 15 that are — so they use the same primitives and
// therefore the same palette, type scale and red CTA blocks.
const {
    ondcEmailShell: _ondcEmailShell,
    bodyPara: _p,
    mutedPara: _muted,
    strongPara: _strong,
    detailLine: _line,
    detailBlock: _block,
    spacer: _spacer,
    ctaRow: _ctaRow,
    signOff: _signOff,
    officeSuppliesLinks: _osLinks,
    COLORS: _C,
    FONT: _FONT,
} = require("./ondcShell");

// NOTE: `ondcOrderConfirmedTemplate` (a transaction-summary layout) used to live
// here. The mail-template spec asks for something structurally different — seller,
// delivery address, ETA and a per-seller item table — so it was replaced by
// osOrderConfirmedTemplate in ./officeSuppliesNotifications.js, which is where all
// 15 Office Supplies notification templates now live. Both of its callers
// (services/ondcCheckoutNotify.js and confirmOndcOrder) go through
// buildOrderConfirmedMail, so there is one confirmation mail, not two shapes of it.

/**
 * Failed ONDC order email (no seller could confirm) — same shell, red state.
 * @param {string} name corporate contact name
 * @param {Array} groups all group objects (each { vendorName, reason, error })
 * @param {Object} templateDetails { logo, branding, baseUrl }
 */
exports.ondcOrderFailedTemplate = (name, groups, templateDetails) => {
    const links = _osLinks(templateDetails);
    const reasons = (groups || []).map((g) => `${g.vendorName || "Seller"}: ${_issueReason(g)}`);

    const inner = [
        _p(`Hi ${name},`),
        _p("We&rsquo;re sorry &mdash; your order couldn&rsquo;t be confirmed. You haven&rsquo;t been charged for anything that didn&rsquo;t go through, and your items are still in your cart."),
        _strong("What happened:"),
        _block(reasons),
        _muted("Please try placing the order again. If it keeps failing, reach out to us and we&rsquo;ll help."),
        _spacer(6),
        // No order to track — the checkout never placed one.
        _ctaRow([{ label: "Manage Orders", href: links.manage }]),
        _spacer(10),
        _signOff(),
    ].join("");

    return _ondcEmailShell("Order not placed", templateDetails, inner);
};

/**
 * Invoice-available email (sent from the on_status handler the first time the seller
 * returns a document labelled Invoice). Same shell as the two above, in a neutral blue
 * state — this is neither a success nor a failure, just paperwork arriving.
 *
 * The invoice is LINKED, not attached: the URL is the seller's own, so the mail can
 * never fail on a PDF we couldn't fetch.
 *
 * @param {string} name corporate contact name
 * @param {Object} details { orderId, vendorName, amount, invoiceUrl, ondcOrderId }
 * @param {Object} templateDetails { logo, branding, baseUrl }
 */
// Seller-supplied values (ONDC callbacks) must not inject HTML into Peko emails
const _escHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

exports.ondcInvoiceAvailableTemplate = (name, details, templateDetails) => {
    const d = details || {};
    const links = _osLinks(templateDetails, { ondcOrderId: d.ondcOrderId });
    // Scriptable link types are never rendered; every other link is shown as before
    const rawInvoiceUrl = String(d.invoiceUrl || "").trim();
    const invoiceUrl = rawInvoiceUrl && !/^(javascript|data|vbscript):/i.test(rawInvoiceUrl)
        ? _escHtml(rawInvoiceUrl)
        : "";

    const inner = [
        _p(`Hi ${name},`),
        _p("The seller has issued the invoice for your order."),
        _block([
            _line("Order ID:", d.orderId && _escHtml(d.orderId)),
            _line("Seller:", d.vendorName && _escHtml(d.vendorName)),
            _line("Amount:", d.amount),
        ]),
        // The invoice link is the one extra CTA these three mails need, styled as
        // the accent block so it reads as part of the same family.
        invoiceUrl
            ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 4pt 0;"><tr><td style="background-color:${_C.accent};padding:7pt 14pt;text-align:center;"><a href="${invoiceUrl}" style="display:block;font-family:${_FONT};font-size:10pt;font-weight:700;color:${_C.onAccent};text-decoration:none;">Download invoice</a></td></tr></table>` +
              _muted(`If the button doesn&rsquo;t work, copy this link into your browser:<br>${invoiceUrl}`)
            : "",
        _spacer(6),
        _ctaRow([{ label: "Track Shipment", href: links.track || links.manage }]),
        _spacer(10),
        _signOff(),
    ].join("");

    return _ondcEmailShell("Your invoice is ready", templateDetails, inner);
};

/**
 * Return-raised email (sent from returnOndcOrder once the seller has confirmed the
 * /update — not when the buyer submits, which may still be rejected). Same shell as
 * the two above, in an amber "in progress" state so the three ONDC mails read
 * differently at a glance.
 *
 * Deliberately quotes no refund amount or date: the refund is a separate flow with
 * its own email, and a figure here would be a second source of truth.
 *
 * @param {string} name corporate contact name
 * @param {Object} details { orderId, returnRequestId, items:string[], reason, requestedAt:Date|string, ondcOrderId }
 * @param {Object} templateDetails { logo, branding, baseUrl }
 */
exports.ondcReturnInitiatedTemplate = (name, details, templateDetails) => {
    const d = details || {};
    const links = _osLinks(templateDetails, { ondcOrderId: d.ondcOrderId });
    const requestedStr = d.requestedAt
        ? new Date(d.requestedAt).toLocaleString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
        : "";
    const items = (d.items || []).join(", ");

    const inner = [
        _p(`Hi ${name},`),
        _p("Your return request has been raised with the seller."),
        _block([
            _line("Order ID:", d.orderId),
            _line("Return request ID:", d.returnRequestId),
            _line("Item(s):", items),
            _line("Reason:", d.reason),
            _line("Requested on:", requestedStr),
        ]),
        _muted("The seller will arrange a pickup for the items. Once the return has been picked up and completed, your refund will be processed and we&rsquo;ll email you again."),
        _spacer(6),
        _ctaRow([{ label: "Track Shipment", href: links.track || links.manage }]),
        _spacer(10),
        _signOff(),
    ].join("");

    return _ondcEmailShell("Return request raised", templateDetails, inner);
};