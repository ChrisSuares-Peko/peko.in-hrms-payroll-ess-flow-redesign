const express = require('express');
const { getWalletDenominations, updateWalletDenominations } = require('../../../../controllers/admin/peko_wallet');
const router = express.Router();

router.get('/', getWalletDenominations);
router.post('/', updateWalletDenominations);

module.exports = router;
