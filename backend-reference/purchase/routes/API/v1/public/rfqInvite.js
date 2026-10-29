'use strict';
const express = require('express');
const router  = express.Router();

const { getByToken, submitByToken, updateByToken } = require('../../../../controllers/public/rfqInviteController');

router.get('/',                 getByToken);
router.get('/:token',           getByToken);
router.post('/submit',          submitByToken);
router.post('/:token/submit',   submitByToken);
router.put('/update',           updateByToken);
router.put('/:token/update',    updateByToken);

module.exports = router;
