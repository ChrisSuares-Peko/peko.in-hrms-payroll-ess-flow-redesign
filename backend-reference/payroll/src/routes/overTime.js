const express = require("express");
const router = express.Router();
const { createOvertime, getAllOverTime, deleteAnOverTime, editAnOverTime, calculateOverTimeAmount, fetchAllOverTime, fetchSingleOvertimeUsingId, updateOvertimeStatus, updateOvertimeRate } = require("../controller/overTime");
const { validateOvertimeCalculation, validateOvertimeRateUpdate } = require("../utils/apiValidation");
const { requireOwnedEmployee } = require('../utils/tenantScope');

//create
// router.post('/:id',validateOvertimeCreate, createOvertime);
router.post('/:id', createOvertime);

//overtime 
router.post('/overtime-amount/:id',validateOvertimeCalculation, calculateOverTimeAmount)

//fetch all data with id
router.get('/:id', requireOwnedEmployee('id'),getAllOverTime);

//fetch all data under this corporate
router.get('/',fetchAllOverTime);

//delete specific data
router.delete('/:id',deleteAnOverTime)

//edit
// router.put('/:id',validateOvertimeUpdate, editAnOverTime)
router.put('/:id', editAnOverTime)

router.get('/overtime-details/:overtimeId', fetchSingleOvertimeUsingId);

// PATCH /overtime/:overtimeId/status
// Body: status (approved | rejected), notes (optional)
router.patch('/:overtimeId/status', updateOvertimeStatus);

// PATCH /overtime/:overtimeId/rate
// HR: update overtime rate only; recalculates hourly rate and overtime amount
router.patch('/:overtimeId/rate', validateOvertimeRateUpdate, updateOvertimeRate);

module.exports = router;