const express = require("express");
const router = express.Router();
const { createBonus, getBounusUsingId, editBonusUsingId, deleteBonus, fetchBonusAmount, getAllBonus, fetchSingleBonusUsingId } = require("../controller/bonus");
const { validateBonusCalculation } = require("../utils/apiValidation");
const { requireOwnedEmployee } = require('../utils/tenantScope');

//create bonus
// router.post('/:id',validateBonusCreate, createBonus);
router.post('/:id',createBonus);

//get all the bonus under the corporate
router.get('/',getAllBonus);

//get bonus data for specific user
router.get('/:id', requireOwnedEmployee('id'),getBounusUsingId);

//edit bonus data using id
// router.put('/:id',validateBonusUpdate, editBonusUsingId);
router.put('/:id', editBonusUsingId);

//delete bonus using id
router.delete('/:id',deleteBonus);

//find bonus Amount
router.post('/calculation/:id',validateBonusCalculation, fetchBonusAmount);

//get bonus details by id
router.get('/bonus-details/:bonusId', fetchSingleBonusUsingId)


module.exports = router;