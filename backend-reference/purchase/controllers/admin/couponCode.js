const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response');
const {
    findOne,
    create,
    findAll,
    update,
    CouponCodeExport,
    bulkCreateForServiceOperators,
    findConflictingServiceOperators,
} = require('../../models/use-cases/couponCode');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { customLog } = require('../../utils/loggerHelper');
const puppeteer = require("puppeteer");
const fs = require("fs");
const { findOnePackage } = require('../../models/use-cases/package');
const { countOrdersUsingCoupon } = require('../../models/use-cases/order');
const serviceOperator = require('../../models/entities/serviceOperator');

exports.createCouponCode = asyncHandler(async (req, res, next) => {
    let data = req.body;
    const { discount, billingType, discountType, packageId, couponType, serviceOperatorIds } = data;
    let validToDate = new Date(data.validTo);
    const formattedDate = validToDate.toISOString().split('T')[0];
    data.validTo = formattedDate + " 23:59:59";
    const partnerId = data.partnerId || null;

    if (couponType === 'SUBSCRIPTION') {
        const existing = await findOne({
            couponCode: data.couponCode,
            partnerId,
            serviceOperatorId: null,
        });
        if (existing) return next(new ErrorResponse(`Coupon code already exists`, 400));

        if (discountType === 'FLAT') {
            const packageData = await findOnePackage({ id: packageId });
            if (!packageData) return next(new ErrorResponse(`Package not found`, 400));
            const priceMap = {
                MONTHLY: packageData.packagePrices.monthly,
                ANNUALLY: packageData.packagePrices.annually,
            };
            const packagePrice = priceMap[billingType];
            if (packagePrice !== undefined && Number(discount) > Number(packagePrice)) {
                return next(new ErrorResponse(`Discount must be smaller than ₹ ${packagePrice}`, 400));
            }
        }

        const subscriptionCoupon = { ...data, serviceOperatorId: null };
        delete subscriptionCoupon.serviceOperatorIds;
        const result = await create(subscriptionCoupon);
        if (!result) return next(new ErrorResponse(`Something went wrong while adding coupon code`, 400));
        return res.status(200).json({
            status: true,
            message: 'Coupon code added successfully',
            data: result,
            responseCode: '000',
        });
    }

    const conflicts = await findConflictingServiceOperators({
        couponCode: data.couponCode,
        partnerId,
        serviceOperatorIds,
    });
    if (!conflicts) return next(new ErrorResponse(`Something went wrong while adding coupon code`, 400));

    if (conflicts.length > 0) {
        const conflictingOperators = await serviceOperator.findAll({
            where: { id: conflicts.map(conflict => conflict.serviceOperatorId) },
            attributes: ['serviceProvider'],
            raw: true,
        });
        const names = conflictingOperators.map(operator => operator.serviceProvider).join(', ');
        return next(new ErrorResponse(
            `Coupon code "${data.couponCode}" already exists for: ${names}. Please unselect these service operators and try again.`,
            400,
        ));
    }

    const baseData = { ...data, partnerId };
    delete baseData.serviceOperatorIds;
    const results = await bulkCreateForServiceOperators({ baseData, serviceOperatorIds });

    if (!results || results.length === 0) {
        return next(new ErrorResponse(`Something went wrong while adding coupon code`, 400));
    }

    return res.status(200).json({
        status: true,
        message: results.length === 1
            ? 'Coupon code added successfully'
            : `Coupon code added successfully for ${results.length} service operators`,
        data: results,
        responseCode: '000',
    });
});

exports.getAllCouponCodes = asyncHandler(async (req, res, next) => {
  
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
     const attributes = ['id', 'couponCode', 'discountType', 'discount', 'validFrom', 'validTo', 'status', 'createdAt', 'partnerId', 'usageCount', 'referralCodeId', 'billingType'];
    let params = {
        limit,
        offset,
        searchText,
        sort,
        sortField,
        attributes
    }
    const couponDatas = await findAll(params);
    if (!couponDatas) {
        return next(new ErrorResponse(`Something went wrong while getting all Coupons`, 400))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
            'recordsTotal': couponDatas.count,
            'data': couponDatas.rows
            },
            'message' : 'Coupon codes fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await update(id, {status});
    if(!result) return next(new ErrorResponse(`Something went wrong while updating the status`, 400));
    return res.status(200).json({
        'status': true,
        'message': 'Coupon code updated successfully',
        'data': result ,
        'responseCode' : '000'
    });
})

exports.updateCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    const { discount, billingType, discountType, packageId, couponType, serviceOperatorId } = data;
    let validToDate = new Date(data.validTo);
    const formattedDate = validToDate.toISOString().split('T')[0];
    data.validTo = formattedDate + " 23:59:59";
    const partnerId = data.partnerId || null;

    const usedInOrders = await countOrdersUsingCoupon(parseInt(id));
    if (usedInOrders > 0) {
        return next(new ErrorResponse(`This coupon has already been used in transactions and cannot be updated`, 400));
    }

    const isExists = await findOne({
        couponCode: data.couponCode,
        partnerId,
        serviceOperatorId: couponType === 'SERVICES' ? serviceOperatorId : null,
    });
    if (isExists && isExists.id !== parseInt(id)) {
        return next(new ErrorResponse(`Coupon code already exists`, 400));
    }
    
    if (discountType === 'FLAT' && couponType === 'SUBSCRIPTION') {
        const packageData = await findOnePackage({ id: packageId });
        if (!packageData) return next(new ErrorResponse(`Package not found`, 400));
        const priceMap = {
            MONTHLY: packageData.packagePrices.monthly,
            ANNUALLY: packageData.packagePrices.annually,
        };
        const packagePrice = priceMap[billingType];
        if (packagePrice !== undefined && Number(discount) > Number(packagePrice)) {
            return next(new ErrorResponse(`Discount must be smaller than ₹ ${packagePrice}`, 400));
        }
    }

    const result = await update(id, data);
    if(!result) return next(new ErrorResponse(`Something went wrong while updating the coupon`, 400));
    return res.status(200).json({
        'status': true,
        'message': 'Coupon code updated successfully',
        'data': result ,
        'responseCode' : '000'
    });
})

exports.couponCodeExcelCSV = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage } = req.query;
    const { type } = req.query;
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
    const attributes = ['id', 'couponCode', 'discountType', 'discount', 'validFrom', 'validTo', 'status', 'createdAt'];
    let params = {
        limit,
        offset,
        searchText,
        sort,
        sortField,
        attributes
    }
    const data = await CouponCodeExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500));
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409));
    } else {
        const { buffer, fileType } = await generateExcelBufferAndType(data, type);
        console.log("buffer", buffer)
        console.log("fileType", fileType)
        return res.status(200).json({
            status: true,
            data: { buffer, fileType },
            message: "Fetched excel/csv datas successfully",
            responseCode: "000",
        });
    }
});

exports.couponCodePDF = asyncHandler(async (req, res, next) => {
   let { searchText } = req.query;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    const attributes = ['id', 'couponCode', 'discountType', 'discount', 'validFrom', 'validTo', 'status', 'createdAt'];
    let params = {
        searchText,
        sort,
        sortField,
        attributes
    }
    const data = await CouponCodeExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 400));
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 400));
    }

    const templateDetails = {
        title: 'Coupon Code'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
    let random = new Date().valueOf();

    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });

    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
        scale: 0.6,
        path: outputFile,
        format: "A4",
        preferCSSPageSize: true,
    });

    customLog(
        req?.LogTraceId,
        "info",
        { message: "PDF generated successfully!" }
    );

    const buffer = fs.readFileSync(outputFile);

    browser.close();

    fs.unlinkSync(outputFile);

    return res.status(200).json({
        status: true,
        message: "report generated successfully.",
        data: {
            buffer,
            fileType: "application/pdf",
        },
        responseCode: "000",
    });
});