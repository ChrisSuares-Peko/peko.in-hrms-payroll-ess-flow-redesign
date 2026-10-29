/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
const asyncHandler = require("../../middlewares/async");

const puppeteer = require('puppeteer');
const fs = require("fs");

const ErrorResponse = require('../../utils/error-response');
const { findAllESignDocs, findAlleSignsCount, documentsAndCountExport } = require("../../models/use-cases/eSign");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

exports.findAllESignDocsAndCount = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    let searchText = req.query.searchText || '';
    let order = req.query.orderCol || 'DESC';
    let column = parseInt(req.query.column) || 0;
    
    let credentialId = parseInt(req.query.credentialId) || false

    let params = {
        page,
        pageSize,
        searchText,
        order,
        column
    };

    const registrationData = await findAllESignDocs(params, credentialId);

    if (!registrationData) {
        return next(new ErrorResponse(`Something went wrong while getting all details`, 400))
    } else {
        return res.status(200).json({
            status: true,
            data: {
                recordsTotal: registrationData ? registrationData.count : 0,
                rows: registrationData ? registrationData.rows : []
            },
            message: 'Fetched Successfully',
            responseCode: '000'
        });
    }

});

exports.findAllESignAndCount = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    const corporateId = req.query.corporateId || false
    let sortField = req.query.sortField || 'createdAt'
    let params = {
      page,
      itemsPerPage,
      searchText,
      sort,
      sortField,
      corporateId
    };
    const attributes = ['id','createdAt', 'docket_title', 'status']
  
    try {
      const documentData = await findAlleSignsCount(params, attributes);
      return res.status(200).json({
        status: true,
        data: {
          recordsTotal: documentData.count,
          data: documentData.rows
        },
        message: 'eSign Documents Fetched Successfully',
        responseCode: '000'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: {},
        responseCode: '001'
      });
    }
  });

  exports.eSignsAndCountExcelCSV = asyncHandler(async (req, res, next) => {
    let searchText = req.query.searchText || '';
    const {type} = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = {
      searchText,
      sort,
      sortField
    };
  
    try {
      const data = await documentsAndCountExport(params);
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        message: `Something went wrong while generating report`,
        data: {},
        responseCode: '001'
      });
    }
  });

  exports.eSignsAndCountPDF = asyncHandler(async (req, res, next) => {
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = {
      searchText,
      sort,
      sortField
    };
  
    try {
      const data = await documentsAndCountExport(params);
      if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
      } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
      }
      
      const templateDetails = {
        title: 'E-SIGN Report'
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
      console.error(error);
      return res.status(500).json({
        status: false,
        message: `Something went wrong while generating report`,
        data: {},
        responseCode: '001'
      });
    }
  });
