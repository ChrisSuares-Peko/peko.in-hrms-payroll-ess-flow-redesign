const {
    createNotification,
    findOneNotification,
    findAllNotification,
    findAllNotificationCount,
    updateNotification,
    deleteNotification,
    getExcel,
    resetNotification
} = require('../../models/use-cases/notification')
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');

exports.createNotification = async (req, res) => {
    try {
        const data = req.body
        delete data._csrf;
        let result = await createNotification(data)
        /*request.post({
           headers: {
               'Content-type': 'application/json'
           },
            url: 'http://127.0.0.1:4444/addScore',
           body: JSON.stringify({})

        }) */
        res.send(result)
    } catch (e) {
        res.send(e.message)
    }
};


exports.findOneNotification = async (req) => {
    await findOneNotification(req);
};

exports.findAllNotification = async (req, res) => {
    try {
        const params = req.params
        let result = await findAllNotification(params);
        res.send(result)
    } catch (e) {
        res.send(e.message)
    }

};

exports.findAllNotificationAndCount = async (req, res) => {
    const from = req.query.fromDate
    const to = req.query.toDate
    const start = parseInt(req.query.start)
    const length = parseInt(req.query.length)
    const draw = parseInt(req.query.draw)
    let searchText = req.query.search.value
    let order = req.query.orderCol,
        column = req.query.column
    let corporateId = req.query.corporateId
    const notificationData = await findAllNotificationCount(start, from, to, length, draw, corporateId, searchText, order, column);
    res.json({
        'draw': draw,
        'recordsTotal': notificationData.count,
        'recordsFiltered': notificationData.count,
        data: notificationData.rows
    })
};

exports.findAllNotificationCount = async (req, res) => {
    const from = req.query.fromDate
    const to = req.query.toDate
    const start = parseInt(req.query.start)
    const length = parseInt(req.query.length)
    const draw = parseInt(req.query.draw)
    let searchText = req.query.search.value
    let order = req.query.orderCol,
        column = req.query.column
    let corporateId = req.query.corporateId
    const notificationData = await findAllNotificationCount(start, from, to, length, draw, corporateId, searchText, order, column);
    res.json({
        'draw': draw,
        'recordsTotal': notificationData.count,
        'recordsFiltered': notificationData.count,
        data: notificationData.rows
    })
};
exports.updateNotification = async (req, res) => {
    try {
        let params = req.params
        let data = req.body
        await updateNotification(params, data);
        res.send('Updated successfully!')
    } catch (e) {
        res.send(e.message)
    }
};

exports.resetNotificationCountToZero = async (req, res) => {
    try {
        let params = req.params;
        await resetNotification(params);
        res.send('updated successfully')
    } catch (error) {
        console.error('Error resetting notification count:', error);
    }
}

/*exports.deleteNotification = async (req, res, next) => {
   // let params = req.params
  //  return await deleteNotification({params});

//};*/
exports.deleteNotification = async (req, res, next) => {
    let params = req.params
    const result = await deleteNotification(params);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while deleting `, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'notification deleted successfully'
        })
    }
}
exports.getExcel = asyncHandler(async (req, res, next) => {
    const from = req.query.fromDate
    const to = req.query.toDate

    let result = await getExcel({
        from,
        to
    })
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching excelCSV data`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})