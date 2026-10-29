/**
 * Created by Salmaan Mushtaq.
 */

const express = require('express')
const router = express.Router()
const {
    findAllAttestationAndCount,
   
    getTransctionDetails,
    getExcel, 
    generatePDF,
    createAttestationCategory,
    updateAttestationCategory,
    deleteAttestationCategory,
    findAllAttestationCategories,
    AttestationAndCountExcelCSV,
    AttestationAndCountPDF
} = require('../../../../controllers/admin/attestation')
const { fetchCountries } = require('../../../../controllers/corporate/attestation')

// Attestation Category
router.post("/attestation-category", createAttestationCategory);
router.put("/attestation-category/:id", updateAttestationCategory);
router.delete("/attestation-category/:id", deleteAttestationCategory);
router.get("/attestation-categories", findAllAttestationCategories);
router.get("/attestation-categories/pdf", AttestationAndCountPDF);
router.get("/attestation-categories/:type", AttestationAndCountExcelCSV);

router.get('/reports', findAllAttestationAndCount)
router.get('/transactionDetails/:id', getTransctionDetails)
// router.put('/:id', validateAttestationAdminUpdate, updateAttestation)
router.get('/fetchCountries',fetchCountries)
router.get('/pdf', generatePDF)
router.get('/:type', getExcel)

module.exports = router