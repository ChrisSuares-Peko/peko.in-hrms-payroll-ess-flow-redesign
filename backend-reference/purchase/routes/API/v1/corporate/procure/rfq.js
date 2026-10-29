'use strict';
const express = require('express');
const router  = express.Router({ mergeParams: true });

const rfqValidator  = require('../../../../../validators/procure/rfqValidator');
const { listAll, closingSoon, list, create, saveDraft, getById, update, saveExistingDraft, softDelete, deleteAttachment, sendToVendors, close, reopen, addVendor, removeVendor, sendReminder } = require('../../../../../controllers/corporate/procure/rfqController');
const { validate }  = rfqValidator;

// Collection
router.get('/all',          listAll);
router.get('/closing-soon', closingSoon);
router.get('/',             list);
router.post('/',            validate(rfqValidator.createSchema),   create);
router.post('/draft',       validate(rfqValidator.saveDraftSchema), saveDraft);

// Single RFQ
router.get('/:id',       getById);
router.put('/:id',       validate(rfqValidator.updateSchema),   update);
router.patch('/:id/draft', validate(rfqValidator.saveDraftSchema), saveExistingDraft);
router.delete('/:id',    softDelete);

// Attachments
router.delete('/:id/attachments', validate(rfqValidator.deleteAttachmentSchema), deleteAttachment);

// State transitions
router.post('/:id/send',            sendToVendors);
router.post('/:id/close',           close);
router.post('/:id/reopen',          reopen);
router.post('/:id/send-reminder',   sendReminder);

// Vendor management
router.post('/:id/vendors',             validate(rfqValidator.addVendorSchema), addVendor);
router.delete('/:id/vendors/:vendorId', removeVendor);

module.exports = router;
