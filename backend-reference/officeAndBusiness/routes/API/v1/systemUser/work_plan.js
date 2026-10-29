const express = require('express')
const { findAllWorkPlans, createWorkPlan, updateWorkPlan, deleteWorkPlan, updateWorkPlanStatus, workPlansPDF, workPlansExcelCSV } = require('../../../../controllers/admin/work_plan')
const { validateWorkPlanCreate, validateWorkPlanUpdate, validateWorkPlanUpdateStatus } = require('../../../../utils/apiValidation')
const router = express.Router()

router.get('/', findAllWorkPlans)
router.get('/pdf', workPlansPDF)
router.get('/:type', workPlansExcelCSV)
router.post('/',validateWorkPlanCreate, createWorkPlan)
router.put('/:id',validateWorkPlanUpdate, updateWorkPlan)
router.patch('/:id',validateWorkPlanUpdateStatus, updateWorkPlanStatus)
router.delete('/:id', deleteWorkPlan)


module.exports = router