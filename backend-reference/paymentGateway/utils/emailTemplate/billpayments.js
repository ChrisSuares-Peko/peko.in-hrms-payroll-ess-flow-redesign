const { formatNumberWithLocalString } = require("../formatter");
const { v2Header, v2Footer, v2SuccessBadge, v2RejectBadge, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS } = require("./sharedLayout");

exports.generateMobilePaymentSuccessEmailBill = (serviceType, transactionId, amount, account, serviceProvider, type, name, partnerDetails, operator, params) => {
  const formatParamLabel = (label) => {
    if (!label || typeof label !== "string") return "Account";
    const normalized = label.replace(/[_-]/g, ' ').trim();
    const words = normalized.split(/\s+/);
    if (words.length === 1 && words[0].toLowerCase().endsWith('id')) {
      return words[0].slice(0, -2).charAt(0).toUpperCase() + words[0].slice(0, -2).slice(1).toLowerCase() + ' ID';
    }
    if (words.length >= 2 && words[words.length - 1].toLowerCase() === 'id') {
      return words.slice(0, -1).map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(' ') + ' ID';
    }
    return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(' ');
  };

  const formatServiceProvider = (name) => {
    if (!name || typeof name !== "string") return "Unknown Provider";
    if (name.toLowerCase() === "lpg cylinder") {
      return "LPG Cylinder";
    }
    const ACRONYMS = new Set([
      "ICICI", "HDFC", "SBI", "RBL", "IDBI", "IDFC", "BOB", "PNB", "IOB",
      "UCO", "AXIS", "HSBC", "OBC", "YES", "DCB", "BPCL", "HPCL", "IOCL", "BSES", "TATA",
    ]);
    return name.split(/\s+/).filter(Boolean).map(word => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(" ");
  };

  const isCreditCardBill = operator === "Credit Card";
  const heading = serviceType === "Recharge" ? "Mobile Recharge successful" : `${operator} Payment Successful`;
  // &nbsp; instead of CSS nowrap — mobile Gmail strips inline styles it doesn't like.
  const nowrap = (text) => String(text ?? "").replace(/ /g, "&nbsp;");
  const bodyLine = isCreditCardBill
    ? `Your ${formatServiceProvider(serviceProvider)} bill payment for the card ending in ${account} was successful.`
    : `Your ${formatServiceProvider(serviceProvider)} ${nowrap(serviceType)} for ${account} was successful.`;

  // One clean label/value row for the Transaction Details table — replaces the old
  // template's ~15 lines of nested Stripo tables per field.
  const detailRow = (label, value) => `
              <tr>
                <td style="padding:8px 0;font-size:15px;line-height:1.6;color:#4B5563;border-bottom:1px solid #F3F4F6;">${label}</td>
                <td style="padding:8px 0;font-size:15px;line-height:1.6;color:#000000;font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6;">${value}</td>
              </tr>`;

  const dynamicDetailRows = Array.isArray(params) && params.length
    ? params.map(({ paramName, paramValue }) => detailRow(`${formatParamLabel(paramName)}:`, paramValue)).join('')
    : detailRow(`${formatParamLabel(type)}:`, account);

  const website = partnerDetails?.baseUrl || 'https://in.peko.one';
  const branding = partnerDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: partnerDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${heading}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="${heading}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">${heading}</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">${bodyLine}</p>
            <p style="font-size:18px;font-weight:700;color:#000000;margin:0 0 4px 0;">Transaction Details</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px 0;">
              ${detailRow('Transaction ID:', transactionId)}
              ${detailRow('Transaction Date:', new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM"))}
              ${detailRow(isCreditCardBill ? 'Payment Category:' : 'Operator:', isCreditCardBill ? 'Credit Card Bill Payment' : operator)}
              ${detailRow('Service Provider:', formatServiceProvider(serviceProvider))}
              ${dynamicDetailRows}
              ${detailRow('Amount:', `₹ ${formatNumberWithLocalString(amount)}`)}
            </table>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for choosing ${branding}. We appreciate your trust in us.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
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
                                  We regret to inform you that your ${serviceName} order payment on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")} was unsuccessful.
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


//commonFailedTemplateforBillPayments
exports.commonFailedTemplateforBillPayments = (serviceType, account, serviceProvider, name, partnerDetails) => {
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.baseUrl || partnerDetails?.website || 'https://peko.one/in';
  const socials = socialIconCells(partnerDetails?.socials || PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' });
  const retryUrl = partnerDetails?.baseUrl || 'https://peko.one/in';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your transaction has failed</title>
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
      <div aria-label="Your transaction has failed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${v2Header({ website, websiteLabel: websiteLabel(website), logo: partnerDetails?.logo, branding })}
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your transaction has failed</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We regret to inform you that your attempt to ${serviceProvider} ${serviceType} for ${account} on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")} was unsuccessful. If any funds are deducted from your account, please be assured that the refund will be processed within 7 to 10 business days.</div>
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
                                        <td align="center" bgcolor="#ff4f4f" style="border-radius:12px;">
                                          <a href="${retryUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Try again</a>
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
