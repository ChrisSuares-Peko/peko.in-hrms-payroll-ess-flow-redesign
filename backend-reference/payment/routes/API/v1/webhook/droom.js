const express = require('express');
const { droomChallanStatusWebhook } = require('../../../../controllers/webhook/droomWebhook');

const router = express.Router({ mergeParams: true });

// Droom posts realtime order/challan status updates here. Public (no auth) — Droom registers
// this URL on their side; we ACK 200.
router.post('/challan-status', droomChallanStatusWebhook);

module.exports = router;
