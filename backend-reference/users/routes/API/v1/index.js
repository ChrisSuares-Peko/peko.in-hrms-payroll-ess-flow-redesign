const router = (module.exports = require("express")());
const {
  verifyToken
} = require('./../../../utils/jwtToken')

router.use("/", require("./idp"));
router.use("/", require("./oauth"));
// Registration, Login,logout API's
router.use("/", require("./login"));
router.use("/", require("./register"));
router.use("/", require("./forgot-password"));
router.use("/general", require("./general"));

router.use("/password-policy",require('./passwordPolicy'))
router.use("/privacy-policy-details",require('./privacyPolicyDetails'))
router.use(verifyToken)
router.use("/payroll",require("./payroll"))
router.use("/services",require('./services'))
router.use("/subscription",require('./subscription'))
router.use("/sub-corporate",require('./userManagement'))
router.use("/ess",require('./essEmployee'))
router.use("/card-members",require('./cardMember'))
// NOT "/switch-role": login.js already owns POST /switch-role (the corporate <-> ESS-employee IDENTITY
// switch, role 'corporate'|'user') and is mounted at "/" above, so it matches first and would swallow
// this. This endpoint is a different thing — which authority MODE a corporate account is acting in.
router.use("/active-role",require('./switchRole'))
router.use("/chat",require('./chat'))
router.use("/whatsapp-notification",require('./whatsAppNotifications'))
router.use("/privacy-policy",require('./privacyPolicy'))
