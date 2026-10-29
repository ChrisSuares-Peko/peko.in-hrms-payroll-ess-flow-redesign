// Frontend link used by every email template here; per-environment so staging emails
// don't point at production.
const resolveBaseUrl = () => {
    const url =
        process.env.NODE_ENV === "staging"
            ? process.env.FRONTEND_STAGING_URL || "https://uatin.pekoapp.com"
            : process.env.FRONTEND_PRODUCTION_URL || "https://in.peko.one";

    // Templates append a leading slash, so a trailing one would double up.
    return url.replace(/\/+$/, "");
};

const partnerLogos = [
  {
      logo: "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09",
      branding:"Peko",
      signUpImage:'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FsignUpImage.png?alt=media&token=eb34687f-4d72-4b60-8b8e-dce18e8f2340',
      baseUrl: resolveBaseUrl(),
      state:"Delhi"
  }
]

module.exports = partnerLogos;
