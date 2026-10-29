const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response');
const { findOne, create, findAll, update, deleteSubscriptionCoupon, findOneById, updateAllExpiredCoupon, updateCreditStatus, bulkUpdateCreditStatus, pekoCreditsExport } = require('../../models/use-cases/pekoCredits');
const { findOnePackage } = require('../../models/use-cases/package');
const { createNotification } = require('../../models/use-cases/notification');
const { assignCouponToCorporates } = require('../../models/use-cases/userCoupons');
const puppeteer = require("puppeteer");
const fs = require("fs");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { customLog } = require('../../utils/loggerHelper');
exports.createSubscriptionCouponCode = asyncHandler(async (req, res, next) => {
    let data = req.body;
    const { discount, couponType, billingType, discountType, partnerId, packageId } = data
    const isExists = await findOne({ code: data.code, partnerId: partnerId })

    if (isExists) return next(new ErrorResponse(`Coupon code already exists`, 400));

    if (couponType === 'SUBSCRIPTION' && discountType === 'FLAT') {
        const couponData = await findOnePackage(packageId);
        const priceMap = {
            MONTHLY: couponData.packagePrices.monthly,
            ANNUALLY: couponData.packagePrices.annually,
        };

        const packagePrice = priceMap[billingType];
        if (packagePrice !== undefined && Number(discount) >= Number(packagePrice)) {
            return next(new ErrorResponse(`Discount must be smaller than ₹ ${packagePrice}`, 400));
        }
    }

    let result = await create(data);

    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding coupon code`, 400));
    } else {

        await assignCouponToCorporates(result)

        const discountAmount = result.discountType == 'FLAT' ? Number(result.discount) : Number(result.maximumDiscount)
        if (data.notifyCorporates) {
            const notificationData = {
                notificationTitle: `New ${partnerId ? '' : 'Peko'} Credits Added`,
                notificationBrief: `You’ve earned ₹ ${discountAmount.toFixed(2)} in ${partnerId ? '' : 'Peko'} Credits! View and redeem them now. `,
                notificationTo: "ALL",
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            };
            createNotification(notificationData, null, partnerId ?? null);
        }

        return res.status(200).json({
            'status': true,
            'message': 'Coupon code added successfully',
            'data': result,
            'responseCode': '000'
        });
    }
});

exports.getAllSubscriptionCouponCodes = asyncHandler(async (req, res, next) => {

    let { searchText, page, itemsPerPage, partnerId } = req.query;

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
        partnerId
    }
    await updateAllExpiredCoupon() // check valid until and change status
    const couponDatas = await findAll(params);
    if (!couponDatas) {
        return next(new ErrorResponse(`Something went wrong while getting all coupons`, 400))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'recordsTotal': couponDatas.count,
                'data': couponDatas.rows
            },
            'message': 'Coupon codes fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await updateCreditStatus(id, { status });

    if (!result) {
        return next(new ErrorResponse(`Coupon is expired and cannot be enabled`, 400));
    }

    return res.status(200).json({
        'status': true,
        'message': 'Coupon code updated successfully',
        'data': result,
        'responseCode': '000'
    });
})

/**
 * Staging-only: enable or disable every peko credit in one call, so a tester can
 * take credits out of a payment flow without toggling each coupon. The route is
 * gated by the stagingOnly middleware — see routes/API/v1/systemUser/pekoCredits.js.
 */
exports.bulkUpdateStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;

    if (status !== 'ACTIVE' && status !== 'DISABLED') {
        return next(new ErrorResponse(`status must be either ACTIVE or DISABLED`, 400));
    }

    // Park already-expired coupons on DISABLED first, so an ACTIVE sweep never
    // reports them as enabled.
    await updateAllExpiredCoupon();

    const updatedCount = await bulkUpdateCreditStatus(status);

    if (updatedCount === false) {
        return next(new ErrorResponse(`Something went wrong while updating peko credits`, 400));
    }

    return res.status(200).json({
        'status': true,
        'message': `${updatedCount} peko credit(s) ${status === 'ACTIVE' ? 'enabled' : 'disabled'} successfully`,
        'data': { updatedCount, status },
        'responseCode': '000'
    });
})

exports.updateSubscriptionCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    const { discount, couponType, billingType, discountType, partnerId, maximumDiscount } = data

    const isExists = await findOne({ partnerId: partnerId, code: data.code })
    if (isExists && isExists.id !== parseInt(id)) {
        return next(new ErrorResponse(`Coupon code already exists`, 400));
    }

    if (couponType === 'SUBSCRIPTION' && discountType === 'FLAT') {
        const couponData = await findOnePackage(data.packageId);
        const priceMap = {
            MONTHLY: couponData.packagePrices.monthly,
            ANNUALLY: couponData.packagePrices.annually,
        };

        const packagePrice = priceMap[billingType];
        if (packagePrice !== undefined && Number(discount) >= Number(packagePrice)) {
            return next(new ErrorResponse(`Discount must be less than ₹ ${packagePrice}`, 400));
        }
    }

    const result = await update(id, data);
    if (!result) return next(new ErrorResponse(`Something went wrong while updating the coupon`, 400));

    const discountAmount = discountType == 'FLAT' ? Number(discount) : Number(maximumDiscount)
    if (data.notifyCorporates) {
        const notificationData = {
            notificationTitle: `New ${partnerId ? '' : 'Peko'}  Credits Added`,
            notificationBrief: `You’ve earned ₹ ${discountAmount.toFixed(2)} in ${partnerId ? '' : 'Peko'} Credits! View and redeem them now. `,
            notificationTo: "ALL",
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
        };
        createNotification(notificationData, null, partnerId ?? null);
    }

    return res.status(200).json({
        'status': true,
        'message': 'Coupon code updated successfully',
        'data': result,
        'responseCode': '000'
    });
})

exports.deleteSubscriptionCouponCode = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const isExists = await findOneById(id)
    if (!isExists) {
        return next(new ErrorResponse(`Coupon code does not exists`, 400));
    }
    const result = await deleteSubscriptionCoupon(id);
    if (!result) return next(new ErrorResponse(`Something went wrong while deleting the coupon`, 400));
    return res.status(200).json({
        'status': true,
        'message': 'Coupon code deleted successfully',
        'data': result,
        'responseCode': '000'
    });
})

exports.pekoCreditsExcelCSV = asyncHandler(async (req, res, next) => {
    let { searchText, partnerId } = req.query;
    let { type } = req.params
    let params = {
        searchText, partnerId
    }
    await updateAllExpiredCoupon() // check valid until and change status
   
    const data = await pekoCreditsExport(params);
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

exports.pekoCreditsPDF = asyncHandler(async (req, res, next) => {
   let { searchText,partnerId} = req.query;
    let params = {
        searchText,partnerId
    }
    const data = await pekoCreditsExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 400));
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 400));
    }

    const templateDetails = {
        title: 'Peko Credits'
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