const asyncHandler = require("../../middlewares/async");
const {
  findHikeByName,
  createHike,
  findAllHikesAndCount,
  updateHike,
  getExcelCSVData,
} = require("../../models/use-cases/hike");
const { uploadFile } = require("../../utils/commonUploadFile");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { default: puppeteer } = require("puppeteer");
const fs = require("fs");

exports.createHike = asyncHandler(async (req, res, next) => {
  const data = req.body;
  if (data.credentialId === 'default') {
    data.credentialId = null;
}
  let isHikeAvailable = await findHikeByName(data.name,data.credentialId);
  if (isHikeAvailable.success) {
    return next(new ErrorResponse(`Hike already exists`, 403));
  }

  const filePath = `hikes`;

  if (data.logoBase && data.logoFormat) {
    const logoUrl = await uploadFile(
      data.logoBase,
      filePath,
      data.logoFormat
    );
    if (!logoUrl) {
      return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
    }
    data.logo = logoUrl;
  }

  if (data.partnersBase && data.partnersFormat) {
    const partnersUrl = await uploadFile(
      data.partnersBase,
      filePath,
      data.partnersFormat
    );
    if (!partnersUrl) {
      return next(new ErrorResponse(`Something went wrong while uploading partners`, 500));
    }
    data.partners = partnersUrl;
  }

  let result = await createHike(data);
  if (!result.success) {
    return next(
      new ErrorResponse(`Something went wrong while adding hike`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "Hike added successfully",
      data: result.data,
      responseCode: "000",
    });
  }
});

exports.findAllHikes = asyncHandler(async (req, res, next) => {
  const { searchText, page = 1, itemsPerPage = 10,partnerId } = req.query;
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = req.query.sortField || "createdAt";
  const hikes = await findAllHikesAndCount({
    searchText,
    page: parseInt(page),
    itemsPerPage: parseInt(itemsPerPage),
    sort,
    sortField,
    partnerId,
    isAdmin: true
  });
  if (!hikes.success) {
    return next(
      new ErrorResponse(`Something went wrong while fetching hikes`, 500)
    );
  }
  return res.status(200).json({
    status: true,
    message: "Hikes fetched successfully",
    data: hikes.data,
    responseCode: "000",
  });
});

exports.updateHike = asyncHandler(async (req, res, next) => {
  const data = req.body;
  if (!data.credentialId || data.credentialId === "default") {
    data.credentialId = null;
  }
  const hikeId = req.params.id;

  const filePath = `hikes`;

  if (data.logoBase && data.logoFormat) {
    const logoUrl = await uploadFile(
      data.logoBase,
      filePath,
      data.logoFormat
    );
    if (!logoUrl) {
      return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
    }
    data.logo = logoUrl;
  }


  if (data.partnersBase && data.partnersFormat) {
    const partnersUrl = await uploadFile(
      data.partnersBase,
      filePath,
      data.partnersFormat
    );
    if (!partnersUrl) {
      return next(new ErrorResponse(`Something went wrong while uploading partners`, 500));
    }
    data.partners = partnersUrl;
  }

  const hike = await updateHike(hikeId, data);
  if (!hike.success) {
    return next(
      new ErrorResponse(`Something went wrong while updating hike`, 500)
    );
  }
  return res.status(200).json({
    status: true,
    message: "Hike updated successfully",
    data: hike.data,
    responseCode: "000",
  });
});

exports.generatePDF = asyncHandler(async (req, res, next) => {
  let { searchText,partnerId } = req.query;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  const attributes = ["id","createdAt","name","features","planType","amount","logo","partners","salaryAmount","salaryValidation","commissionMode","commissionType","commission","fixedCommissionPerTransaction","isCommissionInclGST","status","credentialId"];
  let params = {
    searchText,
    sort,
    sortField,
    partnerId,
    attributes
  };

  let data = await getExcelCSVData(params)
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length == 0) {
    return next(new ErrorResponse(`No data is available for export`, 409))
  }
  const templateDetails = {
    title: 'Hike'
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
    scale: 0.2,
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

exports.getExcel = asyncHandler(async (req, res, next) => {
  let { searchText, partnerId  } = req.query;
  const { type } = req.params;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  const attributes = ["id","createdAt","name","features","planType","amount","logo","partners","salaryAmount","salaryValidation","commissionMode","commissionType","commission","fixedCommissionPerTransaction","isCommissionInclGST","status","credentialId"];
  let params = {
    searchText,
    sort,
    sortField,
    partnerId,
    attributes
  };

  let data = await getExcelCSVData(params)
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length == 0) {
    return next(new ErrorResponse(`No data is available for export`, 409))
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