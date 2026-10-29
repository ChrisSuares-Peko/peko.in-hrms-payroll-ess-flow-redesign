const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2RejectBadge, v2SuccessBadge } = require("../emailTemplate/sharedLayout");

exports.emailOTPTemaplte = (name, otp, message) => {
  return `
<!DOCTYPE html
 PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"
 style="padding: 0; margin: 0">

<head>
 <meta charset="UTF-8" />
 <meta content="width=device-width, initial-scale=1" name="viewport" />
 <meta name="x-apple-disable-message-reformatting" />
 <meta http-equiv="X-UA-Compatible" content="IE=edge" />
 <meta content="telephone=no" name="format-detection" />
 <title>Welcome Note</title>
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
 <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet" />
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

<body style="
       font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif;
       width: 100%;
       -webkit-text-size-adjust: 100%;
       -ms-text-size-adjust: 100%;
       padding: 0;
       margin: 0;
     ">
 <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color: #fefcfc">
   <!--[if gte mso 9
         ]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
           <v:fill type="tile" color="#fefcfc"></v:fill> </v:background
       ><![endif]-->
   <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="
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
           background-color: #fefcfc;
         ">
     <tr style="border-collapse: collapse">
       <td valign="top" style="padding: 0; margin: 0">
         <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none" style="
                 mso-table-lspace: 0pt;
                 mso-table-rspace: 0pt;
                 border-collapse: collapse;
                 border-spacing: 0px;
                 table-layout: fixed !important;
                 width: 100%;
               ">
           <tr style="border-collapse: collapse">
             <td align="center" style="padding: 0; margin: 0">
               <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                 role="none" style="
                       mso-table-lspace: 0pt;
                       mso-table-rspace: 0pt;
                       border-collapse: collapse;
                       border-spacing: 0px;
                       background-color: #ffffff;
                       width: 710px;
                     ">
                 <tr style="border-collapse: collapse">
                   <td align="left" style="
                           padding: 0;
                           margin: 0;
                           padding-top: 5px;
                           padding-left: 20px;
                           padding-right: 40px;
                         ">
                     <table cellpadding="0" cellspacing="0" width="100%" role="none" style="
                             mso-table-lspace: 0pt;
                             mso-table-rspace: 0pt;
                             border-collapse: collapse;
                             border-spacing: 0px;
                           ">
                       <tr style="border-collapse: collapse">
                         <td align="center" valign="top" style="padding: 0; margin: 0; width: 650px">
                           <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                   mso-table-lspace: 0pt;
                                   mso-table-rspace: 0pt;
                                   border-collapse: collapse;
                                   border-spacing: 0px;
                                 ">
                             <tr style="border-collapse: collapse">
                               <td align="left" style="
                                       padding: 0;
                                       margin: 0;
                                       font-size: 0px;
                                     ">
                                 <img class="adapt-img"
                                   src="https://gxphmw.stripocdn.email/content/guids/CABINET_360c2d05d66d1afd304e6c6760eb1c1c6bd03191ba0ac3d8fdb620f45388db28/images/folkscybersecurity.png"
                                   alt style="
                                         display: block;
                                         border: 0;
                                         outline: none;
                                         text-decoration: none;
                                         -ms-interpolation-mode: bicubic;
                                       " width="240" height="180" />
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                   </td>
                 </tr>
                 <tr style="border-collapse: collapse">
                   <td align="left" bgcolor="#ffffff" style="
                           padding: 0;
                           margin: 0;
                           padding-top: 40px;
                           padding-left: 40px;
                           padding-right: 40px;
                           background-color: #ffffff;
                         ">
                     <table width="100%" cellspacing="0" cellpadding="0" role="none" style="
                             mso-table-lspace: 0pt;
                             mso-table-rspace: 0pt;
                             border-collapse: collapse;
                             border-spacing: 0px;
                           ">
                       <tr style="border-collapse: collapse">
                         <td valign="top" align="center" style="padding: 0; margin: 0; width: 630px">
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="
                                   mso-table-lspace: 0pt;
                                   mso-table-rspace: 0pt;
                                   border-collapse: collapse;
                                   border-spacing: 0px;
                                 ">
                             <tr style="border-collapse: collapse">
                               <td align="left" style="
                                       padding: 0;
                                       margin: 0;
                                       padding-bottom: 10px;
                                     ">
                                 <h2 style="
                                         margin: 0;
                                         line-height: 36px;
                                         mso-line-height-rule: exactly;
                                         font-family: roboto, 'helvetica neue',
                                           helvetica, arial, sans-serif;
                                         font-size: 30px;
                                         font-style: normal;
                                         font-weight: bold;
                                         color: #010201;
                                         text-align: left;
                                       ">
                                   Verify your account!
                                 </h2>
                                 <p style="
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
                                 <p style="
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
                                   Dear ${name},
                                 </p>
                                 <p style="
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
                                 <p style="
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
                                   Please use the OTP given below to complete the account verification process
                                   ${message ? `, ${message}` : ''}. This OTP is valid for 2 minutes only.
                                 </p>
                                 <p style="
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
                                 <p style="
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
                                   Your one-time password (OTP)
                                 </p>
                                 <p style="
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
                             <tr style="border-collapse: collapse">
                               <td class="h-auto" align="center" bgcolor="#fbfafa" height="112" style="
                                       padding: 0;
                                       margin: 0;
                                       padding-bottom: 10px;
                                     ">
                                 <h2 style="
                                         margin: 0;
                                         line-height: 29px;
                                         mso-line-height-rule: exactly;
                                         font-family: roboto, 'helvetica neue',
                                           helvetica, arial, sans-serif;
                                         font-size: 24px;
                                         font-style: normal;
                                         font-weight: bold;
                                         color: #010201;
                                         text-align: center;
                                       ">
                                   <br />
                                 </h2>
                                 <h2 style="
                                         margin: 0;
                                         line-height: 41px;
                                         mso-line-height-rule: exactly;
                                         font-family: roboto, 'helvetica neue',
                                           helvetica, arial, sans-serif;
                                         font-size: 30px;
                                         font-style: normal;
                                         font-weight: bold;
                                         color: #010201;
                                         text-align: center;
                                       ">
                                   <strong><span style="font-size: 34px">${otp}</span></strong>
                                 </h2>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 18px;
                                         color: #010201;
                                         font-size: 15px;
                                       ">
                                   <br />
                                 </p>
                               </td>
                             </tr>
                             <tr style="border-collapse: collapse">
                               <td align="left" style="
                                       padding: 0;
                                       margin: 0;
                                       padding-bottom: 10px;
                                     ">
                                 <h2 style="
                                         margin: 0;
                                         line-height: 26px;
                                         mso-line-height-rule: exactly;
                                         font-family: roboto, 'helvetica neue',
                                           helvetica, arial, sans-serif;
                                         font-size: 22px;
                                         font-style: normal;
                                         font-weight: bold;
                                         color: #111b15;
                                         text-align: center;
                                       ">
                                   <br />
                                 </h2>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
                                         font-size: 15px;
                                       ">
                                   Your OTP is confidential. Please do not share it with anyone.
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
                                         font-size: 15px;
                                       ">
                                   <br />
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
                                         font-size: 15px;
                                       ">

                                   Thank you for using Peko. <br>
                                   If you have any queries or need further assistance, please reach out to us at <a
                                     href="mailto:reach@peko.one">reach@peko.one</a>. We are here to assist you in any
                                   way we can.
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
                                         font-size: 15px;
                                       ">
                                   <br />
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
                                         font-size: 15px;
                                       ">
                                   <br />
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
                                         font-size: 15px;
                                       ">
                                   Best Regards,
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
                                         font-size: 15px;
                                       ">
                                   Team Peko
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 23px;
                                         color: #111b15;
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
         <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="
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
               <table class="es-footer-body" style="
                       mso-table-lspace: 0pt;
                       mso-table-rspace: 0pt;
                       border-collapse: collapse;
                       border-spacing: 0px;
                       background-color: #ffffff;
                       width: 710px;
                     " cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
                 <tr style="border-collapse: collapse">
                   <td align="left" bgcolor="#ffffff" style="
                           padding: 40px;
                           margin: 0;
                           background-color: #ffffff;
                           border-radius: 5px;
                         ">
                     <table width="100%" cellspacing="0" cellpadding="0" role="none" style="
                             mso-table-lspace: 0pt;
                             mso-table-rspace: 0pt;
                             border-collapse: collapse;
                             border-spacing: 0px;
                           ">
                       <tr style="border-collapse: collapse">
                         <td valign="top" align="center" style="padding: 0; margin: 0; width: 630px">
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="
                                   mso-table-lspace: 0pt;
                                   mso-table-rspace: 0pt;
                                   border-collapse: collapse;
                                   border-spacing: 0px;
                                 ">
                             <tr style="border-collapse: collapse">
                               <td align="center" style="
                                       padding: 0;
                                       margin: 0;
                                       font-size: 0px;
                                     ">
                                 <a target="_blank" href="https://peko.one/in" style="
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         text-decoration: underline;
                                         color: #666666;
                                         font-size: 12px;
                                       "><img class="adapt-img"
                                     src="https://gxphmw.stripocdn.email/content/guids/CABINET_674b0d0a49570ab72e7f6bd66180cf3d1d634b107ad71e4b66e3d678ba50cd6e/images/peko.png"
                                     alt style="
                                           display: block;
                                           border: 0;
                                           outline: none;
                                           text-decoration: none;
                                           -ms-interpolation-mode: bicubic;
                                         " width="110" height="35" /></a>
                               </td>
                             </tr>
                             <tr style="border-collapse: collapse">
                               <td align="center" style="
                                       padding: 0;
                                       margin: 0;
                                       padding-top: 10px;
                                       padding-bottom: 10px;
                                     ">
                                 <p style="
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
                               <td align="center" style="
                                       padding: 0;
                                       margin: 0;
                                       padding-bottom: 10px;
                                     ">
                                 <p style="
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
                                   <a href="https://peko.one/in/privacy-policy" style="
                                           -webkit-text-size-adjust: none;
                                           -ms-text-size-adjust: none;
                                           mso-line-height-rule: exactly;
                                           text-decoration: underline;
                                           color: #666666;
                                           font-size: 12px;
                                         ">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/"
                                     style="
                                           -webkit-text-size-adjust: none;
                                           -ms-text-size-adjust: none;
                                           mso-line-height-rule: exactly;
                                           text-decoration: underline;
                                           color: #666666;
                                           font-size: 12px;
                                         ">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a
                                     href="https://peko.one/in/platform-agreement" style="
                                           -webkit-text-size-adjust: none;
                                           -ms-text-size-adjust: none;
                                           mso-line-height-rule: exactly;
                                           text-decoration: underline;
                                           color: #666666;
                                           font-size: 12px;
                                         ">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                     href="https://peko.one/in/refund-policy/" style="
                                           -webkit-text-size-adjust: none;
                                           -ms-text-size-adjust: none;
                                           mso-line-height-rule: exactly;
                                           text-decoration: underline;
                                           color: #666666;
                                           font-size: 12px;
                                         ">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe"
                                     href="" style="
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
                               <td align="center" style="padding: 0; margin: 0">
                                 <p style="
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
                   <td align="left" bgcolor="#0c0c0c" style="
                           margin: 0;
                           padding-top: 5px;
                           padding-bottom: 25px;
                           padding-left: 40px;
                           padding-right: 40px;
                           background-color: #0c0c0c;
                         ">
                     <table width="100%" cellspacing="0" cellpadding="0" role="none" style="
                             mso-table-lspace: 0pt;
                             mso-table-rspace: 0pt;
                             border-collapse: collapse;
                             border-spacing: 0px;
                           ">
                       <tr style="border-collapse: collapse">
                         <td valign="top" align="center" style="padding: 0; margin: 0; width: 630px">
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="
                                   mso-table-lspace: 0pt;
                                   mso-table-rspace: 0pt;
                                   border-collapse: collapse;
                                   border-spacing: 0px;
                                 ">
                             <tr style="border-collapse: collapse">
                               <td align="center" style="padding: 0; margin: 0">
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 18px;
                                         color: #ffffff;
                                         font-size: 12px;
                                       ">
                                   <br />
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 18px;
                                         color: #ffffff;
                                         font-size: 12px;
                                       ">
                                   <a href="https://peko.one/in" style="
                                           -webkit-text-size-adjust: none;
                                           -ms-text-size-adjust: none;
                                           mso-line-height-rule: exactly;
                                           text-decoration: none;
                                           color: #ffffff;
                                           font-size: 12px;
                                         " target="_blank">www.peko.one</a>
                                 </p>
                                 <p style="
                                         margin: 0;
                                         -webkit-text-size-adjust: none;
                                         -ms-text-size-adjust: none;
                                         mso-line-height-rule: exactly;
                                         font-family: helvetica, 'helvetica neue',
                                           arial, verdana, sans-serif;
                                         line-height: 18px;
                                         color: #ffffff;
                                         font-size: 12px;
                                       ">
                                   <br />
                                 </p>
                               </td>
                             </tr>
                             <tr style="border-collapse: collapse">
                               <td align="center" style="padding: 0; margin: 0; font-size: 0">
                                 <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0"
                                   role="presentation" style="
                                         mso-table-lspace: 0pt;
                                         mso-table-rspace: 0pt;
                                         border-collapse: collapse;
                                         border-spacing: 0px;
                                       ">
                                   <tr style="border-collapse: collapse">
                                     <td valign="top" align="center" style="
                                             padding: 0;
                                             margin: 0;
                                             padding-right: 10px;
                                           ">
                                       <a target="_blank" href="https://x.com/PekoIndia" style="
                                               -webkit-text-size-adjust: none;
                                               -ms-text-size-adjust: none;
                                               mso-line-height-rule: exactly;
                                               text-decoration: underline;
                                               color: #666666;
                                               font-size: 12px;
                                             "><img title="Twitter"
                                           src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                           alt="Tw" width="24" height="24" style="
                                                 display: block;
                                                 border: 0;
                                                 outline: none;
                                                 text-decoration: none;
                                                 -ms-interpolation-mode: bicubic;
                                               " /></a>
                                     </td>
                                     <td valign="top" align="center" style="
                                             padding: 0;
                                             margin: 0;
                                             padding-right: 10px;
                                           ">
                                       <a target="_blank" href="https://www.instagram.com/peko.india" style="
                                               -webkit-text-size-adjust: none;
                                               -ms-text-size-adjust: none;
                                               mso-line-height-rule: exactly;
                                               text-decoration: underline;
                                               color: #666666;
                                               font-size: 12px;
                                             "><img title="Instagram"
                                           src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                           alt="Inst" width="24" height="24" style="
                                                 display: block;
                                                 border: 0;
                                                 outline: none;
                                                 text-decoration: none;
                                                 -ms-interpolation-mode: bicubic;
                                               " /></a>
                                     </td>
                                     <td valign="top" align="center" style="padding: 0; margin: 0">
                                       <a target="_blank" href="https://www.linkedin.com/company/pekoindia/" style="
                                               -webkit-text-size-adjust: none;
                                               -ms-text-size-adjust: none;
                                               mso-line-height-rule: exactly;
                                               text-decoration: underline;
                                               color: #666666;
                                               font-size: 12px;
                                             "><img title="Linkedin"
                                           src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                           alt="In" width="24" height="24" style="
                                                 display: block;
                                                 border: 0;
                                                 outline: none;
                                                 text-decoration: none;
                                                 -ms-interpolation-mode: bicubic;
                                               " /></a>
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
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const retryUrl = url || `${templateDetails?.baseUrl}/payments`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your payment failed</title>
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
      <div aria-label="Your payment failed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2RejectBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#ee221c;">Your payment failed</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We regret to inform you that your ${serviceName} payment on ${new Date().toLocaleString()} was unsuccessful. If any amount was deducted from your account, please be assured that the refund will be processed within 7 to 10 business days.</div>
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
                                        <td align="center" bgcolor="#181818" style="border-radius:12px;">
                                          <a href="${retryUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Try Again</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards<br>Team ${branding}</div>
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

exports.ZohoMockInvoice = (corporateTxnId, date, name, items, subtotal, totalTax, total, zeroTaxableAmount, standardTaxableAmount) => {
  return `
 <!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice - Peko Payment Services LLC</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                /*padding: 20px;*/
                color: #333;
                font-size: 13.5px;
                /*margin: 20px;*/
                background-color: #fff;
            }
            .invoice-container {
                /*max-width: 800px;*/
                margin: 0 auto;
                background-color: #fff;
                padding-inline-end: 40px;
                padding-inline-start: 60px;
                padding-top: 80px;
                padding-bottom: 80px;
                border: 1px solid #ddd;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                padding-bottom: 10px;
            }
            .header-left {
                flex: 1;
            }
            .header-right {
                text-align: right;
            }
            .header h1 {
                font-size: 24px;
                margin: 0;
                color: #040404;
            }
            .invoice-title {
                font-size: 34px;
            }
            .balance-due {
                font-size: 11.5px;
                font-weight: bold;
            }
            .balance-due-amt {
                font-size: 17px;
                font-weight: bold;
            }
            .company-title {
                font-weight: bold;
            }
            .header p {
                margin: 5px 0;
                color: #666;
            }
            .header .invoice-info {
                color: #040404;
                margin-top: 10px;
            }
            .header .invoice-info p {
                margin: 3px 0;
                color: #040404;
            }
            .invoice-sub-info {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .invoice-sub-info p {
                display: flex;
                justify-content: space-between;
                width: 100%;
                min-width: 260px;
                max-width: 380px;
                margin: 5px 0;
            }
            .invoice-sub-info .label {
                flex: 1;
                text-align: right;
                color: #040404;
            }
            .invoice-sub-info .value {
                flex: 2;
                text-align: right;
                color: #666;
            }
            .bill-to h2 {
                font-size: 13.5px;
                margin: 0 0 10px;
                color: #040404;
            }
            .bill-to p {
                margin: 0;
                color: #666;
            }
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .invoice-table th,
            .invoice-table td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
            }
            .invoice-table th {
                background-color: #f2f2f2;
                color: #040404;
            }
            .invoice-table td {
                background-color: #fff;
            }
            .total-section {
                text-align: right;
                margin-bottom: 20px;
            }
            .total-section p {
                margin: 5px 0;
                color: #040404;
            }
            .tax-summary h2 {
                font-size: 13.5px;
                margin: 70px 0 -20px;
                font-weight: normal;
                color: #040404;
            }
            .notes {
                text-align: left;
                color: #666;
                font-size: 12px;
            }
            .notes-heading {
              font-size: 13.5px !important;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 13.5px;
            }
            th {
                background-color: #333;
                color: #d7dad7;
                padding: 8px 15px;
                text-align: left;
                font-weight: normal;
            }
            th.align-right {
                text-align: right;
            }
            td {
                padding: 12px 15px;
                border-bottom: 1px solid #e0e0e0;
            }
            .amount-cell {
                text-align: right;
                font-variant-numeric: tabular-nums;
                font-feature-settings: "tnum";
                max-width: 40px;
            }
            .qty-cell {
                text-align: right;
                max-width: 40px;
            }
            .summary-cell {
                min-width: 70px !important;
            }
            .description-cell {
                min-width: 200px !important;
            }
            .tax-rate {
                color: #666;
                font-size: 13px;
                display: block;
            }
            .summary-row td {
                border-bottom: 1px solid #e0e0e0;
            }
            .payment-row td {
                color: #666;
                border-bottom: none;
            }
            .payment-amount {
                color: red !important;
            }
            .balance-row td {
                border-bottom: none;
                font-weight: bold;
            }
            .balance-row .bg-cell {
                background-color: #f5f5f5;
            }
            .number-column {
                color: #040404;
                width: 5px;
            }
            .summary-label {
                font-weight: bold;
                text-align: right;
                min-width: 60.5px !important;
            }
            .payment-made-label {
                text-align: right;
            }
            .total-row td {
                font-weight: bold;
                border-bottom: none;
            }
            .tax-summary {
                margin-top: 30px;
                margin-bottom: 20px;
            }
            .tax-summary .tax-col {
               width: 120px;
            }
            .tax-summary .taxable-col {
               width: 180px;
            }
            .tax-summary th:first-child {
                text-align: left;
            }
            .tax-summary td:first-child {
                text-align: left;
            }
            .tax-total-row {
                font-weight: bold;
            }
            .tax-total-row td {
                border-top: 1px solid #e0e0e0;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="header-left">
                    <span class="company-title">Peko Payment Services LLC</span>
                    <p>
                        209B, Al Nakheel Building <br />
                        Al Karama <br />
                        Dubai, United Arab Emirates <br />
                    </p>
                    <p>
                        TRN: 104055051700003 <br />
                        <a href="mailto:accounts@peko.one" style="color: #666; text-decoration: none;">accounts@peko.one</a>
                    </p>
                </div>
                <div class="header-right">
                    <div class="invoice-info">
                        <span class="invoice-title">TAX INVOICE</span>
                        <p><strong># INV-${corporateTxnId}</strong></p>
                        <br />
                        <p class="balance-due"><strong>Balance Due</strong></p>
                        <span class="balance-due-amt">₹ 0.00</span>
                    </div>
                </div>
            </div>

            <div class="header">
                <div class="bill-to">
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p>Bill To</p>
                    <h2>${name}</h2>
                </div>
                <div class="header-right">
                    <div class="invoice-sub-info">
                        <p><span class="label">Invoice Date:</span> <span class="value">${date}</span></p>
                        <p><span class="label">Terms:</span> <span class="value">Due On Receipt</span></p>
                        <p><span class="label">Due Date:</span> <span class="value">${date}</span></p>
                        <p><span class="label">P.O.#:</span> <span class="value">${corporateTxnId}</span></p>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item & Description</th>
                        <th class="align-right">Qty</th>
                        <th class="align-right">Rate</th>
                        <th class="align-right">Taxable <br> Amount</th>
                        <th class="align-right">Tax</th>
                        <th class="align-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, i) => `
                        <tr>
                            <td class="number-column">${i+1}</td>
                            <td class="description-cell">${item.name}</td>
                            <td class="qty-cell">${item.quantity}</td>
                            <td class="amount-cell">${item.rate}</td>
                            <td class="amount-cell">${item.taxableAmount}</td>
                            <td class="amount-cell">
                                ${item.taxRate}
                                <span class="tax-rate">${item.tax}%</span>
                            </td>
                            <td class="amount-cell">${item.total}</td>
                        </tr>
                    `).join('')}
                    <tr class="summary-row">
                        <td colspan="3"></td>
                        <td class="summary-label">Sub Total</td>
                        <td class="amount-cell">${subtotal}</td>
                        <td class="amount-cell">${totalTax}</td>
                        <td class="amount-cell">${total}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="6" class="summary-label">Total &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        <td class="amount-cell summary-cell">₹${total}</td>
                    </tr>
                    <tr class="payment-row">
                        <td colspan="6" class="payment-made-label">Payment Made &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        <td class="amount-cell payment-amount summary-cell">(-) ${total}</td>
                    </tr>
                    <tr class="balance-row">
                        <td colspan="3"></td>
                        <td colspan="3" class="summary-label bg-cell">Balance Due &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                        <td class="amount-cell bg-cell summary-cell">₹0.00</td>
                    </tr>
                </tbody>
            </table>

            <div class="tax-summary">
                <h2>Tax Summary</h2>
                <table class="tax-summary">
                    <thead>
                        <tr>
                            <th>Tax Details</th>
                            <th class="align-right taxable-col">Taxable Amount (₹)</th>
                            <th class="align-right tax-col">Tax Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Zero Rate (0%)</td>
                            <td class="amount-cell">${zeroTaxableAmount}</td>
                            <td class="amount-cell">0.00</td>
                        </tr>
                        <tr>
                            <td>Standard Rate (5%)</td>
                            <td class="amount-cell">${standardTaxableAmount}</td>
                            <td class="amount-cell">${totalTax}</td>
                        </tr>
                        <tr class="tax-total-row">
                            <td>Total</td>
                            <td class="amount-cell">₹${subtotal}</td>
                            <td class="amount-cell">₹${totalTax}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="notes">
                <p class="notes-heading">Notes</p>
                <p>Thanks for your business.</p>
            </div>
        </div>
    </body>
</html>

  `
} 
exports.refundFailure = (params, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Refund failed</title>
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
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Refund failed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2RejectBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-top:20px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#ee221c;">Refund failed</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${params?.name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We regret to inform you that your refund of ₹ ${params?.amount} for ${params?.transactionId} has failed due to technical issues on our end. We apologize for any inconvenience this may cause. Please be assured that our team is diligently working on this issue and the refund will be processed within 7 to 10 business days.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We appreciate your understanding and patience.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;text-decoration:underline;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">Best Regards,<br>Team ${branding}</div>
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

exports.refundInitiated = (params, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  const serviceProviderLine = params?.serviceProvider
    ? `<div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:4px;">Service Provider: ${params.serviceProvider}</div>`
    : '';
  const typeOfServiceLine = params?.typeOfService
    ? `<div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:4px;">Service Type: ${params.typeOfService}</div>`
    : '';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Refund initiated</title>
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
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Refund initiated" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="padding-top:20px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Refund initiated</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${params?.name || 'Customer'},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We would like to inform you that your refund request for ₹ ${params?.amount || '0'} for Transaction ID: ${params?.transactionId || 'N/A'} has been successfully initiated.</div>
                                  ${serviceProviderLine}
                                  ${typeOfServiceLine}
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">The refund will be credited to your original payment method within 7 to 10 business days. Kindly note that the exact timeframe may vary based on your financial institution's processing procedures.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We appreciate your understanding and patience.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;text-decoration:underline;">reach@peko.one</a>. We are here to assist you in any way we can.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">Best Regards,<br>Team ${branding}</div>
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
