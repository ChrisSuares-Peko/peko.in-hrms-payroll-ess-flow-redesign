const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require('puppeteer')
const fs = require('fs')
const {
     create,
     findByPlanId,
     findAllPlansAndCount,
     Delete,
     update,
     find,
     softwarePlansAndCountExport,
} = require('../../models/use-cases/software_plan')
const { fetchSoftwaresList } = require("../../models/use-cases/subscription_plans");
const { fetchPlansBulkUploadTemplate, bulkCreateSoftwarePlans } = require("../../services/plans");
const { findSoftwareByName } = require("../../models/use-cases/softwares");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

exports.createSoftwarePlan = asyncHandler(async (req, res, next) => {
  const data = req.body;
  let isPlanAvailable = await findByPlanId(data.planId);
  if (isPlanAvailable) {
    return next(new ErrorResponse(`Software plan already exists`, 403));
  }
  let result = await create(data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding software plan`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Software plan added successfully",
      data: result,
      responseCode: "000",
    });
  }
});

exports.findAllSoftwarePlansAndCount = asyncHandler(async (req, res, next) => {
  let { searchText, page, itemsPerPage } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
 let sortField = req.query.sortField || 'createdAt'

  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

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
  }
  const productData = await findAllPlansAndCount(params);
  if (!productData) {
    return next(new ErrorResponse(`Something went wrong while getting all softwares plans from database`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: productData ? productData.count : 0,
        recordsFiltered: productData ? productData.count : 0,
        data: productData ? productData.rows : 0,
      },
      message: "Softwares plans fetched successfully",
      responseCode: "000",
    });
  }
});

exports.softwarePlansAndCountExcelCSV = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query
     let { type } = req.params

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await softwarePlansAndCountExport(params)
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

exports.softwarePlansAndCountPDF = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await softwarePlansAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 400))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 400))
     }

     const templateDetails = {
          title: 'Software Plans',
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

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await update(params, data);

  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating status`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.deleteSoftwarePlan = async (req, res, next) => {
  const productCode = req.params.id;
  try {
    const result = await Delete({
      productCode,
    });
    if (result === 1) {
      return res.status(200).json({
        status: true,
        message: "Software plan deleted successfully",
        data: {},
        responseCode: "000",
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "An error occured while deleting the Software plan.",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateSoftwarePlan = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let isPlanAvailable = await findByPlanId(data.planId);
  if (isPlanAvailable && isPlanAvailable.id != params.id) {
    return next(new ErrorResponse(`Software plan already exists`, 403));
  }
  const result = await update(params, data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the software plan`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Software plan updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.fetchSoftwares = asyncHandler(async (req, res, next) => {
  let searchText = req.query.q || "";
  let result = await fetchSoftwaresList(searchText);

  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching specific software`, 200));
  } else {
    return res.status(200).json({
      success: true,
      data: { result },
      message: "Softwares fetched successfully",
      responseCode: "000",
    });
  }
});

exports.getBulkTemplate = asyncHandler(async (req, res) => {
  const planTemplateUrl = await fetchPlansBulkUploadTemplate(req);

  return res.status(200).json({
    status: true,
    message: "Software plan upload template fetched successfully",
    data: { planTemplateUrl },
    responseCode: "000",
  });
});

exports.bulkExcelUploadSoftwarePlan = asyncHandler(async (req, res, next) => {
  let softwaresJsonData = req.body.softwaresJsonData;
  if (softwaresJsonData.length > 10000) {
    return next(new ErrorResponse(`Exceeded maximum limit for bulk upload (10,000 per sheet)`, 500));
  }
  let uploadType = req.body.uploadType;
  let hasErrors = false;
  const results = await Promise.all(
    softwaresJsonData.map(async (obj) => {
      let { software } = obj;
      let isPlanAvailable = await find(obj.name);
      if (isPlanAvailable) {
        obj.status = false;
        obj.errors.push(`${obj.name} is already uploaded`);
      }

      //create vendors array and add to obj
      let softwareDetails = await findSoftwareByName(software);
      if (!softwareDetails) {
        obj.status = false;
        obj.errors.push(`${softwareDetails} software is not available`);
      } else {
        obj.softwareId = softwareDetails.id;
      }

      //get vendor and create obj for product creation
      return obj;
    })
  );
  if (!results) {
    return next(new ErrorResponse(`Something went wrong`, 400));
  }
  for (let i = 0; i < softwaresJsonData.length; i++) {
    const { status, errors } = softwaresJsonData[i];
    if (!status || errors.length > 0) {
      hasErrors = true;
    }
  }
  if (!hasErrors && uploadType == "JSON") {
    //JSON type means it is validated from fronted and sended else it is excel upload
    //we needed to save the products to Db
    let plans = await bulkCreateSoftwarePlans(softwaresJsonData);
    return res.status(200).json({
      status: true,
      message: "Plans added successfully",
      responseCode: "000",
      data: { plans, plansCreated: true },
    });
  } else {
    return res.status(200).json({
      status: true,
      message: "Please review plans",
      responseCode: "000",
      data: { softwaresJsonData, plansCreated: false },
    });
  }
});
