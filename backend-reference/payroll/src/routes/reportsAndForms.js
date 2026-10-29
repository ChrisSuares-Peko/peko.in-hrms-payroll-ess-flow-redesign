const express = require('express');
const upload = require("../middleware/multer");

const { getSalaryTableDataForReports,getForm24QTemplate,uploadForm24Q ,getForm24QUnderACorporateUser} = require('../controller/reportsAndForms');
const { createForm16A, createForm16B,getForm16A,getForm16B,getPdfForm16,getTdsDetails,getTdsList,getTdsListExcel} = require('../controller/form16');
const { getEmployeeBySearch} = require("../controller/employee")

const { createIncomeDeclarationForm,getIncomeDeclarationForm } = require('../controller/incomeDeclarationForm');
const{validateIncomeDeclarationForm}= require('../utils/apivalidation/reportsAndForms')
const { form24QToJson} = require('../services/form24qUpload');

const router = express.Router();


router.get('/', getSalaryTableDataForReports);

router.get('/form24q-template', getForm24QTemplate);

router.post('/form24q',upload.single('file'),form24QToJson, uploadForm24Q);
router.get('/form24q', getForm24QTemplate);
router.get('/form24q/all', getForm24QUnderACorporateUser);

router.get('/incomeDeclaration-form', getIncomeDeclarationForm);

router.post('/incomeDeclaration-form',validateIncomeDeclarationForm, createIncomeDeclarationForm);
router.get("/search-employees", getEmployeeBySearch)
router.get('/form16a', getForm16A);
router.post('/form16a', createForm16A);
router.post('/form16b', createForm16B);
router.get('/form16b', getForm16B);
router.get('/form16/download', getPdfForm16);
router.get('/tdsReportsList', getTdsList);
router.get('/tdsReportsList/excel', getTdsListExcel);
router.get('/tdsReortsDetails', getTdsDetails);

module.exports = router;
