const { Op } = require('sequelize')
const asyncHandler = require('../../middlewares/async')
const invoiceTemplete = require('../entities/invoiceTemplete')
const { customLog } = require('../../utils/loggerHelper')

exports.create = asyncHandler(async (params) => {
     try {
          const response = await invoiceTemplete.create(params)
          return response
     } catch (error) {
          console.error('Error occurred while bulk creating:', error)
          return false
     }
})

exports.getAllTemplete = asyncHandler(async (status) => {
     let whereClause = {}
     if (status) {
          whereClause.status = status
     }
     const responseData = await invoiceTemplete.findAndCountAll({
          where: whereClause,
          order: [['createdAt', 'DESC']],
          raw: true,
          nest: true,
     })
     if (!responseData) {
          return false
     }
     return responseData
})

exports.getAllTemplatesAdmin = asyncHandler(async (params) => {
     try {
          let { limit, offset, searchText, sort, sortField } = params
                  return await invoiceTemplete.findAndCountAll({
                       where: {
                            [Op.or]: [
                                 {
                                      type: {
                                           [Op.like]: '%' + searchText + '%',
                                      },
                                 },
                                 {
                                      subject: {
                                           [Op.like]: '%' + searchText + '%',
                                      },
                                 },
                                 {
                                      body: {
                                           [Op.like]: '%' + searchText + '%',
                                      },
                                 },
                            ],
                       },
                       order: [[sortField, sort]],
                       limit,
                       offset,
                       raw: true,
                       nest: true,
                  })
     } catch (error) {
            console.log(error)
            throw { message: 'Something went wrong' }
     }
})

exports.getHtmlTemplates = asyncHandler(async () => {
     return await invoiceTemplete.findAll({
          where: { type: 'invoiceTemplate', status: true },
          attributes: ['id', 'subject', 'imageUrl'],
          order: [['createdAt', 'DESC']],
          raw: true,
     })
})

exports.findTemplateForDownload = async (templateId) => {
     try {
          if (templateId) {
               const tmpl = await invoiceTemplete.findOne({
                    where: { id: templateId, type: 'invoiceTemplate', status: true },
                    attributes: ['id', 'subject', 'body'],
                    raw: true,
               })
               if (tmpl) return tmpl
          }
          // fallback to first active invoice template
          return await invoiceTemplete.findOne({
               where: { type: 'invoiceTemplate', status: true },
               attributes: ['id', 'subject', 'body'],
               order: [['createdAt', 'DESC']],
               raw: true,
          })
     } catch (error) {
          customLog(null, 'error', { error: error.message })
          return null
     }
}

exports.findTemplateById = async (id) => {
     try {
          return await invoiceTemplete.findOne({
               where: { id },
               attributes: ['id', 'imageUrl'],
               raw: true,
          })
     } catch (error) {
          customLog(null, 'error', { error: error.message })
          return null
     }
}

exports.updateTemplate = asyncHandler(async (params, data) => {
     return await invoiceTemplete.update(data, {
          where: {
               id: params.id,
          },
     })
})

exports.deleteTemplate = asyncHandler(async (params) => {
     return await invoiceTemplete.destroy({
          where: {
               id: params.id,
          },
     })
})
