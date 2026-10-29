const express = require('express')
const { getQuestions, submitAnswers, getProjects, payment, details, merchantBalance, fetchProjectDetails, findAllTransactionsAndCount, checkUserExists, checkUserAndDashboardData, fetchNeutralizeDetails, getAllProjects } = require('../../../../controllers/corporate/carbonFootprint')
const { validateZeroCarbonBalance, validateZeroCarbonPayment, validateZeroCarbonQuestion } = require('../../../../utils/apiValidation')
const router = express.Router({mergeParams:true})

router.post('/balance',validateZeroCarbonBalance, merchantBalance)
router.get('/details', details)
router.get('/questions', getQuestions)
router.post('/questions',validateZeroCarbonQuestion, submitAnswers)
router.get('/projects', getProjects)
router.get('/projects/details/:id', fetchProjectDetails)
router.post('/payment',validateZeroCarbonPayment, payment)
router.get('/latestTransactions', findAllTransactionsAndCount)
router.get('/checkUser', checkUserExists)
router.get('/dashboard', checkUserAndDashboardData)
router.get('/neutralize/:id', fetchNeutralizeDetails)
router.get('/allProjects', getAllProjects)

module.exports = router