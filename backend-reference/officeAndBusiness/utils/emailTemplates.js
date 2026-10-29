/* eslint-disable no-undef */
/* eslint-disable no-irregular-whitespace */
//Generate Payment successful email for payment links
exports.generatePaymentLinkTemplate = (amount, link) => {
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
#message{
  overflow-wrap:break-word!important;
}
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

#u_body a {
color: #0000ee;
text-decoration: underline;
}
</style>



<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
<!--<![endif]-->

</head>

<body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
<!--[if IE]><div class="ie-container"><![endif]-->
<!--[if mso]><div class="mso-container"><![endif]-->
<table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
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
            
                  </div>

                </td>
              </tr>
            </tbody>
          </table>

          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 31px;font-family:'Cabin',sans-serif;" align="left">

                  <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                    <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">Payment Link </span></strong>
                      </span>
                    </p>
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
                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Dear User, </span></p>
                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 18px; line-height: 28.8px;">Please use the below link to make the payment of ₹ ${amount}.</span></p><br>
                  </div>

                </td>
              </tr>
            </tbody>
          </table>

          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
            <tbody>
              <tr>
                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">

                  <!--[if mso]><style>.v-button {background: transparent !important;}</style><![endif]-->
                  <div align="center">
                    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="" style="height:46px; v-text-anchor:middle; width:236px;" arcsize="8.5%"  stroke="f" fillcolor="#242222"><w:anchorlock/><center style="color:#FFFFFF;font-family:'Cabin',sans-serif;"><![endif]-->
                    <a href=${link} target="_blank" class="v-button" style="box-sizing: border-box;display: inline-block;font-family:'Cabin',sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #FFFFFF; background-color: #242222; border-radius: 4px;-webkit-border-radius: 4px; -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;">
                      <span style="display:block;padding:14px 44px 13px;line-height:120%;background-color:#242222;border-radius: 4px"><span style="font-size: 16px; line-height: 19.2px;"><strong><span style="line-height: 19.2px; font-size: 16px;">Payment Link</span></strong>
                      </span>
                      </span>
                    </a>
                    <!--[if mso]></center></v:roundrect><![endif]-->
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;padding:20px 40px">
              <p style="line-height: 160%; font-size: 14px; text-align:center;"><span style="font-size: 18px; line-height: 28.8px;">Regards</span></p>
              <p style="line-height: 160%; font-size: 14px;text-align:center"><span style="font-size: 18px; line-height: 28.8px;">The Peko Team</span></p>
          </div>
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
                  <div style="color: #1e1e20; line-height: 160%; text-align: center; word-wrap: break-word;">
                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 16px; line-height: 25.6px; color: #ecf0f1;">This is an autogenerated mail, please don't reply</span></p>
                  </div>

                  <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                    <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyright ${new Date().getUTCFullYear()} Peko Platforms Private Limited. All Rights Reserved</span></p>
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
`
}


exports.generateInvoiceAndSendToMail = (isLinkExist, paymentLink, amountDue, customerName, templateDetails) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
 <html
   dir="ltr"
   xmlns="http://www.w3.org/1999/xhtml"
   xmlns:o="urn:schemas-microsoft-com:office:office"
   lang="en"
   style="padding: 0; margin: 0"
 >
   <head>
     <meta charset="UTF-8" />
     <meta content="width=device-width, initial-scale=1" name="viewport" />
     <meta name="x-apple-disable-message-reformatting" />
     <meta http-equiv="X-UA-Compatible" content="IE=edge" />
     <meta content="telephone=no" name="format-detection" />
     <title>Invoice</title>
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
     <link
       href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i"
       rel="stylesheet"
     />
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
     "
   >
     <div
       dir="ltr"
       class="es-wrapper-color"
       lang="en"
       style="background-color: #ffffff"
     >
       <!--[if gte mso 9
         ]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
           <v:fill
             type="tile"
             color="#ffffff"
             origin="0.5, 0"
             position="0.5, 0"
           ></v:fill> </v:background
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
           background-color: #ffffff;
         "
       >
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
               "
             >
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
                       width: 600px;
                     "
                   >
                     <tr style="border-collapse: collapse">
                       <td
                         align="left"
                         bgcolor="#ffffff"
                         style="
                           margin: 0;
                           padding-top: 10px;
                           padding-bottom: 20px;
                           padding-left: 40px;
                           padding-right: 40px;
                           background-color: #ffffff;
                         "
                       >
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
                           "
                         >
                           <tr style="border-collapse: collapse">
                             <td
                               valign="top"
                               align="center"
                               style="padding: 0; margin: 0; width: 520px"
                             >
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
                                 "
                               >
                                 <tr style="border-collapse: collapse">
                                   <td
                                     class="es-m-txt-c"
                                     align="center"
                                     style="
                                       padding: 0;
                                       margin: 0;
                                       padding-bottom: 15px;
                                       padding-top: 20px;
                                     "
                                   >
                                     <h2
                                       style="
                                         margin: 0;
                                         line-height: 26px;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         font-size: 22px;
                                         font-style: normal;
                                         font-weight: bold;
                                         color: #333333;
                                       "
                                     >
                                       <b>Your Invoice is generated</b>
                                     </h2>
                                   </td>
                                 </tr>
                                 <tr style="border-collapse: collapse">
                                   <td
                                     align="left"
                                     style="
                                       padding: 0;
                                       margin: 0;
                                       padding-bottom: 10px;
                                     "
                                   >
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
                                       "
                                     >
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
                                       "
                                     >
                                       Dear ${customerName},
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
                                       "
                                     >
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
                                       "
                                     >
                                       Thank you for using ${templateDetails?.branding} to generate your
                                       invoice.Please find the attached document above for easy reference to all the details of your invoice.
                                     </p>
                                       <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                   <br> Best Regards,</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                   ${templateDetails?.branding}</p>
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
               "
             >
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
                       width: 600px;
                     "
                     cellspacing="0"
                     cellpadding="0"
                     bgcolor="#ffffff"
                     align="center"
                     role="none"
                   >
                     <tr style="border-collapse: collapse">
                       <td
                         align="left"
                         style="
                           margin: 0;
                           padding-top: 15px;
                           padding-bottom: 20px;
                           padding-left: 40px;
                           padding-right: 40px;
                         "
                       >
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
                           "
                         >
                           <tr style="border-collapse: collapse">
                             <td
                               align="center"
                               valign="top"
                               style="padding: 0; margin: 0; width: 520px"
                             >
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
                                 "
                               >
                                 <tr style="border-collapse: collapse">
                                   <td
                                     align="center"
                                     style="padding: 0; margin: 0"
                                   >
                                     <!--[if mso
                                       ]><a href="" target="_blank" hidden>
                                         <v:roundrect
                                           xmlns:v="urn:schemas-microsoft-com:vml"
                                           xmlns:w="urn:schemas-microsoft-com:office:word"
                                           esdevVmlButton
                                           href=""
                                           style="
                                             height: 47px;
                                             v-text-anchor: middle;
                                             width: 254px;
                                           "
                                           arcsize="13%"
                                           stroke="f"
                                           fillcolor="#ff4f4f"
                                         >
                                           <w:anchorlock></w:anchorlock>
                                           <center
                                             style="
                                               color: #ffffff;
                                               font-family: arial,
                                                 'helvetica neue', helvetica,
                                                 sans-serif;
                                               font-size: 14px;
                                               font-weight: 700;
                                               line-height: 14px;
                                               mso-text-raise: 1px;
                                             "
                                           >
                                             DOWNLOAD INVOICE
                                           </center>
                                         </v:roundrect></a
                                       >
                                     <![endif]-->
                                     <!--[if !mso]><!-- -->
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
               "
             >
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
                       width: 600px;
                     "
                     cellspacing="0"
                     cellpadding="0"
                     bgcolor="#ffffff"
                     align="center"
                     role="none"
                   >
                     <tr style="border-collapse: collapse">
                       <td
                         align="left"
                         bgcolor="#ffffff"
                         style="
                           padding: 40px;
                           margin: 0;
                           background-color: #ffffff;
                           border-radius: 5px;
                         "
                       >
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
                           "
                         >
                           <tr style="border-collapse: collapse">
                             <td
                               valign="top"
                               align="center"
                               style="padding: 0; margin: 0; width: 520px"
                             >
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
                                 "
                               >
                                 <tr style="border-collapse: collapse">
                                   <td
                                     align="center"
                                     style="
                                       padding: 0;
                                       margin: 0;
                                       font-size: 0px;
                                     "
                                   >
                                     <a
                                       target="_blank"
                                       href="https://peko.one/in"
                                       style="
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         text-decoration: underline;
                                         color: #666666;
                                         font-size: 12px;
                                       "
                                       ><img
                                         class="adapt-img"
                                         src="${templateDetails?.logo}"
                                         alt
                                         style="
                                           display: block;
                                           border: 0;
                                           outline: none;
                                           text-decoration: none;
                                           -ms-interpolation-mode: bicubic;
                                         "
                                         width="110"
                                         height="35"
                                     /></a>
                                   </td>
                                 </tr>
                                 <tr style="border-collapse: collapse">
                                   <td
                                     align="center"
                                     style="
                                       padding: 0;
                                       margin: 0;
                                       padding-top: 10px;
                                       padding-bottom: 10px;
                                     "
                                   >
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
                                       "
                                     >
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
                                     "
                                   >
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
                                       "
                                     >
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
                                         "
                                       ></a>
                                     </p>
                                   </td>
                                 </tr>
                                 <tr style="border-collapse: collapse">
                                   <td
                                     align="center"
                                     style="padding: 0; margin: 0"
                                   >
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
                                       "
                                     >
                                       © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All
                                       Rights Reserved
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
                       <td
                         align="left"
                         bgcolor="#0c0c0c"
                         style="
                           margin: 0;
                           padding-top: 5px;
                           padding-bottom: 25px;
                           padding-left: 40px;
                           padding-right: 40px;
                           background-color: #0c0c0c;
                         "
                       >
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
                           "
                         >
                           <tr style="border-collapse: collapse">
                             <td
                               valign="top"
                               align="center"
                               style="padding: 0; margin: 0; width: 520px"
                             >
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
                                 "
                               >
                                 <tr style="border-collapse: collapse">
                                   <td
                                     align="center"
                                     style="padding: 0; margin: 0"
                                   >
                                     <p
                                       style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 18px;
                                         color: #ffffff;
                                         font-size: 12px;
                                       "
                                     >
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
                                         line-height: 18px;
                                         color: #ffffff;
                                         font-size: 12px;
                                       "
                                     >
                                       <a
                                         href="https://peko.one/in"
                                         style="
                                           -webkit-text-size-adjust: none;
                                           -ms-text-size-adjust: none;
                                           mso-line-height-rule: exactly;
                                           text-decoration: none;
                                           color: #ffffff;
                                           font-size: 12px;
                                         "
                                         target="_blank"
                                         >www.peko.one</a
                                       >
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
                                         color: #ffffff;
                                         font-size: 12px;
                                       "
                                     >
                                       <br />
                                     </p>
                                   </td>
                                 </tr>
                                 <tr style="border-collapse: collapse">
                                   <td
                                     align="center"
                                     style="padding: 0; margin: 0; font-size: 0"
                                   >
                                     <table
                                       class="es-table-not-adapt es-social"
                                       cellspacing="0"
                                       cellpadding="0"
                                       role="presentation"
                                       style="
                                         mso-table-lspace: 0pt;
                                         mso-table-rspace: 0pt;
                                         border-collapse: collapse;
                                         border-spacing: 0px;
                                       "
                                     >
                                       <tr style="border-collapse: collapse">
                                         <td
                                           valign="top"
                                           align="center"
                                           style="
                                             padding: 0;
                                             margin: 0;
                                             padding-right: 10px;
                                           "
                                         >
                                           <a
                                             target="_blank"
                                             href="https://x.com/PekoIndia"
                                             style="
                                               -webkit-text-size-adjust: none;
                                               -ms-text-size-adjust: none;
                                               mso-line-height-rule: exactly;
                                               text-decoration: underline;
                                               color: #666666;
                                               font-size: 12px;
                                             "
                                             ><img
                                               title="Twitter"
                                               src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                               alt="Tw"
                                               width="24"
                                               height="24"
                                               style="
                                                 display: block;
                                                 border: 0;
                                                 outline: none;
                                                 text-decoration: none;
                                                 -ms-interpolation-mode: bicubic;
                                               "
                                           /></a>
                                         </td>
                                         <td
                                           valign="top"
                                           align="center"
                                           style="
                                             padding: 0;
                                             margin: 0;
                                             padding-right: 10px;
                                           "
                                         >
                                           <a
                                             target="_blank"
                                             href="https://www.instagram.com/peko.india"
                                             style="
                                               -webkit-text-size-adjust: none;
                                               -ms-text-size-adjust: none;
                                               mso-line-height-rule: exactly;
                                               text-decoration: underline;
                                               color: #666666;
                                               font-size: 12px;
                                             "
                                             ><img
                                               title="Instagram"
                                               src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                               alt="Inst"
                                               width="24"
                                               height="24"
                                               style="
                                                 display: block;
                                                 border: 0;
                                                 outline: none;
                                                 text-decoration: none;
                                                 -ms-interpolation-mode: bicubic;
                                               "
                                           /></a>
                                         </td>
                                         <td
                                           valign="top"
                                           align="center"
                                           style="padding: 0; margin: 0"
                                         >
                                           <a
                                             target="_blank"
                                             href="https://www.linkedin.com/company/pekoindia/"
                                             style="
                                               -webkit-text-size-adjust: none;
                                               -ms-text-size-adjust: none;
                                               mso-line-height-rule: exactly;
                                               text-decoration: underline;
                                               color: #666666;
                                               font-size: 12px;
                                             "
                                             ><img
                                               title="Linkedin"
                                               src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                               alt="In"
                                               width="24"
                                               height="24"
                                               style="
                                                 display: block;
                                                 border: 0;
                                                 outline: none;
                                                 text-decoration: none;
                                                 -ms-interpolation-mode: bicubic;
                                               "
                                           /></a>
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
};

exports.worksPurchaseEmail = (name, amount, planData, transactionId) => {
  return `
  <!DOCTYPE html
     PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
   <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="padding:0;Margin:0">
   
   <head>
     <meta charset="UTF-8">
     <meta content="width=device-width, initial-scale=1" name="viewport">
     <meta name="x-apple-disable-message-reformatting">
     <meta http-equiv="X-UA-Compatible" content="IE=edge">
     <meta content="telephone=no" name="format-detection">
     <title>Peko Works Succesful</title><!--[if (mso 16)]>
       <style type="text/css">
       a {text-decoration: none;}
       </style>
       <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
   <xml>
       <o:OfficeDocumentSettings>
       <o:AllowPNG></o:AllowPNG>
       <o:PixelsPerInch>96</o:PixelsPerInch>
       </o:OfficeDocumentSettings>
   </xml>
   <![endif]--><!--[if !mso]><!-- -->
     <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"><!--<![endif]-->
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
         .customForMobile {
           text-align-last: start;
         }
   
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
           padding: 0px !important
         }
   
         .es-m-p0r {
           padding-right: 0px !important
         }
   
         .es-m-p0l {
           padding-left: 0px !important
         }
   
         .es-m-p0t {
           padding-top: 0px !important
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
       }
     </style>
   </head>
   
   <body
     style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
     <div class="es-wrapper-color" style="background-color:#F1F1F1"><!--[if gte mso 9]>
               <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                   <v:fill type="tile" color="#f1f1f1"></v:fill>
               </v:background>
           <![endif]-->
       <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0"
         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1F1F1">
         <tr style="border-collapse:collapse">
           <td valign="top" style="padding:0;Margin:0">
             <table class="es-content" cellspacing="0" cellpadding="0" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table class="es-content-body"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#333333;width:600px"
                     cellspacing="0" cellpadding="0" bgcolor="#333333" align="center">
                     <tr style="border-collapse:collapse">
                       <td align="left" bgcolor="#020101"
                         style="padding:0;Margin:0;padding-left:20px;padding-right:35px;background-color:#020101;border-radius:5px">
                         <table cellpadding="0" cellspacing="0" width="100%"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                             <td align="center" valign="top" style="padding:0;Margin:0;width:545px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#fef7f7;font-size:20px">
                                       <br></p>
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
             <table class="es-content" cellspacing="0" cellpadding="0" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                     <tr style="border-collapse:collapse">
                       <td align="left" bgcolor="#ffffff"
                         style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                         <table width="100%" cellspacing="0" cellpadding="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                             <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td class="es-m-txt-c" align="center"
                                     style="padding:0;Margin:0;padding-bottom:15px;padding-top:20px">
                                     <h2
                                       style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#0a9f43">
                                       Your purchase from Peko Works</h2>
                                   </td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       <br></p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Hi ${name},</p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       <br>We are delighted to inform you that your recent payment of ₹ ${amount} for your
                                       ${planData.work.name} - ${planData.name
    } plan has been successfully processed. Your plan
                                       ${planData.work.name} - ${planData.name} is now active.</p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       <br></p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       For queries or further assistance, please feel free to contact us at reach@peko.one.</p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       <br></p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Best Regards,</p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Peko</p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       <br></p>
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
             <table cellpadding="0" cellspacing="0" class="es-content" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                     <tr style="border-collapse:collapse">
                       <td align="left" bgcolor="#efefef"
                         style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#efefef">
                         <table cellpadding="0" cellspacing="0" width="100%"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                             <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="center" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#333333;font-size:18px">
                                       <strong>Transaction Details</strong></p>
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
             <table class="customForMobile" cellpadding="0" cellspacing="0" class="es-content" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                     <tr style="border-collapse:collapse">
                       <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-left:40px;padding-right:40px">
                         <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-left" align="left"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                           <tr style="border-collapse:collapse">
                             <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="right" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Date &amp; Time</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table>
                         <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-right" align="right"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                           <tr style="border-collapse:collapse">
                             <td align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       ${new Date().toLocaleString()}</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table><!--[if mso]></td></tr></table><![endif]-->
                       </td>
                     </tr>
                     <tr style="border-collapse:collapse">
                       <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                         <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-left" align="left"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                           <tr style="border-collapse:collapse">
                             <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="right" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Transaction ID:</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table>
                         <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-right" align="right"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                           <tr style="border-collapse:collapse">
                             <td align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       ${transactionId}</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table><!--[if mso]></td></tr></table><![endif]-->
                       </td>
                     </tr>
                     <tr style="border-collapse:collapse">
                       <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                         <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-left" align="left"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                           <tr style="border-collapse:collapse">
                             <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="right" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Service :</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table>
                         <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-right" align="right"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                           <tr style="border-collapse:collapse">
                             <td align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Peko Works</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table><!--[if mso]></td></tr></table><![endif]-->
                       </td>
                     </tr>
                     <tr style="border-collapse:collapse">
                       <td align="left"
                         style="Margin:0;padding-top:5px;padding-bottom:30px;padding-left:40px;padding-right:40px">
                         <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-left" align="left"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                           <tr style="border-collapse:collapse">
                             <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="right" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Amount Paid</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table>
                         <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-right" align="right"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                           <tr style="border-collapse:collapse">
                             <td align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       ₹ ${amount}</p>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table><!--[if mso]></td></tr></table><![endif]-->
                       </td>
                     </tr>
                   </table>
                 </td>
               </tr>
             </table>
             <table cellpadding="0" cellspacing="0" class="es-content" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                     <tr style="border-collapse:collapse">
                       <td align="left"
                         style="Margin:0;padding-top:5px;padding-bottom:15px;padding-left:40px;padding-right:40px">
                         <table cellpadding="0" cellspacing="0" width="100%"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                             <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="center" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#464646;font-size:18px">
                                       <strong>${planData.work?.name}</strong></p>
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
             <table cellpadding="0" cellspacing="0" class="es-content" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px;display: flex;">
                     <tr style="border-collapse:collapse">
                       <td align="left"
                         style="Margin:0;padding-top:5px;padding-bottom:15px;padding-left:40px;padding-right:40px">
                         <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-left" align="left"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                           <tr style="border-collapse:collapse">
                             <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                                       src="${planData.work.image}"
                                       alt
                                       style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                       height="111" width="110"></td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table>
                         <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                         <table cellpadding="0" cellspacing="0" class="es-right" align="right"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                           <tr style="border-collapse:collapse">
                             <td align="left" style="padding:0;Margin:0;width:250px">
                               <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                       Current plan Name: <strong>
                                         ${planData.name}</strong></p>
                                
                                   </td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                   <td align="left" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                        Plan price : <strong>₹
                                         ${planData.price}</strong></p>
                                
                                   </td>
                                 </tr>
                               </table>
                             </td>
                           </tr>
                         </table><!--[if mso]></td></tr></table><![endif]-->
                       </td>
                     </tr>
                   </table>
                 </td>
               </tr>
             </table>
             <table cellpadding="0" cellspacing="0" class="es-footer" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table class="es-footer-body"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px"
                     cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                     <tr style="border-collapse:collapse">
                       <td align="left" bgcolor="#ffffff" style="padding:40px;Margin:0;background-color:#ffffff">
                         <table width="100%" cellspacing="0" cellpadding="0"
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
                                         src="https://gxphmw.stripocdn.email/content/guids/CABINET_0c3e226962d6092460427f83432b00f1cae42a8ee3ec2ec8583c8c3df0e80e40/images/peko.png"
                                         alt
                                         style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                         width="110" height="35"></a></td>
                                 </tr>
                                 
                                 <tr style="border-collapse:collapse">
                                   <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                       This email was sent to you from company email address</p>
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
                                       © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
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
             <table class="es-content" cellspacing="0" cellpadding="0" align="center"
               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
               <tr style="border-collapse:collapse">
                 <td align="center" style="padding:0;Margin:0">
                   <table class="es-content-body"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#292828;width:600px"
                     cellspacing="0" cellpadding="0" bgcolor="#292828" align="center">
                     <tr style="border-collapse:collapse">
                       <td align="left" bgcolor="#0c0c0c"
                         style="Margin:0;padding-top:15px;padding-bottom:20px;padding-left:40px;padding-right:40px;background-color:#0c0c0c">
                         <table width="100%" cellspacing="0" cellpadding="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                             <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                   <td align="center" style="padding:0;Margin:0">
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px">
                                       <a href="https://peko.one/in"
                                         style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:15px"
                                         target="_blank">www.peko.one</a></p>
                                     <p
                                       style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px">
                                       <br></p>
                                   </td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                   <td align="center" style="padding:0;Margin:0;font-size:0">
                                     <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0"
                                       role="presentation"
                                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                       <tr style="border-collapse:collapse">
                                         <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                             target="_blank" href="https://x.com/PekoIndia"
                                             style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img
                                               title="Twitter"
                                               src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                               alt="Tw" width="24" height="24"
                                               style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                         </td>
                                         <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                             target="_blank" href="https://www.instagram.com/peko.india"
                                             style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img
                                               title="Instagram"
                                               src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                               alt="Inst" width="24" height="24"
                                               style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                         </td>
                                         <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank"
                                             href="https://www.linkedin.com/company/pekoindia/"
                                             style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img
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

exports.emailForWabaUpdated = (body, name, PlanActivatedOn) => {
  `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    dir="ltr"
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    lang="en"
    style="padding: 0; margin: 0"
  >
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>Copy of (1) DED Lisence</title>
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
      <link
        href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i"
        rel="stylesheet"
      />
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
      "
    >
      <div
        dir="ltr"
        class="es-wrapper-color"
        lang="en"
        style="background-color: #ffffff"
      >
        <!--[if gte mso 9
          ]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
            <v:fill type="tile" color="#ffffff"></v:fill> </v:background
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
            background-color: #ffffff;
          "
        >
          <tr style="border-collapse: collapse">
            <td valign="top" style="padding: 0; margin: 0">
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
                "
              >
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
                        width: 600px;
                      "
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#ffffff"
                      align="center"
                      role="none"
                    >
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#40B272"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 5px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #40b272;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      "
                                    >
                                      <img
                                        class="adapt-img"
                                        src="https://gxphmw.stripocdn.email/content/guids/CABINET_08109f061e8f06fb3caffae361013ddf5ac2cf3de695894bcb3d8fc9602d8cd1/images/screenshot_20240603_at_32852pm.png"
                                        alt
                                        style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        "
                                        width="340"
                                        height="225"
                                      />
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
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 40px;
                            padding-left: 40px;
                            padding-right: 40px;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 30px;
                                          color: #131313;
                                          font-size: 20px;
                                        "
                                      >
                                        <strong
                                          >Confirmation of WCC Credit
                                          Purchase&nbsp;</strong
                                        >
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 30px;
                                          color: #131313;
                                          font-size: 20px;
                                        "
                                      >
                                        <strong></strong><br />
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      bgcolor="#ffffff"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        Dear ${name},&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        We are pleased to confirm that your
                                        profile has been successfully updated with
                                        the following details:&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        Name:&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp;${name}&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        WhatsApp Number: &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp;${body.data.project.wa_number}&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        Active Plan:&nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp;&nbsp;${body.data.project.active_plan}&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        Plan Activation:&nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp;&nbsp;${PlanActivatedOn}&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        The profile updates ensure that you have
                                        an enhanced communication experience with
                                        your customers via WhatsApp
                                        Business.&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        For any queries or further assistance,
                                        please feel free to reach out to us @[add
                                        support email].&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        Warm regards,&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #000000;
                                          font-size: 16px;
                                        "
                                      >
                                        Peko&nbsp;
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
                        <td
                          align="left"
                          bgcolor="#ffffff"
                          style="
                            padding: 40px;
                            margin: 0;
                            background-color: #ffffff;
                            border-radius: 5px;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      "
                                    >
                                      <a
                                        target="_blank"
                                        href="https://peko.one/in"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #666666;
                                          font-size: 12px;
                                        "
                                        ><img
                                          class="adapt-img"
                                          src="https://gxphmw.stripocdn.email/content/guids/CABINET_674b0d0a49570ab72e7f6bd66180cf3d1d634b107ad71e4b66e3d678ba50cd6e/images/peko.png"
                                          alt
                                          style="
                                            display: block;
                                            border: 0;
                                            outline: none;
                                            text-decoration: none;
                                            -ms-interpolation-mode: bicubic;
                                          "
                                          width="110"
                                          height="35"
                                      /></a>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-top: 10px;
                                        padding-bottom: 10px;
                                      "
                                    >
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
                                        "
                                      >
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
                                      "
                                    >
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
                                        "
                                      >
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
                                          "
                                        ></a>
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      bgcolor="#ffffff"
                                      style="padding: 0; margin: 0"
                                    >
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
                                        "
                                      >
                                        © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All
                                        Rights Reserved
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
                        <td
                          align="left"
                          bgcolor="#0c0c0c"
                          style="
                            margin: 0;
                            padding-top: 5px;
                            padding-bottom: 25px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #0c0c0c;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 18px;
                                          color: #ffffff;
                                          font-size: 12px;
                                        "
                                      >
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
                                          line-height: 18px;
                                          color: #ffffff;
                                          font-size: 12px;
                                        "
                                      >
                                        <a
                                          href="https://peko.one/in"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: none;
                                            color: #ffffff;
                                            font-size: 12px;
                                          "
                                          target="_blank"
                                          >www.peko.one</a
                                        >
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
                                          color: #ffffff;
                                          font-size: 12px;
                                        "
                                      >
                                        <br />
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0; font-size: 0"
                                    >
                                      <table
                                        class="es-table-not-adapt es-social"
                                        cellspacing="0"
                                        cellpadding="0"
                                        role="presentation"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tr style="border-collapse: collapse">
                                          <td
                                            valign="top"
                                            align="center"
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              padding-right: 10px;
                                            "
                                          >
                                            <a
                                              target="_blank"
                                              href="https://x.com/PekoIndia"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #666666;
                                                font-size: 12px;
                                              "
                                              ><img
                                                title="Twitter"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                                alt="Tw"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
                                          </td>
                                          <td
                                            valign="top"
                                            align="center"
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              padding-right: 10px;
                                            "
                                          >
                                            <a
                                              target="_blank"
                                              href="https://www.instagram.com/peko.india"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #666666;
                                                font-size: 12px;
                                              "
                                              ><img
                                                title="Instagram"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                                alt="Inst"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
                                          </td>
                                          <td
                                            valign="top"
                                            align="center"
                                            style="padding: 0; margin: 0"
                                          >
                                            <a
                                              target="_blank"
                                              href="https://www.linkedin.com/company/pekoindia/"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #666666;
                                                font-size: 12px;
                                              "
                                              ><img
                                                title="Linkedin"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                                alt="In"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
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

exports.whatsappForBusiness = (name) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    dir="ltr"
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    lang="en"
    style="padding: 0; margin: 0"
  >
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>Copy of (1) DED Lisence</title>
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
      <link
        href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i"
        rel="stylesheet"
      />
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
      "
    >
      <div
        dir="ltr"
        class="es-wrapper-color"
        lang="en"
        style="background-color: #ffffff"
      >
        <!--[if gte mso 9
          ]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
            <v:fill type="tile" color="#ffffff"></v:fill> </v:background
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
            background-color: #ffffff;
          "
        >
          <tr style="border-collapse: collapse">
            <td valign="top" style="padding: 0; margin: 0">
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
                "
              >
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
                        width: 600px;
                      "
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#ffffff"
                      align="center"
                      role="none"
                    >
                      <tr style="border-collapse: collapse">
                        <td
                          align="left"
                          bgcolor="#40B272"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 5px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #40b272;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      "
                                    >
                                      <img
                                        class="adapt-img"
                                        src="https://gxphmw.stripocdn.email/content/guids/CABINET_08109f061e8f06fb3caffae361013ddf5ac2cf3de695894bcb3d8fc9602d8cd1/images/screenshot_20240603_at_32852pm.png"
                                        alt
                                        style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        "
                                        width="340"
                                        height="225"
                                      />
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
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 40px;
                            padding-left: 40px;
                            padding-right: 40px;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                align="center"
                                valign="top"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 30px;
                                          color: #131313;
                                          font-size: 20px;
                                        "
                                      >
                                        <strong
                                          >Confirmation of WCC Credit
                                          Purchase&nbsp;</strong
                                        >
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 30px;
                                          color: #131313;
                                          font-size: 20px;
                                        "
                                      >
                                        <strong></strong><br />
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="left"
                                      bgcolor="#ffffff"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
                                        Dear ${name},&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
                                        We are pleased to inform you that your
                                        payment for WCC Credits for WhatsApp
                                        Business has been successfully processed.
                                        Your Account is now active, allowing
                                        you to make the most of the WCC Credits
                                        for enhanced communication on WhatsApp for
                                        Business.
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
                                        For any queries or further assistance,
                                        please feel free to reach out to us
                                        reach@peko.one&nbsp; &nbsp; &nbsp;&nbsp;
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
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
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
                                        Best regards,&nbsp;<br />
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 24px;
                                          color: #1c1b1c;
                                          font-size: 16px;
                                        "
                                      >
                                        Peko<br />
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
                        <td
                          align="left"
                          bgcolor="#ffffff"
                          style="
                            padding: 40px;
                            margin: 0;
                            background-color: #ffffff;
                            border-radius: 5px;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      "
                                    >
                                      <a
                                        target="_blank"
                                        href="https://peko.one/in"
                                        style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #666666;
                                          font-size: 12px;
                                        "
                                        ><img
                                          class="adapt-img"
                                          src="https://gxphmw.stripocdn.email/content/guids/CABINET_674b0d0a49570ab72e7f6bd66180cf3d1d634b107ad71e4b66e3d678ba50cd6e/images/peko.png"
                                          alt
                                          style="
                                            display: block;
                                            border: 0;
                                            outline: none;
                                            text-decoration: none;
                                            -ms-interpolation-mode: bicubic;
                                          "
                                          width="110"
                                          height="35"
                                      /></a>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="
                                        padding: 0;
                                        margin: 0;
                                        padding-top: 10px;
                                        padding-bottom: 10px;
                                      "
                                    >
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
                                        "
                                      >
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
                                      "
                                    >
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
                                        "
                                      >
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
                                          "
                                        ></a>
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      bgcolor="#ffffff"
                                      style="padding: 0; margin: 0"
                                    >
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
                                        "
                                      >
                                        © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All
                                        Rights Reserved
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
                        <td
                          align="left"
                          bgcolor="#0c0c0c"
                          style="
                            margin: 0;
                            padding-top: 5px;
                            padding-bottom: 25px;
                            padding-left: 40px;
                            padding-right: 40px;
                            background-color: #0c0c0c;
                          "
                        >
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
                            "
                          >
                            <tr style="border-collapse: collapse">
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 520px"
                              >
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
                                  "
                                >
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: helvetica, 'helvetica neue',
                                            arial, verdana, sans-serif;
                                          line-height: 18px;
                                          color: #ffffff;
                                          font-size: 12px;
                                        "
                                      >
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
                                          line-height: 18px;
                                          color: #ffffff;
                                          font-size: 12px;
                                        "
                                      >
                                        <a
                                          href="https://peko.one/in"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: none;
                                            color: #ffffff;
                                            font-size: 12px;
                                          "
                                          target="_blank"
                                          >www.peko.one</a
                                        >
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
                                          color: #ffffff;
                                          font-size: 12px;
                                        "
                                      >
                                        <br />
                                      </p>
                                    </td>
                                  </tr>
                                  <tr style="border-collapse: collapse">
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0; font-size: 0"
                                    >
                                      <table
                                        class="es-table-not-adapt es-social"
                                        cellspacing="0"
                                        cellpadding="0"
                                        role="presentation"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tr style="border-collapse: collapse">
                                          <td
                                            valign="top"
                                            align="center"
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              padding-right: 10px;
                                            "
                                          >
                                            <a
                                              target="_blank"
                                              href="https://x.com/PekoIndia"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #666666;
                                                font-size: 12px;
                                              "
                                              ><img
                                                title="Twitter"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                                alt="Tw"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
                                          </td>
                                          <td
                                            valign="top"
                                            align="center"
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              padding-right: 10px;
                                            "
                                          >
                                            <a
                                              target="_blank"
                                              href="https://www.instagram.com/peko.india"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #666666;
                                                font-size: 12px;
                                              "
                                              ><img
                                                title="Instagram"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                                alt="Inst"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
                                          </td>
                                          <td
                                            valign="top"
                                            align="center"
                                            style="padding: 0; margin: 0"
                                          >
                                            <a
                                              target="_blank"
                                              href="https://www.linkedin.com/company/pekoindia/"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: underline;
                                                color: #666666;
                                                font-size: 12px;
                                              "
                                              ><img
                                                title="Linkedin"
                                                src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                                alt="In"
                                                width="24"
                                                height="24"
                                                style="
                                                  display: block;
                                                  border: 0;
                                                  outline: none;
                                                  text-decoration: none;
                                                  -ms-interpolation-mode: bicubic;
                                                "
                                            /></a>
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
