const express = require("express");
const router = express.Router();
const { getAllAssets, createAssets, deleteAssets, fetchAllAssetTypes ,getAllAssetsById,updateAssets } = require("../controller/assets");
const { validateAssetCreate } = require("../utils/apiValidation");
const { requireOwnedEmployee } = require('../utils/tenantScope');

//fetch assets
router.get('/',getAllAssets);


//create assets
router.post("/",validateAssetCreate, createAssets);

//delete asset
router.delete('/:assetId', deleteAssets);

//fetch all assets type
router.get('/asset-types', fetchAllAssetTypes);

//fetch assets by employee ID
router.get("/:employeeId", requireOwnedEmployee('employeeId'),getAllAssetsById )

//edit assets of the employees
router.put('/:assetId/:employeeId', updateAssets); // Add new route for updating documents




module.exports = router;