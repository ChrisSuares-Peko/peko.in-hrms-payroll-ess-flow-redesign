const asyncHandler = require('../../middlewares/async')
const { create, updateTemplate, deleteTemplate, getAllTemplatesAdmin, findTemplateById } = require('../../models/use-cases/invoiceTemplete')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { uploadFile: uploadFileToFirebase, deleteFile: deleteFromFirebase } = require('../../utils/commonUploadFile')

exports.createInvoiceTemplete = asyncHandler(async (req, res, next) => {
     try {
          let data = { ...req.body }
          const { image, ...rest } = data
          data = { ...rest }

          if (image?.imageBase && data.type === 'invoiceTemplate') {
               const base64 = image.imageBase.includes('base64,') ? image.imageBase.split('base64,')[1] : image.imageBase
               data.imageUrl = await uploadFileToFirebase(base64, 'invoice-templates', image.imageFormat, 5)
          }

          const result = await create(data)
          if (!result) {
               return next(new ErrorResponse(`Something went wrong while adding invoice templete`, 500))
          } else {
               return res.status(200).json({
                    status: true,
                    data: result,
                    message: 'Invoice templete added successfully',
                    responseCode: '000',
               })
          }
     } catch (error) {
          customLog(req?.LogTraceId, 'error', { error: error.message })
          return res.status(500).json({
               status: false,
               message: 'Something went wrong',
               data: {},
               responseCode: '001',
          })
     }
})

exports.getAllTemplateAndCount = asyncHandler(async (req, res, next) => {
     try {
          let { searchText, page, itemsPerPage } = req.query
          const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
          let sortField = req.query.sortField || 'createdAt'
          page = page ? parseInt(page) : 1
          itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null
          let limit = itemsPerPage

          let offset
          if (page && itemsPerPage) {
               offset = (page - 1) * itemsPerPage
          }
          let params = {
               limit,
               offset,
               searchText,
               sort,
               sortField,
          }
          const result = await getAllTemplatesAdmin(params)
          if (!result) {
               return next(new ErrorResponse(`Something went wrong while getting templete`, 500))
          } else {
               const rows = result.rows
               return res.status(200).json({
                    status: true,
                    data: {
                         recordsTotal: result ? result.count : 0,
                         data: rows,
                    },
                    message: 'Templete fetched successfully',
                    responseCode: '000',
               })
          }
     } catch (error) {
          return res.status(500).json({
               status: false,
               message: 'Something went wrong',
               data: {},
               responseCode: '001',
          })
     }
})

exports.updateInvoiceTemplate = asyncHandler(async (req, res, next) => {
     let params = req.params
     let data = { ...req.body }
     const { image, ...rest } = data
     data = { ...rest }

     if (image?.imageBase) {
          const existing = await findTemplateById(params.id)
          if (existing?.imageUrl) await deleteFromFirebase(existing.imageUrl).catch(() => null)
          const base64 = image.imageBase.includes('base64,') ? image.imageBase.split('base64,')[1] : image.imageBase
          data.imageUrl = await uploadFileToFirebase(base64, 'invoice-templates', image.imageFormat, 5)
     }

     const result = await updateTemplate(params, data)
     if (result[0] === 0) {
          return next(new ErrorResponse(`Something went wrong while updating the template`, 500))
     } else {
          return res.status(200).json({
               status: true,
               message: 'Templates updated successfully',
               data: {},
               responseCode: '000',
          })
     }
})

exports.deleteInvoiceTemplate = asyncHandler(async (req, res, next) => {
     let params = req.params
     const result = await deleteTemplate(params)
     if (!result) {
          return next(new ErrorResponse(`Something went wrong while deleting the referral code`, 500))
     } else {
          return res.status(200).json({
               status: true,
               message: 'Referral code deleted successfully',
               data: {},
               responseCode: '000',
          })
     }
})

exports.updateTemplateStatus = asyncHandler(async (req, res, next) => {
     let params = req.params
     let data = req.body
     let result = await updateTemplate(params, data)
     if (!result) {
          return next(new ErrorResponse(`Something went wrong while updating status`, 500))
     } else {
          return res.status(200).json({
               status: true,
               message: 'Status updated successfully',
               data: {},
               responseCode: '000',
          })
     }
})
