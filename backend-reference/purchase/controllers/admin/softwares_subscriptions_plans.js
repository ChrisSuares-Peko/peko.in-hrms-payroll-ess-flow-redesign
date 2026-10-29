const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const fs = require("fs");

const { create, update, findAll, softwareSubscriptionPlansAndCountExport, delete: deletePlan } = require("../../models/use-cases/softwares_subscriptions_plans");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { customLog } = require("../../utils/loggerHelper");

exports.createSoftwareSubscriptionPlan = asyncHandler(async (req, res, next) => {
  const data = req.body;

  let result = await create(data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding Email or Domain plan`, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Email or Domain plan added successfully",
      data: result,
      responseCode: "000",
    });
  }
});

exports.findAllSoftwareSubscriptionPlansAndCount = asyncHandler(async (req, res, next) => {
  let { searchText, page, itemsPerPage } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

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
    isAdmin: true,
  };

  const status = false; // false will give you whole list and true will give only active software subscription plans
  const plansData = await findAll(params, status);
  if (!plansData) {
    return next(new ErrorResponse(`Something went wrong while getting all Email or Domain plans`, 400));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: plansData ? plansData.count : 0,
        recordsFiltered: plansData ? plansData.count : 0,
        data: plansData ? plansData.rows : 0,
      },
      message: "Email or Domain plans fetched successfully",
      responseCode: "000",
    });
  }
});

exports.updateSoftwareSubscriptionPlan = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  const result = await update(params, data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the Email or Domain plan`, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Email or Domain plan updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.updatePlanStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await update(params, data);

  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating Email or Domain plan status`, 400));
  } else {
    return res.status(200).json({
      status: true,
      message: "Email or Domain plan status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.softwareSubscriptionPlansAndCountExcelCSV = asyncHandler(async (req, res, next) => {
  let { searchText } = req.query;
  let { type } = req.params;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || 'createdAt'

  let params = {
    searchText,
    sort,
    sortField,
  };
  const data = await softwareSubscriptionPlansAndCountExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  } else {
    const {buffer, fileType} = await generateExcelBufferAndType(data,type)
    return res.status(200).json({
        'status': true,
        'data': {buffer, fileType},
        'message': 'Fetched excel/csv datas successfully',
        'responseCode': '000'
    })
  }
});

exports.softwareSubscriptionPlansAndCountPDF = asyncHandler(async (req, res, next) => {
  let { searchText } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || 'createdAt'

  let params = {
    searchText,
    sort,
    sortField,
  };
  const data = await softwareSubscriptionPlansAndCountExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 400))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 400))
  }
    
  const templateDetails = {
    title: 'Business Emails Plans'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
  let random = new Date().valueOf();

  // Create a browser instance with Puppeteer
  const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Set content to the page
  await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

  // Generate PDF using Puppeteer
  const outputFile = `report-${random}.pdf`;
  await page.pdf({
      scale: 0.6,
      path: outputFile,
      format: 'A4',
      preferCSSPageSize: true
  });

  const buffer = fs.readFileSync(outputFile);

  browser.close();

  fs.unlinkSync(outputFile);

  return res.status(200).json({
      status: true,
      message: 'report generated successfully.',
      data: {
          buffer,
          fileType: 'application/pdf'
      },
      responseCode: '000'
  });
});

exports.deleteSoftwareSubscriptionPlan = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await deletePlan({
      id,
    });
    if (result === 1) {
      return res.status(200).json({
        status: true,
        message: "Email or Domain plan deleted successfully",
        data: {},
        responseCode: "000",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "An error occured while deleting the Email or Domain plan.",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "🚀 ~ exports.deleteSoftwareSubscriptionPlan ~ error: " + error })
    return res.status(500).json({
      status: false,
      message: "An error occured while deleting the Email or Domain plan.",
      data: {},
      responseCode: "001",
    });
  }
};