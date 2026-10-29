const express = require('express')
const router = express.Router()
const {
     createInvoiceTemplete,
     getAllTemplateAndCount,
     updateInvoiceTemplate,
     deleteInvoiceTemplate,
     updateTemplateStatus,
} = require('../../../../controllers/admin/invoiceTemplete')
const { validateTempleteCreate, validateActiveStatus } = require('../../../../utils/apiValidation')

router.post('/',validateTempleteCreate, createInvoiceTemplete)
router.get('/get-templates', getAllTemplateAndCount)
router.put('/:id',validateTempleteCreate, updateInvoiceTemplate)
router.put('/updateStatus/:id', validateActiveStatus,updateTemplateStatus)
router.delete('/:id', deleteInvoiceTemplate)

module.exports = router