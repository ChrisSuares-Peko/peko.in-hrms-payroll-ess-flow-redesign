const express = require('express');
const router = express.Router();
const {
    createPlan,
    getAllPlans,
    updatePlan,
    updateStatus,
    deletePlan,
    exportExcelCSV,
    exportPDF,
    refetchPricing,
    fetchProductKeys,
    fetchPlansByProductKey,
    bulkImportPlans,
} = require('../../../../controllers/admin/domainHostingPlans');

router.post('/', createPlan);
router.post('/refetch-pricing', refetchPricing);
router.post('/bulk-import', bulkImportPlans);
router.get('/', getAllPlans);
router.get('/pdf', exportPDF);
router.get('/vendor-product-keys', fetchProductKeys);
router.get('/vendor-plans/:productKey', fetchPlansByProductKey);
router.get('/:type', exportExcelCSV);
router.put('/status/:id', updateStatus);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
