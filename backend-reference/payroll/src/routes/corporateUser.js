const express = require('express');
const router = express.Router();
const { createCorporateUser, getAllCorporates, getCorporate, updateCorporate, deleteCorporate } = require('../controller/corporateUser')

// Create a new CorporateUser
router.post('/', createCorporateUser)

// Get all CorporateUsers
router.get('/', getAllCorporates)

// Get a specific CorporateUser by ID
router.get('/:id', getCorporate)

// Update a CorporateUser by ID
router.put('/:id', updateCorporate)


// Delete a CorporateUser by ID
router.delete('/:id', deleteCorporate)

module.exports = router;
