const { v2Header, v2Footer, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS } = require('./sharedLayout');

// The block that differs between a brand-new ESS account (needs to set a password) and
// an existing credential just getting ESS access enabled (keeps its existing password).
// Bundled as one HTML blob — covering the intro paragraph(s) and the button — rather
// than several separate ${} variables, because the resolver treats an empty variable as
// "no value" and falls back; keeping this as one always-non-empty blob avoids that for
// the no-password branch. Shared between the local fallback below and the admin-template
// variables built at the call site (models/use-cases/user.js), since the resolver can't
// branch inside stored HTML.
const buildEssActionHtml = ({ hasReset, portalUrl, resetUrl }) => {
  const buttonUrl = hasReset ? resetUrl : portalUrl;
  const buttonLabel = hasReset ? 'Set Password' : 'Login';

  const intro = hasReset
    ? `<p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your Employee Self-Service (ESS) Portal account has been created successfully.</p>
       <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">You can access the portal using the link below:<br/>Portal URL: <a href="${portalUrl}" target="_blank" style="color:#000000;text-decoration:underline;">${portalUrl}</a></p>
       <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">To set up your account and create a password, please click the button below:</p>`
    : `<p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Employee Self-Service (ESS) Portal access has been enabled for your account.</p>
       <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">You do not need a new password &mdash; simply sign in with your existing credentials and choose <strong>"Switch to Employee"</strong> from your account menu to access the portal.</p>`;

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
      <tr>
        <td>
          <a href="${buttonUrl}" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${buttonLabel}</a>
        </td>
      </tr>
    </table>`;

  return `${intro}${button}`;
};
exports.buildEssActionHtml = buildEssActionHtml;

// Shown near the bottom of the email (after the ESS Portal bullet list, before the
// sign-off) per the Figma design — only for the "set a new password" variant.
const buildEssExpiryNoteHtml = (hasReset) => hasReset
  ? `<p style="font-size:13px;line-height:1.6;color:#666666;margin:0 0 20px 0;">For security reasons, this password setup link may expire after a certain period. If the link expires, please contact the HR team for assistance.</p>`
  : '';
exports.buildEssExpiryNoteHtml = buildEssExpiryNoteHtml;

// key: ESS_WELCOME (service: ESS_PORTAL)
// With `resetUrl`: standard "set your password" invite. Without it (self-as-employee,
// reusing existing credentials): shows a "sign in and use Switch to Employee" message.
exports.welcomeEssPortal = (employee, portalUrl, resetUrl, partnerDetails) => {
  const employeeName = employee?.name || 'Employee';
  const hasReset = !!resetUrl;
  const website = partnerDetails?.baseUrl || 'https://in.peko.one';
  const branding = partnerDetails?.branding || 'Peko';
  const logo = partnerDetails?.logo;
  const hrTeamName = partnerDetails?.branding ? `${partnerDetails.branding} HR Team` : 'HR Team';

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  const actionHtml = buildEssActionHtml({ hasReset, portalUrl, resetUrl });
  const expiryNoteHtml = buildEssExpiryNoteHtml(hasReset);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Welcome to Your Employee Self-Service Portal</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Welcome to Your Employee Self-Service Portal" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Welcome to Your Employee Self-Service Portal</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${employeeName},</p>
            ${actionHtml}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 12px 0;">Through the ESS Portal, you can conveniently:</p>
            <ul style="margin:0 0 20px 0;padding-left:20px;font-size:16px;line-height:1.6;color:#000000;">
              <li>View and update your profile information</li>
              <li>Access employment documents</li>
              <li>Manage leave requests</li>
              <li>View payroll and salary details</li>
              <li>Track attendance and other HR-related activities</li>
            </ul>
            ${expiryNoteHtml}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best regards,<br/>${hrTeamName}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// Sent to both the old and new address when an already-active ESS employee's
// login email is changed (password already set, so no reset link is issued).
exports.essEmailChangedTemplate = (employee, oldEmail, newEmail, partnerDetails) => {
  const employeeName = employee?.name || "Employee";
  const website = partnerDetails?.baseUrl || 'https://in.peko.one';
  const branding = partnerDetails?.branding || 'Peko';
  const logo = partnerDetails?.logo;
  const hrTeamName = partnerDetails?.branding ? `${partnerDetails.branding} HR Team` : 'HR Team';

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your ESS login email was changed</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Your ESS login email was changed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Your ESS login email was changed</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${employeeName},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your Employee Self-Service (ESS) Portal login email has been changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong> by your HR team.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your password has not changed &mdash; please sign in using your existing password with the new email address going forward.</p>
            <p style="font-size:13px;line-height:1.6;color:#666666;margin:0 0 28px 0;">If you did not expect this change, please contact your HR team immediately.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best regards,<br/>${hrTeamName}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};
