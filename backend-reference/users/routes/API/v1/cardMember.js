const express = require('express')
const router = express.Router()
const { verifyCardMemberAdmin } = require('../../../middlewares/verifyCardMemberAdmin')
const { validateCreateCardMember } = require('../../../utils/apiValidation')
const { sanitizeBodyBaseUrl } = require('../../../utils/trustedFrontendUrl')
const {
    createCardMember,
    validateCardMember,
    resendCardMemberInvite,
    revokeCardMember,
    updateCardMember,
} = require('../../../controllers/cardMember')

// Corporate Cards member invites. Separate from /sub-corporate on purpose: a card member is an employee
// identity, and the two no longer share an endpoint, a controller or a table.
router.post('/validate', verifyCardMemberAdmin, validateCreateCardMember, validateCardMember)
router.post('/', verifyCardMemberAdmin, validateCreateCardMember, sanitizeBodyBaseUrl, createCardMember)
router.post('/:userId/resend', verifyCardMemberAdmin, sanitizeBodyBaseUrl, resendCardMemberInvite)
router.patch('/:userId', verifyCardMemberAdmin, updateCardMember)
router.delete('/:userId', verifyCardMemberAdmin, revokeCardMember)

module.exports = router
