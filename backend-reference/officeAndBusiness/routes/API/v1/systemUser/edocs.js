const express = require('express');
const { findAllDocumentsAndCount, createDocumentEntry, deleteDocument, updateStatus, updateDocument, getExcel, fetchAllCategories, documentsAndCountPDF, documentsAndCountExcelCSV } = require('../../../../controllers/admin/edocs');
const { validateEdocsCreate, validateEdocsUpdate, validateEdocsUpdateStatus } = require('../../../../utils/apiValidation');

const router = express.Router({mergeParams:true})

router.post('/',validateEdocsCreate, createDocumentEntry)
router.get('/documents', findAllDocumentsAndCount)
router.get('/documents/pdf', documentsAndCountPDF)
router.get('/documents/:type', documentsAndCountExcelCSV)
router.get('/categories', fetchAllCategories)
router.get('/excel', getExcel)
router.put('/:id',validateEdocsUpdate, updateDocument)
router.put('/updateStatus/:id',validateEdocsUpdateStatus, updateStatus);
router.delete('/:id', deleteDocument)

module.exports = router