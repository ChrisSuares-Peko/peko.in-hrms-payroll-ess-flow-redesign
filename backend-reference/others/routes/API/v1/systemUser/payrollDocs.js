const express = require('express');



const { listPayrollDocumentsForCorp, deleteDocument, editPayrollDocumentForCorp, updateStatus, documentsAndCountPDF, getExcel, findAllCategoriesAndDocuments, createPayrollDocumentForCorp, createCategoryWithDocument, editPayrollCategory, deletePayrollCategory } = require('../../../../controllers/admin/payrollDocs');
const { companyDocumentsFilesUpload } = require('../../../../middlewares/fileUpload');

const router = express.Router({ mergeParams: true })

router.get('/documents', listPayrollDocumentsForCorp)
router.get('/categories', findAllCategoriesAndDocuments)
router.post('/', companyDocumentsFilesUpload, createPayrollDocumentForCorp);
router.post('/category', createCategoryWithDocument);
router.put('/category/:categoryId', editPayrollCategory);
router.delete('/category/:categoryId', deletePayrollCategory);
router.put('/:documentId', companyDocumentsFilesUpload, editPayrollDocumentForCorp);
router.patch('/:documentId/status', updateStatus);
router.delete('/:documentId', deleteDocument);
router.get('/pdf', documentsAndCountPDF)
router.get('/:type', getExcel)


module.exports = router
