/* eslint-disable no-undef */
const {
     createNotification,
     findAllNotification,
     findAllNotificationCount,
     updateNotification,
     deleteNotification,
     resetNotification,
     notificationAndCountExport,
} = require('../../models/use-cases/notification')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const puppeteer = require('puppeteer')
const fs = require('fs')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')

exports.createNotification = async (req, res) => {
     try {
         const data = req.body
         let result = await createNotification(data)
         if (!result) {
             return res.status(500).json({
                 status: 'false',
                 message: "Something went wrong",
                 data: {},
                 responseCode: '001'
             });
         }
         res.send({
             status: true,
             message: 'Notification created successfully',
             data: {},
             responseCode: '000'
         })
     } catch (e) {
         res.send({
             status: false,
             message: e.message,
             data: {},
             responseCode: '001'
         })
     }
 };

exports.findAllNotification = async (req, res) => {
     try {
          let username
          let userCreatedAt = req.user.createdAt
          if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
               username = req.user.subCorporateUsername
               // session createdAt is the parent corporate's; let the use-case resolve the sub user's own credential createdAt
               userCreatedAt = undefined
          } else {
               username = req.user.username
          }
          let result = await findAllNotification(username, userCreatedAt)
          res.send({
               status: true,
               message: 'Fetched all notifications successfully!!',
               data: result,
               responseCode: '000',
          })
     } catch (e) {
          res.send({
               status: false,
               message: e.message,
               data: {},
               responseCode: '001',
          })
     }
}

exports.findAllNotificationCount = async (req, res) => {
     try {
          const page = parseInt(req.query.page) || 1
          const pageSize = parseInt(req.query.pageSize) || 10
          let from = req.query.fromDate
          let to = req.query.toDate
          let searchText = req.query.search || ''
          let order = req.query.orderCol || 'ASC'
          let column = (req.query.sortField)||'createdAt'
          // let corporateId = req.user.username

          let corporateId;
          let userCreatedAt = req.user.createdAt;
          if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
              corporateId = req.user.subCorporateUsername;
              // session createdAt is the parent corporate's; let the use-case resolve the sub user's own credential createdAt
              userCreatedAt = undefined;
          } else {
              corporateId = req.user.username;
          }

          if (!from && !to) {
               let today = new Date()
               from = today.toISOString().split('T')[0]
               to = today.toISOString().split('T')[0]
          }

          const notificationData = await findAllNotificationCount(from, to, corporateId, searchText, order, column, page, pageSize, userCreatedAt)
          return res.json({
               status: 'true',
               message: 'Fetched all notifications successfully',
               data: {
                    recordsTotal: notificationData.count,
                    data: notificationData.rows,
               },
               responseCode: '000',
          })
     } catch (error) {
          console.error(error)
          return res.status(500).json({
               status: 'false',
               message: error.message,
               data: {},
               responseCode: '001',
          })
     }
}
exports.updateNotification = async (req, res) => {
    try {
        let username;
        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            username = req.user.subCorporateUsername;
        } else {
            username = req.user.username;
        }
        let params = { ...req.params, username };
        // only the read/unread flag is corporate-editable here — never the broadcast
        // content (notificationTitle/Brief/To/By), which this row's 'flag' toggle is not.
        let data = { flag: req.body.flag };
        await updateNotification(params, data);
        res.send({
            status: true,
            message: 'Updated successfully!',
            data: {},
            responseCode: '000'
        })
    } catch (e) {
        res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001'
        })
    }
};

exports.resetNotificationCountToZero = async (req, res) => {
     try {
         let username;
        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            username = req.user.subCorporateUsername;
        } else {
            username = req.user.username;
        }
          await resetNotification(username)
          res.send({
               status: true,
               message: 'updated successfully',
               data: {},
               responseCode: '000',
          })
     } catch (error) {
          customLog(req?.LogTraceId, "error", { message: "resetNotificationCountToZero", error: error?.response ?? error })
     }
}

exports.deleteNotification = async (req, res, next) => {
     let params = req.params
     const result = await deleteNotification(params);
     if (!result) {
         return next(new ErrorResponse(`Something went wrong while deleting `, 500))
     } else {
         return res.status(200).json({
             'status': true,
             'message': 'notification deleted successfully',
             'data': {},
             'responseCode': '000'
         })
     }
 }

exports.notificationAndCountExcelCSV = async (req, res, next) => {
     let corporateId = req.query.corporateId || undefined
     let { from, to, searchText } = req.query
     let { type } = req.params
     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     const data = await notificationAndCountExport(from, to, corporateId, searchText, sort, sortField)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     } else {
          const { buffer, fileType } = await generateExcelBufferAndType(data, type)
          return res.status(200).json({
               status: true,
               data: { buffer, fileType },
               message: 'Fetched excel/csv datas successfully',
               responseCode: '000',
          })
     }
}

exports.notificationAndCountPDF = async (req, res, next) => {
     let corporateId = req.query.corporateId || undefined
     let { from, to, searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     const data = await notificationAndCountExport(from, to, corporateId, searchText, sort, sortField)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }
     const templateDetails = {
          title: 'Notifications',
     }
     const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails)
     let random = new Date().valueOf()

     // Create a browser instance with Puppeteer
     const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
     })
     const page = await browser.newPage()

     // Set content to the page
     await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })

     // Generate PDF using Puppeteer
     const outputFile = `report-${random}.pdf`
     await page.pdf({
          path: outputFile,
          format: 'A4',
          preferCSSPageSize: true,
     })

     console.log('PDF generated successfully!')

     const buffer = fs.readFileSync(outputFile)

     browser.close()

     fs.unlinkSync(outputFile)

     return res.status(200).json({
          status: true,
          message: 'report generated successfully.',
          data: {
               buffer,
               fileType: 'application/pdf',
          },
          responseCode: '000',
     })
}
exports.findAllNotificationAndCount = async (req, res) => {
     let corporateId = req.query.corporateId || undefined
     let { from, to, searchText, page, itemsPerPage } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     const notificationData = await findAllNotificationCount(from, to, corporateId, searchText, sort, sortField, page, itemsPerPage)
     res.json({
          status: true,
          data: {
               recordsTotal: notificationData.count,
               recordsFiltered: notificationData.count,
               data: notificationData.rows,
          },
          message: 'Records fetched successfully',
          responseCode: '000',
     })
}
