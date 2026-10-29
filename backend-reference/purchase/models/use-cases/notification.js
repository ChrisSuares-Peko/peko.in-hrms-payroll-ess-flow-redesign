const notification = require('./../entities/notification')
const credentials = require('./../entities/credential')
// const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
// const moment = require('moment')
const {
    Op
} = require("sequelize");
const Pusher = require('pusher');
const { PUSHER_CONFIG } = require('../../utils/pusherConfig');
const { customLog } = require('../../utils/loggerHelper');

const pusher = new Pusher({
    ...PUSHER_CONFIG,
    encrypted: true
})

// eslint-disable-next-line no-unused-vars
const createNotification = async (data, credentialId = null, partnerId = undefined) => {
    try {
        let customerOutletNames;
        if (data.notificationCategory == 'CORPORATE') {
            if (Array.isArray(data.notificationTo)) {
                const bulkObject = data.notificationTo.map(username => ({
                    notificationTitle: data.notificationTitle,
                    notificationBrief: data.notificationBrief,
                    notificationCategory: data.notificationCategory,
                    notificationBy: data.notificationBy,
                    notificationTo: username
                }));

                const createdData = await notification.bulkCreate(bulkObject);

                data.notificationTo.forEach(username => {
                    pusher.trigger('push-notification', 'real-time-notification', {
                        body: username
                    });
                });

                return createdData;
            } else if (data.notificationTo == 'ALL') {
                const whereClause = {
                    role: data.notificationCategory
                };
                if (partnerId !== undefined) {
                    whereClause.registeredBy = partnerId;
                }

                let customerOutletNames = await credentials.findAll({
                    where: whereClause,
                    attributes: ["username","registeredBy"]
                });

                const bulkObject = customerOutletNames.map(user => ({
                    notificationTitle: data.notificationTitle,
                    notificationBrief: data.notificationBrief,
                    notificationTo: user.username,
                    notificationCategory: data.notificationCategory,
                    notificationBy: data.notificationBy || 'ADMIN'
                }));

                const createdData = await notification.bulkCreate(bulkObject);

                customLog(null, "info", {
                    action: 'notification:broadcastScoped',
                    category: data.notificationCategory,
                    registeredBy: partnerId ?? null,
                    isScoped: partnerId !== undefined,
                    recipients: bulkObject.length,
                    created: createdData?.length ?? 0
                });

                customerOutletNames.forEach(user => {
                    try {
                        pusher.trigger('push-notification', 'real-time-notification', {
                            body: user.username
                        });
                    } catch (pushError) {
                        customLog(null, "error", {
                            action: 'notification:pushFailed',
                            notificationTo: user.username,
                            error: pushError
                        });
                    }
                });

                // bulkObject.forEach(username => {
                //     pusher.trigger('push-notification', 'real-time-notification', {
                //         body: username.notificationTo
                //     });
                // });

                // const createdData = await notification.create(data);

                return createdData;
            }   else if (typeof data.notificationTo === 'string') {

                const createdData = await notification.create(data);

                pusher.trigger('push-notification', 'real-time-notification', {
                    body: data.notificationTo
                });
                return createdData;
            }
        } else {
            if (data.notificationTo == "ALL") {
                const whereClause = {
                    role: data.notificationCategory
                };
                if (partnerId !== undefined) {
                    whereClause.registeredBy = partnerId;
                }

                customerOutletNames = await credentials.findAll({
                    where: whereClause,
                    attributes: ["username"]
                });

                const bulkObject = customerOutletNames.map(username => ({
                    notificationTitle: data.notificationTitle,
                    notificationBrief: data.notificationBrief,
                    notificationTo: username.username,
                    notificationCategory: data.notificationCategory,
                    notificationBy: data.notificationBy
                }));

                const createdData = await notification.bulkCreate(bulkObject);

                return createdData;
            } else {
                // JSON.parse({
                //     responseCode: '100',
                //     responseMessage: 'An error occurred while adding the notification'
                // })
            }
        }
    } catch (error) {
        console.log("ERROR BLOCK - ", error);
    } finally {
        console.log("NOTIFICATION CREATE ROUTE CALLED")
    }
}

const findOneNotification = async (params) => {
    try {
        return await notification.findOne({
            where: {
                notificationId: params.notificationId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("NOTIFICATION FIND ONE ROUTE CALLED")
    }
}

const findAllNotification = async (params) => {
    try {
        let notificationDataCount = await notification.count({
            where: {
                notificationTo: {
                   [Op.or]: [params.notificationTo, 'ALL']
                },
                flag: 0
            }
        });
        let resData = await notification.findAll({
            where: {
                notificationTo: {
                    [Op.or]: [params.notificationTo, 'ALL']
                },
                flag: {
                    [Op.eq]: 0
                },
            },
            order: [
                ['createdAt', 'DESC']
            ],
            // limit: 3
        })
        return {
            count: notificationDataCount,
            data: resData
        }
    } catch (error) {
        console.log(error)
    } finally {
        console.log("NOTIFICATION FIND ALL ROUTE CALLED")
    }
}

const updateNotification = async (params, data) => {
    try {
        return await notification.update(data, {
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("NOTIFICATION UPDATE ROUTE CALLED")
    }
}

const resetNotification = async (params) => {
    try {
        return await notification.update({ flag: true }, {
            where: { flag: 0, notificationTo: params.id }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("NOTIFICATION UPDATE ROUTE CALLED")
    }
}

/*const deleteNotification = async (params) => {
    try {
        return await notification.destroy({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("NOTIFICATION DELETE ROUTE CALLED")
    }
}*/
const deleteNotification = async (params) => {
    return await notification.destroy({
        where: {
            id: params.id
        }
    })
}


const findAllNotificationCount = async (start, from, to, length, draw, corporateId, searchText, order, column) => {
    const sortableColumns = [
        'createdAt',
        'notificationTitle',
        'notificationBrief',
        'notificationCategory',
        'notificationTo',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    try {
        let whereClause = {
            createdAt: {
                [Op.between]: [from, to]
            },
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                notificationTitle: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                notificationBrief: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                notificationCategory: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                notificationTo: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                notificationBy: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        }
        if (corporateId != undefined) {
            whereClause.notificationTo = {
                [Op.or]: [corporateId, 'ALL']
            }
        }
        return await notification.findAndCountAll({
            where: whereClause,
            order: [
                [column, order]
            ],
            limit: length,
            offset: start
        })
    } catch (error) {
        console.log(error);
    }
}

const getExcel = async (params) => {
    let {
        from,
        to,
    } = params
    let data = await notification.findAndCountAll({
        where: {
            createdAt: {
                [Op.between]: [from, to]
            }
        },
        raw: true
    })
    let finalData = []
    data.rows.forEach(function (limitData) {
        finalData.push({
            'ID': limitData.id,
            'Title': limitData.notificationTitle ? limitData.notificationTitle : 'Not Available',
            'Breif': limitData.notificationBrief ? limitData.notificationBrief : 'Not Available',
            'Category': limitData.notificationCategory ? limitData.notificationCategory : 'Not Available',
            'To': limitData.notificationTo ? limitData.notificationTo : 'Not Available',
            'By': limitData.notificationBy ? limitData.notificationBy : 'Not Available',
            'Created At': limitData.createdAt ? limitData.createdAt : 'Not Available',

        })
    })
    return finalData
}

module.exports = {
    getExcel,
    createNotification,
    findOneNotification,
    findAllNotification,
    updateNotification,
    deleteNotification,
    findAllNotificationCount,
    resetNotification
}