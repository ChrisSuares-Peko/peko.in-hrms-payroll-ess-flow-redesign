const { v2Header, v2Footer, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS } = require('./sharedLayout');

// key: CORPORATE_ACCOUNT_CREATED (service: AUTH)
exports.accountCreatedSuccessTemplate = (name, userName, email, partnerDetails) => {
  // No partner-specific baseUrl -> use this environment's own frontend, not a
  // hardcoded production URL (a staging send must not link to production).
  const envBaseUrl = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;
  const website = partnerDetails?.baseUrl || envBaseUrl;
  const branding = partnerDetails?.branding || 'Peko';
  const logo = partnerDetails?.logo;
  const heroImage = partnerDetails?.signUpImage;
  const baseUrl = (partnerDetails?.baseUrl || '').replace(/\/$/, '');
  const loginUrl = baseUrl ? `${baseUrl}/auth/login` : website;

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Account created successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Account created successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:32px 32px 48px 32px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <div style="margin:0 0 32px 0;">
              <img src="${heroImage}" alt="Everything you need to run your business" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:16px;" />
            </div>
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Account created successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Welcome to ${branding}! We are pleased to inform you that your account has been created successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your Account Number/Email ID for Login is : ${userName}/${email}</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Please ensure that this Account Number/Email ID is securely stored.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 32px 0;">Thank you for choosing ${branding}.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
              <tr>
                <td>
                  <a href="${loginUrl}" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Login Now</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// Single HTML blob for all 6 OTP digit boxes. The resolver can't split a string or
// loop, so the admin-managed template gets one ${otpHtml} slot instead of having to
// hand-build the 6-cell table itself. Used by both the local fallback below and the
// admin-template variables built at the call site (controllers/admin/signUp.js).
// OTP is always a 6-digit number (Math.floor(100000 + Math.random() * 900000) in
// models/use-cases/otp.js).
const otpBlockHtml = (otp) => {
  const digits = String(otp).padStart(6, '0').split('');
  const cells = digits.map((digit, index) => `
    <td class="peko-otp-cell" style="padding-right:${index < digits.length - 1 ? '12px' : '0'};">
      <div class="peko-otp-box" style="width:56px;height:64px;border:1px solid #D1D5DB;border-radius:8px;text-align:center;line-height:64px;font-size:32px;font-weight:700;color:#000000;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${digit}</div>
    </td>`).join('');
  // The fixed 56px boxes overflow narrow mobile viewports (Gmail app etc. clip the
  // last digit) - this media query is self-contained so every caller gets it for free.
  return `<style type="text/css">
    @media only screen and (max-width:479px) {
      .peko-otp-cell { padding-right:6px !important; }
      .peko-otp-box { width:40px !important; height:48px !important; line-height:48px !important; font-size:22px !important; }
    }
  </style>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;"><tr>${cells}</tr></table>`;
};
exports.otpBlockHtml = otpBlockHtml;

// key: SIGNUP_OTP (service: AUTH)
exports.signUpOTPRequestTemplate = (name, otp, title, partnerDetails) => {
  const website = partnerDetails?.baseUrl || 'https://in.peko.one';
  const branding = partnerDetails?.branding || 'Peko';
  const logo = partnerDetails?.logo;

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${title}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="${title}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">${title}</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Greetings,</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Please use the OTP given below to complete the account verification process. This OTP is valid for 2 minutes only.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your one time password (OTP) is</p>
            ${otpBlockHtml(otp)}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your OTP is confidential. Please do not share it with anyone.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};
