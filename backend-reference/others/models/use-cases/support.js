/* eslint-disable no-prototype-builtins */
const messages = require('./../entities/support')
const systemUser = require('./../entities/systemUser')
const credential = require('./../entities/credential')
const corporateUser = require('./../entities/corporateUser')
const { Op } = require('sequelize')
const asyncHandler = require('./../../middlewares/async')
const { formattedDateTime } = require('../../utils/formatter')
const { uploadFile } = require('../../utils/commonUploadFile')

module.exports.create = asyncHandler(async (params, user) => {
     if (Object.prototype.hasOwnProperty.call(params, "screenshot") && params.screenshotImageFormat) {
       const filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"
       }/${user?.username ? user?.username : "unknown-user"}/screenshot`
       const publicUrl = await uploadFile(params.screenshot, filePath, params.screenshotImageFormat);
       params.screenshotImage = publicUrl;
     }
     return await messages.create(params);
   });

   module.exports.update = asyncHandler(async (params, data, user) => {
     if (Object.prototype.hasOwnProperty.call(data, "screenshot") && data.screenshotImageFormat) {
       const filePath = `${
       user?.role ? user?.role.toLowerCase() : "unknown-role"
       }/${user?.username ? user?.username : "unknown-user"}/screenshot`
       const publicUrl = await uploadFile(data.screenshot, filePath, data.screenshotImageFormat);
       data.screenshotImage = publicUrl;
     }
     
     return await messages.update(data, {
       where: {
         id: params.id,
       },
     });
   });

   module.exports.findAllMessage = asyncHandler(async (params) => {
     try {
       let {
         from, to, limit, offset, searchText, sort, column, status, corporateId, module, registeredBy
       } = params;
     
       // Adjust 'to' date to include the whole day
       const tomorrow = new Date(to);
       tomorrow.setDate(tomorrow.getDate() + 1);
       tomorrow.setHours(0, 0, 0, 0);
     
       const whereClause = {
         createdAt: {
           [Op.between]: [from, tomorrow],
         },
         [Op.or]: [
           { id: { [Op.like]: "%" + searchText + "%" } },
           { issueType: { [Op.like]: "%" + searchText + "%" } },
           { module: { [Op.like]: "%" + searchText + "%" } },
           { description: { [Op.like]: "%" + searchText + "%" } },
         ],
       };
     
       if (status && status !== 'all') {
         whereClause.status = status;
       }
     
       if (module) {
         whereClause.module = { [Op.like]: "%" + module + "%" };
       }
     
       if (corporateId) {
         whereClause.corporateUserId = corporateId; // Add corporateId filter
       }
   
       let whereClauseCredential = {};
       if (registeredBy) {
         whereClause['$corporateUser.credential.registeredBy$'] = registeredBy;
       }
     
       const include = [
         {
           model: corporateUser,
           attributes: ["id", "credentialId", "registeredBy"],
           include: [
             {
               model: credential,
               where: whereClauseCredential,
               attributes: ["id", "name", "email"],
             },
           ],
         },
         {
           model: systemUser,
           attributes: ["id", "credentialId", "registeredBy"],
           include: [
             {
               model: credential,
               attributes: ["id", "name", "email"],
             },
           ],
         },
       ];
   
       const result = await messages.findAndCountAll({
         include: include,
         where: whereClause,
         order: [[column, sort]],
         limit: limit,
         offset: offset,
       });
   
       return result;
   
     } catch (error) {
       console.log(error);
       throw new Error('Something went wrong while fetching messages');
     }
   });

module.exports.findAllTickets = asyncHandler(async (params) => {
     let {
          from,
          to,
          module,
          searchText,
          // sort,
          // filter,
          limit,
          offset,
          corporateId,
          excludeAttribute,
     } = params

     const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
     const safeSearch = escapeLike((searchText || "").toLowerCase());

     // Adjust 'to' date to end of day
     const tomorrow = new Date(to)
     tomorrow.setDate(tomorrow.getDate() + 1)
     tomorrow.setHours(0, 0, 0, 0)

     const whereClause = {
          createdAt: {
               [Op.between]: [from, tomorrow],
          },
          [Op.or]: [
               { id: { [Op.like]: `%${safeSearch}%` } },
               { issueType: { [Op.like]: `%${safeSearch}%` } },
               { module: { [Op.like]: `%${safeSearch}%` } },
               { description: { [Op.like]: `%${safeSearch}%` } },
             ],
             
     }

     if (module && module !== 'all') {
          whereClause.module = module
     }

     // Add the condition for filtering by corporateUserId
     if (corporateId) {
          whereClause.corporateUserId = corporateId
     }

     // Build and execute the query
     const result = await messages.findAndCountAll({
          where: whereClause,
          limit: limit,
          order: [['createdAt', 'DESC']],
          offset: offset,
          attributes: {
               exclude: excludeAttribute,
          },
     })

     return result
})

module.exports.getExcel = asyncHandler(async (params) => {
     let { registeredBy, from, to, order, column, status, corporateUserId } = params

     // Create a where clause object
     const whereClause = {
          createdAt: {
               [Op.between]: [from, to],
          },
     }

     if (status && status !== 'all') {
          whereClause.status = status
     }
     if (corporateUserId) {
          whereClause.corporateUserId = corporateUserId
     }

     if (typeof registeredBy !== 'undefined') {
          whereClause['$corporateUser.credential.registeredBy$'] = registeredBy
     }
     const include = [
          {
               model: corporateUser,
               attributes: ['id', 'credentialId', 'registeredBy'],
               include: [
                    {
                         model: credential,
                    },
               ],
          },
          {
               model: systemUser,
               attributes: ['id', 'credentialId', 'registeredBy'],
               include: [
                    {
                         model: credential,
                    },
               ],
          },
     ]

     // Build and execute the query
     let data = await messages.findAndCountAll({
          include: include,
          where: whereClause,
          order: [[column, order]],
     })

     let finalData = []
     data.rows.forEach(function (limitData) {
          finalData.push({
               'Corporate ID': limitData.corporateUser.credential.name ? limitData.corporateUser.credential.name : 'Not AVailable',
               'Issue Type': limitData.issueType ? limitData.issueType : 'Not Available',
               Module: limitData.module ? limitData.module : 'Not Available',
               Status: limitData.status ? limitData.status : 'Not Available',
               Description: limitData.description ? limitData.description : 'Not Available',
          })
     })
     return finalData
})

module.exports.allMessages = async () => {
     try {
          return await messages.findAll({})
     } catch (error) {
          console.log(error)
     } finally {
          console.log('NOTIFICATION FIND ALL ROUTE CALLED')
     }
}

module.exports.createChatMessage = async (params) => {
     let { supportId, message, isAdmin, date, name } = params
     try {
          const support = await messages.findOne({
               where: {
                    id: supportId,
               },
          })

          if (!support) {
               throw new Error('Support not found')
          }

          // Fetch the existing chats data
          let existingChats = support.getDataValue('chats') || []

          // Push the new chat object into the array
          existingChats.push({
               message,
               name,
               admin: isAdmin,
               date,
          })

          // Update the chats field with the modified array
          support.setDataValue('chats', existingChats)

          // Save the model to the database
          await support.save()

          return support
     } catch (error) {
          console.error('Error creating chat message:', error)
          throw error
     }
}

module.exports.findAllChats = asyncHandler(async (id) => {
     return await messages.findAll({
          where: {
               id: id,
          },
     })
})

module.exports.createBBPSWebhooks = async (bbpsRefId, data) => {
     try {
          const support = await messages.findOne({
               where: {
                    bbpsSupportRefId: bbpsRefId,
               },
          })

          if (!support) {
               throw new Error('Support not found')
          }
          // Fetch the existing bbps Support History data
          let existingHistory = support.getDataValue('bbpsSupportHistory') || []

          // Push the new bbps support object into the array
          existingHistory.push(data)

          // Update the chats field with the modified array
          support.setDataValue('bbpsSupportHistory', existingHistory)

          // Save the model to the database
          await support.save()

          return support
     } catch (error) {
          console.error('Error creating chat message:', error)
          throw error
     }
}

module.exports.createChatMessageOnSocket = async (params) => {
     let { supportId, message, admin, date, name } = params
     try {
          const support = await messages.findOne({
               where: {
                    id: supportId,
               },
          })

          if (!support) {
               throw new Error('Support not found')
          }

          // Fetch the existing chats data
          let existingChats = support.getDataValue('chats') || []

          // Push the new chat object into the array
          existingChats.push({
               message,
               name,
               admin,
               date,
          })

          // Update the chats field with the modified array
          support.setDataValue('chats', existingChats)

          // Save the model to the database
          await support.save()

          return support
     } catch (error) {
          console.error('Error creating chat message:', error)
          return error
     }
}

module.exports.findOneTicket = asyncHandler(async (params) => {
     return await messages.findOne({
          where: {
               id: params.id,
          },
     })
})

module.exports.Delete = asyncHandler(async (params) => {
     return await messages.destroy({
          where: {
               id: params.id,
          },
     })
})

module.exports.findOneTicketWithTicketId = asyncHandler(async (id) => {
     return await messages.findOne({
       where: {
         ticketId: id,
       },
       raw: true
     });
   });

   module.exports.updateWithTicketId = asyncHandler(async (ticketId, data, corporateUserId) => {

     return await messages.update(data, {
       where: {
         ticketId,
         corporateUserId,
       },
     });
   });

   module.exports.DeleteWithTicketId = asyncHandler(async (ticketId, corporateUserId) => {
     return await messages.destroy({
       where: {
         ticketId,
         corporateUserId,
       },
     });
   });

   module.exports.fetchReportData = async (params) => {
     try {
       let {
         from,
         to,
         searchText,
         sort,
         sortField,
         status,
       } = params;
   
       searchText = searchText || "";
   
       let whereClause = {};
   
       if (from && to) {
         const toDate = new Date(to);
         toDate.setDate(toDate.getDate() + 1);
         toDate.setHours(0, 0, 0, 0);
 
         whereClause.createdAt = {
           [Op.between]: [from, toDate],
         };
       }
   
       whereClause[Op.or] = [
         { id: { [Op.like]: `%${searchText}%` } },
         { issueType: { [Op.like]: `%${searchText}%` } },
         { module: { [Op.like]: `%${searchText}%` } },
         { description: { [Op.like]: `%${searchText}%` } },
       ];
   
       if (status && status !== "all") {
         whereClause.status = status;
       }
   
       const include = [
         {
           model: corporateUser,
           attributes: ["id", "credentialId", "registeredBy"],
           include: [
             {
               model: credential,
               attributes: ["id", "name", "email"],
             },
           ],
         },
         {
           model: systemUser,
           attributes: ["id", "credentialId", "registeredBy"],
           include: [
             {
               model: credential,
               attributes: ["id", "name", "email"],
             },
           ],
         },
       ];
   
       const result = await messages.findAndCountAll({
         include,
         where: whereClause,
         order: [[sortField, sort]],
       });
   
       return result.rows.map(limitData => ({
         "Created Date": limitData.createdAt
           ? formattedDateTime(limitData.createdAt)
           : "Not Available",
         "Ticket Number": limitData.ticketId || "Not Available",
         "Customer Name":
           limitData?.corporateUser?.credential?.name || "Not Available",
         "Issue Type": limitData.issueType || "Not Available",
         Module: limitData.module || "Not Available",
         Description: limitData.description || "Not Available",
       }));
   
     } catch (error) {
       console.log(error);
       throw { message: "Something went wrong" };
     }
   };