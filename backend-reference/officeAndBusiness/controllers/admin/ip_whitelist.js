const asyncHandler = require("../../middlewares/async");
const {
  findAllIps,
  update,
  create,
  findOne,
  deleteIP,
  ipWhitelistAndCountExport
} = require("../../models/use-cases/ip_whitelist");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { customLog } = require("../../utils/loggerHelper");
exports.findAllWhitelistedIP = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
  let searchText = req.query.searchText || "";
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
const partnerId=req.query.partnerId
  let params = {
    page,
    itemsPerPage,
    searchText,
    sort,
    sortField,
    partnerId
  };

  const result = await findAllIps(params);
 

  if (!result) {
    return next(
      new ErrorResponse(
        `Something went wrong while getting all registrations`,
        400
      )
    );
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: result ? result.count : 0,
        rows: result ? result.rows : [],
      },
      message: "Fetched Successfully",
      responseCode: "000",
    });
  }
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let result = await update(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating status`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});
exports.deleteip = asyncHandler(async (req, res, next) => {
  try {
    let params = req.params
    let result = await deleteIP(params);
    if(!result){
      return next(new ErrorResponse(`Something went wrong while deleting ip`, 500))
    }else{
    return res.status(200).json({
      status: true,
      message: "ip deleted successfully",
      data: {},
      responseCode: '000'
    });
  }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse(`ip found`, 404));
  }
});
exports.updateIP = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  if(data.partnerId === 'default'){
    data.partnerId=null
  }
  let result = await update(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating status`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.whitelistIp = asyncHandler(async (req, res, next) => {
    const data = req.body;

    const isExist = await findOne({ip:data.ip});

    if (isExist) {
        return next(new ErrorResponse(`IP already whitelisted`, 403))
    }
    if(data.partnerId === 'default'){
      data.partnerId=null
    }
    let result = await create(data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding the ip`, 500))
    } else {
        return res.status(200).json({
            status: true,
            data: result,
            message: 'Ip whitelisted successfully',
            responseCode: '000'
        })
    }

})
exports.ipWhitelistAndCountExcelCSV = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
  let searchText = req.query.searchText || "";
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  const {type} = req.params;
  const partnerId=req.query.partnerId
  let params = {
    page,
    itemsPerPage,
    searchText,
    sort,
    sortField,
    partnerId
  };

  const data = await ipWhitelistAndCountExport(params);
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
exports.ipWhitelistAndCountPDF = asyncHandler(async (req, res, next) => {
  const pg = parseInt(req.query.page) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
  let searchText = req.query.searchText || "";
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  const partnerId=req.query.partnerId
  let params = {
    page:pg,
    itemsPerPage,
    searchText,
    sort,
    sortField,
    partnerId
  };

  const data = await ipWhitelistAndCountExport(params);
  if (!data) {
  return next(new ErrorResponse(`Something went wrong while generating report`, 400))
} else if (data.length < 1) {
  return next(new ErrorResponse(`No data is available for export`, 400))
  }
  
  const templateDetails = {
      title: 'IP Whitelists'
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
      scale: 0.7,
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