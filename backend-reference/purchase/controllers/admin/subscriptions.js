const {
    update,
    create,
    find,
    Delete,
    findAllSubscriptions,
    fetchSubscriptionDetails,
    getExcelCSVData,
    fetchAllPhotos
} = require('../../models/use-cases/subscriptions')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const emailer = require('../../utils/emailer')
const { updateOrder } = require('../../models/use-cases/order');
const { subscriptionCustomMail } = require('../../utils/templatesForEmails');
const { customLog } = require('../../utils/loggerHelper');

exports.createSubscription = asyncHandler(async (req, res, next) => {
    const data = req.body
    let isProductAvailable = await find(data.name)
    if (isProductAvailable) {
        return next(new ErrorResponse(`Subscription name already exists`, 200))
    }
    let result = await create(data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding product`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'Subscription added successfully',
            'data': result
        })
    }
})

exports.findAllSubscriptionsAndCount = asyncHandler(async (req, res, next) => {
    const start = parseInt(req.query.start)
    const length = parseInt(req.query.length)
    const draw = parseInt(req.query.draw)
    let searchText = req.query.search.value
    let order = req.query.orderCol,
        column = req.query.column
    let params = {
        start,
        length,
        draw,
        searchText,
        order,
        column
    }
    const subscriptionData = await findAllSubscriptions(params);
    if (!subscriptionData) {
        return next(new ErrorResponse(`Something went wrong while getting all products from database`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'draw': draw,
            'recordsTotal': subscriptionData ? subscriptionData.count : 0,
            'recordsFiltered': subscriptionData ? subscriptionData.count : 0,
            'data': subscriptionData ? subscriptionData.rows : 0
        })
    }
})

exports.fetchAllPhotos = asyncHandler(async (req, res, next) => {
    let productId = req.params.id
    let result = await fetchAllPhotos(productId)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching photos`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.updateSubscription = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body
    let isProductAvailable = await find(data.productName)
    if (isProductAvailable && isProductAvailable.id != params.id) {
        return next(new ErrorResponse(`Subscription name already exists`, 210))
    }
    const result = await update(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating the product`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'Subscription updated successfully'
        })
    }
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body
    let result = await update(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'status updated successfully',
            'data': 'Updated successfully'
        })
    }
})

exports.fetchSubscription = asyncHandler(async (req, res, next) => {
    let searchText = req.query.q
    let result = await fetchSubscriptionDetails(searchText)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific product`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
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



exports.deleteSubscription = async (req, res, next) => {
    const productCode = req.params.id;
    try {

        const result = await Delete({
            productCode
        });
        if (result === 1) {
            return res.status(200).json({
                status: true,
                message: "Subscription deleted successfully",
                data: {},
                responseCode: '000'
            });
        } else {
            return res.status(400).json({
                status: false,
                message: "An error occured while deleting the Subscription.",
                data: {},
                responseCode: '001'
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.sendAMail = asyncHandler(async (req, res, next) => {
    try {
        const { serialKey, name, email, subscriptionDetails } = req.body;
        const params = req.params;
        const result = await updateOrder(params, { ecomOrderStatus: "COMPLETED" });
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while Updating order`, 400));
        }
        const to = email; // Set recipient email address
        const subject = "Serial key of your subscription"; // Set email subject
        const body = subscriptionCustomMail(name, serialKey, subscriptionDetails);
        // Call email function to send email with payment details in the body
        emailer.email(to, subject, body, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        });

        return res.status(200).json({
            status: true,
            message: "Mail delivered",
            data:{},
            responseCode:"000"
        });
    } catch (error) {
        
        customLog(req?.LogTraceId, "error", {error})
        return next(new ErrorResponse(`Something went wrong while Generating email`, 400));
    }
});