const express = require('express')
const router = express.Router()
const {
     createCategory,
     updateCategory,
     updateStatus,
     findAllCategoriesAndCount,
     fetchCategory,
     getExcel,
     deleteCategory,
     categoriesAndCountPDF,
     categoriesAndCountExcelCSV,
} = require('../../../../controllers/admin/categories')
const { validateAddCategory, validateUpdateCategory, validateUpdateCategoryStatus } = require('../../../../utils/apiValidation')
const { findAllCategoriesAndCountValidation } = require('../../../../utils/queryValidation')

router.post('/',validateAddCategory, createCategory)
router.get('/all',findAllCategoriesAndCountValidation, findAllCategoriesAndCount)
router.get('/all/pdf',findAllCategoriesAndCountValidation, categoriesAndCountPDF)
router.get('/all/:type',findAllCategoriesAndCountValidation, categoriesAndCountExcelCSV)
router.get('/excel', getExcel)
router.get('/:id', fetchCategory)
router.put('/:id',validateUpdateCategory, updateCategory)
router.put('/updateStatus/:id',validateUpdateCategoryStatus, updateStatus);
router.delete('/:id', deleteCategory)
module.exports = router