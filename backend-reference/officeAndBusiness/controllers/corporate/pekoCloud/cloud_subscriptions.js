const ErrorResponse = require('../../../utils/error-response')
const asyncHandler = require('../../../middlewares/async');
const { createSubscription, findAllSubscriptions, updateSubscription, deleteSubscription, assignSubscription, findTotalCount, findSubscriptionsList } = require('../../../models/use-cases/pekoCloud/cloud_subscriptions');
const { USD_TO_INR } = process.env;

exports.createSubscriptions = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    let data = req.body;
    data.credentialId = credentialId
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
        data.subCorporateUserId = req.user?.subCorporateId
    }
    const result = await createSubscription(data);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Subscription added successfully',
            'responseCode': '000'
        });
    }
});

exports.findSubscriptions = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let { page, itemsPerPage, sortField, sort, searchText } = req.query;
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

    if (!sortField || !sort) {
        sortField = sortField || 'createdAt'
        sort = sort == 'ASC' ? 'ASC' : 'DESC'
    }

    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    }

    const result = await findAllSubscriptions(page, itemsPerPage, sortField, sort, searchText,credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching subscriptions`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched subscriptions successfully',
        'responseCode': '000'
    });
});

exports.findSubscriptionsList = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    }
    const result = await findSubscriptionsList(credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching subscriptions`, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': {
            result: result?.data?.rows,
            totalData: result?.data?.count,
        },
        'message': 'Fetched subscriptions successfully',
        'responseCode': '000'
    });
});

exports.getSubscriptionsInfoDetails = asyncHandler(async (req, res, next) => {
    let credentialId = req.user.id;
    let subCorporateUserId;
    if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      subCorporateUserId = req.user?.subCorporateId
    }

    const details = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalUsers: 0,
        totalSpent: 0,
    }
    const result = await findSubscriptionsList(credentialId,subCorporateUserId);
    if (!result.success) {
        return next(new ErrorResponse(`Something went wrong while fetching subscriptions info`, 500));
    }

    const data = result.data
    details.totalSubscriptions = data?.count ?? 0

    const uniqueEmployeeIds = new Set();

    const conversionRate = parseFloat(USD_TO_INR); // Ensure this is a number

    data?.rows?.forEach(item => {
        const amount = Number(item?.amount ?? 0) * item?.assignTo?.length;
        const { currency } = item;

        if (currency === 'USD') {
            details.totalSpent += amount * conversionRate;
        } else {
            details.totalSpent += amount;
        }

        if (item.status === 'Active') {
            details.activeSubscriptions += 1;
        }
        item.assignTo.forEach(assignee => {
            uniqueEmployeeIds.add(assignee?.id);
        });
    });
    details.totalUsers = uniqueEmployeeIds.size;
    details.totalSpent = details.totalSpent.toFixed(2)

    return res.status(200).json({
        'status': true,
        'data': details,
        'message': 'Fetched subscriptions info successfully',
        'responseCode': '000'
    });
});


exports.updateSubscriptions = asyncHandler(async (req, res, next) => {
    const { subscriptionId } = req.params;
    const updatatedData = req.body;
    const credentialId = req.user.id;


    const result = await updateSubscription(subscriptionId, {...updatatedData, credentialId}, credentialId);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Subscription updated successfully',
        'responseCode': '000'
    });

})

exports.deleteSubscription = asyncHandler(async (req, res, next) => {
    const { subscriptionId } = req.params


    const result = await deleteSubscription(subscriptionId, req.user.id);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Subscription deleted successfully',
        'responseCode': '000'
    });

})

exports.assignSubscription = asyncHandler(async (req, res, next) => {
    const assignData = req.body;
    const credentialId = req.user.id;


    const result = await assignSubscription(assignData, credentialId);
    if (!result.success) {
        return next(new ErrorResponse(result.error, 500));
    }

    return res.status(200).json({
        'status': true,
        'data': result?.data,
        'message': 'Subscription assigned successfully',
        'responseCode': '000'
    });

})

exports.fetchTotal = asyncHandler(async(req,res)=>{
    const credentialId = req.user.id;
    //total subscriptions
    const totalSubscriptions = await findTotalCount(credentialId);
    return res.status(200).json({
        'status': true,
        'data': totalSubscriptions?.data,
        'message': 'count fetched successfully',
        'responseCode': '000'
    });


})