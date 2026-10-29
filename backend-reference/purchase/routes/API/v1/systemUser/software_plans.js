const express = require("express");
const router = express.Router();
const upload = require('../../../../middlewares/multer')


const {
     createSoftwarePlan,
     deleteSoftwarePlan,
     findAllSoftwarePlansAndCount,
     updateSoftwarePlan,
     updateStatus,
     fetchSoftwares,
     getBulkTemplate,
     bulkExcelUploadSoftwarePlan,
     softwarePlansAndCountPDF,
     softwarePlansAndCountExcelCSV,
} = require('../../../../controllers/admin/software_plans')
const { excelToJsonSoftwaresPlans } = require("../../../../middlewares/excelToJson");
const {
     validateBulkSoftwarePlan,
     validateSoftwarePlan,
     validateActiveStatus,
} = require('../../../../utils/apiValidation');
const { findAllSoftwarePlansAndCountValidation } = require("../../../../utils/queryValidation");

router.get("/", findAllSoftwarePlansAndCountValidation, findAllSoftwarePlansAndCount);
router.post('/', validateSoftwarePlan, createSoftwarePlan)
router.put('/:id', validateSoftwarePlan, updateSoftwarePlan)
router.put('/updateStatus/:id', validateActiveStatus, updateStatus);
router.delete('/:id', deleteSoftwarePlan)
router.get("/softwares", fetchSoftwares)

//BULK UPLOAD
router.get('/bulk-template', getBulkTemplate)
router.post('/bulk-excel-upload', upload.single('file'), excelToJsonSoftwaresPlans, validateBulkSoftwarePlan, bulkExcelUploadSoftwarePlan)
router.post('/bulk-json-upload', validateBulkSoftwarePlan, bulkExcelUploadSoftwarePlan)

router.get('/pdf', findAllSoftwarePlansAndCountValidation, softwarePlansAndCountPDF)
router.get('/:type', findAllSoftwarePlansAndCountValidation, softwarePlansAndCountExcelCSV)

module.exports = router;