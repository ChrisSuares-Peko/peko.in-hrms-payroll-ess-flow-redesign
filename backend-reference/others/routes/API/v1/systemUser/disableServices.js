const express = require('express')
const router = express.Router()
const { findAllTransactionsAndCount, deleteDisableService, disableServicesStatus, createDisabledService, transactionsAndCountPDF, transactionsAndCountExcelCSV } = require('../../../../controllers/admin/disableServices')
const { fetchServiceOperator } = require('../../../../controllers/admin/serviceOperator')
const { fetchAllCorporateUsers } = require('../../../../controllers/admin/corporateUser')
const { validateDisableService, validateServiceStatus } = require('../../../../utils/apiValidation')
const { validateDisabledServicesQuery, validateFetchServiceOperatorQuery, validateFetchAllCorporateQuery } = require('../../../../utils/queryValidation')
// const moment = require('moment');
// const async = require('async');

router.post('/', validateDisableService, createDisabledService)
router.get('/', validateDisabledServicesQuery, findAllTransactionsAndCount);
router.get('/pdf', validateDisabledServicesQuery, transactionsAndCountPDF)
router.get('/fetchServiceOperator', validateFetchServiceOperatorQuery, fetchServiceOperator);
router.get('/fetchAllCorporate', validateFetchAllCorporateQuery, fetchAllCorporateUsers);
router.get('/:type', validateDisabledServicesQuery, transactionsAndCountExcelCSV)
router.delete('/:id', deleteDisableService)
router.put('/status/:id', validateServiceStatus, disableServicesStatus);
module.exports = router