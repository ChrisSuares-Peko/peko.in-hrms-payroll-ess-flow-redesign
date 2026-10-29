const express = require('express');
const { findAllPekoAndCount, createPeko, deletePeko, updatePeko, updateStatus, pekoAndCountPDF, pekoAndCountExcelCSV } = require('../../../../controllers/admin/peko_connect');
const {
     validatePekoConnectCreate,
     validatePekoConnectUpdate,
     validatePekoConnectUpdateStatus,
} = require('../../../../utils/apiValidation')

const router = express.Router({mergeParams:true})
router.get('/',findAllPekoAndCount);
router.get('/pdf',pekoAndCountPDF);
router.get('/:type',pekoAndCountExcelCSV);
router.post('/', validatePekoConnectCreate,createPeko)
router.delete('/:id', deletePeko);
router.put('/:id',validatePekoConnectUpdate, updatePeko);
router.put('/update-status/:id',validatePekoConnectUpdateStatus, updateStatus);

module.exports = router