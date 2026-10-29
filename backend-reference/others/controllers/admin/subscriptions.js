const asyncHandler = require("../../middlewares/async");
const { findAndCountAllSubscriptions, subscriptionsExcelCSVData } = require("../../models/use-cases/subscription");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

exports.findAllSubscriptions = asyncHandler(async (req, res) => {

  let { status, page, itemsPerPage, packageType, searchText, from, to,corporateId } = req.query;
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'subscriptionStartDate'

  let registeredBy = req.user.registeredBy

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  let limit = itemsPerPage

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let params = {
    limit,
    offset,
    status,
    packageType,
    searchText,
    from,
    to,
    corporateId,
    sort,
    sortField,
    registeredBy
  }
  try {
    const allSubscriptions = await findAndCountAllSubscriptions(params)

    if (!allSubscriptions) {
      return res.status(500).json({
        status: false,
        message: 'Failed to fetch subscription details',
        data: {},
        responseCode: '001'
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Package details fetched successfully',
      data: {
        ...allSubscriptions,
      },
      responseCode: '000'
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong while fetching purchase history',
      data: {},
      responseCode: '001'
    });
  }

});
exports.subscriptionsGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { status, packageType, searchText, from, to,corporateId } = req.query;
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'subscriptionStartDate'
  const {type} = req.params;
  
  let registeredBy = req.user.registeredBy

  let params = {
    status,
    packageType,
    searchText,
    from,
    to,
    corporateId,
    sort,
    sortField,
    registeredBy
  }
  try {
    const data = await subscriptionsExcelCSVData(params)

    if (!data || data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
    }else{
      const {buffer, fileType} = await generateExcelBufferAndType(data,type)
      return res.status(200).json({
          'status': true,
          'data': {buffer, fileType},
          'message': 'Fetched excel/csv datas successfully',
          'responseCode': '000'
      })
    }


  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong while generating report',
      data: {},
      responseCode: '001'
    });
  }

});
exports.subscriptionsGeneratePDF = asyncHandler(async (req, res, next) => {

  let { status, packageType, searchText, from, to,corporateId } = req.query;
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'id'

  let registeredBy = req.user.registeredBy

  let params = {
    status,
    packageType,
    searchText,
    from,
    to,
    corporateId,
    sort,
    sortField,
    registeredBy
  }
  try {
    const data = await subscriptionsExcelCSVData(params)

    if (!data || data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
    }
    const templateDetails = {
      title: 'Subscriptions Report'
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
        scale: 0.8 ,
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
    });

    console.log('PDF generated successfully!');

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


  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong while generating report',
      data: {},
      responseCode: '001'
    });
  }

});