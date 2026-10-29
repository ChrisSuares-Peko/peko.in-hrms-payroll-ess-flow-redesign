const express = require("express");
const router = express.Router();
const { fetchAllDocuments, createDocument, deleteDocument, updateDocument, fetchDocumentsByEmployeeId } = require("../controller/documents");
const {  employeeDocumentsFilesUpload } = require("../middleware/fileUpload");
const { validateDocumentCreate, validateDocumentUpdate } = require("../middleware/documents");
const { requireOwnedEmployee } = require('../utils/tenantScope');
router.get('/', fetchAllDocuments);
router.get('/:employeeId', requireOwnedEmployee('employeeId'), fetchDocumentsByEmployeeId);
router.post('/',validateDocumentCreate, employeeDocumentsFilesUpload, createDocument);
router.put('/:documentId/:employeeId',validateDocumentUpdate, employeeDocumentsFilesUpload, updateDocument); // Add new route for updating documents
router.delete('/:documentId/:employeeId', deleteDocument);

module.exports = router;
