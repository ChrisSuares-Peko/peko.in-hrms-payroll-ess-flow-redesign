const express = require('express')
const router = express.Router()
const { updateGiftCard, updateStatus, getAllGiftCards, findAllGiftCardsAndCount, bulkCreateGiftCard, getExcel, updateAllStatus, giftCardsAndCountPDF, giftCardsAndCountExcelCSV, autoUpdateGiftCard, fetchServiceOperator } = require('../../../../controllers/admin/giftCards')
const { excelToJsonGiftCards } = require('../../../../middlewares/excelToJson')
const {
     validateBulkUploadsGiftCards,
     validateGiftCard,
     validateActiveStatus,
} = require('../../../../utils/apiValidation')
const { findAllGiftCardsAndCountValidation } = require('../../../../utils/queryValidation')



router.get('/giftCards',findAllGiftCardsAndCountValidation, findAllGiftCardsAndCount)
router.get('/giftCards/pdf',findAllGiftCardsAndCountValidation, giftCardsAndCountPDF)
router.get('/giftCards/:type',findAllGiftCardsAndCountValidation, giftCardsAndCountExcelCSV)
// router.post('/', validateGiftCard, createGiftCard)
router.put('/:id', validateGiftCard, updateGiftCard)
router.get('/excel', getExcel)
router.patch('/update-gift-cards',validateActiveStatus, updateAllStatus)
router.patch('/:id',validateActiveStatus, updateStatus)
router.get('/', getAllGiftCards)
router.post('/excel', excelToJsonGiftCards, validateBulkUploadsGiftCards, bulkCreateGiftCard)
router.post('/auto', autoUpdateGiftCard)
router.get('/serviceOperator', fetchServiceOperator)


module.exports = router