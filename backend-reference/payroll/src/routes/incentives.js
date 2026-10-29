const express = require('express');
const router = express.Router();
const { createIncentive, getAllIncentives, editIncentive, deleteIncentive, fetchAllIncentives, getIncentiveUsingId } = require('../controller/incentives');
const { requireOwnedEmployee } = require('../utils/tenantScope');

//create


//get
router.get('/:id', requireOwnedEmployee('id'),getAllIncentives);
router.get('/',fetchAllIncentives);
// router.put('/:id',validateIncentiveUpdate, editIncentive);
router.put('/:id', editIncentive);
router.delete('/:id',deleteIncentive);
router.get('/incentive-details/:incentiveId', getIncentiveUsingId)


//new routes
// router.post('/:id',validateIncentiveCreate, createIncentive)
router.post('/:id', createIncentive)

module.exports = router;
