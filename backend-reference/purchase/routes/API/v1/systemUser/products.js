const express = require('express')
const router = express.Router()
const {
    createProduct,
    updateProduct,
    updateStatus,
    findAllProductAndCount,
    fetchProduct,
    fetchAllCategories,
    fetchAllPhotos,
    fetchEcomVendor,
    deleteProduct,
    getBulkTemplate,
    bulkExcelUploadProducts,
    productAndCountPDF,
    productAndCountExcelCSV
} = require('../../../../controllers/admin/products')
const { excelToJsonProducts } = require('../../../../middlewares/excelToJson')
const upload = require('../../../../middlewares/multer')
const { validateBulkProducts, validateProduct, validateActiveStatus } = require('../../../../utils/apiValidation')
const { findAllProductAndCountValidation, fetchAllCategoriesValidation } = require('../../../../utils/queryValidation')
// const moment = require('moment');
// const async = require('async');
// const {
//     validateAddingVendor,
//     validateUpdatingVendor
// } = require('../../../utils/apiValidation')


router.get("/bulk-template", getBulkTemplate);
router.post("/bulk-excel-upload", upload.single("file"), excelToJsonProducts, validateBulkProducts, bulkExcelUploadProducts);
router.post("/bulk-json-upload", validateBulkProducts, bulkExcelUploadProducts);

router.post("/", validateProduct, createProduct);
router.get("/all",findAllProductAndCountValidation, findAllProductAndCount);
router.get("/all/pdf",findAllProductAndCountValidation, productAndCountPDF);
router.get("/all/:type",findAllProductAndCountValidation, productAndCountExcelCSV);
router.get("/fetchAllCategories",fetchAllCategoriesValidation, fetchAllCategories);
router.get("/vendors",fetchAllCategoriesValidation, fetchEcomVendor);
router.get("/:id", fetchProduct);
router.put("/:id",validateProduct, updateProduct);
router.put("/updateStatus/:id",validateActiveStatus, updateStatus);
router.get("/fetchAllPhotos/:id", fetchAllPhotos);
router.delete("/:id", deleteProduct);


module.exports = router