const express = require('express');
const { findAllDocumentsAndCount, createDocumentEntry, deleteDocument, updateStatus, updateDocument, getExcel, fetchAllCategories, documentsAndCountPDF, documentsAndCountExcelCSV } = require('../../../../controllers/admin/payrollDocs');
const { validatePayrollDocsCreate, validatePayrollDocsUpdate, validatePayrollDocsUpdateStatus } = require('../../../../utils/apiValidation');

const router = express.Router({mergeParams:true})

router.post('/',validatePayrollDocsCreate, createDocumentEntry)
router.get('/documents', findAllDocumentsAndCount)
router.get('/documents/pdf', documentsAndCountPDF)
router.get('/documents/:type', documentsAndCountExcelCSV)
router.get('/categories', fetchAllCategories)
router.get('/excel', getExcel)
router.put('/:id',validatePayrollDocsUpdate, updateDocument)
router.put('/updateStatus/:id',validatePayrollDocsUpdateStatus, updateStatus);
router.delete('/:id', deleteDocument)

module.exports = router
