const express = require('express')
const router = express.Router()
const { findAllWorks, findWorkDetails, payment, findAllTransactionsAndCount, orderDetails } = require('../../../../controllers/corporate/works')
const { findAllWorksPlan, findWorkPlanDetails } = require('../../../../controllers/corporate/works_plan')
const { validateWorksPayment } = require('../../../../utils/apiValidation')
const validateworksAmount = require('../../../../middlewares/worksPaymentValidation')

// router.use(verifyUser('Works')); 

router.get('/', findAllWorks)
router.get('/details/:id', findWorkDetails)
router.get('/plans/:workId', findAllWorksPlan)
router.post('/payment',validateWorksPayment,validateworksAmount, payment)
router.get('/orders', findAllTransactionsAndCount)
router.get('/orders/details/:id', orderDetails)
router.get('/plan/details/:id', findWorkPlanDetails)

module.exports = router