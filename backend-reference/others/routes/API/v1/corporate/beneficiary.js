const express = require('express')
const router = express.Router({mergeParams:true})
const {
  createBeneficiary,
  updateBeneficiary,
  findAllBeneficiary,
  deleteBeneficiary,
  fetchBeneficiary,
  getOtp,
  updateStatus,
  fetchBeneficiaryTelecom,
  fetchBeneficiaryUtility,
  FetchLastBeneficiaries
} = require('../../../../controllers/corporate/beneficiary')
const { validateAddingBeneficiary, validateUpdatingBeneficiary } = require('../../../../utils/apiValidation')

router.post('/otp', getOtp)//✅
router.post('/', validateAddingBeneficiary, createBeneficiary)//✅
router.get('/fetchBeneficiary', fetchBeneficiary)//✅

// <<<-----working--------->>>
router.get('/allBeneficiaries', findAllBeneficiary)
router.put('/:id',validateUpdatingBeneficiary, updateBeneficiary)//✅
router.delete('/:id', deleteBeneficiary)//✅
router.patch('/:id', updateStatus);

router.get('/latestBeneficiaries',FetchLastBeneficiaries)

router.get('/telecom', fetchBeneficiaryTelecom)//✅
router.get('/utility', fetchBeneficiaryUtility)//✅


module.exports = router