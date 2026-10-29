const express = require('express');
const router = express.Router();
const {
    createPlan,
    getAllPlans,
    updatePlan,
    updateStatus,
} = require('../../../../controllers/admin/carReportPlans');

router.post('/', createPlan);
router.get('/', getAllPlans);
router.put('/status/:id', updateStatus);
router.put('/:id', updatePlan);

module.exports = router;
