const express = require('express')
const router = express.Router()
const { findAllPendingSignUpsAndCount, pendingSignUpsExcelCSV, pendingSignUpsPDF, updatePendingSignUp } = require('../../../../controllers/admin/signUpActivityLog')
const { findAllPendingSignUpsAndCountValidation, updatePendingSignUpValidation } = require('../../../../utils/queryValidation')

router.get('/',findAllPendingSignUpsAndCountValidation, findAllPendingSignUpsAndCount)
router.put('/:id', updatePendingSignUpValidation, updatePendingSignUp)
router.get('/export/pdf',findAllPendingSignUpsAndCountValidation, pendingSignUpsPDF)
router.get('/export/:type',findAllPendingSignUpsAndCountValidation, pendingSignUpsExcelCSV)

module.exports = router