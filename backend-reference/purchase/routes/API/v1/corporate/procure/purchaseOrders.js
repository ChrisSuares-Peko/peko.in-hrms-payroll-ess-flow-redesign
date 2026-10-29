'use strict';
const express = require('express');
const router  = express.Router({ mergeParams: true });

const {
  create, list, listAll, getById, getDocument, downloadPdf, update,
  send, close, cancel,
  softDelete, getJourney,
} = require('../../../../../controllers/corporate/procure/purchaseOrder');

const {
  createSchema, updateSchema, cancelSchema, validate,
} = require('../../../../../validators/procure/purchaseOrderValidator');

const { addNote, listNotes } = require('../../../../../controllers/corporate/procure/purchaseOrderNote');
const { addNoteSchema, validate: validateNote } = require('../../../../../validators/procure/purchaseOrderNoteValidator');

router.get('/all', listAll);
router.get('/',    list);
router.post('/',   validate(createSchema), create);

router.get('/:id',          getById);
router.get('/:id/document', getDocument);
router.get('/:id/pdf',      downloadPdf);
router.put('/:id',    validate(updateSchema), update);
router.delete('/:id', softDelete);

router.post('/:id/send',  send);
router.post('/:id/close', close);
router.post('/:id/cancel', validate(cancelSchema), cancel);

router.get('/:id/journey', getJourney);
router.get('/:id/notes',  listNotes);
router.post('/:id/notes', validateNote(addNoteSchema), addNote);

module.exports = router;
