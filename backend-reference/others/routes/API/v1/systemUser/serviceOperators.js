const express = require('express')
const router = express.Router()
const {
     createServiceOperator,
     updateServiceOperator,
     findAllServiceOperatorAndCount,
     serviceOperatorAndCountPDF,
     serviceOperatorAndCountExcelCSV,
     updateServiceOperatorStatus,
} = require('../../../../controllers/admin/serviceOperator')
const { validateServiceOperator,validateServiceOperatorStatus } = require('../../../../utils/apiValidation')
const { findAllServiceOperatorAndCountValidation } = require('../../../../utils/queryValidation')

router.post('/',validateServiceOperator,  createServiceOperator)//✅
router.get('/',findAllServiceOperatorAndCountValidation,findAllServiceOperatorAndCount)//✅
router.get('/pdf',findAllServiceOperatorAndCountValidation, serviceOperatorAndCountPDF)//✅
router.get('/:type',findAllServiceOperatorAndCountValidation, serviceOperatorAndCountExcelCSV)//✅
router.put('/:id',validateServiceOperator, updateServiceOperator)//✅
router.put('/updateStatus/:id',validateServiceOperatorStatus, updateServiceOperatorStatus)//✅

module.exports = router