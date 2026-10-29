const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require('puppeteer')
const fs = require('fs')
const {
     create,
     findByProductId,
     findAllSoftwares,
     update,
     Delete,
     find,
     fetchSoftwareCategories,
     findProduct,
     softwareAndCountExport,
} = require('../../models/use-cases/softwares')
const { fetchVendorDetails, findVendorByName } = require("../../models/use-cases/vendors");
const { fetchSoftwaresBulkUploadTemplate, bulkCreateSoftwares } = require("../../services/software");
const { findByCategoryName } = require("../../models/use-cases/categories");
const { SoftwarePlansCount } = require("../../models/use-cases/software_plan");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

exports.createSoftware = asyncHandler(async (req, res, next) => {
  const data = req.body;
  let isSoftwareAvailable = await findByProductId(data.productId);
  if (isSoftwareAvailable) {
    return next(new ErrorResponse(`Software already exists`, 403));
  }
  let result = await create(data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding software`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Software added successfully",
      data: result,
      responseCode: "000",
    });
  }
});

exports.findAllSoftwareAndCount = asyncHandler(async (req, res, next) => {
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
  const productData = await findAllSoftwares(params);
  if (!productData) {
    return next(new ErrorResponse(`Something went wrong while getting all softwares from database`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: productData ? productData.count : 0,
        recordsFiltered: productData ? productData.count : 0,
        data: productData ? productData.rows : 0,
      },
      message: "Softwares fetched successfully",
      responseCode: "000",
    });
  }
});

exports.softwareAndCountExcelCSV = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query
     let { type } = req.params

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await softwareAndCountExport(params)
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
exports.softwareAndCountPDF = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await softwareAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 400))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 400))
     }

     const templateDetails = {
          title: 'Softwares Report',
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
          scale: 0.4,
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

exports.fetchSubscriptionVendor = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText;
  const type = "SOFTWARE";
  let result = await fetchVendorDetails(searchText, type);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: { result },
      message: "Vendor fetched successfully",
      responseCode: "000",
    });
  }
});

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

exports.deleteSoftware = async (req, res, next) => {
  const productCode = req.params.id;
  try {
    const plansCount = await SoftwarePlansCount({
       productCode
    });
    if (plansCount > 0) {
      return res.status(400).json({
        status: false,
        data: {},
        message: 'Cannot delete software. Plans are associated with it.',
        responseCode: '001'
      });
    }
    const result = await Delete({
      productCode,
    });
    if (result === 1) {
      return res.status(200).json({
        status: true,
        message: "Software deleted successfully",
        data: {},
        responseCode: "000",
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "An error occured while deleting the Software.",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateSoftware = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let isSoftwareAvailable = await findByProductId(data.productId);
  if (isSoftwareAvailable && isSoftwareAvailable.id != params.id) {
    return next(new ErrorResponse(`Software already exists`, 403));
  }
  const result = await update(params, data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the software`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Software updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.getBulkTemplate = asyncHandler(async (req, res) => {
  const softwareTemplateUrl = await fetchSoftwaresBulkUploadTemplate(req);

  return res.status(200).json({
    status: true,
    message: "Software upload template fetched successfully",
    data: { softwareTemplateUrl },
    responseCode: "000",
  });
});

exports.bulkExcelUploadSoftwares = asyncHandler(async (req, res, next) => {
  let softwaresJsonData = req.body.softwaresJsonData;
  if (softwaresJsonData.length > 10000) {
    return next(new ErrorResponse(`Exceeded maximum limit for bulk upload (10,000 per sheet)`, 500));
  }
  let uploadType = req.body.uploadType;
  let hasErrors = false;
  const results = await Promise.all(
    softwaresJsonData.map(async (obj) => {
      let { vendor, category } = obj;
      let isProductAvailable = await find(obj.name);
      if (isProductAvailable) {
        obj.status = false;
        obj.errors.push(`${obj.name} is already uploaded`);
      }

      let isProuductIdAvailable = await findProduct({productId: obj.productId})
      if(isProuductIdAvailable){
        obj.status = false;
        obj.errors.push(`${obj.productId} product Id is already uploaded`)
      }

      //create vendors array and add to obj
      let vendorDetails = await findVendorByName(vendor);
      if (!vendorDetails) {
        obj.status = false;
        obj.errors.push(`${vendorDetails} vendor is not available`);
      } else {
        obj.vendorId = vendorDetails.id;
      }

      //create category array and add to obj
      let categoryDetails = await findByCategoryName(category);
      if (!categoryDetails) {
        obj.status = false;
        obj.errors.push(`${category} - category is not available`);
      } else {
        obj.categoryId = categoryDetails.id;
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
    let products = await bulkCreateSoftwares(softwaresJsonData);
    return res.status(200).json({
      status: true,
      message: "Softwares added successfully",
      responseCode: "000",
      data: { products, softwaresCreated: true },
    });
  } else {
    return res.status(200).json({
      status: true,
      message: "Please review softwares",
      responseCode: "000",
      data: { softwaresJsonData, softwaresCreated: false },
    });
  }
});

exports.fetchAllSoftwareCategories = asyncHandler(async (req, res, next) => {
  const categoryData = await fetchSoftwareCategories(req.query);
  if (!categoryData) {
      return next(new ErrorResponse(`Something went wrong while fetching categories`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': { categoryData },
          'message': 'Categories fetched successfully',
          'responseCode': '000'
      })
  }
})