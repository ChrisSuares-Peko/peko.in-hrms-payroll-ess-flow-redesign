const fs = require('fs');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const orders = require('../../models/entities/order');
const credential = require('../../models/entities/credential');
const { fetchAllCancelledBusBookings } = require('../../models/use-cases/bus');
const { generateCancelledBusExportData } = require('../../services/bus');
const { cancelPGTransaction } = require('../../utils/cashFreeGateway');
const { createNotification } = require('../../models/use-cases/notification');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { puppeteerPdfToFile } = require('../../utils/puppeteer');

const accessKey = require('../../utils/operatorsData.json').bus.accessKey;

exports.listAllCancelled = asyncHandler(async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const { from, to, searchText, credentialId, partnerId } = req.query;

        const bookingData = await fetchAllCancelledBusBookings({ limit, page, credentialId, partnerId, from, to, searchText });
        if (!bookingData) return next(new ErrorResponse('No bookings found', 404));

        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: {
                page,
                limit,
                count: bookingData.count,
                bookings: bookingData.rows,
            },
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorResponse('Something went wrong', 400));
    }
});

exports.listAllCancelledExcelCSV = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        const bookingData = await fetchAllCancelledBusBookings({ credentialId, partnerId, from, to, searchText });
        if (!bookingData) return next(new ErrorResponse('No bookings found', 404));

        const data = await generateCancelledBusExportData(bookingData);
        if (!data) return next(new ErrorResponse('Something went wrong while generating report', 500));
        if (data.length < 1) return next(new ErrorResponse('No data is available for export', 409));

        const { buffer, fileType } = await generateExcelBufferAndType(data, type);
        return res.status(200).json({
            status: true,
            data: { buffer, fileType },
            message: 'Fetched excel/csv data successfully',
            responseCode: '000',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Something went wrong while generating report', data: {}, responseCode: '001' });
    }
});

exports.listAllCancelledPDF = asyncHandler(async (req, res, next) => {
    const { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        const bookingData = await fetchAllCancelledBusBookings({ credentialId, partnerId, from, to, searchText });
        if (!bookingData) return next(new ErrorResponse('No bookings found', 404));

        const data = await generateCancelledBusExportData(bookingData);
        if (!data) return next(new ErrorResponse('Something went wrong while generating report', 500));
        if (data.length < 1) return next(new ErrorResponse('No data is available for export', 409));

        const reportHtmlWithStyle = reportPdfTemplate(data, { title: 'Bus Bookings Cancellation Report' });
        const outputFile = `bus-report-${Date.now()}.pdf`;

        const { status, buffer } = await puppeteerPdfToFile({
            html: reportHtmlWithStyle,
            outputFile,
            options: { scale: 0.6, format: 'A4', preferCSSPageSize: true },
        });

        try {
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        } catch (_) { /* ignore cleanup errors */ }

        if (!status || !buffer) return next(new ErrorResponse('Failed to generate PDF', 500));

        return res.status(200).json({
            status: true,
            message: 'Report generated successfully.',
            data: { buffer, fileType: 'application/pdf' },
            responseCode: '000',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Something went wrong while generating report', data: {}, responseCode: '001' });
    }
});

exports.refundCancelledBooking = asyncHandler(async (req, res, next) => {
    try {
        const { corporateTxnId, refundAmount } = req.body;

        const order = await orders.findOne({
            where: { corporateTxnId },
            include: [{ model: credential }],
        });

        if (!order) return next(new ErrorResponse('No order found', 404));
        if (order.status === 'REFUNDED') return next(new ErrorResponse('This booking is already refunded', 400));
        if (order.status !== 'REFUND_REQUESTED') return next(new ErrorResponse('Order is not in refund requested state', 400));

        const { username, id } = order?.credential || {};

        const pgResult = await cancelPGTransaction(corporateTxnId, refundAmount);

        if (pgResult.refundStatus === 'SUCCESS' || pgResult.refundStatus === 'PENDING') {
            await orders.update(
                { status: 'REFUNDED', message: 'Refund initiated via PG.' },
                { where: { corporateTxnId } }
            );

            const notifAmount = refundAmount ?? order.amountInINR;
            createNotification({
                notificationTitle: 'Bus Ticket Cancellation - Refund Initiated',
                notificationBrief: `Refund of ₹ ${formatNumberWithLocalString(notifAmount)} for bus ticket cancellation was initiated. Transaction ID: ${corporateTxnId}.`,
                notificationTo: [username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
                accessKey,
                action: '1',
            }, id);

            return res.status(200).json({
                status: true,
                message: pgResult.refundStatus === 'PENDING' ? 'Refund process initiated' : 'Refunded successfully',
                responseCode: '000',
                data: {},
            });
        }

        return next(new ErrorResponse('Apologies, something went wrong while refunding', 400));
    } catch (error) {
        console.error(error);
        return next(new ErrorResponse('Something went wrong', 400));
    }
});
