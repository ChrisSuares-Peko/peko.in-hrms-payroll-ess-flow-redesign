const moment = require("moment");
// const { formatIndiaEmailDateTime } = require("./formatter");
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge } = require('./emailTemplate/sharedLayout');



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
                                       ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}</p>
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

exports.commonFailedTemplate = (name, serviceName, url, templateDetails) => {
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
<title>Failed Telecom &amp; Utility Transaction</title>
<!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]-->
<!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
<!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]-->
<!--[if !mso]><!-- -->
<link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
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

   .h-auto {
     height: auto !important
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
 <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#fefcfc" origin="0.5, 0" position="0.5, 0"></v:fill> </v:background>
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
                             <td align="left" style="padding:0;Margin:0;font-size:0px">
                               <img class="adapt-img"
                                 src="https://gxphmw.stripocdn.email/content/guids/CABINET_06e02bda2aeab991ad3d993634b67f886b4d0871c74bd68d8f8318c43a6028ac/images/levelsimportantletters.png"
                                 alt
                                 style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                 width="220" height="181"/>
                             </td>
                           </tr>
                           <tr style="border-collapse:collapse">
                             <td class="es-m-txt-c" align="left"
                               style="padding:0;Margin:0;padding-bottom:15px;padding-top:30px">
                               <h2
                                 style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#ee221c;text-align:center">
                                 <br/></h2>
                               <h2
                                 style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#ee221c;text-align:left">
                               Payment failed</h2>
                             </td>
                           </tr>
                           <tr style="border-collapse:collapse">
                             <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px">
                                 <br/></p>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px">
                                 We regret to inform you that your payment for ${serviceName} on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")} was unsuccessful. If any amount are deducted from your
                                 account, please be assured that the refund will be processed within 7 to 10 business days.</p>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px">
                                 <br/></p>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px">
                               We appreciate your understanding and patience.&nbsp;&nbsp;</p>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#010101;font-size:15px">
                                 <br/></p>
                             </td>
                           </tr>
                           <tr style="border-collapse:collapse">
                             <td align="center" style="padding:0;Margin:0">
                                                           <a href="${templateDetails?.baseUrl}/payments" target="_blank" hidden>
                                                               <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="${templateDetails?.baseUrl}/payments" style="height:47px; v-text-anchor:middle; width:185px" arcsize="13%" stroke="f" fillcolor="#ff4f4f">
                                                                   <w:anchorlock></w:anchorlock>
                                                                   <center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:14px; font-weight:700; line-height:14px; mso-text-raise:1px'>TRY AGAIN</center>
                                                               </v:roundrect>
                                                           </a>
                               <span class="msohide es-button-border"
                                 style="border-style:solid;border-color:#26A4D3;background:#ff4f4f;border-width:0px;display:inline-block;border-radius:6px;width:auto;mso-hide:all">
                                 <a href="${templateDetails?.baseUrl}/payments" class="es-button" target="_blank"
                                   style="mso-style-priority:100 !important;text-decoration:none;transition:all 100ms ease-in;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#ff4f4f;border-radius:6px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:17px;width:auto;text-align:center;padding:15px 45px;mso-padding-alt:0;mso-border-alt:10px solid #ff4f4f">TRY
                                   AGAIN</a>
                               </span>
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
                             <td align="left" style="padding:0;Margin:0">
                               <br/>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                 Thank you for using ${templateDetails?.branding}.</p>
                                 <br/>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                 If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one">reach@peko.one</a>. We are here to assist you
                                 in any way we can.</p>
                                 <br/>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                Best Regards,</p>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                 Team ${templateDetails?.branding} </p>
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
                             <td align="center" style="padding:0;Margin:0;font-size:0px">
                               <a target="_blank" href="https://peko.one/in"
                                 style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                 <img class="adapt-img"
                                   src=${templateDetails?.logo}
                                   alt
                                   style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                   height="35"/>
                               </a>
                             </td>
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
                                   Policy</a>&nbsp;|&nbsp;
                                 <a href="https://peko.one/in/cookie-policy/"
                                   style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
                                   Policy</a>&nbsp;|&nbsp;&nbsp;
                                 <a href="https://peko.one/in/platform-agreement"
                                   style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
                                   of Use</a>&nbsp;|&nbsp;&nbsp;
                                 <a href="https://peko.one/in/refund-policy"
                                   style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund
                                   & Cancellation Policy</a>
                                 <a target="_blank" class="unsubscribe" href=""
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
                                 <br/></p>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                 <a href="https://peko.one/in"
                                   style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:12px"
                                   target="_blank">www.peko.one</a></p>
                               <p
                                 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                 <br/></p>
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
                                         style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"/></a>
                                   </td>
                                   <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                     <a target="_blank" href="https://www.instagram.com/peko.india"
                                       style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                         title="Instagram"
                                         src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                         alt="Inst" width="24" height="24"
                                         style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"/></a>
                                   </td>
                                   <td valign="top" align="center" style="padding:0;Margin:0">
                                     <a target="_blank" href="https://www.linkedin.com/company/pekoindia/"
                                       style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                         title="Linkedin"
                                         src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                         alt="In" width="24" height="24"
                                         style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"/></a>
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

exports.generateGiftCardPaymentSuccessEmail = (name, transactionId, amount, account, type, serviceProvider, message, senderName, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const heroImage = 'https://d2fduk7g9mvyjq.cloudfront.net/common/gift_car.jpeg';
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  const messageBlock = message
    ? `
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Message from ${senderName?.trim()}:</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">${message}</div>`
    : '';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Gift Card Purchased</title>
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
      <div aria-label="Gift Card Purchased" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="center" style="padding-bottom:24px;word-break:break-word;">
                                  <img alt="Gift card" src="${heroImage}" style="display:block;width:100%;max-width:100%;height:auto;border-radius:16px;" width="1040" />
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Gift card from ${senderName}!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">${senderName} is delighted to send you this wonderful gift card. Please find attached the card details.</div>${messageBlock}
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Best Regards,<br>${senderName}</div>
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
}


exports.generateGiftCardPaymentSuccessEmailToCompany = (
  name,
  transactionId,
  amountPayable,
  account,
  quantity,
  images,
  type,
  serviceProvider,
  cardDetails,
  templateDetails,
  amountPaid = amountPayable,
  giftCardWorth = amountPayable,
) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const cardImage = cardDetails?.brand_logo || cardDetails?.image || '';
  const cardName = cardDetails?.product_name ?? 'Gift Card';
  const cardQuantity = cardDetails?.quantity;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Payment successful.</title>
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
          /* Side-by-side gift-card image + details squeeze the details column to a
             sliver on mobile, forcing one-letter-per-line text - stack them instead. */
          .gc-img-cell, .gc-details-cell { display:block !important; width:100% !important; }
          .gc-img-cell { padding-right:0 !important; padding-bottom:16px !important; }
          .gc-img-cell img { width:100% !important; max-width:220px !important; }
          /* Fixed-width label column leaves too little room for the value on mobile,
             wrapping e.g. the date/time onto a second line - stack label above value instead. */
          .detail-label, .detail-value { display:block !important; width:100% !important; }
          .detail-value { padding-top:2px !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Payment successful." aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Payment successful.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We have received your payment for the gift card successfully. The card details will be sent to the recipient shortly.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:12px;">
                                  <div class="content-text" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;">Transaction Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">Date &amp; Time:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">${moment().format("D/M/YYYY, h:mm:ss A")}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">Transaction ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">Service provider:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">${serviceProvider}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Amount paid:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">₹ ${amountPaid}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#FDF5F0;border-radius:12px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:20px;">
                                          <div class="detail-label" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:16px;">${cardName}</div>
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                ${cardImage ? `<td class="gc-img-cell" width="220" valign="top" style="padding-right:20px;">
                                                  <img alt="${cardName}" src="${cardImage}" style="display:block;max-width:220px;height:auto;border-radius:8px;" width="220" />
                                                </td>` : ''}
                                                <td class="gc-details-cell" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">
                                                  <div style="padding-bottom:6px;">Gift Card Worth: <strong>₹ ${giftCardWorth}</strong></div>
                                                  <div style="padding-bottom:6px;">Quantity: <strong>${cardQuantity}</strong></div>
                                                  <div style="padding-bottom:6px;">Total Amount Paid: <strong>₹ ${amountPaid}</strong></div>
                                                  <div>Company: <strong>${name}</strong></div>
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
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Regards,<br>Team ${branding}</div>
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

exports.newGiftCard = (cards, VoucherDetails) => {
  const rawExpiry = VoucherDetails?.validity || VoucherDetails?.expiration_date || cards?.expiry;
  const expiryDisplay = rawExpiry && moment(rawExpiry).isValid() ? moment(rawExpiry).format("MMM D, YYYY") : "N/A";
  const brandLogoSrc = cards?.image || cards?.images?.onError;

  let cardData = `
    <div class="card m-auto mb-5 mt-3"
                            style="width: 60%;background: #FFF;border-radius: 1.05056rem;border: 0.336px solid #989898;">
                            <div class="text-center mb-3 mt-5">
                                <img style="object-fit: cover; height: 180px;"
                                    src="${brandLogoSrc}"
                                    onerror="this.src='${cards?.images?.onError}';">
                            </div>
                            <div class="text-center mt-3">
                                <p style="font-family: Inter;font-size: 1.2rem; font-weight: 400;">Your eGift Card Value
                                </p>
                                <p style="color: #26A411; font-size: 3rem; font-weight: 700;margin: 0;">₹ ${
                                  cards?.individualCardPrice
                                }</p>
                                <p class="pt-0" style="font-size: 1.1rem;">Valid Until ${expiryDisplay}</p>
                            </div>
 
                            
                            <div class="text-center mb-1 py-2">
                               ${
                                 VoucherDetails.view_code
                                   ? VoucherDetails.view_code.startsWith('http')
                                     ? `<p class="mt-3" style="font-size: 1rem;">Redeem: <a href="${VoucherDetails.view_code}" target="_blank" style="color: #26A411; word-break: break-all;">${VoucherDetails.view_code}</a></p>`
                                     : `<p class="mt-3" style="font-size: 1rem;">Code: ${VoucherDetails.view_code}</p>`
                                   : ""
                               }
                           </div>

                            <div class="text-center mb-2 py-2">
                                ${
                                  cards?.url
                                    ? `<a style="color: #000; font-weight: 400; text-decoration: none;font-size: 1rem;"
                                href="${cards?.url}">${cards?.url}</a>`
                                    : ""
                                }
                                  ${
                                    VoucherDetails.voucher_ref
                                      ? `<p class="mt-3" style="font-size: 1rem;">PIN: ${VoucherDetails.voucher_ref}</p>`
                                      : ""
                                  }
                            </div>
                        </div>`;

  //---------------redemption_instructions---------START
  let redemption_instructions = cards?.terms_and_condition || "";
  let instructionsArray = redemption_instructions.split("\n");
  let olHTML = "";
  // Iterate over the array and create list items (LI) for each item
  for (let instruction of instructionsArray) {
    instruction = instruction.trim();
    if (instruction !== "") {
      olHTML += `<li>${instruction}</li>`;
    }
  }
  //---------------redemption_instructions---------ENDS

  return `<!DOCTYPE html
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
                        <link
                          href="https://fonts.googleapis.com/css?family=Inter:300,300i,400,400i,500,500i,600,600i,700,700i&amp;display=swap"
                          rel="stylesheet">
                      
                        <style type="text/css">
                          body {
                            font-family: Inter;
                          }
                      
                          .tableKey {
                            font-weight: 400;
                            font-size: 1rem;
                            color: #898989;
                      
                          }
                      
                          .tableValue {
                            font-weight: 500;
                            font-size: 1.1rem;
                      
                          }
                        </style>
                      </head>
                      
                      <body>
                        <div class="container mt-4 ">
                          <div class="card ">
                            <div class="card-body">
                              <div class=" mb-5 mt-3">
                                <div
                                   style="width: 100%; min-height: 700px; background-image: url('${cards?.images?.background}'); background-size: cover;">
                                  <div class="text-center pt-5" style="font-size: 1.5rem;font-weight: 500;">Hey, You have a gift
                                                  card</div>
                      
                                  ${cardData}
                                </div>
                                <!-- ABOUT THIS TRIP -->
                                <div style="width: 85%;margin: auto;">
                                  <div class="p-3">
                                  <h6 class="mb-4" style="font-weight: 600;font-size: 1.5rem;">Redemption Details</h6>
                                    <ol style="font-size: 1rem;line-height: 1.5rem;font-weight: 400; list-style-type: disc;">
                                     
                                      ${olHTML}
                      
                                    </ol>
                                  </div>
                                  <div style="text-align: center;">
                                    <div style="text-align: center;">
                                      <img height="40" class="px-2"
                                      src="https://ci3.googleusercontent.com/proxy/j8Vgg6n4fc06J6U5PZshg5xYfAUATOjVkWOCHaF15oSl3Yq4lJtaLRcJqHFS-Qt6WSteVfxG4whCDegOREmX4lH0eJTW7xbepQFoDb4ZjRJ_qJqexn-dVRKk2YBtLMeBYj-9zoFlf48UxgJ74MsW3Y-mBDXto1tzJ0E2S98YWUEzBC99H0HTFxtXZLVJSs8YNbksUqD4IDaARx8C9g=s0-d-e1-ft#https://gxphmw.stripocdn.email/content/guids/CABINET_e1042080f08809c34d972d88b7d0e7d2aa55cade9ded8a48207bad47a41e7228/images/peko_FLL.png"
                                        alt="">
                                    </div>
                                    <div class="my-2" style="font-size: 1rem;font-weight: 400;color: #545454;">
                                    For any queries or support, please contact us at <a href="mailto:reach@peko.one">reach@peko.one</a>
                                  </div>             
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
                      </body>
                      
                      </html>`;
};
