const formatKey = (key) => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};
const formatFormDetails = (details) => {
  return Object.entries(details)
    .map(([key, value]) => {
      return `<tr style="border-collapse:collapse">
                 <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                   <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                   <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                     <tr style="border-collapse:collapse">
                       <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                         <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                             <td align="right" style="padding:0;Margin:0">
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                  ${formatKey(key)}:</p>
                             </td>
                           </tr>
                         </table>
                       </td>
                     </tr>
                   </table>
                   <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                   <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                     <tr style="border-collapse:collapse">
                       <td align="left" style="padding:0;Margin:0;width:250px">
                         <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                             <td align="left" style="padding:0;Margin:0">
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                 ${value}</p>
                             </td>
                           </tr>
                         </table>
                       </td>
                     </tr>
                   </table> <!--[if mso]></td></tr></table><![endif]-->
                 </td>
               </tr>`;
    })
    .join("");
};

exports.generateEmailDomainSuccessEmailToVendor = (name, planData, orderId, customerName, emailId, contactNo, billingType, formDetails, templateDetails) => {
  const planPrice = billingType === "MONTHLY" ? planData.monthlyPrice : planData.yearlyPrice;
  const emailContent = `
  <br>
<tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#0e0d0d;font-size:18px;text-align:left">
                                   <strong>Form Details</strong>
                                 </p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#10100f;font-size:15px">
                                 </p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
      ${formatFormDetails(formDetails)}
    `;
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
 <title>Purchase Succesful</title>
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

   @media screen and (max-width:384px) {
     .mail-message-content {
       width: 414px !important
     }
   }
 </style>
</head>

<body
 style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
 <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:transparent">
   <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="transparent" origin="0.5, 0" position="0.5, 0"></v:fill> </v:background><![endif]-->
   <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:transparent">
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
                     style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                     <table width="100%" cellspacing="0" cellpadding="0" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                       <tr style="border-collapse:collapse">
                         <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td class="es-m-txt-c" align="center"
                                 style="padding:0;Margin:0;padding-bottom:15px;padding-top:20px">
                                 <h2
                                   style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#090909;text-align:left">
                                   Order placed!</h2>
                               </td>
                             </tr>
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Dear ${name},</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Please be informed that an order has been placed for the Business Emails
                                   mentioned below. We request you to process the order swiftly.</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                               </td>
                             </tr>
                             <tr style="border-collapse:collapse">
                               <td align="center" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#0e0d0d;font-size:18px;text-align:left">
                                   <strong>Order Details</strong>
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
         <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
           <tr style="border-collapse:collapse">
             <td align="center" style="padding:0;Margin:0">
               <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                 role="none"
                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#141313;font-size:15px">
                                   Order ID:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#10100f;font-size:15px">
                                   ${orderId}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
 <td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0c0b0b;font-size:15px">
                                   Placed on:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td><td style="width:20px"></td>
 <td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#070707;font-size:15px">
                                   ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Product name:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   ${planData.softwares_subscription.name}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Current payment plan:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   ${Number(planPrice)}/${billingType?.toLowerCase()}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Customer name:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   ${customerName}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Contact no:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   ${contactNo}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left"
                     style="Margin:0;padding-top:5px;padding-bottom:15px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#060505;font-size:15px;text-align:left">
                                   Email ID:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0c0c0c;font-size:15px">
                                   ${emailId}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 ${emailContent}
               </table>
             </td>
           </tr>
         </table>
         <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none"
           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
           <tr style="border-collapse:collapse">
             <td align="center" style="padding:0;Margin:0">
               <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                 role="none"
                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                 <tr style="border-collapse:collapse">
                   <td align="left" bgcolor="#ffffff"
                     style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                     <table width="100%" cellspacing="0" cellpadding="0" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                       <tr style="border-collapse:collapse">
                         <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   If you have any queries or need further assistance, please reach out to us at
                                   <a href="mailto:partnerships@peko.one">partnerships@peko.one</a>. We are here to
                                   assist you in any way we can.
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Best Regards,&nbsp;&nbsp;</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Team ${templateDetails?.branding}&nbsp;</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
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
                                     src=${templateDetails?.logo}
                                     alt
                                     style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                     height="35"></a> </td>
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
                                   <a href="https://peko.one/in/privacy-policy"
                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy
                                     Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/"
                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
                                     Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement"
                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
                                     of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                     href="https://peko.one/in/refund-policy/"
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
                                     <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                         target="_blank" href="https://x.com/PekoIndia"
                                         style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                           title="Twitter"
                                           src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                           alt="Tw" width="24" height="24"
                                           style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                     </td>
                                     <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                         target="_blank" href="https://www.instagram.com/peko.india"
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

</html>`;
};

exports.generateEmailDomainSuccessEmailToInternals = (name, transactionId, amount, planData, billingType, formDetails, templateDetails) => {
  const planPrice = billingType === "MONTHLY" ? planData.monthlyPrice : planData.yearlyPrice;
  // Prepare the email content
  const emailContent = `
  <br>
<tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#0e0d0d;font-size:18px;text-align:left">
                                   <strong>Form Details</strong>
                                 </p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#10100f;font-size:15px">
                                 </p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
      ${formatFormDetails(formDetails)}
    `;
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
    <title>Purchase Succesful</title>
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
    
    @media screen and (max-width:384px) {
     .mail-message-content {
       width: 414px !important
     }
    }
    </style>
    </head>
    
    <body
    style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:transparent">
    <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="transparent" origin="0.5, 0" position="0.5, 0"></v:fill> </v:background><![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:transparent">
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
                     style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                     <table width="100%" cellspacing="0" cellpadding="0" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                       <tr style="border-collapse:collapse">
                         <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td class="es-m-txt-c" align="center"
                                 style="padding:0;Margin:0;padding-bottom:15px;padding-top:20px">
                                 <h2
                                   style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#090909;text-align:left">
                                   Order placed for ${planData.softwares_subscription.name}</h2>
                               </td>
                             </tr>
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Dear ${name},</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   An order has been placed for ${planData.softwares_subscription.name} - ${planData.name}. Please
                                   take the necessary
                                   steps to process the order.</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                               </td>
                             </tr>
                             <tr style="border-collapse:collapse">
                               <td align="center" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#0e0d0d;font-size:18px;text-align:left">
                                   <strong>Order Details</strong>
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
         <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
           <tr style="border-collapse:collapse">
             <td align="center" style="padding:0;Margin:0">
               <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                 role="none"
                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#141313;font-size:15px">
                                   Order ID:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#10100f;font-size:15px">
                                   ${transactionId}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
                      <td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0c0b0b;font-size:15px">
                                   Placed on:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td><td style="width:20px"></td>
                            <td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#070707;font-size:15px">
                                   ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Service:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   Email/ Domain</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Name:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   ${planData.softwares_subscription.name}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Current payment plan:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   ${Number(planPrice)}/${billingType?.toLowerCase()}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 <tr style="border-collapse:collapse">
                   <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                     <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                       <tr style="border-collapse:collapse">
                         <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="right" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#121111;font-size:15px;text-align:left">
                                   Amount paid:</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                     <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                     <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                       <tr style="border-collapse:collapse">
                         <td align="left" style="padding:0;Margin:0;width:250px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#090909;font-size:15px">
                                   ₹ ${amount}</p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table> <!--[if mso]></td></tr></table><![endif]-->
                   </td>
                 </tr>
                 ${emailContent}
               </table>
             </td>
           </tr>
         </table>
         <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none"
           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
           <tr style="border-collapse:collapse">
             <td align="center" style="padding:0;Margin:0">
               <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                 role="none"
                 style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                 <tr style="border-collapse:collapse">
                   <td align="left" bgcolor="#ffffff"
                     style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                     <table width="100%" cellspacing="0" cellpadding="0" role="none"
                       style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                       <tr style="border-collapse:collapse">
                         <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                               <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Thank you.
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   <br>
                                 </p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Best Regards,&nbsp;&nbsp;</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
                                   Team ${templateDetails?.branding}&nbsp;</p>
                                 <p
                                   style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0e0e0e;font-size:15px">
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
                                     src=${templateDetails?.logo}
                                     alt
                                     style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                     height="35"></a> </td>
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
                                   <a href="https://peko.one/in/privacy-policy"
                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy
                                     Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/"
                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
                                     Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement"
                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
                                     of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                     href="https://peko.one/in/refund-policy/"
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
                                     <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                         target="_blank" href="https://x.com/PekoIndia"
                                         style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                           title="Twitter"
                                           src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                           alt="Tw" width="24" height="24"
                                           style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                     </td>
                                     <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                         target="_blank" href="https://www.instagram.com/peko.india"
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

exports.generateEmailDomainSuccessEmail = (name, transactionId, amount, planData, billingType, templateDetails, softwareImage) => {
  const planPrice = billingType === "MONTHLY" ? planData.monthlyPrice : planData.yearlyPrice;
  return `<!DOCTYPE html>

<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">

<head>
	<title></title>
	<meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
	<meta content="width=device-width, initial-scale=1.0" name="viewport" />
	<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
	<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
		}

		a[x-apple-data-detectors] {
			color: inherit !important;
			text-decoration: inherit !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
		}

		p {
			line-height: inherit
		}

		.desktop_hide,
		.desktop_hide table {
			mso-hide: all;
			display: none;
			max-height: 0px;
			overflow: hidden;
		}

		.image_block img+div {
			display: none;
		}

		sup,
		sub {
			font-size: 75%;
			line-height: 0;
		}

		@media (max-width:500px) {
			.mobile_hide {
				display: none;
			}

			.row-content {
				width: 100% !important;
			}

			.stack .column {
				width: 100%;
				display: block;
			}

			.mobile_hide {
				min-height: 0;
				max-height: 0;
				max-width: 0;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide,
			.desktop_hide table {
				display: table !important;
				max-height: none !important;
			}

			.row-2 .column-1 .block-1.heading_block h1 {
				font-size: 25px !important;
			}

			.row-3 .column-1 .block-1.paragraph_block td.pad>div {
				font-size: 14px !important;
			}

			.row-4 .column-1 .block-1.image_block .alignment div {
				margin: 0 auto 0 0 !important;
			}

			.row-4 .column-2 .block-1.heading_block td.pad,
			.row-5 .column-1 .block-1.heading_block td.pad,
			.row-6 .column-1 .block-1.heading_block td.pad {
				padding: 0 !important;
			}

			.row-5 .column-1 .block-1.heading_block h1 {
				font-size: 17px !important;
			}

			.row-6 .column-1 {
				padding: 0 0 5px !important;
			}
		}
	</style>
	<!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>

<body class="body"
	style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation"
		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
		<tbody>
			<tr>
				<td>
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 35px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div align="center" class="alignment" style="line-height:10px">
																	<div style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
																			src="https://gxphmw.stripocdn.email/content/guids/CABINET_c147c971c4de6ccc5b3a3ac239f9f66ca2825d24ce08ef9cabcd7e89dc78e8bb/images/frame_1597882534_d2c.png"
																			alt
																			style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
																			width="271" height="94"></div>
																</div>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 36px;">
																	Business Emails purchase successful </h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 25px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1"
														role="presentation"
														style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
														<tr>
															<td class="pad">
																<div
																	style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
																	<p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
																	<p style="margin: 0;">We are pleased to inform you that your
																		${planData.softwares_subscription.name} purchase
																		was successful.</p>
																</div>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 15px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="25%">
													<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div align="center" class="alignment" style="line-height:10px">
																	<div style="max-width: 84px;"><img alt="" height="auto"
																			src="${softwareImage}"
																			style="display: block; height: auto; border: 0; width: 100%;" title=""
																			width="84" /></div>
																</div>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="75%">
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 28.799999999999997px;">
																	<span class="tinyMce-placeholder"
																		style="word-break: break-word;">${planData.softwares_subscription.name}</span>
																</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 1px; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 19.2px;">
																	<strong>Transaction Details</strong>
																</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	Date & Time:</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;"> ${new
      Date().toLocaleString()}</span>
																</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-7" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	Transaction ID:</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder"
																		style="word-break: break-word;">${transactionId}</span>
																</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-8" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	Type of service:</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">Business
																		Emails</span>
																</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-9" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	Software name:</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder"
																		style="word-break: break-word;">${planData.softwares_subscription.name}</span>
																</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-10" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	Current payment plan:</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">₹
																		${planPrice}/${billingType?.toLowerCase()}</span>
																</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-11" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	Amount paid:</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	₹ ${amount}</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-12" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 40px; padding-top: 35px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1"
														role="presentation"
														style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
														<tr>
															<td class="pad">
																<div
																	style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
																	<p style="margin: 0; margin-bottom: 17px;">Thank you for choosing ${templateDetails?.branding}. We appreciate
																		your trust in us.</p>
																	<p style="margin: 0; margin-bottom: 17px;">If you have any queries or need further
																		assistance, please reach out to us at <a
																			bis_size='{"x":433,"y":723,"w":98,"h":15,"abs_x":433,"abs_y":785}'
																			href="mailto:reach@peko.one" rel="noopener"
																			style="text-decoration: underline; color: #000000;"
																			target="_blank">reach@peko.one</a>. We assure you of our best services at all
																		times.</p>
																	<p style="margin: 0; margin-bottom: 17px;">Best Regards,</p>
																	<p style="margin: 0;">Team ${templateDetails?.branding}</p>
																</div>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-13" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 25px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div align="center" class="alignment" style="line-height:10px">
																	<div style="max-width: 144px;"><img alt="" height="auto"
																			src=${templateDetails?.logo}
																			style="display: block; height: auto; border: 0; width: 100%;" title=""
																			width="144" /></div>
																</div>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-14" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">© ${new
      Date().getUTCFullYear()} Peko Platforms Private Limited
																		, All Rights Reserved</span>
																</h1>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="5" cellspacing="0" class="heading_block block-2"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 14.399999999999999px;">
																	<a href="https://peko.one/in/privacy-policy" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Privacy
																		Policy</a> | <a href="https://peko.one/in/cookie-policy/" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Cookie
																		Policy</a> | <a href="https://peko.one/in/platform-agreement" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Terms of
																		Use</a> |  <a href="https://peko.one/in/refund-policy" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Refund &
																		Cancellation Policy</a><a style="text-decoration: underline; color: #000000;"></a>
																</h1>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="5" cellspacing="0" class="heading_block block-3"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;">
																	<a href="https://peko.one/in" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">www.peko.one</a>
																</h1>
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
				</td>
			</tr>
		</tbody>
	</table><!-- End -->
</body>

</html>`;
};