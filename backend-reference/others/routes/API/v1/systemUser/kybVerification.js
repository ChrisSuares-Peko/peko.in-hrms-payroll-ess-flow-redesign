const express = require('express');
const router = express.Router();

const { findAllKybVerifications, updateVerificationStatus } = require('../../../../controllers/admin/kybVerification');
const { validateFindAllKybVerificationsQuery } = require('../../../../utils/queryValidation');
const { requireAdminSystemUser } = require('../../../../utils/jwtToken');

router.get("/all", validateFindAllKybVerificationsQuery, findAllKybVerifications);

// F-OTH-06: approving/rejecting a corporate's KYB verification is admin-only, same as
// every other sensitive approve/reject-style mutation in this service.
router.patch('/:id', requireAdminSystemUser, updateVerificationStatus);

module.exports = router;
