const express = require('express');
const router = express.Router({ mergeParams: true });

const {
    findCorporateDocumentsForAdmin,
    downloadAllCorporateDocumentsForAdmin,
} = require('../../../../controllers/admin/corporateDocuments');

router.get('/:corporateId/download-all', downloadAllCorporateDocumentsForAdmin);
router.get('/:corporateId', findCorporateDocumentsForAdmin);

module.exports = router;
