const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    addSavedTraveller,
    getSavedTravellers,
    updateSavedTraveller,
    deleteSavedTraveller,
} = require('../../../../controllers/corporate/savedTraveller');

router.post('/', addSavedTraveller);
router.get('/', getSavedTravellers);
router.put('/:id', updateSavedTraveller);
router.delete('/:id', deleteSavedTraveller);

module.exports = router;
