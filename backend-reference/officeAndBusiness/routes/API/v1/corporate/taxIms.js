const router = require('express').Router({ mergeParams: true })

const {
    getImsData,
    updateImsInvoice,
    getItcEstimateHandler,
    saveImsChanges,
    getSaveHistory,
    proceedIms,
    getAddedBackLiabilities,
    getSupplierInvoices,
    resetImsInvoices,
} = require('../../../../controllers/corporate/taxImsController')

const { validateImsAction } = require('../../../../utils/apiValidation')

router.get('/',            getImsData)
router.put('/invoice/:id', validateImsAction, updateImsInvoice)
router.get('/itc',         getItcEstimateHandler)
router.post('/save',       saveImsChanges)
router.get('/saves',       getSaveHistory)
router.post('/proceed',    proceedIms)
router.get('/added-back',  getAddedBackLiabilities)
router.get('/supplier',    getSupplierInvoices)
router.post('/reset',      resetImsInvoices)

module.exports = router
