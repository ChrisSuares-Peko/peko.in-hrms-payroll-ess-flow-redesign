// "Your report is ready" email for Car Reports — same structure and voice as the
// billpayments success template (partner branding, Dear-name greeting, details table,
// Team sign-off, partner logo footer). A copy lives in
// scheduler/utils/email/emailTemplates/carReport.js — change both together.
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'staging') {
    return process.env.FRONTEND_STAGING_URL || 'https://uatin.pekoapp.com';
  }
  return process.env.FRONTEND_PRODUCTION_URL || 'https://in.peko.one';
};

exports.generateReportReadyEmail = (name, partnerDetails, reportName, vehicleLabel, transactionId) => {
  // CTA deep-links to the order page — never the raw PDF; the page serves the download.
  const buttonUrl = `${getFrontendUrl()}/turbo/vehicle-reports/orders/order-details?orderId=${transactionId}`;
  const downloadButton = `<tr>
           <td style="padding:20px 40px 0 40px" align="left">
             <a href="${buttonUrl}" target="_blank" rel="noopener"
                style="display:inline-block;background-color:#E5484D;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:6px">
               View report
             </a>
           </td>
         </tr>`;
  return `
<!DOCTYPE html
 PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" lang="en" style="padding:0;Margin:0">
<head>
 <meta charset="UTF-8">
 <meta content="width=device-width, initial-scale=1" name="viewport">
 <meta http-equiv="X-UA-Compatible" content="IE=edge">
 <title>Your report is ready</title>
 <style type="text/css">
   #outlook a { padding: 0; }
   .ExternalClass { width: 100%; }
   .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
   body { font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; width: 100%; padding: 0; Margin: 0; }
 </style>
</head>
<body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
 <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f6f6f6;padding:24px 0;Margin:0">
   <tr>
     <td align="center">
       <table width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden">
         <tr>
           <td style="padding:32px 40px 0 40px">
             <p style="Margin:0;margin-bottom:16px;font-size:14px;color:#333333;line-height:150%">Dear ${name},</p>
             <p style="Margin:0;margin-bottom:16px;font-size:14px;color:#333333;line-height:150%">
               Your <strong>${reportName}</strong>${vehicleLabel ? ` for <strong>${vehicleLabel}</strong>` : ''} is ready.
               Log in and open <strong>Turbo &rarr; Vehicle Reports &rarr; Order history</strong> to view and download it.
             </p>
           </td>
         </tr>
         <tr>
           <td style="padding:0 40px">
             <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #efefef;border-radius:6px">
               <tr>
                 <td style="padding:10px 16px;font-size:13px;color:#666666;border-bottom:1px solid #efefef">Report</td>
                 <td style="padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #efefef" align="right"><strong>${reportName}</strong></td>
               </tr>
               ${vehicleLabel ? `<tr>
                 <td style="padding:10px 16px;font-size:13px;color:#666666;border-bottom:1px solid #efefef">Vehicle</td>
                 <td style="padding:10px 16px;font-size:13px;color:#333333;border-bottom:1px solid #efefef" align="right"><strong>${vehicleLabel}</strong></td>
               </tr>` : ''}
               <tr>
                 <td style="padding:10px 16px;font-size:13px;color:#666666">Transaction ID</td>
                 <td style="padding:10px 16px;font-size:13px;color:#333333" align="right"><strong>${transactionId}</strong></td>
               </tr>
             </table>
           </td>
         </tr>
         ${downloadButton}
         <tr>
           <td style="padding:24px 40px 0 40px">
             <p style="Margin:0;margin-bottom:8px;font-size:13px;color:#666666;line-height:150%">
               This report was prepared and delivered by Droom, ${partnerDetails?.branding}'s certified partner.
             </p>
             <p style="Margin:0;margin-bottom:17px;font-size:14px;color:#333333;line-height:150%">Thank you for choosing ${partnerDetails?.branding}. We appreciate your business.</p>
             <p style="Margin:0;margin-bottom:24px;font-size:14px;color:#333333;line-height:150%">
               Regards,<br>
               Team ${partnerDetails?.branding}
             </p>
           </td>
         </tr>
         <tr>
           <td style="padding:16px 40px 32px 40px;border-top:1px solid #efefef" align="left">
             <img class="adapt-img" src="${partnerDetails?.logo}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="110" height="35">
           </td>
         </tr>
       </table>
     </td>
   </tr>
 </table>
</body>
</html>`;
};
