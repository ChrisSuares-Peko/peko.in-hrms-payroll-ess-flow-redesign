const express = require('express')
const { verifyToken } = require('../../../utils/jwtToken')

/**
 * What an EMPLOYEE session may reach in this service.
 *
 * Deliberately not the corporate tree. That one carries the company's transactions, beneficiaries, wallet
 * reports and profile — bank accounts, addresses, KYB documents, delete-account — none of which belongs to
 * an employee, so mounting it under /user would hand every one of them to every cardholder.
 *
 * Only the notification bell is shared: it reads the same notifications table every other identity reads,
 * scoped by the session, and the frontend renders it on every shell.
 */
const router = express.Router({ mergeParams: true })

router.use(verifyToken)

router.use('/notification', require('./corporate/notification'))

module.exports = router
