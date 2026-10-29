const router = require('express').Router({ mergeParams: true })
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const { findAllUploadedOneKYBDocs, uploadOneKYBDocument } = require('../../../../controllers/corporate/corporateDocuments')

router.get('/', verifyCorporateAdmin, findAllUploadedOneKYBDocs)
router.post('/', verifyCorporateAdmin, uploadOneKYBDocument)

module.exports = router
