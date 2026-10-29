exports.busBookingFailedTemplate = (name, templateDetails) => {
  return `<!DOCTYPE html
PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"
style="padding:0;Margin:0">

<head>
<meta charset="UTF-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta content="telephone=no" name="format-detection">
<title>Your payment failed</title>
<!--[if (mso 16)]><style type="text/css">a {text-decoration: none;}</style><![endif]-->
<!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
<!--[if !mso]><!-- -->
<link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
<!--<![endif]-->
<style type="text/css">
  #outlook a { padding: 0; }
  .ExternalClass { width: 100%; }
  .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
  .es-button { mso-style-priority: 100 !important; text-decoration: none !important; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
  .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; }
  @media only screen and (max-width:600px) {
    p, ul li, ol li, a { line-height: 150% !important }
    h1, h2, h3, h1 a, h2 a, h3 a { line-height: 120% !important }
    h1 { font-size: 30px !important; text-align: center }
    h2 { font-size: 26px !important; text-align: left }
    h3 { font-size: 20px !important; text-align: left }
    .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important }
    .adapt-img { width: 100% !important; height: auto !important }
    .es-mobile-hidden, .es-hidden { display: none !important }
    table.es-social { display: inline-block !important }
    table.es-social td { display: inline-block !important }
  }
</style>
</head>

<body style="font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
<div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FEFCFC">
  <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FEFCFC">
    <tr style="border-collapse:collapse">
      <td valign="top" style="padding:0;Margin:0">

        <!-- Error icon + heading + body -->
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none"
          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
          <tr style="border-collapse:collapse">
            <td align="center" style="padding:0;Margin:0">
              <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                <tr style="border-collapse:collapse">
                  <td align="left" bgcolor="#ffffff"
                    style="Margin:0;padding-bottom:5px;padding-top:25px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                    <table width="100%" cellspacing="0" cellpadding="0" role="none"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                      <tr style="border-collapse:collapse">
                        <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                          <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;font-size:0px">
                                <img class="adapt-img"
                                  src="https://gxphmw.stripocdn.email/content/guids/CABINET_06e02bda2aeab991ad3d993634b67f886b4d0871c74bd68d8f8318c43a6028ac/images/icons8wrong144.png"
                                  alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                  width="85" height="85">
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td class="es-m-txt-c" align="center"
                                style="padding:0;Margin:0;padding-bottom:15px;padding-top:30px">
                                <h2
                                  style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;font-size:24px;font-style:normal;font-weight:bold;color:#ee221c;text-align:center">
                                  Your payment failed</h2>
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                  Dear ${name},<br>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                  We regret to inform you that there was an issue processing your recent bus booking on ${templateDetails.branding}.<br>
                                  Unfortunately, the booking was not successful due to a backend issue.<br><br>
                                  If any payment was made during the booking process, please rest assured that the full amount will be refunded to your original payment method.<br><br>
                                  We apologize for any inconvenience this may have caused. Our team is actively working to resolve the issue.<br><br>
                                  In the meantime, please feel free to try booking again. We are happy to help with alternative travel arrangements if needed.
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

        <!-- Thank you + best regards -->
        <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
          <tr style="border-collapse:collapse">
            <td align="center" style="padding:0;Margin:0">
              <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                <tr style="border-collapse:collapse">
                  <td align="left" style="padding:0;Margin:0;padding-left:40px;padding-right:40px">
                    <table cellpadding="0" cellspacing="0" width="100%" role="none"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                      <tr style="border-collapse:collapse">
                        <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  <br>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Thank you for using ${templateDetails.branding}.
                                  If you have any queries or need further assistance, please reach out to us at
                                  <a href="mailto:reach@peko.one">reach@peko.one</a>.
                                  We are here to assist you in any way we can.
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
                  <td align="left" style="padding:0;Margin:0;padding-left:40px;padding-right:40px">
                    <table cellpadding="0" cellspacing="0" width="100%" role="none"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                      <tr style="border-collapse:collapse">
                        <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  <br>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Best Regards</p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Team ${templateDetails.branding}</p>
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

        <!-- Footer with logo + links + dark social bar -->
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
                        <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                          <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;font-size:0px">
                                <a target="_blank" href="https://peko.one/in"
                                  style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                  <img class="adapt-img" src="${templateDetails.logo}" alt
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                    height="35">
                                </a>
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:18px;color:#666666;font-size:12px">
                                  This email was sent to you from company email address</p>
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:18px;color:#666666;font-size:12px">
                                  <a href="https://peko.one/in/privacy-policy/"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a
                                    href="https://peko.one/in/cookie-policy/"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;<a
                                    href="https://peko.one/in/platform-agreement"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;<a
                                    href="https://peko.one/in/refund-policy"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund &amp; Cancellation Policy</a>
                                </p>
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:18px;color:#666666;font-size:12px">
                                  &copy; ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Dark bar with social icons -->
                <tr style="border-collapse:collapse">
                  <td align="left" bgcolor="#0c0c0c"
                    style="Margin:0;padding-top:5px;padding-bottom:25px;padding-left:40px;padding-right:40px;background-color:#0c0c0c">
                    <table width="100%" cellspacing="0" cellpadding="0" role="none"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                      <tr style="border-collapse:collapse">
                        <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                          <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                  <br>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                  <a href="https://peko.one/in"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:12px"
                                    target="_blank">www.peko.one</a>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                  <br>
                                </p>
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;font-size:0">
                                <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0"
                                  role="presentation"
                                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                  <tr style="border-collapse:collapse">
                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                      <a target="_blank" href="https://x.com/PekoIndia"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                        <img title="Twitter"
                                          src="https://gxphmw.stripocdn.email/content/assets/img/social-icons/circle-white/twitter-circle-white.png"
                                          alt="Tw" width="24" height="24"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </a>
                                    </td>
                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                      <a target="_blank" href="https://www.instagram.com/peko.india"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                        <img title="Instagram"
                                          src="https://gxphmw.stripocdn.email/content/assets/img/social-icons/circle-white/instagram-circle-white.png"
                                          alt="Inst" width="24" height="24"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </a>
                                    </td>
                                    <td valign="top" align="center" style="padding:0;Margin:0">
                                      <a target="_blank" href="https://www.linkedin.com/company/pekoindia/"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                        <img title="Linkedin"
                                          src="https://gxphmw.stripocdn.email/content/assets/img/social-icons/circle-white/linkedin-circle-white.png"
                                          alt="In" width="24" height="24"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </a>
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
</html>`;
};
