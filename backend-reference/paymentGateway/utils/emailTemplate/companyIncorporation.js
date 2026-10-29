const { commonFailedTemplate } = require('./common');

const getServiceUrl = () => {
    if (process.env.NODE_ENV === 'staging') {
        return process.env.FRONTEND_STAGING_URL || 'https://uatin.pekoapp.com';
    }
    return process.env.FRONTEND_PRODUCTION_URL || 'https://in.peko.one';
};

const detailRow = (label, value, valueColor = '#101112') => `
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
                            <tbody><tr><td>
                                <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                                    <tbody><tr>
                                        <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad" style="width:100%;">
                                                <div style="color:#101112;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;line-height:120%;text-align:left;">${label}</div>
                                            </td></tr></table>
                                        </td>
                                        <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="50%">
                                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad" style="width:100%;">
                                                <div style="color:${valueColor};font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:700;line-height:120%;text-align:left;">${value}</div>
                                            </td></tr></table>
                                        </td>
                                    </tr></tbody>
                                </table>
                            </td></tr></tbody>
                        </table>`;

const ctaButton = (url, label, bg = '#ff4f4f') => `
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                            <tbody><tr><td>
                                <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                                    <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: center; padding-top: 20px; padding-bottom: 15px; vertical-align: top;" width="100%">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin: 0 auto; border-collapse: separate;">
                                            <tr><td align="center" bgcolor="${bg}" style="border-radius: 53px;">
                                                <a href="${url}" target="_blank" style="display:inline-block;padding:15px 40px;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:bold;line-height:17px;color:#ffffff;text-decoration:none;border-radius:53px;background:${bg};">${label}</a>
                                            </td></tr>
                                        </table>
                                    </td></tr></tbody>
                                </table>
                            </td></tr></tbody>
                        </table>`;

exports.paymentSuccessEmail = (name, applicationId, amount, partnerDetails) => {
    const serviceUrl = getServiceUrl();
    const branding = partnerDetails?.branding || 'Peko';
    return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
    <title></title>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
        p { line-height: inherit; }
        @media (max-width:500px) {
            .row-content { width: 100% !important; }
            .stack .column { width: 100%; display: block; }
        }
    </style>
</head>
<body class="body" style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
        <tbody><tr><td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 5px; padding-top: 35px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad" style="width:100%;">
                                <div align="center" style="line-height:10px"><img class="adapt-img" src="https://gxphmw.stripocdn.email/content/guids/CABINET_c147c971c4de6ccc5b3a3ac239f9f66ca2825d24ce08ef9cabcd7e89dc78e8bb/images/frame_1597882534_d2c.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="271" height="94"></div>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad" style="text-align:center;width:100%;">
                                <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 700; line-height: 120%; text-align: center;">Payment Successful</h1>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 20px; padding-top: 15px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%"><tr><td class="pad">
                                <div style="color:#101112;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;line-height:150%;text-align:left;">
                                    <p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
                                    <p style="margin: 0;">Your payment for Company Incorporation has been received successfully. Your application is now submitted for processing.</p>
                                </div>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad" style="width:100%;">
                                <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; line-height: 120%; text-align: left;"><strong>Transaction Details</strong></h1>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
            ${detailRow('Application ID', applicationId)}
            ${detailRow('Amount Paid', `&#8377; ${Number(amount).toFixed(2)}`)}
            ${detailRow('Status', 'Submitted', '#26A411')}
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 5px; padding-top: 20px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%"><tr><td class="pad">
                                <div style="color:#101112;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;line-height:150%;text-align:left;">
                                    <p style="margin: 0;">Our team will review your application and update the status accordingly. You can track your application status in the Company Incorporation section.</p>
                                </div>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
            ${ctaButton(`${serviceUrl}/more-services/company-incorporation`, 'Track Application')}
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 40px; padding-top: 15px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%"><tr><td class="pad">
                                <div style="color:#101112;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;line-height:150%;text-align:left;">
                                    <p style="margin: 0; margin-bottom: 17px;">Thank you for using ${branding}. If you have any queries, reach us at <a href="mailto:reach@peko.one" style="text-decoration: underline; color: #000000;">reach@peko.one</a>.</p>
                                    <p style="margin: 0; margin-bottom: 4px;">Best Regards,</p>
                                    <p style="margin: 0;">Team ${branding}</p>
                                </div>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 15px; padding-top: 25px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad" style="width:100%;">
                                <div align="center" style="line-height:10px">${partnerDetails?.logo ? `<img class="adapt-img" src="${partnerDetails.logo}" alt="${branding}" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="136" height="55" />` : ''}</div>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody><tr><td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; width: 480px; margin: 0 auto;" width="480">
                        <tbody><tr><td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top;" width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad" style="text-align:center;width:100%;">
                                <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 120%; text-align: center;">&copy; ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</h1>
                            </td></tr></table>
                            <table border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad">
                                <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; line-height: 120%; text-align: center;"><a href="https://peko.one/in/privacy-policy/" style="text-decoration: underline; color: #000000;" target="_blank">Privacy Policy</a> | <a href="https://peko.one/in/cookie-policy/" style="text-decoration: underline; color: #000000;" target="_blank">Cookie Policy</a> | <a href="https://peko.one/in/platform-agreement" style="text-decoration: underline; color: #000000;" target="_blank">Terms of Use</a> | <a href="https://peko.one/in/refund-policy" style="text-decoration: underline; color: #000000;" target="_blank">Refund & Cancellation Policy</a></h1>
                            </td></tr></table>
                            <table border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%"><tr><td class="pad">
                                <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; line-height: 120%; text-align: center;"><a href="https://peko.one/in" style="text-decoration: underline; color: #000000;" target="_blank">www.peko.one</a></h1>
                            </td></tr></table>
                        </td></tr></tbody>
                    </table>
                </td></tr></tbody>
            </table>
        </td></tr></tbody>
    </table>
</body>
</html>`;
};

exports.paymentFailedEmail = (name, applicationId, partnerDetails) => {
    const serviceUrl = getServiceUrl();
    return commonFailedTemplate(
        name,
        'pay for your Company Incorporation',
        `${serviceUrl}/more-services/company-incorporation`,
        partnerDetails,
    );
};
