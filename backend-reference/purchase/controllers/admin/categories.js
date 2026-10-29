const {
  update,
  create,
  Delete,
  findAllCategories,
  findCategory,
  fetchCategoryDetails,
  getExcelCSVData,
  findByCategoryName,
  categoriesAndCountExport
} = require("../../models/use-cases/categories");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require('puppeteer')
const fs = require('fs')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')

exports.createCategory = asyncHandler(async (req, res, next) => {
  const data = req.body;
  let isCategoryAvailable = await findByCategoryName(data.categoryName);
  if (isCategoryAvailable) {
    return next(new ErrorResponse(`Category name already exists`, 403));
  }
  let result = await create(data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding category`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Category added successfully",
      data: result,
      responseCode: '000'
    });
  }
});

exports.findAllCategoriesAndCount = asyncHandler(async (req, res, next) => {

  let { searchText, page, itemsPerPage } = req.query;

  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
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
       limit,
       offset,
       searchText,
       sort,
       sortField,
  }
  const categoriesData = await findAllCategories(params);
  if (!categoriesData) {
    return next(new ErrorResponse(`Something went wrong while getting all categories from database`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: categoriesData ? categoriesData.count : 0,
        recordsFiltered: categoriesData ? categoriesData.count : 0,
        data: categoriesData ? categoriesData.rows : 0,

      },
      message:'All categories fetched successfully',
      responseCode: '000'

    });
  }
});

exports.categoriesAndCountExcelCSV = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query
     const { type } = req.params

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await categoriesAndCountExport(params)
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
exports.categoriesAndCountPDF = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await categoriesAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }

     const templateDetails = {
          title: 'Categories',
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

exports.updateCategory = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;
  let isCategoryAvailable = await findByCategoryName(data.categoryName);
  if (isCategoryAvailable && isCategoryAvailable.id != params.id) {
    return next(new ErrorResponse(`Category name already exists`, 403));
  }
  const result = await update(params, data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the category`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Category updated successfully",
      data: {},
      responseCode: '000'
    });
  }
});

exports.deleteCategory = async (req, res, next) => {
  const id = req.params.id;
  try {
    const categoryData = await findCategory(id);
    if (categoryData.length > 0) {
      return res.status(403).json({
        statuss: false,
        message: "Unable to delete. Category is already assigned.",
        responseCode: '001',
        data: {}
      });
    }
    const result = await Delete({
      id,
    });
    if (result === 1) {
      return res.status(200).json({
        status: true,
        message: "Category deleted successfully",
        data: {},
        responseCode: '000'
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "An error occured while deleting the Category.",
        data: {},
        responseCode: '001'
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.fetchCategory = asyncHandler(async (req, res, next) => {
  let searchText = req.query.q;
  let result = await fetchCategoryDetails(searchText);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching specific category`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: 'category fetched successfully',
      responseCode: '000'
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
      message: "status updated successfully",
      data: "Updated successfully",
      responseCode: '000'
    });
  }
});

exports.getExcel = asyncHandler(async (req, res, next) => {
  let result = await getExcelCSVData();
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching excelCSV data`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: 'excel/csv data created successfully',
      responseCode: '000'
    });
  }
});