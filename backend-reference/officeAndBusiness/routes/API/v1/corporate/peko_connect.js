const express = require('express')
const router = express.Router()
const {
  findAllPeko,
  createRequest,
  findMyConnections,
  findProviderDetails
} = require('../../../../controllers/corporate/peko_connect')
const { validateConnectRequest } = require('../../../../utils/apiValidation');
const { verifyUser } = require('../../../../middlewares/verifySubCorporate');

router.use(verifyUser('Marketplace')); 

router.post('/',validateConnectRequest, createRequest)
router.get('/providers', findAllPeko)
router.get('/connections',findMyConnections)
router.get('/details/:id',findProviderDetails)
module.exports = router