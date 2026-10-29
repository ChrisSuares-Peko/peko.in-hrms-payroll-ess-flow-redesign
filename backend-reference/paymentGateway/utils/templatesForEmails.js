//Before it is named as emailOTPTemaplte
exports.commonEmailOtpVerification = ({ otp }) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0"><head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>Welcome Note</title> <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;} </style><![endif]--> <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--> <!--[if !mso]><!-- --> <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"> <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet"> <!--<![endif]--> <style type="text/css"> #outlook a { padding: 0; } .ExternalClass { width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } .es-button { mso-style-priority: 100 !important; text-decoration: none !important; transition: all 100ms ease-in; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .es-button:hover { background: #555555 !important; border-color: #555555 !important; } .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; } @media only screen and (max-width:600px) { p, ul li, ol li, a { line-height: 150% !important } h1, h2, h3, h1 a, h2 a, h3 a { line-height: 120% !important } h1 { font-size: 30px !important; text-align: center } h2 { font-size: 26px !important; text-align: left } h3 { font-size: 20px !important; text-align: left } h1 a { text-align: center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size: 30px !important } h2 a { text-align: left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size: 20px !important } h3 a { text-align: left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size: 20px !important } .es-menu td a { font-size: 16px !important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size: 16px !important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size: 17px !important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size: 17px !important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size: 12px !important } *[class="gmail-fix"] { display: none !important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align: center !important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align: right !important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align: left !important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display: inline !important } .es-button-border { display: inline-block !important } a.es-button, button.es-button { font-size: 14px !important; display: inline-block !important; padding: 15px 25px 15px 25px !important } .es-btn-fw { border-width: 10px 0px !important; text-align: center !important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width: 100% !important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important } .es-adapt-td { display: block !important; width: 100% !important } .adapt-img { width: 100% !important; height: auto !important } .es-m-p0 { padding: 0px !important } .es-m-p0r { padding-right: 0px !important } .es-m-p0l { padding-left: 0px !important } .es-m-p0t { padding-top: 0px !important } .es-m-p0b { padding-bottom: 0 !important } .es-m-p20b { padding-bottom: 20px !important } .es-mobile-hidden, .es-hidden { display: none !important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width: auto !important; overflow: visible !important; float: none !important; max-height: inherit !important; line-height: inherit !important } tr.es-desk-hidden { display: table-row !important } table.es-desk-hidden { display: table !important } td.es-desk-menu-hidden { display: table-cell !important } .es-menu td { width: 1% !important } table.es-table-not-adapt, .esd-block-html table { width: auto !important } table.es-social { display: inline-block !important } table.es-social td { display: inline-block !important } .es-desk-hidden { display: table-row !important; width: auto !important; overflow: visible !important; max-height: inherit !important } .h-auto { height: auto !important } } @media screen and (max-width:384px) { .mail-message-content { width: 414px !important } } </style></head><body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F1F1F1"> <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f1f1f1"></v:fill> </v:background><![endif]--> <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1F1F1"> <tr style="border-collapse:collapse"> <td valign="top" style="padding:0;Margin:0"> <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:710px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-left:25px;padding-top:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:645px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://gxphmw.stripocdn.email/content/guids/CABINET_360c2d05d66d1afd304e6c6760eb1c1c6bd03191ba0ac3d8fdb620f45388db28/images/123333.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="255" height="134"></td> </tr> </table> </td> </tr> </table> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:630px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"> <h2 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#010201;text-align:left"> Email Verification</h2> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> Greetings,</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> Thank you for choosing Peko. We are pleased to inform you that an OTP has been generated for your account verification.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> Your one time password (OTP) is</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br></p> </td> </tr> <tr style="border-collapse:collapse"> <td class="h-auto" align="left" bgcolor="#FAFAFA" height="91" style="padding:0;Margin:0;padding-bottom:10px"> <h2 style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:24px;font-style:normal;font-weight:bold;color:#010201;text-align:center"> <br></h2> <h2 style="letter-spacing: 1vh; Margin:0;line-height:30px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:25px;font-style:normal;font-weight:bold;color:#010201;text-align:center"> <strong>${otp}</strong></h2> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br></p> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"> <h2 style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#333333;text-align:center"> <br></h2> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Please use this OTP to complete the verification process within 2 minutes. It is important to keep this OTP confidential and not share it with anyone.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> We are here to assist you. If you have any questions or need further assistance, please don't hesitate to contact our support team.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Best Regards,</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Team Peko</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:710px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:25px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:645px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="136" height="55"></td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:710px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:10px;Margin:0;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:690px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> This email was sent to you from company email address</p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> <a href="https://peko.one/in/privacy-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a> </p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> © ${new Date().getUTCFullYear()} Peko, All Rights Reserved</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> <br></p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </div></body></html>`;
};

exports.commonFailedTemplate = (name, serviceName, url) => {
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
<title>Your payment failed</title>
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
      font-size: 11px !important
    }

    .es-header-body p,
    .es-header-body ul li,
    .es-header-body ol li,
    .es-header-body a {
      font-size: 13px !important
    }

    .es-content-body p,
    .es-content-body ul li,
    .es-content-body ol li,
    .es-content-body a {
      font-size: 14px !important
    }

    .es-footer-body p,
    .es-footer-body ul li,
    .es-footer-body ol li,
    .es-footer-body a {
      font-size: 15px !important
    }

    .es-infoblock p,
    .es-infoblock ul li,
    .es-infoblock ol li,
    .es-infoblock a {
      font-size: 10px !important
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
      display: inline-block !important
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
        <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none"
          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
          <tr style="border-collapse:collapse">
            <td align="center" style="padding:0;Margin:0">
              <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                role="none"
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
                              <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                                  src="https://gxphmw.stripocdn.email/content/guids/CABINET_06e02bda2aeab991ad3d993634b67f886b4d0871c74bd68d8f8318c43a6028ac/images/icons8wrong144.png"
                                  alt
                                  style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                  width="85" height="85"></td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td class="es-m-txt-c" align="center"
                                style="padding:0;Margin:0;padding-bottom:15px;padding-top:30px">
                                <h2
                                  style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:24px;font-style:normal;font-weight:bold;color:#ee221c;text-align:center">
                                  Your payment failed</h2>
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                  Dear ${name},<br></p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                  We regret to inform you that your ${serviceName} order payment on ${new
      Date().toLocaleString()} was unsuccessful.
                                  If any amount was deducted from your account,
                                  please be assured that the refund will be
                                  processed within 7 to 10 business days.</p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                  <br>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                  We appreciate your understanding and patience.
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#010101;font-size:15px;text-align:center">
                                  <br>
                                </p>
                              </td>
                            </tr>
                            <tr style="border-collapse: collapse">
                              <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                                <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                              mso-table-lspace: 0pt;
                                              mso-table-rspace: 0pt;
                                              border-collapse: collapse;
                                              border-spacing: 0px;
                                            ">
                                  <tr style="border-collapse: collapse">
                                    <td align="center" style="padding: 0; margin: 0">
                                      <span class="msohide es-button-border" style="
                                                    border-style: solid;
                                                    border-color: #26a4d3;
                                                    background: #181818;
                                                    border-width: 0px;
                                                    display: inline-block;
                                                    border-radius: 53px;
                                                    width: auto;
                                                    mso-hide: all;
                                                  "><a href=${url} class="es-button es-button-1695643055948"
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
                                                      background: #181818;
                                                      border-radius: 53px;
                                                      font-family: arial, 'helvetica neue',
                                                        helvetica, sans-serif;
                                                      font-weight: bold;
                                                      font-style: normal;
                                                      line-height: 17px;
                                                      width: auto;
                                                      text-align: center;
                                                      padding: 15px 40px;
                                                      mso-padding-alt: 0;
                                                      mso-border-alt: 10px solid #181818;
                                                    ">Try Again</a>
                                      </span>
                                      <!--<![endif]-->
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
        <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
          <tr style="border-collapse:collapse">
            <td align="center" style="padding:0;Margin:0">
              <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                role="none"
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
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  <br>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Thank you for using Peko.
                                  If you have any queries or need further
                                  assistance, please reach out to us at
                                  <a href="mailto:reach@peko.one">reach@peko.one</a>.
                                  We are here to assist you in any
                                  way we can.
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
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  <br>
                                </p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Best Regards</p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Team Peko</p>
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
                        <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                          <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank"
                                  href="https://peko.one/in"
                                  style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                    class="adapt-img"
                                    src="https://gxphmw.stripocdn.email/content/guids/CABINET_674b0d0a49570ab72e7f6bd66180cf3d1d634b107ad71e4b66e3d678ba50cd6e/images/peko.png"
                                    alt
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                    width="110" height="35"></a> </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                  This email was sent to you from company email
                                  address</p>
                              </td>
                            </tr>
                            <tr style="border-collapse:collapse">
                              <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                  <a href="https://peko.one/in/privacy-policy/"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy
                                    Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
                                    Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
                                    of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                    href="https://peko.one/in/refund-policy"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund
                                    & Cancellation Policy</a><a target="_blank" class="unsubscribe" href=""
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
                        <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                          <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
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
                              <td align="center" style="padding:0;Margin:0;font-size:0">
                                <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0"
                                  role="presentation"
                                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                  <tr style="border-collapse:collapse">
                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                      <a target="_blank" href="https://x.com/PekoIndia"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                          title="Twitter"
                                          src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                          alt="Tw" width="24" height="24"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                    </td>
                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                      <a target="_blank" href="https://www.instagram.com/peko.india"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                          title="Instagram"
                                          src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                          alt="Inst" width="24" height="24"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                    </td>
                                    <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank"
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
  
  `;
};


exports.hotelTicketPDFTemplate = (data) => {
  return `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Ticket</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />

  <style type="text/css">
    body {
      font-family: 'Roboto', sans-serif;
    }
    hr {
      /* margin: 1.875em 0; */
      border: none;
      border-bottom: solid 1px #000000;
    }
    .dashed-2 {
      border: none;
      height: 1px;
      background: #000;
      background: repeating-linear-gradient(90deg, #000, #000 3px, transparent 3px, transparent 6px);
    }
    .line {
      width: 40%;
      text-align: center;
      border-bottom: 2px dotted rgb(165, 165, 165);
      line-height: 0.1em;
      margin: auto
    }

  </style>
</head>

<body>
  <div class="container mt-4 ">
    <div class="card ">
      <div class="card-body">
        <div class=" mb-5 mt-3">
          <div class="row d-flex align-items-baseline px-3">
            <div class="col-6">
              <p style="font-size: 40px;"><strong>Booking Confirmation</strong></p>
            </div>
            <div class="col-6 d-flex justify-content-end align-items-baseline">
              <img src="https://peko.one/wp-content/uploads/2022/03/Untitled-design3.png" height="35" alt="" srcset="">
            </div>
          </div>
          <div class="row d-flex align-items-baseline px-3">
            <span class="col-6 fs-3 fw-light">Supplier Id: <span class="fw-bold">${data?.supplierReferenceId}</span> </span>
            <span class="col-6 fs-3 fw-light">Booking Id: <span class="fw-bold">${data?.bookingReferenceId}</span> </span>
          </div>

          <!-- data hotel booking detail -->
          <div id="bookingDetails">${data?.hotelTicketHTML}</div>

         
          <!-- ABOUT THIS TRIP -->
          <div class="p-3">
            <h6>NOTES</h6>
            <ul class="">
              <li>
                IMPORTANT: At check in, you must present a valid photo ID with your address confirming the same name as
                the lead guest on the
                booking. For bookings paid with a credit card, you may also need to present the card used to make the
                payment. Failure to do so may
                result in the hotel requesting additional payment or your reservation not being honored©
              </li>
              <li>
                All rooms are guaranteed on the day of arrival. In the case of a no show, your room(s) will be released
                and you will be subject to the
                terms and conditions of the Cancellation/No-Show Policy specified at the time you made the booking as
                well as noted in the
                Confirmation Email©
              </li>
              <li>
                The total price for this booking does not include mini bar items, telephone usage, laundry service, etc.
                The property will bill you directly©
              </li>
              <li>
                In cases where Breakfast is included with the room rate, please note that certain properties may charge
                extra for children travelling with
                their parents. If applicable, the property will bill you directly. Upon arrival, if you have any
                questions, please verify with the property
              </li>

            </ul>
          </div>

          <!-- FARE BREAKUP -->

          <div class="p-3">
            <h6>FARE BREAKUP</h6>
            <table>
              <tbody class="lh-lg">
                <tr>
                  <td>
                    Base Fare:
                  </td>
                  <td class="ps-3"> ${data?.amount} INR</td>
                </tr>
                <tr>
                  <td>
                    Discounts And Cashbacks:
                  </td>
                  <td class="ps-3"> 0.00 INR</td>
                </tr>
                <tr>
                  <td>
                    Taxes and Fees:
                  </td>
                  <td class="ps-3"> 0.00 INR</td>
                </tr>
                <tr>
                  <td>
                    Total Fare:
                  </td>
                  <td class="ps-3"> ${data?.amount} INR</td>
                </tr>
              </tbody>
            </table>
          </div>
          <hr>
          <div class="row fs-5">
            <div class="col-4"> Emirates helpline 600 555555</div>
            <div class="col-4 text-center">www.peko.one </div>
            <div class="col-4 text-end">Peko Helpline? <br> Call 022 489 30373 </div>

          </div>


        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
  `;
};

exports.hotelTicketDetails = (guestDetailsData, bookingData) => {
  const {
    hotelName,
    address,
    checkInDate,
    checkOutDate,
    checkInTime,
    checkOutTime,
    nights,
    hotelAdultCount,
    hotelChildCount,
    hotelRoomCount,
    hotelContact,
  } = bookingData;
  let tableRow = ``;
  guestDetailsData.forEach((data) => {
    tableRow += `
                  <tr class="fs-5">
                    <td> ${data?.passengerInfo.nameTitle} ${data.passengerInfo.givenName} ${data.passengerInfo.surname}</td>
                    ${Array.isArray(data?.contact?.contactProvided) ? `<td>${data.contact.contactProvided[0]?.emailAddress[0]}</td>` : ""}
                    ${Array.isArray(data?.contact?.contactProvided)
        ? `<td>${data.contact.contactProvided[0]?.phone[0].phoneNumber}</td>`
        : ""
      }
                  </tr>
          `;
  });

  return `
              <div> <!-- hotel name --> <div class="my-4 px-3"> <hr style="border-top: dotted 1px;" /> <div class="py-2"> <span class="fs-5 fw-bolder"> ${hotelName}</span> <span class="fs-5 ps-4"> <i class="bi bi-calendar"></i>${checkInDate}</span> </div> <hr style="border-top: dotted 1px;" /> </div> <!-- booking details --> <div class="p-3"> <div class="row mt-2 mb-4 "> <div class="col-3 mt-1 d-flex align-items-center justify-content-center flex-column"> <div class="fs-4 ">${address}</div> </div> <div class="col-3 mt-1 d-flex align-items-center justify-content-center flex-column"> <div> <div class="fs-3">Check In</div> <div class="fs-5 fw-bolder">${checkInDate}</div> <div class="fs-3">${checkInTime}</div> </div> </div> <div class="col-3 mt-1 text-center d-flex align-items-center justify-content-center flex-column"> <button style="background-color: transparent; border: 1px solid lightgray; border-radius: 5px;" class="fw-bolder px-3 py-2">${nights}</button> <span class="text-secondary pt-3">${hotelRoomCount} | ${hotelAdultCount} | ${hotelChildCount} </span> </div> <div class="col-3 mt-1 d-flex align-items-center justify-content-center flex-column"> <div> <div class="fs-3">Check Out</div> <div class="fs-5 fw-bolder">${checkOutDate}</div> <div class="fs-3">${checkOutTime}</div> </div> </div> </div> </div> <div class="p-3 lh-lg" style="background-color: rgb(248, 248, 248);"> <div> <div class="fw-bold fs-5 py-1">Property Contact </div> <span class="fs-5">Email: ${hotelContact?.email || "Not available"}</span> <span class="ps-3 fs-5">Phone Number: ${hotelContact?.phoneNumber || "Not available"}</span> </div> <div class="bg-body-secondary"> <div class="fw-bold fs-5 py-1">Guest Details </div> <table class="table table-borderless "> <tbody id='tableBody'> ${tableRow} </tbody> </table> </div> </div> <!-- table --> <div class="container mt-3"> <div class="fw-bold fs-5 ">Room Type </div> <table class="table table-bordered"> <thead> <tr> <th>ROOM TYPE</th> <th>GUEST</th> <th>NO OF ROOM</th> <th>ADD ONS</th> </tr> </thead> <tbody> <tr> <td>Deluxe Room - Room Only </td> <td>${hotelAdultCount} & ${hotelChildCount}</td> <td>${hotelRoomCount}</td> <td></td> </tr> </tbody> </table> <p class="py-3"> <span class="text-danger">Cancellation Policy:</span> Any cancellation received will incur a charge of 84% of the booking value.Failure to arrive at your hotel or property will be treated as a NoShow and will incur a charge of 84% of the booking value (Hotel policy). </p> <hr> </div> </div>
      `;
};

exports.generateHotelTicketAndSendToMail = (data) => {
  return `
  <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    
    <head>
      <!--[if gte mso 9]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--<![endif]-->
      <title></title>
    
      <style type="text/css">
        @media only screen and (min-width: 620px) {
          .u-row {
            width: 600px !important;
          }
          .u-row .u-col {
            vertical-align: top;
          }
          .u-row .u-col-100 {
            width: 600px !important;
          }
        }
        
        @media (max-width: 620px) {
          .u-row-container {
            max-width: 100% !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
          }
          .u-row .u-col {
            min-width: 320px !important;
            max-width: 100% !important;
            display: block !important;
          }
          .u-row {
            width: calc(100% - 40px) !important;
          }
          .u-col {
            width: 100% !important;
          }
          .u-col>div {
            margin: 0 auto;
          }
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        table,
        tr,
        td {
          vertical-align: top;
          border-collapse: collapse;
        }
        
        p {
          margin: 0;
        }
        
        .ie-container table,
        .mso-container table {
          table-layout: fixed;
        }
        
        * {
          line-height: inherit;
        }
        
        a[x-apple-data-detectors='true'] {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        table,
        td {
          color: #000000;
        }
      </style>
    
    
    
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
      <!--<![endif]-->
    
    </head>
    
    <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
      <!--[if IE]><div class="ie-container"><![endif]-->
      <!--[if mso]><div class="mso-container"><![endif]-->
      <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
        <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding-right: 0px;padding-left: 0px;" align="center">
    
                                        <img align="center" border="0" src="https://assets.unlayer.com/projects/110176/1666981836761-Peko%20230x400-01.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                          width="179.2" />
    
                                      </td>
                                    </tr>
                                  </table>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding-right: 0px;padding-left: 0px;" align="center">
    
                                        <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                          width="150.8" />
                                      </td>
                                    </tr>
                                  </table>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 140%;"><strong>HOTEL&nbsp; &nbsp;TICKET&nbsp;</strong></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Hi, ${data.user} </span></p>
                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">Thank you for choosing Peko.</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">We are delighted to provide you with your confirmed hotel booking. Attached to this email, you will find all the necessary details and information regarding your reservation.</span></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Peko Team</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #1e1e20; line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 16px; line-height: 25.6px; color: #ecf0f1;">This is an autogenerated mail, please don't reply</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyright ${new Date().getUTCFullYear()} Peko Platforms Private Limited,. All Rights Reserved</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
      <!--[if mso]></div><![endif]-->
      <!--[if IE]></div><![endif]-->
    </body>
    
    </html>
  `;
};
exports.generateMobilePaymentSuccessEmailBill = (transactionId, amount, account, serviceProvider, type) => {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    dir="ltr"
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    lang="en"
    style="padding: 0; margin: 0">
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>Peko</title>
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
        </xml><!
      [endif]-->
      <!--[if !mso]><!-- -->
      <link
        href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i"
        rel="stylesheet" />
      <link
        href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i"
        rel="stylesheet" />
      <!--<![endif]-->
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
          .h-auto {
            height: auto !important;
          }
        }
        @media screen and (max-width: 384px) {
          .mail-message-content {
            width: 414px !important;
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
      <div
        dir="ltr"
        class="es-wrapper-color"
        lang="en"
        style="background-color: #f1f1f1">
        <!--[if gte mso 9
          ]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
            <v:fill type="tile" color="#f1f1f1"></v:fill> </v:background
        ><![endif]-->
        <table
          class="es-wrapper"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          role="none"
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
                role="none"
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
                      role="none"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 710px;
                      ">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-left: 25px;
                            padding-top: 40px;
                            padding-right: 40px;
                          ">
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            role="none"
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
                                style="padding: 0; margin: 0; width: 645px">
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
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      ">
                                      <img
                                        class="adapt-img"
                                        src="https://gxphmw.stripocdn.email/content/guids/CABINET_360c2d05d66d1afd304e6c6760eb1c1c6bd03191ba0ac3d8fdb620f45388db28/images/123333.png"
                                        alt
                                        style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        "
                                        width="255"
                                        height="134" />
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#ffffff"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 40px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #ffffff;
                          ">
                          <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            role="none"
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
                                style="padding: 0; margin: 0; width: 630px">
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
                                      align="left"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-bottom: 10px;
                                      ">
                                      <h2
                                        style="
                                          margin: 0;
                                          line-height: 24px;
                                          mso-line-height-rule: exactly;
                                          font-family: roboto, 'helvetica neue',
                                            helvetica, arial, sans-serif;
                                          font-size: 20px;
                                          font-style: normal;
                                          font-weight: bold;
                                          color: #010201;
                                          text-align: left;
                                        ">
                                        Recharge Successfull
                                      </h2>
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
                                          font-family: roboto, 'helvetica neue',
                                            helvetica, arial, sans-serif;
                                          line-height: 23px;
                                          color: #010201;
                                          font-size: 15px;
                                        ">
                                        Greetings,
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: roboto, 'helvetica neue',
                                            helvetica, arial, sans-serif;
                                          line-height: 23px;
                                          color: #010201;
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
                                          font-family: roboto, 'helvetica neue',
                                            helvetica, arial, sans-serif;
                                          line-height: 23px;
                                          color: #010201;
                                          font-size: 15px;
                                        ">
                                        Your payment was successful. Please find
                                        the details below.
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: roboto, 'helvetica neue',
                                            helvetica, arial, sans-serif;
                                          line-height: 23px;
                                          color: #010201;
                                          font-size: 15px;
                                        ">
                                        <br />
                                      </p>
                                    </td>
                                  </tr>
                                  <table
                                    style="
                                      font-family: 'Cabin', sans-serif;
                                      border: 1px solid #ddd;
                                      padding: 10px;
                                      width: 100%;
                                      text-align: center;
                                    ">
                                    <thead style="background-color: #f5f5f5">
                                      <tr>
                                        <th
                                          style="
                                            font-size: 21px;
                                            font-weight: 600;
                                            padding: 20px;
                                            text-align: center;
                                          "
                                          colspan="2">
                                          Payment Summary
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td
                                          style="
                                            font-weight: lighter;
                                            padding: 15px;
                                            font-size: 14px;
                                          "
                                          align="left">
                                          Transaction ID
                                        </td>
                                        <td
                                          style="padding: 15px; font-size: 14px"
                                          align="left">
                                          ${transactionId}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          style="
                                            font-weight: lighter;
                                            padding: 15px;
                                            font-size: 14px;
                                          "
                                          align="left">
                                          Transaction Date
                                        </td>
                                        <td
                                          style="padding: 15px; font-size: 14px"
                                          align="left">
                                          ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          style="
                                            font-weight: lighter;
                                            padding: 15px;
                                            font-size: 14px;
                                          "
                                          align="left">
                                          Service Provider
                                        </td>
                                        <td
                                          style="padding: 15px; font-size: 14px"
                                          align="left">
                                          ${serviceProvider}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          style="
                                            font-weight: lighter;
                                            padding: 15px;
                                            font-size: 14px;
                                          "
                                          align="left">
                                          Type of Service
                                        </td>
                                        <td
                                          style="padding: 15px; font-size: 14px"
                                          align="left">
                                          ${type}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          style="
                                            font-weight: lighter;
                                            padding: 15px;
                                            font-size: 14px;
                                          "
                                          align="left">
                                          Account Number:
                                        </td>
                                        <td
                                          style="padding: 15px; font-size: 14px"
                                          align="left">
                                          ${account}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          style="
                                            font-weight: lighter;
                                            padding: 15px;
                                            font-size: 14px;
                                          "
                                          align="left">
                                          Amount:
                                        </td>
                                        <td
                                          style="padding: 15px; font-size: 14px"
                                          align="left">
                                          ${amount} INR
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
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
                                        We are here to assist you. If you have any
                                        questions or need further assistance,
                                        please don't hesitate to contact our
                                        support team.
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
                                        Team Peko
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
                role="none"
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
                      role="none"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 710px;
                      ">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 5px;
                            padding-left: 25px;
                            padding-right: 40px;
                          ">
                          <table
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            role="none"
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
                                style="padding: 0; margin: 0; width: 645px">
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
                                        src=""
                                        alt
                                        style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        "
                                        width="136"
                                        height="55" />
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
                class="es-footer"
                align="center"
                role="none"
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
                        width: 710px;
                      "
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#ffffff"
                      align="center"
                      role="none">
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#ffffff"
                          style="
                            padding: 10px;
                            margin: 0;
                            background-color: #ffffff;
                          ">
                          <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            role="none"
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
                                style="padding: 0; margin: 0; width: 690px">
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
                                        © ${new Date().getUTCFullYear()} Peko, All Rights Reserved
                                      </p>
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
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
  `};

const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('./emailTemplate/sharedLayout');

// key: CARBON_FOOTPRINT_CREDIT_PURCHASE (service: CARBON_FOOTPRINT)
// v2 design matches AE's own migrated version (Peko-AE/gateway/utils/emailTemplates/carbonFootprint.js,
// creditPurchaseMail), with AE's AED currency localized to IN's real Rupee (matching IN's own
// pre-v2 design, which already used the Rupee sign throughout). AE's design also has 2 extra
// detail rows (Service Provider, Carbon Credits) sourced from its own controller's real data —
// IN's controller has no equivalent real values for either (its own `account` field is a
// hardcoded "NA" placeholder, not real data), so those 2 rows were dropped rather than shown
// with placeholder/fake data, matching IN's own pre-v2 template's simpler field set
// (name, transaction ID, amount only). AE's UAE phone-support line was also dropped, matching
// every other IN template's email-only support convention.
exports.generatePaymentSuccessEmail = (name, transactionId, amount, templateDetails) => {
	const branding = templateDetails?.branding || 'Peko';
	const website = templateDetails?.baseUrl || 'https://peko.one/in';
	const websiteLabel = toWebsiteLabel(website);
	const logo = templateDetails?.logo;
	const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Carbon Credits Payment Successful</title>
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
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Carbon Credits Payment Successful" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="64" height="64" style="width:64px;height:64px;background-color:#E5FFE8;border-radius:50%;">
                                    <tr>
                                      <td align="center" valign="middle" style="width:64px;height:64px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="32" height="32" style="width:32px;height:32px;background-color:#20C230;border-radius:50%;">
                                          <tr>
                                            <td align="center" valign="middle" style="width:32px;height:32px;">
                                              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxNiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEgNkw2IDExTDE1IDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==" width="16" height="12" alt="" style="display:block;border:0;">
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your payment for carbon credits was successful</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Your payment for carbon credits was successful. Please find the transaction details below:</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Date:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Transaction ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Amount Paid:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">₹ ${amount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you have any queries or need further assistance, please write to us at <a href="mailto:help@peko.one" style="color:#000000;text-decoration:underline;">help@peko.one</a>.<br /><br />Best regards,<br />Team ${branding}</div>
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

exports.airLineTicketTemplate = (data, templateDetails) => {
  const {
    flightDetails,
    inbountFlightDetails,
    totalFare,
    baseFare,
    bookedDate,
    pdfName,
    bookingIdLabel,
    bookingStatusMessage,
    passengersDetails,
    totalAncillaryAmount,
    taxAmount,
    transactionFee,
    surcharge,
    pnr,
    inbountPNR,
    lcc,
    isInternational,
  } = data;
  const isShowSeat = isSeatDataAvailable(passengersDetails)
  let passengerData = "";
  let inbountPassengerData = "";
  if (data) {
    passengerData = getPassengerDetails(passengersDetails, flightDetails, true);
    inbountPassengerData = getPassengerDetails(passengersDetails, inbountFlightDetails, false)
  }
  let journeyHtml = getJourneyHtml(flightDetails, pnr);
  let inbountJourney;
  if(inbountFlightDetails) {
    inbountJourney = getJourneyHtml(inbountFlightDetails, inbountPNR)
  }
  let breakPage =
    flightDetails.length > 1
      ? '<div style="page-break-before: always;"></div>'
      : "";

  // Important Information is assembled from conditional fragments keyed on route type
  // (domestic vs international) — no single hardcoded list.
  const branding = templateDetails?.branding || "Peko";
  const arrivalGuidance = isInternational
    ? "Please reach the airport at least 3 hours before departure. Check-in counters close 2 hours before departure (times may vary by airline)."
    : "Please reach the airport at least 2.5 hours before departure. Check-in counters close 2 hours before departure (times may vary by airline).";
  const idGuidance = isInternational
    ? "Carry a valid passport with at least 6 months validity, along with the relevant visa and immigration clearance for all travellers."
    : "Carry a valid government-issued photo ID (Aadhaar, PAN, Passport, Voter ID, or Driving Licence) for all travellers.";
  const importantInfoItems = [
    arrivalGuidance,
    "Cabin baggage must not exceed 7 kg; check-in allowance is as shown on this ticket.",
    "Web check-in opens 48 hours before departure on the airline website using the Airline PNR and passenger last name.",
    idGuidance,
    `Cancellation and date-change fees apply as per fare rules. Manage your booking at ${templateDetails?.baseUrl || "https://in.peko.one"} or via the ${branding} app.`,
    `Use your Confirmation Number for all communication with ${branding} about this booking.`,
    `Download your GST tax invoice from ${branding} > My Bookings.`,
  ];
  const importantInfoHtml = importantInfoItems
    .map(
      (item) =>
        `<li style="color: #000000; font-family: Inter, sans-serif; font-weight: 100;">${item}</li>`
    )
    .join("");

  return `
   <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <title>${pdfName}</title>
      <style>
          body {
              font-family: Roboto;
              background-color: #f3f3f3;
              margin: 0;
              padding: 0;
          }
  
          .root-container {
              width: 100%;
              max-width: 800px;
              padding-left: 50px;
              padding-right: 50px;
              padding-top: 1px;
              margin: 0 auto;
              background-color: white;
  
          }
  
          .form-title {
              font-family: 'Roboto', sans-serif;
              font-size: 30px;
              font-weight: 800;
  
          }
  
          .container {
              width: 100%;
              max-width: 800px;
              padding: 0px;
              margin: 0 auto;
              background-color: white;
              border-radius: 15px;
              border: 0.5px solid #DEDEDE;
              opacity: 1;
          }
  
          .hotel-address {
              font-size: 14px;
              margin-bottom: 0px;
              padding-left: 30px;
              font-weight: 400;
          }
  
          .hotel-checkout-section {
              display: table;
              width: 100%;
              margin-bottom: 20px;
              margin-top: 0%;
          }
  
          .day-plan {
              display: table-cell;
              text-align: center;
              padding: 10px;
          }
  
            .checkin-details-left {
             min-width: 210px;
              text-align: left;
              padding-left: 20px;
              font-family: Roboto, sans-serif;
              color: #171717;
          }
  
          .checkin-details-left span {
              font-size: 18px;
              font-weight: 400;
              display: block;
          }
  
          .checkin-details-left p {
              font-size: 22px;
              font-weight: 500;
              margin: 5px 0;
  
          }
  
          .checkin-details-left small {
              font-size: 14px;
              font-family: Roboto, sans-serif;
              color: #000000;
              margin-top: 6px;
              display: block;
              white-space: nowrap;
          }
  
          .checkin-details-right {
              min-width: 210px;
              text-align: right;
              padding-right: 20px;
              font-family: Roboto, sans-serif;
              color: #171717;
          }
  
          .checkin-details-right span {
              font-size: 18px;
              font-weight: 400;
              display: block;
          }
  
          .checkin-details-right p {
              font-size: 22px;
              font-weight: 500;
              margin: 5px 0;
  
          }
  
          .checkin-details-right small {
              font-size: 14px;
              font-family: Roboto, sans-serif;
              color: #000000;
              margin-top: 6px;
              display: block;
              white-space: nowrap;
          }
  
          .tag {
              border: 1px solid #c73c3c;
              padding: 5px 10px;
              border-radius: 4px;
              display: inline-block;
              font-size: 14px;
              margin-top: 20px;
          }
  
          .guest-info {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              margin-top: 40px;
          }
  
          .guest-detail {
              flex: 1;
              min-width: 200px;
              text-align: center;
              padding: 10px;
          }
  
          .guest-info div {
              flex: 1 1 calc(25% - 10px);
              text-align: center;
              margin: 0 5px;
          }
  
          .guest-info div p {
              margin: 5px 0;
          }
  
  
          .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 5px;
              margin-bottom: 5px;
          }
  
          .logo {
              margin-left: auto;
          }
  
          .logo img {
              width: 100px;
          }
  
  
  
          .flight-card {
              background-color: #ffffff;
              padding-left: 40px;
              padding-right: 20px;
              padding-top: 20px;
              padding-bottom: 10px;
              border-radius: 15px 15px 0 0;
              font-family: Inter, sans-serif;
              max-width: 100%;
              margin: auto;
              color: #333;
          }
  
          .title-card {
              background-color: #FFF7F7;
              padding-left: 40px;
              padding-right: 20px;
              padding-top: 20px;
              padding-bottom: 18px;
              border-radius: 15px 15px 0 0;
              font-family: Inter, sans-serif;
              max-width: 100%;
              margin: auto;
              color: #333;
          }
  
  
          .company-logo {
              float: left;
              width: 60px;
              height: 60px;
          }
  
  
          .class-type {
              font-size: 18px;
              font-weight: bold;
              color: #333;
          }
  
          .date {
              font-size: 14px;
              color: #555;
              font-weight: 600;
          }
  
          /* For alignment */
          .details-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 10px;
          }
  
          .id-section {
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
              gap: 20px;
          }
  
          .custom-hr {
              width: 100%;
              height: 0;
              border: 0.1px solid #000000;
              opacity: 0.20;
              margin: 0;
          }
  
          .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
          }
  
          .date-details {
              padding-top: 15px;
              padding-bottom: 15px;
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
              font-weight: 500;
              line-height: 11.72px;
              text-align: left;
          }
  
          .baggage-details {
  
              padding-left: 30px;
              padding-bottom: 15px;
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
              font-weight: 100;
              line-height: 11.72px;
              text-align: left;
              color: #898989;
              font-family: Inter, sans-serif;
          }
            .marketed {
            font-size: 13px;
            font-weight: 100;
            line-height: 11.72px;
            text-align: left;
            color: #898989;
            font-family: Inter, sans-serif;
        }
  
          .flight-name {
              font-size: 18px;
              font-family: Inter, sans-serif;
              font-weight: 200;
              /* background-color: #FFF7F7; */
              color: #000000;
              padding-left: 0px;
              padding-top: 10px;
              padding-bottom: 10px;
              border-radius: 15px 15px 0px 0px;
          }
  
          .economy-class {
              font-size: 13px;
              font-family: Inter, sans-serif;
              font-weight: 200;
  
              padding-top: 2px;
              padding-bottom: 2px;
              padding-left: 5px;
              padding-right: 5px;
  
              color: #000000;
              background-color: #FFF7F7;
              border-radius: 15px;
              white-space: nowrap;
          }
  
          .info-section span {
              margin-left: 10px;
          }
  
          .guest-header {
              padding-left: 25px;
              font-family: Inter, sans-serif;
              font-size: 12.88px;
              font-weight: 600;
              line-height: 10.17px;
              text-align: left;
          }
  
          .room-details {
              color: #000000;
              font-family: Inter, sans-serif;
              font-weight: 300;
              line-height: 10.32px;
              text-align: left;
          }
  
  
          .about-title {
              padding-left: 35px;
              padding-top: 25px;
              padding-bottom: 20px;
              font-family: 'Roboto', sans-serif;
              font-weight: 500;
              font-size: 16px;
              color: #000000;
          }
  
          .bullet-list {
              padding-left: 50px;
              padding-right: 10px;
              padding-bottom: 18px;
              font-family: 'Inter', sans-serif;
              font-size: 13px;
              font-weight: 400;
              color: #000000;
              text-align: left;
          }
  
          .bullet-list li {
              margin-bottom: 5px !important;
              /* Increase space between each bullet item */
              line-height: 1.8 !important;
              /* Adjust line height for additional spacing within each bullet */
              color: #000000;
              font-family: 'Inter', sans-serif;
              font-weight: 200;
          }
  
          .bullet-list li strong {
              font-weight: 200;
          }
  
          .footer-layout {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              font-family: 'Inter', sans-serif;
              padding-top: 10px;
              padding-bottom: 10px;
  
          }
  
          .table-layout {
              width: 100%;
              margin-bottom: 0px;
              border: none;
              border-radius: 14px;
              overflow: hidden
          }
  
  
          .table-layout td {
              padding: 10px 15px;
          }
  
          .flight-cardbox {
              width: 100%;
              margin-bottom: 0px;
              border: none;
              border-radius: 14px;
              overflow: hidden
          }
  
  
          .flight-cardbox td {
              padding-top: 0px;
              padding-bottom: 10px;
          }
  
          table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0px;
          }
  
          table,
          th,
          td {
              border: 1px solid #ddd;
          }
  
          th,
          td {
              padding: 0px;
              text-align: left;
              border: none;
          }
  
          .details-section {
              margin: 20px 0;
          }
  
          .border-table td {
              padding: 10px;
              border: 1px solid #ddd;
          }
  
          .details-table .header {
              background-color: #f7f7f7;
              font-weight: bold;
          }
  
          .fare-breakup-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
          }
  
          .fare-breakup-table div {
              margin-bottom: 8px;
          }
  
          .fare-breakup-table td {
              padding: 10px;
              border: 1px solid #ddd;
          }
  
          .fare-breakup-table .header {
              background-color: #f7f7f7;
              font-weight: bold;
          }
  
  
          .guest-details {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              font-family: Roboto;
              padding: 8px;
  
          }
  
          .fare-items {
              margin: 0;
              padding-left: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              font-family: Roboto;
          }
  
          .inline-header {
              display: inline;
              margin-right: 10px;
              font-size: 20px;
              font-family: Inter, sans-serif;
              font-weight: 400;
              line-height: 10.32px;
              text-align: left;
          }
  
          .inline-text {
              display: inline;
              margin: 0;
              color: #000000;
          }
  
          .farebreakup-layout {
              width: 100%;
              margin-top: 10px;
              margin-bottom: 20px;
              border: none;
          }
  
          .farebreakup-layout td {
              padding: 10px 15px;
          }
  
  
  
          .guest-details span {
              margin-right: 10px;
          }
  
          .footer {
              margin-top: 30px;
          }
  
          .footer p {
              font-size: 12px;
              color: #777;
              margin: 5px 0;
          }
  
          .footer h4 {
              margin: 10px 0;
          }
  
          .footer ul {
              padding-left: 20px;
              margin: 10px 0;
          }
  
          .footer ul li {
              margin: 5px 0;
              color: #555;
          }
  
  
          .fare-item2 {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 16px;
              padding: 8px;
          }
  
          .fare-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 16px;
  
          }
  
          .fare-item2 span {
              margin-right: 5px;
          }
  
          .fare-item2 strong {
              margin-left: 0;
          }
  
          .flight-details-container {
              display: flex;
              align-items: center;
              /* gap: 20px; */
  
          }
  
          .flight-details {
              font-family: Inter, sans-serif;
              font-size: 14px;
              font-weight: 400;
              padding-left: 0px;
              color: #898989;
          }
      </style>
  </head>
  
  <body>
      
      <div class="root-container">
          <div class="header">
              <p class="form-title">Ticket Confirmation</p>
              <div class="logo">
                  <img src="${templateDetails?.logo}" alt="Peko">
              </div>
          </div>

          <div class="id-section">
              <span><strong> ${bookingIdLabel}</strong></span>
          </div>
          <hr class="custom-hr">
          <div class="date-details">
              <span>Booking Status : ${bookingStatusMessage}</span>
              <span>Booked on: ${bookedDate}</span>
          </div>

          ${journeyHtml}
          ${breakPage}
          <div class="container" style="margin-top: 20px;">
              <table class="table-layout">
                  <thead class="room-details">
                      <tr style="background-color: #f2f2f2; ">
                          <th
                              style="padding-left: 25px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                              TRAVELLERS
                          </th>
                          ${
                            !lcc ?
                                `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                TICKET NUMBER</th>`
                            : 
                                ""
                          }
                          ${
                            isShowSeat ?
                                `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                SEAT</th>`
                            : 
                                ""
                          }
                          <th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                              Pax ID</th>
                      </tr>
  
                  </thead>
                  <tbody>
                        ${passengerData}
                  </tbody>
              </table>
          </div>

          <div style="margin-top: 20px;"/>
          ${
            inbountJourney ? 
            `
                ${inbountJourney} 
                ${breakPage}
                <div class="container" style="margin-top: 20px;">
                    <table class="table-layout">
                        <thead class="room-details">
                            <tr style="background-color: #f2f2f2; ">
                                <th
                                    style="padding-left: 25px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                    TRAVELLERS
                                </th>
                                ${
                                    !lcc ?
                                        `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                        TICKET NUMBER</th>`
                                    : 
                                        ""
                                }
                                ${
                                    isShowSeat ?
                                        `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                        SEAT</th>`
                                    : 
                                        ""
                                }
                                <th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                    Pax ID</th>
                            </tr>
        
                        </thead>
                        <tbody>
                                ${inbountPassengerData}
                        </tbody>
                    </table>
                </div>
            ` : ""
          }

  
          <div class="container" style="padding-top: 10px; margin-top: 15px;">
  
              <p style="font-weight:600; font-family: Inter, sans-serif; padding-left: 25px;">
                  FARE BREAKUP
              </p>
  
              <table class="farebreakup-layout ">
                  <tr>
  
                      <td>
                          <div class="fare-items">
                              <span>Base Fare:</span>
                              <strong>₹ ${baseFare}</strong>
                          </div>
                      </td>
                    
                      <td>
                          <div class="fare-items">
                              <span>Taxes and fees</span>
                              <strong>₹ ${taxAmount}</strong>
                          </div>
                      </td>
                       <td>
                          <div class="fare-items">
                              <span>Other Charges:</span>
                              <strong>₹ ${transactionFee}</strong>
                          </div>
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <div class="fare-items">
                              <span>Total Ancillary:</span>
                              <strong>₹ ${totalAncillaryAmount}</strong>
                          </div>
                      </td>
                      <td>
                          <div class="fare-items">
                              <span>Platform Fee:</span>
                              <strong>₹  ${surcharge}</strong>
                          </div>
                      </td>
                     
                      <td>
                          <div class="fare-items">
                              <span> Total Fare:</span>
                              <strong>₹  ${totalFare}</strong>
                          </div>
                      </td>
                  </tr>
              </table>
          </div>
  
          <div class="footer">
  
  
              <div class="container">
                  <p
                      style="padding-left: 35px; padding-top: 25px; padding-bottom: 10px;  font-family: Roboto; font-weight: 500; font-size: 16px; color: #000000;">
                     IMPORTANT INFORMATION</p>
                  <ul class="bullet-list"
                      style="padding-left: 50px; padding-right: 10px; padding-bottom: 20px; font-family: Inter, sans-serif; font-size: 13px; font-weight: 400;color: #000000; text-align: left;">
                      ${importantInfoHtml}
                  </ul>
              </div>
          </div>
  
      </div>
  </body>
  
  </html>
    `;
  function getPassengerDetails(passengers, ticketDocument, isOutbount) {
    let passengersHtml = "";
    passengers.forEach((person) => {
        let seatCode; 
        const seats = isOutbount ? person?.seat : person?.inbountSeat;
        if(seats){
            seatCode = seats.map( curr => curr.Code).join(", ")
        }

      passengersHtml += `
      <tr>
      <td>
        <div class="row">
          <div class="col-1">
            <i class="bi bi-person"></i>
          </div>
          <div class="col-11">
            <div style='padding-left:15px; padding-top:0px'>
                ${ person?.name}
            </div>
            ${ isInternational ? `<div style='padding-top: 10px; padding-bottom:0px; padding-left:15px; font-weight:100; font-size: 12px; font-family: Inter, sans-serif;' >Passport No. <span>
                ${person?.passport || "NA"}
            </span> </div>` : '' }
          </div>
        </div>
      </td>
      ${ !lcc ? `<td>${person?.ticket}</td>` : ''}
      ${ isShowSeat ? `<td>${seatCode ? `Seat ${seatCode}`:  "NA" }</td>` : ''}
      <td style='padding-left:18px'>${person?.pnr}</td>
      </tr>
        `;
    });

    return passengersHtml;
  }

  function getJourneyHtml(data, pnr) {
    let journeyHtml = "";
    try {
        data.forEach((journey) => {
            const { onPoint, offPoint, flightSegments, startDate } = journey;
            let segmentHtml = "";
            flightSegments.forEach((segment, j) => {
                const {
                    airlineLogo,
                    operatingAirline,
                    marketingAirlineName,
                    flightNumber,
                    airlineName,
                    cabinClass,
                    departure,
                    duration,
                    arrival,
                    carryOnBaggage,
                    checkedInBaggage,
                    aircraftType,
                    layOver,
                } = segment;
                const {
                    departureAirportCode,
                    departureTime,
                    departureDate,
                    departureCountry,
                    departureCity,
                    departureTerminal,
                } = departure;
                const {
                    arrivalAirportCode,
                    arrivalTime,
                    arrivalDate,
                    arrivalCountry,
                    arrivalCity,
                    arrivalTerminal,
                } = arrival;
                const checkedInBaggageHtml = `
                    <span style="margin-right: 10px;">Check-in Baggage:
                        <strong style="color: #000000; font-weight: 200;">${checkedInBaggage}</strong>
                    </span>
                    `;

                const carryOnBaggageHtml = `
                    <span style="margin-right: 10px;">Cabin Baggage:
                        <strong style="color: #000000; font-weight: 200;">${carryOnBaggage}</strong>
                    </span>
                    `;

                const nextSegment = flightSegments[j + 1];
                let layoverHTML = '';
                if(nextSegment) {
                    layoverHTML = `
                        <div style="display: flex; justify-content: center; margin-block: 10px">
                            ${nextSegment.groundTime} Layover in ${nextSegment.departure.departureAirportName}, ${nextSegment.departure.departureCountry}
                        </div>
                    `
                }

                segmentHtml += `
                    <div style="font-family: Arial, sans-serif;">
                        <table class="flight-cardbox">
                            <tr>
                                <!-- Logo Section -->
                                <td 
                                    style="min-width: 200px;padding-left: 30px; padding-right: 30px; padding-top: 0px;   text-align: center; border: none; vertical-align: top;">
                                    <div style="display: flex; flex-direction: column; align-items: center;">
                                        <!-- Logo Section -->
                                        <div style="padding-top: 30px; padding-left: 30px; padding-right: 30px;">
                                            <img src="${airlineLogo}"
                                                alt="Logo" class="company-logo" style="max-width: 100%; height: auto;" />
                                        </div>

                                        <!-- Flight Details -->
                                        <div class="flight-details" style="margin-top: 10px; font-size: 11px; color: #333;">
                                            ${operatingAirline}-${flightNumber}${aircraftType ? ` Aircraft: ${aircraftType}` : ""}
                                        </div>

                                        <!-- Flight Name -->
                                        <div class="flight-name" style="font-size: 16px; color: #333;">
                                            ${airlineName}
                                        </div>
                                        <div class="economy-class"
                                            style="font-size: 12px; color: #FF3A3A; background-color: #FFF7F7; ">
                                            ${cabinClass} Class
                                        </div>
                                    </div>
                                </td>
                                <!-- Check-In Details Left -->
                                <td class="checkin-details-left">
                                    <span>${departureDate}</span>
                                    <p>${departureAirportCode} ${departureTime} </p>
                                    <small>${departureCity}, ${departureCountry}</small>
                                    <small>${departureTerminal} &nbsp;</small>
                                </td>

                                <!-- Day Plan Section -->
                                <td
                            style="padding-bottom: 20px; width: 25%; text-align: center; ">
                                    <div style="display: inline-block;">
                                        <svg width="25" height="25" viewBox="0 0 15 15" fill="none"
                                            xmlns="http://www.w3.org/2000/svg"> 
                                            <rect width="15" height="15" rx="7.5" fill="#FF4F4F" />
                                            <path
                                                d="M7.08497 6.65627L4.74684 4.44881L5.24296 4.1594L8.44011 5.95191L8.48715 5.97828L8.53373 5.95111L10.3255 4.9059C10.4398 4.83919 10.5573 4.82311 10.6835 4.85631C10.8097 4.88952 10.9038 4.96127 10.9702 5.07543L10.9702 5.07556C11.037 5.18992 11.053 5.3074 11.0198 5.43359C10.9866 5.55978 10.9149 5.6539 10.8007 5.72025L10.8006 5.72033L9.00882 6.76554L8.96224 6.79271L8.96205 6.84664L8.9487 10.512L8.45258 10.8014L7.6819 7.67955L7.65169 7.55721L7.54285 7.62071L5.75109 8.66592L5.71037 8.68967L5.70494 8.7365L5.60179 9.62628L5.26182 9.82459L4.95336 8.61547L4.9467 8.58937L4.92726 8.57072L4.02657 7.70707L4.36654 7.50875L5.19184 7.85692L5.23528 7.87524L5.276 7.85149L7.06775 6.80628L7.1766 6.74278L7.08497 6.65627Z"
                                                fill="white" stroke="white" stroke-width="0.188575" />
                                        </svg>
                                    </div>
                                    <p
                                        style="font-weight: 600; font-family: Inter, sans-serif; font-size: 14px; color: #333;   white-space: nowrap;">
                                        ${duration}</p>
                                </td>

                                <!-- Check-In Details Right -->
                                <td class="checkin-details-right" style="padding-right: 30px; text-align:right">
                                    <span>${arrivalDate}</span>
                                    <p>${arrivalAirportCode} ${arrivalTime} </p>
                                    <small>${arrivalCity}, ${arrivalCountry}</small>
                                    <small>${arrivalTerminal} &nbsp;</small>

                                </td>


                            </tr>
                        </table>

                    <div  style="justify-content: space-between; display: flex;" >
                        <div  class="baggage-details">
                            ${carryOnBaggageHtml}
                            ${checkedInBaggageHtml}
                        </div>
                        <span style="margin-right: 30px;" class="marketed">Marketed by:
                            <strong style="color: #000000; font-weight: 200;">${
                            marketingAirlineName || "N/A"
                            }</strong>
                        </span>
                    </div>
                    </div>
                    
                    ${layoverHTML}
                    `;
            if (layOver.status === true) {
                segmentHtml += `
                    <div style="display: flex; align-items: center; margin:0 25px ; ">
                        <hr style="flex-grow: 1; border: none; border-top: 1px dashed #ddd; margin: 0;" />
                        <span style="padding: 0 10px; font-weight: 100; font-size: 15px;  color: #898989;"> ${layOver?.layOver}</span>
                        <hr style="flex-grow: 1; border: none; border-top: 1px dashed #ddd; margin: 0;" />
                    </div>`;
            }
        });

        journeyHtml += `
            <div class="container" style="margin-bottom: 10px;">
                  <div class="title-card">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <span
                                style="font-size: 18px; font-weight: 400; font-family: Inter, sans-serif; margin-right: 10px; color: #000000;">
                                ${onPoint} - ${offPoint}
                            </span>
                            <strong style="margin-left: 0; font-family: Inter, sans-serif; font-weight: 300; font-size: 14px">•
                                ${startDate}
                            </strong>
                        </div>
                        <div>
                            <span
                                style="font-size: 18px; font-weight: 400; font-family: Inter, sans-serif; margin-right: 10px; color: #000000;">
                                Airline PNR:
                            </span>
                            <strong style="font-size: 18px; margin-left: 0; font-family: Inter, sans-serif; font-weight: 600; color: #000000;">
                                ${pnr}
                            </strong>

                        </div>
                    </div>
                  </div>
                  <hr style="border: none; border-top: 1px solid #ccc; width: 100%; margin: 0;">
                  <!-- </div> -->
                  ${segmentHtml}
            </div>
          `;
      });
      return journeyHtml;
    } catch (error) {
      console.log("Error in getJourneyHtml", { error });
      return journeyHtml;
    }
  }

  function isSeatDataAvailable(passengers) {
    return passengers.some( (passenger) => passenger.seat)
  }
};



//Generate email template for Invoice email send on corporate side
exports.generateAirlineTicketAndSendToMail = (data) => {
  return `
  
  <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  
  <head>
    <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <title></title>
  
    <style type="text/css">
      @media only screen and (min-width: 620px) {
        .u-row {
          width: 600px !important;
        }
        .u-row .u-col {
          vertical-align: top;
        }
        .u-row .u-col-100 {
          width: 600px !important;
        }
      }
      
      @media (max-width: 620px) {
        .u-row-container {
          max-width: 100% !important;
          padding-left: 0px !important;
          padding-right: 0px !important;
        }
        .u-row .u-col {
          min-width: 320px !important;
          max-width: 100% !important;
          display: block !important;
        }
        .u-row {
          width: calc(100% - 40px) !important;
        }
        .u-col {
          width: 100% !important;
        }
        .u-col>div {
          margin: 0 auto;
        }
      }
      
      body {
        margin: 0;
        padding: 0;
      }
      
      table,
      tr,
      td {
        vertical-align: top;
        border-collapse: collapse;
      }
      
      p {
        margin: 0;
      }
      
      .ie-container table,
      .mso-container table {
        table-layout: fixed;
      }
      
      * {
        line-height: inherit;
      }
      
      a[x-apple-data-detectors='true'] {
        color: inherit !important;
        text-decoration: none !important;
      }
      
      table,
      td {
        color: #000000;
      }
    </style>
  
  
  
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
    <!--<![endif]-->
  
  </head>
  
  <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
    <!--[if IE]><div class="ie-container"><![endif]-->
    <!--[if mso]><div class="mso-container"><![endif]-->
    <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr style="vertical-align: top">
          <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
  
  
            <div class="u-row-container" style="padding: 0px;background-color: transparent">
              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
  
                  <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                    <div style="height: 100%;width: 100% !important;">
                      <!--[if (!mso)&(!IE)]><!-->
                      <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                        <!--<![endif]-->
  
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
  
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-right: 0px;padding-left: 0px;" align="center">
  
                                      <img align="center" border="0" src="https://assets.unlayer.com/projects/110176/1666981836761-Peko%20230x400-01.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                        width="179.2" />
  
                                    </td>
                                  </tr>
                                </table>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
  
                        <!--[if (!mso)&(!IE)]><!-->
                      </div>
                      <!--<![endif]-->
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td><![endif]-->
                  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                </div>
              </div>
            </div>
  
  
  
            <div class="u-row-container" style="padding: 0px;background-color: transparent">
              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
  
                  <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                    <div style="background-color: #242222;height: 100%;width: 100% !important;">
                      <!--[if (!mso)&(!IE)]><!-->
                      <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                        <!--<![endif]-->
  
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
  
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding-right: 0px;padding-left: 0px;" align="center">
  
                                      <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                        width="150.8" />
                                    </td>
                                  </tr>
                                </table>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
  
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 140%;"><strong>AIRLINE&nbsp; &nbsp;TICKET&nbsp;</strong></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
  
                        <!--[if (!mso)&(!IE)]><!-->
                      </div>
                      <!--<![endif]-->
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td><![endif]-->
                  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                </div>
              </div>
            </div>
  
  
  
            <div class="u-row-container" style="padding: 0px;background-color: transparent">
              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
  
                  <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                    <div style="height: 100%;width: 100% !important;">
                      <!--[if (!mso)&(!IE)]><!-->
                      <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                        <!--<![endif]-->
  
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Hi, ${data.user} </span></p>
                                  <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">Thank you for choosing Peko.</span></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">

                              <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">We are pleased to provide you with your confirmed airline ticket. Attached to this email, you will find all the necessary details and information regarding your flight reservation.</span></p>
                              </div>

                            </td>
                          </tr>
                        </tbody>
                      </table>
                      
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                  <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                  <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Peko Team</span></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
  
                        <!--[if (!mso)&(!IE)]><!-->
                      </div>
                      <!--<![endif]-->
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td><![endif]-->
                  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                </div>
              </div>
            </div>
  
  
  
            <div class="u-row-container" style="padding: 0px;background-color: transparent">
              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
  
                  <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                    <div style="background-color: #242222;height: 100%;width: 100% !important;">
                      <!--[if (!mso)&(!IE)]><!-->
                      <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                        <!--<![endif]-->
  
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="color: #1e1e20; line-height: 160%; text-align: center; word-wrap: break-word;">
                                  <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 16px; line-height: 25.6px; color: #ecf0f1;">This is an autogenerated mail, please don't reply</span></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
  
                        <!--[if (!mso)&(!IE)]><!-->
                      </div>
                      <!--<![endif]-->
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td><![endif]-->
                  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                </div>
              </div>
            </div>
  
  
  
            <div class="u-row-container" style="padding: 0px;background-color: transparent">
              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
  
                  <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                    <div style="background-color: #242222;height: 100%;width: 100% !important;">
                      <!--[if (!mso)&(!IE)]><!-->
                      <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                        <!--<![endif]-->
  
                        <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyright ${new Date().getUTCFullYear()} Peko Platforms Private Limited,. All Rights Reserved</span></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
  
                        <!--[if (!mso)&(!IE)]><!-->
                      </div>
                      <!--<![endif]-->
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td><![endif]-->
                  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                </div>
              </div>
            </div>
  
  
            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
          </td>
        </tr>
      </tbody>
    </table>
    <!--[if mso]></div><![endif]-->
    <!--[if IE]></div><![endif]-->
  </body>
  
  </html>

  `;
};


exports.generateSubscriptionSuccessEmail = (name, transactionId, amount, planData) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="padding:0;Margin:0"><head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>Subscription Succesful</title><!--[if (mso 16)]> <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"><!--<![endif]--> <style type="text/css"> #outlook a { padding: 0; } .ExternalClass { width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } .es-button { mso-style-priority: 100 !important; text-decoration: none !important; transition: all 100ms ease-in; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .es-button:hover { background: #555555 !important; border-color: #555555 !important; } .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; } @media only screen and (max-width:600px) { .customForMobile { text-align-last: start; } p, ul li, ol li, a { line-height: 150% !important } h1, h2, h3, h1 a, h2 a, h3 a { line-height: 120% !important } h1 { font-size: 30px !important; text-align: center } h2 { font-size: 26px !important; text-align: left } h3 { font-size: 20px !important; text-align: left } h1 a { text-align: center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size: 30px !important } h2 a { text-align: left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size: 20px !important } h3 a { text-align: left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size: 20px !important } .es-menu td a { font-size: 16px !important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size: 16px !important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size: 17px !important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size: 17px !important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size: 12px !important } *[class="gmail-fix"] { display: none !important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align: center !important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align: right !important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align: left !important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display: inline !important } .es-button-border { display: inline-block !important } a.es-button, button.es-button { font-size: 14px !important; display: inline-block !important; padding: 15px 25px 15px 25px !important } .es-btn-fw { border-width: 10px 0px !important; text-align: center !important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width: 100% !important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important } .es-adapt-td { display: block !important; width: 100% !important } .adapt-img { width: 100% !important; height: auto !important } .es-m-p0 { padding: 0px !important } .es-m-p0r { padding-right: 0px !important } .es-m-p0l { padding-left: 0px !important } .es-m-p0t { padding-top: 0px !important } .es-m-p0b { padding-bottom: 0 !important } .es-m-p20b { padding-bottom: 20px !important } .es-mobile-hidden, .es-hidden { display: none !important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width: auto !important; overflow: visible !important; float: none !important; max-height: inherit !important; line-height: inherit !important } tr.es-desk-hidden { display: table-row !important } table.es-desk-hidden { display: table !important } td.es-desk-menu-hidden { display: table-cell !important } .es-menu td { width: 1% !important } table.es-table-not-adapt, .esd-block-html table { width: auto !important } table.es-social { display: inline-block !important } table.es-social td { display: inline-block !important } .es-desk-hidden { display: table-row !important; width: auto !important; overflow: visible !important; max-height: inherit !important } } </style></head><body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> <div class="es-wrapper-color" style="background-color:#F1F1F1"><!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"><v:fill type="tile" color="#f1f1f1"></v:fill></v:background><![endif]--> <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1F1F1"> <tr style="border-collapse:collapse"> <td valign="top" style="padding:0;Margin:0"> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#333333;width:600px" cellspacing="0" cellpadding="0" bgcolor="#333333" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#020101" style="padding:0;Margin:0;padding-left:20px;padding-right:35px;background-color:#020101;border-radius:5px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:545px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#fef7f7;font-size:20px"> <br></p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td class="es-m-txt-c" align="center" style="padding:0;Margin:0;padding-bottom:15px;padding-top:20px"> <h2 style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#0a9f43"> Subscription is Purchased</h2> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Hi ${name},</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br>We are delighted to inform you that your recent payment of ${amount} for your ${planData.software.name} - ${planData.name} subscription has been successfully processed. Your subscription ${planData.software.name} - ${planData.name} is now active.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Wishing you a rewarding and enjoyable experience with our service. If you have any questions or need assistance, please don't hesitate to contact us at reach@peko.one</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Best Regards,</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Peko</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br></p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#efefef"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#333333;font-size:18px"> <strong>Transaction Details</strong></p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table class="customForMobile" cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Date &amp; Time</p> </td> </tr> </table> </td> </tr> </table> <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}</p> </td> </tr> </table> </td> </tr> </table><!--[if mso]></td></tr></table><![endif]--> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Transaction ID:</p> </td> </tr> </table> </td> </tr> </table> <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> ${transactionId}</p> </td> </tr> </table> </td> </tr> </table><!--[if mso]></td></tr></table><![endif]--> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Service :</p> </td> </tr> </table> </td> </tr> </table> <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Subscriptions</p> </td> </tr> </table> </td> </tr> </table><!--[if mso]></td></tr></table><![endif]--> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:30px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Amount Paid</p> </td> </tr> </table> </td> </tr> </table> <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> INR ${amount}</p> </td> </tr> </table> </td> </tr> </table><!--[if mso]></td></tr></table><![endif]--> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:15px;padding-left:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#464646;font-size:18px"> <strong>${planData.software.name}</strong></p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px;display: flex;"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:15px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="${planData.software.image}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" height="111" width="110"></td> </tr> </table> </td> </tr> </table> <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Current payment plan: <strong>INR ${parseInt(planData.price / planData.validity)}/mo</strong></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Licences: <strong>1 Licence</strong> <br> Licence Key: <strong>Your serial key will be emailed to the registered email id in 2-3 hours</strong> <!-- <br>Billing Cycle: <strong>Yearly</strong> --> <br>Company : <strong>${name}</strong></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px;display:none"> <br></p> </td> </tr> </table> </td> </tr> </table><!--[if mso]></td></tr></table><![endif]--> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:40px;Margin:0;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img class="adapt-img" src="" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="110" height="35"></a></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> This email was sent to you from company email address</p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> <a href="https://peko.one/in/privacy-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a> </p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#292828;width:600px" cellspacing="0" cellpadding="0" bgcolor="#292828" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#0c0c0c" style="Margin:0;padding-top:15px;padding-bottom:20px;padding-left:40px;padding-right:40px;background-color:#0c0c0c"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px"> <a href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:15px" target="_blank">www.peko.one</a></p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px"> <br></p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0"> <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://x.com/PekoIndia" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Twitter" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d" alt="Tw" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a> </td> <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://www.instagram.com/peko.india" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Instagram" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026" alt="Inst" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a> </td> <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank" href="https://www.linkedin.com/company/pekoindia/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Linkedin" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd" alt="In" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </div></body></html>`;
};

exports.generatePaymentSuccessEmailWorkspaces = (transactionId, amount, orderResponse) => {
  let planDetails = orderResponse.planDetails
  let bookDetails = orderResponse.bookingDetails
  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0"><head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>Peko</title> <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;} </style><![endif]--> <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--> <!--[if !mso]><!-- --> <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"> <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet"> <!--<![endif]--> <style type="text/css"> #outlook a { padding: 0; } .ExternalClass { width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } .es-button { mso-style-priority: 100 !important; text-decoration: none !important; transition: all 100ms ease-in; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .es-button:hover { background: #555555 !important; border-color: #555555 !important; } .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; } @media only screen and (max-width:600px) { p, ul li, ol li, a { line-height: 150% !important } h1, h2, h3, h1 a, h2 a, h3 a { line-height: 120% !important } h1 { font-size: 30px !important; text-align: center } h2 { font-size: 26px !important; text-align: left } h3 { font-size: 20px !important; text-align: left } h1 a { text-align: center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size: 30px !important } h2 a { text-align: left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size: 20px !important } h3 a { text-align: left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size: 20px !important } .es-menu td a { font-size: 16px !important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size: 16px !important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size: 17px !important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size: 17px !important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size: 12px !important } *[class="gmail-fix"] { display: none !important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align: center !important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align: right !important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align: left !important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display: inline !important } .es-button-border { display: inline-block !important } a.es-button, button.es-button { font-size: 14px !important; display: inline-block !important; padding: 15px 25px 15px 25px !important } .es-btn-fw { border-width: 10px 0px !important; text-align: center !important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width: 100% !important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important } .es-adapt-td { display: block !important; width: 100% !important } .adapt-img { width: 100% !important; height: auto !important } .es-m-p0 { padding: 0px !important } .es-m-p0r { padding-right: 0px !important } .es-m-p0l { padding-left: 0px !important } .es-m-p0t { padding-top: 0px !important } .es-m-p0b { padding-bottom: 0 !important } .es-m-p20b { padding-bottom: 20px !important } .es-mobile-hidden, .es-hidden { display: none !important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width: auto !important; overflow: visible !important; float: none !important; max-height: inherit !important; line-height: inherit !important } tr.es-desk-hidden { display: table-row !important } table.es-desk-hidden { display: table !important } td.es-desk-menu-hidden { display: table-cell !important } .es-menu td { width: 1% !important } table.es-table-not-adapt, .esd-block-html table { width: auto !important } table.es-social { display: inline-block !important } table.es-social td { display: inline-block !important } .es-desk-hidden { display: table-row !important; width: auto !important; overflow: visible !important; max-height: inherit !important } .h-auto { height: auto !important } } @media screen and (max-width:384px) { .mail-message-content { width: 414px !important } } </style></head><body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F1F1F1"> <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f1f1f1"></v:fill> </v:background><![endif]--> <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1F1F1"> <tr style="border-collapse:collapse"> <td valign="top" style="padding:0;Margin:0"> <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:710px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-left:25px;padding-top:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:645px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://gxphmw.stripocdn.email/content/guids/CABINET_360c2d05d66d1afd304e6c6760eb1c1c6bd03191ba0ac3d8fdb620f45388db28/images/123333.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="255" height="134"></td> </tr> </table> </td> </tr> </table> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:630px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"> <h2 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#010201;text-align:left"> Booking Successfull</h2> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> Greetings,</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> Thank you for choosing Peko.one! We appreciate your booking and will send a confirmation once it is confirmed. To view your booking , please visit 'Workspace' on your corporate panel.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br> </p> </td> </tr> <table style="font-family:'Cabin',sans-serif;border: 1px solid #ddd;padding: 10px;width: 100%;text-align:center;"> <thead style="background-color: #f5f5f5;"> <tr> <th style="font-size: 21px;font-weight: 600;padding:20px;text-align: center;" colspan="2">Booking Summary</th> </tr> </thead> <tbody> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Order</td> <td style="padding:15px;font-size: 14px;" align="left">${transactionId}</td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Placed On</td> <td style="padding:15px;font-size: 14px;" align="left">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")} </td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Total Price</td> <td style="padding:15px;font-size: 14px;" align="left">${amount} INR</td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Plan Name</td> <td style="padding:15px;font-size: 14px;" align="left">${planDetails.name}</td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Plan Price</td> <td style="padding:15px;font-size: 14px;" align="left"> ${parseFloat(planDetails.price)} INR/yr</td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Plan Details</td> <td style="padding:15px;font-size: 14px;" align="left">${planDetails.description}</td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Workspace Name</td> <td style="padding:15px;font-size: 14px;" align="left">${bookDetails.name}</td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Workspace Price</td> <td style="padding:15px;font-size: 14px;" align="left"> ${parseFloat(bookDetails.monthlyPrice)} INR/month</td> </tr> <tr> <td style="font-weight:lighter;padding:15px;font-size: 14px;" align="left">Workspace Address</td> <td style="padding:15px;font-size: 14px;" align="left">${bookDetails.address}</td> </tr> </tbody> </table> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> We are here to assist you. If you have any questions or need further assistance, please don't hesitate to contact our support team.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Best Regards,</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Team Peko</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:710px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:25px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:645px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="136" height="55"></td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:710px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:10px;Margin:0;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:690px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> This email was sent to you from company email address</p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> <a href="https://peko.one/in/privacy-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a> </p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> © ${new Date().getUTCFullYear()} Peko, All Rights Reserved</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> <br> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </div></body></html>
`}

exports.workspaceReminder = (url) => {
  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0"><head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>Peko</title> <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;} </style><![endif]--> <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--> <!--[if !mso]><!-- --> <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"> <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet"> <!--<![endif]--> <style type="text/css"> #outlook a { padding: 0; } .ExternalClass { width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } .es-button { mso-style-priority: 100 !important; text-decoration: none !important; transition: all 100ms ease-in; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .es-button:hover { background: #555555 !important; border-color: #555555 !important; } .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; } @media only screen and (max-width:600px) { p, ul li, ol li, a { line-height: 150% !important } h1, h2, h3, h1 a, h2 a, h3 a { line-height: 120% !important } h1 { font-size: 30px !important; text-align: center } h2 { font-size: 26px !important; text-align: left } h3 { font-size: 20px !important; text-align: left } h1 a { text-align: center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size: 30px !important } h2 a { text-align: left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size: 20px !important } h3 a { text-align: left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size: 20px !important } .es-menu td a { font-size: 16px !important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size: 16px !important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size: 17px !important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size: 17px !important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size: 12px !important } *[class="gmail-fix"] { display: none !important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align: center !important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align: right !important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align: left !important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display: inline !important } .es-button-border { display: inline-block !important } a.es-button, button.es-button { font-size: 14px !important; display: inline-block !important; padding: 15px 25px 15px 25px !important } .es-btn-fw { border-width: 10px 0px !important; text-align: center !important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width: 100% !important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important } .es-adapt-td { display: block !important; width: 100% !important } .adapt-img { width: 100% !important; height: auto !important } .es-m-p0 { padding: 0px !important } .es-m-p0r { padding-right: 0px !important } .es-m-p0l { padding-left: 0px !important } .es-m-p0t { padding-top: 0px !important } .es-m-p0b { padding-bottom: 0 !important } .es-m-p20b { padding-bottom: 20px !important } .es-mobile-hidden, .es-hidden { display: none !important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width: auto !important; overflow: visible !important; float: none !important; max-height: inherit !important; line-height: inherit !important } tr.es-desk-hidden { display: table-row !important } table.es-desk-hidden { display: table !important } td.es-desk-menu-hidden { display: table-cell !important } .es-menu td { width: 1% !important } table.es-table-not-adapt, .esd-block-html table { width: auto !important } table.es-social { display: inline-block !important } table.es-social td { display: inline-block !important } .es-desk-hidden { display: table-row !important; width: auto !important; overflow: visible !important; max-height: inherit !important } .h-auto { height: auto !important } } @media screen and (max-width:384px) { .mail-message-content { width: 414px !important } } </style></head><body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F1F1F1"> <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f1f1f1"></v:fill> </v:background><![endif]--> <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1F1F1"> <tr style="border-collapse:collapse"> <td valign="top" style="padding:0;Margin:0"> <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:710px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-left:25px;padding-top:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:645px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://gxphmw.stripocdn.email/content/guids/CABINET_360c2d05d66d1afd304e6c6760eb1c1c6bd03191ba0ac3d8fdb620f45388db28/images/123333.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="255" height="134"></td> </tr> </table> </td> </tr> </table> </td> </tr> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:630px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"> <h2 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#010201;text-align:left"> Renew your office address</h2> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> Greetings,</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> This is a friendly reminder for your monthly renewal of your office space. Please ensure timely renewal to continue uninterrupted access to workspace facilities.<br><br>Thank you for your continued trust in our services.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:23px;color:#010201;font-size:15px"> <br> </p> </td> </tr> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><span class="msohide es-button-border" style="border-style:solid;border-color:#26A4D3;background:#ff4f4f;border-width:0px;display:inline-block;border-radius:53px;width:auto;mso-hide:all"><a href="${url}" class="es-button es-button-1695643055948" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;transition:all 100ms ease-in;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#ff4f4f;border-radius:53px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:17px;width:auto;text-align:center;padding:15px 40px;mso-padding-alt:0;mso-border-alt:10px solid #181818">Go to Office Address</a></span><!--<![endif]--></td> </tr> </table> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> We are here to assist you. If you have any questions or need further assistance, please don't hesitate to contact our support team.</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Best Regards,</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> Team Peko</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"> <br> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:710px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:25px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:645px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="136" height="55"></td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:710px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:10px;Margin:0;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:690px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> This email was sent to you from company email address</p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-bottom:10px"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> <a href="https://peko.one/in/privacy-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a> </p> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> © ${new Date().getUTCFullYear()} Peko, All Rights Reserved</p> <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"> <br> </p> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </div></body></html>
`}

exports.generatePaymentSuccessEmailLogistics = ({
  name,
  transactionId,
  speedOrNormal,
  sender,
  receiver,
  trackingNo,
  amount,
  qunatity,
  host,
}) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="padding:0;Margin:0"> <head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>Shipment Service</title><!--[if (mso 16)]> <style type="text/css"> a {text-decoration: none;} </style> <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> <![endif]--><!--[if !mso]><!-- --> <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"><!--<![endif]--> <style type="text/css"> #outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height:100%; } .es-button { mso-style-priority:100!important; text-decoration:none!important; transition:all 100ms ease-in; } a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important; } .es-button:hover { background:#555555!important; border-color:#555555!important; } .es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all; } @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h1 a { text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } h2 a { text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:20px!important } h3 a { text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:17px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:17px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:14px!important; display:inline-block!important; padding:15px 25px 15px 25px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } } </style> </head> <body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> <div class="es-wrapper-color" style="background-color:#F1F1F1"><!--[if gte mso 9]> <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f1f1f1"></v:fill> </v:background> <![endif]--> <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1F1F1"> <tr style="border-collapse:collapse"> <td valign="top" style="padding:0;Margin:0"> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#333333;width:600px" cellspacing="0" cellpadding="0" bgcolor="#333333" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#020101" style="padding:0;Margin:0;padding-left:20px;padding-right:35px;background-color:#020101;border-radius:5px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:545px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#fef7f7;font-size:20px"><br></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td class="es-m-txt-c" align="center" style="padding:0;Margin:0;padding-bottom:15px;padding-top:20px"><h2 style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#0a9f43">Your shipment is booked</h2></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Hi ${name},</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><br>Thank you for your order. Your estimated delivery date is indicated below.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">If you would like to view the status of your order or make any changes to it, please visit logistics on peko.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><br></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-bottom:5px;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#efefef"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#181818;font-size:20px"><strong>Order Summary</strong></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-bottom:10px;padding-top:20px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Placed on:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#666666;font-size:15px">Transaction ID:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${transactionId}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Service :</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">Shipment services</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Shipping Details:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${speedOrNormal} Parcel, ${sender.City
    } to ${receiver.City
    }</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Tracking No:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${trackingNo}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:20px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Paid Amount :</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">₹ ${amount}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:25px;padding-bottom:25px;padding-left:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><!--[if mso]><a href="" target="_blank" hidden> <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="" style="height:47px; v-text-anchor:middle; width:217px" arcsize="50%" stroke="f" fillcolor="#09090a"> <w:anchorlock></w:anchorlock> <center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:14px; font-weight:700; line-height:14px; mso-text-raise:1px'>Track your shipment</center> </v:roundrect></a> <![endif]--><!--[if !mso]><!-- --><span class="msohide es-button-border" style="border-style:solid;border-color:#26A4D3;background:#09090a;border-width:0px;display:inline-block;border-radius:50px;width:auto;mso-hide:all"><a href="${host}/logistics/track?trackingNo=${trackingNo}" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;transition:all 100ms ease-in;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#09090a;border-radius:50px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:17px;width:auto;text-align:center;padding:15px 30px 15px 30px;mso-padding-alt:0;mso-border-alt:10px solid #09090a">Track your shipment</a></span><!--<![endif]--></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#000000;font-size:15px"><strong>Parcel Details</strong></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-bottom:10px;padding-top:15px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p0r es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><strong>Shipper</strong></p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><strong>Receiver</strong></p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><b>Weight</b></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><b>Total Amount (INR)</b></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p0r es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${sender.Line1
    }</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${sender.Line2
    }</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${sender.PostCode
    }</p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${receiver.Line1
    }</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${receiver.Line2
    }<br>${receiver.PostCode
    }<br></p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${qunatity} Grams</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">₹ ${amount}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Service Type</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><strong>${speedOrNormal} Parcel</strong></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Additional Services</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">N/A</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-top:10px;padding-bottom:20px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#1e1b1b;font-size:15px"><strong>Total:</strong></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px"><strong>₹ ${amount}</strong></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:40px;Margin:0;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img class="adapt-img" src="" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="110" height="45"></a></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">This email was sent to you from company email address</p></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"><a href="https://peko.one/in/privacy-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a></p></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#292828;width:600px" cellspacing="0" cellpadding="0" bgcolor="#292828" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#0c0c0c" style="Margin:0;padding-top:15px;padding-bottom:20px;padding-left:40px;padding-right:40px;background-color:#0c0c0c"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px"><a href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:15px" target="_blank">www.peko.one</a></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px"><br></p></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0"> <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://x.com/PekoIndia" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Twitter" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d" alt="Tw" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td> <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://www.instagram.com/peko.india" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Instagram" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026" alt="Inst" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td> <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank" href="https://www.linkedin.com/company/pekoindia/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Linkedin" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd" alt="In" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> </div> </body> </html>`;
};