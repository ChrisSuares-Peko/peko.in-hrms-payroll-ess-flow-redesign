const express = require('express');
const {
     createRoleAndPermissions,
     getInitialpermissions,
     fetchAllRolesAndPermissions,
     updateRoleAndPermissions,
     deleteRoleAndPermissions,
     fetchAllRolesList,
     rolesAndPermissionsPDF,
     rolesAndPermissionsExcelCSV,
     updateStatusRolesAndPermissions,
     updateIsAdminRoleAndPermissions,
} = require('../../../../controllers/admin/roleAndPermissions');
const { fetchAllRolesAndPermissionsValidation, validateUpdateIsAdmin } = require('../../../../utils/queryValidation');
const { requireAdminSystemUser } = require('../../../../utils/jwtToken');
const router = express.Router()

//create role
router.post('/', requireAdminSystemUser, createRoleAndPermissions);//✅

router.put('/:roleId', updateRoleAndPermissions);

router.put("/update-status/:id", requireAdminSystemUser, updateStatusRolesAndPermissions);

// Staging only: the is-admin toggle skips the F-OTH-04 admin check so admin roles can be
// switched on/off from the UI while testing. Every other environment keeps the check.
const adminCheckExceptStaging = process.env.NODE_ENV?.trim() === 'staging'
    ? (req, res, next) => next()
    : requireAdminSystemUser;

router.patch("/:id/is-admin", adminCheckExceptStaging, validateUpdateIsAdmin, updateIsAdminRoleAndPermissions);

router.delete('/:roleId', requireAdminSystemUser, deleteRoleAndPermissions);


//initial permissions
router.get('/initial-roles', getInitialpermissions);//✅

//fetch all roles
router.get('/',fetchAllRolesAndPermissionsValidation, fetchAllRolesAndPermissions);//✅
router.get('/list', fetchAllRolesList);//✅
router.get('/pdf',fetchAllRolesAndPermissionsValidation, rolesAndPermissionsPDF)//✅
router.get('/:type',fetchAllRolesAndPermissionsValidation, rolesAndPermissionsExcelCSV)//✅

module.exports = router