const express = require("express");
const router = express.Router();
const { listAllDocumentRequestsForCorporate, uploadDocumentRequest } = require("../controller/documentRequest");
const { validateDocumentRequestUpload } = require("../middleware/validation/onboarding");
const { documentRequestFilesUpload } = require("../middleware/fileUpload");

router.get('/', listAllDocumentRequestsForCorporate);
router.post('/:requestId/upload', validateDocumentRequestUpload, documentRequestFilesUpload, uploadDocumentRequest);

module.exports = router;
