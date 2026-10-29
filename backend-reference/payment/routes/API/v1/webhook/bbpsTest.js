// TEMP: webhook-style mount for the BBPS proxy-api test endpoint.
// Public on purpose — gateway bypass is configured in
// api-gateway/auth.js (noAuthUrls + noSessionUrls). Delete this file,
// its registration in routes/API/v1/index.js, and the two auth.js
// entries together once vendor/QA testing is complete.
const express = require('express');
const { proxyAPIForTest } = require('../../../../controllers/corporate/proxyAPI');

const router = express.Router({ mergeParams: true });

router.post('/proxy-api', proxyAPIForTest);

module.exports = router;
