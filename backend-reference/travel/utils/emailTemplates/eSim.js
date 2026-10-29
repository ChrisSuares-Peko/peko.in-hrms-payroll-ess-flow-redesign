const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge } = require("../emailTemplate/sharedLayout");

exports.generateEsimSuccessEmail = (name, transactionId, amount, esimDetails, type, quantity, operatorImage, operatorName, templateDetails) => {
  let nameOfOperator
  let packageName = esimDetails?.package
  let validity = esimDetails?.validity
  let data = esimDetails?.data
  let heading
  let qrCodeHtml = ''

  if (type == "SIM") {
    nameOfOperator = operatorName
    heading = "eSIM Order Confirmation"
  } else {
    nameOfOperator = esimDetails?.package
    heading = "eSIM-Topup Order Confirmation"
  }

  if (type == "SIM") {
    let sims = esimDetails?.sims || []
    for (let i = 0; i < sims.length; i++) {
      const sim = sims[i];
      qrCodeHtml += `
                              <tr>
                                <td align="left" style="padding-bottom:16px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">QR Code</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;"><img src="${sim?.qrcode_url}" width="100" height="100" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" /></td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Network:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${nameOfOperator}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Plan type:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${esimDetails?.esim_type}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">ICCID number:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${sim?.iccid}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Data:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${data}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>`
    }
  }

  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  const androidInstructions = `<strong>Android Phones</strong><br /><br />1. Access Settings: Open the "Settings" app on your Android phone.&nbsp;&nbsp;<br />2. Navigate to Network &amp; Internet: In the settings menu, locate and tap on "Network &amp; Internet."&nbsp;&nbsp;<br />3. Select Mobile Network: Within the "Network &amp; Internet" settings, select "Mobile Network."&nbsp;&nbsp;<br />4. Access Advanced Settings: Look for an option such as "Advanced" or "Advanced Settings" within the Mobile Network menu and tap on it.&nbsp;&nbsp;<br />5. Add Carrier: Choose "Carrier" and then select "Add Carrier" or "Add new plan."&nbsp;&nbsp;<br />6. Scan QR Code: Follow the on-screen instructions to scan the provided QR code that corresponds to the eSIM activation from your network carrier.&nbsp;&nbsp;<br />7. Activation: Complete the eSIM activation process as instructed by your network carrier.<br /><br /><strong>Please note that the specific steps may vary slightly depending on the Android device model and the network carrier.&nbsp;</strong>`;
  const iosInstructions = `<strong>iOS Phones</strong><br /><br />1. Find and purchase your eSIM from the selected provider.&nbsp;&nbsp;<br />2. Receive eSIM QR: Once the purchase is completed, you will receive an email containing the eSIM QR code from the provider.&nbsp;&nbsp;<br />3. Access Settings: Open the "Settings" app on your iPhone.&nbsp;&nbsp;<br />4. Select Cellular: Tap on "Cellular" from the settings menu.&nbsp;&nbsp;<br />5. Add Cellular Plan: Choose "Add Cellular Plan" and scan the provided eSIM QR code.&nbsp;&nbsp;<br />6. Follow On-Screen Instructions: Follow the on-screen instructions to complete the eSIM installation process.&nbsp;&nbsp;<br />7. Activation: Enter any required activation information and complete the setup as instructed by your eSIM provider.&nbsp;&nbsp;<br /><br /><strong>If you encounter any issues during the installation, you can reach out to your eSIM provider's customer support for assistance.</strong>`;

  const introText = `We're pleased to confirm that your payment of INR ${amount} for the eSIM package (${packageName}) has been successfully processed.${type == "SIM" ? ' The next step is to activate your eSIM. To learn how to do this, go to the instructions below.' : ''}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${heading}</title>
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
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${heading}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${heading}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${introText}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="section-heading" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Transaction Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Placed on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Transaction ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Service:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">eSIM</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Paid Amount:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">INR ${amount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              ${type == "SIM" ? `
                              <tr>
                                <td align="left" style="padding-bottom:20px;word-break:break-word;">
                                  <img src="${operatorImage}" width="220" height="139" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;max-width:100%;" />
                                </td>
                              </tr>` : ``}
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      ${type == "SIM" ? `
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Network:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${nameOfOperator}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Current package plan:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${packageName}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">No of eSIM:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${quantity}</td>
                                      </tr>` : `
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Network:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${nameOfOperator}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Validity:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${validity} Days</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Data:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${data}</td>
                                      </tr>`}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              ${type == "SIM" ? `
                              <tr>
                                <td align="left" class="section-heading" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Installation Guideline</div>
                                </td>
                              </tr>
                              <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody>${qrCodeHtml}</tbody></table>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${androidInstructions}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${iosInstructions}</div>
                                </td>
                              </tr>` : ``}
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We hope you have a rewarding experience with our services. If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.</div>
                                </td>
                              </tr>
                            </tbody>
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
${v2Footer({ socials, branding })}
      </div>
    </body>
  </html>`
}
