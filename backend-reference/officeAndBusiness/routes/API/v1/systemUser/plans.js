const express = require('express')
const router = express.Router()
const {
    createPlan,
    findAllPlansAndCount,
    updatePlan,
    deletePlan,
    updateStatus,
    plansAndCountPDF,
    plansAndCountExcelCSV
} = require('../../../../controllers/admin/plans')
const { validatePlanCreate, validatePlanUpdate, validatePlanUpdateStatus } = require('../../../../utils/apiValidation')



router.post('/',validatePlanCreate, createPlan)
router.get('/', findAllPlansAndCount)
router.get('/pdf', plansAndCountPDF)
router.get('/:type', plansAndCountExcelCSV)
router.put('/:id',validatePlanUpdate, updatePlan)
router.delete('/:id', deletePlan);
router.put('/updateStatus/:id',validatePlanUpdateStatus, updateStatus);
module.exports = router