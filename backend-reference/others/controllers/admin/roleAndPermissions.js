const asyncHandler = require("../../middlewares/async");
const {
     findRole,
     createRole,
     findAllRolesAndCount,
     deleteRole,
     updateRole,
     findAllRolesForSelection,
     findAdminRoles,
     rolesAndPermissionsExports,
} = require('../../models/use-cases/roleAndPermissions')
const { findByRole } = require("../../models/use-cases/systemUser");
const ErrorResponse = require("../../utils/error-response");

const puppeteer = require('puppeteer')
const fs = require('fs');
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { getInitialServicePermission } = require("../../models/use-cases/setting");

exports.createRoleAndPermissions = asyncHandler(async (req, res, next) => {
    try {
        const rolesAndPermissions = req.body;
        rolesAndPermissions.roleName = rolesAndPermissions.roleName.toLowerCase()
        rolesAndPermissions.userType = rolesAndPermissions.userType==="system_user" ? 'SYSTEMUSER':'PARTNER'
        delete rolesAndPermissions.userType;
        let isRoleExist = await findRole(rolesAndPermissions.roleName);

        if (isRoleExist) {
            return next(new ErrorResponse(`Role name is already exists`, 400))
        }

        const result = await createRole(rolesAndPermissions);
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while adding role`, 400))
        } else {
            return res.status(200).json({
                'status': true,
                'message': 'Role added successfully',
                'data': result,
                'responseCode': '000'
            })
        }

    } catch (error) {
        return res.status(400).json({
            status: false,
            data: {},
            message: 'something went wrong while create role',
            responseCode: '001'
        })
    }
})

// Update role and permissions
exports.updateRoleAndPermissions = asyncHandler(async (req, res, next) => {
    try {
        const roleId = req.params.roleId;
        const body = req.body;
        const roleName = body.roleName ? body.roleName.toLowerCase() : undefined;

        if (roleName) {
            let isRoleExist = await findRole(roleName);
            if (isRoleExist && isRoleExist.id !== parseInt(roleId)) {
                return next(new ErrorResponse(`Role name is already exists`, 400))
            }
        }

        const updatedRoleData = {};
        if (roleName !== undefined) updatedRoleData.roleName = roleName;
        if (body.permissions !== undefined) updatedRoleData.permissions = body.permissions;
        if (body.status !== undefined) updatedRoleData.status = body.status;

        const updatedRole = await updateRole(roleId, updatedRoleData);

        // Check if the role exists and updated successfully
        if (!updatedRole) {
            return next(new ErrorResponse(`Role with ID ${roleId} not found`, 404));
        }

        // Return success response
        return res.status(200).json({
            status: true,
            message: 'Role updated successfully',
            data: updatedRole,
            responseCode: '000'
        });
    } catch (error) {
        // Handle error
        return next(new ErrorResponse('Failed to update role', 400));
    }
});


// Delete role and permissions
exports.deleteRoleAndPermissions = asyncHandler(async (req, res, next) => {
    const roleId = req.params.roleId;

    try {
        //check weather any system used is assigned to this role 
        let existingUsers = await findByRole(roleId);
        if (!existingUsers || existingUsers.length > 0) {
            return next(new ErrorResponse(`Cannot delete this role, ${existingUsers.length} users are assigned to this role`, 400));
        }

        // Call the deleteRole function from the use case
        const deletedRole = await deleteRole(roleId);

        if (!deletedRole) {
            return next(new ErrorResponse(`Role with ID ${roleId} not found`, 404));
        }

        return res.status(200).json({
            status: true,
            message: 'Role deleted successfully',
            data: deletedRole,
            responseCode: '000'
        });
    } catch (error) {
        // Handle error
        return next(new ErrorResponse('Failed to delete role', 400));
    }
});


exports.getInitialpermissions = asyncHandler(async (req, res) => {
    try {
        const permissions = await getInitialServicePermission();
        return res.status(200).json({
            status: true,
            data: {  isAdmin: true ,permissions },
            message: 'Fetched initial permissions successfully',
            responseCode: '000'
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            data: {},
            message: 'something went wrong.',
            responseCode: '001'
        })
    }
})

//fetch all  roles and permissions
exports.fetchAllRolesAndPermissions = asyncHandler(async (req, res, next) => {

    try {

        let { searchText, page, itemsPerPage } = req.query;

        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
        let sortField = req.query.sortField || 'createdAt'
        // Parse page and itemsPerPage to integers (you can also use parseInt)
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
        let limit = itemsPerPage

        // Calculate offset based on page and itemsPerPage
        let offset;
        if (page && itemsPerPage) {
            offset = (page - 1) * itemsPerPage;
        }

        let params = {
            limit,
            offset,
            searchText,
            sort,
            sortField
        }

        const rolesAndPermissions = await findAllRolesAndCount(params);
        if (!rolesAndPermissions) {
            return next(new ErrorResponse(`Something went wrong while getting all roles and permissions`, 400))
        } else {
            return res.status(200).json({
                'status': true,
                'data': rolesAndPermissions,
                'message': 'All roles and permissions Fetched successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
})

exports.rolesAndPermissionsExcelCSV = asyncHandler(async (req, res, next) => {
    try {
        let { searchText } = req.query
        const { type } = req.params
        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
        let sortField = req.query.sortField || 'createdAt'

        let params = {
            searchText,
            sort,
            sortField,
        }

          const data = await rolesAndPermissionsExports(params)
         if (!data || data.length < 1) {
             return next(new ErrorResponse(`No data is available for export`, 500))
         } else {
               const { buffer, fileType } = await generateExcelBufferAndType(data, type)
               return res.status(200).json({
                    status: true,
                    data: { buffer, fileType },
                    message: 'Fetched excel/csv datas successfully',
                    responseCode: '000',
               })
          }
     } catch (error) {
          next(new ErrorResponse(error.message, 500))
     }
})
exports.rolesAndPermissionsPDF = asyncHandler(async (req, res, next) => {
    try {
        let { searchText } = req.query
        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
        let sortField = req.query.sortField || 'createdAt'

        let params = {
            searchText,
            sort,
            sortField,
        }

          const data = await rolesAndPermissionsExports(params)
         if (!data || data.length < 1) {
             return next(new ErrorResponse(`No data is available for export`, 404))
         }
          const templateDetails = {
               title: 'Roles Report',
          }
          const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails)
          let random = new Date().valueOf()

        // Create a browser instance with Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        const page = await browser.newPage()

        // Set content to the page
        await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })

        // Generate PDF using Puppeteer
        const outputFile = `report-${random}.pdf`
        await page.pdf({
            path: outputFile,
            format: 'A4',
            preferCSSPageSize: true,
        })

        console.log('PDF generated successfully!')

        const buffer = fs.readFileSync(outputFile)

        browser.close()

        fs.unlinkSync(outputFile)

        return res.status(200).json({
            status: true,
            message: 'report generated successfully.',
            data: {
                buffer,
                fileType: 'application/pdf',
            },
            responseCode: '000',
        })
    } catch (error) {
        next(new ErrorResponse(error.message, 500))
    }
})

exports.fetchAllRolesList = asyncHandler(async (req, res) => {
    const userType= req.query.userType;
    let roles = await findAllRolesForSelection(userType)

    return res.status(200).json({
        'status': true,
        'message': 'Roles fetched successfully',
        'data': { roles },
        'responseCode': '000'
    })
})

exports.updateStatusRolesAndPermissions =asyncHandler(async(req,res,next)=>{
    let roleId = req.params.id
    let result = await updateRole(roleId, { status: req.body.status });
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 400))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'status updated successfully',
            'data': 'Updated successfully'
        })
    }
})
exports.updateIsAdminRoleAndPermissions = asyncHandler(async (req, res, next) => {
    const roleId = req.params.id;

    if (String(roleId) === '0') {
        const roles = await findAdminRoles();
        return res.status(200).json({
            status: true,
            message: 'Admin roles fetched successfully',
            data: roles,
            responseCode: '000',
        });
    }

    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') {
        return next(new ErrorResponse('isAdmin must be a boolean value', 400));
    }
    const result = await updateRole(roleId, { isAdmin });
    if (!result) {
        return next(new ErrorResponse('Something went wrong while updating isAdmin', 400));
    }
    return res.status(200).json({
        status: true,
        message: `Role isAdmin set to ${isAdmin} successfully`,
        data: {},
        responseCode: '000',
    });
});
