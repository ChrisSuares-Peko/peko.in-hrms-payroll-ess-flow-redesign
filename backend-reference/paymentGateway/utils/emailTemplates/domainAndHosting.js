const { formatNumberWithLocalString, formatIndiaEmailDateTime } = require('../formatter');

exports.domainHostingSuccessTemplate = (name, transactionId, totalAmount, provisionResults, partnerDetails) => {
    const items = Array.isArray(provisionResults) ? provisionResults : [];
    const dateStr = formatIndiaEmailDateTime();

    const itemRows = items.map(r => `
        <tr>
            <td class="column column-1"
                style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                width="50%">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                    <tr>
                        <td style="text-align:center;width:100%;">
                            <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0;">
                                <span style="word-break: break-word;">${r.itemType ? r.itemType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''}:</span>
                            </h1>
                        </td>
                    </tr>
                </table>
            </td>
            <td class="column column-2"
                style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                width="50%">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                    <tr>
                        <td style="text-align:center;width:100%;">
                            <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0;">
                                <span style="word-break: break-word;">${r.domainName || r.productName || ''}</span>
                            </h1>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <title></title>
  <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    p { line-height: inherit }
    .desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; }
    .image_block img+div { display: none; }
    @media (max-width:500px) {
      .mobile_hide { display: none; }
      .row-content { width: 100% !important; }
      .stack .column { width: 100%; display: block; }
      .mobile_hide { min-height: 0; max-height: 0; max-width: 0; overflow: hidden; font-size: 0px; }
      .desktop_hide, .desktop_hide table { display: table !important; max-height: none !important; }
    }
  </style>
</head>
<body style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation"
    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
    <tbody>
      <tr>
        <td>

          <!-- Logo header -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 5px; padding-top: 35px; vertical-align: top; text-align: center;" width="100%">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                            <tr>
                              <td align="center" style="padding: 0; font-size: 0px;">
                                <img src="${partnerDetails?.logo}" alt="${partnerDetails?.branding || ''}"
                                  style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;"
                                  width="110" height="35">
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Title -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 5px; padding-top: 5px;" width="100%">
                          <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0;">
                            <strong>Domain &amp; Hosting Purchase Successful</strong>
                          </h1>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Greeting -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 25px; padding-top: 15px;" width="100%">
                          <div style="color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                            <p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
                            <p style="margin: 0;">Your Domain &amp; Hosting purchase was successful. Please find the transaction details below.</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Transaction Details heading -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 5px; padding-top: 5px;" width="100%">
                          <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left;">
                            <strong>Transaction Details</strong>
                          </h1>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Transaction rows: Date, Txn ID, Amount, Items -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td class="column column-1"
                          style="padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                          <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: left;">
                            <span style="word-break: break-word;">Date:</span>
                          </h1>
                        </td>
                        <td class="column column-2"
                          style="padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                          <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: left;">
                            <span style="word-break: break-word;">${dateStr}</span>
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td class="column column-1"
                          style="padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                          <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: left;">
                            <span style="word-break: break-word;">Transaction ID:</span>
                          </h1>
                        </td>
                        <td class="column column-2"
                          style="padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                          <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: left;">
                            <span style="word-break: break-word;">${transactionId}</span>
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td class="column column-1"
                          style="padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                          <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: left;">
                            <span style="word-break: break-word;">Amount paid:</span>
                          </h1>
                        </td>
                        <td class="column column-2"
                          style="padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                          <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: left;">
                            <span style="word-break: break-word;">&#8377; ${formatNumberWithLocalString(totalAmount)}</span>
                          </h1>
                        </td>
                      </tr>
                      ${itemRows}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Thank you message -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 40px; padding-top: 35px;" width="100%">
                          <div style="color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                            <p style="margin: 0; margin-bottom: 17px;">Thank you for choosing ${partnerDetails?.branding}. We appreciate your trust in us.</p>
                            <p style="margin: 0;">If you have any queries or need further assistance, please reach out to us at
                              <a href="mailto:reach@peko.one" style="text-decoration: underline; color: #000000;" target="_blank">reach@peko.one</a>.
                              We assure you of our best services at all times.
                            </p>
                            <p style="margin: 0; margin-top: 16px;">Best Regards,<br>Team ${partnerDetails?.branding}</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Footer: logo -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 15px; padding-top: 25px;" width="100%">
                          <div align="center" style="line-height: 10px;">
                            <div style="max-width: 144px; margin: 0 auto;">
                              <img src="${partnerDetails?.logo}" alt="${partnerDetails?.branding || ''}"
                                style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;"
                                width="110" height="35">
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Footer: copyright and links -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
              <tr>
                <td>
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; color: #000000; width: 480px; margin: 0 auto;"
                    width="480">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 30px; padding-top: 5px;" width="100%">
                          <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: center;">
                            <span style="word-break: break-word;">© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</span>
                          </h1>
                          <h1 style="margin: 8px 0 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; line-height: 120%; text-align: center;">
                            <a href="https://peko.one/in/privacy-policy/" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">Privacy Policy</a> |
                            <a href="https://peko.one/in/cookie-policy/" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">Cookie Policy</a> |
                            <a href="https://peko.one/in/platform-agreement" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">Terms of Use</a> |
                            <a href="https://peko.one/in/refund-policy" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">Refund &amp; Cancellation Policy</a>
                          </h1>
                          <h1 style="margin: 8px 0 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; line-height: 120%; text-align: center;">
                            <a href="https://peko.one/in" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">www.peko.one</a>
                          </h1>
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
    </tbody>
  </table>
</body>
</html>`;
};
