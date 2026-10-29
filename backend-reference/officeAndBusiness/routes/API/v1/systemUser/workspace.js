const express = require('express');
const { findAllWorkspacesAndCount, createWorkspaces, updateWorkspace, deleteWorkspace, updateStatus, workspacesAndCountPDF, workspacesAndCountExcelCSV } = require('../../../../controllers/admin/workspaces');
const { fetchPlans } = require('../../../../controllers/admin/plans');
const { validateWorkSpaceCreate, validateWorkSpaceUpdate, validateWorkSpaceUpdateStatus } = require('../../../../utils/apiValidation');

const router = express.Router({mergeParams:true})

router.get('/', findAllWorkspacesAndCount)
router.get('/plans', fetchPlans)
router.get('/pdf', workspacesAndCountPDF)
router.get('/:type', workspacesAndCountExcelCSV)
router.post('/',validateWorkSpaceCreate, createWorkspaces)
router.put('/:id',validateWorkSpaceUpdate, updateWorkspace)
router.delete('/:id', deleteWorkspace)
router.put('/update-status/:id',validateWorkSpaceUpdateStatus, updateStatus);

module.exports = router