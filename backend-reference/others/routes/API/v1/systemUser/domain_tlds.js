const express = require('express');
const { getDomainTlds, updateDomainTlds } = require('../../../../controllers/admin/domain_tlds');
const router = express.Router();

router.get('/', getDomainTlds);
router.post('/', updateDomainTlds);

module.exports = router;
