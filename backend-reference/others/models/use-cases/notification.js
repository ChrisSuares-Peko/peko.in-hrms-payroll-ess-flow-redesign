/* eslint-disable no-undef */
const notification = require('./../entities/notification')
const credentials = require('./../entities/credential')
const { Op } = require('sequelize')
const Pusher = require('pusher')
const { handleSortFields } = require('../../utils/sortHandle')
const { formattedDateTime } = require('../../utils/formatter')
const { PUSHER_CONFIG } = require('../../utils/pusherConfig')

const pusher = new Pusher({
     ...PUSHER_CONFIG,
     encrypted: true
 })

const createNotification = async (data) => {
     try {
          let customerOutletNames
          if (data.notificationCategory == 'CORPORATE') {
               if (Array.isArray(data.notificationTo)) {
                    const bulkObject = data.notificationTo.map((username) => ({
                         notificationTitle: data.notificationTitle,
                         notificationBrief: data.notificationBrief,
                         notificationCategory: data.notificationCategory,
                         notificationBy: data.notificationBy,
                         notificationTo: username,
                    }))

                    const createdData = await notification.bulkCreate(bulkObject)

                    data.notificationTo.forEach((username) => {
                         pusher.trigger('push-notification', 'real-time-notification', {
                              body: username,
                         })
                    })

                    return createdData
               } else if (typeof data.notificationTo === 'string') {
                    if (data.notificationTo === 'ALL') {
                         const allCorporates = await credentials.findAll({
                              where: { role: 'CORPORATE' },
                              attributes: ['username'],
                         })
                         const bulkObject = allCorporates.map((u) => ({
                              notificationTitle: data.notificationTitle,
                              notificationBrief: data.notificationBrief,
                              notificationCategory: data.notificationCategory,
                              notificationBy: data.notificationBy,
                              notificationTo: u.username,
                         }))
                         const createdData = await notification.bulkCreate(bulkObject)
                         allCorporates.forEach((u) => {
                              pusher.trigger('push-notification', 'real-time-notification', {
                                   body: u.username,
                              })
                         })
                         return createdData
                    }
                    const createdData = await notification.create(data)

                    pusher.trigger('push-notification', 'real-time-notification', {
                         body: data.notificationTo,
                    })
                    return createdData
               }
          } else {
               if (data.notificationTo == 'ALL') {
                    customerOutletNames = await credentials.findAll({
                         where: {
                              role: data.notificationCategory,
                         },
                         attributes: ['username'],
                    })

                    const bulkObject = customerOutletNames.map((username) => ({
                         notificationTitle: data.notificationTitle,
                         notificationBrief: data.notificationBrief,
                         notificationTo: username.username,
                         notificationCategory: data.notificationCategory,
                         notificationBy: data.notificationBy,
                    }))

                    const createdData = await notification.bulkCreate(bulkObject)

                    return createdData
               } else {
                    res.json({
                         responseCode: '100',
                         responseMessage: 'An error occurred while adding the notification',
                    })
               }
          }
     } catch (error) {
          console.log('ERROR BLOCK - ', error)
     } finally {
          console.log('NOTIFICATION CREATE ROUTE CALLED')
     }
}

// Single-recipient insert for cross-service callers (e.g. corporateCard, which has its own database and
// cannot write this table directly) — preserves whatever notificationCategory it is given, unlike
// createNotification's 'CORPORATE'-branching fan-out above which is for the admin broadcast panel.
const createInternalNotification = async ({ notificationTitle, notificationBrief, notificationCategory, notificationTo, notificationBy }) => {
     const created = await notification.create({ notificationTitle, notificationBrief, notificationCategory, notificationTo, notificationBy })
     pusher.trigger('push-notification', 'real-time-notification', { body: notificationTo })
     return created
}

const findAllNotification = async (params, userCreatedAt) => {
     try {
         if (!userCreatedAt) {
             const user = await credentials.findOne({
                 where: { username: params },
                 attributes: ['createdAt'],
             })
             userCreatedAt = user?.createdAt || new Date()
         }

         const whereClause = {
             [Op.or]: [
                 { notificationTo: params },
                 { notificationTo: 'ALL', createdAt: { [Op.gte]: userCreatedAt } },
             ],
         }

         let notificationDataCount = await notification.count({
             where: { ...whereClause, flag: 0 },
         })
         let resData = await notification.findAll({
             where: whereClause,
             order: [['createdAt', 'DESC']],
             limit: 5,
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
                    id: params.id,
                    notificationTo: params.username,
               },
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('NOTIFICATION UPDATE ROUTE CALLED')
     }
}

const resetNotification = async (username) => {
     try {
         return await notification.update({ flag: true }, {
             where: {
                 flag: 0,
                 [Op.or]: [
                     { notificationTo: username },
                     { notificationTo: 'ALL' },
                 ],
             },
         })
     } catch (error) {
         console.log(error)
     } finally {
         console.log("NOTIFICATION UPDATE ROUTE CALLED")
     }
 }

const deleteNotification = async (params) => {
     return await notification.destroy({
          where: {
               id: params.id,
          },
     })
}

const notificationAndCountExport = async (
     from,
     to,
     corporateId,
     searchText,
     sort,
     sortField
) => {
     let order = handleSortFields(sortField, sort);

     searchText = searchText || "";

     try {
          let whereClause = {
               [Op.or]: [
                    { id: { [Op.like]: `%${searchText}%` } },
                    { notificationTitle: { [Op.like]: `%${searchText}%` } },
                    { notificationBrief: { [Op.like]: `%${searchText}%` } },
                    { notificationCategory: { [Op.like]: `%${searchText}%` } },
                    { notificationTo: { [Op.like]: `%${searchText}%` } },
                    { notificationBy: { [Op.like]: `%${searchText}%` } },
               ],
          };

          if (from && to) {
               const tomorrow = new Date(to);
               tomorrow.setDate(tomorrow.getDate() + 1);
               tomorrow.setHours(0, 0, 0, 0);

               whereClause.createdAt = {
                    [Op.between]: [from, tomorrow],
               };
          }

          if (corporateId !== undefined) {
               const userRec = await credentials.findOne({
                    where: { username: corporateId },
                    attributes: ['createdAt'],
               })
               const userCreatedAt = userRec?.createdAt || new Date()
               whereClause[Op.and] = (whereClause[Op.and] || []).concat([{
                    [Op.or]: [
                         { notificationTo: corporateId },
                         { notificationTo: 'ALL', createdAt: { [Op.gte]: userCreatedAt } },
                    ],
               }])
          }

          const data = await notification.findAndCountAll({
               where: whereClause,
               order,
          })

          let finalData = [];
          data.rows.forEach((limitData) => {
               finalData.push({
                    "Notification Date": limitData.createdAt
                         ? formattedDateTime(limitData.createdAt)
                         : "Not Available",
                    "Notification Title": limitData.notificationTitle || "Not Available",
                    "Notification Brief": limitData.notificationBrief || "Not Available",
                    "Notification Category":
                         limitData.notificationCategory || "Not Available",
                    "Notification To": limitData.notificationTo || "Not Available",
               })
          })
          return finalData
     } catch (error) {
          console.error(error)
          throw { message: "Something went wrong" };
     }
}

const findAllNotificationCount = async (
     from,
     to,
     corporateId,
     searchText,
     sort,
     sortField,
     page,
     pageSize,
     userCreatedAt
) => {
     const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
     const safeSearch = escapeLike((searchText || "").toLowerCase());

     let order = [[sortField, sort]];

     const tomorrow = new Date(to);
     tomorrow.setDate(tomorrow.getDate() + 1);
     tomorrow.setHours(0, 0, 0, 0);

     let whereClause = {};

     if (safeSearch) {
          whereClause[Op.or] = [
               { id: { [Op.like]: `%${safeSearch}%` } },
               { notificationTitle: { [Op.like]: `%${safeSearch}%` } },
               { notificationBrief: { [Op.like]: `%${safeSearch}%` } },
               { notificationCategory: { [Op.like]: `%${safeSearch}%` } },
               { notificationTo: { [Op.like]: `%${safeSearch}%` } },
               { notificationBy: { [Op.like]: `%${safeSearch}%` } },
          ];
     }

     if (from && to) {
          whereClause.createdAt = {
               [Op.between]: [from, tomorrow],
          };
     }

     if (corporateId) {
          if (!userCreatedAt) {
               const userRec = await credentials.findOne({
                    where: { username: corporateId },
                    attributes: ['createdAt'],
               })
               userCreatedAt = userRec?.createdAt || new Date()
          }
          whereClause[Op.and] = (whereClause[Op.and] || []).concat([{
               [Op.or]: [
                    { notificationTo: corporateId },
                    { notificationTo: 'ALL', createdAt: { [Op.gte]: userCreatedAt } },
               ],
          }])
     }

     const { count, rows } = await notification.findAndCountAll({
          where: whereClause,
          order,
          limit: pageSize,
          offset: (page - 1) * pageSize,
     });

     return { count, rows };
}

module.exports = {
     createNotification,
     createInternalNotification,
     findAllNotification,
     updateNotification,
     deleteNotification,
     findAllNotificationCount,
     resetNotification,
     notificationAndCountExport,
}