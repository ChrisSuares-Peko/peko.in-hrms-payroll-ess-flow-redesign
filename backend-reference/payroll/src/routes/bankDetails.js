const express = require("express");
const router = express.Router();
const {createbankDetails,updateBankDetails,deleteBankDetails,listBankDetails}= require("../controller/bankDetails");

router.get('/:employeeId',listBankDetails)
router.post('/:id', createbankDetails);
router.put('/:bankId', updateBankDetails);
router.delete('/:bankId', deleteBankDetails);


module.exports = router;
