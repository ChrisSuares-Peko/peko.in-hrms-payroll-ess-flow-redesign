const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('../emailTemplate/sharedLayout');

exports.generateInvoiceEmailTemplate = ({ customerName, invoiceNumber, invoiceDate, dueDate, amountDue, corporateName, corporateEmail, invoiceType, currency, docLabel = 'Invoice', partnerDetails }) => {
  const currencySymbol = invoiceType === 'DOMESTIC' ? '₹' : (currency || '₹');
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = partnerDetails?.logo;
  const socials = socialIconCells(partnerDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your ${docLabel} from ${corporateName}</title>
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
      <div aria-label="Your ${docLabel} from ${corporateName}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${v2Header({ website, websiteLabel, logo, branding })}
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
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your ${docLabel} from ${corporateName}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${customerName || 'Customer'},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">We hope this message finds you well. Please find your ${docLabel.toLowerCase()} details below:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#000000;">${docLabel} Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">${docLabel} Number:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${invoiceNumber}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">${docLabel} Date:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${invoiceDate}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Due Date:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${dueDate}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Amount Due:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${currencySymbol} ${amountDue}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">For your convenience, the ${docLabel.toLowerCase()} is attached as a PDF. You can review the details and make payments accordingly.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">If you have any questions or concerns regarding this ${docLabel.toLowerCase()}, please do not hesitate to contact us at ${corporateEmail || 'reach@peko.one'}.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">Best regards,<br>${corporateName}</div>
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
