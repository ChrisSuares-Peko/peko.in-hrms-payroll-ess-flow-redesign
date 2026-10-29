const express = require('express');
const { findAllInvoiceKybAndCount,  updateKybStatus } = require('../../../../controllers/admin/invoiceKyb');

const router = express.Router({ mergeParams: true })

router.get('/find-all', findAllInvoiceKybAndCount)
router.put('/update-status/:corporateId', updateKybStatus)

module.exports = router