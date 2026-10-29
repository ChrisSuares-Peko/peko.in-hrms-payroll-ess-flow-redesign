'use strict';
const express = require('express');
const router  = express.Router();

const { getByToken, acknowledgeByToken, downloadPdfByToken } = require('../../../../controllers/public/poInviteController');

router.get('/',                       getByToken);
router.get('/pdf',                    downloadPdfByToken);
router.get('/:token',                 getByToken);
router.post('/acknowledge',           acknowledgeByToken);
router.post('/:token/acknowledge',    acknowledgeByToken);

module.exports = router;
