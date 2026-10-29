'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  create,
  list,
  listAll,
  getById,
  update,
  deleteAttachment,
  close,
  reopen,
  softDelete,
  listEmployees,
  addEmployee,
} = require('../../../../../controllers/corporate/procure/purchaseRequestController');

const {
  createSchema,
  updateSchema,
  validate,
} = require('../../../../../validators/procure/purchaseRequestValidator');

router.get('/all', listAll);
router.get('/',  list);
router.post('/', validate(createSchema), create);

router.get('/employees',  listEmployees);
router.post('/employees', addEmployee);

router.get('/:id',    getById);
router.put('/:id',    validate(updateSchema), update);
router.delete('/:id', softDelete);

router.delete('/:id/attachments', deleteAttachment);

router.post('/:id/close', close);
router.post('/:id/reopen', reopen);

module.exports = router;
