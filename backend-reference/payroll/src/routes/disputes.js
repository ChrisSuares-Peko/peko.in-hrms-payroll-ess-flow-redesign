const express = require('express');
const router = express.Router();
const { getDisputeRequests, reviewDispute } = require('../controller/attendanceDispute');

// GET /disputes
// Query: employee, status (requestedByEmployee|approved|rejected), from, to, search, page, limit
router.get('/', getDisputeRequests);

// PUT /disputes/:id/review
// Body: status (approved|rejected), remarks (optional)
router.put('/:id/review', reviewDispute);

module.exports = router;
