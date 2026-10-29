/* eslint-disable no-unused-vars */
const asyncHandler = require("../../middlewares/async");

const {
    findOne: findOneServiceOperator
} = require('./../../models/use-cases/serviceOperator')
const ErrorResponse = require("../../utils/error-response");
const { fetchAllCancelledHotelBookings, fetchAllHotelBookings } = require('../../models/use-cases/hotels');
const orders = require("../../models/entities/order");
const credential = require("../../models/entities/credential");
const { refundWalletTransaction, getPartialRefundDetails } = require("../../utils/walletTransaction");
// const { refundCardTransaction } = require("../corporate/payment_gateway");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { createNotification } = require("../../models/use-cases/notification");
const accessKey = 'hotels_api'
const fs = require("fs");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { generateCancelledHotelsExportData, generateBookingExportData } = require("../../services/hotels");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { puppeteerPdfToFile } = require("../../utils/puppeteer");
const puppeteer = require('puppeteer');



exports.listAllCancelled = asyncHandler(async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
        let { from, to, searchText, credentialId,partnerId } = req.query;



        const bookingData = await fetchAllCancelledHotelBookings({ limit, page, credentialId,partnerId, from, to, searchText });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        // Return a standard success response
        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: {
                page: page,
                limit: limit,
                count: bookingData.count,
                bookings: bookingData.rows
            }
        })

    } catch (error) {
        console.log(error);
        return next(new ErrorResponse("Something went wrong", 400))
    }
});

exports.listAllCancelledExcelCSV = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let { from, to, searchText, credentialId,partnerId } = req.query;

    try {
        const bookingData = await fetchAllCancelledHotelBookings({ credentialId,partnerId, from, to, searchText });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateCancelledHotelsExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        } else {
            const { buffer, fileType } = await generateExcelBufferAndType(data, type)
            return res.status(200).json({
                'status': true,
                'data': { buffer, fileType },
                'message': 'Fetched excel/csv datas successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});
exports.listAllCancelledPDF = asyncHandler(async (req, res, next) => {
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let { from, to, searchText, credentialId,partnerId } = req.query;

    try {
        const bookingData = await fetchAllCancelledHotelBookings({ credentialId,partnerId, from, to, searchText });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateCancelledHotelsExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        }

        const templateDetails = {
            title: 'Hotel Bookings Cancellation Report'
        }
        const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
        let random = new Date().valueOf();
        const outputFile = `report-${random}.pdf`;

        // Use browser pooling for PDF generation
        const { status, buffer } = await puppeteerPdfToFile({
            html: reportHtmlWithStyle,
            outputFile,
            options: {
                scale: 0.6,
                format: 'A4',
                preferCSSPageSize: true
            }
        });

        // Clean up temp file
        try {
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        } catch (unlinkError) {
            // Ignore cleanup errors
        }

        if (!status || !buffer) {
            return next(new ErrorResponse('Failed to generate PDF', 500));
        }

        return res.status(200).json({
            status: true,
            message: 'report generated successfully.',
            data: {
                buffer,
                fileType: 'application/pdf'
            },
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});

exports.refundCancelledBooking = asyncHandler(async (req, res, next) => {
    try {
        let { corporateTxnId, refundAmount: requestedRefundAmount } = req.body
        // find order by corporateTxnId
        let order = await orders.findOne({
            where: { corporateTxnId },
            include: [{ model: credential }],
        })
        if (!order) return next(new ErrorResponse("No order found", 404))
        const { amountInINR, shipmentStatus, paymentMode, status } = order || {}
        const { totalCancellationCharges, refundDetails } = shipmentStatus || {}
        let { username, id } = order?.credential || {}

        if (status === 'REFUNDED') return next(new ErrorResponse('This is already refunded', 404))

        let partialRefund = refundDetails
        if (Number(partialRefund.refundAmount) !== Number(requestedRefundAmount)) { // update order table with new refund amount
            // need to re calculate new refund amount and charge
            const updatedCharges = Number(amountInINR) - Number(requestedRefundAmount)
            partialRefund = await getPartialRefundDetails({ corporateTxnId, refundAmount: requestedRefundAmount });
            order.shipmentStatus = {
                ...order.shipmentStatus,
                refundDetails: partialRefund,
                totalCancellationCharges: updatedCharges,
            };
            order.changed('shipmentStatus', true); // <-- Important especially for JSON fields
            await order.save();
        }

        //next need to refund the amount to the user after cancellation
        let { walletRefund, bankCardRefund, refundPercentage, refundAmount } = partialRefund
        let updateDetails = {
            corporateTxnId,
            status: "REFUNDED",
            providerId: order?.providerId || "Not Available",
            message: "Refund initiated",
            registeredById: order?.credential?.registeredBy || null,
        }

        if (refundPercentage < 100) { //if we fully refund not need to trigger partialRefund in wallet transaction
            updateDetails.partialRefund = partialRefund
        }
        let paymentData = JSON.parse(order?.paymentModeResponse)
        if (paymentMode == "WALLET") {
            await refundWalletTransaction(updateDetails)
        } 
        else if (paymentMode == "PAYMENT GATEWAY" || paymentMode == "PAYMENT GATEWAY + WALLET") {
            //need to get the amount to be refunded via card and wallet ,% of cash back to get return 
            const status = await cancelPGTransaction( corporateTxnId, refundAmount);
            // const { state = '' } = refundPGResponse || {}
            if (status.refundStatus==='SUCCESS') {
                await refundWalletTransaction(updateDetails);
            } else if(status.refundStatus==='PENDING') {
          
                //  await walletTransaction.update({
                                       
                //                         status: status.refundStatus
                //                     },{where: {
                //                         corporateTxnId: String(corporateTxnId),
                //                     },})
                return res.status(200).json({
                    status: true,
                    message: "Refund process initiated",
                    responseCode: "000",
                    data: {},
                });
            }  else {
                return next(new ErrorResponse('Apologies, Something went wrong while refunding', 400))
            }
        } 
        else {
            return next(new ErrorResponse(`Refund is not available for this payment mode`, 400));
        }
        //order table after successful--------------------
        order.shipmentStatus = {
            ...order.shipmentStatus,
            refundedDate: new Date(),
        };
        order.changed('shipmentStatus', true); // <-- Important especially for JSON fields
        await order.save();
        //------------------------------------------------
        
        //need to send notification to corporate about the amount refund
        const notificationData = {
            notificationTitle: 'Hotel Cancellation - Refund successful',
            notificationBrief: `Refund of ₹ ${formatNumberWithLocalString(refundAmount)} for Hotel cancellation was successful. Transaction ID: ${corporateTxnId}.`,
            notificationTo: [username], // Replace with the user ID or username to send the notification to
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN', // Replace with the user or system that triggered the notification
            accessKey,
            action: '1'
        };
        createNotification(notificationData, id);

        return res.status(200).json({
            status: true,
            message: 'Refunded successfully',
            responseCode: '000',
            data: {}
        })
    } catch (error) {
        console.log(error);
        return next(new ErrorResponse("Something went wrong", 400))
    }
});

exports.listAllBookings = asyncHandler(async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
      let { 
    from, 
    to, 
    searchText, 
    credentialId,
    partnerId,
    sort,             
    sortField, 
} = req.query;
sort = sort ? sort.toUpperCase() : 'DESC';
sortField = sortField || 'transactionDate';

        let service = await findOneServiceOperator({ accessKey: "hotels_api" })
        const serviceProviderId = service.id
        const bookingData = await fetchAllHotelBookings({ limit, page, credentialId, partnerId, from, to, searchText, serviceProviderId,sort,sortField });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }

        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: {
                page: page,
                limit: limit,
                count: bookingData.count,
                bookings: bookingData.rows
            }
        })

    } catch (error) {
        console.log(error);
        return next(new ErrorResponse("Something went wrong", 400))
    }
});

exports.listAllBookingExcelCSV = asyncHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10
    const page = parseInt(req.query.page) || 1

    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField
    let { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        let service = await findOneServiceOperator({ accessKey: "hotels_api" })
        const serviceProviderId = service.id
        const bookingData = await fetchAllHotelBookings({ limit, page, credentialId, partnerId, from, to, searchText, serviceProviderId });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateBookingExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        } else {
            const { buffer, fileType } = await generateExcelBufferAndType(data, type)
            return res.status(200).json({
                'status': true,
                'data': { buffer, fileType },
                'message': 'Fetched excel/csv datas successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});
exports.listAllBookingPDF = asyncHandler(async (req, res, next) => {

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField
    let { from, to, searchText, credentialId,partnerId } = req.query;
    try {
        let service = await findOneServiceOperator({ accessKey: "hotels_api" })
        const serviceProviderId = service.id
        const bookingData = await fetchAllHotelBookings({ credentialId,partnerId, from, to, searchText, serviceProviderId });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateBookingExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        }

        const templateDetails = {
            title: 'Hotel Bookings Report'
        }
        const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
        let random = new Date().valueOf();

        // Create a browser instance with Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        // Set content to the page
        await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

        // Generate PDF using Puppeteer
        const outputFile = `report-${random}.pdf`;
        await page.pdf({
            path: outputFile,
            format: 'A4',
            preferCSSPageSize: true
        });
        const buffer = fs.readFileSync(outputFile);
        browser.close();
        fs.unlinkSync(outputFile);
        return res.status(200).json({
            status: true,
            message: 'report generated successfully.',
            data: {
                buffer,
                fileType: 'application/pdf'
            },
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});