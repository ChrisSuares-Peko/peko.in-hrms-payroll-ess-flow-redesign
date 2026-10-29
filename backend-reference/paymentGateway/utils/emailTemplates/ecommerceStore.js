const { formatNumberWithLocalString, formatIndiaEmailDateTime } = require('../formatter');

const detailRow = (label, value) => `
                      <tr>
                        <td style="padding-bottom: 12px; vertical-align: top; width: 180px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #000000;">${label}</td>
                        <td style="padding-bottom: 12px; vertical-align: top; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; color: #000000;">${value}</td>
                      </tr>`;

exports.generateEcommerceStorePaymentSuccessEmail = (name, transactionId, amount, planName, partnerDetails) => {
    const branding = partnerDetails?.branding || 'Peko';
    const dateStr = formatIndiaEmailDateTime();

    return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <title>Peko Commerce Subscription Payment Successful</title>
  <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    p { line-height: inherit }
    @media (max-width:500px) {
      .row-content { width: 100% !important; }
      .stack .column { width: 100%; display: block; }
    }
  </style>
</head>
<body style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation"
    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
    <tbody>
      <tr>
        <td>

          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
            width="480">
            <tbody>
              <tr>
                <td style="padding-bottom: 5px; padding-top: 35px; vertical-align: top; text-align: center;" width="100%">
                  <img src="${partnerDetails?.logo}" alt="${branding}"
                    style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; margin: 0 auto;"
                    width="110" height="35">
                </td>
              </tr>
            </tbody>
          </table>

          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
            width="480">
            <tbody>
              <tr>
                <td style="padding-bottom: 5px; padding-top: 25px; text-align: center;" width="100%">
                  <img alt="Success" src="https://d2fduk7g9mvyjq.cloudfront.net/common/success_badge.svg" width="64" height="64"
                    style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 5px; padding-top: 15px;" width="100%">
                  <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 26px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0;">
                    <strong>Peko Commerce Subscription Payment Successful</strong>
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 10px; padding-top: 25px;" width="100%">
                  <div style="color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 150%; text-align: left;">
                    <p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
                    <p style="margin: 0;">We are pleased to inform you that your payment for the Peko Commerce ${planName} subscription was successful. Your store is now active and ready to be set up — start adding products, configuring your storefront, and accepting orders right away.</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 10px; padding-top: 20px;" width="100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                    <tbody>${detailRow('Placed on:', dateStr)}${detailRow('Plan:', `Peko Commerce ${planName}`)}${detailRow('Transaction ID:', transactionId)}${detailRow('Amount paid:', `₹ ${formatNumberWithLocalString(amount)}`)}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 40px; padding-top: 20px;" width="100%">
                  <div style="color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                    <p style="margin: 0; margin-bottom: 17px;">Thank you for choosing ${branding}. We appreciate your trust in us.</p>
                    <p style="margin: 0;">If you have any queries or need further assistance, please reach out to us at
                      <a href="mailto:reach@peko.one" style="text-decoration: underline; color: #000000;" target="_blank">reach@peko.one</a>.
                      We assure you of our best services at all times.
                    </p>
                    <p style="margin: 0; margin-top: 16px;">Best Regards,<br>Team ${branding}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; color: #000000; width: 480px; margin: 0 auto;"
            width="480">
            <tbody>
              <tr>
                <td style="padding-bottom: 15px; padding-top: 25px;" width="100%">
                  <div align="center" style="line-height: 10px;">
                    <div style="max-width: 144px; margin: 0 auto;">
                      <img src="${partnerDetails?.logo}" alt="${branding}"
                        style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;"
                        width="110" height="35">
                    </div>
                  </div>
                </td>
              </tr>
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
</body>
</html>`;
};

exports.generateEcommerceStoreRenewalSuccessEmail = (
    name,
    transactionId,
    amount,
    planName,
    partnerDetails
) => {
    const branding = partnerDetails?.branding || "Peko";
    const dateStr = formatIndiaEmailDateTime();

    return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <title>Peko Commerce Subscription Renewed</title>
  <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    p { line-height: inherit }
    @media (max-width:500px) {
      .row-content { width: 100% !important; }
      .stack .column { width: 100%; display: block; }
    }
  </style>
</head>
<body style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation"
    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
    <tbody>
      <tr>
        <td>

          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
            width="480">
            <tbody>
              <tr>
                <td style="padding-bottom: 5px; padding-top: 35px; vertical-align: top; text-align: center;" width="100%">
                  <img src="${partnerDetails?.logo}" alt="${branding}"
                    style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; margin: 0 auto;"
                    width="110" height="35">
                </td>
              </tr>
            </tbody>
          </table>

          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
            width="480">
            <tbody>
              <tr>
                <td style="padding-bottom: 5px; padding-top: 25px; text-align: center;" width="100%">
                  <img alt="Success" src="https://d2fduk7g9mvyjq.cloudfront.net/common/success_badge.svg" width="64" height="64"
                    style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; margin: 0 auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 5px; padding-top: 15px;" width="100%">
                  <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 26px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0;">
                    <strong>Peko Commerce Subscription Renewed</strong>
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 10px; padding-top: 25px;" width="100%">
                  <div style="color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 150%; text-align: left;">
                    <p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
                    <p style="margin: 0;">Your Peko Commerce ${planName} subscription has been renewed successfully. Your store continues to run without any interruption to your service.</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 10px; padding-top: 20px;" width="100%">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                    <tbody>${detailRow("Renewed on:", dateStr)}${detailRow(
        "Plan:",
        `Peko Commerce ${planName}`
    )}${detailRow("Transaction ID:", transactionId)}${detailRow(
        "Amount paid:",
        `₹ ${formatNumberWithLocalString(amount)}`
    )}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 40px; padding-top: 20px;" width="100%">
                  <div style="color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
                    <p style="margin: 0; margin-bottom: 17px;">Thank you for choosing ${branding}. We appreciate your trust in us.</p>
                    <p style="margin: 0;">If you have any queries or need further assistance, please reach out to us at
                      <a href="mailto:reach@peko.one" style="text-decoration: underline; color: #000000;" target="_blank">reach@peko.one</a>.
                      We assure you of our best services at all times.
                    </p>
                    <p style="margin: 0; margin-top: 16px;">Best Regards,<br>Team ${branding}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; color: #000000; width: 480px; margin: 0 auto;"
            width="480">
            <tbody>
              <tr>
                <td style="padding-bottom: 15px; padding-top: 25px;" width="100%">
                  <div align="center" style="line-height: 10px;">
                    <div style="max-width: 144px; margin: 0 auto;">
                      <img src="${partnerDetails?.logo}" alt="${branding}"
                        style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;"
                        width="110" height="35">
                    </div>
                  </div>
                </td>
              </tr>
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
</body>
</html>`;
};
