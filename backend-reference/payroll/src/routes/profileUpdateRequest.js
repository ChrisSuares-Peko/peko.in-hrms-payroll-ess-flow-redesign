const express = require('express');
const router = express.Router();
const {
    listAllProfileUpdateRequestsForCorporate,
    getProfileUpdateRequestDetail,
    approveProfileUpdateRequest,
    rejectProfileUpdateRequest,
} = require('../controller/profileUpdateRequest');

router.get('/', listAllProfileUpdateRequestsForCorporate);
router.get('/:requestId', getProfileUpdateRequestDetail);
router.patch('/:requestId/approve', approveProfileUpdateRequest);
router.patch('/:requestId/reject', rejectProfileUpdateRequest);

module.exports = router;
