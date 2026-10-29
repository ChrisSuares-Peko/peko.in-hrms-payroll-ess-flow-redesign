/**
 * Created by Ubair Noor.
 */

const express = require('express')
const router = express.Router()
const {
  findAllPlans,
  
} = require("../../../../controllers/admin/plans")
const {
  payment,
  findAllWorkspaces,
  findAllSelectedWorkspaces,
  uploadDocuments,
  fetchSinglePlan,
  fetchSingleWorkSpace
} = require("../../../../controllers/corporate/workspace");
const { validateWorkspaceFileUpload, validateWorkspacePayment } = require('../../../../utils/apiValidation');

router.get('/allPlans', findAllPlans);
router.get('/fetchSinglePlan/:id', fetchSinglePlan);
router.get('/fetchSingleWorkspace/:id', fetchSingleWorkSpace)
router.get('/allWorkspaces', findAllWorkspaces)
router.post('/payment',validateWorkspacePayment, payment)
router.post('/fileUpload',validateWorkspaceFileUpload, uploadDocuments)
router.get("/workspaceHistory",findAllSelectedWorkspaces)
module.exports = router