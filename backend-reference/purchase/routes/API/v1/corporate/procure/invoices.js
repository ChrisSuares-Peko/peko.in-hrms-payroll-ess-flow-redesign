'use strict';
const express = require('express');
const router  = express.Router({ mergeParams: true });

const { create, list, getById, update, remove, payInvoice } = require('../../../../../controllers/corporate/procure/procureInvoiceController');
const { createSchema, updateSchema, validate } = require('../../../../../validators/procure/procureInvoiceValidator');

router.get('/',  list);
router.post('/', validate(createSchema), create);

router.post('/:id/pay', payInvoice);
router.get('/:id',    getById);
router.put('/:id',    validate(updateSchema), update);
router.delete('/:id', remove);

module.exports = router;
