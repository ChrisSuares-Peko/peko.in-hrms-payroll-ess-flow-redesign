const router = (module.exports = require('express')())

const corporateTree = require('./corporate')

// The corporate tree is mounted under two userTypes because a cardholder can hold either identity: the
// account holder's corporate session builds `/corporate/:id/...`, while an employee whose card membership
// lives on their own row builds `/user/:id/...` from their own role. Every route inside scopes on
// req.user.corporateId from the session blob and never on the path segment, so the two mounts differ only in
// the URL the client happens to construct. Without the second one an employee cardholder 404s on every
// corporate-cards call — the routes simply are not there for them.
router.use('/corporate/:corporateId/corporate-cards', corporateTree)
router.use('/user/:corporateId/corporate-cards', corporateTree)
router.use('/system_user/:userId/corporate-cards', require('./systemUser'))
router.use('/webhook/:webhookUser/corporate-cards', require('./webhook'))
