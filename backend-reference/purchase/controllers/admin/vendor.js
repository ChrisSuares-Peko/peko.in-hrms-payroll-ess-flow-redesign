const {
    update,
    create,
    find,
    findAllVendors,
    findAllVendor,
    fetchVendorDetails,
    fetchVendorData,
    vendorAndCountExport
} = require('../../models/use-cases/vendors')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const puppeteer = require('puppeteer')
const fs = require('fs')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')

exports.createVendor = asyncHandler(async (req, res, next) => {
    const data = req.body
    let isVendorAvailable = await find(data.vendorName)
    if (isVendorAvailable) {
        return next(new ErrorResponse(`Vendor name already exists`, 403))
    }
    let result = await create(data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding vendor`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Vendor added successfully',
            'data': result ,
            'responseCode' : '000'
        })
    }
})

exports.findAllVendorAndCount = asyncHandler(async (req, res, next) => {
  
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
    const vendorsData = await findAllVendors(params);
    if (!vendorsData) {
        return next(new ErrorResponse(`Something went wrong while getting all vendors from database`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'data':vendorsData.rows,
                'recordsTotal': vendorsData.count,
                'recordsFiltered': vendorsData.count,
            },
            'message' : 'Vendor fetched successfully',
            'responseCode' : '000'
        })
    }
})

exports.vendorAndCountExcelCSV = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query
     let { type } = req.params

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await vendorAndCountExport(params)
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
exports.vendorAndCountPDF = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await vendorAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }

     const templateDetails = {
          title: 'Vendors Report',
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
          scale: 0.5,
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

exports.updateVendor = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body
    let isVendorAvailable = await find(data.vendorName)
    if (isVendorAvailable && isVendorAvailable.id != params.id) {
        return next(new ErrorResponse(`Vendor name already exists`, 403))
    }
    const result = await update(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating the vendor`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Vendor updated successfully',
            'data' : {},
            'responseCode' : '000'
        })
    }
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body
    let result = await update(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Status updated successfully',
            'data': {},
            'responseCode' : '000'
        })
    }
})

exports.fetchVendor = asyncHandler(async (req, res, next) => {
    let searchText = req.query.searchText
    let result = await fetchVendorDetails(searchText)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {data : result},
            'message' : 'Vendor fetched successfully',
            'responseCode' : '000'
        })
    }
})

exports.fetchVendors = asyncHandler(async (req, res, next) => {
    let type = req.query.type
    let result = await fetchVendorData(type)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.findAllVendor = asyncHandler(async (req, res, next) => {
    let result = await findAllVendor()
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

