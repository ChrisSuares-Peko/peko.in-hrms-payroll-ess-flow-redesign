const { v2Header, v2Footer, socialIconCells, websiteLabel, buildOtpBoxesHtml, PEKO_SOCIAL_LINKS } = require('./sharedLayout');

// key: BENEFICIARY_OTP (service: BENEFICIARY)
// Redesigned to IN's own established v2 OTP pattern (v2Header/v2Footer +
// buildOtpBoxesHtml, 56x56px boxes) instead of copying AE's real reference design
// (a bespoke 576px "Inter" OTP-box card lifted from AE's own `users` MS sign-up OTP) -
// explicit user decision, since every other OTP email in this MS already uses IN's own
// v2 pattern and this one would otherwise be the only visual outlier. Matches
// updateBankDetailsOTP / addressOTP in profile.js exactly in structure. The old design's
// "call us at +971 45401266" line was dropped (not replaced with a guessed IN number) -
// none of the 3 existing v2 OTP templates in this MS have a contact-us line at all,
// so this matches that established precedent rather than inventing a new deviation.
exports.beneficiaryOTPTemplate = (username, otp, action, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Verify your account!</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Verify your account!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Verify your account!</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Please use the OTP below on the ${branding} platform to ${action} a beneficiary. This OTP is valid for 2 minutes only.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your one-time password (OTP)</p>
            ${buildOtpBoxesHtml(otp)}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Your OTP is confidential. Please do not share it with anyone.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

