const {
    update,
    create,
    find,
    Delete,
    findAllProducts,
    fetchProductDetails,
    getExcelCSVData,
    fetchAllCategories,
    fetchAllPhotos,
    productAndCountExport
} = require('../../models/use-cases/products')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { fetchVendorDetails, findVendorByName } = require('../../models/use-cases/vendors')
const { fetchProductsBulkUploadTemplate, bulkCreateProducts } = require('../../services/products')
const { findCategoryByName } = require('../../models/use-cases/category')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const puppeteer = require('puppeteer');
const fs = require("fs");

exports.createProduct = asyncHandler(async (req, res, next) => {
    const data = req.body
    let isProductAvailable = await find(data.name)
    if (isProductAvailable) {
        return next(new ErrorResponse(`Product name already exists`, 403))
    }
    let result = await create(data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding product`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Product added successfully',
            'data': result,
            'responseCode': '000'
        })
    }
})

exports.findAllProductAndCount = asyncHandler(async (req, res, next) => {

    let { searchText, page, itemsPerPage } = req.query;

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

    let params = {
         limit,
         offset,
         searchText,
         sort,
         sortField,
    }
    const productData = await findAllProducts(params);
    if (!productData) {
        return next(new ErrorResponse(`Something went wrong while getting all products from database`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'recordsTotal': productData ? productData.count : 0,
                'recordsFiltered': productData ? productData.count : 0,
                'data': productData ? productData.rows : 0
            },
            'message': 'Products fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.productAndCountExcelCSV = asyncHandler(async (req, res, next) => {

    let { searchText } = req.query;
    let { type } = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        searchText,
        sort,
        sortField
    }
    const data = await productAndCountExport(params);
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
exports.productAndCountPDF = asyncHandler(async (req, res, next) => {

    let { searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        searchText,
        sort,
        sortField
    }
    const data = await productAndCountExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 400))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 400))
    }
    
    const templateDetails = {
        title: 'Products'
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
})

exports.fetchAllPhotos = asyncHandler(async (req, res, next) => {
    let productId = req.params.id
    let result = await fetchAllPhotos(productId)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching photos`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': { data: result },
            'message': 'Photos fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.updateProduct = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body
    let isProductAvailable = await find(data.name)
    if (isProductAvailable && isProductAvailable.id != params.id) {
        return next(new ErrorResponse(`Product name already exists`, 403))
    }
    const result = await update(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating the product`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Product updated successfully',
            'data': {},
            'responseCode': '000'

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
            'responseCode': '000'
        })
    }
})

exports.fetchProduct = asyncHandler(async (req, res, next) => {
    let searchText = req.query.q
    let result = await fetchProductDetails(searchText)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific product`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.fetchAllCategories = asyncHandler(async (req, res, next) => {
    const categoryData = await fetchAllCategories(req.query);
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

exports.getExcel = asyncHandler(async (req, res, next) => {
    let result = await getExcelCSVData()
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching excel/CSV data`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.fetchEcomVendor = asyncHandler(async (req, res, next) => {
    let searchText = req.query.searchText
    const type = "ECOMMERCE";
    let result = await fetchVendorDetails(searchText, type)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': { result },
            'message': 'Vendor fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.deleteProduct = async (req, res, next) => {
    const productCode = req.params.id;
    try {

        const result = await Delete({
            productCode
        });
        if (result === 1) {
            return res.status(200).json({
                status: true,
                message: "Product deleted successfully",
                data: {},
                responseCode: '000'
            });
        } else {
            return res.status(500).json({
                status: false,
                message: "An error occured while deleting the Product.",
                data: {},
                responseCode: '001'
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.getBulkTemplate = asyncHandler(async (req, res,) => {

    const productsTemplateUrl = await fetchProductsBulkUploadTemplate(req)

    return res.status(200).json({
        status: true,
        message: "Product upload template fetched successfully",
        data: { productsTemplateUrl },
        responseCode: '000'
    })
})

exports.bulkExcelUploadProducts = asyncHandler(async (req, res, next) => {
    let productsJsonData = req.body.productsJsonData
    if (productsJsonData.length > 10000) {
        return next(new ErrorResponse(`Exceeded maximum limit for bulk upload (10,000 per sheet)`, 500))
    }
    let uploadType = req.body.uploadType
    let hasErrors = false
    const results = await Promise.all(productsJsonData.map(async (obj) => {
        let { categoryName, discountType, discount, vendorName, vendorPrice } = obj
        let isProductAvailable = await find(obj.name)
        if (isProductAvailable) {
            obj.status = false
            obj.errors.push(`${obj.name} is already uploaded`)
        }
        //get categoryId and add to obj
        let category = await findCategoryByName(categoryName)
        if (!category) {
            obj.status = false
            obj.errors.push(`${categoryName} category is not available`)
        } else {
            obj.categoryId = category.id
        }
        //create vendors array and add to obj
        let vendor = await findVendorByName(vendorName)
        if (!vendor) {
            obj.status = false
            obj.errors.push(`${vendor} vendor is not available`)
        } else {
            obj.vendors = [
                {
                    id: vendor.id,
                    name: vendor.vendorName,
                    price: vendorPrice
                }
            ]

        }

        if (discountType === 'PERCENTAGE') {
            obj.price = obj.actualPrice * (1 - discount / 100);
        } else if (discountType === 'FLAT') {
            obj.price = obj.actualPrice - discount;
        }



        //get vendor and create obj for product creation
        return obj
    }))
    if (!results) {
        return next(new ErrorResponse(`Something went wrong`, 400));
    }
    for (let i = 0; i < productsJsonData.length; i++) {
        const { status, errors } = productsJsonData[i];
        if (!status || errors.length > 0) {
            hasErrors = true
        }
    }
    if (!hasErrors && uploadType == 'JSON') { //JSON type means it is validated from fronted and sended else it is excel upload
        //we needed to save the products to Db
        let products = await bulkCreateProducts(productsJsonData)
        return res.status(200).json({
            status: true,
            message: "Products added successfully",
            responseCode: '000',
            data: { products, productsCreated: true }
        })

    } else {
        return res.status(200).json({
            status: true,
            message: "Please review products",
            responseCode: '000',
            data: { productsJsonData, productsCreated: false }
        })
    }
})

