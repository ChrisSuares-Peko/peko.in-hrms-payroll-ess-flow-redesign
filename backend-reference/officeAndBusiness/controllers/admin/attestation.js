const asyncHandler = require('../../middlewares/async');
const { findAllAttestationCount, updateAttestation, getExcelCSVData, createAttestationCategory, updateAttestationCategory, deleteAttestationCategory, findAllAttestationCategoriesUseCase, findAllAttestationCategoriesExport } = require('../../models/use-cases/attestation');
let sequelizeConfig = require('../../configs/database/index');
const ErrorResponse = require('../../utils/error-response');
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { uploadFile } = require('../../utils/commonUploadFile');

exports.findAllAttestationAndCount = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage, from, to,partnerId} = req.query;
    // let corporateId = req.user.id

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

    const registeredBy = req.user.registeredBy
    const subPartnerId = req.user.subPartnerId

    let params = {
        from, 
        to, 
        limit,
        offset,
        searchText,
        sort,
        sortField,
        partnerId,
        subPartnerId,
        registeredBy
    }
    const attestationData = await findAllAttestationCount(params);

    if (!attestationData) {
        return next(new ErrorResponse(`Something went wrong while getting all attestation from DB`, 500))

    } else {
        return res.status(200).json({
            'status': true,
            'data' : {
                'recordsTotal': attestationData ? attestationData.count : 0,
                'recordsFiltered': attestationData ? attestationData.count : 0,
                'data': attestationData ? attestationData.rows : 0 
            },
            'message' : 'Attestation fetched successfully.',
            'responseCode' : '000'
        })
    }
});


exports.getTransctionDetails = asyncHandler(async (req, res) => {
     const rowId = req.params.id
     const query = `
        SELECT *
        FROM reportAll
        WHERE JSON_EXTRACT(orderResponse, '$.attestationDetails.id') = ${rowId}
    `
     const result = await sequelizeConfig.query(query, {
          type: sequelizeConfig.QueryTypes.SELECT,
     })

     res.status(200).json(result[0])
})

exports.getExcel = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = 'createdAt'

    let credentialAttribute = ['name','username', "id"]
    let transactionAttribute = []
    let orderAttribute = ['id', 'createdAt', 'documentType', 'amount', 'status','passportDoc']


    let params ={
        from,
        to,
        searchText,
        sort,
        credentialAttribute,
        transactionAttribute,
        sortField, 
        orderAttribute
    }

    let data = await getExcelCSVData(params)
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if(data.length == 0) {
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

exports.generatePDF = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = 'createdAt'

    let credentialAttribute = ['name','username', "id"]
    let transactionAttribute = []
    let orderAttribute = ['id', 'createdAt', 'documentType', 'amount', 'status','passportDoc']


    let params ={
        from,
        to,
        searchText,
        sort,
        credentialAttribute,
        transactionAttribute,
        sortField, 
        orderAttribute
    }

    let data = await getExcelCSVData(params)
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if(data.length == 0) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    }
    const templateDetails = {
        title: 'Attestations Report'
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
exports.updateAttestation = asyncHandler(async (req, res, next) => {
    let params = req.params
    let attestationDetails = req.body
    let user = req.user
    // let passportDoc = attestationDetails.passportDoc
    let fileUrl;
    const filePath = `${
      user?.role ? user?.role.toLowerCase() : "unknown-role"
    }/${user?.username ? user?.username : "unknown-user"}/attestation-doc`
    if (attestationDetails.base64String && attestationDetails.documentFormat) {
        fileUrl = await uploadFile(attestationDetails.base64String, filePath, attestationDetails.documentFormat);
        attestationDetails.passportDoc = fileUrl ? fileUrl : next(new ErrorResponse(`Something went wrong while uploading the document`, 500));
    } else {
        delete attestationDetails.passportDoc;
    }
    const result = await updateAttestation(params, attestationDetails);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating system user`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {},
            'message': 'Attestation updated successfully',
            'responseCode' : '000'
        })
    }
});
exports.createAttestationCategory = asyncHandler(async (req, res, next) => {
    try {
        let data = req.body

        const result = await createAttestationCategory(data);
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while adding attestation category`, 500))
        } else {
            return res.status(200).json({
                'status': true,
                'data': result ,
                'message': 'attestation category added successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            data: {},
            responseCode: '001'
        })
    }
})
exports.updateAttestationCategory = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const result = await updateAttestationCategory(id, data);
        if (!result) {
            return next(new ErrorResponse(`Attestation category not found`, 404));
        }

        return res.status(200).json({
            status: true,
            data: result,
            message: 'Attestation category updated successfully',
            responseCode: '000',
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001',
        });
    }
});
exports.deleteAttestationCategory = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await deleteAttestationCategory(id);
        if (!result) {
            return next(new ErrorResponse(`Attestation category not found`, 404));
        }

        return res.status(200).json({
            status: true,
            data: {},
            message: 'Attestation category deleted successfully',
            responseCode: '000',
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001',
        });
    }
});

exports.findAllAttestationCategories = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage, from, to } = req.query;

    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";

    // Parse page and itemsPerPage to integers
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;

    let limit = itemsPerPage;
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    let params = {
        from,
        to,
        limit,
        offset,
        searchText,
        sort,
        sortField,
    };

    const attestationCategoryData = await findAllAttestationCategoriesUseCase(params);

    if (!attestationCategoryData) {
        return next(
            new ErrorResponse(`Something went wrong while fetching attestation categories`, 500)
        );
    } else {
        return res.status(200).json({
            status: true,
            data: {
                recordsTotal: attestationCategoryData ? attestationCategoryData.count : 0,
                recordsFiltered: attestationCategoryData ? attestationCategoryData.count : 0,
                data: attestationCategoryData ? attestationCategoryData.rows : [],
            },
            message: "Attestation categories fetched successfully.",
            responseCode: "000",
        });
    }
});

exports.AttestationAndCountExcelCSV = asyncHandler(async (req, res, next) => {
    let { searchText, from, to } = req.query;
    const {type} = req.params;
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";

    let params = {
        from,
        to,
        searchText,
        sort,
        sortField,
    };
  
    try {
      const data = await findAllAttestationCategoriesExport(params);
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
  exports.AttestationAndCountPDF = asyncHandler(async (req, res, next) => {
    let { searchText, from, to } = req.query;
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";


    let params = {
        from,
        to,
        searchText,
        sort,
        sortField,
    };
  
  
    try {
      const data = await findAllAttestationCategoriesExport(params);
      if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
      } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
      }
      
      const templateDetails = {
        title: 'E-Docs'
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
