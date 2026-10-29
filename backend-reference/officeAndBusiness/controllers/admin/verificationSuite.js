const asyncHandler = require("../../middlewares/async");
const {  verificationTransactionsExcelCSV, findAllRecordsOrderListAndCountForAdmin } = require("../../models/use-cases/verificationSuite");
const { findAllVerificationRecordsAndCountForAdmin, getVerificationRecordsReportForAdmin } = require("../../models/use-cases/nupayVerificationRecord");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { customLog } = require("../../utils/loggerHelper");

// New verification-records-table-backed equivalent of findAllRecordsOrderListAndCountForAdmin below -
// that one stays untouched (still reads from transaction/order) since other things may still depend
// on it; this is what the admin /verification-history route now points to.
exports.getVerificationHistoryForAdmin = asyncHandler(async (req, res, next) => {
  try {
    let {
      searchText,
      page,
      itemsPerPage,
      from,
      to,
      status
    } = req.query
    let registeredBy = req.user.registeredBy

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let column = 'createdAt'
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let params = {
      limit,
      offset,
      searchText,
      sort,
      column,
      from,
      to,
      status,
      registeredBy
    }

    const data = await findAllVerificationRecordsAndCountForAdmin(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all records from database`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          'data': data ? data.rows : 0,
          'recordsTotal': data ? data.count : 0,
        },
        'message': 'All records fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    console.log(error)
    next(new ErrorResponse(error.message, 500));
  }
})

exports.findAllRecordsOrderListAndCountForAdmin = asyncHandler(async (req, res, next) => {
  try {
    let {
      searchText,
      page,
      itemsPerPage,
      from,
      to,
      status
    } = req.query
    let registeredBy = req.user.registeredBy

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let column = 'createdAt'
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage
 

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let subCorporateUserId
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      subCorporateUserId = req.user.subCorporateId;
    }

    let params = {
      limit,
      offset,
      searchText,
      sort,
      column,
      subCorporateUserId,
      from,
      to,
      status,
      registeredBy
    }

    const data = await findAllRecordsOrderListAndCountForAdmin(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all records from database`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          'data': data ? data.rows : 0,
          'recordsTotal': data ? data.count : 0,
        },
        'message': 'All records fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    console.log(error)
    next(new ErrorResponse(error.message, 500));
  }
})

exports.verificationGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { from, to, searchText,status } = req.query;
  const {type} = req.params
  let registeredBy = req.user.registeredBy


   const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
   let sortField = req.query.sortField || 'createdAt'

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      status,
      registeredBy
  }
  const data = await verificationTransactionsExcelCSV(params);
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
})

exports.verificationGeneratePDF = asyncHandler(async (req, res, next) => {


  let { from, to, searchText,status } = req.query;

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  let sortField = req.query.sortField || 'createdAt'
  let registeredBy = req.user.registeredBy

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      status,
      registeredBy
  }
 
  const data = await verificationTransactionsExcelCSV(params);
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
      title: 'Verifications Report'
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
      scale: 0.7 ,
      path: outputFile,
      format: 'A4',
      preferCSSPageSize: true
  });

  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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

// New verification-records-table-backed equivalents of verificationGenerateExcelCSV/verificationGeneratePDF
// above - those stay untouched (still read from transaction/order); these are what the admin
// /verification-history/:type and /verification-history/pdf routes now point to.
exports.getVerificationExcelCSVForAdmin = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, status } = req.query;
  const { type } = req.params
  let registeredBy = req.user.registeredBy


  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'createdAt'

  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
    status,
    registeredBy
  }
  const data = await getVerificationRecordsReportForAdmin(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
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

exports.getVerificationPDFForAdmin = asyncHandler(async (req, res, next) => {


  let { from, to, searchText, status } = req.query;

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  let sortField = req.query.sortField || 'createdAt'
  let registeredBy = req.user.registeredBy

  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
    status,
    registeredBy
  }

  const data = await getVerificationRecordsReportForAdmin(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
    title: 'Verifications Report'
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
    scale: 0.7,
    path: outputFile,
    format: 'A4',
    preferCSSPageSize: true
  });

  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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