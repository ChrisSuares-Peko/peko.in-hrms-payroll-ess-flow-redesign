const express = require('express');

const router = express.Router({ mergeParams: true });
const {
    syncFromVendor,
    getCatalog,
    updateCatalogItem,
    updateStatus,
} = require('../../../../controllers/admin/businessRegistrationCatalog');

router.get('/', getCatalog);
router.post('/sync', syncFromVendor);
router.put('/status/:id', updateStatus);
router.put('/:id', updateCatalogItem);

module.exports = router;
