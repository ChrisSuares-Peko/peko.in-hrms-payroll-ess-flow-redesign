// Shared header/footer chrome for admin-managed email templates.
//
// Admin templates store only their middle content and carry ${headerHtml} /
// ${footerHtml} slots — the resolver substitutes those at send time using
// v2LayoutVariables(partnerDetails). Keeping the logo/social/app-badge markup here
// means a branding change lands in one place rather than in every stored template.
// A template with the layout baked in just ignores the two values.
//
// Duplicated from travel/utils/emailTemplate/sharedLayout.js — `purchase` is a
// separate deployable process and can't cross-require a sibling microservice's
// files at runtime. Keep the copies in sync if the brand assets ever change.

const V2_ASSETS = {
  googlePlay: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg',
  appStore: 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg',
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.pekopayment.app&hl=en_IN',
  appStoreUrl: 'https://apps.apple.com/ae/app/peko/id1669780986',
  supportEmail: 'reach@peko.one'
};

// Peko India's real social pages — `partnerDetails` (fetched per-request from
// systemUser/assets) carries no `.socials` field of its own, so every template in
// this migration merges this in directly. Facebook/YouTube deliberately absent: no
// page exists yet, and socialIconCells already skips any network with no link, so
// adding them here later is the entire change needed to make them appear — nothing
// else in this migration needs to know they're missing today.
const PEKO_SOCIAL_LINKS = {
  twitter: 'https://x.com/PekoIndia',
  instagram: 'https://www.instagram.com/peko.india',
  linkedIn: 'https://www.linkedin.com/company/pekoindia/',
};

// Rendered in this order; each entry is skipped when partnerDetails.socials has
// no link for it, so only the networks Peko actually has a page for show up.
// `icon` is fallback artwork for a partner that supplies a link but no image of
// its own - the icon CDN recolours the glyph from the hex passed in the path.
//
// PNG, not SVG, for every network. cdn.simpleicons.org serves SVGs with a viewBox
// but no width/height, so a client that ignores the img width/height attributes has
// no size to lay them out at and drops them - and Gmail blocks SVG outright. The
// icons8 PNGs carry their own 50x50 intrinsic size and render everywhere.
const V2_SOCIALS = [
  { keys: ['facebook'], alt: 'Facebook', icon: (hex) => `https://img.icons8.com/ios-filled/50/${hex.toLowerCase()}/facebook.png` },
  { keys: ['twitter', 'x'], alt: 'Twitter', icon: (hex) => `https://img.icons8.com/ios-filled/50/${hex.toLowerCase()}/twitter.png` },
  { keys: ['instagram'], alt: 'Instagram', icon: (hex) => `https://img.icons8.com/ios-filled/50/${hex.toLowerCase()}/instagram.png` },
  { keys: ['linkedIn', 'linkedin'], alt: 'LinkedIn', icon: (hex) => `https://img.icons8.com/ios-filled/50/${hex.toLowerCase()}/linkedin.png` },
  { keys: ['youtube'], alt: 'YouTube', icon: (hex) => `https://img.icons8.com/ios-filled/50/${hex.toLowerCase()}/youtube-play.png` }
];

// A socials entry is either { link, image } - where `image` is the partner's own
// artwork - or a bare URL string, which falls back to the CDN icon in `color`.
// `color` has no effect once an entry supplies its own image.
//
// The size goes in the inline style as well as the width/height attributes: several
// clients (and the admin panel's preview) drop the attributes, and a partner's own
// artwork is whatever size they uploaded - without the CSS it lands at full size.
const socialIconCells = (socials, { size = 18, padding = '0 13px', color = '6B7280', imgStyle = '' } = {}) =>
  V2_SOCIALS.map((network) => {
    const entry = network.keys.map((key) => socials?.[key]).find(Boolean);
    if (!entry) return '';
    const url = typeof entry === 'string' ? entry : entry.link;
    if (!url) return '';
    const src = (typeof entry === 'object' && entry.image) || network.icon(color);
    return `<td align="center" valign="middle" style="padding:${padding};"><a href="${url}" target="_blank" style="text-decoration:none;"><img src="${src}" alt="${network.alt}" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;border:0;outline:none;text-decoration:none;${imgStyle}-ms-interpolation-mode:bicubic;" /></a></td>`;
  }).join('');

// "https://in.peko.one/" -> "in.peko.one"
const websiteLabel = (website) => String(website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

// Default white-label fallback for when a corporate account has no logo/branding
// of its own and no partner onboarded them - the same default row every service
// falls back to via `public/partnerLogos.js` / `fetchPartnerDetails`, so v2Header
// renders Peko's own branding instead of a broken image when nothing else is set.
const DEFAULT_BRANDING = {
  logo: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09',
  branding: 'Peko',
  baseUrl: 'https://in.peko.one',
};

// Header and footer shared by the 680px v2 templates.
// Each caller resolves its own branding values and passes them in; any of
// website/logo/branding that comes back empty falls back to DEFAULT_BRANDING here,
// in one place, rather than in every caller.
const v2Header = ({ website, websiteLabel: websiteLabelText, logo, branding }) => {
  const effectiveWebsite = website || DEFAULT_BRANDING.baseUrl;
  const effectiveLogo = logo || DEFAULT_BRANDING.logo;
  const effectiveBranding = branding || DEFAULT_BRANDING.branding;
  const effectiveLabel = websiteLabelText || websiteLabel(effectiveWebsite);

  return `    <!-- ===== HEADER: LOGO + WEBSITE LINK ===== -->
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->

    <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;"
      >
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:24px 20px;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;width:640px;" ><![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:middle;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                  <tbody>
                    <tr>
                      <!-- Logo -->
                      <td align="left" valign="middle" style="width:50%;">
                        <a href="${effectiveWebsite}" target="_blank">
                          <img
                             alt="${effectiveBranding}" src="${effectiveLogo}" style="display:block;outline:none;text-decoration:none;height:35px;width:auto;max-width:110px;"
                             height="35"
                          />
                        </a>
                      </td>
                      <!-- Website link -->
                      <td align="right" valign="middle" style="width:50%;">
                        <a href="${effectiveWebsite}" target="_blank" class="header-link" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;text-decoration:none;">${effectiveLabel}</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>`;
};

const v2Footer = ({ socials, branding }) => {
  const isPeko = !branding || branding === DEFAULT_BRANDING.branding;
  return `    <!-- ===== FOOTER ===== -->
    <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->

    <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;"
      >
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:32px 20px;text-align:center;">
              <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:640px;" ><![endif]-->
              <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                  <tbody>

                    <!-- Social icons -->
${isPeko ? `                    <tr>
                      <td align="center" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                          <tbody>
                            <tr>${socials}</tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>` : ''}

                    <!-- Support line -->
                    <tr>
                      <td align="center" class="footer-text" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                        <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;text-align:center;color:#4B5563;">If you need assistance or have any questions, please contact us at <a href="mailto:${V2_ASSETS.supportEmail}" style="color:#4B5563;text-decoration:none;">${V2_ASSETS.supportEmail}</a></div>
                      </td>
                    </tr>

                    <!-- Copyright -->
                    <tr>
                      <td align="center" class="footer-copyright" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                        <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.6;text-align:center;color:#4B5563;">© ${new Date().getFullYear()} Peko Platforms Private Limited, All Rights Reserved</div>
                      </td>
                    </tr>

                    <!-- Download the app -->
${isPeko ? `                    <tr>
                      <td align="center" class="footer-download" style="font-size:0px;padding-bottom:14px;word-break:break-word;">
                        <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;text-align:center;color:#4B5563;">Download the app</div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="font-size:0px;word-break:break-word;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                          <tbody>
                            <tr>
                              <td style="padding:6px;">
                                <a href="${V2_ASSETS.googlePlayUrl}" target="_blank">
                                  <img alt="Get it on Google Play" src="${V2_ASSETS.googlePlay}" style="display:block;width:128px;height:38px;" width="128" height="38" />
                                </a>
                              </td>
                              <td style="padding:6px;">
                                <a href="${V2_ASSETS.appStoreUrl}" target="_blank">
                                  <img alt="Download on the App Store" src="${V2_ASSETS.appStore}" style="display:block;width:120px;height:40px;" width="120" height="40" />
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>` : ''}

                  </tbody>
                </table>
              </div>
              <!--[if mso | IE]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!--[if mso | IE]></td></tr></table><![endif]-->`;
};

// Green tick / red cross badges used at the top of confirmation/failure emails. Both
// assets already bake in their own circular background, so these are just <img> tags —
// no extra wrapper.
const v2SuccessBadge = () => `<img alt="Success" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FSuccess.svg?alt=media&token=28e56fab-d9de-48e5-8649-10d84eda5826" width="64" height="64" style="display:block;width:64px;height:64px;border:0;outline:none;text-decoration:none;" />`;
const v2RejectBadge = () => `<img alt="Failed" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FReject.svg?alt=media&token=e0cdf4f5-dfeb-4719-86d6-cfae998e7ffb" width="64" height="64" style="display:block;width:64px;height:64px;border:0;outline:none;text-decoration:none;" />`;

// The header and footer as ready-to-substitute values, for admin-managed templates
// that store only their middle and carry ${headerHtml} / ${footerHtml} slots. Keeping
// this here means a branding change lands in one place rather than in every stored
// template. A template with the layout baked in just ignores the two values.
const v2LayoutVariables = (partnerDetails, iconOptions = { size: 24, padding: '0 16px' }) => ({
  headerHtml: v2Header({
    website: partnerDetails?.baseUrl,
    websiteLabel: websiteLabel(partnerDetails?.baseUrl),
    logo: partnerDetails?.logo,
    branding: partnerDetails?.branding
  }),
  footerHtml: v2Footer({
    // partnerDetails carries no .socials field of its own - fall back to Peko's own
    // pages rather than rendering no icons at all.
    socials: socialIconCells(partnerDetails?.socials || PEKO_SOCIAL_LINKS, iconOptions),
    branding: partnerDetails?.branding
  })
});

// Per-digit OTP box UI, matching the design already established elsewhere in this
// project. Dynamic-length (depends on the OTP's digit count), so this stays
// JS-fallback-only wherever it's used — never exposed as a raw ${otp} placeholder
// in an admin body.
const buildOtpBoxesHtml = (otp) => {
  const digits = String(otp ?? '').split('');
  const cells = digits.map((digit) => `<td class="peko-otp-cell" style="padding:0 4px;"><div class="peko-otp-box" style="width:56px;height:56px;line-height:56px;text-align:center;border:1px solid #D1D5DB;border-radius:10px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:600;color:#000000;">${digit}</div></td>`).join('');
  // The fixed 56px boxes overflow narrow mobile viewports (Gmail app etc. clip the
  // last digit) - this media query is self-contained so every caller gets it for free.
  return `<style type="text/css">
    @media only screen and (max-width:479px) {
      .peko-otp-cell { padding:0 2px !important; }
      .peko-otp-box { width:40px !important; height:40px !important; line-height:40px !important; font-size:20px !important; }
    }
  </style>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;"><tr>${cells}</tr></table>`;
};

module.exports = { V2_ASSETS, V2_SOCIALS, PEKO_SOCIAL_LINKS, DEFAULT_BRANDING, socialIconCells, websiteLabel, v2Header, v2Footer, v2SuccessBadge, v2RejectBadge, v2LayoutVariables, buildOtpBoxesHtml };
