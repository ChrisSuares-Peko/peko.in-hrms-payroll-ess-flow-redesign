const express = require('express')
const { createWorks, updateWorks, findAllWorks, updateWorksStatus, fetchWorksVendor, findAllAvailableWorks, deleteWork, worksPDF, worksExcelCSV } = require('../../../../controllers/admin/works')
const { validateWorkCreate, validateWorkUpdate, validateWorkUpdateStatus } = require('../../../../utils/apiValidation')
const router = express.Router()

router.post('/',validateWorkCreate, createWorks)
router.get('/', findAllWorks)
router.get('/vendors', fetchWorksVendor)
router.get('/all', findAllAvailableWorks)
router.get('/pdf', worksPDF)
router.get('/:type', worksExcelCSV)
router.put('/:id',validateWorkUpdate, updateWorks)
router.patch('/:id',validateWorkUpdateStatus, updateWorksStatus)
router.delete('/:id', deleteWork)


module.exports = router