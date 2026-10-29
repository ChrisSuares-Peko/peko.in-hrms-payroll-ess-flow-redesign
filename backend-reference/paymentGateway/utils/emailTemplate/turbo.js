exports.turboAddOnFleetSuccess = (quantity, name, templateDetails) => {
  return `<!DOCTYPE html
PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"
style="padding: 0; margin: 0">

<head>
<meta charset="UTF-8" />
<meta content="width=device-width, initial-scale=1" name="viewport" />
<meta name="x-apple-disable-message-reformatting" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta content="telephone=no" name="format-detection" />
<title>Turbo Add-On</title>
<!--[if (mso 16)
    ]><style type="text/css">
      a {
        text-decoration: none;
      }
    </style><!
  [endif]-->
<!--[if gte mso 9
    ]><style>
      sup {
        font-size: 100% !important;
      }
    </style><!
  [endif]-->
<!--[if gte mso 9
    ]><xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  <![endif]-->
<!--[if !mso]><!-- -->
<link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet" />
<!--<![endif]-->
<style type="text/css">
  #outlook a { padding: 0; }
  .ExternalClass { width: 100%; }
  .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
  .es-button { mso-style-priority: 100 !important; text-decoration: none !important; transition: all 100ms ease-in; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
  .es-button:hover { background: #555555 !important; border-color: #555555 !important; }
  .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; }
  @media only screen and (max-width: 600px) {
    p, ul li, ol li, a { line-height: 150% !important; }
    h1, h2, h3, h1 a, h2 a, h3 a { line-height: 120% !important; }
    h1 { font-size: 30px !important; text-align: center; }
    h2 { font-size: 26px !important; text-align: left; }
    h3 { font-size: 20px !important; text-align: left; }
    .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important; }
    .adapt-img { width: 100% !important; height: auto !important; }
    .es-button-border { display: inline-block !important; }
    a.es-button, button.es-button { font-size: 14px !important; display: inline-block !important; padding: 15px 25px 15px 25px !important; }
    .es-desk-hidden { display: table-row !important; width: auto !important; overflow: visible !important; max-height: inherit !important; }
  }
  @media screen and (max-width: 384px) {
    .mail-message-content { width: 414px !important; }
  }
</style>
</head>

<body style="font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; padding: 0; margin: 0;">
<div dir="ltr" class="es-wrapper-color" lang="en" style="background-color: #ffffff">
  <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; padding: 0; margin: 0; width: 100%; height: 100%; background-repeat: repeat; background-position: center top; background-color: #ffffff;">
    <tr style="border-collapse: collapse">
      <td valign="top" style="padding: 0; margin: 0">
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; table-layout: fixed !important; width:100%; max-width:600px;">
          <tr style="border-collapse: collapse">
            <td align="center" style="padding: 0; margin: 0">
              <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; background-color: #ffffff; max-width: 100%;">
                <tr style="border-collapse: collapse">
                  <td align="left" style="padding: 0; margin: 0; padding-top: 5px; padding-left: 40px; padding-right: 40px;">
                    <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                      <tr style="border-collapse: collapse">
                        <td align="center" valign="top" style="padding: 0; margin: 0; width: 100%">
                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                            <tr style="border-collapse: collapse">
                              <td align="center" style="padding: 0; margin: 0">
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 33px; color: #0b0b0b; font-size: 22px;">
                                  <strong>${quantity} additional ${Number(quantity) === 1 ? 'Vehicle and Driver' : 'Vehicles and Drivers'} added to your Turbo fleet successfully</strong>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr style="border-collapse: collapse">
                  <td align="left" bgcolor="#ffffff" style="margin: 0; padding-top: 10px; padding-bottom: 20px; padding-left: 40px; padding-right: 40px; background-color: #ffffff;">
                    <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                      <tr style="border-collapse: collapse">
                        <td valign="top" align="center" style="padding: 0; margin: 0; word-wrap: break-word;">
                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                            <tr style="border-collapse: collapse">
                              <td align="left" style="padding: 0; margin: 0;">
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;">
                                  Dear ${name},
                                </p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;"><br /></p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;">
                                  We are pleased to inform you that ${quantity} additional ${Number(quantity) === 1 ? 'Vehicle and Driver have been' : 'Vehicles and Drivers have been'} added to your Turbo fleet successfully.
                                </p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;"><br /></p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;">
                                  Thank you for choosing ${templateDetails?.branding}.
                                </p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;"><br /></p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;">
                                  If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best services at all times.
                                </p>
                                <br>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #010101; font-size: 15px;">
                                  Best regards,<br />Team ${templateDetails?.branding}
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
        <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; table-layout: fixed !important; width: 100%; max-width:600px; background-color: transparent; background-repeat: repeat; background-position: center top;">
          <tr style="border-collapse: collapse">
            <td align="center" style="padding: 0; margin: 0">
              <table class="es-footer-body" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; background-color: #ffffff;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
                <tr style="border-collapse: collapse">
                  <td align="left" bgcolor="#ffffff" style="padding: 40px; margin: 0; background-color: #ffffff; border-radius: 5px;">
                    <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                      <tr style="border-collapse: collapse">
                        <td valign="top" align="center" style="padding: 0; margin: 0; width: 100%">
                          <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                            <tr style="border-collapse: collapse">
                              <td align="center" style="padding: 0; margin: 0; font-size: 0px;">
                                <a target="_blank" href="https://peko.one/in" style="-webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; text-decoration: underline; color: #666666; font-size: 12px;"><img class="adapt-img" src=${templateDetails?.logo} alt style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" height="35" /></a>
                              </td>
                            </tr>
                            <tr style="border-collapse: collapse">
                              <td align="center" style="padding: 0; margin: 0; padding-top: 10px; padding-bottom: 10px;">
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 18px; color: #666666; font-size: 12px;">
                                  This email was sent to you from company email address
                                </p>
                              </td>
                            </tr>
                            <tr style="border-collapse: collapse">
                              <td align="center" style="padding: 0; margin: 0; padding-bottom: 10px;">
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 18px; color: #666666; font-size: 12px;">
                                  <a href="https://peko.one/in/privacy-policy" style="-webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; text-decoration: underline; color: #666666; font-size: 12px;">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; text-decoration: underline; color: #666666; font-size: 12px;">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; text-decoration: underline; color: #666666; font-size: 12px;">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; text-decoration: underline; color: #666666; font-size: 12px;">Refund &amp; Cancellation Policy</a>
                                </p>
                              </td>
                            </tr>
                            <tr style="border-collapse: collapse">
                              <td align="center" style="padding: 0; margin: 0">
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 18px; color: #666666; font-size: 12px;">
                                  © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr style="border-collapse: collapse">
                  <td align="left" bgcolor="#0c0c0c" style="margin: 0; padding-top: 5px; padding-bottom: 25px; padding-left: 40px; padding-right: 40px; background-color: #0c0c0c;">
                    <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                      <tr style="border-collapse: collapse">
                        <td valign="top" align="center" style="padding: 0; margin: 0; width: 100%">
                          <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px;">
                            <tr style="border-collapse: collapse">
                              <td align="center" style="padding: 0; margin: 0">
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 18px; color: #ffffff; font-size: 12px;"><br /></p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 18px; color: #ffffff; font-size: 12px;">
                                  <a href="https://peko.one/in" style="-webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; text-decoration: none; color: #ffffff; font-size: 12px;" target="_blank">www.peko.one</a>
                                </p>
                                <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 18px; color: #ffffff; font-size: 12px;"><br /></p>
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
</html>`
}
