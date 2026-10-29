const express = require('express');
const router = express.Router();
const { reimbursementFilesUpload } = require('../middleware/fileUpload');
const { requireOwnedEmployee } = require('../utils/tenantScope');
const { createNewReimbursement, getAllReimbursementById, getAllReimbursement, deleteReimbursementById, updateReimbursement, getReimbursementData, getReimbursementExcel, downloadReimbursementDocument } = require('../controller/reimbursement');

// Create a new Reimbursement
// router.post('/:id', validateReimbusementCreate, reimbursementFilesUpload, createNewReimbursement);
router.post('/:id', requireOwnedEmployee('id'), reimbursementFilesUpload, createNewReimbursement);

// Get all reimbursements for a specific employee
router.get('/export/:id', requireOwnedEmployee('id'), getReimbursementExcel);
router.get('/:id/download', downloadReimbursementDocument);
router.get('/:id', requireOwnedEmployee('id'), getAllReimbursementById);

router.get('/', getAllReimbursement)

// Delete a specific Reimbursement
router.delete('/:id', deleteReimbursementById);

// Update a specific Reimbursement
// router.put('/:id', validateReimbusementUpdate, reimbursementFilesUpload, updateReimbursement)
router.put('/:id', reimbursementFilesUpload, updateReimbursement)
router.get('/fetch-reimbursement/:reimbursementId', reimbursementFilesUpload, getReimbursementData)

module.exports = router;

