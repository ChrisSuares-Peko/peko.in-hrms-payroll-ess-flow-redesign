const express = require("express");
const router = express.Router();
const upload = require('../../../../middlewares/multer')

const {
     createSoftware,
     findAllSoftwareAndCount,
     fetchSubscriptionVendor,
     updateStatus,
     deleteSoftware,
     updateSoftware,
     getBulkTemplate,
     bulkExcelUploadSoftwares,
     fetchAllSoftwareCategories,
     softwareAndCountPDF,
     softwareAndCountExcelCSV,
} = require('../../../../controllers/admin/software')
const { excelToJsonSoftwares } = require("../../../../middlewares/excelToJson");
const { validateBulkSoftwares, validateSoftware, validateActiveStatus } = require('../../../../utils/apiValidation')

router.get("/", findAllSoftwareAndCount);
router.post("/",validateSoftware, createSoftware);
router.get('/vendors', fetchSubscriptionVendor)
router.get('/fetchAllCategories', fetchAllSoftwareCategories)
router.put('/:id', updateSoftware)
router.put('/updateStatus/:id',validateActiveStatus, updateStatus);
router.delete('/:id', deleteSoftware)

//BULK UPLOAD
router.get('/bulk-template', getBulkTemplate)
router.post('/bulk-excel-upload', upload.single('file'), excelToJsonSoftwares, validateBulkSoftwares, bulkExcelUploadSoftwares)
router.post('/bulk-json-upload', validateBulkSoftwares, bulkExcelUploadSoftwares)

router.get('/pdf', softwareAndCountPDF)
router.get('/:type', softwareAndCountExcelCSV)

module.exports = router;