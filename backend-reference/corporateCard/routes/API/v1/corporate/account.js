const router = require('express').Router({ mergeParams: true })
const { requirePermission } = require('../../../../middlewares/requirePermission')
const { PERMISSIONS: P } = require('../../../../utils/cardRoles')
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const { createLedgerEntry, getStatement, exportStatement, exportStatementPdf } = require('../../../../controllers/corporate/cardAccount')

router.post('/entries', verifyCorporateAdmin, requirePermission(P.RECORD_ENTRIES), createLedgerEntry)
router.get('/statement', verifyCorporateAdmin, requirePermission(P.VIEW_STATEMENT), getStatement)
router.get('/statement/export', verifyCorporateAdmin, requirePermission(P.EXPORT_STATEMENT), exportStatement)
router.get('/statement/pdf', verifyCorporateAdmin, requirePermission(P.EXPORT_STATEMENT), exportStatementPdf)

module.exports = router
