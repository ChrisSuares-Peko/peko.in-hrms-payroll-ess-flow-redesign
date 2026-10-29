const express = require('express');
const router = express.Router();
const { createDepartment, getAllDepartment, deleteDepartment, editDepartment, getDepartment } = require('../controller/department');
const { validateDepartmentCreate, validateDepartmentUpdate } = require('../utils/apiValidation');

router.post('/',validateDepartmentCreate, createDepartment)
router.get('/', getAllDepartment)
router.delete('/:id', deleteDepartment)
router.put('/:id',validateDepartmentUpdate, editDepartment)

//get only the department name and id
router.get('/all',getDepartment);

module.exports = router;
