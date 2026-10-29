'use strict';
const express = require('express');
const router  = express.Router({ mergeParams: true });

const proposalValidator = require('../../../../../validators/procure/proposalValidator');
const { submit, list, listAll, getById, accept, undoAccept, decline, undoDecline } = require('../../../../../controllers/corporate/procure/proposalController');
const { validate } = proposalValidator;

router.post('/',                          validate(proposalValidator.submitSchema), submit);
router.get('/',                           list);
router.get('/all',                        listAll);
router.get('/:proposalId',                getById);
router.post('/:proposalId/accept',        accept);
router.post('/:proposalId/undo-accept',   undoAccept);
router.post('/:proposalId/decline',       validate(proposalValidator.declineSchema), decline);
router.post('/:proposalId/undo-decline',  undoDecline);

module.exports = router;
