const express = require('express');
const router = express.Router();
const { validateHolidayCreate, validateHolidaySendEmail, validateHolidayUpdate } = require('../utils/apiValidation');
const { createNewHoliday, sendEmail, getHolidays, getHolidayById } = require('../controller/holiday');
const { getHolidayForCorporate, deleteHolidayById } = require('../controller/holiday');



// Create a new Holiday
router.post('/', validateHolidayCreate, createNewHoliday)

router.post('/sendEmail/:id', validateHolidaySendEmail, sendEmail)

// Get all Holidays for a specific corporateUser
router.get('/', getHolidays)

// Get a specific Holiday by ID for a specific corporateUser
router.get('/:id', getHolidayById)

// Update a Holiday by ID for a specific corporateUser
router.put('/:id', validateHolidayUpdate, getHolidayForCorporate)

// Delete a Holiday by ID for a specific corporateUser
router.delete('/:id', deleteHolidayById)


module.exports = router;
