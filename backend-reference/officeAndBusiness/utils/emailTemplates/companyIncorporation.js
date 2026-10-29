const getServiceUrl = () => {
    if (process.env.NODE_ENV === 'staging') {
        return process.env.FRONTEND_STAGING_URL || 'https://uatin.pekoapp.com';
    }
    return process.env.FRONTEND_PRODUCTION_URL || 'https://in.peko.one';
};

const baseStyle = `
    body { margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif; }
    .container { max-width: 480px; margin: 0 auto; background: #ffffff; }
    .header { padding: 30px 25px 10px; text-align: center; }
    .body { padding: 10px 25px 20px; color: #000000; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: #ff4f4f; color: #ffffff; padding: 10px 24px; border-radius: 4px; text-decoration: none; font-size: 14px; margin: 16px 0; }
    .footer { background: #f7f7f7; padding: 20px 25px; text-align: center; font-size: 12px; color: #666; }
`;

exports.applicationSubmittedEmail = (name, applicationId, partnerDetails) => {
    const serviceUrl = getServiceUrl();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Company Incorporation - Application Received</title>
    <style>${baseStyle}</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1 style="margin:0;font-size:24px;color:#000">Application Received</h1>
    </div>
    <div class="body">
        <p>Dear ${name},</p>
        <p>We have received your Company Incorporation application. Please complete the payment to proceed with your application.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr><td style="padding:6px 0;color:#666;">Application ID</td><td style="padding:6px 0;font-weight:bold;">${applicationId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Status</td><td style="padding:6px 0;font-weight:bold;color:#f59e0b;">Pending Payment</td></tr>
        </table>
        <p>Please proceed to the payment page to complete your application submission.</p>
        <div style="text-align:center;">
            <a href="${serviceUrl}/more-services/company-incorporation" class="btn">Complete Payment</a>
        </div>
        <p>Thank you for choosing ${partnerDetails?.branding || 'Peko'}. If you have any queries, reach us at <a href="mailto:reach@peko.one">reach@peko.one</a>.</p>
        <p>Best Regards<br/>Team ${partnerDetails?.branding || 'Peko'}</p>
    </div>
    <div class="footer">
        <img src="${partnerDetails?.logo}" alt="" width="110" height="35" style="display:block;margin:0 auto 10px;" />
        <p>© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
        <p><a href="https://peko.one/in/privacy-policy" style="color:#666;">Privacy Policy</a> | <a href="https://peko.one/in/platform-agreement" style="color:#666;">Terms of Use</a></p>
    </div>
</div>
</body>
</html>`;
};

exports.statusUpdateEmail = (name, applicationId, status, notes, partnerDetails) => {
    const serviceUrl = getServiceUrl();
    const statusLabel = status === 'DOCUMENT_REVIEW' ? 'Under Document Review' : status === 'RE_UPLOAD' ? 'Re-upload Required' : status;
    const statusColor = status === 'DOCUMENT_REVIEW' ? '#3b82f6' : '#f59e0b';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Company Incorporation - Status Update</title>
    <style>${baseStyle}</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1 style="margin:0;font-size:24px;color:#000">Application Status Update</h1>
    </div>
    <div class="body">
        <p>Dear ${name},</p>
        <p>Your Company Incorporation application status has been updated.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr><td style="padding:6px 0;color:#666;">Application ID</td><td style="padding:6px 0;font-weight:bold;">${applicationId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Status</td><td style="padding:6px 0;font-weight:bold;color:${statusColor};">${statusLabel}</td></tr>
            ${notes ? `<tr><td style="padding:6px 0;color:#666;vertical-align:top;">Notes</td><td style="padding:6px 0;">${notes.replace(/\n/g, '<br>')}</td></tr>` : ''}
        </table>
        ${status === 'RE_UPLOAD' ? '<p>Please re-upload the required documents via the Company Incorporation section on the platform.</p>' : '<p>Our team is reviewing your documents. We will update you once the review is complete.</p>'}
        <div style="text-align:center;">
            <a href="${serviceUrl}/more-services/company-incorporation" class="btn">View Application</a>
        </div>
        <p>Thank you for choosing ${partnerDetails?.branding || 'Peko'}. If you have any queries, reach us at <a href="mailto:reach@peko.one">reach@peko.one</a>.</p>
        <p>Best Regards<br/>Team ${partnerDetails?.branding || 'Peko'}</p>
    </div>
    <div class="footer">
        <img src="${partnerDetails?.logo}" alt="" width="110" height="35" style="display:block;margin:0 auto 10px;" />
        <p>© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
        <p><a href="https://peko.one/in/privacy-policy" style="color:#666;">Privacy Policy</a> | <a href="https://peko.one/in/platform-agreement" style="color:#666;">Terms of Use</a></p>
    </div>
</div>
</body>
</html>`;
};

exports.applicationApprovedEmail = (name, applicationId, partnerDetails) => {
    const serviceUrl = getServiceUrl();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Company Incorporation - Approved</title>
    <style>${baseStyle}</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1 style="margin:0;font-size:24px;color:#26A411">Application Approved!</h1>
    </div>
    <div class="body">
        <p>Dear ${name},</p>
        <p>Congratulations! Your Company Incorporation application has been approved. Your company is now officially incorporated.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr><td style="padding:6px 0;color:#666;">Application ID</td><td style="padding:6px 0;font-weight:bold;">${applicationId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Status</td><td style="padding:6px 0;font-weight:bold;color:#26A411;">Approved</td></tr>
        </table>
        <p>Your Certificate of Incorporation and other documents will be shared with you shortly by our team.</p>
        <div style="text-align:center;">
            <a href="${serviceUrl}/more-services/company-incorporation" class="btn">View Application</a>
        </div>
        <p>Thank you for choosing ${partnerDetails?.branding || 'Peko'}. If you have any queries, reach us at <a href="mailto:reach@peko.one">reach@peko.one</a>.</p>
        <p>Best Regards<br/>Team ${partnerDetails?.branding || 'Peko'}</p>
    </div>
    <div class="footer">
        <img src="${partnerDetails?.logo}" alt="" width="110" height="35" style="display:block;margin:0 auto 10px;" />
        <p>© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
        <p><a href="https://peko.one/in/privacy-policy" style="color:#666;">Privacy Policy</a> | <a href="https://peko.one/in/platform-agreement" style="color:#666;">Terms of Use</a></p>
    </div>
</div>
</body>
</html>`;
};

exports.applicationRejectedEmail = (name, applicationId, rejectionReason, partnerDetails) => {
    const serviceUrl = getServiceUrl();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Company Incorporation - Application Rejected</title>
    <style>${baseStyle}</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1 style="margin:0;font-size:24px;color:#ee221c">Application Rejected</h1>
    </div>
    <div class="body">
        <p>Dear ${name},</p>
        <p>We regret to inform you that your Company Incorporation application has been rejected.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr><td style="padding:6px 0;color:#666;">Application ID</td><td style="padding:6px 0;font-weight:bold;">${applicationId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Status</td><td style="padding:6px 0;font-weight:bold;color:#ee221c;">Rejected</td></tr>
            ${rejectionReason ? `<tr><td style="padding:6px 0;color:#666;vertical-align:top;">Reason</td><td style="padding:6px 0;">${rejectionReason.replace(/\n/g, '<br>')}</td></tr>` : ''}
        </table>
        <p>If you believe this is an error or need assistance, please contact our support team.</p>
        <div style="text-align:center;">
            <a href="${serviceUrl}/more-services/company-incorporation" class="btn">Contact Support</a>
        </div>
        <p>Thank you for choosing ${partnerDetails?.branding || 'Peko'}. If you have any queries, reach us at <a href="mailto:reach@peko.one">reach@peko.one</a>.</p>
        <p>Best Regards<br/>Team ${partnerDetails?.branding || 'Peko'}</p>
    </div>
    <div class="footer">
        <img src="${partnerDetails?.logo}" alt="" width="110" height="35" style="display:block;margin:0 auto 10px;" />
        <p>© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
        <p><a href="https://peko.one/in/privacy-policy" style="color:#666;">Privacy Policy</a> | <a href="https://peko.one/in/platform-agreement" style="color:#666;">Terms of Use</a></p>
    </div>
</div>
</body>
</html>`;
};
