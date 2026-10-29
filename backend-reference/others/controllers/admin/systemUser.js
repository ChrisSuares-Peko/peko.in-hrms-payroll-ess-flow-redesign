const {
  update,
  create,
  deleteOne,
  findAllAndCount,
  findOne,
  // find,
  createResendMail,
  systemUserExports,
  updateSystemUserStatus,
  createPartner,
  updatePartner,
  findpartnerAndPermissionDetails,
} = require("../../models/use-cases/systemUser");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { findOneWallets } = require("../../models/use-cases/wallets");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const puppeteer = require('puppeteer')
const fs = require('fs');
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const {  findByAnyField } = require('../../models/use-cases/credential');
const { findRoleById,findRoleByName } = require('../../models/use-cases/roleAndPermissions');
const { resolvePartnerScope } = require('../../utils/partnerScope');
exports.createSystemUser = asyncHandler(async (req, res, next) => {
  let data = req.body
  // F-OTH-06: a partner-scoped admin could set registeredBy (or omit it) to create a system
  // user outside their own tenant — including an unscoped "global" admin. If the caller is
  // locked to a partner, their own partner id always wins over whatever the body sent; a
  // true platform-level caller (not locked to any partner) may still assign one explicitly.
  const scope = resolvePartnerScope(req);
  if (scope.locked) {
    data.registeredBy = scope.partnerId;
  }
  let {email, username, roleAndPermissionId } = data
  let isEmailAvailable = await findByAnyField({ email })
  if (isEmailAvailable) {
      return next(new ErrorResponse(`The email address is already associated with another account`, 400))
  }
  let isUsernameAvailable = await findByAnyField({ username })
  if (isUsernameAvailable) {
      return next(new ErrorResponse(`The username is already associated with another account`, 400))
  }

  let rolesDetails = await findRoleById(roleAndPermissionId)
  let result = await create(data, rolesDetails, req)
  if (!result) {
      return next(new ErrorResponse(`Something went wrong while adding system user`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'message': 'System user added successfully',
          'data': result,
          'responseCode': '000'
      })
  }
})

exports.findOneSystemUser = asyncHandler(async (req, res, next) => {
  const params = req.params;
  let corporateId = params.id;

  const result = await findOne(params);

  let walletAttribute = ["balance"];
  let credentialAttribute = ["username", "name"];
  const wallet = await findOneWallets(corporateId, walletAttribute, credentialAttribute);

  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching specific system user`, 500));
  } else {
    const mergedData = { ...result.dataValues,mobileNo: result.mobileNo,email: result.email, ...wallet };
    return res.status(200).json({
      status: true,
      data: mergedData,
      message: "Profile details fetched successfully",
      responseCode: "000",
    });
  }
});

exports.resendEmail = asyncHandler(async (req, res, next) => {
  const result = await createResendMail(req.params, req);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while Re sending the mail`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Mail delivered successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.deleteSystemUser = asyncHandler(async (req, res, next) => {
  let params = req.params;
  const result = await deleteOne(params);
  if (!result) {
    return next(new ErrorResponse(`User not found`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "System User deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.findAllSystemUserAndCount = asyncHandler(async (req, res, next) => {
  let userId = req.user.id;
  let { searchText, page, itemsPerPage,userType } = req.query;
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || 'createdAt'  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

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
       sortField,
       userId,
       userType
  }
  const systemUserData = await findAllAndCount(params);
  if (!systemUserData) {
    return next(new ErrorResponse(`Something went wrong while getting all system from DB`, 400));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: systemUserData.count,
        recordsFiltered: systemUserData.count,
        data: systemUserData,
      },
      message: "Fetched all system users successfully",
      responseCode: "000",
    });
  }
});

exports.systemUserExcelCSV = asyncHandler(async (req, res, next) => {
     let userId = req.user.id
     let { searchText, userType } = req.query
     const { type } = req.params
     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'
     let params = {
          searchText,
          sort,
          sortField,
          userId,
          userType
     }
     const data = await systemUserExports(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
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
})
exports.systemUserPDF = asyncHandler(async (req, res, next) => {
     let userId = req.user.id
     let { searchText,userType } = req.query
     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'
     let params = {
          searchText,
          sort,
          sortField,
          userId,
          userType
     }
     const data = await systemUserExports(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }
     const templateDetails = {
          title: 'System Users Report',
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
          scale: 0.6,
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
})

exports.updateSystemUser = asyncHandler(async (req, res, next) => {
  let params = req.params
  
  let data = req.body
  let { email, username } = data
  // Exclude the edited user (URL :id = target credentialId), never the body's
  // userId — that was the logged-in admin's id and caused the wrong target.
  const targetCredentialId = params.id
  let isEmailAvailable = await findByAnyField({ email })
  if (isEmailAvailable && isEmailAvailable.id != targetCredentialId) {
      return next(new ErrorResponse(`The email address is already associated with another account`, 400))
  }
  let isUsernameAvailable = await findByAnyField({ username })
  if (isUsernameAvailable && isUsernameAvailable.id != targetCredentialId) {
      return next(new ErrorResponse(`The username is already associated with another account`, 400))
  }

  let result = await update(params, data);
  if (!result) {
      return next(new ErrorResponse(`Something went wrong while updating system user`, 400))
  } else {
      return res.status(200).json({
          'status': true,
          'message': 'System user updated successfully',
          'data': { result },
          'responseCode': '000'
      })
  }
})


exports.updateSystemUserStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await updateSystemUserStatus(params, data)
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating status`, 200));
  } else {
    return res.status(200).json({
      success: true,
      message: "status updated successfully",
      data: "Updated successfully",
    });
  }
});

exports.createSystemPartner= asyncHandler(async (req, res, next) => {
  let data = req.body
  let {userDetails,permissions}= req.body;
   let isEmailAvailable = await findByAnyField({ email:userDetails.email })
  if (isEmailAvailable) {
      return next(new ErrorResponse(`The email address is already associated with another account`, 400))
  }
  let isUsernameAvailable = await findByAnyField({ username:userDetails.username })
  if (isUsernameAvailable) {
      return next(new ErrorResponse(`The username is already associated with another account`, 400))
  }

  let rolesDetails = await findRoleByName({userType:"PARTNER"})
  if (!rolesDetails || !rolesDetails.id) {
      return next(new ErrorResponse(`Partner role not found. Please ensure the role exists in the system.`, 400))
  }
  
  let result = await createPartner({params:data, userDetails,permissions,rolesDetails}, req)
  if (!result) {
      return next(new ErrorResponse(`Something went wrong while adding system user`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'message': 'Partner user added successfully',
          'data': result,
          'responseCode': '000'
      })
  }
})

exports.updateSystemPartner = asyncHandler(async (req, res, next) => {
  let params = req.params
  let {id} = params
  let {userDetails,permissions}= req.body;
  // let data = req.body

  let {email, username } = userDetails
  let isEmailAvailable = await findByAnyField({ email })
  if (isEmailAvailable && isEmailAvailable.id != id) {
      return next(new ErrorResponse(`The email address is already associated with another account`, 400))
  }
  let isUsernameAvailable = await findByAnyField({ username })
  if (isUsernameAvailable && isUsernameAvailable.id != id) {
      return next(new ErrorResponse(`The username is already associated with another account`, 400))
  }
  // let result = await createPartner({params:data, userDetails,permissions,rolesDetails}, req)
  let result = await updatePartner({params, userDetails,permissions});
  if (!result) {
      return result;
      // return next(new ErrorResponse(`Something went wrong while updating system user`, 400))
  } else {
      return res.status(200).json({
          'status': true,
          'message': 'Partner user updated successfully',
          'data': { result },
          'responseCode': '000'
      })
  }
})

exports.findOnePartnerUser = asyncHandler(async (req, res, next) => {
  const params = req.params
  const result = await findpartnerAndPermissionDetails({id:params.id})
  if (!result) {
      return next(new ErrorResponse(`Something went wrong while fetching specific system user`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': result,
          'message': 'Partner and permission details fetched successfully',
          'responseCode': '000'
      })
  }
})
