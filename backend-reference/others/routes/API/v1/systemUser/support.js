const express = require('express')
const router = express.Router()
const { findAllMessageAndCount, updateMessage, getExcel, allMessages, createChatMessage, getAllChatMessage, createMessage, fetchTicketDetails ,downloadReportExcelCSV, downloadReportPDF } = require('../../../../controllers/admin/support')
const { validateTicketStatus, validateSupportMessage, validateSupportTicket } = require('../../../../utils/apiValidation')
const { findAllMessageAndCountValidation } = require('../../../../utils/queryValidation')

router.get('/tickets',findAllMessageAndCountValidation, findAllMessageAndCount)//✅
router.get('/all-messages', allMessages)
router.get('/excel', getExcel)
router.get('/download-report/pdf',findAllMessageAndCountValidation, downloadReportPDF)
router.get('/download-report/:type',findAllMessageAndCountValidation, downloadReportExcelCSV)
router.put('/:id',validateTicketStatus, updateMessage)
router.post('/create',validateSupportMessage,createChatMessage)  
router.get('/chats/:id',getAllChatMessage)  
router.post('/create-ticket',validateSupportTicket,createMessage) //✅
router.get('/ticketDetials/:id', fetchTicketDetails)//✅
module.exports = router