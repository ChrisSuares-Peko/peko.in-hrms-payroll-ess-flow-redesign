'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  create,
  list,
  listAll,
  getById,
  update,
  softDelete,
  importFromCsv,
} = require('../../../../../controllers/corporate/procure/procureVendorController');

const {
  createSchema,
  updateSchema,
  validate,
} = require('../../../../../validators/procure/procureVendorValidator');

const upload = require('../../../../../middlewares/multer');

// List all Vendors (filters: status, search, page, limit)
router.get('/', list);

// List all Vendors without pagination (filters: status, search)
router.get('/all', listAll);

// Import vendors from CSV
router.post('/import-csv', upload.single('file'), importFromCsv);

// Create a new Vendor
router.post('/', validate(createSchema), create);

// Get single Vendor detail
router.get('/:id', getById);

// Update a Vendor
router.put('/:id', validate(updateSchema), update);

// Soft-delete a Vendor
router.delete('/:id', softDelete);

module.exports = router;
