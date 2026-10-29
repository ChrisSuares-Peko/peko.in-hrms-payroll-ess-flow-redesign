const express = require('express');
const router = express.Router();
const { calculateGratuity } = require('../controller/gratuity');
const { validateGratuityCalculation } = require('../utils/apiValidation');



router.post('/',validateGratuityCalculation, calculateGratuity)


module.exports = router;
