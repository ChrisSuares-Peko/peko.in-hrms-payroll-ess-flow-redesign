const express = require('express');
const { createEmployee, findAllEmployees, updateEmployee, deleteEmployee, findAllEmployeesList, GetEmployeesList, getEmployeesInfoDetails } = require('../../../../controllers/corporate/pekoCloud/cloud_employees');
const { findAllOwners, createOwner, updateOwner, deleteOwner } = require('../../../../controllers/corporate/pekoCloud/cloud_owners');
const { findAllCompanyDocs, createCompanyDoc, updateCompanyDoc, deleteCompanyDoc, findAllCompanyDocsList, getCompanyInfoDetails } = require('../../../../controllers/corporate/pekoCloud/cloud_companyDocs');
const { findAllFinancialDocs, createFinancialDoc, updateFinancialDoc, deleteFinancialDoc, findAllFinancialDocsList, getFinancialsInfoDetails } = require('../../../../controllers/corporate/pekoCloud/cloud_financialDocs');
const { findAllUsageHistories, updateUsageHistory, deleteUsageHistory, findLatestUsageHistory } = require('../../../../controllers/corporate/pekoCloud/cloud_assetUsageHistories');
const { findAllFleetUsageHistories, deleteFleetUsageHistory, updateFleetUsageHistory,  findLatestFleetUsageHistory } = require('../../../../controllers/corporate/pekoCloud/cloud_fleetUsageHistories');
const { findAllAssets, createAsset, updateAsset, deleteAsset, findAllAssetsList, findSingleAsset, assignAsset, findAllAssetsUsageHistories, getAssetsInfoDetails } = require('../../../../controllers/corporate/pekoCloud/cloud_assets');
const { findAllAssetDocs, createAssetDoc, updateAssetDoc, deleteAssetDoc } = require('../../../../controllers/corporate/pekoCloud/cloud_assetDocs');
const { createSubscriptions, findSubscriptions, updateSubscriptions, deleteSubscription, assignSubscription, fetchTotal, findSubscriptionsList, getSubscriptionsInfoDetails } = require('../../../../controllers/corporate/pekoCloud/cloud_subscriptions');
const { findAllFleets, createFleet, updateFleet, deleteFleet, findAllFleetsList, findSingleFleet, assignFleet, findAllFleetsUsageHistories, getFleetInfoDetails } = require('../../../../controllers/corporate/pekoCloud/cloud_fleets');
const { updateFleetDoc, createFleetDoc, findAllFleetDocs, deleteFleetDoc } = require('../../../../controllers/corporate/pekoCloud/cloud_fleetDocs');
const { findAllFleetMaintenances, createFleetMaintenance, updateFleetMaintenance, deleteFleetMaintenance } = require('../../../../controllers/corporate/pekoCloud/cloud_fleetMaintenances');
const { getDashDetails } = require('../../../../controllers/corporate/pekoCloud/cloud_dashboard');
const { getToDoList } = require('../../../../controllers/corporate/pekoCloud/cloud_taskToDo');
const { findAllChequeBooks, createChequeBook, findAllChequeBooksList, updateChequeBook, deleteChequeBook, findSingleChequeBook } = require('../../../../controllers/corporate/pekoCloud/cloud_chequeBooks');
const { findAllChequeLeaves, createChequeLeaf, findAllChequeLeavesList, findSingleChequeLeaf, updateChequeLeaf, deleteChequeLeaf, getFinancialInfo } = require('../../../../controllers/corporate/pekoCloud/cloud_chequeLeaves');
const { findSoftwaresList } = require('../../../../controllers/corporate/pekoCloud/cloud_softwares');
const { getDocument } = require('../../../../controllers/corporate/pekoCloud/cloud_documents');
const { getCloudUsage } = require('../../../../controllers/corporate/pekoCloud/cloud_storage');
const { verifyUser } = require('../../../../middlewares/verifySubCorporate');
const { validateCreateEmployee, validateUpdateEmployee, validateCreateOwner, validateUpdateOwner, validateCreateCompanyDoc, validateUpdateCompanyDoc, validateCreateChequeLeaf, validateUpdateChequeLeaf, validateCreateChequeBook, validateUpdateChequeBook, validateCreateFinancialDoc, validateUpdateFinancialDoc, validateUpdateSubscription, validateCreateSubscription, validateAssignSubscription, validateCreateAsset, validateUpdateAsset, validateAssignAsset, validateUpdateAssetDoc, validateCreateAssetDoc, validateUpdateAssetUsageHistory, validateUpdateFleet, validateCreateFleet, validateAssignFleet, validateCreateFleetDoc, validateUpdateFleetDoc, validateUpdateFleetUsageHistory, validateUpdateFleetMaintenance, validateCreateFleetMaintenance } = require('../../../../utils/apiValidation');
const router = express.Router({ mergeParams: true })


router.use(verifyUser('Hub')); 

//dashboard
router.get('/dashboard', getDashDetails);
router.get('/task-to-do', getToDoList);

router.get('/storage', getCloudUsage);

//employee
router.get('/employees', findAllEmployees);
router.get('/employees/all',findAllEmployeesList) // not used on web (using in mobile app)
router.get('/employees/info',getEmployeesInfoDetails)
router.get('/employees/list',GetEmployeesList)
router.post('/employees', validateCreateEmployee, createEmployee);
router.put('/employees/:employeeId', validateUpdateEmployee, updateEmployee);
router.delete('/employees/:employeeId', deleteEmployee);

//owner
router.get('/owners',findAllOwners)
router.post('/owners', validateCreateOwner, createOwner)
router.put('/owners/:ownerId', validateUpdateOwner, updateOwner)
router.delete('/owners/:ownerId',deleteOwner)

//company-doc
router.get('/company-docs',findAllCompanyDocs)
router.post('/company-docs', validateCreateCompanyDoc, createCompanyDoc)
router.get('/company-docs/all',findAllCompanyDocsList) // not used on web (using in mobile app)
router.get('/company-docs/info',getCompanyInfoDetails)
router.put('/company-docs/:docId', validateUpdateCompanyDoc, updateCompanyDoc)
router.delete('/company-docs/:docId',deleteCompanyDoc)

//financial-info
router.get('/financial-info',getFinancialInfo) // not used on web (using in mobile app)
router.get('/financial-docs/info',getFinancialsInfoDetails)

//cheque-book
router.get('/cheque-books',findAllChequeBooks)
router.post('/cheque-books', validateCreateChequeBook, createChequeBook)
router.get('/cheque-books/all',findAllChequeBooksList) // not used on web (using in mobile app)
router.get('/cheque-books/:chequeBookId',findSingleChequeBook)
router.put('/cheque-books/:chequeBookId', validateUpdateChequeBook, updateChequeBook)
router.delete('/cheque-books/:chequeBookId',deleteChequeBook)

//cheque-leaf
router.get('/cheque-leaves',findAllChequeLeaves)
router.post('/cheque-leaves', validateCreateChequeLeaf, createChequeLeaf)
router.get('/cheque-leaves/all',findAllChequeLeavesList) // not used on web (using in mobile app)
router.get('/cheque-leaves/:chequeLeafId',findSingleChequeLeaf)
router.put('/cheque-leaves/:chequeLeafId', validateUpdateChequeLeaf, updateChequeLeaf)
router.delete('/cheque-leaves/:chequeLeafId',deleteChequeLeaf)

//financial-doc
router.get('/financial-docs',findAllFinancialDocs)
router.post('/financial-docs', validateCreateFinancialDoc, createFinancialDoc)
router.get('/financial-docs/all',findAllFinancialDocsList) // not used on web (using in mobile app)
router.put('/financial-docs/:docId', validateUpdateFinancialDoc, updateFinancialDoc)
router.delete('/financial-docs/:docId',deleteFinancialDoc)

//asset
router.get('/assets',findAllAssets)
router.post('/assets', validateCreateAsset, createAsset)
router.get('/assets/all',findAllAssetsList) // not used on web (using in mobile app)
router.get('/assets/info',getAssetsInfoDetails)
router.get('/assets/usage',findAllAssetsUsageHistories)
router.patch("/assets/assign", validateAssignAsset, assignAsset)
router.get('/assets/:assetId',findSingleAsset)
router.put('/assets/:assetId', validateUpdateAsset, updateAsset)
router.delete('/assets/:assetId',deleteAsset)

//asset-docs
router.get('/asset-details/docs',findAllAssetDocs)
router.post('/asset-details/docs', validateCreateAssetDoc, createAssetDoc)
router.put('/asset-details/docs/:docId', validateUpdateAssetDoc, updateAssetDoc)
router.delete('/asset-details/docs/:docId',deleteAssetDoc)

//asset-usageHistories
router.get('/asset-details/usage-history',findAllUsageHistories)
// router.post('/asset-details/usage-history',createUsageHistory)
router.get('/asset-details/usage-history/latest',findLatestUsageHistory)
router.put('/asset-details/usage-history/:usageId', validateUpdateAssetUsageHistory, updateUsageHistory)
router.delete('/asset-details/usage-history/:usageId',deleteUsageHistory)

//fleet
router.get('/fleets',findAllFleets)
router.post('/fleets', validateCreateFleet, createFleet)
router.get('/fleets/all',findAllFleetsList) // not used on web (using in mobile app)
router.get('/fleets/info',getFleetInfoDetails)
router.get('/fleets/usage',findAllFleetsUsageHistories)
router.patch("/fleets/assign", validateAssignFleet, assignFleet)
router.get('/fleets/:fleetId',findSingleFleet)
router.put('/fleets/:fleetId', validateUpdateFleet, updateFleet)
router.delete('/fleets/:fleetId',deleteFleet)

//fleet-docs
router.get('/fleet-details/docs',findAllFleetDocs)
router.post('/fleet-details/docs', validateCreateFleetDoc, createFleetDoc)
router.put('/fleet-details/docs/:docId', validateUpdateFleetDoc, updateFleetDoc)
router.delete('/fleet-details/docs/:docId',deleteFleetDoc)

//fleet-maintenances
router.get('/fleet-details/maintenances',findAllFleetMaintenances)
router.post('/fleet-details/maintenances', validateCreateFleetMaintenance, createFleetMaintenance)
router.put('/fleet-details/maintenances/:maintenanceId', validateUpdateFleetMaintenance, updateFleetMaintenance)
router.delete('/fleet-details/maintenances/:maintenanceId',deleteFleetMaintenance)

//fleet-usageHistories
router.get('/fleet-details/usage-history',findAllFleetUsageHistories)
// router.post('/fleet-details/usage-history',createFleetUsageHistory)
router.get('/fleet-details/usage-history/latest',findLatestFleetUsageHistory)
router.put('/fleet-details/usage-history/:usageId', validateUpdateFleetUsageHistory, updateFleetUsageHistory)
router.delete('/fleet-details/usage-history/:usageId',deleteFleetUsageHistory)

//subscriptions
router.get('/subscriptions', findSubscriptions);
router.post('/subscriptions', validateCreateSubscription, createSubscriptions);
router.put("/subscriptions/:subscriptionId", validateUpdateSubscription, updateSubscriptions);
router.delete("/subscriptions/:subscriptionId", deleteSubscription);
router.patch("/subscriptions/assign", validateAssignSubscription, assignSubscription)
router.get('/subscriptions/all',findSubscriptionsList) // not used on web (using in mobile app)
router.get('/subscriptions/info',getSubscriptionsInfoDetails)
router.get("/subscriptions/total", fetchTotal);

router.get('/softwares/all',findSoftwaresList)

router.get('/document',getDocument)

module.exports = router