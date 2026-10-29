const asyncHandler = require("../../middlewares/async");
const {
  fetchAllWorksPlan,
  create,
  update,
  Delete,
  workPlansExport,
} = require("../../models/use-cases/works_plan");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require("puppeteer");
const fs = require("fs");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

exports.findAllWorkPlans = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, page, itemsPerPage, partnerId } = req.query;

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
      from,
      to,
      searchText,
      sort,
      limit,
      offset,
      sortField,
      partnerId,
      isAdmin: true
  }

  const plans = await fetchAllWorksPlan(params, ['createdAt', 'id', 'name', 'description', 'price', 'billingCycle', 'features', 'status', 'workId', 'popular', 'commissionMode', 'commissionType', 'commission', 'fixedCommissionPerTransaction', 'isCommissionInclGST'])

  if (!plans) {
      return next(new ErrorResponse(`Something went wrong while getting work plan`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'message': 'Work plans fetched successfully',
          'data': plans,
          'responseCode': '000'
      })
  }
})
exports.workPlansExcelCSV = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, partnerId} = req.query;
  const { type } = req.params;

  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'createdAt'

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      partnerId
  }

  const data = await workPlansExport(params, ['createdAt', 'name', 'price', 'status'])

  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 400))
  } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 400))
  } else {
      const { buffer, fileType } = await generateExcelBufferAndType(data, type)
      return res.status(200).json({
          'status': true,
          'data': { buffer, fileType },
          'message': 'Fetched excel/csv datas successfully',
          'responseCode': '000'
      })
  }
})
exports.workPlansPDF = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, partnerId } = req.query;

  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'createdAt'

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      partnerId
  }

  const data = await workPlansExport(params, ['createdAt', 'name', 'price', 'status'])

  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 400))
  } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 400))
  }

  const templateDetails = {
      title: 'Work Plans'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
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
})

exports.createWorkPlan = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    const result = await create(data);

    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while adding works plan`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: result,
        message: "Work plan added successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateWorkPlan = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    let params = req.params;
    const result = await update(data, params);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while updating work plan`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: { result },
        message: "Work plan updated successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateWorkPlanStatus = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    let params = req.params;
    const result = await update(data, params);
    if (!result) {
      return next(
        new ErrorResponse(
          `Something went wrong while updating status of work plan`,
          500
        )
      );
    } else {
      return res.status(200).json({
        status: true,
        data: { result },
        message: "Work plan status updated successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.deleteWorkPlan = asyncHandler(async (req, res, next) => {
  let params = req.params;
  const result = await Delete(params);
  if (!result) {
    return next(
      new ErrorResponse(
        `Something went wrong while deleting the work plan`,
        500
      )
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Work plan deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});
