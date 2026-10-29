const express = require('express');
const router = express.Router();
const { 
    saveEpfSettings,
    saveEsiSettings,
    saveProfessionalTaxSettings,
    saveLaborWelfareFundSettings,
    getAllComplianceSettings,
    updateComplianceSettings,
    createTdsSettings,
    getEpfApplicability,
    updateEpfApplicability,
    updateEpfEarningsLine,
} = require("../controller/complainceSettings");

 const {validateEpfSettings,validateProfessionalTaxSettings,validateLaborWelfareFundSettings,validateTdsSettings, validateESISettings, validateEpfApplicability, validateEpfEarningsLine} =require('../utils/complianceSettings')
router.get('/', getAllComplianceSettings);
router.get('/epf-applicability', getEpfApplicability);
router.put('/epf-applicability', validateEpfApplicability, updateEpfApplicability);
router.put('/epf-earnings-line', validateEpfEarningsLine, updateEpfEarningsLine);
router.put('/:id',updateComplianceSettings)
router.post('/epf-settings',validateEpfSettings,saveEpfSettings);
router.post('/esi-settings',validateESISettings,saveEsiSettings);
router.post('/tax-settings',validateProfessionalTaxSettings,saveProfessionalTaxSettings);
router.post('/welfare-settings',validateLaborWelfareFundSettings,saveLaborWelfareFundSettings);
router.post('/tds',validateTdsSettings, createTdsSettings);

module.exports = router;
