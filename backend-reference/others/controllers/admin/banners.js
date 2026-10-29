
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const {
     create,
     updateBannerById,
     deleteBanner,
     fetchAllBanners,
     bannersExports,
} = require('../../models/use-cases/banners')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const puppeteer = require('puppeteer')
const fs = require('fs')

exports.createBanner = asyncHandler(async (req, res, next) => {
    const data = req.body
    
     let result = await create(data)
   
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding banner`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Banner added successfully',
            'data': result,
            'responseCode' : '000'
        })
    }
})

exports.updateBanner = asyncHandler(async (req, res, next) => {
    const data = req.body
    let id = req.params.id
    
    let result = await updateBannerById(id,data)
   
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating banner`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Banner updated successfully',
            'data': {},
            'responseCode' : '000'
        })
    }
})

exports.findAllBanners = asyncHandler(async (req, res, next) => {
     const {
       from,
       to,
       searchText = "",
       page = 1,
       itemsPerPage = 10,
       sort = "DESC",
       deviceType,
       sortField = "createdAt",
     } = req.query;
   
     const pageNum = Number(page) || 1;
     const perPage = Number(itemsPerPage) || 10;
   
     const limit = perPage;
     const offset = (pageNum - 1) * perPage;
   
     const params = {
       from,
       to,
       searchText,
       sort,
       limit,
       offset,
       deviceType,
       sortField,
     };
   
     const banners = await fetchAllBanners(params);
   
     if (!banners) {
       return next(new ErrorResponse("Something went wrong while getting banners", 500));
     }
   
     return res.status(200).json({
       status: true,
       message: "Banner fetched successfully",
       data: banners,
       responseCode: "000",
     });
   });


exports.bannersExcelCSV = asyncHandler(async (req, res, next) => {
     let { from, to, searchText } = req.query
     const { type } = req.params

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let deviceType = req.query.deviceType ? decodeURIComponent(req.query.deviceType) : undefined

     let params = {
          from,
          to,
          searchText,
          sort,
          deviceType,
          sortField,
     }

     const data = await bannersExports(params)

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
exports.bannersPDF = asyncHandler(async (req, res, next) => {
     let { from, to, searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let deviceType = req.query.deviceType ? decodeURIComponent(req.query.deviceType) : undefined

     let params = {
          from,
          to,
          searchText,
          sort,
          deviceType,
          sortField,
     }

     const data = await bannersExports(params)

     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }

     const templateDetails = {
          title: 'Banners Report',
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
          scale: 0.6,
          path: outputFile,
          format: 'A4',
          preferCSSPageSize: true,
     })

     console.log('PDF generated successfully!')

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


exports.deleteBanner = asyncHandler(async (req, res, next) => {
    let params = req.params
    const result = await deleteBanner(params);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while deleting the banner`, 400))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Banner deleted successfully',
            'data' : {},
            'responseCode' : '000'
        })
    }
})
