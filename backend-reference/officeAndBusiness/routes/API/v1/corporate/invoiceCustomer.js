/* eslint-disable no-unused-vars */
const express = require('express')
const { createCustomer, getAllCustomersByUserId, getCustomerById, updateCustomer, deleteCustomer, getAllCorporate, getAllCustomers } = require('../../../../controllers/corporate/invoiceCustomer');
const { validateInvoiceCustomerCreate } = require('../../../../utils/apiValidation');
const router = express.Router()

router.post('/',validateInvoiceCustomerCreate, createCustomer);
router.get('/', getCustomerById);
router.get('/details/:id', getAllCustomersByUserId);
router.put('/:id',validateInvoiceCustomerCreate, updateCustomer);
router.delete('/:id', deleteCustomer);
router.get('/corporate', getAllCorporate);
router.get('/all', getAllCustomers);
module.exports = router